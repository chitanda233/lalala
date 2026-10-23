// 主题搭配仅用于展示；不参与稀有资格或稀有概率计算。
export const rareThemeRecipes = [
  {
    "characterId": "meteor",
    "foodIds": [
      "wholewheat",
      "meteor-cookie"
    ],
    "drinkId": "water",
    "water": 250,
    "additiveId": "stardust",
    "forceZone": "high"
  },
  {
    "characterId": "frost-crystal",
    "foodIds": [
      "toast",
      "yogurt"
    ],
    "drinkId": "milk",
    "water": 250,
    "additiveId": "frost-salt",
    "forceZone": "high"
  },
  {
    "characterId": "crystal",
    "foodIds": [
      "brown-rice",
      "bamboo-shoots"
    ],
    "drinkId": "mineral-tonic",
    "water": 750,
    "additiveId": "crystal-seed",
    "forceZone": "medium"
  },
  {
    "characterId": "amber-fossil",
    "foodIds": [
      "sweet-potato",
      "wholewheat"
    ],
    "drinkId": "bubble-tea",
    "water": 750,
    "additiveId": "amber-resin",
    "forceZone": "medium"
  },
  {
    "characterId": "gold",
    "foodIds": [
      "rice",
      "pumpkin"
    ],
    "drinkId": "water",
    "water": 1000,
    "additiveId": "gold-leaf",
    "forceZone": "medium"
  },
  {
    "characterId": "rainbow",
    "foodIds": [
      "rice",
      "dragon-fruit"
    ],
    "drinkId": "prism-soda",
    "water": 1000,
    "additiveId": "rainbow-sugar",
    "forceZone": "medium"
  },
  {
    "characterId": "jelly",
    "foodIds": [
      "oatmeal",
      "konjac"
    ],
    "drinkId": "grass-jelly",
    "water": 1250,
    "additiveId": "gelatin",
    "forceZone": "low"
  },
  {
    "characterId": "luminous",
    "foodIds": [
      "oatmeal",
      "pear",
      "banana"
    ],
    "drinkId": "glow-soda",
    "water": 1250,
    "additiveId": "stardust",
    "forceZone": "low"
  },
  {
    "characterId": "golden-juice",
    "foodIds": [
      "pear",
      "prune"
    ],
    "drinkId": "prune-juice",
    "water": 1250,
    "additiveId": "gold-leaf",
    "forceZone": "low"
  },
  {
    "characterId": "rainbow-falls",
    "foodIds": [
      "dragon-fruit",
      "prune",
      "burger"
    ],
    "drinkId": "prism-soda",
    "water": 1250,
    "additiveId": "rainbow-sugar",
    "forceZone": "high"
  }
];
export const rareThemeRecipeById = Object.fromEntries(rareThemeRecipes.map(recipe => [recipe.characterId, recipe]));
