import { foodById } from "../content/catalog.js";

export function morphologyMultiplier(character, shape) {
  let multiplier = 1;
  if (
    ["spiral", "rope", "ribbon", "curve", "warm", "spring"].includes(
      character.art,
    )
  )
    multiplier *= Math.exp(
      (shape.elongation - 4) * 0.22 + (shape.cohesion - 4) * 0.1,
    );
  if (
    ["marbles", "segments", "pillows", "mash", "beads"].includes(character.art)
  )
    multiplier *= Math.exp((4 - shape.cohesion) * 0.18);
  if (["bubbles", "foam", "cloud"].includes(character.art))
    multiplier *= Math.exp((shape.porosity - 4) * 0.25);
  if (["rope", "ribbon", "curve"].includes(character.art))
    multiplier *= Math.exp((shape.lubricity - 4) * 0.12);
  return multiplier;
}

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
      : 7;
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
  return normalizeAppearance({
    grain: shape.grain,
    porosity: shape.porosity,
    cohesion: shape.cohesion,
    elongation: shape.elongation,
    colorStrength,
    residues: effects.food.residues,
    enokiRetention: selection.foodIds.includes("enoki")
      ? foodById.enoki.attributes.retention
      : 1,
  });
}
