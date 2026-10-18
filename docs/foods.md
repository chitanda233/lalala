# 食物模块与完整配置

> 本文件由 [内容文档生成器](../scripts/generate-content-docs.mjs)读取当前源码生成；是配置快照，后台保存或修改内容后需重新生成。规则版本 14，存档版本 5。用户需求见 [需求规格](requirements.md)，具体数值和扩充内容的设计归属见 [自主补充的设计与实现](implementation-decisions.md)。

## 需求与当前实现

用户要求梗食物、常见食物、影响形态的食物，并明确点名华莱士汉堡、金针菇、香蕉和观音土；允许补充原材料、成品、地区食物和幻想内容。具体名单、分组、开放局数和数值由当前实现补充，不能把整表都视为用户逐项指定。

当前 51 种，33 种初始开放，18 种按完成局数开放。原有 30 种中已包含熟香蕉，新增观音土及另外 20 种，所以总数为 51。

餐盘最多三种且不重复；当前实现至少选一种。浮窗为分类、双列大卡片、按可用高度每页 2 / 4 / 6 格、介绍和下方三格餐盘，已解锁排在未解锁前。选中与加入餐盘是两步，确认才提交草稿；取消保留原配方。不提供搜索，也没有“趣味食物”分类。

## 九项数值与色素

| 字段 | 名称 | 1 的含义 | 7 的含义 | 层级 |
| --- | --- | --- | --- | --- |
| `softness` | 软硬程度 | 非常软 | 非常硬 | 主参数 |
| `cohesion` | 凝聚度 | 分散 | 连成整体 | 主参数 |
| `elongation` | 延展性 | 短而易断 | 长条盘卷 | 主参数 |
| `grain` | 颗粒感 | 细腻光滑 | 粗颗粒 | 主参数 |
| `retention` | 形态保留度 | 完全融入 | 明显保留 | 主参数 |
| `colorStrength` | 染色能力 | 不染色 | 强烈染色 | 主参数 |
| `porosity` | 蓬松度 | 紧实 | 蓬松多孔 | 高级参数 |
| `lubricity` | 顺滑度 | 阻滞 | 顺滑 | 高级参数 |
| `influence` | 影响强度 | 轻微点缀 | 主导混搭 | 独立外层强度 |

数值均为 1～7 整数；软硬程度为 **1 很软、7 很硬**，与 Bristol 1 型硬、7 型水样的方向相反。代码键 softness 实际表示硬度刻度。pigmentId 为色素 ID 或 null，不是第十项等级。Admin 的影响强度在最外层，颜色单独设置，高级折叠仅包含蓬松和顺滑；玩家浮窗仅展示软硬、保留、强度三项简要参数。

