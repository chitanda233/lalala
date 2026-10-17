import test from "node:test";
import assert from "node:assert/strict";
import { foods, foodCategories } from "../src/content/foods.js";
import { expandedFoods } from "../src/content/expanded-foods.js";
import { foodById } from "../src/content/catalog.js";
import { foodArt } from "../src/ui/artwork/foods.js";
import { normalizeSave } from "../src/storage/model.js";
import { collectEffects } from "../src/game/effects.js";
import {
  resolveBristolType,
  typeDistribution,
} from "../src/game/stool-type.js";
import { resolveColor } from "../src/game/color.js";
import {
  getDropPool,
  specialProbability,
  rollOutcome,
} from "../src/game/drops.js";
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
  assert.equal(foods.length, 51);
  assert.equal(expandedFoods.length, 21);
  assert.equal(foods.filter((food) => food.id === "banana").length, 1);
  assert.equal(foodById.banana.unlockAt, 0);
  assert.equal(new Set(expandedFoods.map((food) => food.id)).size, 21);
  assert.equal(new Set(expandedFoods.map((food) => foodArt(food.id))).size, 21);
  assert.equal(normalizeSave().foods.unlocked.length, 33);
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

test("clay has a fantasy label, hardens the game profile, tints clay and weights cracks", () => {
  assert.equal(foodById["guanyin-clay"].fictional, true);
  const input = { ...meal, foodIds: ["guanyin-clay"] };
  assert.ok(resolveBristolType(input) < resolveBristolType(meal));
  assert.equal(resolveColor(input, characterById.classic), "clay");
  const ordinary = getDropPool({ ...meal, foodIds: ["toast"] }, 3).find(
    (entry) => entry.characterId === "cracked",
  ).probability;
  assert.ok(
    getDropPool({ ...input, foodIds: ["toast", "guanyin-clay"] }, 3).find(
      (entry) => entry.characterId === "cracked",
    ).probability > ordinary,
  );
  const combo = { ...input, foodIds: ["guanyin-clay", "banana", "rose-cake"] };
  const reversed = { ...combo, foodIds: [...combo.foodIds].reverse() };
  assert.deepEqual(collectEffects(combo), collectEffects(reversed));
  assert.deepEqual(
    rollOutcome(combo, () => 0.5),
    rollOutcome(reversed, () => 0.5),
  );
});

test("new food traits expose color, texture and rare candidates without bypassing rarity", () => {
  for (const [id, character] of [
    ["rainbow-crayon", "rainbow"],
    ["marshmallow-foam", "jelly"],
    ["konjac", "jelly"],
    ["meteor-cookie", "meteor"],
  ]) {
    const selection = {
      ...meal,
      foodIds: [id],
      water: character === "meteor" ? 1000 : 1500,
    };
    const eligible = typeDistribution(selection).some((form) =>
      getDropPool(selection, form.type).some(
        (entry) => entry.characterId === character && entry.special,
      ),
    );
    assert.ok(eligible, `${id} enables ${character}`);
  }
  assert.equal(
    resolveColor(
      { ...meal, foodIds: ["squid-ink-pasta"] },
      characterById.classic,
    ),
    "ink",
  );
  assert.ok(
    getDropPool({ ...meal, foodIds: ["rose-cake"] }, 4).some(
      (entry) => entry.characterId === "petal",
    ),
  );
  assert.ok(
    getDropPool({ ...meal, foodIds: ["popping-chocolate"] }, 6).some(
      (entry) => entry.characterId === "popping",
    ),
  );
  for (const food of expandedFoods)
    for (const water of [500, 1000, 1500, 2500]) {
      const input = {
        ...meal,
        foodIds: [food.id, "rainbow-crayon", "marshmallow-foam"],
        water,
        additives: ["gold-leaf", "crystal-seed", "gelatin"],
        toiletId: "golden",
      };
      assert.ok(specialProbability(input) <= 0.005 + 1e-12);
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
