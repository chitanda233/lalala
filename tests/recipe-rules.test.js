import test from "node:test";
import assert from "node:assert/strict";
import { characters } from "../src/content/specimens.js";
import { stoolRecipes, stoolRecipeByCharacterId } from "../src/content/stool-recipes.js";
import { foodById, drinkById, additiveById } from "../src/content/catalog.js";
import { normalizeSelection } from "../src/game/selection.js";
import { conditionalDropPool, getOutcomePool, getRecipeForecast } from "../src/game/outcome-pool.js";
import { getDropPool, rollOutcome, specialProbability } from "../src/game/drops.js";
import { createAimingSession, lockSessionForce, restoreSession, settleSession } from "../src/game/session.js";
import { normalizeSave } from "../src/storage/model.js";
import { typeDistribution } from "../src/game/stool-type.js";

const close = (actual, expected, message) =>
  assert.ok(Math.abs(actual - expected) < 1e-12, `${message || "probability"}: ${actual} != ${expected}`);
const sum = (pool) => pool.reduce((total, entry) => total + entry.probability, 0);
const rarityPool = (pool) => pool.filter((entry) => entry.special);
const rareCharacters = characters.filter((item) => item.rarity === "special");
const forceFor = { low: 20, medium: 50, high: 90 };
const inputFor = (recipe, additives = []) => ({
  foodIds: [...recipe.foodIds], drinkId: recipe.drinkId,
  force: forceFor[recipe.forceZone], additives,
  water: 1500, digestionTime: "4", toiletId: "standard",
});
const base = inputFor(stoolRecipeByCharacterId.classic);

function validPool(pool) {
  assert.ok(pool.length > 0);
  close(sum(pool), 1);
  assert.equal(new Set(pool.map((entry) => entry.specimenId)).size, pool.length);
  for (const entry of pool) {
    assert.ok(Number.isFinite(entry.probability) && entry.probability > 0);
    const character = characters.find((item) => item.id === entry.characterId);
    assert.ok(character);
    assert.equal(entry.specimenId, `${character.id}:${character.homeType}`);
    assert.equal(entry.special, character.rarity === "special");
    assert.equal(Object.hasOwn(entry, "materialId"), false);
  }
}

test("46 ordinary species have unique food/drink/force recipes and all 56 species expose five attributes", () => {
  const ordinary = characters.filter((item) => item.rarity !== "special");
  assert.equal(ordinary.length, 46);
  assert.equal(rareCharacters.length, 10);
  assert.equal(stoolRecipes.length, ordinary.length);
  assert.deepEqual(new Set(stoolRecipes.map((item) => item.characterId)), new Set(ordinary.map((item) => item.id)));
  const combinations = new Set();
  for (const recipe of stoolRecipes) {
    assert.deepEqual(Object.keys(recipe).sort(), ["characterId", "drinkId", "foodIds", "forceZone"]);
    assert.equal(stoolRecipeByCharacterId[recipe.characterId], recipe);
    assert.ok(recipe.foodIds.length >= 1 && recipe.foodIds.length <= 3);
    assert.equal(new Set(recipe.foodIds).size, recipe.foodIds.length);
    assert.ok(recipe.foodIds.every((id) => Object.hasOwn(foodById, id)));
    assert.ok(Object.hasOwn(drinkById, recipe.drinkId));
    assert.ok(Object.hasOwn(forceFor, recipe.forceZone));
    const key = JSON.stringify([[...recipe.foodIds].sort(), recipe.drinkId, recipe.forceZone]);
    assert.ok(!combinations.has(key), recipe.characterId);
    combinations.add(key);
  }
  for (const character of characters) {
    assert.deepEqual(Object.keys(character.properties).sort(), ["cohesion", "elongation", "grain", "hardness", "porosity"]);
    for (const value of Object.values(character.properties))
      assert.ok(Number.isFinite(value) && value >= 1 && value <= 7, character.id);
  }
});

test("every exact recipe gets 80% of the nonrare branch, or 100% with probiotic", () => {
  for (const recipe of stoolRecipes) {
    for (const [additives, conditional, total] of [[[], 0.8, 0.784], [["glitter"], 0.8, 0.784], [["probiotic"], 1, 0.98]]) {
      const input = inputFor(recipe, additives);
      const forecast = getRecipeForecast(input);
      assert.equal(forecast.matchedRecipe.characterId, recipe.characterId);
      close(forecast.rareProbability, 0.02);
      close(forecast.recipeConditionalProbability, conditional);
      close(forecast.recipeProbability, total);
      const pool = getOutcomePool(input);
      validPool(pool);
      close(sum(rarityPool(pool)), 0.02);
      const targets = pool.filter((entry) => entry.characterId === recipe.characterId);
      assert.equal(targets.length, 1, "fallback must exclude the fixed target");
      close(targets[0].probability, total, recipe.characterId);
      assert.equal(pool[rareCharacters.length].characterId, recipe.characterId);
      assert.ok(pool.slice(0, rareCharacters.length).every((entry) => entry.special));
      if (conditional === 1) assert.equal(pool.length, rareCharacters.length + 1);
      else close(sum(pool.slice(rareCharacters.length + 1)), 0.196);
    }
  }
});

