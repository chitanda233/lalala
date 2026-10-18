import { readFile, writeFile } from "node:fs/promises";
import { foods, foodCategories } from "../src/content/foods.js";
import { foodAttributeFields } from "../src/content/food-attributes.js";
import { drinks } from "../src/content/drinks.js";
import { additives } from "../src/content/additives.js";
import { toilets } from "../src/content/toilets.js";
import { characters, rarityLabels } from "../src/content/specimens.js";
import { stoolRecipes, stoolRecipeByCharacterId } from "../src/content/stool-recipes.js";
import { rareThemeRecipes } from "../src/content/rare-theme-recipes.js";
import { physicalState } from "../src/game/physical-state.js";
import { foodWetness } from "../src/content/food-wetness.js";
import { getRecipeForecast, getOutcomePool } from "../src/game/outcome-pool.js";
import { stoolPropertyFields } from "../src/content/stool-properties.js";
import { forceZones } from "../src/content/force.js";
import { bristolTypes } from "../src/content/stools.js";
import { gameConfig } from "../src/config/game.js";

const root = new URL("../docs/", import.meta.url);
const index = items => Object.fromEntries(items.map(item => [item.id, item]));
const foodById = index(foods), drinkById = index(drinks), characterById = index(characters);
const categories = Object.fromEntries(foodCategories.map(item => [item.id, item.name]));
const cell = value => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", "<br>");
const table = (headers, rows) => [headers, headers.map(() => "---"), ...rows]
  .map(row => `| ${row.map(cell).join(" | ")} |`).join("\n");
const pct = n => `${Number((n * 100).toFixed(2))}%`;
const tags = values => values?.length ? values.join("、") : "无";
const notice = `> 本文件由 [内容文档生成器](../scripts/generate-content-docs.mjs)读取当前源码生成。规则版本 ${gameConfig.rulesVersion}，存档版本 ${gameConfig.saveVersion}。\n`;
const rules = `先抽基础 **${pct(gameConfig.baseRareProbability)}** 的稀有款；未中稀有时，固定配方默认 **${pct(gameConfig.recipeHitProbability)}** 出目标，选益生菌后 **${pct(gameConfig.stabilizedRecipeHitProbability)}** 出目标。每轮实际目标概率分别为 **78.4% / 98%**。\n\n添加剂最多 ${gameConfig.maxAdditives} 种，也可不加。稀有功能剂给对应款合计增加 ${pct(gameConfig.rareAdditiveBonus)} 的概率，使当轮稀有合计为 **5%**；因为不能与益生菌同选，此时固定配方每轮实际目标概率为 **76%**。\n\n完整规则见 [便便产出算法说明](便便产出算法说明.md)，46 条普通款配方见 [固定配方表](固定配方表.md)。`;
const recipeText = item => {
  const recipe = stoolRecipeByCharacterId[item.id];
  if (!recipe) return "每轮均有机会；无需原料门槛";
  const zone = forceZones.find(zone => zone.id === recipe.forceZone);
  return `${recipe.foodIds.map(id => foodById[id].name).join("＋")}＋${drinkById[recipe.drinkId].name} ${recipe.water} mL；阶段 ${recipe.digestionTime}；${zone.name} ${zone.min}–${zone.max}${recipe.requiredAdditive ? `；必选${additives.find(item => item.id === recipe.requiredAdditive).name}` : ""}`;
};

const foodDoc = `# 食物配置\n\n${notice}\n${rules}\n\n## 食物负责什么\n\n餐盘最多三种不同食物。食物湿软值由现有软硬旋钮与食材偏置映射；按影响强度加权，主食额外乘2。再叠加饮用量、饮料特效、消化阶段与添加剂得到湿软指数 S，先确定物态，再在型内匹配造型。凝聚、延展、颗粒和蓬松仍使用原九项参数。固定配方同时核验食物、饮料种类与饮用量、阶段、力度及实际物态。\n\n用户在后台保存的九项属性数值保持原样。新增熟甜菜根、蒸土豆的默认参数单独写在食物定义中；已有参数文件下次保存前由后台读取默认值，不覆盖旧数值。\n\n## 属性量表\n\n${table(["属性", "低值", "高值", "用途"], foodAttributeFields.map(field => [field.label, field.low, field.high, field.description]))}\n\n## 全部 ${foods.length} 种食物\n\n${table(["ID", "名称", "品类", "解锁局数", ...foodAttributeFields.map(field => field.label), "当前湿软值", "色素", "说明"], foods.map(item => [item.id, item.name, categories[item.category], item.unlockAt, ...foodAttributeFields.map(field => item.attributes[field.key]), foodWetness(item).toFixed(2), item.attributes.pigmentId || "不染色", item.description]))}\n\n调参操作见 [食物调参指南](食物调参指南.md)。短阶段残留更明显，长阶段减少；金针菇保持可见印记。\n`;

