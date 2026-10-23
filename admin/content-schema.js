import { gameConfig } from "../src/config/game.js";
import { mealSources, sourceAllowed } from "../src/game/source-conditions.js";
import { stoolColors } from "../src/content/colors.js";
import { contentValues } from "../src/content/managed-content.js";
import { foods } from "../src/content/foods.js";
import { stoolPropertyFields } from "../src/content/stool-properties.js";
import { visualEffectLabels } from "../src/content/additive-effects.js";
import { physicalState } from "../src/game/physical-state.js";

const baseline = structuredClone(contentValues);
const foodIds = new Set(foods.map((item) => item.id));
const drinkIds = new Set(baseline.drinks.map((item) => item.id));
const additiveIds = new Set(baseline.additives.map(item => item.id));
const rareIds = new Set(baseline.stools.filter((item) => item.rarity === "special").map((item) => item.id));
export const propertyLabels = Object.fromEntries(stoolPropertyFields.map((field) => [field.key, field.name]));
export const decorationLabels = { "": "无装饰", glitter: "闪粉", "gold-flake": "金箔", silver: "银斑", petals: "花瓣", popping: "跳跳颗粒", charcoal: "炭粉" };
export const shapeLabels = { seat: "经典坐便", royal: "皇冠", wood: "木纹", heated: "暖座", massage: "按摩", squat: "蹲坑", stones: "石头堆", vortex: "涡流", crystal: "水晶" };

