import { drinkById, additiveById } from "../content/catalog.js";
import { collectEffects } from "./effects.js";
import { normalizeSelection } from "./selection.js";
const pigments = [
  ["clay", "clay"],
  ["dragon-pigment", "dragon"],
  ["beet-pigment", "beet"],
  ["berry-pigment", "berry"],
  ["ink", "ink"],
  ["charcoal", "ink"],
  ["milk", "milk"],
  ["amber", "honey"],
  ["cocoa", "cocoa"],
  ["green", "garden"],
  ["coffee", "coffee"],
];
const fixed = {
  "red-dragon": "dragon",
  "beet-red": "beet",
  "purple-berry": "berry",
  "ink-black": "ink",
  "cocoa-truffle": "cocoa",
  "amber-honey": "honey",
  "milk-white": "milk",
  "sesame-charcoal": "ink",
};
export function resolveColor(input, character) {
  if (character.rarity === "special") return null;
  // Color-specific catalog entries retain their identity. Sculptures and speckles inherit pigment.
  if (fixed[character.id]) return fixed[character.id];
  const selection = normalizeSelection(input);
  const effects = collectEffects(selection);
  const drinkTags = drinkById[selection.drinkId].tags;
  const otherTags = selection.additives.flatMap((id) => additiveById[id].tags);
  return (
    pigments.find(([tag]) => drinkTags.includes(tag))?.[1] ||
    pigments.find(([tag]) => otherTags.includes(tag))?.[1] ||
    effects.food.pigmentId ||
    (effects.food.hasPigment ? "classic" : null) ||
    (effects.tags.some((tag) => ["chili", "spicy"].includes(tag))
      ? "fire"
      : effects.food.appearanceId)
  );
}

export function resolveColorStrength(input, character) {
  if (character.rarity === "special") return 7;
  const selection = normalizeSelection(input);
  const otherTags = [
    ...drinkById[selection.drinkId].tags,
    ...selection.additives.flatMap((id) => additiveById[id].tags),
  ];
  const food = collectEffects(selection).food;
  const drinkPigment = pigments.some(([tag]) => drinkById[selection.drinkId].tags.includes(tag));
  const source = fixed[character.id] || pigments.some(([tag]) => otherTags.includes(tag)) ? 7 : food.hasPigment ? food.colorStrength : 7;
  const scale = drinkPigment ? Math.min(selection.water / 1500, 5 / 3) : 1;
  return Math.max(1, Math.min(7, source * scale));
}