test("food sets ignore order and duplicates while force endpoints use the three exact zones", () => {
  const endpoints = { low: [0, 33], medium: [34, 66], high: [67, 100] };
  for (const recipe of stoolRecipes) {
    const input = inputFor(recipe);
    const reversed = { ...input, foodIds: [...input.foodIds].reverse() };
    assert.deepEqual(getOutcomePool(input), getOutcomePool(reversed));
    assert.deepEqual(getRecipeForecast(input), getRecipeForecast(reversed));
    const duplicated = { ...input, foodIds: [...input.foodIds, input.foodIds[0]] };
    assert.deepEqual(getOutcomePool(input), getOutcomePool(duplicated));
    for (const force of endpoints[recipe.forceZone])
      assert.equal(getRecipeForecast({ ...input, force }).matchedRecipe.characterId, recipe.characterId);
    for (const force of Object.values(endpoints).flat().filter((value) => !endpoints[recipe.forceZone].includes(value)))
      assert.notEqual(getRecipeForecast({ ...input, force }).matchedRecipe?.characterId, recipe.characterId);
  }
});

test("each round can reach all ten rare species before ordinary recipes, including probiotic rounds", () => {
  for (const input of [base, { ...base, additives: ["probiotic"] }, { foodIds: ["hotpot"], drinkId: "coffee", force: 100, water: 250 }]) {
    const pool = getOutcomePool(input);
    assert.deepEqual(new Set(rarityPool(pool).map((entry) => entry.characterId)), new Set(rareCharacters.map((item) => item.id)));
    for (const entry of rarityPool(pool)) close(entry.probability, 0.002, entry.characterId);
    close(specialProbability(input), 0.02);
    assert.equal(rollOutcome(input, () => 0).special, true);
    assert.equal(rollOutcome(input, () => 0.019999).special, true);
    assert.equal(rollOutcome(input, () => 0.020001).special, false);
  }
  assert.equal(rollOutcome(base, () => 0.803999).characterId, "classic");
  assert.notEqual(rollOutcome(base, () => 0.804001).characterId, "classic");
  assert.equal(rollOutcome({ ...base, additives: ["probiotic"] }, () => 0.999999).characterId, "classic");
});

test("one rare booster adds three percentage points to its targets and retains 80% ordinary matching", () => {
  for (const additive of Object.values(additiveById).filter((item) => item.rareTargets.length)) {
    const input = { ...base, additives: [additive.id] };
    const pool = getOutcomePool(input);
    validPool(pool);
    close(sum(rarityPool(pool)), 0.05, additive.id);
    const targets = new Set(additive.rareTargets);
    close(sum(rarityPool(pool).filter((entry) => targets.has(entry.characterId))), targets.size * 0.002 + 0.03, additive.id);
    for (const entry of rarityPool(pool).filter((item) => !targets.has(item.characterId))) close(entry.probability, 0.002);
    close(pool.find((entry) => entry.characterId === "classic").probability, 0.76);
    const forecast = getRecipeForecast(input);
    close(forecast.rareProbability, 0.05);
    close(forecast.recipeConditionalProbability, 0.8);
    close(forecast.recipeProbability, 0.76);
  }
});

test("additives are optional and strictly single select, so probiotic and a booster never combine", () => {
  assert.deepEqual(normalizeSelection({ additives: [] }).additives, []);
  for (const [input, expected] of [
    [["probiotic", "gold-leaf"], ["probiotic"]],
    [["gold-leaf", "probiotic"], ["gold-leaf"]],
    [["unknown", "glitter", "probiotic"], ["glitter"]],
    [["probiotic", "probiotic"], ["probiotic"]],
  ]) {
    assert.deepEqual(normalizeSelection({ additives: input }).additives, expected);
    assert.deepEqual(getOutcomePool({ ...base, additives: input }), getOutcomePool({ ...base, additives: expected }));
  }
});

