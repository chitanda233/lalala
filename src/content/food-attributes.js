import { stoolColors } from "./colors.js";

export const foodAttributeFields = [
  {
    // Stable data key; this scale measures hardness: 1 soft, 7 hard.
    key: "softness",
    label: "软硬程度",
    low: "非常软",
    high: "非常硬",
    description: "数值越大越硬：1 非常软、偏液态，4 柔软成形，7 非常硬。",
  },
  {
    key: "cohesion",
    label: "凝聚度",
    low: "分散",
    high: "连成整体",
    description: "决定分散颗粒、多个团块与连续成形的倾向。",
  },
  {
    key: "elongation",
    label: "延展性",
    low: "短而易断",
    high: "长条盘卷",
    description: "在实际类型允许的范围内，提高长条、弯曲和盘卷的机会。",
  },
  {
    key: "grain",
    label: "颗粒感",
    low: "细腻光滑",
    high: "粗颗粒",
    description: "控制模型表面的颗粒密度和颗粒尺寸。",
  },
  {
    key: "retention",
    label: "形态保留度",
    low: "完全融入",
    high: "明显保留",
    description:
      "控制食材特征的显形程度。1 不显示，7 完整保留；金针菇使用专属印记。",
  },
  {
    key: "colorStrength",
    label: "染色能力",
    low: "不染色",
    high: "强烈染色",
    description: "搭配食材色素使用，决定其改变普通便便底色的程度。",
  },
  {
    key: "porosity",
    label: "蓬松度",
    low: "紧实",
    high: "蓬松多孔",
    description: "控制气孔纹理，并提高符合条件的气泡、云朵与蓬松造型机会。",
    advanced: true,
  },
  {
    key: "lubricity",
    label: "顺滑度",
    low: "阻滞",
    high: "顺滑",
    description: "影响顺畅程度，以及符合条件的顺滑长条、缎带造型。",
    advanced: true,
  },
  {
    key: "influence",
    label: "影响强度",
    low: "轻微点缀",
    high: "主导混搭",
    description:
      "整份食物的混搭权重。数值越高，这份食物对整体形态、颗粒和蓬松效果的影响越大；单吃时占比为 100%。",
    group: "overall",
  },
];

export function validateFoodAttributes(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("食物参数必须是对象。");
  const result = {};
  for (const field of foodAttributeFields) {
    const number = value[field.key];
    if (!Number.isInteger(number) || number < 1 || number > 7)
      throw new RangeError(`${field.label}必须是 1–7 的整数。`);
    result[field.key] = number;
  }
  if (
    value.pigmentId !== null &&
    (typeof value.pigmentId !== "string" ||
      !Object.hasOwn(stoolColors, value.pigmentId))
  )
    throw new RangeError("请选择有效的食材色素或不染色。");
  result.pigmentId = value.pigmentId;
  return result;
}

const level = (value) => Math.max(1, Math.min(7, Math.round(value)));
export function initialFoodAttributes(food) {
  const { fiber, fat, spice, moisture, fermented } = food.traits;
  const tags = food.tags;
  const pigments = [
    ["clay", "clay"],
    ["dragon-pigment", "dragon"],
    ["ink", "ink"],
    ["charcoal", "ink"],
    ["cocoa", "cocoa"],
    ["green", "garden"],
  ];
  const pigmentId =
    pigments.find(([tag]) => tags.includes(tag))?.[1] ??
    (spice >= 2 ? "fire" : null);
  return {
    softness:
      8 - level(4 + spice * 0.65 + fat * 0.15 + (food.effects.typeShift || 0)),
    cohesion: level(4 + fiber * 0.5 + fermented - spice * 0.5),
    elongation: level(4 + fiber * 0.4 - spice * 0.3),
    grain: tags.includes("wholegrain") ? 4 : tags.includes("nut") ? 5 : 1,
    retention: 1,
    colorStrength: pigmentId ? (pigmentId === "garden" ? 4 : 7) : 1,
    porosity: tags.includes("bubbles") ? 5 : 1,
    lubricity: level(4 + fat * 0.3 + (food.effects.smoothnessBonus || 0) * 2),
    influence: 4,
    pigmentId,
  };
}

export function withFoodAttributes(food, configured) {
  return {
    ...food,
    attributes: validateFoodAttributes(
      configured ?? initialFoodAttributes(food),
    ),
  };
}

export function describeFoodAttributes(food) {
  const a = food.attributes;
  const notes = [
    `软硬 ${a.softness}/7（越大越硬）、凝聚 ${a.cohesion}/7、延展 ${a.elongation}/7`,
  ];
  if (a.grain > 1) notes.push(`颗粒感 ${a.grain}/7`);
  if (a.retention > 1)
    notes.push(
      food.id === "enoki"
        ? "必定留下金针菇印记"
        : `保留${food.name}特征 ${a.retention}/7`,
    );
  if (a.colorStrength > 1 && a.pigmentId)
    notes.push(`${stoolColors[a.pigmentId].name}染色 ${a.colorStrength}/7`);
  if (a.porosity > 1) notes.push(`蓬松 ${a.porosity}/7`);
  if (a.lubricity !== 4) notes.push(`顺滑 ${a.lubricity}/7`);
  return notes.join("；");
}
