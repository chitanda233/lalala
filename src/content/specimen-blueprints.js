import { characters } from "./specimens.js";
import { stoolForms } from "./stool-forms.js";

// One species, one catalog entry, one fixed physical classification.
// Pigments, residues and repeated individual births never add catalog species.
export const specimenBlueprints = characters.map((character) => ({
  id: `${character.id}:${character.homeType}`,
  characterId: character.id,
  name: character.name,
  morphology: { form: stoolForms[character.homeType - 1].id },
  rarity: character.rarity,
}));
export const specimenBlueprintById = Object.fromEntries(
  specimenBlueprints.map((blueprint) => [blueprint.id, blueprint]),
);
