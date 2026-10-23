export const gameConfig = {
  storageKey: "lalala-dev",
  saveVersion: 7,
  maxIndividualsPerSpecimen: 7,
  rulesVersion: 24,
  maxFoods: 3,
  maxAdditives: 1,
  resultDelayMs: 400,
  water: { min: 0, max: 1250, step: 250, default: 750 },
  ordinaryThemeShare: 0.7,
  ordinaryVarietyShare: 0.25,
  baseRareProbability: 0.02,
  boostedRareTargetProbability: 0.2,
};

export function formatDuration(seconds) {
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60} 分钟`;
  return `${Number(seconds.toFixed(1))} 秒`;
}
