import { contentValues } from "./managed-content.js";
import { stoolRecipeByCharacterId } from "./stool-recipes.js";
import { foods } from "./foods.js";
import { drinks } from "./drinks.js";
import { forceZones } from "./force.js";
import { recipeLiquidText } from "./recipe-labels.js";
import { additives } from "./additives.js";

export const rarityLabels = { common: "日常", uncommon: "特别", special: "稀有" };
// One fixed species and Bristol classification per catalog entry.
export const characters = contentValues.stools.map((item) => ({ ...item }));
export function refreshCharacterMetadata() {
  const foodNames = Object.fromEntries(foods.map((item) => [item.id, item.name]));
  const drinkNames = Object.fromEntries(drinks.map((item) => [item.id, item.name]));
  for (const item of characters) {
    const recipe = stoolRecipeByCharacterId[item.id];
    const force = recipe && forceZones.find((zone) => zone.id === recipe.forceZone);
    Object.assign(item, {
      types: [item.homeType],
      tag: rarityLabels[item.rarity] + " · " + item.category,
      hint: recipe
        ? recipe.foodIds.map((id) => foodNames[id]).join("＋") + "＋" + drinkNames[recipe.drinkId] + "；" + recipeLiquidText(recipe) + "；" + force.name + " " + force.min + "–" + force.max + (recipe.requiredAdditive ? `；需${additives.find(item => item.id === recipe.requiredAdditive).name}，未中稀有后80%。` : "。理想配方普通分支80%（独候选为100%）；益生菌也能稳定自由组合。")
        : "每轮基础稀有合计2%，无需原料门槛；对应功能添加剂可以提高概率。",
    });
  }
}
refreshCharacterMetadata();
