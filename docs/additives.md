# 添加剂模块与完整配置

> 本文件由 [内容文档生成器](../scripts/generate-content-docs.mjs)读取当前源码生成；是配置快照，后台保存或修改内容后需重新生成。规则版本 13，存档版本 5。用户需求见 [需求规格](requirements.md)，具体数值和扩充内容的设计归属见 [自主补充的设计与实现](implementation-decisions.md)。

## 需求与当前实现

用户明确要求将添加剂独立为配方子模块，并在主界面提供入口。当前 18 种名单、最多选三种、全部开放和即选即存由实现补充。添加剂使用标签与 effects，不使用食物的九项 1～7 参数。

每局零至 3 种，不重复；达到上限时禁用其他未勾选项，取消已有选择即可替换。各种标签可共存，但不保证所有对应收藏在同一次产出中出现。

双列大卡片，按可用高度每页 2 / 4 / 6 种，无搜索；当前全部开放，unlock.kind 都为 open，该元数据尚没有接入正式解锁曲线。选择即时保存，关闭浮窗不撤销。Admin 当前只提供饮料和添加剂的搭配预览，没有内容增删或效果编辑器。

## 完整内容清单

| ID | 添加剂 | 符号 | 介绍 | 效果文案 |
| --- | --- | --- | --- | --- |
| `probiotic` | 益生菌 | ✳ | 给配方一点秩序感。 | 向 4 型平衡 1；与充足饮用量组成云朵线索 |
| `chili` | 神秘辣酱 | ♨ | 平静的生活，需要一点出场音效。 | 偏软 +1；提供辣色线索 |
| `glitter` | 闪粉 | ✦ | 每一粒都想在结算时反光。 | 增加含闪粉便便候选，保持原有底色 |
| `gold-leaf` | 金箔碎片 | ◆ | 先从含金量开始，距离纯金还差一次幸运。 | 增加金箔碎片候选；黄金权重 ×4 |
| `silver-dust` | 银色糖霜 | ✧ | 像刚落了一点银白色的雪。 | 增加银色斑点候选 |
| `crystal-seed` | 晶体种子 | ◇ | 几何形状从一颗种子开始。 | 开启晶体候选；晶体权重 ×4 |
| `rainbow-sugar` | 彩虹糖屑 | ❖ | 七种颜色到齐了，能否排好队另说。 | 开启彩虹候选；彩虹权重 ×4 |
| `gelatin` | 弹弹凝胶 | ◒ | Q 弹资格已提交，审核依旧靠抽签。 | 开启果冻候选；果冻权重 ×4 |
| `popping-candy` | 跳跳糖 | ※ | 落地之前先开一场小型演唱会。 | 增加爆裂颗粒与气孔候选；偏软 0.3 |
| `charcoal` | 竹炭粉 | ● | 低调的黑色，连斑点都很克制。 | 提供炭黑色与芝麻斑点线索 |
| `fiber` | 膳食纤维粉 | ≋ | 给松散的灵感牵几根线。 | 增加成形稳定度；向 4 型平衡 0.4 |
| `oil` | 顺滑植物油 | ◕ | 为这一段旅程打点润滑。 | 顺畅 +0.7；偏软 0.3；增加长条候选 |
| `frost-salt` | 霜花盐 | ❄ | 实验室里的小雪天。 | 开启霜晶候选；偏硬 0.4 |
| `cocoa-powder` | 可可粉 | ∴ | 棕色收尾，团团圆圆。 | 增加可可团候选；偏硬 0.3 |
| `flower-petal` | 干花瓣 | ✿ | 把一小把春天折进普通日子。 | 增加花瓣夹心候选 |
| `stardust` | 星尘 | ⋆ | 宇宙寄来的少量边角料。 | 开启陨星与夜光候选 |
| `magnet-sand` | 磁力砂 | ⌁ | 颗粒之间有点吸引力，叠起来比较整齐。 | 增加石块堆叠与节段造型候选 |
| `amber-resin` | 琥珀树脂 | ◈ | 透明又黏的收藏念头。 | 开启琥珀化石候选；偏硬 0.3 |

## 当前精确配置

