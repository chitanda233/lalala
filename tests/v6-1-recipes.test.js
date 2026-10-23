import test from "node:test";
import assert from "node:assert/strict";
import { characterById, foodById, drinkById, additiveById } from "../src/content/catalog.js";
import { stoolRecipes, stoolRecipeByCharacterId } from "../src/content/stool-recipes.js";
import { rareThemeRecipes } from "../src/content/rare-theme-recipes.js";
import { physicalState } from "../src/game/physical-state.js";
import { getOutcomePool } from "../src/game/outcome-pool.js";
import { mealSources, sourceAllowed } from "../src/game/source-conditions.js";

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const inputFor = recipe => ({ ...recipe, additives: recipe.requiredAdditive ? [recipe.requiredAdditive] : [] });
const rares = input => getOutcomePool(input).filter(entry => entry.special);

test("the 46 ordinary recommendations are editable examples with valid ingredients and reachable targets", () => {
  assert.equal(stoolRecipes.length, 46);
  assert.equal(new Set(stoolRecipes.map(recipe => recipe.characterId)).size, 46);
  for (const recipe of stoolRecipes) {
    assert.deepEqual(Object.keys(recipe).sort(), ["characterId", "drinkId", "foodIds", "forceZone", "requiredAdditive", "water"]);
    assert.ok(recipe.foodIds.length >= 1 && recipe.foodIds.length <= 3);
    assert.ok(recipe.foodIds.every(id => Object.hasOwn(foodById, id)));
    assert.equal(new Set(recipe.foodIds).size, recipe.foodIds.length);
    assert.ok(Object.hasOwn(drinkById, recipe.drinkId));
    assert.ok(Number.isInteger(recipe.water) && recipe.water >= 0 && recipe.water <= 1250 && recipe.water % 250 === 0);
    assert.ok(recipe.requiredAdditive === null || Object.hasOwn(additiveById, recipe.requiredAdditive));
    const input = inputFor(recipe), character = characterById[recipe.characterId];
    assert.equal(recipe.forceZone, character.generation.forceZone, recipe.characterId);
    assert.equal(physicalState(input).type, character.homeType, recipe.characterId);
    assert.ok(sourceAllowed(character, mealSources(input)), recipe.characterId);
    assert.ok(getOutcomePool(input).some(entry => entry.characterId === recipe.characterId && entry.probability > 0), recipe.characterId);
  }
  const jet = stoolRecipeByCharacterId["enoki-jet"];
  assert.deepEqual(jet.foodIds, ["burger", "enoki"]);
  assert.equal(jet.drinkId, "milk");
  assert.equal(characterById[jet.characterId].homeType, 7);
});

test("the ten rare theme examples retain a force preference, omit time, and never gate rare eligibility", () => {
  assert.equal(rareThemeRecipes.length, 10);
  assert.equal(new Set(rareThemeRecipes.map(recipe => recipe.characterId)).size, 10);
  const plainMeal = { foodIds: ["rice"], drinkId: "water", water: 0, additives: [] };
  const baseline = rares(plainMeal);
  assert.deepEqual(new Set(baseline.map(entry => entry.characterId)), new Set(rareThemeRecipes.map(recipe => recipe.characterId)));
  close(baseline.reduce((sum, entry) => sum + entry.probability, 0), .02);
  for (const recipe of rareThemeRecipes) {
    assert.deepEqual(Object.keys(recipe).sort(), ["additiveId", "characterId", "drinkId", "foodIds", "forceZone", "water"]);
    assert.ok(["low", "medium", "high"].includes(recipe.forceZone));
    const additives = [recipe.additiveId];
    assert.equal(characterById[recipe.characterId].rarity, "special");
    assert.deepEqual(rares({ ...recipe, additives }), rares({ ...plainMeal, additives }), recipe.characterId);
  }
});

test("the widened water slider and milk use transparent additive effects without any timing combo", () => {
  assert.equal(drinkById.milk.wetnessBias, .5);
  for (const [water, bonus] of [[0, -2], [750, -.5], [1250, .5]])
    assert.equal(physicalState({ foodIds: ["rice"], water }).waterBonus, bonus);
  const meal = { foodIds: ["burger", "enoki"], drinkId: "milk", water: 250, additives: [] };
  for (const patch of [{}, { water: 0 }, { water: 1250 }, { drinkId: "water" }, { foodIds: ["rice", "enoki"] }]) {
    const input = { ...meal, ...patch }, plain = physicalState(input);
    const spicy = physicalState({ ...input, additives: ["chili"] });
    close(spicy.score - plain.score, .5);
    assert.equal(spicy.additiveBonus, .5);
    assert.equal(Object.hasOwn(spicy, "rapidIrritant"), false);
    for (const digestionTime of ["2", "4", "8", "random"])
      assert.deepEqual(physicalState({ ...input, additives: ["chili"], digestionTime }), spicy);
  }
});
