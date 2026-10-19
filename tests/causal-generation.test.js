import test from "node:test";
import assert from "node:assert/strict";
import { characters } from "../src/content/specimens.js";
import { foodById,drinkById,additiveById,characterById } from "../src/content/catalog.js";
import { stoolRecipes } from "../src/content/stool-recipes.js";
import { getOutcomePool,getRecipeForecast } from "../src/game/outcome-pool.js";
import { rollOutcome } from "../src/game/drops.js";
import { physicalState } from "../src/game/physical-state.js";
import { resolveColor,sourceColor } from "../src/game/color.js";
import { mealSources,sourceAllowed } from "../src/game/source-conditions.js";
import { normalizeSelection } from "../src/game/selection.js";
import { recentMeals } from "./fixtures/最近18次配方.js";
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
const inputFor=r=>({...r,force:{low:20,medium:50,high:90}[r.forceZone],additives:r.requiredAdditive?[r.requiredAdditive]:[]});
function randomSeed(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const ordinary=pool=>pool.filter(entry=>!entry.special);

test("all 46 ideal recipes obey sources and physics and get 80%, or 100% for a sole legal candidate",()=>{
  for(const recipe of stoolRecipes){
    const input=normalizeSelection(inputFor(recipe)),source=mealSources(input),character=characterById[recipe.characterId];
    assert.ok(sourceAllowed(character,source),recipe.characterId);
    assert.equal(physicalState(input).type,character.homeType,recipe.characterId);
    const legal=characters.filter(c=>c.rarity!=="special"&&c.homeType===character.homeType&&sourceAllowed(c,source));
    const forecast=getRecipeForecast(input),pool=getOutcomePool(input);
    assert.equal(forecast.primaryCharacterId,character.id);
    assert.equal(forecast.matchedRecipe.characterId,character.id);
    close(forecast.primaryConditionalProbability,legal.length===1?1:.8);
    close(pool.reduce((sum,e)=>sum+e.probability,0),1);
    if(!recipe.requiredAdditive){const stable=getOutcomePool({...input,additives:["probiotic"]});assert.deepEqual(ordinary(stable).map(e=>e.characterId),[character.id]);close(ordinary(stable)[0].probability,.98);}
  }
});

test("the 18 player meals have only lawful soft shapes and all probiotic meals stabilize soft pillows",()=>{
  for(const {sequence,selection} of recentMeals){
    const forecast=getRecipeForecast(selection),pool=getOutcomePool(selection);
    assert.equal(forecast.primaryCharacterId,"soft-pillows",String(sequence));
    assert.equal(forecast.physicalState.type,5);
    assert.ok(ordinary(pool).every(e=>["soft-pillows","cloud"].includes(e.characterId)));
    const stable=getOutcomePool({...selection,additives:["probiotic"]});
    assert.deepEqual(ordinary(stable).map(e=>e.characterId),["soft-pillows"]);
    close(ordinary(stable)[0].probability,.98);
    close(pool.filter(e=>e.special).reduce((sum,e)=>sum+e.probability,0),selection.additives[0]==="gold-leaf"?.05:.02);
  }
});

test("there is a source-free base for each physical type and randomized legal meals never have an empty pool",()=>{
  for(let type=1;type<=7;type++)assert.ok(characters.some(c=>c.homeType===type&&c.generation?.base&&Object.values(c.generation.sources).every(v=>Array.isArray(v)?!v.length:v===null)));
  const rng=randomSeed(9042),foods=Object.keys(foodById),drinks=Object.keys(drinkById),additives=Object.keys(additiveById);
  for(let i=0;i<240;i++){
    const input=normalizeSelection({foodIds:Array.from({length:1+Math.floor(rng()*3)},()=>foods[Math.floor(rng()*foods.length)]),drinkId:drinks[Math.floor(rng()*drinks.length)],water:250*Math.floor(rng()*6),digestionTime:["2","4","8"][i%3],force:Math.floor(rng()*101),additives:i%3?[additives[Math.floor(rng()*additives.length)]]:[]});
    const state=physicalState(input),source=mealSources(input),pool=getOutcomePool(input);
    assert.ok(ordinary(pool).length>0);
    close(pool.reduce((sum,e)=>sum+e.probability,0),1);
    for(const entry of ordinary(pool)){const c=characterById[entry.characterId];assert.equal(c.homeType,state.type);assert.ok(sourceAllowed(c,source));}
    const stable=ordinary(getOutcomePool({...input,additives:["probiotic"]}));assert.equal(stable.length,1);close(stable[0].probability,.98);
  }
});

test("force changes shape but neither physical type nor food and colour identity budgets",()=>{
  const input={foodIds:["burger","enoki","corn"],drinkId:"prune-juice",water:1250,digestionTime:"2",additives:[]};
  let previous;
  for(const force of [0,20,33,34,50,66,67,90,100]){
    const pool=ordinary(getOutcomePool({...input,force})),groups={};
    for(const entry of pool){assert.equal(characterById[entry.characterId].homeType,7);const id=characterById[entry.characterId].generation.identity;groups[id]=(groups[id]||0)+entry.probability;}
    if(previous)for(const [id,p]of Object.entries(groups))close(p,previous[id]);previous=groups;
  }
});

test("one slider step decays the ideal probability smoothly instead of removing the target",()=>{
  const input={foodIds:["rice"],drinkId:"water",digestionTime:"4",force:50,additives:[]};
  const points=[1000,1250].map(water=>getRecipeForecast({...input,water}));
  assert.ok(points.every(f=>f.primaryCharacterId==="classic"&&f.physicalState.type===4));
  close(points[1].primaryConditionalProbability,.8);
  // V6.1 moves nearby anchors: test a small positive decay, rather than a suggested probability band.
  const decay=points[1].primaryConditionalProbability-points[0].primaryConditionalProbability;
  assert.ok(decay>.01&&decay<.1,`one-step decay: ${decay}`);
  for(let i=1;i<points.length;i++)assert.ok(Math.abs(points[i].primaryConditionalProbability-points[i-1].primaryConditionalProbability)<.16);
  const pools=[1000,1250].map(water=>new Map(getOutcomePool({...input,water}).map(e=>[e.characterId,e.probability])));
  for(let i=1;i<pools.length;i++){
    const ids=new Set([...pools[i-1].keys(),...pools[i].keys()]);
    const totalVariation=[...ids].reduce((sum,id)=>sum+Math.abs((pools[i].get(id)||0)-(pools[i-1].get(id)||0)),0)/2;
    assert.ok(totalVariation<.16, String(totalVariation));
  }
});

test("colour is selected from the meal before drawing an identity and cannot be invented by a character",()=>{
  const plain={foodIds:["rice"],drinkId:"water",water:1250,additives:[]};
  for(const id of ["red-dragon","milk-white","purple-berry","ink-black"])assert.equal(resolveColor(plain,characterById[id]),"classic");
  const ink={...plain,foodIds:["squid-ink-pasta","pear"],drinkId:"prune-juice",water:1250};
  assert.equal(sourceColor(ink).id,"ink");
  assert.equal(resolveColor(ink,characterById["ink-fountain"]),"ink");
  const milk={...ink,foodIds:["rice"],drinkId:"milk"};assert.equal(sourceColor(milk).id,"milk");
  assert.equal(resolveColor({...ink,additives:["charcoal"]},characterById.classic),"ink");
});

test("random-stage preview is the exact mixture of stable per-stage outcomes",()=>{
  const input={...recentMeals[0].selection,additives:["probiotic"],digestionTime:"random"};
  const pool=getOutcomePool(input),expected=new Map();
  for(const digestionTime of ["2","4","8"])for(const entry of getOutcomePool({...input,digestionTime}))expected.set(entry.characterId,(expected.get(entry.characterId)||0)+entry.probability/3);
  for(const entry of pool)close(entry.probability,expected.get(entry.characterId));
  const forecast=getRecipeForecast(input);close(forecast.primaryProbability,pool.find(e=>e.characterId===forecast.primaryCharacterId).probability);
});

test("fixed seeds reproduce actual drops and sampled rates agree with the preview",()=>{
  const inputs=[inputFor(stoolRecipes.find(r=>r.characterId==="classic")),{...recentMeals[0].selection,additives:["probiotic"]},recentMeals[0].selection];
  for(const [index,input]of inputs.entries()){
    const pool=getOutcomePool(input),counts=new Map(),rng=randomSeed(8123+index),n=4000;
    const first=rollOutcome(input,randomSeed(444));assert.deepEqual(first,rollOutcome(input,randomSeed(444)));
    for(let i=0;i<n;i++){const outcome=rollOutcome(input,rng);counts.set(outcome.characterId,(counts.get(outcome.characterId)||0)+1);assert.ok(pool.some(e=>e.characterId===outcome.characterId));}
    for(const entry of pool){const observed=(counts.get(entry.characterId)||0)/n;assert.ok(Math.abs(observed-entry.probability)<Math.max(.008,5*Math.sqrt(entry.probability*(1-entry.probability)/n)),`${entry.characterId}: ${observed} vs ${entry.probability}`);}
    const forecast=getRecipeForecast(input);close(forecast.primaryProbability,pool.find(e=>e.characterId===forecast.primaryCharacterId).probability);
  }
});

test("every ideal meal has smooth adjacent intake distributions when physics and sources stay unchanged",()=>{
  let checked=0;
  for(const recipe of stoolRecipes){
    let previous;
    for(let water=0;water<=1250;water+=250){
      const input=normalizeSelection({...inputFor(recipe),water}),state=physicalState(input),sources=mealSources(input);
      const legal=characters.filter(c=>c.rarity!=="special"&&c.homeType===state.type&&sourceAllowed(c,sources)).map(c=>c.id).sort().join(',');
      const pool=new Map(getOutcomePool(input).map(e=>[e.characterId,e.probability]));
      if(previous&&previous.type===state.type&&previous.legal===legal){
        const ids=new Set([...pool.keys(),...previous.pool.keys()]);
        const variation=[...ids].reduce((sum,id)=>sum+Math.abs((pool.get(id)||0)-(previous.pool.get(id)||0)),0)/2;
        assert.ok(variation<.16,`${recipe.characterId} at ${water}: ${variation}`);checked++;
      }
      previous={type:state.type,legal,pool};
    }
  }
  assert.ok(checked>=stoolRecipes.length*2,`${checked} eligible adjacent pairs`);
});

test("porosity changes actual soft-shape probabilities without inventing a new source or changing type",()=>{
  // Pear isolates the trait effect. Marshmallow also moves the V6.1 cloud recipe's ideal traits.
  for(const {id,minGain,monotonic} of [{id:'pear',minGain:.05,monotonic:true},{id:'marshmallow-foam',minGain:.04,monotonic:false}]){
    const food=foodById[id],original=food.attributes.porosity;
    const input={foodIds:[id],drinkId:'water',water:1250,digestionTime:'4',force:50,additives:[]};
    const probabilities=[];
    try{
      for(const porosity of [1,2,3,4,5,6,7]){
        food.attributes.porosity=porosity;
        assert.equal(physicalState(input).type,5);
        const pool=ordinary(getOutcomePool(input));
        assert.ok(pool.every(e=>['cloud','soft-pillows'].includes(e.characterId)));
        probabilities.push(pool.find(e=>e.characterId==='cloud').probability/pool.reduce((sum,e)=>sum+e.probability,0));
      }
      assert.ok(probabilities.at(-1)>probabilities[0]+minGain,`${id} porosity effect: ${probabilities.at(-1)-probabilities[0]}`);
      if(monotonic)for(let i=1;i<probabilities.length;i++)assert.ok(probabilities[i]>=probabilities[i-1],`${id} porosity ${i+1} reduced cloud probability`);
    }finally{food.attributes.porosity=original;}
  }
});
