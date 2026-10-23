import { foodById, drinkById, additiveById } from "../content/catalog.js";
import { foodWetness } from "../content/food-wetness.js";
import { normalizeSelection } from "./selection.js";
import { functionalChanges } from "../content/additive-effects.js";

export const wetnessThresholds = [-2.3, -1.45, -0.55, 0.55, 1.3, 2.2];
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function typeFromWetness(score) {
  const index = wetnessThresholds.findIndex(threshold => score <= threshold);
  return index < 0 ? 7 : index + 1;
}

// One transparent game index. Force never enters this calculation.
export function physicalState(input, catalog = { foodById, drinkById, additiveById }) {
  const selection = normalizeSelection(input);
  const foods = [...selection.foodIds].sort().map(id => catalog.foodById[id]);
  const weights = foods.map(food => food.attributes.influence * (food.category === "staple" ? 2 : 1));
  const weight = weights.reduce((sum, value) => sum + value, 0);
  const foodBase = foods.reduce((sum, food, i) => sum + foodWetness(food) * weights[i] / weight, 0);
  // The original slider is the entire intake of the selected drink.
  const waterBonus = clamp((selection.water - 1000) / 500, -2, 0.5);
  const drinkScale = Math.min(selection.water / 1500, 5 / 3);
  const drink = catalog.drinkById[selection.drinkId];
  const drinkBonus = selection.water > 0 ? drink.wetnessBias * drinkScale : 0;
  const modifier = functionalChanges(catalog.additiveById[selection.additives[0]]);
  const additiveBonus = -(modifier.hardness || 0) * 0.5;
  const score = foodBase + waterBonus + drinkBonus + additiveBonus;
  return { score, type: typeFromWetness(score), foodBase, waterBonus, drinkBonus, additiveBonus, drinkScale };
}
