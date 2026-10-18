import { gameConfig } from "../config/game.js";
import { characters } from "../content/specimens.js";
import { drinkById, additiveById } from "../content/catalog.js";
import { stoolRecipes, stoolRecipeByCharacterId } from "../content/stool-recipes.js";
import { specimenBlueprintById } from "../content/specimen-blueprints.js";
import { fixedDigestionTimes } from "../content/digestion.js";
import { forceZone } from "../content/force.js";
import { normalizeSelection } from "./selection.js";
import { foodProfile } from "./food-profile.js";
import { physicalState, timeWetness } from "./physical-state.js";

const ordinary = characters.filter(item => item.rarity !== "special");
const rare = characters.filter(item => item.rarity === "special");
const clamp = value => Math.max(1, Math.min(7, value));
const sameFoods = (a, b) => a.length === b.length && a.every(id => b.includes(id));
const allowed = (recipe, selection) => !recipe.requiredAdditive || selection.additives.includes(recipe.requiredAdditive);
const zoneIndex = value => ["low", "medium", "high"].indexOf(value);

export function recipeProperties(input) {
  const selection = normalizeSelection(input);
  if (selection.digestionTime === "random") {
    const phases = fixedDigestionTimes.map(digestionTime => recipeProperties({ ...selection, digestionTime }));
    return Object.fromEntries(Object.keys(phases[0]).map(key => [key, phases.reduce((sum, value) => sum + value[key], 0) / phases.length]));
  }
  const food = foodProfile(selection.foodIds).shape;
  const state = physicalState(selection);
  const drink = drinkById[selection.drinkId];
  const modifier = additiveById[selection.additives[0]]?.propertyChanges || {};
  return {
    hardness: clamp(4 - state.score),
    cohesion: clamp(food.cohesion + (modifier.cohesion || 0)),
    elongation: clamp(food.elongation + (modifier.elongation || 0)),
    grain: clamp(food.grain + (modifier.grain || 0)),
    porosity: clamp(food.porosity + (drink.porosity || 0) * state.drinkScale + (modifier.porosity || 0)),
  };
}

function recipeDistance(recipe, selection) {
  return Math.abs(recipe.water - selection.water) / 250 * 0.5 +
    (selection.digestionTime === "random" ? 0 : Math.abs(timeWetness[recipe.digestionTime] - timeWetness[selection.digestionTime])) +
    (recipe.drinkId === selection.drinkId ? 0 : 1) +
    Math.abs(zoneIndex(recipe.forceZone) - zoneIndex(forceZone(selection.force).id)) * 2;
}

function rareProbabilities(selection) {
  const targets = (additiveById[selection.additives[0]]?.rareTargets || []).filter(id => rare.some(item => item.id === id));
  return rare.map(character => ({
    character,
    probability: gameConfig.baseRareProbability / rare.length +
      (targets.includes(character.id) ? gameConfig.rareAdditiveBonus / targets.length : 0),
  }));
}

function fixedForecast(selection) {
  const state = physicalState(selection);
  const matchedRecipe = stoolRecipes.find(recipe =>
    sameFoods(recipe.foodIds, selection.foodIds) && recipe.drinkId === selection.drinkId &&
    recipe.water === selection.water &&
    recipe.digestionTime === selection.digestionTime && recipe.forceZone === forceZone(selection.force).id &&
    allowed(recipe, selection) && ordinary.find(item => item.id === recipe.characterId)?.homeType === state.type,
  ) || null;
  const suggestedRecipe = matchedRecipe || stoolRecipes.filter(recipe => sameFoods(recipe.foodIds, selection.foodIds) && recipe.drinkId === selection.drinkId)
    .sort((a, b) => recipeDistance(a, selection) - recipeDistance(b, selection) || a.characterId.localeCompare(b.characterId))[0] || null;
  const rareProbability = rareProbabilities(selection).reduce((sum, item) => sum + item.probability, 0);
  const recipeConditionalProbability = matchedRecipe
    ? selection.additives.includes("probiotic") ? gameConfig.stabilizedRecipeHitProbability : gameConfig.recipeHitProbability
    : 0;
  return { matchedRecipe, suggestedRecipe, rareProbability, recipeConditionalProbability,
    recipeProbability: (1 - rareProbability) * recipeConditionalProbability,
    properties: recipeProperties(selection), physicalState: state };
}