const drinkDoc = `# 饮料配置\n\n${notice}\n${rules}\n\n## 饮料负责什么\n\n单选一种饮料，原来的饮用量拉条就是全部水分摄入：250–2500 mL，每档 250 mL，默认 1500 mL。选牛奶 1500 mL，就按牛奶 1500 mL 计算；选择清水时也使用同一拉条。\n\n饮用量直接影响湿软指数，饮料湿软偏置乘 min(水量/1500, 5/3)；气泡与饮料染色也随这一饮用量增强并封顶。饮用量与阶段进入普通固定配方，不改变稀有预算。\n\n${table(["ID", "名称", "湿软偏置", "1500 mL 气泡增量", "效果", "颜色标签"], drinks.map(item => [item.id, item.name, item.wetnessBias, item.porosity, item.effectLabel, tags(item.tags)]))}\n`;

const additiveDoc = `# 添加剂配置\n\n${notice}\n${rules}\n\n## 单选功能\n\n益生菌、装饰剂、物态调整剂和稀有增益剂互斥，不能叠加。闪粉、金箔、银霜、花瓣和跳跳颗粒会直接保存在本次个体的外观中，并在结果和图鉴显示；不会靠随机换成另一个便便品种来代替添加物。\n\n${table(["ID", "名称", "功能", "稀有加成目标", "外观装饰", "属性修正", "稳定度"], additives.map(item => [item.id, item.name, item.effectLabel, item.rareTargets.map(id => characterById[id].name).join("、") || "无", item.decoration || "无", item.propertyChanges ? JSON.stringify(item.propertyChanges) : "无", item.stability || 0]))}\n\n稀有功能剂对表中目标平均分摊额外3个百分点，其余稀有款维持各0.2%。装饰保留本次主体形态；不再发生旧的35%稀有材质涂层。\n`;

const stoolDoc = `# 便便图鉴配置\n\n${notice}\n${rules}\n\n## 品种与属性\n\n共 ${characters.length} 款，普通（含特别点缀款）46款、稀有10款。每款只有一个固定Bristol分类。颜色、印记、添加物和独立个体不增加图鉴品种数。\n\n${table(["分类", "名称", "品种数"], bristolTypes.map(type => [type.id, type.name, characters.filter(item => item.homeType === type.id).length]))}\n\n${table(["ID", "名称", "分类", "品质", ...stoolPropertyFields.map(field => field.name), "固定配方 / 稀有规则"], characters.map(item => [item.id, item.name, item.homeType, rarityLabels[item.rarity], ...stoolPropertyFields.map(field => item.properties[field.key]), recipeText(item)]))}\n\n## 图鉴与个体\n\n默认未发现款只显示同一虚影；右上角“全部样式”用于调试预览，不增加收藏。真实发现与样式预览详情都能切换“形态 / 配方”。\n\n每次产出保留独立UUID、食饮和添加剂、力度、颜色、印记、装饰及生成种子。刷新恢复已锁定结果，不重新抽签。稀有都是独立品种，原料不是出现门槛。\n\n美术见 [便便美术制作说明](便便美术制作说明.md)，统一参考见 [统一美术风格](统一美术风格.md)。\n`;

const toiletDoc = `# 马桶配置\n\n${notice}\n## 装备负责什么\n\n马桶影响场景和顺畅评分，不再更改配方、普通掉率或稀有概率。默认开放3款，其他按完成次数解锁。预览箭头不更换装备，点击“蹲它”才应用。\n\n${table(["ID", "名称", "材质", "功能", "效果", "顺畅评分", "解锁"], toilets.map(item => [item.id, item.name, item.material, item.feature, item.effectLabel, item.effects.smoothnessBonus || 0, item.starter ? "初始拥有" : `完成${item.unlock.count}次`]))}\n\n${rules}\n`;

