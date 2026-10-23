import { contentValues } from "./managed-content.js";
import { stoolRecipeByCharacterId } from "./stool-recipes.js";
import { foods } from "./foods.js";
import { drinks } from "./drinks.js";
import { recipeLiquidText } from "./recipe-labels.js";
import { additives } from "./additives.js";
import { forceZones } from "./force.js";

export const rarityLabels = { common: "日常", uncommon: "特别", special: "稀有" };
// One fixed species and Bristol classification per catalog entry.
export const characters = contentValues.stools.map((item) => ({ ...item }));
export function refreshCharacterMetadata() {
  const foodNames = Object.fromEntries(foods.map((item) => [item.id, item.name]));
  const drinkNames = Object.fromEntries(drinks.map((item) => [item.id, item.name]));
  for (const item of characters) {
    const recipe = stoolRecipeByCharacterId[item.id];
    const zone = recipe && forceZones.find(zone => zone.id === recipe.forceZone);
    Object.assign(item, {
      types: [item.homeType],
      tag: rarityLabels[item.rarity] + " · " + item.category,
      hint: recipe
        ? "推荐：" + recipe.foodIds.map((id) => foodNames[id]).join("＋") + "＋" + drinkNames[recipe.drinkId] + "；" + recipeLiquidText(recipe) + `；${zone.name} ${zone.min}–${zone.max}` + (recipe.requiredAdditive ? `；需${additives.find(item => item.id === recipe.requiredAdditive).name}。` : "。可自由替换与加料；益生菌稳定当前普通主结果。")
        : "每轮基础稀有合计2%，无需原料门槛；对应功能添加剂可以提高概率。",
    });
  }
}
refreshCharacterMetadata();
