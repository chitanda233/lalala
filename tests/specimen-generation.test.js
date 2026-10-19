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

test("exactly 56 species each have one catalog entry, physical structure and classification", () => {
  assert.equal(specimenBlueprints.length, 56);
  assert.equal(new Set(specimenBlueprints.map((entry) => entry.id)).size, 56);
  assert.equal(
    new Set(specimenBlueprints.map((entry) => entry.characterId)).size,
    56,
  );
  assert.equal(new Set(specimenBlueprints.map((entry) => entry.name)).size, 56);
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
    drinkId: "prune-juice",
    additives: ["glitter"],
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
  assert.ok(Math.abs(specialProbability(recipe) - 0.02) < 1e-12);
});

test("the same species retains different appearances without combining meal imprints", () => {
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
  assert.deepEqual(original.marks, ["enoki"]);
  assert.deepEqual(save.individuals[0], original);
  assert.equal(save.individuals[1].id, second.id);
  assert.equal(save.individuals[1].sequence, 2);
  assert.deepEqual(save.individuals[1].marks, []);
  assert.deepEqual(save.individuals[1].appearance.residues, []);
  assert.deepEqual(save.discoveredSpecimens, [first.outcome.specimenId]);
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

test("saved seeds vary surface placement and density without moving or rotating the body", () => {
  const appearance = rollOutcome({ foodIds: ["rice", "corn", "enoki"] }, () => .5).appearance;
  const stableIds = svg => svg.replaceAll(/specimen-\d+/g, "specimen-test");
  for (const id of ["classic", "corn-cannon"]) {
    const character = characterById[id];
    const render = variationSeed => stableIds(characterSvg(character, false, character.homeType,
      "berry", ["enoki"], { ...appearance, variationSeed }));
    const first = render(1), second = render(999999);
    assert.equal(first, render(1), "reopening a saved result must retain its exact surface");
    assert.notEqual(first, second);
    const images = svg => [...svg.matchAll(/<image\b[^>]+>/g)].map(match => match[0]);
    assert.deepEqual(images(first), images(second), "the body and food source layers cannot move");
    assert.doesNotMatch(first + second, /rotate\(/);
    assert.notEqual(first.match(/<pattern[^>]+-grain[^>]+>/)[0], second.match(/<pattern[^>]+-grain[^>]+>/)[0]);
    const counts = new Set();
    for (let seed = 0; seed < 64; seed++) {
      const svg = render(seed);
      const count = [...svg.matchAll(/data-food-residue="corn"/g)].length;
      const base = 1 + Math.floor((appearance.residues.find(item => item.foodId === "corn").retention - 2) / 2);
      assert.ok(count >= Math.max(1, base - 1) && count <= base + 1);
      counts.add(count);
      assert.doesNotMatch(svg, /data-food-residue="(?!corn|enoki)/);
    }
    assert.ok(counts.size > 1, "residue quantities should vary slightly between births");
  }
  const character = characterById.classic;
  const plain = characterSvg(character, false, character.homeType, "classic", [],
    { ...appearance, grain: 1, porosity: 1, residues: [], variationSeed: 999999 });
  assert.doesNotMatch(plain, /data-food-residue|data-layer="(?:grain|porosity)"/);
  const cover = () => stableIds(characterSvg(character));
  assert.equal(cover(), cover(), "standard covers cannot gain random texture");
});
