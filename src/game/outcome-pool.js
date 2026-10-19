import { gameConfig } from "../config/game.js";
import { characters } from "../content/specimens.js";
import { drinkById, additiveById } from "../content/catalog.js";
import { stoolRecipeByCharacterId } from "../content/stool-recipes.js";
import { specimenBlueprintById } from "../content/specimen-blueprints.js";
import { fixedDigestionTimes } from "../content/digestion.js";
import { forceZone, forceZones } from "../content/force.js";
import { normalizeSelection } from "./selection.js";
import { foodProfile } from "./food-profile.js";
import { physicalState, timeWetness } from "./physical-state.js";
import { mealSources, sourceAllowed } from "./source-conditions.js";
import { functionalChanges } from "../content/additive-effects.js";
import { rareBudget } from "./rare-probabilities.js";

const ordinary = characters.filter(item => item.rarity !== "special");
const rare = characters.filter(item => item.rarity === "special");
const clamp = value => Math.max(1, Math.min(7, value));
const sameFoods = (a, b) => a.length === b.length && a.every(id => b.includes(id));
const shapeKeys = ["cohesion", "elongation", "grain", "porosity"];

export function recipeProperties(input) {
  const selection = normalizeSelection(input);
  if (selection.digestionTime === "random") {
    const phases = fixedDigestionTimes.map(digestionTime => recipeProperties({ ...selection, digestionTime }));
    return Object.fromEntries(Object.keys(phases[0]).map(key => [key, phases.reduce((sum, value) => sum + value[key], 0) / phases.length]));
  }
  const food = foodProfile(selection.foodIds).shape;
  const state = physicalState(selection);
  const drink = drinkById[selection.drinkId];
  const modifier = functionalChanges(additiveById[selection.additives[0]]);
  return {
    hardness: clamp(4 - state.score),
    cohesion: clamp(food.cohesion + (modifier.cohesion || 0)),
    elongation: clamp(food.elongation + (modifier.elongation || 0)),
    grain: clamp(food.grain + (modifier.grain || 0)),
    porosity: clamp(food.porosity + (drink.porosity || 0) * state.drinkScale + (modifier.porosity || 0)),
  };
}

// Source/colour identity never reads force. Trait similarity supplements actual food overlap.
function identityDistance(recipe, selection, food) {
  const shared = recipe.foodIds.filter(id => selection.foodIds.includes(id)).length;
  const union = new Set([...recipe.foodIds, ...selection.foodIds]).size;
  const ideal = foodProfile(recipe.foodIds).shape;
  const traitDifference = ["softness", ...shapeKeys].reduce((sum, key) => sum + Math.abs(food[key] - ideal[key]), 0) / 30;
  const drink = drinkById[selection.drinkId], idealDrink = drinkById[recipe.drinkId];
  const drinkDifference = selection.water === 0 || recipe.drinkId === selection.drinkId ? 0 :
    .15 + Math.abs(drink.wetnessBias - idealDrink.wetnessBias) * .2 + Math.abs(drink.porosity - idealDrink.porosity) * .05;
  return (1 - shared / union) * 1.6 + traitDifference * .8 + drinkDifference +
    Math.abs(recipe.water - selection.water) / 1500 * .9 +
    Math.abs(timeWetness[recipe.digestionTime] - timeWetness[selection.digestionTime]) / 1.6 * .35;
}

const forceDistance = (force, zoneId) => {
  const zone = forceZones.find(zone => zone.id === zoneId);
  return Math.max(zone.min - force, 0, force - zone.max) / 33;
};

// Inverse-square interpolation is continuous at recipe anchors as well as between them.
// Each anchor reserves 80% for itself and distributes the rest only to other legal entries.
function interpolate(items, template) {
  const nearest = Math.min(...items.map(item => item.distance));
  const weights = items.map(item => nearest < 1e-12 ? Number(item.distance < 1e-12) : (nearest / item.distance) ** 2);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const result = new Map();
  items.forEach((item, index) => {
    if (!weights[index]) return;
    for (const [id, probability] of template(item)) result.set(id, (result.get(id) || 0) + probability * weights[index] / total);
  });
  return result;
}

