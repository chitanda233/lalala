import { characterById } from "../content/catalog.js";
import { normalizeSelection } from "./selection.js";
import { collectEffects } from "./effects.js";
import { resolveBristolType } from "./stool-type.js";
import { conditionalDropPool, getOutcomePool } from "./outcome-pool.js";
import { resolveColor, resolveColorStrength } from "./color.js";
import { foodAppearance } from "./food-appearance.js";
import { classifySpecimen } from "./specimen.js";
import { explainOutcome } from "./explanation.js";
import { smoothness } from "./smoothness.js";

export { getOutcomePool } from "./outcome-pool.js";

// Conditional inspection API for planning tools; gameplay draws a whole specimen.
export function getDropPool(input, type = resolveBristolType(input)) {
  return conditionalDropPool(input, type);
}

export function specialProbability(selection) {
  return getOutcomePool(selection)
    .filter((entry) => entry.special)
    .reduce((total, entry) => total + entry.probability, 0);
}

function drawValue(random) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new RangeError("Random source must return a number in [0, 1).");
  return value;
}

export function rollOutcome(input, random = Math.random) {
  const selection = normalizeSelection(input);
  const effects = collectEffects(selection);
  const pool = getOutcomePool(selection);
  let remaining = drawValue(random);
  const candidate =
    pool.find((entry) => (remaining -= entry.probability) < 0) || pool.at(-1);
  // The second draw varies this individual's surface; it never rerolls its class.
  const variationSeed = Math.floor(drawValue(random) * 1000000);
  const character = characterById[candidate.characterId];
  const specimen = {
    specimenId: candidate.specimenId,
    characterId: character.id,
    morphology: { ...candidate.morphology },
    colorId: candidate.special ? null : resolveColor(selection, character),
    marks: effects.outcomeMarks,
    appearance: {
      ...foodAppearance(
        selection,
        effects,
        resolveColorStrength(selection, character),
      ),
      variationSeed,

    },
    special: candidate.special,
  };
  const type = classifySpecimen(specimen);
  const level = smoothness(selection, type);
  const outcome = {
    ...specimen,
    type,
    smoothness: level,
    score: Math.round(
      Math.min(100, 50 + level * 9 + (specimen.special ? 5 : 0)),
    ),
  };
  return { ...outcome, reasons: explainOutcome(outcome) };
}
