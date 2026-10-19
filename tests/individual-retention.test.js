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
const record = (blueprint, sequence, variant = 0) => ({
  id: `individual-${sequence}`,
  sequence,
  specimenId: blueprint.id,
  characterId: blueprint.characterId,
  morphology: { ...blueprint.morphology },
  type: classifySpecimen(blueprint),
  createdAt: sequence * 1000,
  colorId: "classic",
  marks: [],
  appearance: { ...structuredClone(appearance), grain: 1 + variant % 7,
    porosity: 1 + Math.floor(variant / 7), variationSeed: sequence },
});

test("each species retains its own seven latest distinct records and all discoveries", () => {
  const history = specimenBlueprints.slice(0, 2).flatMap((blueprint, group) =>
    Array.from({ length: 10 }, (_, i) => record(blueprint, group * 10 + i + 1, i)));
  const original = structuredClone(history);
  const save = normalizeSave({ total: 70, individuals: history });
  assert.equal(save.individuals.length, 14);
  assert.deepEqual(save.individuals.map(entry => entry.sequence),
    [4, 5, 6, 7, 8, 9, 10, 14, 15, 16, 17, 18, 19, 20]);
  assert.deepEqual(save.discoveredSpecimens, specimenBlueprints.slice(0, 2).map(entry => entry.id));
  assert.equal(save.total, 70);
  assert.deepEqual(history, original);
  assert.deepEqual(normalizeSave(JSON.parse(JSON.stringify(save))), save);
});

test("repeat merging happens before the limit and keeps the latest snapshot with a count", () => {
  const blueprint = specimenBlueprints[0];
  const history = Array.from({ length: 8 }, (_, i) => record(blueprint, i + 1, i));
  history.push(record(blueprint, 9), record(blueprint, 10));
  history.reverse();
  const save = normalizeSave({ total: 10, individuals: history });
  assert.deepEqual(save.individuals.map(entry => entry.sequence), [3, 4, 5, 6, 7, 8, 10]);
  assert.equal(save.individuals.at(-1).occurrenceCount, 3);
  assert.equal(save.individuals.at(-1).appearance.variationSeed, 10);
  assert.deepEqual(normalizeSave(save), save);
});

test("actual color, residue, decoration and structure differences survive, while inputs alone do not create variants", () => {
  const blueprint = specimenBlueprints[0];
  const recipe = { foodIds: ["rice", "corn"], drinkId: "water", water: 750,
    additives: [], digestionTime: "4", force: 20, toiletId: "standard" };
  const item = sequence => ({ ...record(blueprint, sequence), recipe: structuredClone(recipe) });
  const first = item(1), reordered = item(2), color = item(3), residue = item(4),
    decoration = item(5), otherRecipe = item(6), structure = item(7), force = item(8);
  reordered.recipe.foodIds.reverse();
  color.colorId = "berry";
  residue.appearance.residues = [{ foodId: "corn", retention: 5 }];
  decoration.appearance.decorations = ["gold-flake"];
  otherRecipe.recipe.water = 1000;
  structure.appearance.elongation = structure.appearance.elongation === 7 ? 6 : 7;
  force.recipe.force = 21;
  const save = normalizeSave({ individuals: [first, reordered, color, residue, decoration, otherRecipe, structure, force] });
  assert.equal(save.individuals.length, 5);
  assert.equal(save.individuals.at(-1).occurrenceCount, 4);
  assert.deepEqual(save.individuals.find(entry => entry.sequence === 4).appearance.residues, residue.appearance.residues);
  assert.deepEqual(save.individuals.at(-1).appearance.decorations, []);
  assert.deepEqual(save.individuals.at(-1).marks, []);
});

test("repeating a settled result updates recency and count without consuming another slot", () => {
  const save = normalizeSave();
  const first = createSession({}, { now: 10000, random: () => .5 });
  save.session = first;
  settleSession(save, first.endsAt);
  const second = createSession({}, { now: 20000, random: () => .5 });
  save.session = second;
  const result = settleSession(save, second.endsAt);
  assert.equal(save.total, 2);
  assert.equal(save.individuals.length, 1);
  assert.equal(save.individuals[0].id, second.id);
  assert.equal(save.individuals[0].sequence, 2);
  assert.equal(save.individuals[0].occurrenceCount, 2);
  assert.equal(result.individual.occurrenceCount, 2);
  assert.deepEqual(normalizeSave(save).individuals, save.individuals);
});

test("an eighth variant evicts only its own oldest record and preserves replay protection", () => {
  const session = createSession({}, { now: 100000, random: () => .5 });
  const blueprint = specimenBlueprints.find(entry => entry.id === session.outcome.specimenId);
  const other = specimenBlueprints.find(entry => entry.id !== blueprint.id);
  const history = Array.from({ length: 7 }, (_, i) => ({ ...record(blueprint, i + 1, i), colorId: "berry" }));
  const save = normalizeSave({ total: 70, individuals: [...history, record(other, 8)], session });
  settleSession(save, session.endsAt);
  assert.equal(save.individuals.filter(entry => entry.specimenId === blueprint.id).length, 7);
  assert.equal(save.individuals.length, 8);
  assert.equal(save.individuals.some(entry => entry.sequence === 1), false);
  assert.equal(save.individuals.some(entry => entry.specimenId === other.id), true);
  assert.equal(save.discoveredSpecimens.length, 2);
  assert.equal(save.individuals.at(-1).sequence, 71);
  save.session = createSession({}, { now: 200000, random: () => .5 });
  settleSession(save, save.session.endsAt);
  save.session = session;
  assert.equal(settleSession(save, 300000), null);
  assert.equal(save.total, 72);
});

test("storage writes preserve each species' records, merged counts and cumulative discoveries", () => {
  const data = new Map();
  const store = createSaveStore(() => ({ getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) }));
  const save = store.read();
  save.total = 22;
  save.individuals = specimenBlueprints.slice(0, 2).flatMap((blueprint, group) =>
    Array.from({ length: 10 }, (_, i) => record(blueprint, group * 10 + i + 1, i)));
  save.individuals.push(record(specimenBlueprints[0], 21), record(specimenBlueprints[0], 22));
  assert.equal(store.write(save), true);
  const stored = JSON.parse(data.get(gameConfig.storageKey));
  assert.equal(stored.individuals.length, 14);
  assert.equal(stored.individuals.at(-1).occurrenceCount, 3);
  assert.equal(stored.discoveredSpecimens.length, 2);
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
