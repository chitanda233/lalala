// 添加剂单选：稳定、装饰、物态调整与稀有增益各自有明确功能。
const additive = (id, name, symbol, color, description, effectLabel, tags, options = {}) => ({
  id, name, symbol, color, description, effectLabel, tags,
  effects: {},
  rareTargets: [],
  ...options,
  unlock: { kind: "open" },
});
export const additives = [
  additive("probiotic", "益生菌", "✳", "#a5b578", "稳定已经配好的目标。", "固定配方：未中稀有后，目标命中率由 80% 提高到 100%", ["probiotic"], { stability: 1 }),
  additive("chili", "神秘辣酱", "♨", "#c88766", "让自由组合更偏软。", "自由组合软硬值 −1；提供辣色", ["chili"], { propertyChanges: { hardness: -1 } }),
  additive("glitter", "闪粉", "✦", "#baa778", "让本次成品直接带上亮闪。", "必定增加闪粉装饰，保留原有形态和底色", ["glitter"], { decoration: "glitter" }),
  additive("gold-leaf", "金箔碎片", "◆", "#c8aa52", "金色碎片与黄金收藏的机会。", "增加金箔装饰；黄金传说与黄金汁合计 +3% 稀有概率", ["gold-source"], { decoration: "gold-flake", rareTargets: ["gold", "golden-juice"] }),
  additive("silver-dust", "银色糖霜", "✧", "#9fadb7", "在本次成品表面落下银白小点。", "必定增加银色斑点，保留原有形态", ["silver"], { decoration: "silver" }),
  additive("crystal-seed", "晶体种子", "◇", "#94c3d0", "让晶体收藏更容易出现。", "晶簇收藏家 +3% 概率；稀有总概率变为 5%", ["crystal-source"], { rareTargets: ["crystal"] }),
  additive("rainbow-sugar", "彩虹糖屑", "❖", "#b08fb9", "提高两款彩虹收藏的机会。", "七色同框与彩虹瀑布合计 +3% 稀有概率", ["rainbow-source"], { rareTargets: ["rainbow", "rainbow-falls"] }),
  additive("gelatin", "弹弹凝胶", "◒", "#adc985", "自由组合更凝聚，也更容易遇到果冻。", "自由组合凝聚 +1；Q 弹果冻 +3% 概率", ["gel-source"], { propertyChanges: { cohesion: 1 }, rareTargets: ["jelly"] }),
  additive("popping-candy", "跳跳糖", "※", "#d7a574", "小颗粒直接留在这一次的成品上。", "必定增加跳跳颗粒；自由组合蓬松 +1", ["popping", "bubbles"], { decoration: "popping", propertyChanges: { porosity: 1 } }),
  additive("charcoal", "竹炭粉", "●", "#667575", "为本次成品染上炭黑色。", "增加炭色与黑色斑点，保留原有形态", ["charcoal"], { decoration: "charcoal" }),
  additive("fiber", "膳食纤维粉", "≋", "#a9b282", "让自由组合更贴近目标软硬度。", "自由组合凝聚 +1，并优先保留相近软硬的形态", ["fiber-powder"], { stability: 2, propertyChanges: { cohesion: 1 } }),
  additive("oil", "顺滑植物油", "◕", "#c5b677", "让自由组合更软、更顺畅。", "自由组合软硬 −1；顺畅评分 +0.7", ["oil"], { propertyChanges: { hardness: -1 }, effects: { smoothnessBonus: .7 } }),
  additive("frost-salt", "霜花盐", "❄", "#accfd5", "提高霜晶收藏的机会。", "霜花小晶块 +3% 概率；稀有总概率变为 5%", ["frost-source"], { rareTargets: ["frost-crystal"] }),
  additive("cocoa-powder", "可可粉", "∴", "#9e7b61", "增加可可色与细粒感。", "提供可可色；自由组合颗粒 +1", ["cocoa"], { propertyChanges: { grain: 1 } }),
  additive("flower-petal", "干花瓣", "✿", "#c496aa", "把花瓣直接点缀在本次成品上。", "必定增加花瓣装饰，保留原有形态", ["petal"], { decoration: "petals" }),
  additive("stardust", "星尘", "⋆", "#9296bd", "提高陨星和夜光收藏的机会。", "星尘小陨石与夜光小浮岛合计 +3% 稀有概率", ["star-source", "glow-source"], { rareTargets: ["meteor", "luminous"] }),
  additive("magnet-sand", "磁力砂", "⌁", "#858d9a", "让自由组合中的小块更容易聚在一起。", "自由组合凝聚 +2", ["magnet"], { propertyChanges: { cohesion: 2 } }),
  additive("amber-resin", "琥珀树脂", "◈", "#caa16c", "提高暖色琥珀收藏的机会。", "琥珀时间胶囊 +3% 概率；稀有总概率变为 5%", ["amber-source"], { rareTargets: ["amber-fossil"] }),
];
