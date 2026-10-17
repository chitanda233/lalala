export function recordDiscovery(save, outcome) {
  const individuals = save.individuals;
  const isNew = !individuals.some(
    (entry) => entry.specimenId === outcome.specimenId,
  );
  const isNewType = !individuals.some((entry) => entry.type === outcome.type);
  return { isNew, isNewType };
}
