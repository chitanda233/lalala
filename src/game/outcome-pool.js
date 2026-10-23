import { gameConfig } from "../config/game.js";
import { characters } from "../content/specimens.js";
import { foodById, drinkById, additiveById, characterById } from "../content/catalog.js";
import { stoolRecipeByCharacterId } from "../content/stool-recipes.js";
import { specimenBlueprintById } from "../content/specimen-blueprints.js";
import { forceZones } from "../content/force.js";
import { normalizeSelection } from "./selection.js";
import { foodProfile } from "./food-profile.js";
import { physicalState } from "./physical-state.js";
import { mealSources, sourceAllowed } from "./source-conditions.js";
import { functionalChanges } from "../content/additive-effects.js";
import { rareBudget } from "./rare-probabilities.js";

const ordinary = characters.filter(item => item.rarity !== "special");
const rare = characters.filter(item => item.rarity === "special");
const clamp = value => Math.max(1, Math.min(7, value));
const shapeKeys = ["hardness", "cohesion", "elongation", "grain", "porosity"];
export class OutcomeConfigurationError extends Error {}

export function recipeProperties(input) {
  const selection = normalizeSelection(input);
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

// Recommendations describe broad food families, never an exact ingredient key.
// Replacing an ingredient with another of the same category/tags preserves its fit.
function foodFamilies(ids) {
  const categories = new Map(), tags = new Map();
  const foods = [...ids].sort().map(id => foodById[id]);
  const weights = foods.map(food => food.attributes.influence * (food.category === "staple" ? 2 : 1));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  foods.forEach((food, index) => {
    const share = weights[index] / total;
    categories.set(food.category, (categories.get(food.category) || 0) + share);
    for (const tag of food.tags)
      tags.set(tag, (tags.get(tag) || 0) + share / food.tags.length);
  });
  return { categories, tags };
}
const overlap = (a, b) => [...a].reduce((sum, [key, share]) => sum + Math.min(share, b.get(key) || 0), 0);
const familyFit = (current, example) => .6 * overlap(current.categories, example.categories) +
  .4 * (current.tags.size || example.tags.size ? overlap(current.tags, example.tags) : 1);

// A quarter of each group is shared evenly: unusual meals still get variety.
// There is no zero-distance anchor, exact-match bonus, or failure branch.
function shares(items, weight) {
  const weights = items.map(weight), total = weights.reduce((sum, value) => sum + value, 0);
  return items.map((item, index) => ({ item, probability:
    gameConfig.ordinaryVarietyShare / items.length + (1 - gameConfig.ordinaryVarietyShare) * weights[index] / total,
  }));
}
function hasSource(character) {
  const source = character.generation.sources;
  return source.foods.length || source.tags.length || source.additives.length || source.pigment;
}

function forceFit(force, zoneId) {
  const zone = forceZones.find(zone => zone.id === zoneId);
  const distance = Math.max(zone.min - force, 0, force - zone.max) / 33;
  return Math.exp(-1.5 * distance);
}

function ordinaryDistribution(selection, state, properties) {
  const sources = mealSources(selection), family = foodFamilies(selection.foodIds);
  const legal = ordinary.filter(character => character.homeType === state.type && sourceAllowed(character, sources));
  if (!legal.length) throw new OutcomeConfigurationError(`第${state.type}型没有满足来源条件的普通形态，请检查后台配置。`);
  const groups = new Map();
  for (const character of legal) {
    const recipe = stoolRecipeByCharacterId[character.id];
    const similarity = familyFit(family, foodFamilies(recipe.foodIds));
    const structureDistance = shapeKeys.reduce((sum, key) => sum + Math.abs(properties[key] - character.properties[key]), 0) / shapeKeys.length;
    const weight = Math.exp(2 * similarity - structureDistance / 1.5);
    const themed = Boolean(hasSource(character));
    const key = `${themed ? "theme" : "base"}:${character.generation.identity}`;
    if (!groups.has(key)) groups.set(key, { themed, members: [], weight: 0 });
    const group = groups.get(key);
    group.members.push({ character, weight: weight * forceFit(selection.force, character.generation.forceZone), similarity });
    // Force affects shapes within an identity, never that identity's total budget.
    // Adding another shape must not inflate the identity's budget either.
    group.weight = Math.max(group.weight, weight);
  }
  const all = [...groups.values()], themes = all.filter(group => group.themed), bases = all.filter(group => !group.themed);
  const themeBudget = themes.length ? (bases.length ? gameConfig.ordinaryThemeShare : 1) : 0;
  const result = [];
  for (const [bucket, budget] of [[themes, themeBudget], [bases, 1 - themeBudget]]) {
    if (!bucket.length) continue;
    for (const { item: group, probability: groupShare } of shares(bucket, group => group.weight)) {
      for (const { item, probability } of shares(group.members, item => item.weight))
        result.push({ ...item, probability: budget * groupShare * probability });
    }
  }
  return result.sort((a, b) => b.probability - a.probability || a.character.id.localeCompare(b.character.id));
}

function evaluate(input) {
  const selection = normalizeSelection(input), state = physicalState(selection), properties = recipeProperties(selection);
  const distribution = ordinaryDistribution(selection, state, properties);
  const primary = distribution[0];
  const entries = selection.additives.includes("probiotic") ? [{ ...primary, probability: 1 }] : distribution;
  const rares = rareBudget(additiveById[selection.additives[0]]).entries;
  const rareProbability = rares.reduce((sum, entry) => sum + entry.probability, 0);
  const candidate = (character, probability) => {
    const specimenId = `${character.id}:${character.homeType}`;
    return { characterId: character.id, specimenId,
      morphology: { ...specimenBlueprintById[specimenId].morphology },
      special: character.rarity === "special", probability, weight: probability };
  };
  const pool = [
    ...rares.map(entry => candidate(rare.find(character => character.id === entry.characterId), entry.probability)),
    ...entries.map(entry => candidate(entry.character, entry.probability * (1 - rareProbability))),
  ].filter(entry => entry.probability > 0);
  const conditional = entries[0].probability;
  return { pool, forecast: {
    suggestedRecipe: stoolRecipeByCharacterId[primary.character.id], primaryCharacterId: primary.character.id,
    primaryConditionalProbability: conditional, primaryProbability: (1 - rareProbability) * conditional,
    recipeConditionalProbability: conditional, recipeProbability: (1 - rareProbability) * conditional,
    rareProbability, similarity: primary.similarity, properties, physicalState: state,
    ordinaryCandidateCount: distribution.length,
  } };
}

// Gameplay, the catalogue and the editor inspect the exact same final pool.
export function getOutcomePool(input) {
  return evaluate(input).pool;
}

export function getRecipeForecast(input, targetCharacterId = null) {
  const { pool, forecast } = evaluate(input);
  const targetId = targetCharacterId || forecast.primaryCharacterId;
  const targetProbability = pool.filter(entry => entry.characterId === targetId).reduce((sum, entry) => sum + entry.probability, 0);
  return { ...forecast, targetCharacterId: targetId, targetProbability,
    targetConditionalProbability: characterById[targetId]?.rarity === "special" ? 0 : targetProbability / (1 - forecast.rareProbability) };
}

export function conditionalDropPool(input, type) {
  const entries = getOutcomePool(input).filter(item => item.specimenId.endsWith(`:${type}`));
  const total = entries.reduce((sum, item) => sum + item.probability, 0);
  return entries.map(item => ({ ...item, probability: item.probability / total, weight: item.probability / total }));
}
