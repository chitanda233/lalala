# 模块与内容指南

原生 ES Modules。内容和规则不依赖 DOM、音频或 localStorage，`src/main.js` 连接规则、存档与界面。

## 模块边界

| 文件                                            | 职责                                                   |
| ----------------------------------------------- | ------------------------------------------------------ |
| content/foods.js / expanded-foods.js            | 51 种食物、分类、属性、效果文案、幻想标记与解锁局数    |
| content/drinks.js / additives.js                | 20 种饮料、18 种添加剂，描述、标签、效果、预留解锁字段 |
| content/toilets.js                              | 10 种马桶，材质、形态、功能、效果与配色                |
| content/stools.js / specimens.js                | 七型定义、56 种便便、来源条件与稀有度                  |
| content/colors.js / force.js                    | 底色、力度区间与往复指针计算                           |
| content/stool-forms.js / specimen-blueprints.js | 结构定义与 56 个固定形态的独立条目                     |
| game/recipe-shape.js / outcome-pool.js          | 配方结构亲和度、完整标本概率池                         |
| game/specimen.js / progression/individuals.js   | 按成品结构分类、每次产出的独立归档                     |
| game/selection.js                               | 统一输入、有效内容校验、去重与数量限制                 |
| game/food-profile.js / effects.js               | 合并餐盘属性和全部来源效果                             |
| game/stool-type.js / smoothness.js              | 主形态、相邻分布、顺畅度                               |
| game/combinations.js / drops.js                 | 候选筛选、权重与稀有预算、结果抽取                     |
| game/color.js / explanation.js                  | 独立底色与基于结果快照的形态诊断                       |
| game/session.js                                 | 单局快照、恢复、计时与一次性结算                       |
| progression/                                    | 食物解锁、品尝记录、图鉴、马桶拥有和装备               |
| storage/                                        | 当前模型校验、读写与多标签页结算锁                     |
| ui/food-picker.js                               | 食物库分类、分页、介绍、三格草稿餐盘                   |
| ui/collection.js                                | 七型图鉴、统一未发现剪影与收集后详情                   |
| ui/rare-reveal.js / audio.js                    | 八种稀有材质的独立结果演出、短音效与清理               |
| ui/                                             | 配料浮窗、场景、结果与美术装配                         |

依赖方向：内容与配置 → 规则 → 养成/存档 → 页面装配。游戏仅有根目录 styles.css 一套手机布局，分页、浮窗和稀有演出均在此维护；不存在桌面/手机双版本。交互规范见 [手机单屏规范](mobile-ui.md)。

## 一局输入

```js
{
  foodIds: ["oatmeal", "apple", "broccoli"],
  drinkId: "blueberry-juice",
  water: 1750,
  additives: ["glitter", "flower-petal"],
  toiletId: "heated",
  digestionTime: "4",      // 2 / 4 / 8 / random，形态权重档位
  force: 20,                // 0–100，玩家点击停止时确定
}
```

食物一至三种，饮料一种，添加剂零至三种，装备一款马桶。normalizeSelection 负责默认值、范围、去重与上限；开局额外检查食物解锁与马桶拥有。食物共 51 种，33 种初始开放，18 种仍按完成局数解锁；新增 21 种的 unlockAt 为 0。饮料、添加剂、马桶本轮全部开放，unlock: { kind: "open" } 预留后续解锁设计；马桶仍有独立 owned / equipped。

## 结果生成

1. 规范餐盘、饮料、饮用量、添加剂、消化档位和马桶，创建单局 ID，进入 aiming 阶段；随机消化在这里抽一次实际档位，不抽便便结果。
2. 点击停止后，按已摆动时间确定 force，进入 running 阶段。按 influence 合并软硬、凝聚、延展、颗粒、蓬松和顺滑；印记逐食物保留，色素选主要来源。
3. recipe-shape.js 用硬度的反向值、水量和来源效果计算结构亲和度，凝聚与延展修正结构权重。该步骤不抽分类。
4. outcome-pool.js 将来源条件、造型倍率、稀有资格与预算编译成完整标本候选；每个候选都带固定 morphology 和 specimenId。
5. 第一次随机选择完整标本；第二次随机记录该个体的 variationSeed，用于细微朝向、纹理相位和残留布局。
6. 装配底色、食物印记和纹理，再由 classifySpecimen 读取实际结构归入七型，计算顺畅度和分数。概率预告从相同完整池汇总。
7. 停止指针时冻结全部结果；individualId 与单局 ID 相同。刷新或之后调参不重抽。
8. 结算后把每次产出追加到 individuals，独立保留颜色、纹理与印记。图鉴以固定条目归类，展开可逐个查看，同种新个体不覆盖上次。

