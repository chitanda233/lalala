import test from "node:test";
import assert from "node:assert/strict";
import { foods } from "../src/content/foods.js";
import { normalizeSelection } from "../src/game/selection.js";
import { collectEffects } from "../src/game/effects.js";
import {
  resolveBristolType,
  typeDistribution,
} from "../src/game/stool-type.js";
import { rollOutcome, specialProbability } from "../src/game/drops.js";
import { outcomeDraws } from "./outcome-helpers.js";
import { classifySpecimen } from "../src/game/specimen.js";
import { normalizeSave } from "../src/storage/model.js";
import { normalizeFoods, canEatFoods } from "../src/progression/foods.js";
import {
  createSession,
  restoreSession,
  settleSession,
} from "../src/game/session.js";

const meal = {
  foodIds: ["rice"],
  water: 1500,
  additives: [],
  drinkId: "water",
  toiletId: "standard",
};

test("the food catalog has 51 distinct entries, 33 starters and complete game traits", () => {
  assert.equal(foods.length, 51);
  assert.equal(new Set(foods.map((food) => food.id)).size, 51);
  assert.equal(normalizeFoods().unlocked.length, 33);
  for (const food of foods) {
    assert.ok(food.description && food.art && Number.isInteger(food.unlockAt));
    for (const level of Object.values(food.traits))
      assert.ok(level >= 0 && level <= 3);
  }
});

test("meal normalization caps three distinct foods and requires explicit food and drink fields", () => {
  assert.deepEqual(
    normalizeSelection({
      foodIds: ["rice", "rice", "egg", "apple", "banana", "unknown"],
    }).foodIds,
    ["rice", "egg", "apple"],
  );
  assert.deepEqual(normalizeSelection({ foodIds: ["broccoli"] }).foodIds, [
    "broccoli",
  ]);
  assert.equal(normalizeSelection({ additives: ["coffee"] }).drinkId, "water");
  assert.deepEqual(normalizeSelection({ foodIds: [] }).foodIds, ["rice"]);
  const inventory = normalizeFoods();
  assert.equal(canEatFoods(inventory, ["rice", "apple", "egg"]), true);
  for (const ids of [
    [],
    ["hotpot"],
    ["rice", "rice"],
    ["rice", "apple", "egg", "banana"],
  ])
    assert.equal(canEatFoods(inventory, ids), false);
});

test("mixed-food effects are independent of slot order and similar bonuses are capped", () => {
  const first = {
    ...meal,
    foodIds: ["oatmeal", "apple", "broccoli"],
    water: 1000,
  };
  const reversed = { ...first, foodIds: [...first.foodIds].reverse() };
  assert.deepEqual(collectEffects(first).food, collectEffects(reversed).food);
  assert.deepEqual(typeDistribution(first), typeDistribution(reversed));
  assert.deepEqual(
    rollOutcome(first, () => 0.5),
    rollOutcome(reversed, () => 0.5),
  );
  assert.equal(collectEffects(first).food.fiber, 6);
  assert.ok(
    resolveBristolType(first) > resolveBristolType({ ...meal, water: 1000 }),
  );
  assert.equal(resolveBristolType({ ...first, water: 500 }), 1);
  const hot = { ...meal, foodIds: ["hotpot", "spicy-wings", "snail-noodles"] };
  assert.equal(resolveBristolType(hot), 6);
  assert.ok(
    typeDistribution(hot).find((entry) => entry.type === 7).probability < 0.2,
  );
});

test("the rare preview accounts for actual form probabilities and excludes ineligible forms", () => {
  const input = { ...meal, water: 1250 };
  const eligibleProbability = typeDistribution(input)
    .filter((form) => form.type === 4)
    .reduce((sum, form) => sum + form.probability, 0);
  assert.ok(
    Math.abs(specialProbability(input) - (eligibleProbability * 0.1) / 100.1) <
      1e-12,
  );
  let draws = outcomeDraws(
    input,
    (entry) => classifySpecimen(entry) === 2 && !entry.special,
  );
  const hard = rollOutcome(input, () => draws.shift());
  assert.equal(hard.type, 2);
  assert.equal(hard.special, false);
  draws = outcomeDraws(
    input,
    (entry) => classifySpecimen(entry) === 4 && entry.characterId === "gold",
  );
  const formed = rollOutcome(input, () => draws.shift());
  assert.equal(formed.type, 4);
  assert.equal(formed.characterId, "gold");
  assert.ok(
    specialProbability({
      ...meal,
      foodIds: ["oatmeal", "broccoli", "yogurt"],
      toiletId: "golden",
    }) <= 0.005,
  );
});

test("the current save model restores full sessions and validates food unlocks", () => {
  const session = createSession(
    { ...meal, foodIds: ["apple"] },
    { now: 1000, random: () => 0.5 },
  );
  const save = normalizeSave({ settings: { foodIds: ["apple"] }, session });
  assert.deepEqual(save.session, session);
  assert.deepEqual(save.settings.foodIds, ["apple"]);
  assert.deepEqual(save.individuals, []);
  assert.deepEqual(
    normalizeSave({ settings: { foodIds: ["hotpot"] } }).settings.foodIds,
    ["rice"],
  );
  const broken = structuredClone(session);
  delete broken.outcome;
  assert.equal(normalizeSave({ session: broken }).session, null);
});

test("completed meals unlock foods once and record every selected food", () => {
  const save = normalizeSave({ total: 2 });
  save.session = createSession(
    { ...meal, foodIds: ["rice", "egg", "apple"] },
    { now: 1000, random: () => 0.5 },
  );
  const pending = structuredClone(save.session);
  const result = settleSession(save, 3000);
  assert.deepEqual(result.unlockedFoods.sort(), [
    "snail-noodles",
    "wholewheat",
  ]);
  assert.deepEqual(save.foods.tasted, ["rice", "egg", "apple"]);
  assert.equal(save.foods.unlocked.length, 35);
  assert.equal(settleSession(save, 4000), null);
  assert.deepEqual(restoreSession(pending), pending);
});
