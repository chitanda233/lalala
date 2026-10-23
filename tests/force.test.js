import test from "node:test";
import assert from "node:assert/strict";
import { forceZone, oscillatingForce } from "../src/content/force.js";
import {
  createAimingSession,
  lockSessionForce,
  restoreSession,
  sessionProgress,
  settleSession,
} from "../src/game/session.js";
import { normalizeSave } from "../src/storage/model.js";
import { createSaveStore } from "../src/storage/save.js";
import { stoolRecipeByCharacterId } from "../src/content/stool-recipes.js";
import { getOutcomePool } from "../src/game/outcome-pool.js";
import { characterById } from "../src/content/catalog.js";
import { physicalState } from "../src/game/physical-state.js";

const meal = { foodIds: ["rice", "enoki"] };

test("force oscillates from left to right and back with exact zone boundaries", () => {
  assert.deepEqual(
    [0, 750, 1500, 2250, 3000, 3750].map(oscillatingForce),
    [0, 50, 100, 50, 0, 50],
  );
  assert.equal(oscillatingForce(-500), 0);
  for (const [value, zone] of [
    [0, "low"],
    [33, "low"],
    [34, "medium"],
    [66, "medium"],
    [67, "high"],
    [100, "high"],
  ])
    assert.equal(forceZone(value).id, zone);
});

test("aiming has no generated outcome, countdown, automatic settlement or random draw", () => {
  const session = createAimingSession(meal, {
    now: 1000,
    random() {
      throw new Error("too early");
    },
  });
  assert.equal(session.phase, "aiming");
  assert.equal(session.force, null);
  assert.equal(session.outcome, null);
  assert.equal(session.endsAt, null);
  assert.deepEqual(
    restoreSession(JSON.parse(JSON.stringify(session))),
    session,
  );
  assert.deepEqual(sessionProgress(session, 100000), {
    remaining: null,
    progress: 0,
  });
  const save = normalizeSave({ session });
  assert.equal(settleSession(save, 100000), null);
  assert.equal(save.total, 0);
  assert.equal(save.individuals.length, 0);
});

test("stopping samples the elapsed pointer position and freezes one complete outcome", () => {
  const session = createAimingSession(meal, { now: 1000 });
  let draws = 0;
  assert.equal(
    lockSessionForce(session, {
      now: 2350,
      random: () => {
        draws++;
        return 0.5;
      },
    }),
    true,
  );
  assert.equal(session.force, 90);
  assert.equal(session.lockedAt, 2350);
  assert.equal(session.endsAt, 2750);
  assert.equal(session.outcome.individualId, session.id);
  assert.ok(session.outcome.marks.includes("enoki"));
  assert.equal(draws, 2);
  const snapshot = structuredClone(session);
  assert.equal(
    lockSessionForce(session, {
      now: 3000,
      random() {
        throw new Error("rerolled");
      },
    }),
    false,
  );
  assert.deepEqual(session, snapshot);
  assert.deepEqual(restoreSession(session), session);
  assert.equal(sessionProgress(session, 2550).progress, 0.5);
});

test("refresh and many complete swings do not change the measured force", () => {
  const original = createAimingSession(meal, { now: 1000 });
  const session = restoreSession(structuredClone(original));
  lockSessionForce(session, {
    now: 1000 + 3000 * 100 + 300,
    random: () => 0.5,
  });
  assert.equal(session.force, 20);
  assert.equal(session.startedAt, original.startedAt);
  assert.equal(session.endsAt - session.lockedAt, 400);
});

test("force changes same-identity shapes while preserving identity budgets, rare odds and physical class", () => {
  const input = { ...stoolRecipeByCharacterId.spiral, additives: [] };
  const low = getOutcomePool({ ...input, force: 20 }), high = getOutcomePool({ ...input, force: 90 });
  const probability = (pool, id) => pool.find(entry => entry.characterId === id)?.probability || 0;
  assert.ok(probability(low, "spiral") > probability(high, "spiral"));
  assert.ok(probability(high, "squat-spring") > probability(low, "squat-spring"));
  const budgets = pool => {
    const result = new Map();
    for (const entry of pool) {
      const character = characterById[entry.characterId];
      const key = entry.special ? `rare:${character.id}` : character.generation.identity;
      result.set(key, (result.get(key) || 0) + entry.probability);
    }
    return result;
  };
  for (const meal of [input, { foodIds: ["rice", "enoki"], drinkId: "water", water: 1000, additives: [] }]) {
    const expected = budgets(getOutcomePool({ ...meal, force: 20 }));
    for (const force of [0, 33, 34, 66, 67, 100]) {
      const pool = getOutcomePool({ ...meal, force }), actual = budgets(pool);
      assert.equal(physicalState({ ...meal, force }).type, physicalState(meal).type);
      assert.deepEqual([...actual.keys()].sort(), [...expected.keys()].sort());
      for (const [identity, budget] of expected)
        assert.ok(Math.abs(actual.get(identity) - budget) < 1e-12, `${identity}: force ${force}`);
    }
  }
});

test("aiming and running records require valid phase-specific timing and force", () => {
  const aiming = createAimingSession(meal, { now: 1000 });
  assert.equal(restoreSession({ ...aiming, force: 50 }), null);
  assert.equal(restoreSession({ ...aiming, phase: "unknown" }), null);
  assert.equal(lockSessionForce(aiming, { now: 999 }), false);
  lockSessionForce(aiming, { now: 1750, random: () => 0.5 });
  for (const change of [
    { force: -1 },
    { force: 101 },
    { lockedAt: 999 },
    { endsAt: 50000 },
    { outcome: null },
  ])
    assert.equal(restoreSession({ ...aiming, ...change }), null);
});

test("two stop attempts share a single frozen draw and settle one independent specimen", async () => {
  const entries = new Map();
  const storage = {
    getItem: (key) => entries.get(key),
    setItem: (key, value) => entries.set(key, value),
  };
  const first = createSaveStore(() => storage);
  const second = createSaveStore(() => storage);
  const save = first.read();
  save.session = createAimingSession(meal, { now: 1000 });
  first.write(save);
  const id = save.session.id;
  const stops = await Promise.all([
    first.lockForce(id, 1300),
    second.lockForce(id, 2350),
  ]);
  assert.equal(stops.filter((result) => result.locked).length, 1);
  assert.equal(second.read().session.force, 20);
  const snapshot = second.read().session;
  const settlements = await Promise.all([
    first.settle(id, 4000),
    second.settle(id, 4000),
  ]);
  assert.equal(settlements.filter((result) => result.result).length, 1);
  const result = first.read();
  assert.equal(result.individuals.length, 1);
  assert.deepEqual(
    result.individuals[0].appearance,
    snapshot.outcome.appearance,
  );
  assert.equal(result.individuals[0].recipe.force, 20);
});
