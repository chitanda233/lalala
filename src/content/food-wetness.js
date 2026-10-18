// 食材质地校准：与现有软硬旋钮叠加，不改写食品九项调参。
// 湿软值 = (4 − 当前软硬值) × 0.9 + 食材偏置；正数偏湿，负数偏干。
export const foodWetnessOffsets = {
  "rice": 0,
  "toast": -0.95,
  "brown-rice": -0.6,
  "oatmeal": 0.3,
  "burger": -0.7,
  "hotpot": 0.5,
  "pear": 0.35,
  "prune": -0.1,
  "egg": 0.15,
  "almonds": -0.3,
  "black-sesame": -0.55,
  "wholewheat": -0.85,
  "chickpeas": -0.35,
  "bamboo-shoots": -0.3,
  "beetroot": -0.1,
  "sweet-potato": -0.65,
  "spinach": 0.05,
  "enoki": 0.15,
  "banana": 0.15,
  "okra": 0.08,
  "dragon-fruit": -0.6,
  "rainbow-crayon": -0.4,
  "yogurt": 0.15,
  "rose-cake": 0.05,
  "pumpkin": -0.25,
  "konjac": 0.4,
  "red-beans": 0.1,
  "corn": 0.1,
  "potato": -0.2,
  "popping-chocolate": 0.15,
  "squid-ink-pasta": 0
};

export function foodWetness(food) {
  return (4 - food.attributes.softness) * 0.9 + (foodWetnessOffsets[food.id] || 0);
}
