import { getOutcomePool } from "../src/game/drops.js";

export function outcomeDraws(selection, predicate, variation = 0.5) {
  const pool = getOutcomePool(selection);
  const index = pool.findIndex(predicate);
  if (index < 0) throw new Error("配方中没有目标标本。");
  return [
    pool.slice(0, index).reduce((sum, entry) => sum + entry.probability, 0) +
      pool[index].probability / 2,
    variation,
  ];
}
