import { characters } from "./specimens.js";

// Materials coat an individual; its species and physical classification stay intact.
export const materialById = Object.fromEntries(
  characters.filter((item) => item.rarity === "special")
    .map((item) => [item.id, item]),
);

export function specimenMaterial(specimen) {
  return materialById[specimen?.appearance?.materialId] || null;
}
