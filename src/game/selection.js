import { gameConfig } from "../config/game.js";
import { normalizeForce } from "../content/force.js";
import {
  foodById,
  drinkById,
  additiveById,
  toiletById,
} from "../content/catalog.js";

export function normalizeSelection(value = {}) {
  value = value && typeof value === "object" ? value : {};
  const items =
    Array.isArray(value.additives) || value.additives instanceof Set
      ? [...value.additives]
      : [];
  const candidates = Array.isArray(value.foodIds) ? value.foodIds : [];
  const foodIds = [...new Set(candidates)]
    .filter((id) => Object.hasOwn(foodById, id))
    .slice(0, gameConfig.maxFoods);
  const drinkId = value.drinkId;
  const water = gameConfig.water;
  return {
    foodIds: foodIds.length ? foodIds : ["rice"],
    drinkId: Object.hasOwn(drinkById, drinkId) ? drinkId : "water",
    water: Number.isFinite(value.water)
      ? Math.max(
          water.min,
          Math.min(
            water.max,
            Math.round(value.water / water.step) * water.step,
          ),
        )
      : water.default,
    additives: [
      ...new Set(items.filter((id) => Object.hasOwn(additiveById, id))),
    ].slice(0, gameConfig.maxAdditives),
    force: normalizeForce(value.force),
    toiletId: Object.hasOwn(toiletById, value.toiletId)
      ? value.toiletId
      : "standard",
  };
}
