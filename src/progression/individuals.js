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

// Keep the newest birth of each species, ordered from oldest to newest.
export function retainRecentIndividuals(individuals) {
  const seen = new Set();
  return [...individuals]
    .sort((a, b) => a.sequence - b.sequence)
    .reverse()
    .filter((entry) => {
      if (seen.has(entry.specimenId)) return false;
      seen.add(entry.specimenId);
      return true;
    })
    .slice(0, gameConfig.maxIndividuals)
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
  if (individual)
    save.individuals = retainRecentIndividuals([...save.individuals, individual]);
  return individual;
}
