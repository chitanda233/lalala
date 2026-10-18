# 便便收藏游戏｜统一美术风格提示词（V1.0）

> **定位：这是一款“便便形态培育 × 图鉴收集”游戏，不是写实排泄物模拟。**
>
> 美术核心原则：**保留便便的趣味轮廓，完全避免真实排泄物的脏污感；把每一坨便便表现为值得收藏的精致 3D 玩具或奇幻藏品。**

## 一、统一美术定位

**风格关键词**：风格化 3D、精品手游收藏物、软陶玩具、圆润有机造型、清爽可爱、精致材质、柔和打光、微妙荒诞、辨识度强、非写实、易于批量生成。

- **轮廓**：保留便便主题的识别度，但不强制所有品种都做成经典“旋转冰淇淋”造型。支持短条、长条、弯条、盘绕、团块、颗粒、软泥等不同形态；整体饱满、圆润、略有不规则变化。
- **几何细节**：可以体现长度、粗细、弯曲度、圈数、分节数等参数差异，但通过**简化、干净、可爱化的几何起伏**来表现，不刻画真实排泄物的细碎组织。
- **材质**：以软陶、玩具树脂、哑光橡胶、糖果、釉面陶瓷等舒适质感为基础。稀有品种可以切换为金属、晶体、果冻、荧光、珍珠、虹彩等幻想材质。
- **颜色**：普通品种使用干净、柔和且经过美术统一的暖棕、焦糖、奶咖、浅黄棕等颜色；稀有品种允许高饱和梦幻色、金属色与渐变色。**避免真实排泄物的浑浊脏污色感。**
- **光照**：手游 3D 物品展示式的柔和摄影棚布光；轮廓清楚、体积柔润、阴影轻巧、反射克制。稀有品种可有适量高光、辉光、粒子点缀。
- **气质**：有趣、干净、好玩、精致，略带荒诞；**不恶心、不重口、不恐怖**。普通便便也应有“想收藏”的视觉品质。
- **五官**：默认**不加眼睛、嘴巴、四肢或表情**，让形态和材质成为主体；只有明确设计为拟人角色的品种才增加五官。

## 二、通用主提示词（中文，可直接复制）

```text
为一款轻松幽默的 3D 手机游戏设计一个“便便形态收藏品”模型。

【品种描述】
{填写：基础形态、长度与粗细特征、弯曲或盘绕程度、分节情况、颜色、特殊变异与材质。例如“略弯曲的短条便，焦糖棕色，软陶材质，表面光滑，无特效”}

【统一美术风格】
高品质风格化 3D 游戏收藏品，精致的软陶玩具与设计师潮玩质感，圆润、饱满、友好、俏皮、干净，具有清晰而有趣的便便轮廓，但绝不写实。造型允许自然的不对称、粗细变化和轻微起伏，几何结构经过艺术化简化，表面平整干净，质感舒适，不出现令人不适的生理细节。

普通品种呈现细腻哑光软陶或高级玩具树脂质感；特殊品种根据描述表现精致的幻想材质（如抛光金属、半透明宝石、柔软果冻、柔和自发光、彩虹纹理），夸张但保持整体系列的一致性。清晰剪影，材质层次分明，颜色纯净，精致但不过度复杂。

单个收藏品居中完整呈现，3/4 视角，轻微俯视，摄影棚柔和主光和补光，精细环境光遮蔽、柔和接触阴影，背景为干净的纯色暖白或浅米色，画面整洁，主体突出。手游物品图鉴品质的 3D 渲染，方形构图，高清细节。

【重要限制】
不是写实排泄物，不要脏污，不要沾染物，不要真实黏液，不要令人反感的湿黏感；不要人体、厕所场景、便池、水花、纸巾、苍蝇或恶臭符号；不要默认加入眼睛、嘴巴、手脚；不要文字、标签、边框、水印或多件不同物品。
```

## 三、English master prompt（适合英文生图模型）

