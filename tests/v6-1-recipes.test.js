import test from "node:test";
import assert from "node:assert/strict";
import { characterById, drinkById } from "../src/content/catalog.js";
import { stoolRecipes, stoolRecipeByCharacterId } from "../src/content/stool-recipes.js";
import { rareThemeRecipes, rareThemeRecipeById } from "../src/content/rare-theme-recipes.js";
import { physicalState } from "../src/game/physical-state.js";
import { getOutcomePool, getRecipeForecast } from "../src/game/outcome-pool.js";
import { mealSources, sourceAllowed } from "../src/game/source-conditions.js";

// 2026-10-19 V6.1: ID、食物、饮料、唯一饮用量、阶段、力度，稀有另含功能剂。
const ordinary = `pebble rice,toast,egg water 250 8 high
marble-pebbles toast,almonds water 250 8 high
sesame-charcoal toast,almonds,black-sesame water 250 8 high
cocoa-truffle toast,popping-chocolate coffee 250 8 medium
massage-beads red-beans,chickpeas,almonds water 500 8 medium
segmented toast,wholewheat water 750 8 high
stone-tower brown-rice,fried-insects,almonds water 500 8 high
stacked-stones brown-rice,egg water 750 8 high
bran-log wholewheat,bamboo-shoots water 750 4 medium
cracked toast,egg water 750 4 high
wood-grain wholewheat,brown-rice,egg water 750 4 high
oat-speckle oatmeal,almonds water 1000 8 medium
beet-red toast,beetroot water 750 4 high
bread toast,potato water 500 4 medium
amber-honey pumpkin,wholewheat water 750 4 medium
spiral rice,okra water 750 4 low
long-rope rice,konjac water 750 4 high
enoki-thread rice,enoki water 750 4 medium
warm-coil sweet-potato,pumpkin water 750 4 low
garden rice,spinach water 750 4 medium
red-dragon rice,dragon-fruit water 750 4 medium
gold-flake brown-rice,black-sesame water 750 2 medium
petal rice,rose-cake water 750 4 medium
squat-spring rice,natto,okra water 750 4 high
silver-speckle rice,yogurt water 750 4 medium
glitter rice,rainbow-crayon water 1000 2 medium
ribbon oatmeal,okra water 750 4 medium
classic rice water 1250 4 medium
banana-curve rice,banana,apple water 750 4 low
milk-white rice,yogurt milk 1250 2 low
corn-pebbles rice,corn,pear water 1250 2 medium
purple-berry oatmeal,prune prune-juice 750 4 medium
soft-pillows potato,pumpkin water 1250 4 low
cloud oatmeal,marshmallow-foam soda 1250 4 low
coffee rice,red-beans coffee 1250 2 medium
popping banana,popping-chocolate soda 1250 2 high
mashed-potato potato,pumpkin water 1250 2 low
fire rice,hotpot,snail-noodles milk 750 2 high
bubbly pear,prune soda 1250 2 medium
jet burger coffee 1250 2 high
ink-fountain squid-ink-pasta,pear,burger prune-juice 1250 2 high
pancake rice,pear,prune prune-juice 1250 2 low
enoki-jet burger,enoki milk 1250 2 high
ink-black squid-ink-pasta,pear,burger prune-juice 1250 2 low
corn-cannon burger,corn prune-juice 1250 2 high
glitter-galaxy squid-ink-pasta,prune,burger soda 1250 2 medium`.trim().split("\n");
const rare = `meteor wholewheat,meteor-cookie water 250 8 high stardust
frost-crystal toast,yogurt milk 750 8 high frost-salt
crystal brown-rice,bamboo-shoots mineral-tonic 750 4 medium crystal-seed
amber-fossil sweet-potato,wholewheat bubble-tea 750 4 medium amber-resin
gold rice,pumpkin water 1250 4 medium gold-leaf
rainbow rice,dragon-fruit prism-soda 1250 4 medium rainbow-sugar
jelly oatmeal,konjac grass-jelly 1250 2 low gelatin
luminous oatmeal,yogurt,banana glow-soda 1250 2 low stardust
golden-juice pear,prune prune-juice 1250 2 low gold-leaf
rainbow-falls dragon-fruit,prune,burger prism-soda 1250 2 high rainbow-sugar`.trim().split("\n");
const force = {low:20,medium:50,high:90};
function decode(row){
  const [id,foods,drinkId,water,digestionTime,forceZone,additiveId]=row.split(" ");
  return {id,foodIds:foods.split(","),drinkId,water:Number(water),digestionTime,forceZone,additiveId};
}
test("V6.1: 46 normal recipes are complete and have the intended actual type, source and anchor",()=>{
  assert.equal(stoolRecipes.length,46);
  assert.equal(ordinary.length,46);
  const seen=new Set();
  for(const line of ordinary){
    const expected=decode(line),r=stoolRecipeByCharacterId[expected.id];
    assert.ok(r,expected.id);
    for(const key of ["foodIds","drinkId","water","digestionTime","forceZone"])
      assert.deepEqual(r[key],expected[key],`${expected.id}: ${key}`);
    const unique=JSON.stringify([[...r.foodIds].sort(),r.drinkId,r.water,r.digestionTime,r.forceZone]);
    assert.ok(!seen.has(unique),expected.id);seen.add(unique);
    const meal={...r,force:force[r.forceZone],additives:r.requiredAdditive?[r.requiredAdditive]:[]};
    assert.equal(physicalState(meal).type,characterById[r.characterId].homeType,r.characterId);
    assert.ok(sourceAllowed(characterById[r.characterId],mealSources(meal)),r.characterId);
    assert.equal(characterById[r.characterId].generation.forceZone,r.forceZone,`${r.characterId}: shape preference must match the V6.1 recipe`);
    assert.equal(getRecipeForecast(meal).matchedRecipe?.characterId,r.characterId);
    const pool=getOutcomePool(meal).filter(x=>!x.special);
    const p=pool.find(x=>x.characterId===r.characterId)?.probability;
    const ordinaryTotal=pool.reduce((sum,x)=>sum+x.probability,0);
    assert.ok(Math.abs(p/ordinaryTotal-(pool.length===1?1:.8))<1e-10,`${r.characterId}: ${p}`);
  }
});
test("V6.1: 10 rare themes are aligned but never treated as guaranteed recipes",()=>{
  assert.equal(rareThemeRecipes.length,10);
  assert.equal(rare.length,10);
  for(const line of rare){
    const expected=decode(line),r=rareThemeRecipeById[expected.id];
    assert.ok(r,expected.id);
    for(const key of ["foodIds","drinkId","water","digestionTime","forceZone","additiveId"])
      assert.deepEqual(r[key],expected[key],`${expected.id}: ${key}`);
    assert.equal(physicalState({...r,force:force[r.forceZone],additives:[r.additiveId]}).type,characterById[r.characterId].homeType,r.characterId);
  }
});
test("milk and explicitly functional chili have transparent effects without a hidden combo",()=>{
  assert.equal(drinkById.milk.wetnessBias,0.5);
  const meal={foodIds:["burger","enoki"],drinkId:"milk",water:250,digestionTime:"2",additives:["chili"],force:90};
  const state=physicalState(meal);
  assert.equal(state.type,6);
  assert.ok(Math.abs(state.score-1.872222222222222)<1e-9,state.score);
  assert.equal(state.additiveBonus,0.5);
  assert.equal(Object.hasOwn(state,"rapidIrritant"),false);
  assert.equal(physicalState({...meal,force:20}).type,6);
  assert.equal(physicalState({...meal,additives:[]}).type,6);
  for(const patch of [{water:0},{drinkId:"water"},{digestionTime:"4"},{foodIds:["rice","enoki"]}])
    assert.equal(physicalState({...meal,...patch}).additiveBonus,.5,JSON.stringify(patch));
  assert.ok(!getOutcomePool(meal).some(x=>x.characterId==="enoki-jet"));
  for(const [id,expected] of [["milk-white",5],["fire",6],["enoki-jet",7]]){
    const r=stoolRecipeByCharacterId[id];
    assert.equal(physicalState({...r,force:force[r.forceZone],additives:[]}).type,expected,id);
  }
});
