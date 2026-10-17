import test from "node:test";
import assert from "node:assert/strict";
import { specimenBlueprints } from "../src/content/specimen-blueprints.js";
import { foodById, characterById } from "../src/content/catalog.js";
import { classifySpecimen, specimenName } from "../src/game/specimen.js";
import {
  getOutcomePool,
  rollOutcome,
  specialProbability,
} from "../src/game/drops.js";
import { typeDistribution } from "../src/game/stool-type.js";
import {
  createSession,
  settleSession,
  restoreSession,
} from "../src/game/session.js";
import { normalizeSave } from "../src/storage/model.js";
import { characterSvg } from "../src/ui/artwork/stools.js";
import { outcomeDraws } from "./outcome-helpers.js";

test("exactly 50 species each have one catalog entry, physical structure and classification", () => {
  assert.equal(specimenBlueprints.length, 50);
  assert.equal(new Set(specimenBlueprints.map((entry) => entry.id)).size, 50);
  assert.equal(
    new Set(specimenBlueprints.map((entry) => entry.characterId)).size,
    50,
  );
  assert.equal(new Set(specimenBlueprints.map((entry) => entry.name)).size, 50);
  for (const blueprint of specimenBlueprints) {
    const type = classifySpecimen(blueprint);
    assert.deepEqual(characterById[blueprint.characterId].types, [type]);
    assert.equal(blueprint.id, `${blueprint.characterId}:${type}`);
    assert.ok(characterById[blueprint.characterId].types.includes(type));
    assert.equal(
      specimenName({ characterId: blueprint.characterId, type }),
      blueprint.name,
    );
  }
  assert.throws(
    () => classifySpecimen({ type: 4, morphology: { form: "unknown" } }),
    RangeError,
  );
});

test("the recipe generates whole specimens and the forecast groups those same outcomes", () => {
  const recipe = {
    foodIds: ["banana", "enoki", "corn"],
    water: 1500,
    drinkId: "blueberry-juice",
    additives: ["glitter", "crystal-seed"],
    toiletId: "golden",
  };
  const pool = getOutcomePool(recipe);
  assert.equal(
    new Set(pool.map((entry) => entry.specimenId)).size,
    pool.length,
  );
  assert.ok(
    Math.abs(pool.reduce((sum, entry) => sum + entry.weight, 0) - 1) < 1e-12,
  );
  const marginal = new Map();
  for (const candidate of pool) {
    const draws = outcomeDraws(
      recipe,
      (entry) => entry.specimenId === candidate.specimenId,
    );
    const outcome = rollOutcome(recipe, () => draws.shift());
    assert.equal(draws.length, 0);
    assert.equal(outcome.specimenId, candidate.specimenId);
    assert.equal(outcome.type, classifySpecimen(outcome));
    assert.equal(outcome.type, classifySpecimen(candidate));
    assert.deepEqual(outcome.marks, ["enoki"]);
    assert.ok(
      outcome.appearance.residues.some((entry) => entry.foodId === "corn"),
    );
    const svg = characterSvg(
      characterById[outcome.characterId],
      false,
      outcome.type,
      outcome.colorId,
      outcome.marks,
      outcome.appearance,
    );
    assert.match(svg, /data-food-residue="corn"/);
    assert.match(svg, /-enoki\.png/);
    if (!outcome.special && outcome.characterId === "glitter")
      assert.equal(outcome.colorId, "berry");
    marginal.set(
      outcome.type,
      (marginal.get(outcome.type) ?? 0) + candidate.probability,
    );
  }
  for (const form of typeDistribution(recipe))
    assert.ok(Math.abs(form.probability - marginal.get(form.type)) < 1e-12);
  assert.ok(specialProbability(recipe) <= 0.005 + 1e-12);
});

test("two individuals retain different meal imprints without overwriting or merging after reload", () => {
  const recipe = { foodIds: ["enoki", "corn"] };
  const save = normalizeSave();
  const first = createSession(recipe, { now: 1000, random: () => 0.5 });
  save.session = first;
  settleSession(save, first.endsAt);
  const original = structuredClone(save.individuals[0]);
  const enoki = foodById.enoki.attributes.retention;
  const corn = foodById.corn.attributes.retention;
  let second;
  try {
    foodById.enoki.attributes.retention = 1;
    foodById.corn.attributes.retention = 1;
    second = createSession(recipe, { now: 5000, random: () => 0.5 });
    assert.deepEqual(restoreSession(second), second);
    save.session = second;
    settleSession(save, second.endsAt);
  } finally {
    foodById.enoki.attributes.retention = enoki;
    foodById.corn.attributes.retention = corn;
  }
  assert.equal(save.individuals.length, 2);
  assert.notEqual(first.outcome.individualId, second.outcome.individualId);
  assert.equal(first.outcome.specimenId, second.outcome.specimenId);
  assert.deepEqual(save.individuals[0], original);
  assert.deepEqual(save.individuals[0].marks, ["enoki"]);
  assert.deepEqual(save.individuals[1].marks, []);
  assert.deepEqual(save.individuals[1].appearance.residues, []);
  const reloaded = normalizeSave(JSON.parse(JSON.stringify(save)));
  assert.deepEqual(reloaded.individuals, save.individuals);
  reloaded.session = first;
  assert.equal(settleSession(reloaded, 10000), null);
  assert.equal(reloaded.total, 2);
  assert.equal(reloaded.individuals.length, 2);
});

test("incomplete records are rejected instead of reconstructing collectible history", () => {
  const save = normalizeSave({
    individuals: [
      {
        id: "missing-structure",
        specimenId: "classic:7",
        characterId: "classic",
        type: 7,
      },
    ],
  });
  assert.deepEqual(save.individuals, []);
  assert.equal(Object.hasOwn(save, "collection"), false);
  assert.equal(Object.hasOwn(save, "specimens"), false);
});
