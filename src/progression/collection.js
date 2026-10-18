import { specimenBlueprintById } from "../content/specimen-blueprints.js";
import { classifySpecimen } from "../game/specimen.js";

export function normalizeDiscoveries(value, individuals = []) {
  const recorded = Array.isArray(value) ? value : [];
  return [...new Set([
    ...recorded.filter(id => typeof id === "string" && Object.hasOwn(specimenBlueprintById, id)),
    ...individuals.map(entry => entry.specimenId),
  ])];
}

export function recordDiscovery(save, outcome) {
  const discovered = save.discoveredSpecimens ??= normalizeDiscoveries([], save.individuals);
  const isNew = !discovered.includes(outcome.specimenId);
  const isNewType = !discovered.some(id => classifySpecimen(specimenBlueprintById[id]) === outcome.type);
  if (isNew) discovered.push(outcome.specimenId);
  return { isNew, isNewType };
}
