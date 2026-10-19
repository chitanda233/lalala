export const gameConfig = {
  storageKey: "lalala-dev",
  saveVersion: 6,
  maxIndividuals: 7,
  rulesVersion: 23,
  maxFoods: 3,
  maxAdditives: 1,
  resultDelayMs: 400,
  water: { min: 0, max: 1250, step: 250, default: 750 },
  recipeHitProbability: 0.8,
  stabilizedRecipeHitProbability: 1,
  baseRareProbability: 0.02,
  boostedRareTargetProbability: 0.2,
};

export function formatDuration(seconds) {
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60} 分钟`;
  return `${Number(seconds.toFixed(1))} 秒`;
}
