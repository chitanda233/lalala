import { toilets } from "../content/toilets.js";
import { toiletById } from "../content/catalog.js";

export function normalizeToilets(value, total = 0) {
  const owned = toilets
    .filter((toilet) =>
      toilet.starter ||
      (toilet.unlock.kind === "rounds" && total >= toilet.unlock.count),
    )
    .map((toilet) => toilet.id);
  return {
    owned,
    equipped: owned.includes(value?.equipped) ? value.equipped : "standard",
  };
}

export function recordToiletUnlocks(save) {
  const before = new Set(save.toilets.owned);
  save.toilets = normalizeToilets(save.toilets, save.total);
  return save.toilets.owned.filter((id) => !before.has(id));
}

export function toiletUnlockHint(toilet, total) {
  if (toilet.unlock.kind === "rounds")
    return `累计完成 ${toilet.unlock.count} 次后解锁（当前 ${total} 次）`;
  return "初始解锁";
}

export function equipToilet(inventory, id) {
  if (!Object.hasOwn(toiletById, id) || !inventory.owned.includes(id))
    return false;
  inventory.equipped = id;
  return true;
}