```text
Create a premium 3D collectible game asset for a whimsical mobile game about cultivating and collecting stylized poop shapes.

SPECIFIC DESIGN: {Describe the selected base silhouette, size, thickness, curvature, coils, segmentation, color and optional rare material / mutation.}

ART DIRECTION: Adorable, playful, clean, beautifully art-directed stylized 3D. A collectible designer-toy aesthetic, soft polymer clay and premium toy-resin finish, rounded and satisfying organic volumes, readable poop-inspired silhouette, gentle asymmetry and subtle shape variation. Clearly a fantasy toy collectible, NOT realistic excrement. Smooth, simplified surfaces with appealing forms and no gross biological micro-details.

For ordinary variants, use elegant warm caramel / cocoa / light brown hues and soft matte clay shading. For rare variants, preserve the same consistent shape language while applying magical collectible materials such as polished gold, translucent crystal, iridescent jelly, soft neon glow, pearls or graphic candy-like stripes. Strong silhouette readability, polished material art, tasteful vibrant accents, restrained effects.

One complete object only, centered, 3/4 isometric product view, subtle top-down angle, soft studio key light and fill, gentle ambient occlusion and contact shadow, clean warm off-white seamless background, premium mobile-game inventory icon render, square framing, sharp high-quality 3D details.

No photorealism, no realistic bodily waste, no filth, no stains, no organic residue, no disgusting mucus, no toilet bowl, no bathroom, no human, no flies, no smell icons, no text, no watermark. No eyes, face, limbs or mascot features unless specifically requested.
```

## 四、负面提示词（Negative Prompt）

**中文：**

```text
照片写实、医学写实、真实排泄物、恶心、脏污、污渍、粪便残渣、真实纤维与食物残渣、颗粒密布的逼真表面、病理特写、过度湿黏、黏液、拉丝、油腻污光、马桶污渍、厕所、人体、肛门、苍蝇、虫子、恶臭烟雾、重口味、血液、恐怖、阴暗、粗糙低模、噪点过多、画面杂乱、文字、水印、多个物品、默认长眼睛和手脚
```

**English:**

```text
photorealistic, medical realism, realistic feces, actual human waste, gross, dirty, filthy, stains, residue, food particles, biological microtexture, excessive wet slime, mucus, stringy goo, oily grime, toilet stains, bathroom, human body, anus, flies, insects, odor cloud, blood, gore, horror, dark gritty aesthetic, noisy texture, cluttered composition, text, watermark, multiple objects, eyes, face, arms, legs
```

## 五、按稀有度增补的风格提示词

下面的增补内容放进主提示词的 `{品种描述}` 中即可。**普通到传说应属于同一个视觉世界，不是从卡通突然跳到超写实。**

| 品质层级 | 增补提示词                                                                       | 视觉边界                                   |
| -------- | -------------------------------------------------------------------------------- | ------------------------------------------ |
| 普通     | 焦糖棕／奶咖色；细腻柔软软陶、干净哑光、轻微高光；突出形状、长度、粗细与弯曲差异 | 不必加夸张特效，绝不制作脏污纹理           |
| 优良     | 更精致的陶瓷釉面、淡淡珠光或双色渐变；局部轮廓更有设计感                         | 材质有变化，但不过度发光                   |
| 稀有     | 小面积金属光泽、晶体纹理、柔和虹彩、整洁斑点或条纹                               | 一次突出 1–2 个核心特征                    |
| 史诗     | 半透明果冻、鲜艳渐变、内部柔光、较复杂但有规律的螺旋／环绕图案                   | 保留清楚的主体剪影，不做杂乱特效           |
| 传说     | 精致黄金／宝石／星空材质、明显但克制的辉光和少量闪烁粒子，富有仪式感             | 再华丽也不能改变为写实污物或辨认不出的光团 |

## 六、六种特殊变异的可复用追加语句

### 1. 金属化

```text
完整、圆润的便便形状，材质表现为精致抛光黄金／白银／青铜金属，柔和但清楚的环境反射，金属厚重感，玩具收藏品般干净，不产生真实污物质感。
```

### 2. 结晶化

