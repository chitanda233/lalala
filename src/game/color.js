import { foodById, drinkById, additiveById } from "../content/catalog.js";
import { normalizeSelection } from "./selection.js";

// These tags describe actual pigment sources, never the identity of a drawn collectible.
const pigmentTags = [
  ["clay", "clay"], ["dragon-pigment", "dragon"], ["beet-pigment", "beet"],
  ["berry-pigment", "berry"], ["ink", "ink"], ["charcoal", "ink"],
  ["cocoa", "cocoa"], ["coffee", "coffee"], ["amber", "honey"],
  ["green", "garden"], ["chili", "fire"], ["spicy", "fire"], ["milk", "milk"],
];
const pigmentFor = tags => pigmentTags.find(([tag]) => tags.includes(tag))?.[1];

export function sourceColor(input, catalog = { foodById, drinkById, additiveById }) {
  const selection = normalizeSelection(input);
  const sources = selection.foodIds.map(id => {
    const food = catalog.foodById[id], attributes = food.attributes;
    return { id: attributes.pigmentId, strength: attributes.colorStrength,
      weight: attributes.colorStrength * (1 + attributes.influence / 4), source: `food:${id}` };
  }).filter(source => source.id && source.strength > 1);
  const drink = catalog.drinkById[selection.drinkId];
  const pigment = pigmentFor(drink.tags);
  if (pigment) {
    const strength = Math.min(7, 7 * Math.min(selection.water / 1500, 5 / 3));
    sources.push({ id: pigment, strength, weight: 7 * selection.water / 1500, source: `drink:${drink.id}` });
  }
  for (const id of selection.additives) {
    const pigment = pigmentFor(catalog.additiveById[id].tags);
    if (pigment) sources.push({ id: pigment, strength: 7, weight: 14, source: `additive:${id}` });
  }
  return sources.sort((a,b) => b.weight-a.weight || a.source.localeCompare(b.source))[0] || null;
}

export function resolveColor(input, character) {
  return character.rarity === "special" ? null : sourceColor(input)?.id || "classic";
}

export function resolveColorStrength(input, character) {
  return character.rarity === "special" ? 7 : sourceColor(input)?.strength || 1;
}
