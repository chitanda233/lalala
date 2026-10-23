import test from "node:test";
import assert from "node:assert/strict";
import { contentValues } from "../src/content/managed-content.js";
import { characterById, foodById, additiveById } from "../src/content/catalog.js";
import { stoolRecipeByCharacterId } from "../src/content/stool-recipes.js";
import { validateManagedContent, managedContentWarnings } from "../admin/content-schema.js";
import { getOutcomePool, getRecipeForecast, OutcomeConfigurationError } from "../src/game/outcome-pool.js";
import { physicalState } from "../src/game/physical-state.js";
import { rollOutcome } from "../src/game/drops.js";
import { characterSvg } from "../src/ui/artwork/stools.js";
import { outcomeDraws } from "./outcome-helpers.js";

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);
const base = { foodIds: ["rice"], drinkId: "water", water: 750, digestionTime: "4", force: 50, additives: [] };

test("manual recipe conflicts, source mismatches and missing base candidates warn without blocking saves", () => {
  const draft = structuredClone(contentValues);
  draft.recipes.find(r => r.characterId === "enoki-jet").foodIds = ["burger"];
  draft.recipes[1] = { ...draft.recipes[0], characterId: draft.recipes[1].characterId };
  for (const stool of draft.stools.filter(s => s.homeType === 6 && s.generation)) {
    stool.generation.base = false;
    stool.generation.sources.foods = ["enoki"];
  }
  const saved = validateManagedContent(draft);
  assert.deepEqual(saved, draft);
  const warnings = managedContentWarnings(saved).join("\n");
  assert.match(warnings, /明天见喷射.*来源/);
  assert.match(warnings, /共用同一配方/);
  assert.match(warnings, /第6型没有无来源门槛/);
  draft.stools[0].generation.sources.foods = ["missing"];
  assert.throws(() => validateManagedContent(draft), /未知/);
});

test("removing a food pigment remains savable while reporting affected source recipes", () => {
  const original = foodById.spinach.attributes;
  try {
    foodById.spinach.attributes = { ...original, pigmentId: null };
    assert.doesNotThrow(() => validateManagedContent(structuredClone(contentValues)));
    assert.ok(managedContentWarnings(contentValues).some(message => message.includes("森林小精灵") && message.includes("来源")));
  } finally { foodById.spinach.attributes = original; }
});

test("target forecast reads the selected species' actual probability, including probiotic and ignored legacy digestion values", () => {
  const recipe = stoolRecipeByCharacterId.classic;
  const original = structuredClone(recipe);
  try {
    Object.assign(recipe, { water: 0 });
    const input = { ...recipe, force: 50, additives: [] };
    for (const additives of [[], ["probiotic"]]) {
      const meal = { ...input, additives };
      const forecast = getRecipeForecast(meal, "classic");
      const ordinary = getOutcomePool(meal).filter(entry => !entry.special);
      const primary = ordinary.reduce((highest, entry) => entry.probability > highest.probability ? entry : highest);
      assert.equal(forecast.primaryCharacterId, primary.characterId);
      assert.equal(characterById[primary.characterId].homeType, physicalState(meal).type);
      assert.equal(forecast.targetCharacterId, "classic");
      close(forecast.targetProbability, 0);
      close(forecast.targetConditionalProbability, 0);
      assert.ok(forecast.primaryProbability > 0);
      if (additives.length) close(forecast.primaryProbability, .98);
    }
    const randomMeal = { ...input, water: 1250, digestionTime: "random" };
    const forecast = getRecipeForecast(randomMeal, "classic");
    const actual = getOutcomePool(randomMeal).find(e => e.characterId === "classic")?.probability || 0;
    close(forecast.targetProbability, actual);
    const currentMeal = { ...randomMeal };
    delete currentMeal.digestionTime;
    assert.deepEqual(getRecipeForecast(currentMeal, "classic"), forecast);
  } finally { Object.assign(recipe, original); }
});

test("a user-removed candidate pool reports an explicit configuration error without producing illegal species", () => {
  const affected = Object.values(characterById).filter(c => c.homeType === physicalState(base).type && c.generation);
  const original = affected.map(c => structuredClone(c.generation));
  try {
    for (const c of affected) c.generation.sources.foods = ["enoki"];
    assert.throws(() => getOutcomePool(base), OutcomeConfigurationError);
    assert.throws(() => rollOutcome(base, () => 0), OutcomeConfigurationError);
  } finally { affected.forEach((c, i) => c.generation = original[i]); }
});

test("ordinary liquid reference images apply the real pigment to their body, while rare material stays intrinsic", () => {
  for (const id of ["enoki-jet", "corn-cannon"]) {
    const input = { ...stoolRecipeByCharacterId[id], force: 99, additives: ["charcoal"] };
    const draws = outcomeDraws(input, e => e.characterId === id);
    const outcome = rollOutcome(input, () => draws.shift());
    assert.equal(outcome.colorId, "ink");
    const svg = characterSvg(characterById[id], false, 7, outcome.colorId, outcome.marks, outcome.appearance);
    assert.match(svg, new RegExp(`href="[^"]*${id}\\.png"[^>]*filter="url\\(#specimen-\\d+-tint\\)"`));
    assert.match(svg, /in="SourceGraphic"[^>]*result="body-mask"/);
    assert.match(svg, /result="food"/);
  }
  const svg = characterSvg(characterById["golden-juice"], false, 7, "ink");
  assert.doesNotMatch(svg, /<image[^>]+filter=/);
});

test("nonfunctional additive grain affects only the surface and is clamped to the valid range", () => {
  const plain = rollOutcome(base, () => .5);
  const cocoa = rollOutcome({ ...base, additives: ["cocoa-powder"] }, () => .5);
  assert.equal(cocoa.type, plain.type);
  assert.equal(cocoa.characterId, plain.characterId);
  assert.equal(plain.appearance.grain, 1);
  assert.equal(cocoa.appearance.grain, 2);
  const additive = additiveById["cocoa-powder"], original = additive.propertyChanges;
  try {
    for (const [grain, expected] of [[6, 7], [-6, 1]]) {
      additive.propertyChanges = { grain };
      const outcome = rollOutcome({ ...base, additives: [additive.id] }, () => .5);
      assert.equal(outcome.appearance.grain, expected);
      assert.equal(outcome.type, plain.type);
    }
  } finally { additive.propertyChanges = original; }
});