function ordinaryDistribution(selection, state, properties) {
  const sources = mealSources(selection), food = foodProfile(selection.foodIds).shape;
  const legal = ordinary.filter(character => character.homeType === state.type && sourceAllowed(character, sources));
  if (!legal.length) throw new Error(`第${state.type}型缺少合法基础造型，请修复内容配置。`);
  const groups = new Map();
  for (const character of legal) {
    const recipe = stoolRecipeByCharacterId[character.id];
    const item = { character, recipe, distance: identityDistance(recipe, selection, food) };
    const identity = character.generation.identity;
    if (!groups.has(identity)) groups.set(identity, { id: identity, members: [], distance: Infinity });
    const group = groups.get(identity);
    group.members.push(item); group.distance = Math.min(group.distance, item.distance);
  }
  const identities = [...groups.values()];
  const identityProbabilities = interpolate(identities, group => {
    if (identities.length === 1) return [[group.id, 1]];
    // Multi-shape identities keep their 20% variation inside that identity.
    const primary = group.members.length > 1 ? 1 : gameConfig.recipeHitProbability;
    const other = identities.filter(item => item !== group);
    const total = other.reduce((sum, item) => sum + 1 / (1 + item.distance) ** 2, 0);
    return [[group.id, primary], ...other.map(item => [item.id, (1 - primary) / (1 + item.distance) ** 2 / total])];
  });
  const result = [];
  for (const group of identities) {
    const identityProbability = identityProbabilities.get(group.id) || 0;
    if (!identityProbability) continue;
    const nearestForce = Math.min(...group.members.map(item => forceDistance(selection.force, item.recipe.forceZone)));
    const members = group.members.map(item => {
      const ideal = recipeProperties({ ...item.recipe, additives: item.recipe.requiredAdditive ? [item.recipe.requiredAdditive] : [] });
      const deviation = values => shapeKeys.reduce((sum, key) => sum + Math.abs(values[key] - item.character.properties[key]), 0) / shapeKeys.length;
      // Trait fit adjusts shape proximity even when an identity has only two shapes.
      // The ideal's own deviation is the reference, so every ideal anchor stays at zero.
      const shapeScale = (6 + deviation(properties)) / (6 + deviation(ideal));
      return { ...item,
        distance: item.distance * shapeScale + forceDistance(selection.force, item.recipe.forceZone) - nearestForce,
        fit: Math.exp(-deviation(properties) / 3 - forceDistance(selection.force, item.character.generation.forceZone)),
      };
    });
    const shapes = interpolate(members, item => {
      if (members.length === 1) return [[item.character.id, 1]];
      const others = members.filter(other => other !== item);
      const total = others.reduce((sum, other) => sum + other.fit, 0);
      return [[item.character.id, gameConfig.recipeHitProbability], ...others.map(other => [other.character.id, (1 - gameConfig.recipeHitProbability) * other.fit / total])];
    });
    for (const item of members) {
      const probability = identityProbability * (shapes.get(item.character.id) || 0);
      if (probability > 0) result.push({ character: item.character, probability, distance: item.distance });
    }
  }
  return result.sort((a,b) => b.probability-a.probability || a.character.id.localeCompare(b.character.id));
}

function rareProbabilities(selection) {
  return rareBudget(additiveById[selection.additives[0]]).entries.map(entry => ({
    character: rare.find(character => character.id === entry.characterId), probability: entry.probability,
  }));
}

