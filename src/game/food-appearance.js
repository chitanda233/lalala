import { materialById } from "../content/materials.js";
import { foodById } from "../content/catalog.js";
import { visualEffectLabels } from "../content/additive-effects.js";

export function normalizeAppearance(value) {
  if (!value || typeof value !== "object") return null;
  const fields = [
    "grain",
    "porosity",
    "cohesion",
    "elongation",
    "colorStrength",
  ];
  const result = {};
  result.decorations = [...new Set(Array.isArray(value.decorations) ? value.decorations : [])].filter(id => ["glitter", "gold-flake", "silver", "petals", "popping", "charcoal"].includes(id));
  result.visualEffects = [...new Set(Array.isArray(value.visualEffects) ? value.visualEffects : [])].filter(id => id && Object.hasOwn(visualEffectLabels, id));
  if (value.materialId != null) {
    if (!Object.hasOwn(materialById, value.materialId)) return null;
    result.materialId = value.materialId;
  }
  for (const key of fields) {
    if (!Number.isFinite(value[key]) || value[key] < 1 || value[key] > 7)
      return null;
    result[key] = value[key];
  }
  const seen = new Set();
  result.residues = (Array.isArray(value.residues) ? value.residues : [])
    .filter((entry) => {
      if (
        !entry ||
        typeof entry.foodId !== "string" ||
        !Object.hasOwn(foodById, entry.foodId) ||
        !Number.isInteger(entry.retention) ||
        entry.retention < 2 ||
        entry.retention > 7 ||
        seen.has(entry.foodId)
      )
        return false;
      seen.add(entry.foodId);
      return true;
    })
    .slice(0, 3)
    .map(({ foodId, retention }) => ({ foodId, retention }));
  result.enokiRetention =
    Number.isInteger(value.enokiRetention) &&
    value.enokiRetention >= 1 &&
    value.enokiRetention <= 7
      ? value.enokiRetention
      : 1;
  if (
    Number.isInteger(value.variationSeed) &&
    value.variationSeed >= 0 &&
    value.variationSeed < 1000000
  )
    result.variationSeed = value.variationSeed;
  return result;
}

export function foodAppearance(selection, effects, colorStrength) {
  const shape = effects.food.shape;
  const level = value => Math.max(1, Math.min(7, value));
  return normalizeAppearance({
    decorations: effects.decorations,
    visualEffects: effects.visualEffects,
    grain: level(shape.grain + (effects.propertyChanges.grain || 0)),
    porosity: level(shape.porosity + effects.drinkPorosity + (effects.propertyChanges.porosity || 0)),
    cohesion: level(shape.cohesion + (effects.propertyChanges.cohesion || 0)),
    elongation: level(shape.elongation + (effects.propertyChanges.elongation || 0)),
    colorStrength,
    residues: effects.food.residues.filter(residue => selection.foodIds.includes(residue.foodId)),
    enokiRetention: selection.foodIds.includes("enoki")
      ? Math.max(2, Math.min(7, foodById.enoki.attributes.retention + effects.retentionChange))
      : 1,
  });
}
