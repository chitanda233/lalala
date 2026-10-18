import { readFile, writeFile } from "node:fs/promises";
import { foods, foodCategories } from "../src/content/foods.js";
import { foodAttributeFields } from "../src/content/food-attributes.js";
import { drinks } from "../src/content/drinks.js";
import { additives } from "../src/content/additives.js";
import { toilets } from "../src/content/toilets.js";
import { characters, rarityLabels } from "../src/content/specimens.js";
import { specimenBlueprints } from "../src/content/specimen-blueprints.js";
import { bristolTypes } from "../src/content/stools.js";
import { stoolForms } from "../src/content/stool-forms.js";
import { stoolColors } from "../src/content/colors.js";
import { appearanceRules } from "../src/game/combinations.js";
import { gameConfig } from "../src/config/game.js";

const root = new URL("../docs/", import.meta.url);
const byId = (items) =>
  Object.fromEntries(items.map((item) => [item.id, item]));
const categories = Object.fromEntries(
  foodCategories.map((item) => [item.id, item.name]),
);
const families = byId(characters);
const escapeCell = (value) =>
  String(value ?? "—")
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>");
const code = (value) => `\`${value}\``;
function table(headers, rows) {
  return [headers, headers.map(() => "---"), ...rows]
    .map((row) => `| ${row.map(escapeCell).join(" | ")} |`)
    .join("\n");
}
const json = (value) =>
  Object.keys(value || {}).length ? code(JSON.stringify(value)) : "无";
const tags = (value) => (value.length ? value.map(code).join("、") : "无");
const notice = `> 本文件由 [内容文档生成器](../scripts/generate-content-docs.mjs)读取当前源码生成；是配置快照，后台保存或修改内容后需重新生成。规则版本 ${gameConfig.rulesVersion}，存档版本 ${gameConfig.saveVersion}。用户需求见 [需求规格](requirements.md)，具体数值和扩充内容的设计归属见 [自主补充的设计与实现](implementation-decisions.md)。\n`;
const effectGuide = `## 效果字段怎样读

以下是虚构游戏参数，不是现实营养或身体反应的量化结论。效果文案用于理解，精确生效字段以配置表为准；标签也会触发候选和颜色，因此 effects 为空不代表没有影响。

${table(
  ["字段", "当前含义"],
  [
    [
      "typeShift",
      "正值偏向更软的结构，负值偏向更硬；总和限制在 −2～+3。不是必出某型。",
    ],
    [
      "typeBalance",
      "将餐盘基础倾向向 4 型拉近，累加最多 2；其他偏移仍会影响最终分布。",
    ],
    [
      "formationStability",
      "增加中心结构权重，合计最多 0.18；归一化后概率还受结构亲和度影响。",
    ],
    ["smoothnessBonus", "叠加到顺畅度，最终取整并限制在 1～5。"],
    [
      "dropWeightMultipliers",
      "指定品种候选权重的倍率。×4 不是 4% 产率，不能绕过资格或稀有上限。",
    ],
    [
      "specialWeightMultiplier",
      "所有符合条件的稀有候选权重倍率；仍受共同预算限制。",
    ],
    ["specialWeightBonus", "加到符合条件的稀有基础权重上；仍需归一化。"],
    [
      "tags",
      "内容线索的标签；与食物、设备、力度标签合并，用于产出条件和色素。",
    ],
  ],
)}

候选条件在 [便便内容文档](stools.md)，完整计算在 [算法说明报告](food-outcome-algorithm.md)。\n`;

const activeFoodEffects = (food) =>
  Object.fromEntries(
    Object.entries(food.effects).filter(([key]) =>
      [
        "specialWeightBonus",
        "specialWeightMultiplier",
        "dropWeightMultipliers",
      ].includes(key),
    ),
  );
