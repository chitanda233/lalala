export const gameConfig = {
  storageKey: "lalala-dev",
  saveVersion: 5,
  rulesVersion: 13,
  maxFoods: 3,
  maxAdditives: 3,
  resultDelayMs: 400,
  water: { min: 250, max: 2500, step: 250, default: 1500 },
  commonDropWeight: 100,
  maxSpecialProbability: 0.005,
};

export function formatDuration(seconds) {
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60} 分钟`;
  return `${Number(seconds.toFixed(1))} 秒`;
}
