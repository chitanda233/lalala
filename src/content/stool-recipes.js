import { contentValues } from "./managed-content.js";

export const stoolRecipes = contentValues.recipes;
export const stoolRecipeByCharacterId = Object.fromEntries(
  stoolRecipes.map((item) => [item.characterId, item]),
);
