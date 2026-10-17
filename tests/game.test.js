import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSelection } from "../src/game/selection.js";
import { collectEffects } from "../src/game/effects.js";
import {
  resolveBristolType,
  typeDistribution,
} from "../src/game/stool-type.js";
import { resolveCharacter } from "../src/game/combinations.js";
import { smoothness } from "../src/game/smoothness.js";
import {
  getDropPool,
  normalizeDropPool,
  rollOutcome,
  specialProbability,
} from "../src/game/drops.js";
import {
  createSession,
  restoreSession,
  settleSession,
} from "../src/game/session.js";
import { normalizeSave } from "../src/storage/model.js";
import { createSaveStore } from "../src/storage/save.js";
import {
  normalizeToilets,
  equipToilet,
  unlockToilet,
} from "../src/progression/toilets.js";
import { gameConfig } from "../src/config/game.js";
import { foods } from "../src/content/foods.js";
import { drinks } from "../src/content/drinks.js";
import { additives as additiveCatalog } from "../src/content/additives.js";
import { toilets } from "../src/content/toilets.js";

const base = {
  foodIds: ["rice"],
  drinkId: "water",
  water: 1500,
  additives: [],
  toiletId: "standard",
};

test("single-food profiles and explicit drinks support every form", () => {
  const examples = [
    ["rice", 500, [], "water", 1, "pebble"],
    ["rice", 1000, [], "water", 2, "classic"],
    ["toast", 1500, [], "water", 4, "bread"],
    ["rice", 1500, [], "water", 4, "classic"],
    ["broccoli", 1500, [], "water", 4, "garden"],
    ["hotpot", 1500, [], "water", 6, "fire"],
    ["hotpot", 2250, [], "water", 7, "fire"],
    ["rice", 1500, [], "coffee", 5, "coffee"],
    ["rice", 2250, ["probiotic"], "water", 4, "cloud"],
    ["broccoli", 1750, ["probiotic"], "water", 4, "garden"],
    ["broccoli", 1750, ["probiotic"], "coffee", 5, "coffee"],
    ["rice", 250, ["probiotic"], "water", 2, "pebble"],
  ];
  for (const [id, water, additives, drinkId, type, characterId] of examples) {
    const input = { foodIds: [id], water, additives, drinkId };
    assert.equal(resolveBristolType(input), type);
    assert.equal(resolveCharacter(input), characterId);
  }
});

test("food, drink, additive and equipment effects compose without mutating selections", () => {
  const input = {
    ...base,
    drinkId: "coffee",
    additives: ["probiotic", "chili"],
    toiletId: "golden",
  };
  const before = structuredClone(input);
  const effects = collectEffects(input);
  assert.equal(effects.food.shape.softness, 4);
  assert.equal(effects.typeShift, 2);
  assert.equal(effects.typeBalance, 1);
  assert.equal(effects.smoothnessBonus, 2);
  assert.equal(effects.specialWeightBonus, 0);
  assert.equal(effects.specialWeightMultiplier, 2);
  assert.equal(effects.dropWeightMultipliers.gold, 1.25);
  assert.deepEqual(input, before);
  assert.equal(smoothness({ ...base, foodIds: ["toast"], water: 1250 }), 4);
  assert.equal(
    smoothness({
      ...base,
      foodIds: ["toast"],
      water: 1250,
      toiletId: "comfort",
    }),
    5,
  );
  assert.equal(smoothness(input), 4);
});

