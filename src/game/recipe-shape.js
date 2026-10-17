// Recipe affinities guide concrete specimens; these are not independently rolled classes.
import { collectEffects } from "./effects.js";
import { normalizeSelection } from "./selection.js";

function baseBristolType(selection, effects) {
  // Food hardness increases from soft (1) to hard (7); Bristol is reversed.
  let type = 8 - effects.food.shape.softness;
  if (selection.water <= 500) type -= 3;
  else if (selection.water <= 1000) type -= 2;
  else if (selection.water <= 1250) type -= 1;
  else if (selection.water >= 2250) type += 1;
  if (type < 4 && selection.water >= 1000)
    type += Math.min(
      4 - type,
      Math.max(0, effects.food.shape.cohesion - 4) * 0.4,
    );
  const balance = effects.typeBalance;
  type += Math.sign(4 - type) * Math.min(Math.abs(4 - type), balance);
  return Math.max(1, Math.min(7, Math.round(type + effects.typeShift)));
}

export function recipeShapeDistribution(input) {
  const selection = normalizeSelection(input);
  const effects = collectEffects(selection);
  const type = baseBristolType(selection, effects);
  const center = Math.min(0.95, 0.8 + effects.formationStability);
  const neighbors = [type - 1, type + 1].filter((id) => id >= 1 && id <= 7);
  // Hardness supplies a target; cohesion and elongation favor compatible forms.
  const weights = new Map([[type, center * 100]]);
  for (const id of neighbors)
    weights.set(id, ((1 - center) * 100) / neighbors.length);
  for (const [id, bonus] of Object.entries(effects.typeWeights))
    weights.set(Number(id), (weights.get(Number(id)) ?? 0) + bonus);
  const morphology = {
    1: [1, 1],
    2: [3, 3],
    3: [5, 5],
    4: [6, 6],
    5: [3, 2],
    6: [2, 2],
    7: [1, 1],
  };
  const { cohesion, elongation } = effects.food.shape;
  for (const [id, weight] of weights) {
    const [group, length] = morphology[id];
    // Liquid keeps its own outline; no amount of elongation creates a solid rope.
    const affinity =
      id === 7
        ? 1
        : Math.exp(
            -0.12 * Math.abs(cohesion - group) -
              0.09 * Math.abs(elongation - length),
          );
    weights.set(id, weight * affinity);
  }
  const total = [...weights.values()].reduce((sum, weight) => sum + weight, 0);
  return [...weights]
    .filter(([, weight]) => weight > 0)
    .map(([id, weight]) => ({ type: id, probability: weight / total }))
    .sort((a, b) => b.probability - a.probability || a.type - b.type);
}