test("water, digestion and toilets cannot alter an exact recipe or its rare and target probabilities", () => {
  const expected = getRecipeForecast(base);
  for (const change of [{ water: 250 }, { water: 2500 }, { digestionTime: "2" }, { digestionTime: "8" }, { digestionTime: "random" }, { toiletId: "golden" }, { toiletId: "squat" }]) {
    const forecast = getRecipeForecast({ ...base, ...change });
    assert.equal(forecast.matchedRecipe.characterId, expected.matchedRecipe.characterId);
    close(forecast.rareProbability, expected.rareProbability);
    close(forecast.recipeConditionalProbability, expected.recipeConditionalProbability);
    close(forecast.recipeProbability, expected.recipeProbability);
    close(getOutcomePool({ ...base, ...change }).find((entry) => entry.characterId === "classic").probability, expected.recipeProbability);
  }
});

test("an otherwise complete meal suggests its required force without granting an exact match", () => {
  const recipe = stoolRecipeByCharacterId["enoki-thread"];
  const forecast = getRecipeForecast({ ...inputFor(recipe), force: 0 });
  assert.equal(forecast.matchedRecipe, null);
  assert.equal(forecast.suggestedRecipe.characterId, "enoki-thread");
  close(forecast.recipeConditionalProbability, 0);
  close(forecast.recipeProbability, 0);
});

test("forecasts, type forecasts and conditional inspection project the exact same final pool", () => {
  for (const input of [base, { ...base, additives: ["probiotic"] }, { ...base, additives: ["crystal-seed"] }, { ...base, foodIds: ["banana"], drinkId: "milk" }]) {
    const pool = getOutcomePool(input), forecast = getRecipeForecast(input);
    validPool(pool);
    close(forecast.rareProbability, sum(rarityPool(pool)));
    if (forecast.matchedRecipe)
      close(forecast.recipeProbability, pool.find((entry) => entry.characterId === forecast.matchedRecipe.characterId).probability);
    else {
      close(forecast.recipeProbability, 0);
    }
    for (const value of Object.values(forecast.properties)) assert.ok(Number.isFinite(value) && value >= 1 && value <= 7);
    for (let type = 1; type <= 7; type++) {
      const selected = pool.filter((entry) => characters.find((item) => item.id === entry.characterId).homeType === type);
      const probability = sum(selected);
      const expected = selected.map((entry) => ({ ...entry, probability: entry.probability / probability }));
      const conditional = conditionalDropPool(input, type);
      assert.deepEqual(conditional.map((entry) => entry.characterId), expected.map((entry) => entry.characterId));
      conditional.forEach((entry, index) => close(entry.probability, expected[index].probability));
      assert.deepEqual(getDropPool(input, type), conditional);
      close(typeDistribution(input).find((entry) => entry.type === type)?.probability || 0, probability);
    }
  }
});

test("unmatched meals have legal probabilities and never inherit an exact recipe guarantee", () => {
  for (const foodIds of [["banana"], ["rice", "egg"], ["hotpot", "kiwi", "apple"]]) {
    const input = { ...base, foodIds, drinkId: "milk", additives: ["probiotic"] };
    assert.equal(getRecipeForecast(input).matchedRecipe, null);
    close(getRecipeForecast(input).recipeProbability, 0);
    const pool = getOutcomePool(input);
    validPool(pool);
    close(sum(rarityPool(pool)), 0.02);
    assert.ok(pool.filter((entry) => !entry.special).length > 1);
  }
  for (const value of [-1, 1, NaN, Infinity]) assert.throws(() => rollOutcome(base, () => value), RangeError);
});

test("locking, reload and settlement preserve one outcome without rerolling or ordinary rare coatings", () => {
  for (const [draw, special] of [[0, true], [0.5, false]]) {
    let draws = 0;
    const session = createAimingSession({ ...base, additives: ["gold-leaf"] }, { now: 1000 });
    lockSessionForce(session, { now: 1750, random: () => { draws++; return draw; } });
    assert.equal(draws, 2);
    assert.equal(session.outcome.special, special);
    assert.equal(Object.hasOwn(session.outcome.appearance, "materialId"), false);
    assert.equal(session.outcome.special, characters.find((item) => item.id === session.outcome.characterId).rarity === "special");
    const snapshot = structuredClone(session);
    assert.deepEqual(restoreSession(JSON.parse(JSON.stringify(session))), snapshot);
    assert.equal(lockSessionForce(session, { now: 2000, random: () => { throw new Error("rerolled"); } }), false);
    assert.deepEqual(session, snapshot);
    const save = normalizeSave({ session });
    assert.equal(settleSession(save, session.endsAt - 1), null);
    const result = settleSession(save, session.endsAt);
    assert.deepEqual(result.session.outcome, snapshot.outcome);
    assert.deepEqual(save.individuals[0].appearance, snapshot.outcome.appearance);
    assert.equal(settleSession(save, session.endsAt + 1), null);
    assert.equal(save.total, 1);
  }
});
