import { gameConfig } from "../config/game.js";
import { characterById } from "../content/catalog.js";
import { specimenBlueprintById } from "../content/specimen-blueprints.js";
import { normalizeSelection } from "./selection.js";
import { collectEffects } from "./effects.js";
import {
  matchesConditions,
  resolveCharacter,
  specialRules,
  variantRules,
} from "./combinations.js";
import { morphologyMultiplier } from "./food-appearance.js";
import { recipeShapeDistribution } from "./recipe-shape.js";
import { fixedDigestionTimes } from "../content/digestion.js";

// All rare materials share one budget, even when more variants or bonuses are added.
export function normalizeDropPool(
  entries,
  cap = gameConfig.maxSpecialProbability,
) {
  if (!Number.isFinite(cap) || cap < 0 || cap >= 1)
    throw new RangeError("Rare probability cap must be in [0, 1).");
  if (
    entries.some((entry) => !Number.isFinite(entry.weight) || entry.weight < 0)
  )
    throw new RangeError("Drop weights must be finite and nonnegative.");
  const commonWeight = entries
    .filter((entry) => !entry.special)
    .reduce((sum, entry) => sum + entry.weight, 0);
  if (commonWeight <= 0)
    throw new RangeError("A drop pool must include an ordinary outcome.");
  const rareWeight = entries
    .filter((entry) => entry.special)
    .reduce((sum, entry) => sum + entry.weight, 0);
  const maximumWeight = (commonWeight * cap) / (1 - cap);
  const scale = rareWeight > 0 ? Math.min(1, maximumWeight / rareWeight) : 1;
  const pool = entries
    .map((entry) => ({
      ...entry,
      weight: entry.weight * (entry.special ? scale : 1),
    }))
    .filter((entry) => entry.weight > 0);
  const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
  return pool.map((entry) => ({ ...entry, probability: entry.weight / total }));
}

export function conditionalDropPool(input, type) {
  const selection = normalizeSelection(input);
  const effects = collectEffects(selection);
  const preferred = resolveCharacter(selection);
  // Use an existing species of this structure instead of creating another form
  // of the preferred species. All seven structures have an ordinary baseline.
  const baselines = [
    "pebble",
    "stacked-stones",
    "cracked",
    "classic",
    "soft-pillows",
    "mashed-potato",
    "pancake",
  ];
  const characterId =
    characterById[preferred].homeType === type
      ? preferred
      : baselines[type - 1];
  if (!characterId) throw new RangeError("Unknown specimen structure");
  const pool = [
    {
      characterId,
      weight:
        gameConfig.commonDropWeight *
        (effects.dropWeightMultipliers[characterId] ?? 1),
      special: false,
    },
  ];
  for (const rule of variantRules) {
    if (
      rule.characterId !== characterId &&
      matchesConditions(rule.conditions, selection, effects, type)
    )
      pool.push({
        characterId: rule.characterId,
        weight:
          rule.baseWeight *
          (effects.dropWeightMultipliers[rule.characterId] ?? 1) *
          morphologyMultiplier(
            characterById[rule.characterId],
            effects.food.shape,
          ),
        special: false,
      });
  }
  // Ordinary variants share a fixed budget so adding content doesn't dilute rare odds.
  const ordinaryTotal = pool.reduce((sum, item) => sum + item.weight, 0);
  for (const item of pool)
    item.weight *= gameConfig.commonDropWeight / ordinaryTotal;
  for (const rule of specialRules) {
    if (
      characterById[rule.characterId]?.rarity !== "special" ||
      !matchesConditions(rule.conditions, selection, effects, type)
    )
      continue;
    const recipeMultiplier = (rule.weightModifiers || [])
      .filter((modifier) =>
        matchesConditions(modifier.conditions, selection, effects, type),
      )
      .reduce((multiplier, modifier) => multiplier * modifier.multiplier, 1);
    const weight =
      Math.max(0, rule.baseWeight + effects.specialWeightBonus) *
      recipeMultiplier *
      effects.specialWeightMultiplier *
      (effects.dropWeightMultipliers[rule.characterId] ?? 1);
    if (weight > 0)
      pool.push({ characterId: rule.characterId, weight, special: true });
  }
  return normalizeDropPool(pool);
}

// Build complete, fixed-form candidates first. Classification is a projection
// of their physical structure, never an independent reward draw.
export function getOutcomePool(input) {
  const selection = normalizeSelection(input);
  if (selection.digestionTime === "random") {
    const merged = new Map();
    for (const digestionTime of fixedDigestionTimes) {
      for (const entry of getOutcomePool({ ...selection, digestionTime })) {
        const existing = merged.get(entry.specimenId);
        const probability = entry.probability / fixedDigestionTimes.length;
        if (existing) existing.probability += probability;
        else merged.set(entry.specimenId, { ...entry, probability });
      }
    }
    return [...merged.values()]
      .map((entry) => ({ ...entry, weight: entry.probability }))
      .sort(
        (a, b) =>
          Number(a.special) - Number(b.special) ||
          b.probability - a.probability ||
          a.specimenId.localeCompare(b.specimenId, "en"),
      );
  }
  const pool = recipeShapeDistribution(selection).flatMap((affinity) =>
    conditionalDropPool(selection, affinity.type).map((entry) => {
      const specimenId = entry.characterId + ":" + affinity.type;
      const blueprint = specimenBlueprintById[specimenId];
      if (!blueprint)
        throw new Error("Missing concrete specimen: " + specimenId);
      return {
        ...entry,
        conditionalWeight: entry.weight,
        structuralAffinity: affinity.probability,
        weight: affinity.probability * entry.probability,
        specimenId,
        morphology: { ...blueprint.morphology },
        probability: affinity.probability * entry.probability,
      };
    }),
  );
  return pool.sort(
    (a, b) =>
      Number(a.special) - Number(b.special) ||
      b.probability - a.probability ||
      a.specimenId.localeCompare(b.specimenId, "en"),
  );
}