function requireValue(condition, message) {
  if (!condition) throw new TypeError(message);
}
function text(value, label, max = 300, empty = false) {
  requireValue(typeof value === "string" && (empty || value.trim().length > 0) && value.length <= max && !/[<>"&\u0000-\u001f]/u.test(value), `${label}需填写有效文字（最多 ${max} 字，不含 HTML 符号）。`);
  return value;
}
function number(value, label, min, max, integer = false) {
  requireValue(typeof value === "number" && Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value)), `${label}必须是 ${min}–${max} ${integer ? "的整数" : "之间的数值"}。`);
  return value;
}
function color(value) {
  requireValue(typeof value === "string" && /^#[a-f0-9]{6}$/i.test(value), "颜色必须是六位十六进制色值。");
  return value;
}
function tags(value) {
  requireValue(Array.isArray(value) && value.length <= 24 && new Set(value).size === value.length && value.every((tag) => typeof tag === "string" && /^[a-z][a-z0-9-]{0,63}$/.test(tag)), "标签需要使用不重复的英文标识，以逗号分隔。");
  return [...value];
}
function effects(value) {
  requireValue(value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).every((key) => key === "smoothnessBonus"), "仅支持顺畅评分加成。");
  return Object.hasOwn(value, "smoothnessBonus") ? { smoothnessBonus: number(value.smoothnessBonus, "顺畅评分", -10, 10) } : {};
}
function entries(value, key, idKey, validate) {
  const expected = baseline[key];
  requireValue(Array.isArray(value) && value.length === expected.length && new Set(value.map((item) => item?.[idKey])).size === expected.length, `${key} 必须保留全部 ${expected.length} 个条目，且 ID 不重复。`);
  return expected.map((original) => {
    const item = value.find((entry) => entry?.[idKey] === original[idKey]);
    requireValue(item, `${key} 缺少条目 ${original[idKey]}。`);
    try { return validate(item, original); } catch (error) { throw new TypeError(`${original.name || original[idKey]}：${error.message}`); }
  });
}
function sourceIds(value, allowed, label, max = 3) {
  requireValue(Array.isArray(value) && value.length <= max && new Set(value).size === value.length && value.every(id => allowed.has(id)), `${label}包含未知或重复来源。`);
  return [...value];
}
function generation(value) {
  requireValue(value && typeof value === "object" && typeof value.identity === "string" && /^[a-z][a-z0-9-]{0,63}$/.test(value.identity), "请配置有效的生成身份分组。");
  requireValue(typeof value.base === "boolean", "请选择是否为基础造型。");
  requireValue(["low", "medium", "high"].includes(value.forceZone), "请选择造型偏好力度。");
  const rule = value.sources;
  requireValue(rule && typeof rule === "object" && Object.keys(rule).length === 4 && ["foods", "tags", "pigment", "additives"].every(key => Object.hasOwn(rule, key)), "来源条件需分别配置食物、标签、主色素和添加剂。");
  requireValue(rule.pigment === null || Object.hasOwn(stoolColors, rule.pigment), "主色素来源无效。");
  const sources = { foods: sourceIds(rule.foods, foodIds, "必需食物"), tags: tags(rule.tags), pigment: rule.pigment, additives: sourceIds(rule.additives, additiveIds, "必需添加剂", 1) };
  return { identity: value.identity, base: value.base, sources, forceZone: value.forceZone };
}
export function validateManagedContent(value) {
  requireValue(value && typeof value === "object" && !Array.isArray(value), "内容配置必须是对象。");
  requireValue(Object.keys(value).length === Object.keys(baseline).length && Object.keys(value).every((key) => Object.hasOwn(baseline, key)), "内容模块不完整或包含未知模块。");
  const result = {};
  result.stools = entries(value.stools, "stools", "id", (item, original) => {
    requireValue(item.homeType === original.homeType && item.rarity === original.rarity && item.art === original.art, "固定分类、稀有度和造型标识不能更改。");
    return {
      id: original.id,
      name: text(item.name, "名称", 60), homeType: original.homeType,
      category: text(item.category, "分类", 40), art: original.art,
      color: color(item.color), light: color(item.light),
      description: text(item.description, "描述"), rarity: original.rarity,
      material: text(item.material, "材质", 40),
      properties: Object.fromEntries(stoolPropertyFields.map(({ key, name }) => [key, number(item.properties?.[key], name, 1, 7, true)])),
      ...(original.rarity !== "special" ? { generation: generation(item.generation) } : {}),
    };
  });
  result.recipes = entries(value.recipes, "recipes", "characterId", (item, original) => {
    requireValue(Array.isArray(item.foodIds) && item.foodIds.length >= 1 && item.foodIds.length <= 3 && new Set(item.foodIds).size === item.foodIds.length && item.foodIds.every((id) => foodIds.has(id)), "配方需选择 1–3 种不同食物。");
    requireValue(drinkIds.has(item.drinkId), "请选择有效饮料。");
    requireValue(["low", "medium", "high"].includes(item.forceZone), "请选择有效力度区间。");
    const intake = gameConfig.water;
    requireValue(Number.isInteger(item.water) && item.water >= intake.min && item.water <= intake.max && item.water % intake.step === 0, `饮用量请选择 ${intake.min}–${intake.max} mL，每段 ${intake.step} mL。`);
    requireValue(!item.requiredAdditive || additiveIds.has(item.requiredAdditive), "必选添加剂无效。");
    return { characterId: original.characterId, foodIds: [...item.foodIds], drinkId: item.drinkId, water: item.water, forceZone: item.forceZone, requiredAdditive: item.requiredAdditive || null };
  });
  result.drinks = entries(value.drinks, "drinks", "id", (item, original) => {
    requireValue(["drop", "coffee"].includes(item.icon), "饮料图标无效。");
    return { id: original.id, name: text(item.name, "名称", 60), category: text(item.category, "分类", 40), color: color(item.color), description: text(item.description, "描述"), effectLabel: text(item.effectLabel, "效果说明"), tags: tags(item.tags), wetnessBias: number(item.wetnessBias, "湿软偏置", -2, 2), porosity: number(item.porosity, "蓬松修正", 0, 6, true), effects: effects(item.effects), icon: item.icon, unlock: { kind: "open" } };
  });
  result.additives = entries(value.additives, "additives", "id", (item, original) => {
    requireValue(Array.isArray(item.rareTargets) && new Set(item.rareTargets).size === item.rareTargets.length && item.rareTargets.every((id) => rareIds.has(id)), "稀有目标必须选择现有稀有款，且不能重复。");
    const changes = item.propertyChanges || {};
    requireValue(typeof changes === "object" && !Array.isArray(changes) && Object.keys(changes).every((key) => Object.hasOwn(propertyLabels, key)), "属性修正包含未知字段。");
    requireValue(typeof item.functional === "boolean", "请选择是否启用物态与结构功能。");
    requireValue(!item.visualEffect || Object.hasOwn(visualEffectLabels, item.visualEffect), "请选择有效的材质特效。");
    const result = { id: original.id, name: text(item.name, "名称", 60), symbol: text(item.symbol, "图标", 8), color: color(item.color), description: text(item.description, "描述"), effectLabel: text(item.effectLabel, "效果说明"), tags: tags(item.tags), effects: effects(item.effects), rareTargets: [...item.rareTargets], functional: item.functional };
    if (item.visualEffect) result.visualEffect = item.visualEffect;
    if (item.stability !== undefined) result.stability = number(item.stability, "稳定强度", 0, 7, true);
    if (item.decoration) { requireValue(Object.hasOwn(decorationLabels, item.decoration), "装饰类型无效。"); result.decoration = item.decoration; }
    if (item.propertyChanges) result.propertyChanges = Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, number(value, propertyLabels[key], -6, 6, true)]));
    result.unlock = { kind: "open" };
    return result;
  });
  result.toilets = entries(value.toilets, "toilets", "id", (item, original) => {
    requireValue(Object.hasOwn(shapeLabels, item.shape), "马桶造型无效。");
    requireValue(item.unlock && ["open", "rounds"].includes(item.unlock.kind), "解锁方式无效。");
    requireValue(item.id !== "standard" || item.unlock.kind === "open", "默认白瓷马桶必须初始解锁。");
    const unlock = item.unlock.kind === "open" ? { kind: "open" } : { kind: "rounds", count: number(item.unlock.count, "解锁次数", 1, 99999, true) };
    const palette = {};
    for (const [key, count] of [["ceramic", 3], ["tank", 2], ["bowl", 2]]) {
      requireValue(Array.isArray(item.palette?.[key]) && item.palette[key].length === count, "马桶配色不完整。");
      palette[key] = item.palette[key].map(color);
    }
    return { id: original.id, name: text(item.name, "名称", 60), material: text(item.material, "材质", 40), shape: item.shape, feature: text(item.feature, "特点", 60), description: text(item.description, "描述"), effectLabel: text(item.effectLabel, "效果说明"), effects: effects(item.effects), tags: tags(item.tags), starter: unlock.kind === "open", unlock, palette };
  });
  result.artwork = entries(value.artwork, "artwork", "id", (item, original) => {
    requireValue(typeof item.path === "string" && (item.path === "" || /^\/assets\/stools\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|webp)$/.test(item.path)), "图片需选择项目 assets/stools 内的 PNG / WebP，或使用默认分层造型。");
    return { id: original.id, path: item.path };
  });
  return result;
}