const documents = new Map([
  ["食物配置.md", foodDoc], ["饮料配置.md", drinkDoc], ["添加剂配置.md", additiveDoc],
  ["便便图鉴配置.md", stoolDoc], ["马桶配置.md", toiletDoc],
]);
const additiveName = id => additives.find(item => item.id === id)?.name;
const recipeInput = recipe => ({ ...recipe, force: { low: 20, medium: 50, high: 90 }[recipe.forceZone], additives: recipe.requiredAdditive ? [recipe.requiredAdditive] : recipe.additiveId ? [recipe.additiveId] : [] });
const ordinaryRows = [...stoolRecipes].sort((a,b)=>characterById[a.characterId].homeType-characterById[b.characterId].homeType).map(recipe => {
  const input = recipeInput(recipe), state = physicalState(input), forecast = getRecipeForecast(input);
  const zone = forceZones.find(zone=>zone.id===recipe.forceZone);
  return [characterById[recipe.characterId].homeType, characterById[recipe.characterId].name, recipe.foodIds.map(id=>foodById[id].name).join("＋"), drinkById[recipe.drinkId].name, recipe.water, recipe.digestionTime, `${zone.name} ${zone.min}–${zone.max}`, recipe.requiredAdditive ? `必选${additiveName(recipe.requiredAdditive)}` : "可不加；益生菌稳产", state.score.toFixed(3), pct(forecast.recipeProbability)];
});
const rareRows = rareThemeRecipes.map(recipe => {
  const input=recipeInput(recipe), state=physicalState(input), pool=getOutcomePool(input);
  return [characterById[recipe.characterId].homeType, characterById[recipe.characterId].name, recipe.foodIds.map(id=>foodById[id].name).join("＋"), drinkById[recipe.drinkId].name, recipe.water, recipe.digestionTime, forceZones.find(zone=>zone.id===recipe.forceZone).name, additiveName(recipe.additiveId), state.score.toFixed(3), pct(pool.find(entry=>entry.characterId===recipe.characterId).probability)];
});
documents.set("固定配方表.md", `# 固定配方表\n\n${notice}\n${rules}\n\n## 当前多变量规则\n\n食物集合、饮料种类、饮用量、阶段 T、力度同时匹配，并通过实际物态核验，才进入固定目标的 80% / 益生菌 100% 分支。饮用量单位为 mL，由原拉条控制。随机 T 在开始时等概率锁定 2/4/8，开始前显示三档混合分布。\n\n闪粉派对、碎金芝麻卷、银霜斑点卷、闪粉银河必须使用对应唯一装饰剂，因此不能再加益生菌；这些门槛同时用于固定目标和自由候选。\n\n## 46 款普通与特别配方\n\nS 列由现有食品九项属性、食材偏置与当前饮料参数实际计算，不能照抄策划稿的模拟分数。当前 46/46 物态匹配、完整配方键无重复。表内整局目标为无添加剂或该款必选装饰剂时的实际概率。\n\n${table(["型", "图鉴", "食物", "饮料", "饮用量 mL", "阶段 T", "力度", "添加剂", "实际 S", "整局目标"], ordinaryRows)}\n\n“明天见喷射”按用户后续要求保留第 7 型、名称、配图及原食物＋饮料＋力度组合（汉堡＋金针菇、牛奶、强力度），不采用原稿的第 4 型颗粒螺旋。饮用量为 1500 mL、消化阶段 2。\n\n## 10 款稀有主题搭配\n\n下面只是主题基底，不参与稀有资格判断，不产生 80%/100% 稀有固定配方。基础每款 0.2%；表中概率按所列功能剂实际计算，其目标共享额外 3 个百分点，稀有合计 5%。\n\n${table(["型", "稀有藏品", "主题食物", "饮料", "饮用量 mL", "阶段 T", "力度", "主题功能剂", "实际 S", "该款概率"], rareRows)}\n`);
const check = process.argv.includes("--check");
for (const [name, content] of documents) {
  const path = new URL(name, root);
  if (check) {
    if (await readFile(path, "utf8") !== content) throw new Error(`文档与源码不一致：${name}`);
  } else await writeFile(path, content);
}
console.log(`${check ? "已核对" : "已生成"} ${documents.size} 份中文配置文档：规则版本 ${gameConfig.rulesVersion}，${characters.length} 款便便。`);
