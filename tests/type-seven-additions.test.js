import test from "node:test";
import assert from "node:assert/strict";
import { characterById } from "../src/content/catalog.js";
import { specimenBlueprintById } from "../src/content/specimen-blueprints.js";
import { conditionalDropPool, getOutcomePool } from "../src/game/outcome-pool.js";
import { stoolRecipeByCharacterId } from "../src/content/stool-recipes.js";
import { specialProbability } from "../src/game/drops.js";
import { classifySpecimen } from "../src/game/specimen.js";
import { characterSvg, mysterySvg } from "../src/ui/artwork/stools.js";
import { rareRevealTheme } from "../src/ui/rare-reveal.js";
const base = { foodIds:["rice"], water:2500, force:90, digestionTime:"2", drinkId:"water", additives:[] };
const candidates = [
  ["enoki-jet", {...base,foodIds:["enoki"]}],
  ["corn-cannon", {...base,foodIds:["corn"]}],
  ["golden-juice", {...base,additives:["gold-leaf"]}],
  ["rainbow-falls", {...base,additives:["rainbow-sugar"]}],
  ["glitter-galaxy", {...base,drinkId:"ink-tonic",additives:["glitter"]}],
  ["ink-fountain", {...base,drinkId:"ink-tonic"}],
];
test("six new type-7 collectible definitions have fixed physical structure and independent transparent sprites", () => {
  for (const [id] of candidates) {
    const character=characterById[id], bp=specimenBlueprintById[id+":7"];
    assert.ok(character && bp,id);
    assert.deepEqual(character.types,[7]);
    assert.equal(classifySpecimen(bp),7);
    assert.ok(characterSvg(character,false,7).includes(`/assets/stools/reference-v2/${id}.png`));
    assert.equal(characterSvg(character,true,7),mysterySvg());
  }
  assert.ok(rareRevealTheme(characterById["golden-juice"]));
  assert.ok(rareRevealTheme(characterById["rainbow-falls"]));
  assert.equal(rareRevealTheme(characterById["enoki-jet"]),null);
});
test("ordinary type-7 additions have explicit recipes and rare additions are always reachable", () => {
  for (const [id] of candidates) {
    const recipe = stoolRecipeByCharacterId[id];
    const input = recipe ? { ...base, ...recipe, additives: recipe.requiredAdditive ? [recipe.requiredAdditive] : [], force: { low: 20, medium: 50, high: 90 }[recipe.forceZone] } : base;
    const pool = conditionalDropPool(input, 7);
    assert.ok(pool.some((entry) => entry.characterId === id), id);
    assert.ok(pool.every((entry) => entry.probability >= 0));
  }
  const pool = getOutcomePool(base);
  for (const id of ["golden-juice", "rainbow-falls"])
    assert.ok(Math.abs(pool.find((entry) => entry.characterId === id).probability - 0.002) < 1e-12);
});

test("type-7 rare bonuses share the 5% total budget and never coat an ordinary species", () => {
  for (const additive of ["gold-leaf", "rainbow-sugar"]) {
    const input = { ...base, additives: [additive] };
    assert.ok(Math.abs(specialProbability(input) - 0.05) < 1e-12);
    const pool = getOutcomePool(input);
    assert.ok(pool.every((entry) => entry.special === (characterById[entry.characterId].rarity === "special")));
    assert.ok(pool.every((entry) => !Object.hasOwn(entry, "materialId")));
  }
});
