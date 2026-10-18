import { foodById, drinkById, additiveById } from "../content/catalog.js";
import { sourceColor } from "./color.js";
import { stoolColors } from "../content/colors.js";

export function mealSources(selection, catalog = { foodById, drinkById, additiveById }) {
  const tags = new Set([
    ...selection.foodIds.flatMap(id => catalog.foodById[id].tags),
    ...(selection.water > 0 ? catalog.drinkById[selection.drinkId].tags : []),
    ...selection.additives.flatMap(id => catalog.additiveById[id].tags),
  ]);
  return { foods: new Set(selection.foodIds), additives: new Set(selection.additives), tags, pigment: sourceColor(selection, catalog)?.id || null };
}

export function sourceAllowed(character, sources) {
  const rule = character.generation.sources;
  return rule.foods.every(id => sources.foods.has(id)) &&
    rule.tags.every(tag => sources.tags.has(tag)) &&
    rule.additives.every(id => sources.additives.has(id)) &&
    (!rule.pigment || rule.pigment === sources.pigment);
}

export function sourceRequirementText(character) {
  const rule = character.generation?.sources;
  if (!rule) return "稀有独立抽签";
  const labels = [
    ...rule.foods.map(id => foodById[id].name),
    ...rule.tags.map(tag => ({ wholegrain: "全谷物来源", petal: "花瓣来源", popping: "跳跳颗粒来源" })[tag] || tag),
    ...rule.additives.map(id => additiveById[id].name),
    ...(rule.pigment ? [`主色：${stoolColors[rule.pigment].name}`] : []),
  ];
  return labels.join("＋") || "通用造型，无必需食材";
}