专属色收藏与稀有材质保留自身颜色，其他普通标本按饮料、添加剂、食物色素等优先级取色。完整公式和可运行脚本见 [算法说明报告](food-outcome-algorithm.md)。

## 通用效果与条件

下表保留饮料、添加剂、马桶和力度的通用效果。食物形态改由 attributes 统一控制，不再重复计算食品 typeShift、typeBalance、formationStability、smoothnessBonus、typeWeights 或 outcomeMarks；食品特定收藏倍率和稀有加成继续参与。

| effects 字段            | 合并方式与边界                                       |
| ----------------------- | ---------------------------------------------------- |
| typeBalance             | 累加，最多 2；先向 4 型靠近                          |
| typeShift               | 累加，限制 −2 至 +3；之后移动，最终类型限制 1–7      |
| formationStability      | 累加，最多 0.18；基础分布的主形态占比最多 0.95       |
| typeWeights             | 按 1–7 型键累加非负权重，叠加基础 100 权重后归一化   |
| outcomeMarks            | 已注册的必出食物印记去重；不改变形态、外观或稀有抽签 |
| smoothnessBonus         | 累加后取整，最终顺畅度 1–5                           |
| specialWeightBonus      | 对符合条件的稀有基础权重加值                         |
| specialWeightMultiplier | 所有符合条件的稀有候选权重相乘                       |
| dropWeightMultipliers   | 指定外观 ID 的权重相乘，支持普通造型和稀有材质       |

食物的九项属性均校验为1–7整数，色素为有效 palette ID 或 null。标签合并去重，用于具体候选条件；高蓬松度可以提供普通气泡造型线索。餐盘和添加剂的排列不改变结果。形态保留度逐食物记录，混搭不会抹掉食材身份。

条件支持 foodIdsAny、foodIdsAll、drinkId、toiletId、waterMin、waterMax、types、forceZone、additivesAll、tagsAny、tagsAll、excludedTags。所有配置条件同时满足才进入候选。tagsAny 内部满足任意标签即可。

例如金箔使黄金权重乘 4，金箔乌龙乘 3，黄金马桶通用乘 2、黄金再乘 1.25。加成是权重倍率，最终概率会归一化并受 0.5% 总上限约束。闪粉、碎金等 rarity: "uncommon" 表示特别点缀，属于非稀有预算；gold / crystal / rainbow / jelly 等 rarity: "special" 必须走稀有池。

## 维护内容

所有内容使用稳定唯一 ID。新增饮料/添加剂需要 name、description、effectLabel、tags、effects、unlock；马桶另有 material、shape、feature、palette、starter。改动效果不需要改 UI 列表。正式增加解锁条件时，在 progression 中实现规则，再替换 unlock 配置，保留既有拥有状态。

食物在 foods.js 汇总，expanded-foods.js 提供本轮新增内容。字段包括 category、art、unlockAt、attributes、traits、appearanceId、tags、effects，可选 fictional；attributes 由独立参数文件提供，界面说明由实际参数生成。regional 与 fantasy 分别用于「风味奇遇」和「幻想配料」分类；fictional: true 的内容在介绍中显示幻想标记。游戏和 Admin 都不提供搜索功能。normalizeFoods 按当前内容配置与完成局数计算可用食物。

调整或替换现有便便在 specimens.js 配置；便便总数为 56，不再按七型扩展同款：

```js
{
  id: "new-specimen",
  name: "新收藏",
  homeType: 4,               // 此种便便唯一的固定分类
  types: [4],                // 只能包含 homeType，不展开额外条目
  category: "稀有材质",
  rarity: "special",
  material: "新材质",
  art: "crystal",
  color: "#8cb8cb", light: "#d2edf2",
  description: "看起来与来源说得通的短介绍",
  hint: "玩家可执行的配方线索",
  drop: { weight: 0.02, conditions: { tagsAny: ["new-source"] } }
}
```