const foodDoc = `# 食物模块与完整配置

${notice}
## 需求与当前实现

用户要求梗食物、常见食物、影响形态的食物，并明确点名华莱士汉堡、金针菇、香蕉和观音土；允许补充原材料、成品、地区食物和幻想内容。具体名单、分组、开放局数和数值由当前实现补充，不能把整表都视为用户逐项指定。

当前 ${foods.length} 种，${foods.filter((food) => food.unlockAt === 0).length} 种初始开放，${foods.filter((food) => food.unlockAt > 0).length} 种按完成局数开放。原有 30 种中已包含熟香蕉，新增观音土及另外 20 种，所以总数为 51。

餐盘最多三种且不重复；当前实现至少选一种。浮窗为分类、双列大卡片、按可用高度每页 2 / 4 / 6 格、介绍和下方三格餐盘，已解锁排在未解锁前。选中与加入餐盘是两步，确认才提交草稿；取消保留原配方。不提供搜索，也没有“趣味食物”分类。

## 九项数值与色素

${table(
  ["字段", "名称", "1 的含义", "7 的含义", "层级"],
  foodAttributeFields.map((field) => [
    code(field.key),
    field.label,
    field.low,
    field.high,
    field.group === "overall"
      ? "独立外层强度"
      : field.advanced
        ? "高级参数"
        : "主参数",
  ]),
)}

数值均为 1～7 整数；软硬程度为 **1 很软、7 很硬**，与 Bristol 1 型硬、7 型水样的方向相反。代码键 softness 实际表示硬度刻度。pigmentId 为色素 ID 或 null，不是第十项等级。Admin 的影响强度在最外层，颜色单独设置，高级折叠仅包含蓬松和顺滑；玩家浮窗仅展示软硬、保留、强度三项简要参数。

软硬、凝聚、延展、颗粒、蓬松和顺滑按 influence 加权平均。保留度逐食物独立保存；主食物色素按 colorStrength × influence 排序取一个，平局按 ID。金针菇当前 retention=7，吃下后确定出现专属印记；实现允许把它调到 1 而关闭印记，此边界见 [实现差距](implementation-decisions.md#需要明确的边界与后续决定)。

## 完整食物清单

${table(
  ["ID", "食物", "分类", "开放条件", "幻想标记", "介绍"],
  foods.map((food) => [
    code(food.id),
    food.name,
    categories[food.category],
    food.unlockAt === 0 ? "初始" : `完成 ${food.unlockAt} 局`,
    food.fictional ? "是" : "否",
    food.description,
  ]),
)}

## 当前实际属性

下表直接读取食物参数源码，包含已有调参结果，不是重置后的建议初值。列“强”是 influence；“硬”是 softness；“保”是 retention。

${table(
  [
    "ID",
    "食物",
    "强",
    "硬",
    "凝聚",
    "延展",
    "颗粒",
    "保",
    "染色",
    "蓬松",
    "顺滑",
    "色素",
  ],
  foods.map((food) => {
    const a = food.attributes;
    return [
      code(food.id),
      food.name,
      a.influence,
      a.softness,
      a.cohesion,
      a.elongation,
      a.grain,
      a.retention,
      a.colorStrength,
      a.porosity,
      a.lubricity,
      a.pigmentId
        ? `${stoolColors[a.pigmentId].name} / ${code(a.pigmentId)}`
        : "无",
    ];
  }),
)}

## 标签、外观基础与额外权重

appearanceId 参与基础外观选择，不等于最终收藏 ID；低水量、辣味、咖啡等优先规则仍可替换它。食物 effects 中只有以下表列出的额外收藏倍率与稀有加成生效。食物原记录中的 typeShift、typeBalance、formationStability、smoothnessBonus、typeWeights、outcomeMarks 不再重复叠加，形态以九项属性为准。例如观音土旧 typeShift=-1.2 不是当前额外生效的偏移。

${table(
  ["食物 ID", "标签", "基础外观", "当前生效的额外 effects"],
  foods.map((food) => [
    code(food.id),
    tags(food.tags),
    code(food.appearanceId),
    json(activeFoodEffects(food)),
  ]),
)}

## traits 参考资料

traits 保留为内容参考与部分提示资料，不是另一套形态主参数。以下值是游戏资料等级，不是克重或营养测量值。

${table(
  [
    "食物 ID",
    "fiber 纤维",
    "fat 油脂",
    "spice 辣度",
    "moisture 水分",
    "fermented 发酵",
  ],
  foods.map((food) => [
    code(food.id),
    ...["fiber", "fat", "spice", "moisture", "fermented"].map(
      (key) => food.traits[key],
    ),
  ]),
)}

## 维护入口

- 定义：[foods.js](../src/content/foods.js)、[expanded-foods.js](../src/content/expanded-foods.js)。
- 实际可调值：[food-attribute-values.js](../src/content/food-attribute-values.js)；不要用生成文档覆盖该文件。
- 字段与校验：[food-attributes.js](../src/content/food-attributes.js)；合并：[food-profile.js](../src/game/food-profile.js)、[effects.js](../src/game/effects.js)。
- 操作：[食物调参指南](food-admin.md)；产出：[算法说明报告](food-outcome-algorithm.md)。
`;

