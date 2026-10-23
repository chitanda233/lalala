import test from "node:test";
import assert from "node:assert/strict";
import { characters } from "../src/content/specimens.js";
import { stoolRecipes } from "../src/content/stool-recipes.js";
import { foodById, additiveById, characterById } from "../src/content/catalog.js";
import { normalizeSelection } from "../src/game/selection.js";
import { getOutcomePool, getRecipeForecast, conditionalDropPool } from "../src/game/outcome-pool.js";
import { mealSources, sourceAllowed } from "../src/game/source-conditions.js";
import { physicalState } from "../src/game/physical-state.js";
import { rollOutcome } from "../src/game/drops.js";

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);
const total = entries => entries.reduce((sum, entry) => sum + entry.probability, 0);
const ordinary = pool => pool.filter(entry => !entry.special);
const meal = { foodIds: ["rice"], drinkId: "water", water: 1000, additives: [] };
const inputFor = recipe => ({ ...recipe, force: { low: 20, medium: 50, high: 90 }[recipe.forceZone], additives: recipe.requiredAdditive ? [recipe.requiredAdditive] : [] });

test("recommendations are examples: every target is legal and every legal candidate retains a positive chance", () => {
  for (const recipe of stoolRecipes) {
    const input = normalizeSelection(inputFor(recipe)), pool = getOutcomePool(input);
    const legal = characters.filter(c => c.rarity !== "special" && c.homeType === physicalState(input).type && sourceAllowed(c, mealSources(input)));
    assert.deepEqual(new Set(ordinary(pool).map(e => e.characterId)), new Set(legal.map(c => c.id)));
    close(total(pool), 1);
    assert.ok(pool.every(e => Number.isFinite(e.probability) && e.probability > 0));
    const forecast = getRecipeForecast(input, recipe.characterId);
    close(forecast.targetProbability, pool.find(e => e.characterId === recipe.characterId).probability);
    close(forecast.primaryProbability, pool.find(e => e.characterId === forecast.primaryCharacterId).probability);
    assert.equal(Object.hasOwn(forecast, "phaseForecasts"), false);
    assert.equal(Object.hasOwn(forecast, "matchedRecipe"), false);
  }
});

test("real ingredient themes receive a clear tendency while ordinary shapes retain variation", () => {
  const input = { ...meal, foodIds: ["rice", "enoki"] };
  const pool = ordinary(getOutcomePool(input)), theme = pool.filter(e => e.characterId === "enoki-thread");
  close(total(theme) / total(pool), .7);
  close(total(pool.filter(e => e.characterId !== "enoki-thread")) / total(pool), .3);
  const plain = ordinary(getOutcomePool(meal));
  assert.ok(plain.length >= 3);
  assert.ok(Math.max(...plain.map(e => e.probability)) / total(plain) < .7);
  // Even an unconventional combination has only meaningful, source-valid outputs.
  const strange = normalizeSelection({ foodIds: ["natto", "rainbow-crayon", "egg"], water: 1000 });
  assert.ok(ordinary(getOutcomePool(strange)).length > 1);
  for (const entry of ordinary(getOutcomePool(strange)))
    assert.ok(sourceAllowed(characterById[entry.characterId], mealSources(strange)));
});

test("substituting a food of identical family and traits has no hidden ingredient-ID penalty", () => {
  const apple = foodById.apple, saved = { attributes: apple.attributes, category: apple.category, tags: apple.tags };
  try {
    apple.attributes = { ...foodById.rice.attributes };
    apple.category = foodById.rice.category;
    apple.tags = [...foodById.rice.tags];
    assert.deepEqual(getOutcomePool(meal), getOutcomePool({ ...meal, foodIds: ["apple"] }));
  } finally { Object.assign(apple, saved); }
});

test("food order, duplicates, retired time and toilets do not change probability", () => {
  for (const recipe of stoolRecipes) {
    const input = inputFor(recipe), pool = getOutcomePool(input);
    assert.deepEqual(getOutcomePool({ ...input, foodIds: [...input.foodIds].reverse() }), pool);
    assert.deepEqual(getOutcomePool({ ...input, foodIds: [...input.foodIds, input.foodIds[0]] }), pool);
    for (const patch of [{ digestionTime: "random" }, { digestionTime: "8" }, { toiletId: "golden" }])
      assert.deepEqual(getOutcomePool({ ...input, ...patch }), pool);
  }
});

test("probiotic stabilizes the actual main result for off-recipe meals and never invents missing sources", () => {
  for (const foodIds of [["banana"], ["rice", "egg"], ["hotpot", "kiwi", "apple"]]) {
    const input = { ...meal, foodIds, drinkId: "milk" };
    const main = getRecipeForecast(input).primaryCharacterId;
    const stable = getOutcomePool({ ...input, additives: ["probiotic"] });
    assert.deepEqual(ordinary(stable).map(e => e.characterId), [main]);
    close(ordinary(stable)[0].probability, .98);
  }
  const stable = getRecipeForecast({ ...meal, additives: ["probiotic"] }, "enoki-thread");
  assert.equal(stable.targetProbability, 0);
  assert.deepEqual(normalizeSelection({ additives: ["probiotic", "gold-leaf"] }).additives, ["probiotic"]);
});

test("rare budgets remain independent of recommendations and share one final normalized pool", () => {
  const baseRares = getOutcomePool(meal).filter(e => e.special);
  close(total(baseRares), .02);
  for (const entry of baseRares) close(entry.probability, .02 / baseRares.length);
  for (const additive of Object.values(additiveById).filter(a => a.rareTargets.length)) {
    const pool = getOutcomePool({ ...meal, additives: [additive.id] });
    const rares = pool.filter(e => e.special);
    assert.deepEqual(new Set(rares.map(e => e.characterId)), new Set(additive.rareTargets));
    close(total(rares), .2); close(total(ordinary(pool)), .8); close(total(pool), 1);
    for (const entry of rares) close(entry.probability, .2 / rares.length);
  }
  assert.equal(rollOutcome(meal, () => .019999).special, true);
  assert.equal(rollOutcome(meal, () => .020001).special, false);
  for (const value of [-1, 1, NaN, Infinity]) assert.throws(() => rollOutcome(meal, () => value), RangeError);
});

test("conditional inspection and specified target forecasts project the exact final pool", () => {
  const input = { ...meal, foodIds: ["burger", "enoki"], drinkId: "milk", water: 1250 };
  const pool = getOutcomePool(input);
  for (const entry of pool) close(getRecipeForecast(input, entry.characterId).targetProbability, entry.probability);
  for (let type = 1; type <= 7; type++) {
    const expected = pool.filter(e => characterById[e.characterId].homeType === type), conditional = conditionalDropPool(input, type);
    assert.deepEqual(conditional.map(e => e.characterId), expected.map(e => e.characterId));
    conditional.forEach((entry, index) => close(entry.probability, expected[index].probability / total(expected)));
  }
});
