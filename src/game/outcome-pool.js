import { gameConfig } from "../config/game.js";
import { characters } from "../content/specimens.js";
import { drinkById, additiveById } from "../content/catalog.js";
import { stoolRecipes, stoolRecipeByCharacterId } from "../content/stool-recipes.js";
import { specimenBlueprintById } from "../content/specimen-blueprints.js";
import { forceZone } from "../content/force.js";
import { normalizeSelection } from "./selection.js";
import { foodProfile } from "./food-profile.js";

const ordinary = characters.filter(item => item.rarity !== "special");
const rare = characters.filter(item => item.rarity === "special");
const clamp = value => Math.max(1, Math.min(7, value));
const sameFoods = (a, b) => a.length === b.length && a.every(id => b.includes(id));

export function recipeProperties(input) {
  const selection = normalizeSelection(input);
  const food = foodProfile(selection.foodIds).shape;
  const drink = drinkById[selection.drinkId];
  const quantity = selection.water <= 750 ? 1 : selection.water >= 2000 ? -1 : 0;
  const modifier = additiveById[selection.additives[0]]?.propertyChanges || {};
  return {
    hardness: clamp(food.softness * .7 + drink.hardness * .3 + quantity + (modifier.hardness || 0)),
    cohesion: clamp(food.cohesion + (modifier.cohesion || 0)),
    elongation: clamp(food.elongation + (modifier.elongation || 0)),
    grain: clamp(food.grain + (modifier.grain || 0)),
    porosity: clamp(food.porosity + (drink.porosity || 0) + (modifier.porosity || 0)),
  };
}

function matchingRecipe(selection, includeForce = true) {
  return stoolRecipes.find(recipe =>
    sameFoods(recipe.foodIds, selection.foodIds) &&
    recipe.drinkId === selection.drinkId &&
    (!includeForce || recipe.forceZone === forceZone(selection.force).id),
  ) || null;
}

function rareProbabilities(selection) {
  const additive = additiveById[selection.additives[0]];
  const targets = (additive?.rareTargets || []).filter(id => rare.some(item => item.id === id));
  return rare.map(item => ({
    character: item,
    probability: gameConfig.baseRareProbability / rare.length +
      (targets.includes(item.id) ? gameConfig.rareAdditiveBonus / targets.length : 0),
  }));
}

export function getRecipeForecast(input) {
  const selection = normalizeSelection(input);
  const matchedRecipe = matchingRecipe(selection);
  const rareProbability = rareProbabilities(selection).reduce((sum, item) => sum + item.probability, 0);
  const recipeConditionalProbability = matchedRecipe
    ? selection.additives.includes("probiotic")
      ? gameConfig.stabilizedRecipeHitProbability : gameConfig.recipeHitProbability
    : 0;
  return {
    matchedRecipe,
    suggestedRecipe: matchedRecipe || matchingRecipe(selection, false),
    rareProbability,
    recipeConditionalProbability,
    recipeProbability: (1 - rareProbability) * recipeConditionalProbability,
    properties: recipeProperties(selection),
  };
}

// 自由组合 / 固定配方未命中：只取属性最相近的三个普通款。
// 软硬差值计两份，其他属性计一份；配方食材越接近，排位越靠前。
function fallbackPool(selection, properties, excludedId) {
  const stabilize = additiveById[selection.additives[0]]?.stability || 0;
  const scores = ordinary.filter(item => item.id !== excludedId).map(character => {
    const recipe = stoolRecipeByCharacterId[character.id];
    const shared = recipe.foodIds.filter(id => selection.foodIds.includes(id)).length;
    const union = new Set([...recipe.foodIds, ...selection.foodIds]).size;
    let distance = (2 + stabilize) * Math.abs(properties.hardness - character.properties.hardness);
    for (const key of ["cohesion", "elongation", "grain", "porosity"])
      distance += Math.abs(properties[key] - character.properties[key]);
    distance += 4 * (1 - shared / union);
    distance += recipe.drinkId === selection.drinkId ? 0 : 1;
    return { character, distance, weight: 1 / (1 + distance) };
  }).sort((a, b) => a.distance - b.distance || a.character.id.localeCompare(b.character.id, "en"));
  const nearest = scores.slice(0, 3);
  const total = nearest.reduce((sum, item) => sum + item.weight, 0);
  return nearest.map(item => ({ character: item.character, probability: item.weight / total }));
}

function candidate(character, probability) {
  const specimenId = `${character.id}:${character.homeType}`;
  return {
    characterId: character.id,
    specimenId,
    morphology: { ...specimenBlueprintById[specimenId].morphology },
    special: character.rarity === "special",
    probability,
    weight: probability,
  };
}

// 唯一产出池：稀有在前，随后是固定配方目标，再是其他普通款。
// 一次抽签等价于“先稀有；未中稀有，再按80%/100%抽普通配方”。
export function getOutcomePool(input) {
  const selection = normalizeSelection(input);
  const forecast = getRecipeForecast(selection);
  const pool = rareProbabilities(selection).map(item => candidate(item.character, item.probability));
  const targetId = forecast.matchedRecipe?.characterId;
  if (targetId) {
    const target = ordinary.find(item => item.id === targetId);
    pool.push(candidate(target, forecast.recipeProbability));
  }
  const remaining = (1 - forecast.rareProbability) * (1 - forecast.recipeConditionalProbability);
  if (remaining > 0) {
    for (const item of fallbackPool(selection, forecast.properties, targetId))
      pool.push(candidate(item.character, item.probability * remaining));
  }
  return pool.filter(item => item.probability > 0);
}

// 调试时的条件视图只过滤同一个最终池，不再运行另一套掉落规则。
export function conditionalDropPool(input, type) {
  const entries = getOutcomePool(input).filter(item => item.specimenId.endsWith(`:${type}`));
  const total = entries.reduce((sum, item) => sum + item.probability, 0);
  return entries.map(item => ({ ...item, probability: item.probability / total, weight: item.probability / total }));
}
