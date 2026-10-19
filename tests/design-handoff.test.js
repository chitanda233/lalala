import test from "node:test";
import assert from "node:assert/strict";
import { characters } from "../src/content/specimens.js";
import { additives } from "../src/content/additives.js";
import { additiveById, characterById } from "../src/content/catalog.js";
import { physicalState } from "../src/game/physical-state.js";
import { rareBudget } from "../src/game/rare-probabilities.js";
import { getOutcomePool, getRecipeForecast, recipeProperties } from "../src/game/outcome-pool.js";
import { rollOutcome } from "../src/game/drops.js";
import { createSession, restoreSession, settleSession } from "../src/game/session.js";
import { normalizeSave } from "../src/storage/model.js";
import { characterSvg } from "../src/ui/artwork/stools.js";
import { contentValues } from "../src/content/managed-content.js";
import { validateManagedContent } from "../admin/content-schema.js";

const input = {foodIds:["rice"],drinkId:"water",water:1250,digestionTime:"4",force:50,additives:[]};
const rareIds = characters.filter(c=>c.rarity==="special").map(c=>c.id);
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const sum = entries => entries.reduce((s,e)=>s+e.probability,0);

test("without an associated group all rare species share 2%, even with probiotic or unrelated food",()=>{
  for(const meal of [input,{...input,additives:["probiotic"]},{...input,foodIds:["toast"],water:0,digestionTime:"8"}]){
    const pool=getOutcomePool(meal),rares=pool.filter(e=>e.special);
    assert.deepEqual(new Set(rares.map(e=>e.characterId)),new Set(rareIds));
    close(sum(rares),.02);
    for(const entry of rares)close(entry.probability,.02/rareIds.length);
    close(sum(pool),1);
  }
});

test("every configured additive uses its own exclusive 20% group, never just gold",()=>{
  for(const additive of additives.filter(a=>a.rareTargets.length)){
    const pool=getOutcomePool({...input,additives:[additive.id]}),rares=pool.filter(e=>e.special);
    assert.deepEqual(new Set(rares.map(e=>e.characterId)),new Set(additive.rareTargets),additive.id);
    for(const entry of rares)close(entry.probability,.2/additive.rareTargets.length);
    close(sum(rares),.2);close(sum(pool.filter(e=>!e.special)),.8);close(sum(pool),1);
    const forecast=getRecipeForecast({...input,additives:[additive.id]});
    close(forecast.rareProbability,.2);close(forecast.primaryProbability,.64);
    assert.ok(pool.some(e=>!e.special));
  }
});

test("one, two, three or more configured targets share one budget and all other rares are excluded",()=>{
  const additive=additiveById.glitter,original=additive.rareTargets;
  try{
    for(const count of [1,2,3,rareIds.length]){
      additive.rareTargets=rareIds.slice(-count);
      const pool=getOutcomePool({...input,additives:[additive.id]}),rares=pool.filter(e=>e.special);
      assert.equal(rares.length,count);
      for(const entry of rares){assert.ok(additive.rareTargets.includes(entry.characterId));close(entry.probability,.2/count);}
      close(sum(pool),1);close(sum(rares),.2);
    }
  }finally{additive.rareTargets=original;}
});

test("the budget scales to a larger catalogue and never duplicates or counts invalid targets",()=>{
  const ids=Array.from({length:50},(_,i)=>`future-rare-${i}`);
  const baseline=rareBudget(null,ids);
  for(const e of baseline.entries)close(e.probability,.02/50);
  const boosted=rareBudget({rareTargets:[ids[3],ids[4],ids[5],ids[3],"unknown"]},ids);
  assert.equal(boosted.targets.length,3);close(boosted.rareProbability,.2);close(boosted.ordinaryProbability,.8);
  assert.ok(boosted.entries.filter(e=>e.probability>0).every(e=>boosted.targets.includes(e.characterId)));
  close(rareBudget({rareTargets:["unknown"]},ids).rareProbability,.02);
});