test("toilet weights become normalized probabilities and respect recipe eligibility", () => {
  const formedShare = (input) =>
    typeDistribution(input).find((entry) => entry.type === 4)?.probability ?? 0;
  assert.ok(
    Math.abs(specialProbability(base) - (formedShare(base) * 0.1) / 100.1) <
      1e-12,
  );
  const comfort = { ...base, toiletId: "comfort" };
  const golden = { ...base, toiletId: "golden" };
  assert.ok(
    Math.abs(
      specialProbability(comfort) - (formedShare(comfort) * 0.15) / 100.15,
    ) < 1e-12,
  );
  assert.ok(
    Math.abs(
      specialProbability(golden) - (formedShare(golden) * 0.25) / 100.25,
    ) < 1e-12,
  );
  assert.ok(specialProbability(golden) > specialProbability(comfort));
  assert.equal(
    getDropPool(golden).reduce((sum, item) => sum + item.probability, 0),
    1,
  );
  assert.equal(rollOutcome(golden, () => 0).characterId, "classic");
  assert.equal(rollOutcome(golden, () => 0.999999).characterId, "gold");
  assert.equal(specialProbability({ ...golden, drinkId: "coffee" }), 0);
  assert.equal(specialProbability({ ...golden, foodIds: ["hotpot"] }), 0);
  assert.equal(specialProbability({ ...golden, water: 500 }), 0);
  assert.ok(
    Math.abs(
      specialProbability({
        ...base,
        foodIds: ["broccoli"],
        water: 1750,
        additives: ["probiotic"],
      }) -
        (formedShare({
          ...base,
          foodIds: ["broccoli"],
          water: 1750,
          additives: ["probiotic"],
        }) *
          0.15) /
          100.15,
    ) < 1e-12,
  );
  assert.throws(() => rollOutcome(golden, () => 1), RangeError);
});

test("a session snapshots its loadout and outcome through save and restore", () => {
  const input = { ...base, additives: [], toiletId: "golden" };
  const session = createSession(input, { now: 1000, random: () => 0.999999 });
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

test("gold, crystal, rainbow and jelly share one probability ceiling as a group", () => {
  const variants = ["gold", "crystal", "rainbow", "jelly"];
  const entries = [
    { characterId: "classic", weight: 100, special: false },
    ...variants.map((characterId) => ({
      characterId,
      weight: 10000,
      special: true,
    })),
  ];
  const before = structuredClone(entries);
  const pool = normalizeDropPool(entries);
  const probability = pool
    .filter((entry) => entry.special)
    .reduce((sum, entry) => sum + entry.probability, 0);
  assert.ok(probability <= gameConfig.maxSpecialProbability + 1e-12);
  assert.ok(Math.abs(probability - 0.005) < 1e-12);
  assert.deepEqual(entries, before);
  assert.equal(normalizeDropPool(entries, 0).length, 1);
  assert.throws(
    () => normalizeDropPool(entries.filter((entry) => entry.special)),
    RangeError,
  );
});

test("all food/drink/toilet triples with varied additives, water and force respect the rare ceiling", () => {
  let index = 0;
  for (const food of foods)
    for (const drink of drinks)
      for (const toilet of toilets) {
        const n = index++;
        const selection = {
          ...base,
          foodIds: [food.id],
          drinkId: drink.id,
          toiletId: toilet.id,
          water: 250 + (n % 10) * 250,
          force: [50, 90, 20][n % 3],
          additives: [0, 5, 11].map(
            (offset) =>
              additiveCatalog[(n + offset) % additiveCatalog.length].id,
          ),
        };
        const pool = getDropPool(selection);
        assert.ok(
          specialProbability(selection) <=
            gameConfig.maxSpecialProbability + 1e-12,
        );
        assert.ok(
          pool
            .filter((entry) => !entry.special)
            .reduce((sum, entry) => sum + entry.probability, 0) >=
            0.995 - 1e-12,
        );
        assert.equal(rollOutcome(selection, () => 0.5).special, false);
      }
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

test("equipment ownership, unlocking and equipping are independent of session effects", () => {
  const inventory = normalizeToilets({
    owned: ["unknown"],
    equipped: "unknown",
  });
  assert.equal(inventory.equipped, "standard");
  assert.equal(inventory.owned.includes("unknown"), false);
  const locked = { owned: ["standard"], equipped: "standard" };
  assert.equal(equipToilet(locked, "golden"), false);
  assert.equal(unlockToilet(locked, "golden"), true);
  assert.equal(unlockToilet(locked, "golden"), false);
  assert.equal(equipToilet(locked, "golden"), true);
  assert.equal(locked.equipped, "golden");
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
