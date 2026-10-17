import { toilets } from "../content/toilets.js";
import { toiletById } from "../content/catalog.js";

export function normalizeToilets(value) {
  const starters = toilets
    .filter((toilet) => toilet.starter)
    .map((toilet) => toilet.id);
  const owned = [
    ...new Set([
      ...starters,
      ...(Array.isArray(value?.owned) ? value.owned : []),
    ]),
  ].filter((id) => Object.hasOwn(toiletById, id));
  return {
    owned,
    equipped: owned.includes(value?.equipped) ? value.equipped : "standard",
  };
}

export function unlockToilet(inventory, id) {
  if (!Object.hasOwn(toiletById, id) || inventory.owned.includes(id))
    return false;
  inventory.owned.push(id);
  return true;
}

export function equipToilet(inventory, id) {
  if (!Object.hasOwn(toiletById, id) || !inventory.owned.includes(id))
    return false;
  inventory.equipped = id;
  return true;
}
