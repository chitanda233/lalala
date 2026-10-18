export const gameConfig = {
  storageKey: "lalala-dev",
  saveVersion: 5,
  rulesVersion: 17,
  maxFoods: 3,
  maxAdditives: 1,
  resultDelayMs: 400,
  water: { min: 250, max: 2500, step: 250, default: 1500 },
  recipeHitProbability: 0.8,
  stabilizedRecipeHitProbability: 1,
  baseRareProbability: 0.02,
  rareAdditiveBonus: 0.03,
};

export function formatDuration(seconds) {
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60} 分钟`;
  return `${Number(seconds.toFixed(1))} 秒`;
}
