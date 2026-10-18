import { gameConfig } from "../config/game.js";
import { normalizeSelection } from "../game/selection.js";
import { restoreSession } from "../game/session.js";
import { normalizeToilets, equipToilet } from "../progression/toilets.js";
import { normalizeFoods } from "../progression/foods.js";
import { normalizeIndividuals } from "../progression/individuals.js";

export function normalizeSave(value = {}) {
  value = value && typeof value === "object" ? value : {};
  const settings = normalizeSelection(value.settings);
  const total =
    Number.isSafeInteger(value.total) && value.total >= 0 ? value.total : 0;
  const individuals = normalizeIndividuals(value.individuals);
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
  };
}
