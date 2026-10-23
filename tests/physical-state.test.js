import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { foodById, characterById } from "../src/content/catalog.js";
import { stoolRecipes, stoolRecipeByCharacterId } from "../src/content/stool-recipes.js";
import { rareThemeRecipes } from "../src/content/rare-theme-recipes.js";
import { physicalState, typeFromWetness } from "../src/game/physical-state.js";
import { getOutcomePool, getRecipeForecast } from "../src/game/outcome-pool.js";
import { createAimingSession, lockSessionForce, settleSession, restoreSession } from "../src/game/session.js";
import { normalizeSave } from "../src/storage/model.js";
import { normalizeSelection } from "../src/game/selection.js";
import { collectEffects } from "../src/game/effects.js";
import { foodAppearance } from "../src/game/food-appearance.js";
import { resolveColorStrength } from "../src/game/color.js";
import { foodWetness } from "../src/content/food-wetness.js";

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
const inputFor = recipe => ({ ...recipe, additives: recipe.requiredAdditive ? [recipe.requiredAdditive] : recipe.additiveId ? [recipe.additiveId] : [] });
const base = inputFor(stoolRecipeByCharacterId.classic);

test("all ordinary recommendations and rare theme examples fit their pictured physical types without digestion time", () => {
  for (const recipe of [...stoolRecipes, ...rareThemeRecipes]) {
    assert.equal(physicalState(inputFor(recipe)).type, characterById[recipe.characterId].homeType, recipe.characterId);
    assert.equal(Object.hasOwn(recipe, "digestionTime"), false);
    assert.ok(["low", "medium", "high"].includes(recipe.forceZone));
  }
  assert.deepEqual(stoolRecipeByCharacterId["enoki-jet"].foodIds, ["burger", "enoki"]);
  assert.equal(stoolRecipeByCharacterId["enoki-jet"].drinkId, "milk");
  assert.equal(characterById["enoki-jet"].homeType, 7);
});

test("the rice meal responds monotonically to the six drink intake choices", () => {
  for (const [water, type, score] of [[0,2,-2],[250,2,-1.5],[500,3,-1],[750,4,-.5],[1000,4,0],[1250,4,.5]]) {
    const input = { ...base, water, additives:["probiotic"] };
    const state = physicalState(input);
    assert.equal(state.type,type); close(state.score,score);
    assert.equal(Object.hasOwn(normalizeSelection(input), "drinkVolume"), false);
    for (const entry of getOutcomePool(input).filter(entry=>!entry.special)) assert.equal(characterById[entry.characterId].homeType,type);
  }
  assert.equal(typeFromWetness(-2.3),1);
  assert.equal(typeFromWetness(2.2),6);
  assert.equal(typeFromWetness(2.20001),7);
});

test("force keeps the physical class and nearby intake choices retain legal variety", () => {
  const dry = {...base,water:250};
  for (const force of [0,33,34,66,67,100]) {
    const input = {...dry,force};
    assert.equal(physicalState(input).type,2);
    assert.ok(getOutcomePool(input).filter(entry=>!entry.special).every(entry=>characterById[entry.characterId].homeType===2));
  }
  for (const water of [750,1000,1250]) {
    const input = {...base,water}, ordinary=getOutcomePool(input).filter(entry=>!entry.special);
    assert.ok(ordinary.length>1);
    assert.ok(ordinary.every(entry=>characterById[entry.characterId].homeType===4 && entry.probability>0));
  }
});

test("decorated species require their saved material source in recommended and improvised combinations", () => {
  for (const recipe of stoolRecipes.filter(recipe=>recipe.requiredAdditive)) {
    const input=inputFor(recipe);
    assert.ok(getOutcomePool(input).some(entry=>entry.characterId===recipe.characterId && entry.probability>0));
    for(const additives of [[],["probiotic"],["chili"]]) {
      assert.ok(!getOutcomePool({...input,additives}).some(entry=>entry.characterId===recipe.characterId));
    }
  }
});

