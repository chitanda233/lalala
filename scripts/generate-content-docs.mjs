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
import { sourceRequirementText } from "../src/game/source-conditions.js";
import { foodWetness } from "../src/content/food-wetness.js";
import { getRecipeForecast } from "../src/game/outcome-pool.js";
import { stoolPropertyFields } from "../src/content/stool-properties.js";
import { forceZones } from "../src/content/force.js";
import { bristolTypes } from "../src/content/stools.js";
import { gameConfig } from "../src/config/game.js";
import { rareBudget } from "../src/game/rare-probabilities.js";
import { additiveRoles, visualEffectLabels } from "../src/content/additive-effects.js";

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
const rules = `食物、所选饮料及饮用量、添加剂决定物态与来源身份。消化时间已移除，力度保留同身份内造型影响，不改变物态或来源身份预算。先按真实来源与湿软物态筛选，再按食物品类、标签和结构属性分配，推荐搭配没有固定命中奖励。力度在身份组内调整造型倾向。存在来源主题与通用造型时，主题合计占普通分支 **${pct(gameConfig.ordinaryThemeShare)}**，通用造型占其余部分；每组 **${pct(gameConfig.ordinaryVarietyShare)}** 均匀分配，其余按倾向加权，任意合法搭配都能获得对应结果。益生菌将当前普通主结果稳定为100%。\n\n未配置关联稀有组时，全体稀有均分基础 **${pct(gameConfig.baseRareProbability)}**；有有效关联组时，仅该组均分 **${pct(gameConfig.boostedRareTargetProbability)}**，组外稀有为0。统一概率池抽一次结果。添加剂至多一种。完整规则见 [便便产出算法说明](便便产出算法说明.md)，示例见 [推荐配方表](固定配方表.md)。`;
const recipeText = item => {
  const recipe = stoolRecipeByCharacterId[item.id];
  return recipe ? `${recipe.foodIds.map(id => foodById[id].name).join("＋")}＋${drinkById[recipe.drinkId].name} ${recipe.water} mL${recipe.requiredAdditive ? `；必选${additives.find(item => item.id === recipe.requiredAdditive).name}` : ""}` : "每轮均有机会；无需原料门槛";
};
const document = (title, body) => `# ${title}\n\n${notice}\n${rules}\n\n${body}\n`;
const documents = new Map();
documents.set("食物配置.md", document("食物配置", `## 食物负责什么\n\n餐盘最多三种不同食物。食物湿软值由现有软硬旋钮与食材偏置映射，按影响强度加权，主食额外乘2。再叠加饮用量、饮料与功能添加剂，得到湿软指数S。凝聚、延展、颗粒和蓬松决定型内造型倾向。推荐示例只提供品类和标签参考，不逐个比对食物ID，同类替换和混搭均可参与。残留只读取食材保留度，金针菇保留真实印记。\n\n用户保存的九项参数保持原样。\n\n## 属性量表\n\n${table(["属性", "低值", "高值", "用途"], foodAttributeFields.map(field => [field.label, field.low, field.high, field.description]))}\n\n## 全部 ${foods.length} 种食物\n\n${table(["ID", "名称", "品类", "解锁局数", ...foodAttributeFields.map(field => field.label), "当前湿软值", "色素", "说明"], foods.map(item => [item.id, item.name, categories[item.category], item.unlockAt, ...foodAttributeFields.map(field => item.attributes[field.key]), foodWetness(item).toFixed(2), item.attributes.pigmentId || "不染色", item.description]))}\n\n操作见 [食物调参指南](食物调参指南.md)。`));
documents.set("饮料配置.md", document("饮料配置", `## 单一饮用量\n\n单选一种饮料，滑条就是全部摄入量：0–1250 mL，每档250，默认750。没有额外清水字段。0 mL不计饮料染色、标签、气泡或顺畅加成。水量修正为 clamp((水量−1000)/500, −2, +0.5)，默认750对应−0.5。饮料偏置与气泡按 min(水量/1500, 5/3) 缩放。颜色从真实来源确定，抽中图鉴不强制改色。\n\n${table(["ID", "名称", "湿软偏置", "1250 mL 气泡增量", "效果", "颜色标签"], drinks.map(item => [item.id, item.name, item.wetnessBias, Number((item.porosity * 1250 / 1500).toFixed(3)), item.effectLabel, tags(item.tags)]))}`));
documents.set("添加剂配置.md", document("添加剂配置", `## 职责与单选\n\n至多一种，可不选。只有启用功能的属性修正参与物态和造型；其余只影响表面。视觉材质、关联稀有组和物态功能独立配置。牛奶和辣酱没有隐藏联动。益生菌稳定实际主结果，不能指定任意图鉴。\n\n${table(["ID", "名称", "职责", "功能说明", "关联稀有组", "组内每款", "外观装饰", "材质特效", "修正作用域", "属性修正"], additives.map(item => { const budget = rareBudget(item); return [item.id, item.name, additiveRoles(item).join("、"), item.effectLabel, budget.targets.map(id => characterById[id].name).join("、") || "无", budget.targets.length ? pct(budget.targetProbability / budget.targets.length) : "全体均分2%", item.decoration || "无", visualEffectLabels[item.visualEffect || ""], item.functional ? "参与物态／同型结构" : "仅表面纹理", item.propertyChanges ? JSON.stringify(item.propertyChanges) : "无"]; }))}\n\n关联组适用于任何添加剂和任意有效目标数量，不写死某个品种；组外概率为0。稀有只从统一池抽一次。`));
documents.set("便便图鉴配置.md", document("便便图鉴配置", `## 品种与属性\n\n共 ${characters.length} 款，46普通与10稀有。每款固定一个Bristol分类；颜色、印记、装饰和独立个体不增加图鉴条目。\n\n${table(["分类", "名称", "品种数"], bristolTypes.map(type => [type.id, type.name, characters.filter(item => item.homeType === type.id).length]))}\n\n${table(["ID", "名称", "分类", "品质", ...stoolPropertyFields.map(field => field.name), "推荐搭配 / 稀有规则", "必要来源"], characters.map(item => [item.id, item.name, item.homeType, rarityLabels[item.rarity], ...stoolPropertyFields.map(field => item.properties[field.key]), recipeText(item), sourceRequirementText(item)]))}\n\n## 收藏\n\n未发现款统一虚影；全部样式只作预览，不增加发现。已发现封面用标准图，详情查看真实个体或推荐搭配、来源。品种箭头按固定图鉴顺序跳过未发现款，个体箭头查看本款最近${gameConfig.maxIndividualsPerSpecimen}条不同记录。重复合并计数并保留最新完整快照，清理个体不取消发现。保存食饮、添加剂、操作力度、颜色、残留和种子；种子只控制表面位置和数量，不旋转主体或增加收藏条目。刷新恢复已锁定结果。稀有保留固定造型。\n\n美术见 [便便美术制作说明](便便美术制作说明.md) 与 [统一美术风格](统一美术风格.md)。`));
documents.set("马桶配置.md", document("马桶配置", `## 装备\n\n马桶影响场景与顺畅评分，不改变产出概率。默认开放3款，其余按完成次数解锁；箭头只预览，点击“蹲它”才应用。\n\n${table(["ID", "名称", "材质", "功能", "效果", "顺畅评分", "解锁"], toilets.map(item => [item.id, item.name, item.material, item.feature, item.effectLabel, item.effects.smoothnessBonus || 0, item.starter ? "初始拥有" : `完成${item.unlock.count}次`]))}`));

