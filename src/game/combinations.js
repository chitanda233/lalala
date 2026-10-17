import { characters } from "../content/stools.js";
import { characterById } from "../content/catalog.js";
import { collectEffects } from "./effects.js";
import { normalizeSelection } from "./selection.js";
import { forceZone } from "../content/force.js";

// These rules select ordinary appearances. Rare materials only enter weighted drops.
export const appearanceRules = [
  { id: "dry", characterId: "pebble", conditions: { waterMax: 750 } },
  {
    id: "spicy",
    characterId: "fire",
    conditions: { tagsAny: ["chili", "spicy"] },
  },
  { id: "coffee", characterId: "coffee", conditions: { tagsAny: ["coffee"] } },
  {
    id: "cloud",
    characterId: "cloud",
    conditions: { additivesAll: ["probiotic"], waterMin: 2000 },
  },
];

export const variantRules = characters
  .filter((item) => item.drop && item.rarity !== "special")
  .map((item) => ({
    characterId: item.id,
    baseWeight: item.drop.weight,
    conditions: { ...item.drop.conditions, types: item.types },
  }));
export const specialRules = characters
  .filter((item) => item.rarity === "special")
  .map((item) => ({
    characterId: item.id,
    baseWeight: item.drop.weight,
    conditions: { ...item.drop.conditions, types: item.types },
    weightModifiers:
      item.id === "gold"
        ? [
            {
              multiplier: 1.5,
              conditions: {
                foodIdsAny: ["broccoli"],
                additivesAll: ["probiotic"],
                waterMin: 1500,
                waterMax: 2000,
              },
            },
          ]
        : [],
  }));

export function matchesConditions(conditions, selection, effects, type) {
  return (
    (!conditions.forceZone ||
      conditions.forceZone === forceZone(selection.force).id) &&
    (!conditions.tagsAll ||
      conditions.tagsAll.every((tag) => effects.tags.includes(tag))) &&
    (!conditions.foodIdsAny ||
      conditions.foodIdsAny.some((id) => selection.foodIds.includes(id))) &&
    (!conditions.foodIdsAll ||
      conditions.foodIdsAll.every((id) => selection.foodIds.includes(id))) &&
    (!conditions.drinkId || conditions.drinkId === selection.drinkId) &&
    (!conditions.toiletId || conditions.toiletId === selection.toiletId) &&
    (conditions.waterMin == null || selection.water >= conditions.waterMin) &&
    (conditions.waterMax == null || selection.water <= conditions.waterMax) &&
    (!conditions.types || conditions.types.includes(type)) &&
    (!conditions.additivesAll ||
      conditions.additivesAll.every((id) =>
        selection.additives.includes(id),
      )) &&
    (!conditions.tagsAny ||
      conditions.tagsAny.some((tag) => effects.tags.includes(tag))) &&
    (!conditions.excludedTags ||
      !conditions.excludedTags.some((tag) => effects.tags.includes(tag)))
  );
}

export function resolveCharacter(input) {
  const selection = normalizeSelection(input);
  const effects = collectEffects(selection);
  const characterId =
    appearanceRules.find(
      (rule) =>
        characterById[rule.characterId]?.rarity === "common" &&
        matchesConditions(rule.conditions, selection, effects),
    )?.characterId ||
    (effects.tags.includes("green") ? "garden" : effects.food.appearanceId);
  return characterById[characterId]?.rarity === "common"
    ? characterId
    : "classic";
}
