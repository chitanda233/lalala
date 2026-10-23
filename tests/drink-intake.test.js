import test from 'node:test';
import assert from 'node:assert/strict';
import { gameConfig } from '../src/config/game.js';
import { drinks } from '../src/content/drinks.js';
import { normalizeSelection } from '../src/game/selection.js';
import { physicalState } from '../src/game/physical-state.js';
import { sourceColor } from '../src/game/color.js';
import { collectEffects } from '../src/game/effects.js';
import { mealSources } from '../src/game/source-conditions.js';
import { getOutcomePool } from '../src/game/outcome-pool.js';
import { createSession, settleSession } from '../src/game/session.js';
import { normalizeSave } from '../src/storage/model.js';
import { contentValues } from '../src/content/managed-content.js';
import { validateManagedContent } from '../admin/content-schema.js';

test('five intervals expose six stops, clamp current input and retain zero', () => {
  const { min, max, step } = gameConfig.water;
  assert.deepEqual(Array.from({length:(max-min)/step+1},(_,i)=>min+i*step),[0,250,500,750,1000,1250]);
  for (const water of [0,250,500,750,1000,1250]) assert.equal(normalizeSelection({water}).water,water);
  assert.equal(normalizeSelection({water:-250}).water,0);
  assert.equal(normalizeSelection({water:2500}).water,1250);
  assert.equal(normalizeSelection({water:NaN}).water,750);
});

test('zero intake has no drink moisture, pigment, tags, bubbles, score or species effects', () => {
  const input={foodIds:['rice'],water:0,force:50,additives:[]};
  const reference={...input,drinkId:'water'};
  const expectedPool=getOutcomePool(reference), expectedEffects=collectEffects(reference);
  for (const drink of drinks) {
    const selection=normalizeSelection({...input,drinkId:drink.id});
    assert.equal(physicalState(selection).drinkBonus,0,drink.id);
    assert.equal(sourceColor(selection),null,drink.id);
    assert.equal(collectEffects(selection).drinkPorosity,0,drink.id);
    assert.equal(collectEffects(selection).smoothnessBonus,expectedEffects.smoothnessBonus,drink.id);
    assert.deepEqual([...mealSources(selection).tags],[...mealSources(reference).tags],drink.id);
    assert.deepEqual(getOutcomePool(selection),expectedPool,drink.id);
  }
});

test('all calibrated ordinary recipes can be saved using the current intake options', () => {
  assert.deepEqual(validateManagedContent(structuredClone(contentValues)),contentValues);
  for (const r of contentValues.recipes) assert.ok(r.water>=0&&r.water<=1250&&r.water%250===0,r.characterId);
});

test('new zero-intake births survive reload while historical quantities retain their actual values', () => {
  const save=normalizeSave();
  save.session=createSession({foodIds:['rice'],drinkId:'coffee',water:0},{now:1000,random:()=>.5});
  settleSession(save,save.session.endsAt);
  assert.equal(normalizeSave(save).individuals[0].recipe.water,0);
  const historical=structuredClone(save);
  historical.individuals[0].rulesVersion=19;
  historical.individuals[0].recipe.water=2500;
  historical.settings.water=2500;
  const reloaded=normalizeSave(historical);
  assert.equal(reloaded.individuals[0].recipe.water,2500);
  assert.equal(reloaded.settings.water,1250);
});
