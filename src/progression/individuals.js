import { specimenBlueprintById } from "../content/specimen-blueprints.js";
import { stoolColors } from "../content/colors.js";
import { normalizeMarks } from "../content/marks.js";
import { normalizeAppearance } from "../game/food-appearance.js";
import { normalizeSelection } from "../game/selection.js";
import { gameConfig } from "../config/game.js";

function normalizeIndividual(value, sequence) {
  if (
    !value ||
    typeof value.id !== "string" ||
    !value.id ||
    value.id.length > 200 ||
    !Number.isInteger(value.type) ||
    value.type < 1 ||
    value.type > 7
  )
    return null;
  const specimenId = `${value.characterId}:${value.type}`;
  const blueprint = specimenBlueprintById[specimenId];
  if (
    !blueprint ||
    value.specimenId !== blueprint.id ||
    value.morphology?.form !== blueprint.morphology.form
  )
    return null;
  const appearance = normalizeAppearance(value.appearance);
  if (!appearance || !Number.isInteger(appearance.variationSeed)) return null;
  return {
    id: value.id,
    sequence:
      Number.isSafeInteger(value.sequence) && value.sequence > 0
        ? value.sequence
        : sequence,
    occurrenceCount:
      Number.isSafeInteger(value.occurrenceCount) && value.occurrenceCount > 0
        ? value.occurrenceCount
        : 1,
    specimenId,
    characterId: value.characterId,
    type: value.type,
    morphology: { ...blueprint.morphology },
    ...(Number.isSafeInteger(value.rulesVersion) && value.rulesVersion > 0
      ? { rulesVersion: value.rulesVersion }
      : {}),
    marks: normalizeMarks(value.marks),
    ...(appearance ? { appearance } : {}),
    ...(value.colorId === null || Object.hasOwn(stoolColors, value.colorId)
      ? { colorId: value.colorId }
      : {}),
    ...(Number.isFinite(value.createdAt) && value.createdAt >= 0
      ? { createdAt: value.createdAt }
      : {}),
    ...(value.recipe && typeof value.recipe === "object"
      ? { recipe: {
          ...normalizeSelection(value.recipe),
          // Historical quantities describe the actual birth, not today's input limits.
          ...(Number.isInteger(value.recipe.water) && value.recipe.water >= 0 && value.recipe.water <= 2500 && value.recipe.water % 250 === 0
            ? { water: value.recipe.water } : {}),
        } }
      : {}),
    ...(Number.isFinite(value.score) && value.score >= 0 && value.score <= 100
      ? { score: value.score }
      : {}),
    ...(Number.isFinite(value.smoothness) &&
    value.smoothness >= 1 &&
    value.smoothness <= 5
      ? { smoothness: value.smoothness }
      : {}),
  };
}

export function normalizeIndividuals(value) {
  const sources = Array.isArray(value) ? value : [];
  const individuals = [];
  const ids = new Set();
  for (const source of sources) {
    const entry = normalizeIndividual(source, individuals.length + 1);
    if (!entry || ids.has(entry.id)) continue;
    ids.add(entry.id);
    individuals.push(entry);
  }
  return individuals;
}

function individualKey(entry) {
  const { variationSeed, ...appearance } = entry.appearance;
  return JSON.stringify([
    entry.specimenId,
    entry.colorId ?? null,
    [...entry.marks].sort(),
    {
      ...appearance,
      decorations: [...appearance.decorations].sort(),
      visualEffects: [...appearance.visualEffects].sort(),
      residues: [...appearance.residues].sort((a, b) => a.foodId.localeCompare(b.foodId)),
    },
  ]);
}

// Merge matching results, then keep seven distinct appearances per species.
// A merge always uses the newest snapshot; marks and decorations are never combined.
export function retainRecentIndividuals(individuals) {
  const merged = new Map();
  for (const entry of [...individuals].sort((a, b) => a.sequence - b.sequence)) {
    const key = individualKey(entry);
    const previous = merged.get(key);
    merged.set(key, {
      ...entry,
      occurrenceCount: Math.min(Number.MAX_SAFE_INTEGER,
        (previous?.occurrenceCount || 0) + (entry.occurrenceCount || 1)),
    });
  }
  const counts = new Map();
  return [...merged.values()]
    .sort((a, b) => b.sequence - a.sequence)
    .filter((entry) => {
      const count = counts.get(entry.specimenId) || 0;
      if (count >= gameConfig.maxIndividualsPerSpecimen) return false;
      counts.set(entry.specimenId, count + 1);
      return true;
    })
    .reverse();
}

export function recordIndividual(save, session) {
  save.individuals ??= [];
  const existing = save.individuals.find((entry) => entry.id === session.id);
  if (existing) return existing;
  const sequence =
    save.individuals.reduce((max, entry) => Math.max(max, entry.sequence), save.total || 0) +
    1;
  const individual = normalizeIndividual(
    {
      ...session.outcome,
      id: session.id,
      sequence,
      createdAt: session.endsAt,
      rulesVersion: session.rulesVersion,
      recipe: session,
    },
    sequence,
  );
  if (!individual) return null;
  save.individuals = retainRecentIndividuals([...save.individuals, individual]);
  return save.individuals.find(entry => entry.id === individual.id);
}