| ID | 图标配色 | 标签 | effects | 开放方式 |
| --- | --- | --- | --- | --- |
| `probiotic` | `#a5b578` | `probiotic` | `{"typeBalance":1}` | `open` |
| `chili` | `#c88766` | `chili` | `{"typeShift":1}` | `open` |
| `glitter` | `#baa778` | `glitter` | `{"dropWeightMultipliers":{"glitter":2}}` | `open` |
| `gold-leaf` | `#c8aa52` | `gold-source` | `{"dropWeightMultipliers":{"gold":4}}` | `open` |
| `silver-dust` | `#9fadb7` | `silver` | 无 | `open` |
| `crystal-seed` | `#94c3d0` | `crystal-source` | `{"dropWeightMultipliers":{"crystal":4}}` | `open` |
| `rainbow-sugar` | `#b08fb9` | `rainbow-source` | `{"dropWeightMultipliers":{"rainbow":4}}` | `open` |
| `gelatin` | `#adc985` | `gel-source` | `{"dropWeightMultipliers":{"jelly":4}}` | `open` |
| `popping-candy` | `#d7a574` | `popping`、`bubbles` | `{"typeShift":0.3}` | `open` |
| `charcoal` | `#667575` | `charcoal` | 无 | `open` |
| `fiber` | `#a9b282` | `fiber-powder` | `{"typeBalance":0.4,"formationStability":0.12}` | `open` |
| `oil` | `#c5b677` | `oil` | `{"smoothnessBonus":0.7,"typeShift":0.3}` | `open` |
| `frost-salt` | `#accfd5` | `frost-source` | `{"typeShift":-0.4}` | `open` |
| `cocoa-powder` | `#9e7b61` | `cocoa` | `{"typeShift":-0.3}` | `open` |
| `flower-petal` | `#c496aa` | `petal` | 无 | `open` |
| `stardust` | `#9296bd` | `star-source`、`glow-source` | 无 | `open` |
| `magnet-sand` | `#858d9a` | `magnet` | 无 | `open` |
| `amber-resin` | `#caa16c` | `amber-source` | `{"typeShift":-0.3}` | `open` |

## 效果字段怎样读

以下是虚构游戏参数，不是现实营养或身体反应的量化结论。效果文案用于理解，精确生效字段以配置表为准；标签也会触发候选和颜色，因此 effects 为空不代表没有影响。

| 字段 | 当前含义 |
| --- | --- |
| typeShift | 正值偏向更软的结构，负值偏向更硬；总和限制在 −2～+3。不是必出某型。 |
| typeBalance | 将餐盘基础倾向向 4 型拉近，累加最多 2；其他偏移仍会影响最终分布。 |
| formationStability | 增加中心结构权重，合计最多 0.18；归一化后概率还受结构亲和度影响。 |
| smoothnessBonus | 叠加到顺畅度，最终取整并限制在 1～5。 |
| dropWeightMultipliers | 指定品种候选权重的倍率。×4 不是 4% 产率，不能绕过资格或稀有上限。 |
| specialWeightMultiplier | 所有符合条件的稀有候选权重倍率；仍受共同预算限制。 |
| specialWeightBonus | 加到符合条件的稀有基础权重上；仍需归一化。 |
| tags | 内容线索的标签；与食物、设备、力度标签合并，用于产出条件和色素。 |

候选条件在 [便便内容文档](stools.md)，完整计算在 [算法说明报告](food-outcome-algorithm.md)。

## 色素、材质和稀有结果

普通造型可以继承色素，点缀保留自己的颜色；固定色条目与稀有材质保留专属色。饮料色素优先于添加剂，再到食物色素。标签提供资格，倍率提高权重，最终仍从完整候选池抽取一个便便个体。

金箔碎片与纯黄金是不同收藏层级：碎金、闪粉属于特别点缀，纯黄金、晶体、彩虹和果冻等属于稀有材质。当前所有 special 候选合计概率不超过 0.5%。固定 4 型的黄金资格规则没有强制金箔来源；其他稀有的门槛见 [便便文档](stools.md)。

维护源：[additives.js](../src/content/additives.js)，合并：[effects.js](../src/game/effects.js)，颜色：[color.js](../src/game/color.js)，界面：[supplies.js](../src/ui/supplies.js)。
