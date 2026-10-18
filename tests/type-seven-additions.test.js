import test from "node:test";
import assert from "node:assert/strict";
import { characterById } from "../src/content/catalog.js";
import { specimenBlueprintById } from "../src/content/specimen-blueprints.js";
import { conditionalDropPool, getOutcomePool, specialProbability } from "../src/game/drops.js";
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
test("six new type-7 collectible definitions have fixed physical structure and dedicated atlas art", () => {
  for (const [id] of candidates) {
    const character=characterById[id], bp=specimenBlueprintById[id+":7"];
    assert.ok(character && bp,id);
    assert.deepEqual(character.types,[7]);
    assert.equal(classifySpecimen(bp),7);
    assert.match(characterSvg(character,false,7),/water-type-seven-atlas\.jpg/);
    assert.equal(characterSvg(character,true,7),mysterySvg());
  }
  assert.ok(rareRevealTheme(characterById["golden-juice"]));
  assert.ok(rareRevealTheme(characterById["rainbow-falls"]));
  assert.equal(rareRevealTheme(characterById["enoki-jet"]),null);
});
test("all six candidates can enter the seventh form pool, with correct prerequisites", () => {
  for (const [id,recipe] of candidates) {
    const pool=conditionalDropPool(recipe,7);
    assert.ok(pool.some(x=>x.characterId===id),id);
    assert.ok(pool.every(x=>x.probability>=0));
  }
  const ids=(recipe)=>conditionalDropPool(recipe,7).map(x=>x.characterId);
  assert.ok(!ids(base).includes("golden-juice"));
  assert.ok(!ids(base).includes("rainbow-falls"));
  assert.ok(!ids(base).includes("glitter-galaxy"));
  assert.ok(!ids({...base,foodIds:["enoki"],force:20}).includes("enoki-jet"));
  assert.ok(!ids({...base,foodIds:["corn"],force:20}).includes("corn-cannon"));
  assert.ok(!ids({...base,drinkId:"ink-tonic",force:20}).includes("ink-fountain"));
});
test("new rare type-7 entries remain chance-gated under shared 0.5% cap", () => {
  const input={...base,foodIds:["enoki","corn"],drinkId:"prism-soda",additives:["gold-leaf","rainbow-sugar","glitter"]};
  const pool=conditionalDropPool(input,7);
  assert.ok(pool.some(x=>x.characterId==="golden-juice"));
  assert.ok(pool.some(x=>x.characterId==="rainbow-falls"));
  assert.ok(pool.filter(x=>x.special).every(x=>x.probability<1));
  assert.ok(specialProbability(input)<=0.005+1e-12);
});