// First choose the physical type; force only ranks templates inside that type.
// All eligible same-type templates retain positive weight as drink intake and digestion phase move away.
function fallbackPool(selection, forecast, excludedId) {
  const scores = ordinary.filter(item => item.id !== excludedId && item.homeType === forecast.physicalState.type && allowed(stoolRecipeByCharacterId[item.id], selection)).map(character => {
    const recipe = stoolRecipeByCharacterId[character.id];
    const shared = recipe.foodIds.filter(id => selection.foodIds.includes(id)).length;
    const union = new Set([...recipe.foodIds, ...selection.foodIds]).size;
    let distance = recipeDistance(recipe, selection) + 4 * (1 - shared / union);
    for (const key of ["cohesion", "elongation", "grain", "porosity"])
      distance += Math.abs(forecast.properties[key] - character.properties[key]) * 0.15;
    return { character, weight: 1 / (1 + distance) ** 3 };
  });
  const total = scores.reduce((sum, item) => sum + item.weight, 0);
  return scores.map(item => ({ character: item.character, probability: item.weight / total }));
}

function candidate(character, probability) {
  const specimenId = `${character.id}:${character.homeType}`;
  return { characterId: character.id, specimenId,
    morphology: { ...specimenBlueprintById[specimenId].morphology },
    special: character.rarity === "special", probability, weight: probability };
}

function fixedPool(selection, forecast = fixedForecast(selection)) {
  const pool = rareProbabilities(selection).map(item => candidate(item.character, item.probability));
  const targetId = forecast.matchedRecipe?.characterId;
  if (targetId) pool.push(candidate(ordinary.find(item => item.id === targetId), forecast.recipeProbability));
  const remaining = (1 - forecast.rareProbability) * (1 - forecast.recipeConditionalProbability);
  if (remaining > 0)
    for (const item of fallbackPool(selection, forecast, targetId))
      pool.push(candidate(item.character, item.probability * remaining));
  return pool.filter(item => item.probability > 0);
}

function phases(selection) {
  return selection.digestionTime === "random"
    ? fixedDigestionTimes.map(digestionTime => ({ ...selection, digestionTime }))
    : [selection];
}

// The preview and gameplay use this same distribution. Random T is a true 1/3 mixture.
export function getOutcomePool(input) {
  const selections = phases(normalizeSelection(input));
  if (selections.length === 1) return fixedPool(selections[0]);
  const merged = new Map();
  for (const selection of selections) for (const entry of fixedPool(selection)) {
    const existing = merged.get(entry.specimenId);
    if (existing) existing.probability += entry.probability / selections.length;
    else merged.set(entry.specimenId, { ...entry, probability: entry.probability / selections.length });
  }
  return [...merged.values()].map(entry => ({ ...entry, weight: entry.probability }));
}

export function getRecipeForecast(input) {
  const selection = normalizeSelection(input);
  const selections = phases(selection);
  const phaseForecasts = selections.map(part => ({ digestionTime: part.digestionTime, ...fixedForecast(part) }));
  const first = phaseForecasts[0];
  const suggestedRecipe = first.suggestedRecipe;
  const pool = getOutcomePool(selection);
  if (selections.length === 1) return { ...first, phaseForecasts,
    targetProbability: pool.find(entry => entry.characterId === suggestedRecipe?.characterId)?.probability || 0 };
  const recipeConditionalProbability = phaseForecasts.reduce((sum, forecast) => sum +
    (forecast.matchedRecipe?.characterId === suggestedRecipe?.characterId ? forecast.recipeConditionalProbability : 0), 0) / 3;
  return { matchedRecipe: null, suggestedRecipe, rareProbability: first.rareProbability,
    recipeConditionalProbability, recipeProbability: (1 - first.rareProbability) * recipeConditionalProbability,
    targetProbability: pool.find(entry => entry.characterId === suggestedRecipe?.characterId)?.probability || 0,
    properties: recipeProperties(selection), physicalState: null, phaseForecasts };
}

export function conditionalDropPool(input, type) {
  const entries = getOutcomePool(input).filter(item => item.specimenId.endsWith(`:${type}`));
  const total = entries.reduce((sum, item) => sum + item.probability, 0);
  return entries.map(item => ({ ...item, probability: item.probability / total, weight: item.probability / total }));
}
