import test from "node:test";
import assert from "node:assert/strict";
import { specimenBlueprints } from "../src/content/specimen-blueprints.js";
import { classifySpecimen } from "../src/game/specimen.js";
import { rollOutcome } from "../src/game/drops.js";
import { createSession, settleSession } from "../src/game/session.js";
import { normalizeSave } from "../src/storage/model.js";
import { createSaveStore } from "../src/storage/save.js";
import { gameConfig } from "../src/config/game.js";

const appearance = rollOutcome({}, () => .5).appearance;
const record = (blueprint, sequence) => ({
  id: `individual-${sequence}`,
  sequence,
  specimenId: blueprint.id,
  characterId: blueprint.characterId,
  morphology: { ...blueprint.morphology },
  type: classifySpecimen(blueprint),
  createdAt: sequence * 1000,
  colorId: "classic",
  marks: [],
  appearance: { ...structuredClone(appearance), variationSeed: sequence },
});

test("loading a large history retains the latest seven species and all discoveries", () => {
  const history = specimenBlueprints.slice(0, 10).map((blueprint, i) => record(blueprint, i + 1));
  const original = structuredClone(history);
  const save = normalizeSave({ total: 70, individuals: history });
  assert.equal(save.individuals.length, 7);
  assert.deepEqual(save.individuals.map(entry => entry.sequence), [4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(save.discoveredSpecimens, history.map(entry => entry.specimenId));
  assert.equal(save.total, 70);
  assert.deepEqual(history, original);
  const reloaded = normalizeSave(JSON.parse(JSON.stringify(save)));
  assert.deepEqual(reloaded, save);
});

test("deduplication happens before the seven-species limit, retaining the newest snapshot", () => {
  const history = specimenBlueprints.slice(0, 8).map((blueprint, i) => record(blueprint, i + 1));
  const newest = record(specimenBlueprints[0], 9);
  newest.appearance.variationSeed = 999;
  history.push(newest, record(specimenBlueprints[0], 10));
  // Saved sequence, rather than array position, determines recency.
  history.reverse();
  const save = normalizeSave({ total: 10, individuals: history });
  assert.deepEqual(save.individuals.map(entry => entry.sequence), [3, 4, 5, 6, 7, 8, 10]);
  assert.equal(new Set(save.individuals.map(entry => entry.specimenId)).size, 7);
  assert.equal(save.individuals.at(-1).appearance.variationSeed, 10);
  assert.equal(save.discoveredSpecimens.length, 8);
});

test("replacement moves a species to the newest position without evicting another retained species", () => {
  const ordinary = createSession({}, { now: 10000, random: () => .5 });
  const blueprint = specimenBlueprints.find(entry => entry.id === ordinary.outcome.specimenId);
  const others = specimenBlueprints.filter(entry => entry.id !== blueprint.id).slice(0, 6);
  const save = normalizeSave({
    total: 7,
    individuals: [record(blueprint, 1), ...others.map((entry, i) => record(entry, i + 2))],
    session: ordinary,
  });
  const result = settleSession(save, ordinary.endsAt);
  assert.equal(result.isNew, false);
  assert.equal(result.isNewType, false);
  assert.equal(save.total, 8);
  assert.equal(save.individuals.length, 7);
  assert.deepEqual(save.individuals.slice(0, 6).map(entry => entry.specimenId), others.map(entry => entry.id));
  assert.equal(save.individuals.at(-1).id, ordinary.id);
  assert.equal(save.individuals.at(-1).sequence, 8);
});

test("settling an eighth distinct species evicts its oldest snapshot but preserves unlocks and replay protection", () => {
  const session = createSession({}, { now: 10000, random: () => .5 });
  const others = specimenBlueprints.filter(entry => entry.id !== session.outcome.specimenId).slice(0, 7);
  const save = normalizeSave({
    total: 70,
    individuals: others.map((entry, i) => record(entry, i + 1)),
    session,
  });
  assert.equal(settleSession(save, session.endsAt).isNew, true);
  assert.equal(save.individuals.length, 7);
  assert.equal(save.individuals.some(entry => entry.specimenId === others[0].id), false);
  assert.equal(save.discoveredSpecimens.includes(others[0].id), true);
  assert.equal(save.discoveredSpecimens.length, 8);
  assert.equal(save.individuals.at(-1).sequence, 71);
  save.session = createSession({}, { now: 20000, random: () => .5 });
  settleSession(save, save.session.endsAt);
  save.session = session;
  assert.equal(settleSession(save, 30000), null);
  assert.equal(save.total, 72);
});

test("storage writes persist only deduplicated recent individuals while preserving cumulative collection", () => {
  const data = new Map();
  const store = createSaveStore(() => ({ getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) }));
  const save = store.read();
  save.total = 12;
  save.individuals = specimenBlueprints.slice(0, 10).map((entry, i) => record(entry, i + 1));
  save.individuals.push(record(specimenBlueprints[0], 11), record(specimenBlueprints[0], 12));
  assert.equal(store.write(save), true);
  const stored = JSON.parse(data.get(gameConfig.storageKey));
  assert.equal(stored.individuals.length, 7);
  assert.equal(new Set(stored.individuals.map(entry => entry.specimenId)).size, 7);
  assert.equal(stored.discoveredSpecimens.length, 10);
  assert.deepEqual(store.read(), stored);
});

test("invalid records and unknown discovery IDs cannot unlock species", () => {
  const save = normalizeSave({
    discoveredSpecimens: ["missing:4", "__proto__", null, "classic:4", "classic:4"],
    individuals: [null, { ...record(specimenBlueprints[1], 1), appearance: null }],
  });
  assert.deepEqual(save.discoveredSpecimens, ["classic:4"]);
  assert.deepEqual(save.individuals, []);
});
