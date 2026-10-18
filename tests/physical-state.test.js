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
const inputFor = recipe => ({ ...recipe, force: {low:20,medium:50,high:90}[recipe.forceZone], additives: recipe.requiredAdditive ? [recipe.requiredAdditive] : [] });
const base = inputFor(stoolRecipeByCharacterId.classic);

test("all 46 ordinary centres and ten rare themes agree with their actual physical types", () => {
  for (const recipe of [...stoolRecipes, ...rareThemeRecipes]) {
    const input = inputFor(recipe);
    assert.equal(physicalState(input).type, characterById[recipe.characterId].homeType, recipe.characterId);
  }
  assert.deepEqual(stoolRecipeByCharacterId["enoki-jet"].foodIds, ["burger", "enoki"]);
  assert.equal(stoolRecipeByCharacterId["enoki-jet"].drinkId, "milk");
  assert.equal(stoolRecipeByCharacterId["enoki-jet"].forceZone, "high");
  assert.equal(characterById["enoki-jet"].homeType, 7);
});

test("the same rice meal moves through types 2, 3, 4 and 6 using only drink intake and digestion phase", () => {
  for (const [water, digestionTime, type, score] of [[250,"8",2,-1.9],[500,"4",3,-.8],[1500,"4",4,.2],[2500,"2",6,1.75]]) {
    const input = { ...base, water, digestionTime, additives:["probiotic"] };
    const state = physicalState(input);
    assert.equal(state.type,type); close(state.score,score);
    assert.equal(Object.hasOwn(normalizeSelection(input), "drinkVolume"), false);
    for (const entry of getOutcomePool(input).filter(entry=>!entry.special)) assert.equal(characterById[entry.characterId].homeType,type);
  }
  assert.equal(typeFromWetness(-2.3),1);
  assert.equal(typeFromWetness(2.2),6);
  assert.equal(typeFromWetness(2.20001),7);
});

test("force cannot turn a dry physical class into water and all same-type neighbours retain legal probability", () => {
  for (const force of [0,33,34,66,67,100]) {
    const input = {...base,water:250,digestionTime:"8",force};
    assert.equal(physicalState(input).type,2);
    assert.ok(getOutcomePool(input).filter(entry=>!entry.special).every(entry=>characterById[entry.characterId].homeType===2));
  }
  for (const change of [{water:1250},{water:1750}]) {
    const input = {...base,...change};
    assert.equal(getRecipeForecast(input).matchedRecipe,null);
    const probability=getOutcomePool(input).find(entry=>entry.characterId==="classic")?.probability;
    assert.ok(probability>0 && probability<.784);
  }
});

test("decorated species require the same material in both the fixed target and the free pool", () => {
  for (const recipe of stoolRecipes.filter(recipe=>recipe.requiredAdditive)) {
    const input=inputFor(recipe);
    assert.equal(getRecipeForecast(input).matchedRecipe.characterId,recipe.characterId);
    for(const additives of [[],["probiotic"],["chili"]]) {
      const changed={...input,additives};
      assert.equal(getRecipeForecast(changed).matchedRecipe,null);
      assert.ok(!getOutcomePool(changed).some(entry=>entry.characterId===recipe.characterId));
    }
  }
});

test("rice and pumpkin never produce an enoki species, including a watery high-intake meal", () => {
  for (const water of [1500, 2500]) for (const digestionTime of ["2", "4", "8", "random"]) for (const force of [20, 59, 90]) {
    const input = { foodIds: ["rice", "pumpkin"], drinkId: "grass-jelly", water, digestionTime, force, additives: ["gold-leaf"] };
    const pool = getOutcomePool(input);
    assert.ok(!pool.some(entry => ["enoki-thread", "enoki-jet"].includes(entry.characterId)), JSON.stringify(input));
    close(pool.reduce((sum, entry) => sum + entry.probability, 0), 1);
    close(pool.filter(entry => entry.special).reduce((sum, entry) => sum + entry.probability, 0), .05);
    assert.equal(pool.filter(entry => entry.special).length, 10);
  }
});

test("eating enoki permits its same-type free candidate while exact guarantees stay 80% and 100%", () => {
  const input = inputFor(stoolRecipeByCharacterId["enoki-jet"]);
  assert.ok(getOutcomePool({ ...input, force: 59 }).some(entry => entry.characterId === "enoki-jet" && entry.probability > 0));
  for (const [additives, probability] of [[[], .784], [["probiotic"], .98]])
    close(getOutcomePool({ ...input, additives }).find(entry => entry.characterId === "enoki-jet").probability, probability);
});

test("the sole drink amount scales moisture, beverage strength and bubbles while long digestion retains enoki", () => {
  const state=physicalState({...base,water:500});
  close(state.waterBonus,-.8);
  const small=normalizeSelection({...base,drinkId:"soda",water:250});
  const large={...small,water:2500};
  assert.ok(collectEffects(large).drinkPorosity>collectEffects(small).drinkPorosity);
  assert.ok(physicalState({...base,drinkId:"coffee",water:2500}).drinkBonus>physicalState({...base,drinkId:"coffee",water:250}).drinkBonus);
  const strength=water=>resolveColorStrength({...base,drinkId:"prune-juice",water},characterById.classic);
  assert.ok(strength(250)<strength(1500));
  const appearance=digestionTime=>{const input=normalizeSelection({...base,foodIds:["enoki","corn"],digestionTime});return foodAppearance(input,collectEffects(input),7);};
  assert.ok(appearance("2").enokiRetention>appearance("8").enokiRetention);
  assert.ok(appearance("8").enokiRetention>=2);
  assert.ok(appearance("2").residues[0].retention>appearance("8").residues[0].retention);
});

test("random phases lock once, preserve drink intake and phase through reload and the first saved individual", () => {
  for(const [draw,phase] of [[0,"2"],[.5,"4"],[.999,"8"]]) {
    const session=createAimingSession({...base,digestionTime:"random"},{now:1000,random:()=>draw});
    assert.equal(session.digestionTime,phase);
    lockSessionForce(session,{now:1750,random:()=>.5});
    assert.deepEqual(restoreSession(session),session);
    const save=normalizeSave({session});
    settleSession(save,session.endsAt);
    assert.equal(save.individuals[0].recipe.digestionTime,phase);
    assert.equal(Object.hasOwn(save.individuals[0].recipe, "drinkVolume"), false);
    assert.equal(save.individuals[0].recipe.water,1500);
    close(getOutcomePool({...base,digestionTime:phase}).filter(entry=>entry.special).reduce((sum,entry)=>sum+entry.probability,0),.02);
  }
});

test("existing food knobs stay authoritative and the two new foods have separate defaults", () => {
  const original=structuredClone(foodById.toast.attributes);
  const before=foodWetness(foodById.toast);
  try { foodById.toast.attributes.softness=7; assert.ok(foodWetness(foodById.toast)<before); }
  finally { foodById.toast.attributes=original; }
  assert.ok(foodById.beetroot && foodById.potato);
  const configured=JSON.parse(readFileSync(new URL('../src/content/food-attribute-values.js',import.meta.url),'utf8').match(/=\s*([\s\S]*);/)[1]);
  for(const [id,attributes] of Object.entries(configured)) assert.deepEqual(foodById[id].attributes,attributes,id);
  assert.equal(normalizeSelection({water:-500}).water,250);
  assert.equal(normalizeSelection({water:9999}).water,2500);
});