```text
将表面转化为纯净的半透明彩色宝石或冰晶材质，内部透光，柔和折射，清亮的青蓝与橙色幻想光泽；形状仍然圆润、友好，避免锋利、恐怖或破碎感。
```

### 3. 荧光化

```text
深蓝、紫色、玫红的梦幻渐变主体，边缘有柔和青色与粉色自发光，点缀少量闪亮粒子；主体必须清晰可见，避免过曝和刺眼霓虹。
```

### 4. 斑点

```text
软陶表面分布大小各异、位置自然但经过图案设计的圆形斑点或几何颗粒纹样，颜色协调、边界清楚，像陶艺上釉或糖果装饰，而非真实残渣。
```

### 5. 条纹

```text
沿几何表面自然流动的整洁彩色线条、螺旋条纹或虹彩丝带状纹路，线宽与方向有设计感，保持主体外形清楚，不出现真实纤维或脏污裂缝。
```

### 6. 果冻化

```text
柔软、弹润、半透明的粉色与淡紫色果冻玩具质感，通透边缘、内部柔和散射光，饱满圆润，像高级软糖收藏品；不要黏液、拉丝和脏腻的真实湿感。
```

## 七、两条可以直接使用的出图示例

### 示例 A｜普通品种：焦糖弯条便

```text
为一款便便收集游戏生成单个普通品种“焦糖弯条便”。造型是一条短而饱满的弧形便便，粗细略有自然变化，两端圆钝，轻微不对称，整体焦糖棕色。高品质可爱风格化 3D，精致软陶玩具质感，柔和哑光、干净平滑，像一件手工陶艺收藏品而不是现实排泄物。3/4 轻俯视，单物体居中，暖白背景、柔和摄影棚灯光、轻微接触阴影，游戏图鉴物品展示，无五官，无文字。严禁照片写实、脏污、真实黏液、残渣、厕所场景。
```

### 示例 B｜传说品种：黄金螺旋便

```text
为一款便便收集游戏生成单个传说品种“黄金螺旋便”。造型是紧凑优雅的三圈盘绕便便，轮廓饱满圆润，螺旋圈数清晰，粗细略有自然变化，顶部稍尖但不锋利。整体为高级抛光黄金材质，明亮柔和的金属反射，少量精致亮点，像奢华设计师玩具和幻想宝物。高品质风格化 3D 渲染，完全不写实，清晰主体轮廓，干净暖白背景，3/4 轻俯视，柔和摄影棚打光，单物体居中，无五官、无文字。严禁真实排泄物纹理、脏污、过度湿黏、厕所或人体。
```

## 八、用于后续程序化生成器的风格约束

为防止不同品种看起来像来自不同游戏，建议统一以下规则：

1. **共用造型语言**：圆润截面、适度夸张的体积、简化的表面细节；允许不同基础形态，不统一强制成经典尖顶螺旋。
2. **共用镜头和展示规范**：统一 3/4 视角、类似的主体占画面比例、背景、灯光强度和阴影风格；图鉴展示时可旋转查看。
3. **参数真正可视化**：长度影响整体尺度，粗细影响截面，弯曲与盘绕影响中心曲线，分节影响独立块数，材质变异影响 Shader；同图鉴不同个体应看得出差别。
4. **普通与稀有共享几何底层**：稀有变异优先从 Shader、颜色和少量装饰特效表达，避免每个品种都单独建模。
5. **健康边界不做写实化**：可以借用医学形态分类来构造形状，但不能用真实排泄物照片、病理细节或污染痕迹增强“真实感”。
6. **图鉴命名与视觉一致**：如“珍珠便”必须看出分节与圆润，“螺旋便”应能看出盘绕，“黄金便”应具有明显金属材质；不要仅靠图鉴名称区分品种。

---

**最终美术验收标准：** 玩家第一眼觉得“这是一件好笑、可爱、精致的便便造型收藏品”，而不是“这是一张真实大便的照片”。

_版本：V1.0｜适用于生图参考、美术外包沟通、3D 建模与材质开发、图鉴立项。_