软硬、凝聚、延展、颗粒、蓬松和顺滑按 influence 加权平均。保留度逐食物独立保存；主食物色素按 colorStrength × influence 排序取一个，平局按 ID。金针菇当前 retention=7，吃下后确定出现专属印记；实现允许把它调到 1 而关闭印记，此边界见 [实现差距](implementation-decisions.md#需要明确的边界与后续决定)。

## 完整食物清单

| ID | 食物 | 分类 | 开放条件 | 幻想标记 | 介绍 |
| --- | --- | --- | --- | --- | --- |
| `burger` | 华莱士汉堡 | 主食谷物 | 初始 | 否 | 喷射战士申请出战，肠道竞速准备发车。 |
| `enoki` | 金针菇 | 蔬菜豆类 | 初始 | 否 | See you tomorrow，名字已经替它打好招呼。 |
| `snail-noodles` | 螺蛳粉 | 风味奇遇 | 完成 3 局 | 否 | 闻起来很有主见，吃起来也不肯低调。 |
| `hotpot` | 麻辣火锅 | 风味奇遇 | 完成 5 局 | 否 | 嘴巴说微辣，锅底说了算。 |
| `spicy-wings` | 变态辣鸡翅 | 风味奇遇 | 完成 8 局 | 否 | 第一口是勇士，第二口开始沉默。 |
| `durian` | 榴莲 | 水果 | 完成 12 局 | 否 | 爱它的人靠近，不爱的人先撤退。 |
| `oatmeal` | 原味燕麦粥 | 主食谷物 | 初始 | 否 | 早餐界的老实人，低调但很认真。 |
| `wholewheat` | 全麦面包 | 主食谷物 | 完成 3 局 | 否 | 长得朴素，内涵比较扎实。 |
| `brown-rice` | 糙米饭 | 主食谷物 | 完成 5 局 | 否 | 米饭换了件外套，嚼劲也跟着上班。 |
| `corn` | 蒸玉米 | 主食谷物 | 初始 | 否 | 每一粒，都有自己的出场顺序。 |
| `sweet-potato` | 烤红薯 | 主食谷物 | 初始 | 否 | 纸袋捂在手里，快乐提前报到。 |
| `red-beans` | 熟红豆 | 蔬菜豆类 | 完成 8 局 | 否 | 小小一碗，豆力十足。 |
| `broccoli` | 西兰花 | 蔬菜豆类 | 初始 | 否 | 健身餐常驻嘉宾，绿色存在感拉满。 |
| `celery` | 芹菜 | 蔬菜豆类 | 完成 10 局 | 否 | 不靠颜值抢镜，主要靠嚼劲。 |
| `spinach` | 菠菜 | 蔬菜豆类 | 完成 12 局 | 否 | 绿叶小队，到点集合。 |
| `pumpkin` | 蒸南瓜 | 蔬菜豆类 | 完成 15 局 | 否 | 今天走温柔路线，软软糯糯地登场。 |
| `chickpeas` | 熟鹰嘴豆 | 蔬菜豆类 | 完成 20 局 | 否 | 名字像动物，实际是豆子。 |
| `almonds` | 原味巴旦木 | 其他 | 完成 25 局 | 否 | 个头不大，嚼起来很有想法。 |
| `kiwi` | 猕猴桃 | 水果 | 完成 5 局 | 否 | 外表毛茸茸，内心绿油油。 |
| `apple` | 带皮苹果 | 水果 | 初始 | 否 | 这一份连皮一起算，脆就完了。 |
| `pear` | 梨 | 水果 | 完成 8 局 | 否 | 水灵灵登场，清清爽爽收尾。 |
| `prune` | 西梅 | 水果 | 完成 20 局 | 否 | 小小深色果，名字自带江湖传说。 |
| `dragon-fruit` | 红心火龙果 | 水果 | 完成 30 局 | 否 | 一身玫红，气氛组不能没有它。 |
| `banana` | 熟香蕉 | 水果 | 初始 | 否 | 弯弯一根，成熟得刚刚好。 |
| `rice` | 白米饭 | 主食谷物 | 初始 | 否 | 今天的配角，也是这顿饭的底气。 |
| `toast` | 白吐司 | 主食谷物 | 初始 | 否 | 没有复杂人设，只有朴素碳水。 |
| `egg` | 水煮蛋 | 其他 | 初始 | 否 | 圆润登场，蛋白质选手就位。 |
| `cheese` | 奶酪 | 其他 | 完成 10 局 | 否 | 奶香浓缩包，拉丝是才艺。 |
| `yogurt` | 原味酸奶 | 其他 | 初始 | 否 | 冰箱常驻嘉宾，酸酸地打个招呼。 |
| `ice-cream` | 冰淇淋 | 其他 | 完成 15 局 | 否 | 嘴巴的降温计划，甜品的快乐担当。 |
| `guanyin-clay` | 观音土 | 幻想配料 | 初始 | 是 | 幻想餐盘里的浅灰土块，擅长把软乎乎的剧情收紧。 |
| `century-egg` | 皮蛋 | 风味奇遇 | 初始 | 否 | 一半琥珀、一半墨绿，把调色盘藏在蛋壳里。 |
| `stinky-tofu` | 臭豆腐 | 风味奇遇 | 初始 | 否 | 出场自带存在感，落幕后也想留下自己的签名。 |
| `natto` | 纳豆 | 风味奇遇 | 初始 | 否 | 小豆子很团结，连这次的成形计划也想牵在一起。 |
| `kimchi` | 泡菜 | 风味奇遇 | 初始 | 否 | 酸辣小队到齐，配方的情绪立刻热闹起来。 |
| `konjac` | 魔芋结 | 蔬菜豆类 | 初始 | 否 | 先给自己打个结，再把弹弹的灵感交给实验室。 |
| `okra` | 秋葵 | 蔬菜豆类 | 初始 | 否 | 星星形的小切面，滑溜溜地申请一份顺畅。 |
| `bamboo-shoots` | 竹笋 | 蔬菜豆类 | 初始 | 否 | 层层叠叠的脆爽，把线条感也带到了终点。 |
| `seaweed` | 海带结 | 蔬菜豆类 | 初始 | 否 | 海里的绿色丝带，在餐盘里拐了个弯。 |
| `black-sesame` | 黑芝麻糊 | 其他 | 初始 | 否 | 黑亮亮的一碗，小斑点正在等待重新集合。 |
| `squid-ink-pasta` | 墨鱼汁意面 | 风味奇遇 | 初始 | 否 | 面条换了件深色外套，连转弯都很有戏。 |
| `spicy-crayfish` | 麻辣小龙虾 | 风味奇遇 | 初始 | 否 | 剥壳很费手，辣味选手出场可不费劲。 |
| `duck-blood` | 鸭血粉丝汤 | 风味奇遇 | 初始 | 否 | 方块和细线坐在一碗里，今天的剧本叫搭配。 |
| `pig-blood-cake` | 猪血糕 | 风味奇遇 | 初始 | 否 | 糯糯的一方小糕，把零散的灵感压成一队。 |
| `fried-insects` | 酥炸昆虫 | 风味奇遇 | 初始 | 否 | 小众脆脆队，嚼的是勇气，游戏里留下颗粒灵感。 |
| `cactus` | 仙人掌沙拉 | 风味奇遇 | 初始 | 否 | 把沙漠的绿色装进盘子，造型灵感走清爽路线。 |
| `rose-cake` | 鲜花饼 | 风味奇遇 | 初始 | 否 | 酥皮把几片春天包起来，终点也想带一点花边。 |
| `popping-chocolate` | 跳跳巧克力 | 其他 | 初始 | 否 | 外表安静，里面开着小型噼啪演唱会。 |
| `rainbow-crayon` | 彩虹蜡笔 | 幻想配料 | 初始 | 是 | 幻想餐盘里的七色画笔，先把运气涂进配方。 |
| `marshmallow-foam` | 棉花糖云 | 幻想配料 | 初始 | 是 | 从云朵上揪下来的一团，软软地练习弹性。 |
| `meteor-cookie` | 陨石曲奇 | 幻想配料 | 初始 | 是 | 宇宙烤箱寄来的点心，星屑被认真收进小圆饼。 |

## 当前实际属性

下表直接读取食物参数源码，包含已有调参结果，不是重置后的建议初值。列“强”是 influence；“硬”是 softness；“保”是 retention。

| ID | 食物 | 强 | 硬 | 凝聚 | 延展 | 颗粒 | 保 | 染色 | 蓬松 | 顺滑 | 色素 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `burger` | 华莱士汉堡 | 7 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 7 | 无 |
| `enoki` | 金针菇 | 4 | 4 | 5 | 6 | 1 | 7 | 1 | 1 | 4 | 无 |
| `snail-noodles` | 螺蛳粉 | 4 | 2 | 4 | 4 | 1 | 1 | 7 | 1 | 5 | 辣味暖红 / `fire` |
| `hotpot` | 麻辣火锅 | 4 | 2 | 3 | 3 | 1 | 1 | 7 | 1 | 5 | 辣味暖红 / `fire` |
| `spicy-wings` | 变态辣鸡翅 | 4 | 2 | 3 | 3 | 1 | 1 | 7 | 1 | 5 | 辣味暖红 / `fire` |
| `durian` | 榴莲 | 4 | 4 | 5 | 5 | 1 | 1 | 1 | 1 | 4 | 无 |
| `oatmeal` | 原味燕麦粥 | 4 | 4 | 6 | 5 | 2 | 1 | 1 | 1 | 5 | 无 |
| `wholewheat` | 全麦面包 | 4 | 4 | 5 | 5 | 5 | 1 | 1 | 3 | 4 | 无 |
| `brown-rice` | 糙米饭 | 4 | 4 | 5 | 5 | 4 | 2 | 1 | 1 | 4 | 无 |
| `corn` | 蒸玉米 | 4 | 4 | 3 | 2 | 5 | 6 | 2 | 1 | 4 | 谷物黄棕 / `bread` |
| `sweet-potato` | 烤红薯 | 4 | 3 | 4 | 3 | 1 | 1 | 1 | 1 | 4 | 无 |
| `red-beans` | 熟红豆 | 4 | 4 | 6 | 5 | 4 | 3 | 1 | 3 | 4 | 无 |
| `broccoli` | 西兰花 | 4 | 4 | 6 | 5 | 2 | 2 | 4 | 1 | 4 | 蔬菜绿 / `garden` |
| `celery` | 芹菜 | 4 | 4 | 5 | 6 | 3 | 4 | 4 | 1 | 4 | 蔬菜绿 / `garden` |
| `spinach` | 菠菜 | 4 | 4 | 5 | 5 | 1 | 3 | 4 | 1 | 4 | 蔬菜绿 / `garden` |
| `pumpkin` | 蒸南瓜 | 4 | 3 | 3 | 2 | 1 | 1 | 3 | 1 | 4 | 蜜糖琥珀色 / `honey` |
| `chickpeas` | 熟鹰嘴豆 | 4 | 4 | 6 | 5 | 4 | 3 | 1 | 3 | 4 | 无 |
| `almonds` | 原味巴旦木 | 4 | 5 | 3 | 2 | 6 | 4 | 1 | 1 | 5 | 无 |
| `kiwi` | 猕猴桃 | 4 | 3 | 5 | 5 | 3 | 3 | 1 | 1 | 4 | 无 |
| `apple` | 带皮苹果 | 4 | 4 | 5 | 4 | 1 | 1 | 1 | 1 | 4 | 无 |
| `pear` | 梨 | 4 | 3 | 3 | 3 | 1 | 1 | 1 | 1 | 4 | 无 |
| `prune` | 西梅 | 5 | 2 | 2 | 2 | 1 | 1 | 1 | 1 | 4 | 无 |
| `dragon-fruit` | 红心火龙果 | 4 | 3 | 5 | 5 | 4 | 3 | 7 | 1 | 4 | 火龙果玫红 / `dragon` |
| `banana` | 熟香蕉 | 6 | 3 | 3 | 3 | 1 | 1 | 1 | 1 | 5 | 无 |
| `rice` | 白米饭 | 2 | 4 | 4 | 4 | 1 | 1 | 1 | 1 | 4 | 无 |
| `toast` | 白吐司 | 2 | 4 | 4 | 4 | 1 | 1 | 1 | 3 | 4 | 无 |
| `egg` | 水煮蛋 | 4 | 5 | 5 | 3 | 1 | 1 | 1 | 1 | 4 | 无 |
| `cheese` | 奶酪 | 4 | 5 | 6 | 6 | 1 | 1 | 1 | 1 | 5 | 无 |
| `yogurt` | 原味酸奶 | 4 | 4 | 5 | 4 | 1 | 1 | 1 | 1 | 5 | 无 |
| `ice-cream` | 冰淇淋 | 4 | 3 | 3 | 2 | 1 | 1 | 1 | 3 | 5 | 无 |
| `guanyin-clay` | 观音土 | 7 | 6 | 5 | 3 | 4 | 1 | 7 | 1 | 2 | 陶土浅灰 / `clay` |
| `century-egg` | 皮蛋 | 4 | 4 | 4 | 4 | 1 | 2 | 7 | 1 | 4 | 深海墨黑 / `ink` |
| `stinky-tofu` | 臭豆腐 | 4 | 4 | 5 | 4 | 1 | 1 | 1 | 1 | 5 | 无 |
| `natto` | 纳豆 | 4 | 4 | 6 | 7 | 1 | 3 | 1 | 3 | 4 | 无 |
| `kimchi` | 泡菜 | 4 | 3 | 5 | 4 | 1 | 1 | 7 | 1 | 4 | 辣味暖红 / `fire` |
| `konjac` | 魔芋结 | 4 | 4 | 6 | 6 | 1 | 1 | 1 | 1 | 6 | 无 |
| `okra` | 秋葵 | 4 | 4 | 6 | 6 | 1 | 4 | 4 | 1 | 7 | 蔬菜绿 / `garden` |
| `bamboo-shoots` | 竹笋 | 4 | 4 | 6 | 6 | 5 | 5 | 1 | 1 | 4 | 无 |
| `seaweed` | 海带结 | 4 | 4 | 5 | 7 | 1 | 5 | 4 | 1 | 6 | 蔬菜绿 / `garden` |
| `black-sesame` | 黑芝麻糊 | 4 | 4 | 5 | 4 | 6 | 5 | 7 | 1 | 5 | 深海墨黑 / `ink` |
| `squid-ink-pasta` | 墨鱼汁意面 | 4 | 4 | 4 | 7 | 1 | 1 | 7 | 1 | 6 | 深海墨黑 / `ink` |
| `spicy-crayfish` | 麻辣小龙虾 | 4 | 2 | 3 | 3 | 1 | 1 | 7 | 1 | 5 | 辣味暖红 / `fire` |
| `duck-blood` | 鸭血粉丝汤 | 4 | 3 | 3 | 4 | 1 | 2 | 1 | 1 | 4 | 无 |
| `pig-blood-cake` | 猪血糕 | 4 | 5 | 6 | 3 | 3 | 1 | 1 | 1 | 4 | 无 |
| `fried-insects` | 酥炸昆虫 | 4 | 4 | 3 | 4 | 5 | 4 | 1 | 1 | 5 | 无 |
| `cactus` | 仙人掌沙拉 | 4 | 4 | 5 | 5 | 3 | 3 | 4 | 1 | 4 | 蔬菜绿 / `garden` |
| `rose-cake` | 鲜花饼 | 4 | 4 | 5 | 4 | 3 | 4 | 1 | 1 | 5 | 无 |
| `popping-chocolate` | 跳跳巧克力 | 4 | 4 | 4 | 4 | 4 | 4 | 7 | 6 | 5 | 可可棕 / `cocoa` |
| `rainbow-crayon` | 彩虹蜡笔 | 4 | 4 | 4 | 4 | 1 | 2 | 1 | 1 | 4 | 无 |
| `marshmallow-foam` | 棉花糖云 | 4 | 3 | 3 | 4 | 1 | 1 | 1 | 7 | 4 | 无 |
| `meteor-cookie` | 陨石曲奇 | 4 | 5 | 4 | 4 | 5 | 3 | 1 | 1 | 4 | 无 |

## 标签、外观基础与额外权重

appearanceId 参与基础外观选择，不等于最终收藏 ID；低水量、辣味、咖啡等优先规则仍可替换它。食物 effects 中只有以下表列出的额外收藏倍率与稀有加成生效。食物原记录中的 typeShift、typeBalance、formationStability、smoothnessBonus、typeWeights、outcomeMarks 不再重复叠加，形态以九项属性为准。例如观音土旧 typeShift=-1.2 不是当前额外生效的偏移。

| 食物 ID | 标签 | 基础外观 | 当前生效的额外 effects |
| --- | --- | --- | --- |
| `burger` | `meme`、`fried` | `classic` | 无 |
| `enoki` | `meme`、`mushroom` | `garden` | 无 |
| `snail-noodles` | `meme`、`spicy` | `classic` | 无 |
| `hotpot` | `meme`、`spicy` | `classic` | 无 |
| `spicy-wings` | `meme`、`spicy`、`fried` | `classic` | 无 |
| `durian` | `meme`、`fruit` | `classic` | 无 |
| `oatmeal` | `wholegrain`、`oat` | `bread` | 无 |
| `wholewheat` | `wholegrain` | `bread` | 无 |
| `brown-rice` | `wholegrain` | `classic` | 无 |
| `corn` | `grain` | `bread` | 无 |
| `sweet-potato` | `tuber` | `bread` | 无 |
| `red-beans` | `legume` | `garden` | 无 |
| `broccoli` | `green` | `garden` | 无 |
| `celery` | `green` | `garden` | 无 |
| `spinach` | `green` | `garden` | 无 |
| `pumpkin` | `vegetable` | `garden` | 无 |
| `chickpeas` | `legume` | `garden` | 无 |
| `almonds` | `nut` | `classic` | 无 |
| `kiwi` | `fruit` | `garden` | 无 |
| `apple` | `fruit` | `classic` | 无 |
| `pear` | `fruit` | `classic` | 无 |
| `prune` | `fruit` | `classic` | 无 |
| `dragon-fruit` | `fruit`、`color-meme`、`dragon-pigment` | `classic` | 无 |
| `banana` | `fruit` | `classic` | 无 |
| `rice` | `refined-grain` | `classic` | 无 |
| `toast` | `refined-grain` | `bread` | 无 |
| `egg` | `protein` | `classic` | 无 |
| `cheese` | `dairy` | `classic` | 无 |
| `yogurt` | `dairy`、`fermented` | `classic` | 无 |
| `ice-cream` | `dairy`、`dessert` | `classic` | 无 |
| `guanyin-clay` | `clay`、`fantasy` | `classic` | `{"dropWeightMultipliers":{"cracked":2.2,"stacked-stones":2}}` |
| `century-egg` | `protein`、`ink` | `classic` | `{"dropWeightMultipliers":{"ink-black":1.5}}` |
| `stinky-tofu` | `fried`、`fermented` | `classic` | 无 |
| `natto` | `legume`、`fermented`、`fiber-powder` | `garden` | 无 |
| `kimchi` | `spicy`、`fermented` | `fire` | 无 |
| `konjac` | `gel-source` | `classic` | `{"dropWeightMultipliers":{"jelly":1.5}}` |
| `okra` | `green`、`oil` | `garden` | 无 |
| `bamboo-shoots` | `wholegrain` | `bread` | 无 |
| `seaweed` | `green`、`oil` | `garden` | 无 |
| `black-sesame` | `charcoal` | `classic` | `{"dropWeightMultipliers":{"sesame-charcoal":1.6}}` |
| `squid-ink-pasta` | `ink`、`oil` | `classic` | 无 |
| `spicy-crayfish` | `spicy`、`protein` | `fire` | 无 |
| `duck-blood` | `protein` | `classic` | 无 |
| `pig-blood-cake` | `refined-grain` | `bread` | `{"dropWeightMultipliers":{"stacked-stones":1.5,"cracked":1.4}}` |
| `fried-insects` | `fried`、`protein` | `classic` | `{"dropWeightMultipliers":{"marble-pebbles":1.5}}` |
| `cactus` | `green` | `garden` | 无 |
| `rose-cake` | `petal`、`pastry` | `bread` | `{"dropWeightMultipliers":{"petal":1.5}}` |
| `popping-chocolate` | `cocoa`、`popping`、`bubbles` | `classic` | `{"dropWeightMultipliers":{"popping":1.5}}` |
| `rainbow-crayon` | `fantasy`、`rainbow-source` | `classic` | `{"dropWeightMultipliers":{"rainbow":1.5}}` |
| `marshmallow-foam` | `fantasy`、`gel-source` | `classic` | `{"dropWeightMultipliers":{"jelly":1.5}}` |
| `meteor-cookie` | `fantasy`、`star-source` | `classic` | `{"dropWeightMultipliers":{"meteor":1.5}}` |

## traits 参考资料

traits 保留为内容参考与部分提示资料，不是另一套形态主参数。以下值是游戏资料等级，不是克重或营养测量值。

| 食物 ID | fiber 纤维 | fat 油脂 | spice 辣度 | moisture 水分 | fermented 发酵 |
| --- | --- | --- | --- | --- | --- |
| `burger` | 1 | 3 | 1 | 0 | 0 |
| `enoki` | 2 | 0 | 0 | 1 | 0 |
| `snail-noodles` | 1 | 2 | 2 | 1 | 0 |
| `hotpot` | 0 | 3 | 3 | 1 | 0 |
| `spicy-wings` | 0 | 2 | 3 | 0 | 0 |
| `durian` | 2 | 1 | 0 | 1 | 0 |
| `oatmeal` | 3 | 0 | 0 | 2 | 0 |
| `wholewheat` | 3 | 0 | 0 | 0 | 0 |
| `brown-rice` | 2 | 0 | 0 | 0 | 0 |
| `corn` | 2 | 0 | 0 | 1 | 0 |
| `sweet-potato` | 2 | 0 | 0 | 1 | 0 |
| `red-beans` | 3 | 0 | 0 | 1 | 0 |
| `broccoli` | 3 | 0 | 0 | 1 | 0 |
| `celery` | 2 | 0 | 0 | 2 | 0 |
| `spinach` | 2 | 0 | 0 | 1 | 0 |
| `pumpkin` | 1 | 0 | 0 | 2 | 0 |
| `chickpeas` | 3 | 0 | 0 | 1 | 0 |
| `almonds` | 2 | 2 | 0 | 0 | 0 |
| `kiwi` | 2 | 0 | 0 | 2 | 0 |
| `apple` | 2 | 0 | 0 | 1 | 0 |
| `pear` | 2 | 0 | 0 | 3 | 0 |
| `prune` | 2 | 0 | 0 | 1 | 0 |
| `dragon-fruit` | 2 | 0 | 0 | 2 | 0 |
| `banana` | 2 | 0 | 0 | 1 | 0 |
| `rice` | 0 | 0 | 0 | 0 | 0 |
| `toast` | 0 | 0 | 0 | 0 | 0 |
| `egg` | 0 | 0 | 0 | 0 | 0 |
| `cheese` | 0 | 2 | 0 | 0 | 0 |
| `yogurt` | 0 | 0 | 0 | 0 | 1 |
| `ice-cream` | 0 | 2 | 0 | 0 | 0 |
| `guanyin-clay` | 0 | 0 | 0 | 0 | 0 |
| `century-egg` | 0 | 1 | 0 | 0 | 0 |
| `stinky-tofu` | 0 | 2 | 0 | 1 | 1 |
| `natto` | 1 | 0 | 0 | 1 | 1 |
| `kimchi` | 1 | 0 | 2 | 1 | 1 |
| `konjac` | 2 | 0 | 0 | 2 | 0 |
| `okra` | 2 | 0 | 0 | 1 | 0 |
| `bamboo-shoots` | 3 | 0 | 0 | 1 | 0 |
| `seaweed` | 2 | 0 | 0 | 2 | 0 |
| `black-sesame` | 1 | 2 | 0 | 1 | 0 |
| `squid-ink-pasta` | 0 | 1 | 0 | 1 | 0 |
| `spicy-crayfish` | 0 | 2 | 3 | 1 | 0 |
| `duck-blood` | 0 | 0 | 0 | 3 | 0 |
| `pig-blood-cake` | 1 | 0 | 0 | 0 | 0 |
| `fried-insects` | 0 | 2 | 0 | 0 | 0 |
| `cactus` | 3 | 0 | 0 | 2 | 0 |
| `rose-cake` | 1 | 2 | 0 | 0 | 0 |
| `popping-chocolate` | 0 | 2 | 0 | 0 | 0 |
| `rainbow-crayon` | 0 | 0 | 0 | 0 | 0 |
| `marshmallow-foam` | 0 | 0 | 0 | 1 | 0 |
| `meteor-cookie` | 0 | 1 | 0 | 0 | 0 |

## 维护入口

- 定义：[foods.js](../src/content/foods.js)、[expanded-foods.js](../src/content/expanded-foods.js)。
- 实际可调值：[food-attribute-values.js](../src/content/food-attribute-values.js)；不要用生成文档覆盖该文件。
- 字段与校验：[food-attributes.js](../src/content/food-attributes.js)；合并：[food-profile.js](../src/game/food-profile.js)、[effects.js](../src/game/effects.js)。
- 操作：[食物调参指南](food-admin.md)；产出：[算法说明报告](food-outcome-algorithm.md)。
