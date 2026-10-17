import { foods } from "./foods.js";
import { drinks } from "./drinks.js";
import { additives } from "./additives.js";
import { toilets } from "./toilets.js";
import { characters } from "./stools.js";

const index = (items) =>
  Object.fromEntries(items.map((item) => [item.id, item]));
export const foodById = index(foods);
export const drinkById = index(drinks);
export const additiveById = index(additives);
export const toiletById = index(toilets);
export const characterById = index(characters);