function fixedEvaluation(selection) {
  const state = physicalState(selection), properties = recipeProperties(selection);
  const distribution = ordinaryDistribution(selection, state, properties);
  const primary = distribution[0];
  const stabilized = selection.additives.includes("probiotic");
  const ordinaryEntries = stabilized ? [{ ...primary, probability: 1 }] : distribution;
  const recipe = stoolRecipeByCharacterId[primary.character.id];
  const matchedRecipe = sameFoods(recipe.foodIds, selection.foodIds) && recipe.drinkId === selection.drinkId &&
    recipe.water === selection.water && recipe.digestionTime === selection.digestionTime && recipe.forceZone === forceZone(selection.force).id &&
    (!recipe.requiredAdditive || selection.additives.includes(recipe.requiredAdditive)) ? recipe : null;
  const rares = rareProbabilities(selection), rareProbability = rares.reduce((sum, item) => sum + item.probability, 0);
  const conditional = ordinaryEntries[0].probability;
  return { selection, ordinaryEntries, rares, forecast: {
    matchedRecipe, suggestedRecipe: recipe, primaryCharacterId: primary.character.id,
    primaryConditionalProbability: conditional, primaryProbability: (1 - rareProbability) * conditional,
    recipeConditionalProbability: conditional, recipeProbability: (1 - rareProbability) * conditional,
    targetProbability: (1 - rareProbability) * conditional, rareProbability,
    similarity: Math.exp(-primary.distance), properties, physicalState: state,
  } };
}

function candidate(character, probability) {
  const specimenId = `${character.id}:${character.homeType}`;
  return { characterId: character.id, specimenId,
    morphology: { ...specimenBlueprintById[specimenId].morphology },
    special: character.rarity === "special", probability, weight: probability };
}
const poolFor = evaluation => [
  ...evaluation.rares.map(item => candidate(item.character, item.probability)),
  ...evaluation.ordinaryEntries.map(item => candidate(item.character, item.probability * (1 - evaluation.forecast.rareProbability))),
].filter(item => item.probability > 0);
const evaluations = selection => (selection.digestionTime === "random" ? fixedDigestionTimes.map(digestionTime => ({ ...selection, digestionTime })) : [selection]).map(fixedEvaluation);
function mergePools(parts) {
  const merged = new Map();
  for (const part of parts) for (const entry of poolFor(part)) {
    const existing = merged.get(entry.specimenId);
    if (existing) existing.probability += entry.probability / parts.length;
    else merged.set(entry.specimenId, { ...entry, probability: entry.probability / parts.length });
  }
  return [...merged.values()].map(entry => ({ ...entry, weight: entry.probability }));
}

// Preview, conditional inspection and gameplay all consume this single final distribution.
export function getOutcomePool(input) {
  return mergePools(evaluations(normalizeSelection(input)));
}

export function getRecipeForecast(input) {
  const selection = normalizeSelection(input), parts = evaluations(selection);
  const phaseForecasts = parts.map(part => ({ digestionTime: part.selection.digestionTime, ...part.forecast }));
  if (parts.length === 1) return { ...parts[0].forecast, phaseForecasts };
  const primary = mergePools(parts).filter(item => !item.special).sort((a,b) => b.probability-a.probability || a.characterId.localeCompare(b.characterId))[0];
  const rareProbability = parts[0].forecast.rareProbability;
  const conditional = primary.probability / (1 - rareProbability);
  return { matchedRecipe: null, suggestedRecipe: stoolRecipeByCharacterId[primary.characterId], primaryCharacterId: primary.characterId,
    primaryConditionalProbability: conditional, primaryProbability: primary.probability,
    recipeConditionalProbability: conditional, recipeProbability: primary.probability, targetProbability: primary.probability,
    rareProbability, similarity: null, properties: recipeProperties(selection), physicalState: null, phaseForecasts };
}

export function conditionalDropPool(input, type) {
  const entries = getOutcomePool(input).filter(item => item.specimenId.endsWith(`:${type}`));
  const total = entries.reduce((sum, item) => sum + item.probability, 0);
  return entries.map(item => ({ ...item, probability: item.probability / total, weight: item.probability / total }));
}