function supplyDoc(kind, items) {
  const drink = kind === "drinks";
  const title = drink ? "饮料" : "添加剂";
  const intro = drink
    ? "用户明确要求将饮料独立为配方子模块，并在主界面提供入口。当前 20 种具体饮料、每次单选、全部开放、即选即存以及饮用量范围，均是实现补充。饮料与食物分开，原味酸奶等已经属于食物的内容不会自动迁入饮料。"
    : "用户明确要求将添加剂独立为配方子模块，并在主界面提供入口。当前 18 种名单、最多选三种、全部开放和即选即存由实现补充。添加剂使用标签与 effects，不使用食物的九项 1～7 参数。";
  return `# ${title}模块与完整配置

${notice}
## 需求与当前实现

${intro}

${drink ? `每局一种饮料，默认清水；饮料浮窗还提供饮用量。饮用量字段 water 为 ${gameConfig.water.min}～${gameConfig.water.max} mL，步长 ${gameConfig.water.step}，默认 ${gameConfig.water.default}。它是独立的游戏输入，没有按每杯饮料容量、热量或糖分重新计算。` : `每局零至 ${gameConfig.maxAdditives} 种，不重复；达到上限时禁用其他未勾选项，取消已有选择即可替换。各种标签可共存，但不保证所有对应收藏在同一次产出中出现。`}

双列大卡片，按可用高度每页 2 / 4 / 6 种，无搜索；当前全部开放，unlock.kind 都为 open，该元数据尚没有接入正式解锁曲线。选择即时保存，关闭浮窗不撤销。Admin 当前只提供饮料和添加剂的搭配预览，没有内容增删或效果编辑器。

## 完整内容清单

${table(
  drink
    ? ["ID", "饮料", "内容分组", "介绍", "效果文案"]
    : ["ID", "添加剂", "符号", "介绍", "效果文案"],
  items.map((item) => [
    code(item.id),
    item.name,
    drink ? item.category : item.symbol,
    item.description,
    item.effectLabel,
  ]),
)}

## 当前精确配置

${table(
  ["ID", "图标配色", "标签", "effects", "开放方式"],
  items.map((item) => [
    code(item.id),
    code(item.color),
    tags(item.tags),
    json(item.effects),
    code(item.unlock.kind),
  ]),
)}

${effectGuide}
## 色素、材质和稀有结果

普通造型可以继承色素，点缀保留自己的颜色；固定色条目与稀有材质保留专属色。饮料色素优先于添加剂，再到食物色素。标签提供资格，倍率提高权重，最终仍从完整候选池抽取一个便便个体。

金箔碎片与纯黄金是不同收藏层级：碎金、闪粉属于特别点缀，纯黄金、晶体、彩虹和果冻等属于稀有材质。当前所有 special 候选合计概率不超过 ${gameConfig.maxSpecialProbability * 100}%。固定 4 型的黄金资格规则没有强制金箔来源；其他稀有的门槛见 [便便文档](stools.md)。

维护源：[${kind}.js](../src/content/${kind}.js)，合并：[effects.js](../src/game/effects.js)，颜色：[color.js](../src/game/color.js)，界面：[supplies.js](../src/ui/supplies.js)。
`;
}