test("rice and pumpkin never produce an enoki species, including a watery high-intake meal", () => {
  for (const water of [0, 1250]) for (const force of [20, 59, 90]) {
    const input = { foodIds: ["rice", "pumpkin"], drinkId: "grass-jelly", water, force, additives: ["gold-leaf"] };
    const pool = getOutcomePool(input);
    assert.ok(!pool.some(entry => ["enoki-thread", "enoki-jet"].includes(entry.characterId)), JSON.stringify(input));
    close(pool.reduce((sum, entry) => sum + entry.probability, 0), 1);
    close(pool.filter(entry => entry.special).reduce((sum, entry) => sum + entry.probability, 0), .2);
    assert.equal(pool.filter(entry => entry.special).length, 2);
  }
});

test("enoki remains available in matching physical states and probiotic stabilizes the current meal's primary outcome", () => {
  const input = inputFor(stoolRecipeByCharacterId["enoki-jet"]);
  assert.ok(getOutcomePool(input).some(entry => entry.characterId === "enoki-jet" && entry.probability > 0));
  const stabilized={...input,additives:["probiotic"]},forecast=getRecipeForecast(stabilized);
  const ordinary=getOutcomePool(stabilized).filter(entry=>!entry.special);
  assert.deepEqual(ordinary.map(entry=>entry.characterId),[forecast.primaryCharacterId]);
  close(ordinary[0].probability,.98);
});

test("the sole drink amount scales moisture, beverage strength and bubbles while food alone determines residues", () => {
  close(physicalState({...base,water:500}).waterBonus,-1);
  const small=normalizeSelection({...base,drinkId:"soda",water:250});
  const large={...small,water:1250};
  assert.ok(collectEffects(large).drinkPorosity>collectEffects(small).drinkPorosity);
  assert.ok(physicalState({...base,drinkId:"coffee",water:1250}).drinkBonus>physicalState({...base,drinkId:"coffee",water:250}).drinkBonus);
  const strength=water=>resolveColorStrength({...base,drinkId:"prune-juice",water},characterById.classic);
  assert.ok(strength(250)<strength(1250));
  const appearance=digestionTime=>{const input=normalizeSelection({...base,foodIds:["enoki","corn"],digestionTime});return foodAppearance(input,collectEffects(input),7);};
  assert.deepEqual(appearance("2"),appearance("8"));
  assert.ok(appearance("8").enokiRetention>=2);
});

test("round reload and first saved individual preserve drink intake without a digestion phase", () => {
  const session=createAimingSession({...base,digestionTime:"random"},{now:1000,random:()=>0});
  assert.equal(Object.hasOwn(session,"digestionTime"),false);
  lockSessionForce(session,{now:1750,random:()=>.5});
  assert.deepEqual(restoreSession(session),session);
  const save=normalizeSave({session});
  settleSession(save,session.endsAt);
  assert.equal(Object.hasOwn(save.individuals[0].recipe,"digestionTime"),false);
  assert.equal(Object.hasOwn(save.individuals[0].recipe,"drinkVolume"),false);
  assert.equal(save.individuals[0].recipe.water,base.water);
  close(getOutcomePool(base).filter(entry=>entry.special).reduce((sum,entry)=>sum+entry.probability,0),.02);
});

test("existing food knobs stay authoritative and the two new foods have separate defaults", () => {
  const original=structuredClone(foodById.toast.attributes);
  const before=foodWetness(foodById.toast);
  try { foodById.toast.attributes.softness=7; assert.ok(foodWetness(foodById.toast)<before); }
  finally { foodById.toast.attributes=original; }
  assert.ok(foodById.beetroot && foodById.potato);
  const configured=JSON.parse(readFileSync(new URL('../src/content/food-attribute-values.js',import.meta.url),'utf8').match(/=\s*([\s\S]*);/)[1]);
  for(const [id,attributes] of Object.entries(configured)) assert.deepEqual(foodById[id].attributes,attributes,id);
  assert.equal(normalizeSelection({water:-500}).water,0);
  assert.equal(normalizeSelection({water:9999}).water,1250);
});
