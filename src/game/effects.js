import {
  foodById,
  drinkById,
  additiveById,
  toiletById,
} from "../content/catalog.js";
import { normalizeSelection } from "./selection.js";
import { forceZone } from "../content/force.js";
import { digestionById } from "../content/digestion.js";
import { foodProfile } from "./food-profile.js";
import { normalizeMarks } from "../content/marks.js";

export function collectEffects(input) {
  const selection = normalizeSelection(input);
  const meal = [...selection.foodIds].sort().map((id) => foodById[id]);
  const profile = foodProfile(selection.foodIds);
  const sources = [
    ...meal,
    drinkById[selection.drinkId],
    ...[...selection.additives].sort().map((id) => additiveById[id]),
    toiletById[selection.toiletId],
    forceZone(selection.force),
  ];
  const effects = {
    food: profile,
    typeShift: digestionById[selection.digestionTime].typeShift ?? 0,
    formationStability: 0,
    typeBalance: 0,
    smoothnessBonus: (profile.shape.lubricity - 4) * 0.5,
    specialWeightBonus: 0,
    specialWeightMultiplier: 1,
    dropWeightMultipliers: {},
    typeWeights: {},
    outcomeMarks: meal.some(
      (food) => food.id === "enoki" && food.attributes.retention > 1,
    )
      ? ["enoki"]
      : [],
    tags: [],
  };
  for (const source of sources) {
    // Main food controls use attributes. Nutritional metadata supplies content
    // references; only source-specific drop bonuses enter through food effects.
    const modifier = meal.includes(source)
      ? {
          specialWeightBonus: source.effects.specialWeightBonus,
          specialWeightMultiplier: source.effects.specialWeightMultiplier,
          dropWeightMultipliers: source.effects.dropWeightMultipliers,
        }
      : source.effects;
    for (const key of [
      "typeShift",
      "formationStability",
      "typeBalance",
      "smoothnessBonus",
      "specialWeightBonus",
    ])
      effects[key] += modifier[key] ?? 0;
    effects.specialWeightMultiplier *= modifier.specialWeightMultiplier ?? 1;
    for (const [type, weight] of Object.entries(modifier.typeWeights || {}))
      effects.typeWeights[type] = (effects.typeWeights[type] ?? 0) + weight;
    effects.outcomeMarks.push(...(modifier.outcomeMarks || []));
    for (const [id, multiplier] of Object.entries(
      modifier.dropWeightMultipliers || {},
    ))
      effects.dropWeightMultipliers[id] =
        (effects.dropWeightMultipliers[id] ?? 1) * multiplier;
    effects.tags.push(...(source.tags || []));
  }
  effects.tags = [...new Set(effects.tags)];
  if (profile.shape.porosity >= 5 && !effects.tags.includes("bubbles"))
    effects.tags.push("bubbles");
  effects.outcomeMarks = normalizeMarks(effects.outcomeMarks);
  effects.typeShift = Math.max(-2, Math.min(3, effects.typeShift));
  effects.typeBalance = Math.min(2, effects.typeBalance);
  effects.formationStability = Math.min(0.18, effects.formationStability);
  return effects;
}
