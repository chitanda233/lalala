# 马桶模块与完整配置

> 本文件由 [内容文档生成器](../scripts/generate-content-docs.mjs)读取当前源码生成；是配置快照，后台保存或修改内容后需重新生成。规则版本 13，存档版本 5。用户需求见 [需求规格](requirements.md)，具体数值和扩充内容的设计归属见 [自主补充的设计与实现](implementation-decisions.md)。

## 需求与当前实现

用户要求不同马桶影响顺畅度和特殊便便产出概率。当前实现补充了 10 款装备、各自材质造型、设备专属候选及具体数值；全部初始拥有、可立即更换，正式获得方式尚未制定。

主界面点马桶下方的名称更换装备，单局中锁定。owned / equipped 与数值效果分离。当前没有独立的马桶编辑后台，Admin 中可以选择马桶做食物预览。

## 完整清单

| ID | 名称 | 材质 / 功能 | 造型键 | 介绍 | 效果文案 |
| --- | --- | --- | --- | --- | --- |
| `standard` | 经典白瓷马桶 | 陶瓷 / 基础 | `seat` | 熟悉的白瓷小伙伴，朴素又安心。 | 基准顺畅度，忠实呈现配方 |
| `comfort` | 薄荷舒享马桶 | 陶瓷 / 软垫 | `seat` | 柔软座圈负责托住心情，惊喜留给配方。 | 顺畅 +1；稀有权重 ×1.5 |
| `golden` | 黄金马桶 | 黄金 / 奢华反光 | `royal` | 财富感围了一圈，纯金成品仍然难得。 | 顺畅 +2；稀有权重 ×2；黄金再 ×1.25 |
| `sandalwood` | 檀香木马桶 | 檀香木 / 香气放松 | `wood` | 木纹缓缓绕一圈，把紧张也绕开。 | 顺畅 +0.6；增加木纹条候选 |
| `heated` | 恒温暖座马桶 | 陶瓷 / 加热 | `heated` | 温度刚刚好，卷一圈也不着急。 | 顺畅 +0.8；增加暖卷候选 |
| `massage` | 波浪按摩马桶 | 软胶陶瓷 / 按摩 | `massage` | 咚、咚、咚，节奏开始在颗粒上留下痕迹。 | 顺畅 +1；增加按摩珠候选 |
| `squat` | 经典蹲坑 | 陶瓷 / 蹲姿 | `squat` | 熟悉的双脚落位，弹簧造型有了发力点。 | 顺畅 +1；增加弹簧条候选 |
| `stone` | 野趣石头堆 | 河石 / 户外平衡 | `stones` | 两块石头搭个平台，朴素得很有求生感。 | 顺畅 −0.5；偏硬 0.3；增加石塔候选 |
| `vortex` | 涡流助力马桶 | 钢化陶瓷 / 旋流助力 | `vortex` | 一圈旋流，给连续成形的线条一点方向。 | 顺畅 +1.2；增加螺旋与缎带权重 |
| `crystal-seat` | 水晶观测马桶 | 水晶 / 低温观测 | `crystal` | 透明外壳认真围观，晶体生长仍要有种子。 | 稀有权重 ×1.5；晶体再 ×2；提高成形稳定度 |

## 精确效果

| ID | 标签 | effects | 初始拥有 / 开放方式 |
| --- | --- | --- | --- |
| `standard` | 无 | 无 | 是 / open |
| `comfort` | 无 | `{"smoothnessBonus":1,"specialWeightMultiplier":1.5}` | 是 / open |
| `golden` | `gold-seat` | `{"smoothnessBonus":2,"specialWeightMultiplier":2,"dropWeightMultipliers":{"gold":1.25}}` | 是 / open |
| `sandalwood` | `wood-seat` | `{"smoothnessBonus":0.6}` | 是 / open |
| `heated` | `warm-seat` | `{"smoothnessBonus":0.8}` | 是 / open |
| `massage` | `massage-seat` | `{"smoothnessBonus":1}` | 是 / open |
| `squat` | `squat-seat` | `{"smoothnessBonus":1}` | 是 / open |
| `stone` | `stone-seat` | `{"smoothnessBonus":-0.5,"typeShift":-0.3}` | 是 / open |
| `vortex` | `vortex-seat` | `{"smoothnessBonus":1.2,"dropWeightMultipliers":{"spiral":2,"ribbon":2}}` | 是 / open |
| `crystal-seat` | `crystal-seat` | `{"specialWeightMultiplier":1.5,"formationStability":0.08,"dropWeightMultipliers":{"crystal":2}}` | 是 / open |

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

设备倍率只影响已经符合资格的候选。水晶马桶不能替代 crystal-source；黄金马桶不会保证黄金。涡流马桶提高螺旋权重，但 spiral:4 仍要求轻力度。石头堆的 −0.3 偏移与其他来源叠加后统一限制范围。

维护源：[toilets.js](../src/content/toilets.js)，拥有与装备：[progression/toilets.js](../src/progression/toilets.js)，造型：[artwork/toilets.js](../src/ui/artwork/toilets.js)。
