import test from "node:test";
import assert from "node:assert/strict";
import { drinks } from "../src/content/drinks.js";
import { additives } from "../src/content/additives.js";
import { toilets } from "../src/content/toilets.js";
import { characters } from "../src/content/stools.js";
import { characterById } from "../src/content/catalog.js";
import { stoolRecipeByCharacterId } from "../src/content/stool-recipes.js";
import { normalizeSelection } from "../src/game/selection.js";
import { rollOutcome } from "../src/game/drops.js";
import { resolveColor } from "../src/game/color.js";
import { createSession, restoreSession } from "../src/game/session.js";
import { normalizeSave } from "../src/storage/model.js";
import { characterSvg } from "../src/ui/artwork/stools.js";
import { toiletSvg } from "../src/ui/artwork/toilets.js";
import { outcomeDraws } from "./outcome-helpers.js";
import { classifySpecimen } from "../src/game/specimen.js";

const base = { foodIds: ["rice"], drinkId: "water", additives: [], toiletId: "standard", water: 1500, force: 50 };
export function findWitness(item) {
  const recipe = stoolRecipeByCharacterId[item.id];
  return {
    selection: recipe ? { ...base, ...recipe, force: { low: 20, medium: 50, high: 90 }[recipe.forceZone] } : base,
    type: item.homeType,
  };
}

test("catalog includes 56 classified, described, illustrated and reachable collectibles", () => {
  assert.equal(characters.length, 56);
  assert.equal(new Set(characters.map((item) => item.id)).size, 56);
  assert.equal(drinks.length, 11);
  assert.equal(additives.length, 18);
  assert.equal(toilets.length, 10);
  for (const catalog of [drinks, additives, toilets]) {
    assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
    for (const item of catalog) {
      assert.ok(["open", "rounds"].includes(item.unlock.kind));
      if (item.unlock.kind === "rounds") assert.ok(item.unlock.count > 0);
      assert.ok(item.description && item.effectLabel);
    }
  }
  const artwork = new Set();
  for (const item of characters) {
    assert.ok(item.types.includes(item.homeType));
    assert.ok(item.description.length > 10 && item.hint.length > 5);
    const { selection } = findWitness(item);
    assert.ok(outcomeDraws(selection, (entry) => entry.characterId === item.id));
    artwork.add(characterSvg(item).replaceAll(/specimen-\d+/g, "specimen").replace(/aria-label="[^"]*"/g, ""));
  }
  assert.equal(artwork.size, 56);
  for (const type of [1, 2, 3, 4, 5, 6, 7]) assert.ok(characters.some((item) => item.homeType === type));
  assert.equal(new Set(toilets.map((item) => toiletSvg(item))).size, 10);
});

test("every artwork family can produce a complete classified specimen", () => {
  for (const item of characters) {
    const { selection, type } = findWitness(item);
    const draws = outcomeDraws(selection, (entry) => entry.characterId === item.id && classifySpecimen(entry) === type);
    const outcome = rollOutcome(selection, () => draws.shift());
    assert.equal(outcome.characterId, item.id);
    assert.equal(outcome.type, type);
    assert.equal(outcome.special, item.rarity === "special");
    assert.ok(outcome.reasons.length >= 4);
  }
});

test("drink pigments remain independent of fixed collectible identities", () => {
  for (const [drinkId, color] of [["prune-juice", "berry"], ["prism-soda", "beet"], ["ink-tonic", "ink"], ["milk", "milk"]])
    assert.equal(resolveColor({ ...base, drinkId }, characterById.classic), color);
});

test("loadouts and diagnoses use the current snapshot schema and one additive", () => {
  const input = { ...base, force: 20, drinkId: "prune-juice", additives: ["glitter"], toiletId: "heated" };
  const session = createSession(input, { now: 1000, random: () => 0.5 });
  assert.deepEqual(restoreSession(JSON.parse(JSON.stringify(session))), session);
  const incomplete = structuredClone(session);
  delete incomplete.outcome.morphology;
  assert.equal(restoreSession(incomplete), null);
  const save = normalizeSave({ settings: { ...input, additives: ["glitter", "glitter", "gold-leaf", "gelatin", "stardust"] }, session });
  assert.equal(save.version, 5);
  assert.equal(save.toilets.owned.length, 3);
  assert.deepEqual(save.settings.additives, ["glitter"]);
  assert.deepEqual(save.individuals, []);
  assert.equal(normalizeSelection({ force: "unknown" }).force, 50);
});
