import { gameConfig } from "../config/game.js";
import { normalizeSelection } from "../game/selection.js";
import { restoreSession } from "../game/session.js";
import { normalizeToilets, equipToilet } from "../progression/toilets.js";
import { normalizeFoods } from "../progression/foods.js";
import { normalizeIndividuals, retainRecentIndividuals } from "../progression/individuals.js";
import { normalizeDiscoveries } from "../progression/collection.js";

export function normalizeSave(value = {}) {
  value = value && typeof value === "object" ? value : {};
  const settings = normalizeSelection(value.settings);
  const total =
    Number.isSafeInteger(value.total) && value.total >= 0 ? value.total : 0;
  const history = normalizeIndividuals(value.individuals);
  const individuals = retainRecentIndividuals(history);
  const discoveredSpecimens = normalizeDiscoveries(value.discoveredSpecimens, history);
  const lastSettledAt = history.reduce(
    (latest, entry) => Math.max(latest, entry.createdAt ?? -1),
    Number.isFinite(value.lastSettledAt) && value.lastSettledAt >= 0 ? value.lastSettledAt : -1,
  );
  const foods = normalizeFoods(value.foods, total);
  settings.foodIds = settings.foodIds.filter((id) =>
    foods.unlocked.includes(id),
  );
  if (!settings.foodIds.length) settings.foodIds = ["rice"];
  const toilets = normalizeToilets(value.toilets, total);
  if (!value.toilets) equipToilet(toilets, settings.toiletId);
  settings.toiletId = toilets.equipped;
  return {
    version: gameConfig.saveVersion,
    individuals,
    discoveredSpecimens,
    total,
    sound: value.sound === true,
    settings,
    toilets,
    foods,
    session: restoreSession(value.session),
    lastSettledSessionId:
      typeof value.lastSettledSessionId === "string"
        ? value.lastSettledSessionId
        : null,
    lastSettledAt: lastSettledAt >= 0 ? lastSettledAt : null,
  };
}
