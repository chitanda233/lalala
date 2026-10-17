import test from "node:test";
import assert from "node:assert/strict";
import { foods } from "../src/content/foods.js";
import { characterById } from "../src/content/catalog.js";
import { collectEffects } from "../src/game/effects.js";
import {
  typeDistribution,
  resolveBristolType,
} from "../src/game/stool-type.js";
import {
  rollOutcome,
  getDropPool,
  getOutcomePool,
  specialProbability,
} from "../src/game/drops.js";
import {
  createSession,
  restoreSession,
  settleSession,
} from "../src/game/session.js";
import { normalizeSave } from "../src/storage/model.js";
import { characterSvg } from "../src/ui/artwork/stools.js";

import { outcomeDraws } from "./outcome-helpers.js";
import { classifySpecimen } from "../src/game/specimen.js";

const meal = {
  foodIds: ["rice"],
  water: 1500,
  drinkId: "water",
  additives: [],
  toiletId: "standard",
};
const chance = (input, types) =>
  typeDistribution(input)
    .filter((entry) => types.includes(entry.type))
    .reduce((sum, entry) => sum + entry.probability, 0);

test("banana favors soft blobs and the configured burger favors loose forms with random variation", () => {
  const banana = { ...meal, foodIds: ["banana"] };
  const burger = { ...meal, foodIds: ["burger"] };
  assert.equal(resolveBristolType(banana), 5);
  assert.ok(chance(banana, [5]) > 0.5);
  assert.ok(chance(banana, [5]) > chance(meal, [5]) * 5);
  assert.ok([6, 7].includes(resolveBristolType(burger)));
  assert.ok(chance(burger, [6, 7]) > 0.74);
  assert.ok(typeDistribution(burger).length > 1);
  assert.ok(typeDistribution(burger)[0].probability < 1);
  assert.ok(chance(banana, [3, 4]) > 0);
  assert.notDeepEqual(
    typeDistribution(banana),
    typeDistribution({ ...banana, water: 500 }),
  );
  for (const food of foods)
    for (const [type, weight] of Object.entries(
      food.effects.typeWeights || {},
    )) {
      assert.ok(Number(type) >= 1 && Number(type) <= 7);
      assert.ok(Number.isFinite(weight) && weight >= 0);
    }
});

test("ingredient attributes combine across three slots independently of order and duplicates", () => {
  const input = { ...meal, foodIds: ["burger", "banana", "enoki"] };
  const reversed = { ...input, foodIds: [...input.foodIds].reverse() };
  assert.deepEqual(collectEffects(input), collectEffects(reversed));
  assert.deepEqual(typeDistribution(input), typeDistribution(reversed));
  assert.ok(collectEffects(input).food.shape.softness < 4);
  assert.deepEqual(collectEffects(input).typeWeights, {});
  assert.deepEqual(
    collectEffects({ ...meal, foodIds: ["banana", "banana", "rice"] })
      .typeWeights,
    collectEffects({ ...meal, foodIds: ["banana"] }).typeWeights,
  );
  for (const foodIds of [["banana"], ["burger"], input.foodIds])
    for (const water of [250, 500, 1000, 1500, 2500]) {
      const recipe = {
        ...meal,
        foodIds,
        water,
        additives: ["gold-leaf", "crystal-seed", "gelatin"],
        toiletId: "golden",
      };
      assert.ok(Math.abs(chance(recipe, [1, 2, 3, 4, 5, 6, 7]) - 1) < 1e-12);
      assert.ok(specialProbability(recipe) <= 0.005 + 1e-12);
    }
});

test("enoki leaves a signature on every reachable shape and rare material while using only two draws", () => {
  const reached = new Set();
  for (const water of [250, 500, 1000, 1250, 1500, 2250, 2500])
    for (const additives of [
      [],
      ["chili"],
      ["gold-leaf", "crystal-seed", "gelatin"],
    ]) {
      const input = { ...meal, foodIds: ["enoki"], water, additives };
      for (const drop of getOutcomePool(input)) {
        const type = classifySpecimen(drop);
        reached.add(type);
        const draws = outcomeDraws(
          input,
          (entry) => entry.specimenId === drop.specimenId,
        );
        const outcome = rollOutcome(input, () => draws.shift());
        assert.equal(draws.length, 0);
        assert.equal(outcome.type, type);
        assert.equal(outcome.characterId, drop.characterId);
        assert.deepEqual(outcome.marks, ["enoki"]);
        assert.match(
          characterSvg(
            characterById[outcome.characterId],
            false,
            outcome.type,
            outcome.colorId,
            outcome.marks,
          ),
          /-enoki\.png/,
        );
        assert.ok(
          outcome.reasons.some((reason) =>
            reason.includes("可见金针菇细丝状印记"),
          ),
        );
      }
    }
  assert.deepEqual([...reached].sort(), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(rollOutcome(meal, () => 0.5).marks, []);
});

test("individual signatures survive reload without merging separate births", () => {
  const session = createSession(
    {
      ...meal,
      foodIds: ["enoki", "banana", "burger"],
      drinkId: "blueberry-juice",
    },
    { now: 1000, random: () => 0.5 },
  );
  assert.deepEqual(
    restoreSession(JSON.parse(JSON.stringify(session))),
    session,
  );
  const save = normalizeSave({ session });
  settleSession(save, session.endsAt);
  const specimen = save.individuals[0];
  assert.deepEqual(specimen.marks, ["enoki"]);
  assert.deepEqual(normalizeSave(save).individuals, save.individuals);
  const incomplete = structuredClone(session);
  delete incomplete.outcome.marks;
  assert.equal(restoreSession(incomplete), null);
  const tampered = structuredClone(session);
  tampered.outcome.marks = ["enoki", "unknown", "enoki", null];
  assert.deepEqual(restoreSession(tampered).outcome.marks, ["enoki"]);
});

test("all eight rare materials can retain enoki without becoming guaranteed or changing material colors", () => {
  const recipes = [
    ["gold", "water", ["gold-leaf"], 1500],
    ["crystal", "mineral-tonic", ["crystal-seed"], 1500],
    ["rainbow", "prism-soda", ["rainbow-sugar"], 1500],
    ["jelly", "gel-drink", ["gelatin"], 1500],
    ["frost-crystal", "water", ["frost-salt"], 1000],
    ["luminous", "glow-soda", ["stardust"], 2250],
    ["meteor", "water", ["stardust"], 500],
    ["amber-fossil", "black-tea", ["amber-resin"], 1500],
  ];
  for (const [id, drinkId, additives, water] of recipes) {
    const input = { ...meal, foodIds: ["enoki"], drinkId, additives, water };
    const draws = outcomeDraws(input, (entry) => entry.characterId === id);
    const outcome = rollOutcome(input, () => draws.shift());
    assert.equal(outcome.characterId, id);
    assert.equal(outcome.colorId, null);
    assert.deepEqual(outcome.marks, ["enoki"]);
    assert.equal(outcome.special, true);
    assert.ok(specialProbability(input) <= 0.005 + 1e-12);
  }
});