const additiveName = id => additives.find(item => item.id === id)?.name;
const recipeInput = recipe => ({ ...recipe, force: { low: 20, medium: 50, high: 90 }[recipe.forceZone], additives: recipe.requiredAdditive ? [recipe.requiredAdditive] : recipe.additiveId ? [recipe.additiveId] : [] });
const ordinaryRows = [...stoolRecipes].sort((a,b) => characterById[a.characterId].homeType - characterById[b.characterId].homeType).map(recipe => {
  const input = recipeInput(recipe), state = physicalState(input), forecast = getRecipeForecast(input, recipe.characterId);
  return [characterById[recipe.characterId].homeType, characterById[recipe.characterId].name, recipe.foodIds.map(id => foodById[id].name).join("＋"), drinkById[recipe.drinkId].name, recipe.water, forceZones.find(zone => zone.id === recipe.forceZone).name, sourceRequirementText(characterById[recipe.characterId]), recipe.requiredAdditive ? `必选${additiveName(recipe.requiredAdditive)}` : "可不加", state.score.toFixed(3), pct(forecast.targetProbability), characterById[forecast.primaryCharacterId].name];
});
const rareRows = rareThemeRecipes.map(recipe => {
  const input = recipeInput(recipe), state = physicalState(input), forecast = getRecipeForecast(input, recipe.characterId);
  return [characterById[recipe.characterId].homeType, characterById[recipe.characterId].name, recipe.foodIds.map(id => foodById[id].name).join("＋"), drinkById[recipe.drinkId].name, recipe.water, forceZones.find(zone => zone.id === recipe.forceZone).name, additiveName(recipe.additiveId), state.score.toFixed(3), pct(forecast.targetProbability)];
});
documents.set("固定配方表.md", document("推荐配方表", `## 怎样用推荐搭配\n\n这些是可行示例，不是唯一答案。食材按品类和标签提供造型倾向，增加配菜或替换同类食物不会触发失败分支。水量决定软硬物态，特殊食材、真实主色和添加剂决定主题资格。推荐的这一款不一定是当前概率最高者，下面同时列出目标概率与主结果。益生菌稳定当前主结果，不能锁定任意指定品种。\n\n## 46 款普通与特别搭配\n\n全部示例满足对应物态与真实来源。S与概率从当前源码计算，轻／中／强推荐概率分别按力度20／50／90预览，区间内实际概率随力度连续变化；原食品九参数没有改写。明天见喷射保留汉堡＋金针菇、鲜牛奶1250 mL与第7型，强力度提高同身份内喷射造型的倾向，不再要求消化时间。只有一个合法普通候选时自然100%，不添加非法来源凑变化。\n\n${table(["型", "图鉴", "食物", "饮料", "饮用量 mL", "推荐力度", "必需来源", "添加剂", "实际 S", "整局目标", "当前主结果"], ordinaryRows)}\n\n## 10 款稀有主题搭配\n\n主题搭配只作展示，不影响稀有资格；稀有保持固定造型。表中概率读取所列添加剂的实际关联组。\n\n${table(["型", "稀有藏品", "主题食物", "饮料", "饮用量 mL", "主题力度", "主题添加剂", "实际 S", "该款概率"], rareRows)}`));

const check = process.argv.includes("--check");
for (const [name, content] of documents) {
  const path = new URL(name, root);
  if (check) {
    if (await readFile(path, "utf8") !== content) throw new Error(`文档与源码不一致：${name}`);
  } else await writeFile(path, content);
}
console.log(`${check ? "已核对" : "已生成"} ${documents.size} 份中文配置文档：规则版本 ${gameConfig.rulesVersion}，${characters.length} 款便便。`);
