import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSelection } from "../src/game/selection.js";
import { collectEffects } from "../src/game/effects.js";

import { createSession, restoreSession, settleSession } from "../src/game/session.js";
import { normalizeSave } from "../src/storage/model.js";
import { createSaveStore } from "../src/storage/save.js";
import { normalizeToilets, equipToilet, recordToiletUnlocks, toiletUnlockHint } from "../src/progression/toilets.js";
import { gameConfig } from "../src/config/game.js";

import { toilets } from "../src/content/toilets.js";

const base = {
  foodIds: ["rice"],
  drinkId: "water",
  water: 1500,
  additives: [],
  toiletId: "standard",
};

test("food, drink and one functional additive are collected without mutating the selection", () => {
  const input = { ...base, drinkId: "coffee", additives: ["oil"], toiletId: "golden" };
  const before = structuredClone(input);
  const effects = collectEffects(input);
  assert.ok(Number.isFinite(effects.food.shape.softness));
  assert.ok(effects.smoothnessBonus > collectEffects({ ...input, additives: [] }).smoothnessBonus);
  assert.deepEqual(effects.decorations, []);
  assert.deepEqual(input, before);
});

test("a session snapshots its loadout and outcome through save and restore", () => {
  const input = { ...base, additives: [], toiletId: "golden" };
  const session = createSession(input, { now: 1000, random: () => 0 });
  const expected = structuredClone(session);
  input.additives.push("chili");
  input.toiletId = "standard";
  assert.deepEqual(session, expected);
  assert.equal(session.outcome.characterId, "gold");
  assert.deepEqual(
    restoreSession(JSON.parse(JSON.stringify(session))),
    session,
  );
  assert.equal(restoreSession({ ...session, rulesVersion: 1 }), null);
});

test("settlement waits until the end and records a discovery only once", () => {
  const save = normalizeSave();
  save.session = createSession(base, { now: 1000, random: () => 0 });
  assert.equal(settleSession(save, 1399), null);
  assert.equal(save.total, 0);
  const snapshot = structuredClone(save.session);
  const result = settleSession(save, 1400);
  assert.equal(result.isNewType, true);
  assert.equal(save.total, 1);
  assert.equal(save.individuals.length, 1);
  assert.equal(save.individuals[0].specimenId, snapshot.outcome.specimenId);
  assert.deepEqual(save.individuals[0].appearance, snapshot.outcome.appearance);
  assert.equal(save.individuals[0].id, snapshot.id);
  save.session = snapshot;
  assert.equal(settleSession(save, 4000), null);
  assert.equal(save.total, 1);
});

test("current saves use only independently recorded individuals", () => {
  const session = createSession(
    { ...base, drinkId: "coffee" },
    { now: 1000, random: () => 0.5 },
  );
  const save = normalizeSave({
    total: 3,
    settings: {
      foodIds: ["broccoli"],
      drinkId: "coffee",
      water: 1750,
      additives: ["probiotic"],
    },
    session,
  });
  assert.equal(save.version, gameConfig.saveVersion);
  assert.deepEqual(save.individuals, []);
  assert.equal(Object.hasOwn(save, "collection"), false);
  assert.equal(Object.hasOwn(save, "specimens"), false);
  assert.equal(save.settings.drinkId, "coffee");
  assert.deepEqual(save.session, session);
});

test("invalid saves and unrecognized content cannot leak into the game", () => {
  for (const value of [null, "broken", [], { settings: null }])
    assert.deepEqual(normalizeSave(value).settings.foodIds, ["rice"]);
  const save = normalizeSave({
    total: -1,
    individuals: [null, { id: "invalid", type: 8, characterId: "classic" }],
    session: {
      foodIds: ["rice"],
      water: 1500,
      additives: [],
      startedAt: 0,
      endsAt: 9000,
    },
  });
  assert.equal(save.total, 0);
  assert.deepEqual(save.individuals, []);
  assert.equal(save.session, null);
  assert.equal(
    normalizeSelection({ foodIds: ["__proto__"], drinkId: "missing", water: 1 })
      .water,
    250,
  );
});

test("locked rounds reveal after a fixed brief delay and validate actual elapsed time", () => {
  const session = createSession(base, { now: 1000, random: () => 0 });
  assert.equal(session.endsAt, 1000 + gameConfig.resultDelayMs);
  assert.equal(session.seconds, 0.4);
  assert.deepEqual(restoreSession(session), session);
  assert.equal(restoreSession({ ...session, endsAt: 482000 }), null);
  assert.equal(restoreSession({ ...session, seconds: 8 }), null);
});

test("three starter toilets and round unlocks never equip a preview automatically", () => {
  const initial = normalizeToilets({ owned: toilets.map((item) => item.id), equipped: "golden" });
  assert.deepEqual(initial.owned, ["standard", "squat", "stone"]);
  assert.equal(initial.equipped, "standard");
  assert.equal(equipToilet(initial, "golden"), false);
  for (const toilet of toilets.filter((item) => !item.starter)) {
    assert.equal(normalizeToilets(null, toilet.unlock.count - 1).owned.includes(toilet.id), false);
    assert.equal(normalizeToilets(null, toilet.unlock.count).owned.includes(toilet.id), true);
    assert.match(toiletUnlockHint(toilet, 0), new RegExp(String(toilet.unlock.count)));
  }
  const save = { total: 2, toilets: normalizeToilets(null, 2) };
  assert.equal(equipToilet(save.toilets, "squat"), true);
  save.total = 3;
  assert.deepEqual(recordToiletUnlocks(save), ["comfort"]);
  assert.equal(save.toilets.equipped, "squat");
  assert.deepEqual(recordToiletUnlocks(save), []);
  assert.equal(equipToilet(save.toilets, "comfort"), true);
  assert.equal(normalizeToilets(save.toilets, 3).equipped, "comfort");
});

test("save storage settles concurrent attempts once and works without localStorage", async () => {
  const entries = new Map();
  const storage = {
    getItem: (key) => entries.get(key),
    setItem: (key, value) => entries.set(key, value),
  };
  const store = createSaveStore(() => storage);
  const save = store.read();
  save.session = createSession(base, { now: 1000, random: () => 0 });
  store.write(save);
  const results = await Promise.all([
    store.settle(save.session.id, 3000),
    store.settle(save.session.id, 3000),
  ]);
  assert.equal(results.filter((entry) => entry.result).length, 1);
  assert.equal(store.read().total, 1);
  const unavailable = createSaveStore(() => {
    throw new Error("blocked");
  });
  const temporary = unavailable.read();
  temporary.session = createSession(base, { now: 1000, random: () => 0 });
  unavailable.write(temporary);
  assert.equal(
    (await unavailable.settle(temporary.session.id, 3000)).save.total,
    1,
  );
  assert.equal(unavailable.available, false);
});
