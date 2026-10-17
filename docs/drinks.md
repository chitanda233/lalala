# 饮料模块与完整配置

> 本文件由 [内容文档生成器](../scripts/generate-content-docs.mjs)读取当前源码生成；是配置快照，后台保存或修改内容后需重新生成。规则版本 13，存档版本 5。用户需求见 [需求规格](requirements.md)，具体数值和扩充内容的设计归属见 [自主补充的设计与实现](implementation-decisions.md)。

## 需求与当前实现

用户明确要求将饮料独立为配方子模块，并在主界面提供入口。当前 20 种具体饮料、每次单选、全部开放、即选即存以及饮用量范围，均是实现补充。饮料与食物分开，原味酸奶等已经属于食物的内容不会自动迁入饮料。

每局一种饮料，默认清水；饮料浮窗还提供饮用量。饮用量字段 water 为 250～2500 mL，步长 250，默认 1500。它是独立的游戏输入，没有按每杯饮料容量、热量或糖分重新计算。

双列大卡片，按可用高度每页 2 / 4 / 6 种，无搜索；当前全部开放，unlock.kind 都为 open，该元数据尚没有接入正式解锁曲线。选择即时保存，关闭浮窗不撤销。Admin 当前只提供饮料和添加剂的搭配预览，没有内容增删或效果编辑器。

## 完整内容清单

| ID | 饮料 | 内容分组 | 介绍 | 效果文案 |
| --- | --- | --- | --- | --- |
| `water` | 清水 | 日常 | 没有隐藏剧本，给今天留一点发挥空间。 | 保留餐盘原本的形态与颜色倾向 |
| `coffee` | 一杯咖啡 | 日常 | 叫醒灵魂，也给出场铃按快一档。 | 偏软 +1；提供咖啡色线索 |
| `black-tea` | 浓缩红茶 | 日常 | 这一杯很有收尾意识，连配方都想收紧一点。 | 偏硬 0.6；增加琥珀色候选 |
| `oat-milk` | 燕麦奶 | 日常 | 谷物开了家奶茶店，招牌叫稳稳当当。 | 向 4 型平衡 0.5；增加谷物斑点候选 |
| `prune-juice` | 西梅汁 | 果蔬 | 江湖上流传着它的名字，游戏里负责催一催进度。 | 偏软 0.7；顺畅 +0.3 |
| `dragon-juice` | 红心火龙果汁 | 果蔬 | 颜色鲜明到连结算都想多看一眼。 | 提供玫红色线索 |
| `spinach-juice` | 菠菜青汁 | 果蔬 | 一口把整支绿叶小队请进了实验室。 | 提供绿色线索；略微平衡干硬 |
| `blueberry-juice` | 蓝莓浓浆 | 果蔬 | 紫色信封已经寄出，等待肚子的回信。 | 提供紫色线索 |
| `beet-juice` | 甜菜根汁 | 果蔬 | 今天的调色盘，红得很认真。 | 提供砖红色线索 |
| `ink-tonic` | 深海墨水汽水 | 幻想 | 章鱼借出了一点墨水，气泡负责摇匀。 | 提供墨黑色与气泡线索；偏软 0.3 |
| `milk` | 鲜牛奶 | 日常 | 白白的一杯，在这个实验室里负责奶油配色。 | 提供奶白色线索 |
| `soda` | 气泡水 | 日常 | 咕噜是配乐，泡泡是本局的临时演员。 | 提供气孔与泡沫线索 |
| `honey-water` | 蜂蜜浓饮 | 日常 | 黏黏糊糊，给拉长的线条一点耐心。 | 提供蜜糖色与拉丝线索；偏硬 0.3 |
| `coconut-water` | 椰子水 | 日常 | 小岛营业中，先把紧张放在岸上。 | 向 4 型平衡 0.4；顺畅 +0.5 |
| `golden-tea` | 金箔乌龙 | 幻想 | 茶叶沉底，金箔漂着，财富感需要另外抽签。 | 提供金箔碎片线索；黄金权重 ×3 |
| `prism-soda` | 棱镜汽水 | 幻想 | 把一道彩虹装进瓶子，喝完也未必能完整还原。 | 开启彩虹候选；仍参与稀有抽签 |
| `gel-drink` | 果冻实验饮 | 幻想 | 瓶子里的东西正在认真练习弹性。 | 开启果冻候选；偏软 0.4 |
| `mineral-tonic` | 晶簇矿泉液 | 幻想 | 矿物自带几何作业，结晶还需要一点运气。 | 开启晶体候选；偏硬 0.4 |
| `glow-soda` | 月光荧汽水 | 幻想 | 借来半瓶月光，普通灯光下也不耽误做梦。 | 开启夜光候选；提供气泡线索 |
| `cocoa` | 热可可 | 日常 | 温暖的棕色选手，擅长把零碎收成团。 | 提供可可色线索；偏硬 0.4 |

## 当前精确配置

| ID | 图标配色 | 标签 | effects | 开放方式 |
| --- | --- | --- | --- | --- |
| `water` | `#a8d2cf` | 无 | 无 | `open` |
| `coffee` | `#94735c` | `coffee` | `{"typeShift":1}` | `open` |
| `black-tea` | `#b7834d` | `tea`、`amber` | `{"typeShift":-0.6}` | `open` |
| `oat-milk` | `#e3d1aa` | `oat` | `{"typeBalance":0.5,"formationStability":0.08}` | `open` |
| `prune-juice` | `#8c6b88` | `prune` | `{"typeShift":0.7,"smoothnessBonus":0.3}` | `open` |
| `dragon-juice` | `#d57b9c` | `dragon-pigment` | `{"dropWeightMultipliers":{"red-dragon":2}}` | `open` |
| `spinach-juice` | `#8ea76d` | `green` | `{"typeBalance":0.3}` | `open` |
| `blueberry-juice` | `#9783b5` | `berry-pigment` | 无 | `open` |
| `beet-juice` | `#b96c76` | `beet-pigment` | 无 | `open` |
| `ink-tonic` | `#607478` | `ink`、`bubbles` | `{"typeShift":0.3}` | `open` |
| `milk` | `#e5e2cb` | `milk` | 无 | `open` |
| `soda` | `#b0cdd0` | `bubbles` | 无 | `open` |
| `honey-water` | `#d1af68` | `honey`、`amber` | `{"typeShift":-0.3}` | `open` |
| `coconut-water` | `#c5d9b4` | `coconut` | `{"typeBalance":0.4,"smoothnessBonus":0.5}` | `open` |
| `golden-tea` | `#d5b85d` | `gold-source`、`tea` | `{"dropWeightMultipliers":{"gold":3}}` | `open` |
| `prism-soda` | `#bc9ac7` | `rainbow-source`、`bubbles` | `{"dropWeightMultipliers":{"rainbow":2}}` | `open` |
| `gel-drink` | `#b5c991` | `gel-source` | `{"typeShift":0.4,"dropWeightMultipliers":{"jelly":2}}` | `open` |
| `mineral-tonic` | `#a2c8d3` | `crystal-source` | `{"typeShift":-0.4,"dropWeightMultipliers":{"crystal":2}}` | `open` |
| `glow-soda` | `#acd4b2` | `glow-source`、`bubbles` | `{"dropWeightMultipliers":{"luminous":2}}` | `open` |
| `cocoa` | `#a78065` | `cocoa` | `{"typeShift":-0.4}` | `open` |

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

维护源：[drinks.js](../src/content/drinks.js)，合并：[effects.js](../src/game/effects.js)，颜色：[color.js](../src/game/color.js)，界面：[supplies.js](../src/ui/supplies.js)。
