import { gameConfig } from "../config/game.js";
import { foodById, characterById } from "../content/catalog.js";
import { stoolColors } from "../content/colors.js";
import { normalizeMarks } from "../content/marks.js";
import { normalizeAppearance } from "./food-appearance.js";
import { recordMeal } from "../progression/foods.js";
import { recordDiscovery } from "../progression/collection.js";
import { recordIndividual } from "../progression/individuals.js";
import { specimenBlueprint } from "./specimen.js";
import { normalizeSelection } from "./selection.js";
import { rollOutcome } from "./drops.js";
import { oscillatingForce } from "../content/force.js";
import { fixedDigestionTimes } from "../content/digestion.js";

export function createAimingSession(
  input,
  { now = Date.now(), random = Math.random } = {},
) {
  const selection = normalizeSelection(input);
  if (selection.digestionTime === "random") {
    const draw = random();
    if (!Number.isFinite(draw) || draw < 0 || draw >= 1)
      throw new RangeError("Invalid digestion draw");
    selection.digestionTime =
      fixedDigestionTimes[Math.floor(draw * fixedDigestionTimes.length)];
  }
  const id = globalThis.crypto.randomUUID();
  return {
    ...selection,
    id,
    startedAt: now,
    phase: "aiming",
    lockedAt: null,
    endsAt: null,
    seconds: null,
    rulesVersion: gameConfig.rulesVersion,
    force: null,
    outcome: null,
  };
}

function completeSession(session, force, now, random) {
  session.force = force;
  session.phase = "running";
  session.lockedAt = now;
  session.endsAt = now + gameConfig.resultDelayMs;
  session.seconds = (session.endsAt - session.startedAt) / 1000;
  session.outcome = {
    ...rollOutcome(session, random),
    individualId: session.id,
  };
}

// Construct a round with an already measured force for simulations and previews.
export function createSession(input, options = {}) {
  const session = createAimingSession(input, options);
  completeSession(
    session,
    normalizeSelection(input).force,
    session.startedAt,
    options.random || Math.random,
  );
  return session;
}

export function lockSessionForce(
  session,
  { now = Date.now(), random = Math.random } = {},
) {
  if (!session || session.phase !== "aiming" || now < session.startedAt)
    return false;
  completeSession(
    session,
    oscillatingForce(now - session.startedAt),
    now,
    random,
  );
  return true;
}

export function restoreSession(value) {
  if (!value || typeof value !== "object") return null;
  const ids = value.foodIds;
  if (
    typeof value.id !== "string" ||
    !value.id ||
    value.id.length > 200 ||
    value.rulesVersion !== gameConfig.rulesVersion ||
    !Array.isArray(ids) ||
    !ids.length ||
    ids.length > gameConfig.maxFoods ||
    new Set(ids).size !== ids.length ||
    !ids.every((id) => Object.hasOwn(foodById, id)) ||
    !Number.isFinite(value.startedAt) ||
    !fixedDigestionTimes.includes(value.digestionTime) ||
    !Number.isFinite(value.water) ||
    !Array.isArray(value.additives)
  )
    return null;
  const base = {
    ...normalizeSelection(value),
    id: value.id,
    startedAt: value.startedAt,
    seconds: value.seconds,
    rulesVersion: value.rulesVersion,
    phase: value.phase,
    lockedAt: value.lockedAt,
    endsAt: value.endsAt,
  };
  if (value.phase === "aiming") {
    return value.seconds === null &&
      value.force === null &&
      value.outcome === null &&
      value.endsAt === null &&
      value.lockedAt === null
      ? { ...base, force: null, outcome: null }
      : null;
  }
  if (
    value.phase !== "running" ||
    !Number.isInteger(value.force) ||
    value.force < 0 ||
    value.force > 100 ||
    !Number.isFinite(value.lockedAt) ||
    value.lockedAt < value.startedAt ||
    !Number.isFinite(value.endsAt) ||
    value.endsAt !== value.lockedAt + gameConfig.resultDelayMs ||
    value.seconds !== (value.endsAt - value.startedAt) / 1000
  )
    return null;
  const outcome = value.outcome;
  if (!outcome || typeof outcome !== "object") return null;
  const blueprint = specimenBlueprint(outcome);
  const appearance = normalizeAppearance(outcome.appearance);
  if (
    !blueprint ||
    outcome.specimenId !== blueprint.id ||
    outcome.morphology?.form !== blueprint.morphology.form ||
    outcome.individualId !== value.id ||
    !Number.isInteger(outcome.type) ||
    !appearance ||
    !Number.isInteger(appearance.variationSeed) ||
    !Array.isArray(outcome.marks) ||
    !(
      outcome.colorId === null || Object.hasOwn(stoolColors, outcome.colorId)
    ) ||
    !Number.isInteger(outcome.score) ||
    outcome.score < 0 ||
    outcome.score > 100 ||
    !Number.isInteger(outcome.smoothness) ||
    outcome.smoothness < 1 ||
    outcome.smoothness > 5 ||
    outcome.special !==
      (characterById[outcome.characterId].rarity === "special")
  )
    return null;
  return {
    ...base,
    outcome: {
      specimenId: blueprint.id,
      individualId: value.id,
      characterId: blueprint.characterId,
      morphology: { ...blueprint.morphology },
      type: outcome.type,
      colorId: outcome.colorId,
      marks: normalizeMarks(outcome.marks),
      appearance,
      smoothness: outcome.smoothness,
      score: outcome.score,
      special: outcome.special,
      reasons: Array.isArray(outcome.reasons)
        ? outcome.reasons
            .filter((reason) => typeof reason === "string")
            .slice(0, 6)
            .map((reason) => reason.slice(0, 700))
        : [],
    },
  };
}

export function sessionProgress(session, now = Date.now()) {
  if (session.phase === "aiming") return { remaining: null, progress: 0 };
  const remaining = Math.max(0, session.endsAt - now);
  return {
    remaining,
    progress: Math.max(
      0,
      Math.min(1, 1 - remaining / (session.endsAt - session.lockedAt)),
    ),
  };
}

export function settleSession(save, now = Date.now()) {
  const session = save.session;
  if (!session || session.phase !== "running" || now < session.endsAt)
    return null;
  if (
    session.id === save.lastSettledSessionId ||
    save.individuals?.some((entry) => entry.id === session.id)
  ) {
    save.session = null;
    return null;
  }
  const discovery = recordDiscovery(save, session.outcome);
  const individual = recordIndividual(save, session);
  save.total += 1;
  const unlockedFoods = recordMeal(save, session.foodIds);
  save.lastSettledSessionId = session.id;
  save.session = null;
  return { session, ...discovery, individual, unlockedFoods };
}
