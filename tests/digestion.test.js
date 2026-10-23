import test from "node:test";
import assert from "node:assert/strict";

import { getOutcomePool } from "../src/game/outcome-pool.js";
import { physicalState } from "../src/game/physical-state.js";
import { collectEffects } from "../src/game/effects.js";
import { rollOutcome } from "../src/game/drops.js";
import { createAimingSession, lockSessionForce, restoreSession } from "../src/game/session.js";
import { normalizeSelection } from "../src/game/selection.js";
import { stoolRecipes } from "../src/content/stool-recipes.js";
import { characterById } from "../src/content/catalog.js";
import { mealSources, sourceAllowed } from "../src/game/source-conditions.js";

const meal = { foodIds: ["rice", "enoki"], drinkId: "water", water: 1000, force: 50, additives: [] };

test("retired digestion values never enter current selections or affect physical state, residues or probabilities", () => {
  const selection = normalizeSelection(meal);
  const state = physicalState(meal), effects = collectEffects(meal), pool = getOutcomePool(meal);
  for (const digestionTime of ["2", "4", "8", "random", "unknown"]) {
    const input = { ...meal, digestionTime };
    assert.deepEqual(normalizeSelection(input), selection);
    assert.deepEqual(physicalState(input), state);
    assert.deepEqual(collectEffects(input), effects);
    assert.deepEqual(getOutcomePool(input), pool);
    assert.deepEqual(rollOutcome(input, () => 0.5), rollOutcome(meal, () => 0.5));
  }
  assert.equal(Object.hasOwn(selection, "digestionTime"), false);
  assert.equal(Object.hasOwn(state, "timeBonus"), false);
});

test("starting a round draws no hidden digestion phase and locks only the final outcome and surface seed", () => {
  let draws = 0;
  const random = () => { draws++; return 0.5; };
  const session = createAimingSession({ ...meal, digestionTime: "random" }, { now: 1000, random });
  assert.equal(draws, 0);
  assert.equal(Object.hasOwn(session, "digestionTime"), false);
  assert.deepEqual(restoreSession(JSON.parse(JSON.stringify(session))), session);
  assert.equal(lockSessionForce(session, { now: 1750, random }), true);
  assert.equal(draws, 2);
  assert.equal(session.endsAt - session.lockedAt, 400);
  assert.ok(session.outcome.marks.includes("enoki"));
  assert.deepEqual(restoreSession(JSON.parse(JSON.stringify(session))), session);
});

test("all 46 revised recommendation examples satisfy their target physical state and source conditions without digestion requirements", () => {
  assert.equal(stoolRecipes.length, 46);
  const examples = new Set();
  for (const recipe of stoolRecipes) {
    assert.equal(Object.hasOwn(recipe, "digestionTime"), false, recipe.characterId);
    assert.ok(["low", "medium", "high"].includes(recipe.forceZone), recipe.characterId);
    const selection = normalizeSelection({ ...recipe, additives: recipe.requiredAdditive ? [recipe.requiredAdditive] : [] });
    const character = characterById[recipe.characterId];
    assert.equal(physicalState(selection).type, character.homeType, recipe.characterId);
    assert.equal(sourceAllowed(character, mealSources(selection)), true, recipe.characterId);
    assert.ok(getOutcomePool(selection).some(entry => entry.characterId === character.id && entry.probability > 0), recipe.characterId);
    const key = JSON.stringify([[...recipe.foodIds].sort(), recipe.drinkId, recipe.water, recipe.requiredAdditive]);
    assert.equal(examples.has(key), false, recipe.characterId);
    examples.add(key);
  }
});

test("the single drink intake slider spans dry to wet and ignores drink identity at zero intake", () => {
  const dry = physicalState({ foodIds: ["rice"], water: 0 });
  const wet = physicalState({ foodIds: ["rice"], water: 1250 });
  assert.equal(dry.waterBonus, -2);
  assert.equal(wet.waterBonus, 0.5);
  assert.ok(dry.type < wet.type);
  assert.deepEqual(physicalState({ ...meal, water: 0, drinkId: "water" }), physicalState({ ...meal, water: 0, drinkId: "prune-juice" }));
});
