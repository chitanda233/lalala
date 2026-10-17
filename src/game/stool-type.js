import { getOutcomePool } from "./outcome-pool.js";
import { classifySpecimen } from "./specimen.js";

export function typeDistribution(input) {
  const probabilities = new Map();
  for (const entry of getOutcomePool(input)) {
    const type = classifySpecimen(entry);
    probabilities.set(type, (probabilities.get(type) ?? 0) + entry.probability);
  }
  return [...probabilities]
    .map(([type, probability]) => ({ type, probability }))
    .sort((a, b) => b.probability - a.probability || a.type - b.type);
}

export function resolveBristolType(input) {
  return typeDistribution(input)[0].type;
}
