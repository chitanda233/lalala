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
    "digestionTime": "8",
    "forceZone": "high",
    "additiveId": "stardust"
  },
  {
    "characterId": "frost-crystal",
    "foodIds": [
      "toast",
      "yogurt"
    ],
    "drinkId": "milk",
    "water": 750,
    "digestionTime": "8",
    "forceZone": "low",
    "additiveId": "frost-salt"
  },
  {
    "characterId": "crystal",
    "foodIds": [
      "brown-rice",
      "bamboo-shoots"
    ],
    "drinkId": "mineral-tonic",
    "water": 750,
    "digestionTime": "4",
    "forceZone": "medium",
    "additiveId": "crystal-seed"
  },
  {
    "characterId": "amber-fossil",
    "foodIds": [
      "sweet-potato",
      "wholewheat"
    ],
    "drinkId": "bubble-tea",
    "water": 750,
    "digestionTime": "4",
    "forceZone": "low",
    "additiveId": "amber-resin"
  },
  {
    "characterId": "gold",
    "foodIds": [
      "rice",
      "pumpkin"
    ],
    "drinkId": "water",
    "water": 1500,
    "digestionTime": "4",
    "forceZone": "medium",
    "additiveId": "gold-leaf"
  },
  {
    "characterId": "rainbow",
    "foodIds": [
      "rice",
      "dragon-fruit"
    ],
    "drinkId": "prism-soda",
    "water": 1500,
    "digestionTime": "4",
    "forceZone": "medium",
    "additiveId": "rainbow-sugar"
  },
  {
    "characterId": "jelly",
    "foodIds": [
      "oatmeal",
      "konjac"
    ],
    "drinkId": "grass-jelly",
    "water": 2000,
    "digestionTime": "4",
    "forceZone": "low",
    "additiveId": "gelatin"
  },
  {
    "characterId": "luminous",
    "foodIds": [
      "oatmeal",
      "yogurt"
    ],
    "drinkId": "glow-soda",
    "water": 2000,
    "digestionTime": "2",
    "forceZone": "low",
    "additiveId": "stardust"
  },
  {
    "characterId": "golden-juice",
    "foodIds": [
      "pear",
      "prune"
    ],
    "drinkId": "prune-juice",
    "water": 2000,
    "digestionTime": "2",
    "forceZone": "high",
    "additiveId": "gold-leaf"
  },
  {
    "characterId": "rainbow-falls",
    "foodIds": [
      "dragon-fruit",
      "prune"
    ],
    "drinkId": "prism-soda",
    "water": 2000,
    "digestionTime": "2",
    "forceZone": "high",
    "additiveId": "rainbow-sugar"
  }
];
export const rareThemeRecipeById = Object.fromEntries(rareThemeRecipes.map(recipe => [recipe.characterId, recipe]));
