import { foods } from "../content/foods.js";
import { foodById } from "../content/catalog.js";
import { gameConfig } from "../config/game.js";

export function normalizeFoods(value, total = 0) {
  const eligible = foods
    .filter((food) => food.unlockAt <= total)
    .map((food) => food.id);
  const stored = Array.isArray(value?.unlocked) ? value.unlocked : [];
  return {
    unlocked: [...new Set([...eligible, ...stored])].filter((id) =>
      Object.hasOwn(foodById, id),
    ),
    tasted: [
      ...new Set(Array.isArray(value?.tasted) ? value.tasted : []),
    ].filter((id) => Object.hasOwn(foodById, id)),
  };
}

export function recordMeal(save, ids) {
  const before = new Set(save.foods.unlocked);
  save.foods = normalizeFoods(
    { ...save.foods, tasted: [...save.foods.tasted, ...ids] },
    save.total,
  );
  return save.foods.unlocked.filter((id) => !before.has(id));
}

export function canEatFoods(inventory, ids) {
  return (
    Array.isArray(ids) &&
    Array.isArray(inventory?.unlocked) &&
    ids.length >= 1 &&
    ids.length <= gameConfig.maxFoods &&
    new Set(ids).size === ids.length &&
    ids.every((id) => inventory.unlocked.includes(id))
  );
}
