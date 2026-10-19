import { foodById, drinkById, additiveById, toiletById } from "../content/catalog.js";
import { normalizeSelection } from "./selection.js";
import { foodProfile } from "./food-profile.js";
import { normalizeMarks } from "../content/marks.js";

// 外观与顺畅评分的数据收集器；不再累计任何产出权重。
export function collectEffects(input) {
  const selection = normalizeSelection(input);
  const food = foodProfile(selection.foodIds);
  const meal = [...selection.foodIds].sort().map(id => foodById[id]);
  const drink = drinkById[selection.drinkId];
  const additive = additiveById[selection.additives[0]];
  const toilet = toiletById[selection.toiletId];
  const retentionChange = selection.digestionTime === "2" ? 1 : selection.digestionTime === "8" ? -2 : 0;
  food.residues = food.residues.map(residue => ({ ...residue, retention: Math.max(1, Math.min(7, residue.retention + retentionChange)) })).filter(residue => residue.retention > 1);
  return {
    food,
    tags: [...new Set([...meal.flatMap(item => item.tags), ...(selection.water > 0 ? drink.tags : []), ...(additive?.tags || [])])],
    smoothnessBonus: (food.shape.lubricity - 4) * .5 +
      (selection.water > 0 ? drink.effects.smoothnessBonus || 0 : 0) + (additive?.effects.smoothnessBonus || 0) +
      (toilet.effects.smoothnessBonus || 0),
    outcomeMarks: normalizeMarks(meal.some(item => item.id === "enoki" && item.attributes.retention > 1) ? ["enoki"] : []),
    decorations: additive?.decoration ? [additive.decoration] : [],
    visualEffects: additive?.visualEffect ? [additive.visualEffect] : [],
    retentionChange,
    drinkPorosity: (drink.porosity || 0) * Math.min(selection.water / 1500, 5 / 3),
    propertyChanges: additive?.propertyChanges || {},
  };
}
