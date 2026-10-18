// 普通图鉴配方（包含“特别”点缀款，不包含“稀有”材质款）。
// 一条配方只对应一个图鉴品种；食物的排列顺序不参与匹配。
// 配方只由食物、饮料和力度组成；添加剂作为独立功能修饰。
const recipe = (characterId, foodIds, drinkId, forceZone) => ({
  characterId,
  foodIds,
  drinkId,
  forceZone,
});

export const stoolRecipes = [
  // 基础与食物印记：主食负责主体，带特征的食材负责可见印记。
  recipe("classic", ["rice"], "water", "medium"),
  recipe("garden", ["rice", "spinach"], "water", "medium"),
  recipe("bread", ["toast", "wholewheat"], "water", "medium"),
  recipe("fire", ["hotpot"], "milk", "high"),
  recipe("coffee", ["toast"], "coffee", "medium"),
  recipe("cloud", ["marshmallow-foam"], "soda", "low"),
  recipe("pebble", ["rice"], "mineral-tonic", "low"),
  recipe("cracked", ["toast"], "mineral-tonic", "medium"),
  recipe("marble-pebbles", ["almonds"], "mineral-tonic", "low"),
  recipe("stacked-stones", ["brown-rice"], "mineral-tonic", "medium"),
  recipe("corn-pebbles", ["corn"], "milk", "medium"),
  recipe("enoki-thread", ["rice", "enoki"], "water", "medium"),
  recipe("bran-log", ["wholewheat"], "water", "medium"),
  recipe("banana-curve", ["rice", "banana"], "water", "medium"),

  // 力度造型：相近主体配合饮料和力度，明确区分盘卷、拉长与断段。
  recipe("spiral", ["rice"], "water", "low"),
  recipe("long-rope", ["rice"], "water", "high"),
  recipe("segmented", ["toast"], "mineral-tonic", "high"),
  recipe("soft-pillows", ["pumpkin"], "milk", "medium"),
  recipe("mashed-potato", ["sweet-potato"], "milk", "medium"),
  recipe("pancake", ["burger"], "milk", "low"),
  recipe("jet", ["burger"], "milk", "high"),
  recipe("ribbon", ["rice"], "grass-jelly", "medium"),
  recipe("bubbly", ["burger"], "soda", "medium"),

  // 食材和饮料提供颜色主题，主体和力度仍写在配方里。
  recipe("red-dragon", ["rice", "dragon-fruit"], "water", "medium"),
  recipe("beet-red", ["toast"], "prism-soda", "medium"),
  recipe("purple-berry", ["oatmeal"], "prune-juice", "medium"),
  recipe("ink-black", ["burger"], "ink-tonic", "low"),
  recipe("cocoa-truffle", ["toast", "popping-chocolate"], "coffee", "low"),
  recipe("amber-honey", ["wholewheat"], "bubble-tea", "medium"),
  recipe("milk-white", ["toast"], "milk", "medium"),
  recipe("oat-speckle", ["oatmeal"], "water", "medium"),

  // 点缀是收藏款自身的样式，不需要添加剂前置条件。
  recipe("glitter", ["rice"], "glow-soda", "medium"),
  recipe("gold-flake", ["rice"], "bubble-tea", "medium"),
  recipe("silver-speckle", ["rice"], "milk", "medium"),
  recipe("petal", ["rice", "rose-cake"], "water", "medium"),
  recipe("popping", ["burger", "popping-chocolate"], "soda", "high"),
  recipe("sesame-charcoal", ["almonds", "black-sesame"], "mineral-tonic", "low"),

  // 原设备印记也有完整食饮配方，不再要求暗中的马桶前置条件。
  recipe("wood-grain", ["wholewheat", "brown-rice"], "water", "medium"),
  recipe("warm-coil", ["sweet-potato"], "grass-jelly", "low"),
  recipe("massage-beads", ["chickpeas"], "mineral-tonic", "medium"),
  recipe("stone-tower", ["brown-rice", "almonds"], "mineral-tonic", "medium"),
  recipe("squat-spring", ["oatmeal", "rice"], "water", "low"),

  // 水样的食材残留、星空点缀和高压喷泉分别拥有独立配方。
  recipe("enoki-jet", ["burger", "enoki"], "milk", "high"),
  recipe("corn-cannon", ["burger", "corn"], "milk", "high"),
  recipe("glitter-galaxy", ["burger"], "ink-tonic", "medium"),
  recipe("ink-fountain", ["burger"], "ink-tonic", "high"),
];

export const stoolRecipeByCharacterId = Object.fromEntries(
  stoolRecipes.map((item) => [item.characterId, item]),
);
