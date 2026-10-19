import { foodById, drinkById, additiveById } from "../content/catalog.js";
import { foodWetness } from "../content/food-wetness.js";
import { normalizeSelection } from "./selection.js";
import { functionalChanges } from "../content/additive-effects.js";

export const timeWetness = { "2": 0.75, "4": 0, "8": -0.85 };
export const wetnessThresholds = [-2.3, -1.45, -0.55, 0.55, 1.3, 2.2];
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function typeFromWetness(score) {
  const index = wetnessThresholds.findIndex(threshold => score <= threshold);
  return index < 0 ? 7 : index + 1;
}

// One transparent game index. Force never enters this calculation.
// Random phases are evaluated separately by the outcome pool, never as phase 4.
export function physicalState(input) {
  const selection = normalizeSelection(input);
  if (selection.digestionTime === "random")
    throw new TypeError("随机阶段需先分成 2 / 4 / 8 三档计算。");
  const foods = [...selection.foodIds].sort().map(id => foodById[id]);
  const weights = foods.map(food => food.attributes.influence * (food.category === "staple" ? 2 : 1));
  const weight = weights.reduce((sum, value) => sum + value, 0);
  const foodBase = foods.reduce((sum, food, i) => sum + foodWetness(food) * weights[i] / weight, 0);
  // The original slider is the entire intake of the selected drink.
  const waterBonus = clamp((selection.water - 1300) / 1000, -1.1, 1);
  const drinkScale = Math.min(selection.water / 1500, 5 / 3);
  const drink = drinkById[selection.drinkId];
  const drinkBonus = selection.water > 0 ? drink.wetnessBias * drinkScale : 0;
  const timeBonus = timeWetness[selection.digestionTime];
  const modifier = functionalChanges(additiveById[selection.additives[0]]);
  const additiveBonus = -(modifier.hardness || 0) * 0.5;
  const score = foodBase + waterBonus + drinkBonus + timeBonus + additiveBonus;
  return { score, type: typeFromWetness(score), foodBase, waterBonus, drinkBonus, timeBonus, additiveBonus, drinkScale };
}