const conditionNames = {
  foodIdsAny: "食物任一",
  foodIdsAll: "食物全部",
  drinkId: "饮料",
  toiletId: "马桶",
  waterMin: "水量至少",
  waterMax: "水量至多",
  types: "结构类型",
  forceZone: "力度档",
  additivesAll: "添加剂全部",
  tagsAny: "标签任一",
  tagsAll: "标签全部",
  excludedTags: "不得含标签",
};
function conditions(value = {}) {
  return (
    Object.entries(value)
      .map(
        ([key, val]) =>
          `${conditionNames[key] || key}：${Array.isArray(val) ? val.join("、") : val}${key.startsWith("water") ? " mL" : ""}`,
      )
      .join("；") || "无额外条件"
  );
}
const familyRows = characters.map((item) => [
  code(item.id),
  item.name,
  `${rarityLabels[item.rarity]} / ${item.material}`,
  item.types.join("、"),
  item.drop?.weight ?? "基础品种",
  item.drop ? conditions(item.drop.conditions) : "依基础外观优先规则选中",
]);
const stoolDoc = `# 便便、图鉴条目与独立个体

${notice}
## 用户要求与当前数据模型

用户要求整份配方共同决定产出，在便便上可见食材特征；每次便便为独立个体，按实际形态归入健康形态分类；未发现的只显示统一虚影；描述面向形态诊断；黄金、晶体、彩虹、果冻难得并有不同演出。

便便总数固定为 **50 种**，每种只有一个名称、一个图鉴条目和一个固定 Bristol 分类。每次产出另有独立 UUID、序号、配方、色素、印记、纹理、种子与时间；个体差异不会扩充品种数。

- 例：gold 是黄金传说这一种便便；gold:4 是它唯一的固定 4 型图鉴条目；两次获得会保存两个个体，不合并外观，也不增加新的便便品种。
- 当前从有限模板候选池生成，不是根据食物连续重建任意 3D 网格。分类读取 morphology.form，预告按同一个完整池汇总，不额外随机一次类别。
- 图鉴筛选只有“全部”和七型；双列大卡片、按可用高度每页 2 / 4 / 6 格，个体详情单独展开。未知条目统一虚影并隐藏真实名称、稀有度、材质和介绍；发现后逐个查看独立记录。

## 七型与当前条目数量

${table(
  ["分类", "名称", "实际结构 ID", "形态诊断", "条目数"],
  bristolTypes.map((type) => [
    type.id,
    type.name,
    code(stoolForms[type.id - 1].id),
    type.assessment,
    specimenBlueprints.filter(
      (item) => item.morphology.form === stoolForms[type.id - 1].id,
    ).length,
  ]),
)}

“一气呵成螺旋”是 spiral:4，完整连续、柔软成形，属于 4 型；螺旋是造型，不能成为额外健康分类。当前它还要求轻力度，是我添加的产出条件。

## 稀有层级

${table(
  ["代码", "显示名称", "品种数", "图鉴条目数", "预算"],
  ["common", "uncommon", "special"].map((rarity) => [
    code(rarity),
    rarityLabels[rarity],
    characters.filter((item) => item.rarity === rarity).length,
    specimenBlueprints.filter((item) => item.rarity === rarity).length,
    rarity === "special" ? "共用 0.5% 上限" : "普通候选预算",
  ]),
)}

0.5% 是当前实现的共同上限，不是每款 0.5%，也不是每个配方都会达到的概率。参考美术文档的五档品质没有直接变成游戏数值品质。特别点缀不属于 special 稀有预算。

## 八种稀有材质的精确门槛

条件字段之间同时满足；tagsAny 内部满足任意一个标签即可。types 限定候选本身的结构，不代表先独立抽一次分类。

${table(
  ["品种", "材质", "允许结构", "基础权重", "额外条件"],
  characters
    .filter((item) => item.rarity === "special")
    .map((item) => [
      code(item.id),
      item.material,
      item.types.join("、"),
      item.drop.weight,
      conditions(item.drop.conditions),
    ]),
)}

**黄金是来源门槛的例外**：固定 4 型、水量至少 1000 mL 且没有辣味/咖啡排斥标签即可低概率进入；金箔、金箔乌龙、黄金马桶是加权来源，不是必需原料。黄金另有西兰花 + 益生菌 + 1500～2000 mL 的 ×1.5 加权。其余七种需相应标签，全部仍受共同上限约束。

## 基础外观的优先规则

${table(
  ["优先级", "品种", "条件"],
  appearanceRules.map((rule, index) => [
    index + 1,
    code(rule.characterId),
    conditions(rule.conditions),
  ]),
)}

命中第一条后停止；否则绿色标签优先选择 garden，再使用食物基础外观票数最多的普通品种（平票按 ID），不匹配时用 classic。该偏好仅在品种自身分类与当前结构一致时采用，否则选已有的基础品种：1 型 pebble、2 型 stacked-stones、3 型 cracked、4 型 classic、5 型 soft-pillows、6 型 mashed-potato、7 型 pancake。不会创建同款的其他类型版本。

## 50 种便便与全部候选条件

基础权重不是最终概率。同结构内普通候选合计归一到 ${gameConfig.commonDropWeight} 权重，稀有候选经加权和预算限制，再乘结构亲和度组成完整池。下表同时保留 ID，便于在源码中查找。

${table(["品种 ID", "默认名称", "品质 / 材质", "固定分类", "基础权重", "条件（还需满足固定分类）"], familyRows)}

## 50 个图鉴条目全表

以下诊断由对应结构与材质描述组成，是内容目录说明，不是食物来源日志。玩家看到的结果诊断还会根据实际颜色、颗粒、气孔和残留追加描述。

${bristolTypes
  .map(
    (type) =>
      `### ${type.id} 型 · ${type.name}\n\n${table(
        ["条目 ID", "名称", "品质 / 材质", "形态与表面描述"],
        specimenBlueprints
          .filter((item) => item.morphology.form === stoolForms[type.id - 1].id)
          .map((item) => {
            const family = families[item.characterId];
            return [
              code(item.id),
              item.name,
              `${rarityLabels[item.rarity]} / ${family.material}`,
              `${type.assessment} ${family.description}`,
            ];
          }),
      )}`,
  )
  .join("\n\n")}

## 独立个体与美术呈现

每次产出保存 id、sequence、specimenId、characterId、morphology、type、colorId、marks、appearance、recipe、createdAt、rulesVersion、score 和 smoothness；同一局只结算一次。调参后不重算已经锁定的结果。

普通主体可染色，颗粒与气孔用纹理叠层，食材保留用自己的图案；金针菇为专属 3D 印记。3/4 型有轻微横向伸展，种子改变纹理相位、印记位置和小角度朝向。稀有结果有专属色板、纹样、粒子、动画和可关闭的音效，演出不消耗抽奖随机数。

统一风格见 [用户提供的美术参考](art-direction.md)，静态 PNG 与生成管线见 [便便美术实现](stool-art.md)。运行时是 SVG 容器与本地预渲染 PNG，没有交互式 3D 旋转查看。

维护源：[specimens.js](../src/content/specimens.js)、[specimen-blueprints.js](../src/content/specimen-blueprints.js)、[stool-forms.js](../src/content/stool-forms.js)。规则：[combinations.js](../src/game/combinations.js)、[outcome-pool.js](../src/game/outcome-pool.js)、[individuals.js](../src/progression/individuals.js)。
`;