// Gameplay inconsistencies are editable design choices, never save errors.
export function managedContentWarnings(value) {
  const warnings = [];
  const unrestricted = item => {
    const rule = item.generation?.sources;
    return rule && !rule.foods.length && !rule.tags.length && !rule.pigment && !rule.additives.length;
  };
  for (let type = 1; type <= 7; type++)
    if (!value.stools.some(item => item.homeType === type && item.generation?.base && unrestricted(item)))
      warnings.push(`第${type}型没有无来源门槛的基础造型，部分餐盘可能无普通候选。`);
  const catalog = { foodById: Object.fromEntries(foods.map(food => [food.id, food])), drinkById: Object.fromEntries(value.drinks.map(item => [item.id, item])), additiveById: Object.fromEntries(value.additives.map(item => [item.id, item])) };
  const anchors = new Map();
  for (const recipe of value.recipes) {
    const character = value.stools.find(item => item.id === recipe.characterId);
    const selection = { ...recipe, additives: recipe.requiredAdditive ? [recipe.requiredAdditive] : [] };
    if (!sourceAllowed(character, mealSources(selection, catalog)))
      warnings.push(`${character.name}的推荐搭配不满足其食材、主色素或添加剂来源，指定目标概率为0。`);
    const state = physicalState(selection, catalog);
    if (state.type !== character.homeType)
      warnings.push(`${character.name}的推荐搭配算出第${state.type}型，与固定第${character.homeType}型不符，指定目标概率为0。`);
    const key = JSON.stringify([[...recipe.foodIds].sort(), recipe.drinkId, recipe.water, recipe.forceZone, recipe.requiredAdditive]);
    if (anchors.has(key)) warnings.push(`${character.name}与${anchors.get(key)}共用同一配方，概率由实际合法候选分配。`);
    anchors.set(key, character.name);
  }
  return warnings;
}
