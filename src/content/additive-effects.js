export const visualEffectLabels = {
  "": "无额外材质",
  crystal: "晶体切面",
  rainbow: "虹彩光泽",
  jelly: "果冻光泽",
  frost: "霜花",
  glow: "星光",
  magnet: "磁力砂簇",
  amber: "琥珀光泽",
};

export function functionalChanges(additive) {
  return additive?.functional ? additive.propertyChanges || {} : {};
}

export function additiveRoles(additive) {
  return [
    ...(additive.decoration || additive.visualEffect || additive.tags.some(tag => ["cocoa", "chili", "charcoal"].includes(tag)) ? ["视觉／材质"] : []),
    ...(additive.rareTargets.length ? ["稀有增益"] : []),
    ...(additive.functional ? ["物态／结构功能"] : []),
    ...(additive.id === "probiotic" ? ["普通稳产"] : []),
  ];
}
