import { foodById } from "../content/catalog.js";

export function foodProfile(ids) {
  const profile = { fiber: 0, fat: 0, spice: 0, moisture: 0, fermented: 0 };
  const appearances = new Map();
  const shape = {
    softness: 0,
    cohesion: 0,
    elongation: 0,
    grain: 0,
    porosity: 0,
    lubricity: 0,
  };
  const foods = [...new Set(ids)].sort().map((id) => foodById[id]);
  const influence = foods.reduce(
    (sum, food) => sum + food.attributes.influence,
    0,
  );
  for (const food of foods) {
    for (const key of Object.keys(profile)) profile[key] += food.traits[key];
    for (const key of Object.keys(shape))
      shape[key] +=
        (food.attributes[key] * food.attributes.influence) / influence;
    appearances.set(
      food.appearanceId,
      (appearances.get(food.appearanceId) || 0) + 1,
    );
  }
  for (const key of ["fiber", "fat", "spice"])
    profile[key] = Math.min(6, profile[key]);
  profile.moisture = Math.min(4, profile.moisture);
  profile.fermented = Math.min(1, profile.fermented);
  for (const key of Object.keys(shape))
    shape[key] = Math.max(1, Math.min(7, shape[key]));
  profile.shape = shape;
  const pigments = foods
    .filter(
      (food) => food.attributes.pigmentId && food.attributes.colorStrength > 1,
    )
    .sort(
      (a, b) =>
        b.attributes.colorStrength * b.attributes.influence -
          a.attributes.colorStrength * a.attributes.influence ||
        a.id.localeCompare(b.id, "en"),
    );
  profile.pigmentId = pigments[0]?.attributes.pigmentId ?? null;
  profile.hasPigment = foods.some((food) => food.attributes.pigmentId !== null);
  profile.colorStrength = pigments[0]?.attributes.colorStrength ?? 1;
  profile.residues = foods
    .filter((food) => food.id !== "enoki" && food.attributes.retention > 1)
    .map((food) => ({ foodId: food.id, retention: food.attributes.retention }));
  profile.appearanceId = [...appearances].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en"),
  )[0][0];
  return profile;
}