const toiletDoc = `# 马桶模块与完整配置

${notice}
## 需求与当前实现

用户要求不同马桶影响顺畅度和特殊便便产出概率。当前实现补充了 10 款装备、各自材质造型、设备专属候选及具体数值；默认开放经典白瓷马桶、经典蹲坑和野趣石头堆，其余按累计完成次数解锁。次数暂定为薄荷 3、暖座 5、按摩 8、檀香 12、涡流 18、水晶 25、黄金 40，属于可调整的实现配置，后续条件集中修改 \`src/content/toilets.js\` 顶部的 \`toiletUnlocks\`。

主界面直接点击中央马桶打开切换面板。面板展示名称、大图与简短描述，左右箭头（也支持键盘方向键）只预览全部马桶。当前使用款按钮显示“正在使用”，其他已解锁款按钮显示“蹲它”，点击才会装备并保存；这两种状态不重复显示按钮上方的状态小字；关闭或取消不会应用预览。未解锁款保留带锁按钮，按钮上方直接显示解锁条件和当前次数。单局中锁定。owned / equipped 与数值效果分离。当前没有独立的马桶编辑后台，Admin 中可以选择马桶做食物预览。

## 完整清单

${table(
  ["ID", "名称", "材质 / 功能", "造型键", "介绍", "效果文案"],
  toilets.map((item) => [
    code(item.id),
    item.name,
    `${item.material} / ${item.feature}`,
    code(item.shape),
    item.description,
    item.effectLabel,
  ]),
)}

## 精确效果

${table(
  ["ID", "标签", "effects", "初始拥有 / 开放方式"],
  toilets.map((item) => [
    code(item.id),
    tags(item.tags),
    json(item.effects),
    `${item.starter ? "是" : "否"} / ${item.unlock.kind === "rounds" ? `完成 ${item.unlock.count} 次` : "初始开放"}`,
  ]),
)}

${effectGuide}
设备倍率只影响已经符合资格的候选。水晶马桶不能替代 crystal-source；黄金马桶不会保证黄金。涡流马桶提高螺旋权重，但 spiral:4 仍要求轻力度。石头堆的 −0.3 偏移与其他来源叠加后统一限制范围。

维护源：[toilets.js](../src/content/toilets.js)，拥有与装备：[progression/toilets.js](../src/progression/toilets.js)，造型：[artwork/toilets.js](../src/ui/artwork/toilets.js)。
`;

const documents = new Map([
  ["foods.md", foodDoc],
  ["drinks.md", supplyDoc("drinks", drinks)],
  ["additives.md", supplyDoc("additives", additives)],
  ["stools.md", stoolDoc],
  ["toilets.md", toiletDoc],
]);
if (
  new Set(specimenBlueprints.map((item) => item.id)).size !==
  specimenBlueprints.length
)
  throw new Error("图鉴 ID 重复");
const check = process.argv.includes("--check");
for (const [name, content] of documents) {
  const path = new URL(name, root);
  if (check) {
    if ((await readFile(path, "utf8")) !== content)
      throw new Error(`文档与源码不一致：${name}`);
  } else await writeFile(path, content);
}
console.log(
  `${check ? "已核对" : "已生成"} ${documents.size} 份内容文档：${foods.length} 食物、${drinks.length} 饮料、${additives.length} 添加剂、${specimenBlueprints.length} 便便条目、${toilets.length} 马桶。`,
);