variantRules / specialRules 从 drop、固定 types、rarity 生成。稀有款必须通过稀有池，不能通过普通基础外观设成必出。specimen-blueprints.js 对每种便便只建立一个条目；调整后验证总数仍为 50、每种只出现在一个分类、能够实际产出且素材齐全。

图鉴保持「全部 + 七型」。56 个独立条目各有固定 morphology，通过 classifySpecimen 归档；每次产出另有 individualId，展开对应条目可逐只查看。顺畅小能手只属于 4 型，摊平小煎饼只属于 7 型；改颜色或加印记不会创建额外条目。

未收集卡片的可见内容统一为神秘剪影和未知状态，隐藏名称、类别、稀有度、材质、描述及线索。收集后才调用真实美术并显示具体文案；七型分类定义独立保留，避免透过未发现造型提前识别收藏。

## 稀有结果呈现

createRareReveal(dialog) 提供 show(character) 与 clear()，只在 rarity: "special" 时装配稀有发现区。八种材质在 rareRevealThemes 中分别配置标题、配色、装饰纹样和短旋律。页面通过 data-rarity、data-material 与 rare-result 类选取样式；普通和特别点缀保留常规结果流程。

演出读取已保存的结算结果，不调用 Math.random，不改抽取权重，也不延迟奖励或按钮。一次入场和粒子散开结束后保留静态装饰，无闪烁循环。prefers-reduced-motion: reduce 关闭相关动画与过渡，保留静态材质表现。关闭弹窗、重玩、开始后续单局时清理旧装饰；关闭和静音会停止已排队的结果音符。close 事件检查 dialog.open，避免旧关闭事件误清理已重新打开的新结果。

正式美术与演出分开：便便轮廓、表面与透明素材属于美术入口，光晕、纹样和粒子属于呈现层。替换模型不改变结算结果或图鉴稳定 ID。

## 存档与验证

开发存储键为 `lalala-dev`。`individuals` 是唯一标本记录来源，每条保存 ID、序号、specimenId、morphology、type、颜色、印记、appearance 与配方、时间。相同条目的不同产出分别保存，不合并印记。`storage/model.js` 只校验当前模型；缺少必要结构的单局与标本直接拒绝，不重建记录。

单局 ID、lastSettledSessionId 与已归档个体 ID 防止重复发放，Web Locks 串行处理跨标签页结算。无法写 localStorage 时仍可在页面内存中游玩。暂未引入货币、付费或服务端账号。

验证覆盖 50 个独立条目的名称、结构和素材，56 种便便经完整候选池实际产出；20/18/10 内容数量；配方印记与色素叠加；稀有资格与合计 0.5% 上限；同款多次独立归档、当前模型校验、刷新和多标签页结算；桌面与手机布局。

完整设计表见 [配方实验室内容手册](recipe-lab.md)，食物细节见 [食物模块指南](foods.md)。

美术入口 `ui/artwork/stools.js` 使用本地透明 PNG 与 SVG 染色层，`content/marks.js` 维护印记注册表。`scripts/stool-art/` 在开发期统一渲染 50 个实际形态，运行时不需要 WebGL；164 张旧款 PNG 素材覆盖原有 50 款及七型兜底，新增 6 款第7型藏品另使用本地 WebP 图集。规范、视觉校样与重渲染说明见 [美术管线](stool-art.md)。

## 独立策划后台

admin/ 是本地开发工具，与游戏页面和运行时入口分开。/admin/ 读取完整51食物参数，支持修改前后预览、三食物搭配、草稿和批量保存。GET/PUT /api/admin/foods 只操作 food-attribute-values.js，通过共享校验、全量ID检查、同源检查、revision版本冲突和原子写入保护数据。

scripts/build.mjs 按运行时白名单生成 dist/，排除 admin/、管理接口、源码写入脚本、测试和文档，并校验运行时引用没有指向后台。npm run preview 只服务 dist/，禁用管理页面及接口。后台保存后的内容数据随游戏发布，后台功能本身不打包。具体参数与操作见 [食物调参指南](food-admin.md)。
