import { contentValues } from "./managed-content.js";

// Empty paths keep the original sculpture, decoration and food-mark layers.
export const referenceStoolAssets = Object.fromEntries(
  contentValues.artwork.filter((item) => item.path).map((item) => [item.id, item.path]),
);
