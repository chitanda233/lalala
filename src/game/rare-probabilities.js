import { gameConfig } from "../config/game.js";
import { characters } from "../content/specimens.js";

// One shared budget for gameplay, previews, the content studio and generated docs.
export function rareBudget(additive, ids = characters.filter(item => item.rarity === "special").map(item => item.id)) {
  const targets = [...new Set(additive?.rareTargets || [])].filter(id => ids.includes(id));
  const base = gameConfig.baseRareProbability / ids.length;
  const entries = ids.map(id => ({
    characterId: id,
    probability: targets.length
      ? targets.includes(id) ? gameConfig.boostedRareTargetProbability / targets.length : 0
      : base,
  }));
  const rareProbability = entries.reduce((sum, entry) => sum + entry.probability, 0);
  return {
    entries, targets,
    targetProbability: targets.length ? gameConfig.boostedRareTargetProbability : 0,
    rareProbability,
    ordinaryProbability: 1 - rareProbability,
  };
}