test("visual additives cannot change Bristol type or selection traits unless explicitly functional",()=>{
  const reference=physicalState(input),properties=recipeProperties(input);
  for(const additive of additives.filter(a=>!a.functional&&a.id!=="probiotic")){
    const meal={...input,additives:[additive.id]};
    assert.deepEqual(physicalState(meal),reference,additive.id);
    assert.deepEqual(recipeProperties(meal),properties,additive.id);
  }
  const glitter=additiveById.glitter,original=glitter.propertyChanges;
  try{
    glitter.propertyChanges={hardness:-6,cohesion:-6,porosity:6};
    assert.deepEqual(physicalState({...input,additives:["glitter"]}),reference);
    assert.deepEqual(recipeProperties({...input,additives:["glitter"]}),properties);
  }finally{if(original)glitter.propertyChanges=original;else delete glitter.propertyChanges;}
  close(physicalState({...input,additives:["chili"]}).score-reference.score,.5);
  close(physicalState({...input,additives:["oil"]}).score-reference.score,.5);
});

test("force changes legal subtypes and food structure matters without changing computed Bristol type",()=>{
  const pools=[20,50,90].map(force=>getOutcomePool({...input,force}).filter(e=>!e.special));
  assert.notDeepEqual(pools[0],pools[1]);assert.notDeepEqual(pools[1],pools[2]);
  for(const force of [0,20,50,90,100]){
    assert.equal(physicalState({...input,force}).type,4);
    assert.ok(getOutcomePool({...input,force}).filter(e=>!e.special).every(e=>characterById[e.characterId].homeType===4));
  }
  const changed={...input,foodIds:["rice","okra"],water:750};
  assert.equal(physicalState(changed).type,4);
  assert.notDeepEqual(getOutcomePool(changed).filter(e=>!e.special),pools[1]);
});

test("visual effects render on the chosen shape and persist through a locked round and saved birth",()=>{
  for(const additive of additives.filter(a=>a.visualEffect)){
    const session=createSession({...input,additives:[additive.id]},{now:1000,random:()=>.5});
    assert.equal(session.outcome.type,4);assert.equal(session.outcome.characterId,"classic");
    assert.deepEqual(session.outcome.appearance.visualEffects,[additive.visualEffect]);
    assert.deepEqual(restoreSession(session),session);
    const svg=characterSvg(characterById.classic,false,4,session.outcome.colorId,[],session.outcome.appearance);
    assert.ok(svg.includes(`data-visual-effect="${additive.visualEffect}"`),additive.id);
    const save=normalizeSave({session});settleSession(save,session.endsAt);
    assert.deepEqual(normalizeSave(save).individuals[0].appearance.visualEffects,[additive.visualEffect]);
  }
});

test("rare draws keep their own fixed shapes and use one outcome draw plus one surface seed",()=>{
  const pool=getOutcomePool({...input,additives:["crystal-seed"]});
  const index=pool.findIndex(e=>e.characterId==="crystal");
  const value=sum(pool.slice(0,index))+pool[index].probability/2;
  let calls=0;
  const result=rollOutcome({...input,additives:["crystal-seed"]},()=>++calls===1?value:.5);
  assert.equal(result.characterId,"crystal");assert.equal(result.type,characterById.crystal.homeType);
  assert.equal(calls,2);
});

test("fixed-seed real draws agree with previews and cannot leak into an excluded rare group",()=>{
  const additive=additiveById.glitter,original=additive.rareTargets;
  try{
    additive.rareTargets=rareIds.slice(-3);
    const meal={...input,additives:["glitter"]},pool=getOutcomePool(meal),counts=new Map();
    let seed=83201;
    const random=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
    const n=8000;
    for(let i=0;i<n;i++){
      const outcome=rollOutcome(meal,random);
      if(outcome.special)assert.ok(additive.rareTargets.includes(outcome.characterId));
      counts.set(outcome.characterId,(counts.get(outcome.characterId)||0)+1);
    }
    for(const entry of pool)assert.ok(Math.abs((counts.get(entry.characterId)||0)/n-entry.probability)<.018,entry.characterId);
  }finally{additive.rareTargets=original;}
});

test("managed content round-trips explicit functional and visual settings",()=>{
  assert.deepEqual(validateManagedContent(structuredClone(contentValues)),contentValues);
  const draft=structuredClone(contentValues),item=draft.additives.find(a=>a.id==="glitter");
  item.functional=true;item.visualEffect="crystal";item.propertyChanges={hardness:1};
  const saved=validateManagedContent(draft).additives.find(a=>a.id==="glitter");
  assert.equal(saved.functional,true);assert.equal(saved.visualEffect,"crystal");
});
