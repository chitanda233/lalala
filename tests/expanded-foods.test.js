import test from "node:test";
import assert from "node:assert/strict";
import { foods, foodCategories } from "../src/content/foods.js";
import { expandedFoods } from "../src/content/expanded-foods.js";
import { foodById } from "../src/content/catalog.js";
import { foodArt } from "../src/ui/artwork/foods.js";
import { normalizeSave } from "../src/storage/model.js";
import { recipeProperties } from "../src/game/outcome-pool.js";
import { collectEffects } from "../src/game/effects.js";
import { typeDistribution } from "../src/game/stool-type.js";
import { resolveColor } from "../src/game/color.js";
import { specialProbability, rollOutcome } from "../src/game/drops.js";
import { characterById } from "../src/content/catalog.js";
import { createSession, restoreSession } from "../src/game/session.js";
const meal = {
  foodIds: ["rice"],
  water: 1500,
  drinkId: "water",
  additives: [],
  toiletId: "standard",
};

test("existing banana and twenty-one new foods have unique illustrated playable definitions", () => {
  assert.equal(foods.length, 53);
  assert.equal(expandedFoods.length, 21);
  assert.equal(foods.filter((food) => food.id === "banana").length, 1);
  assert.equal(foodById.banana.unlockAt, 0);
  assert.equal(new Set(expandedFoods.map((food) => food.id)).size, 21);
  assert.equal(new Set(expandedFoods.map((food) => foodArt(food.id))).size, 21);
  assert.equal(normalizeSave().foods.unlocked.length, 35);
  for (const food of expandedFoods) {
    assert.equal(food.unlockAt, 0);
    assert.ok(
      food.description &&
        food.effectLabel &&
        foodCategories.some((category) => category.id === food.category),
    );
    assert.ok(food.tags.length && new Set(food.tags).size === food.tags.length);
    assert.ok(foodArt(food.id).includes("<svg"));
    const selection = { ...meal, foodIds: [food.id] };
    assert.ok(
      typeDistribution(selection).every(
        (form) => form.type >= 1 && form.type <= 7 && form.probability > 0,
      ),
    );
    const session = createSession(selection, { now: 1000, random: () => 0.5 });
    assert.deepEqual(restoreSession(session), session);
  }
});

test("clay has a fantasy label, hardens the free-form profile and tints the result", () => {
  assert.equal(foodById["guanyin-clay"].fictional, true);
  const input = { ...meal, foodIds: ["guanyin-clay"] };
  assert.ok(recipeProperties(input).hardness > recipeProperties(meal).hardness);
  assert.equal(resolveColor(input, characterById.classic), "clay");
  const combo = { ...input, foodIds: ["guanyin-clay", "banana", "rose-cake"] };
  const reversed = { ...combo, foodIds: [...combo.foodIds].reverse() };
  assert.deepEqual(collectEffects(combo), collectEffects(reversed));
  assert.deepEqual(rollOutcome(combo, () => 0.5), rollOutcome(reversed, () => 0.5));
});

test("new food pigments and rare rolls remain independent", () => {
  assert.equal(resolveColor({ ...meal, foodIds: ["squid-ink-pasta"] }, characterById.classic), "ink");
  for (const food of expandedFoods) {
    const input = { ...meal, foodIds: [food.id] };
    assert.ok(Math.abs(specialProbability(input) - 0.02) < 1e-12);
    assert.ok(Math.abs(specialProbability({ ...input, additives: ["gold-leaf"] }) - 0.05) < 1e-12);
    assert.equal(rollOutcome(input, () => 0.5).special, false);
  }
});

test("food availability, current sessions and explicit unlocks are normalized", () => {
  const session = createSession(meal, { now: 1000, random: () => 0.5 });
  const save = normalizeSave({
    version: 4,
    total: 0,
    session,
    foods: { unlocked: ["rice", "hotpot"], tasted: ["rice"] },
  });
  assert.ok(save.foods.unlocked.includes("hotpot"));
  for (const food of expandedFoods)
    assert.ok(save.foods.unlocked.includes(food.id));
  assert.deepEqual(save.individuals, []);
  assert.deepEqual(save.session.outcome, session.outcome);
});
