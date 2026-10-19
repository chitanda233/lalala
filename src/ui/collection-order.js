function interleave(base, accents) {
  const slots = Array.from({ length: base.length + 1 }, () => []);
  const span = base.length + (accents.length > base.length ? 1 : 0);
  accents.forEach((item, index) => {
    const slot = Math.floor((index + 1) * span / (accents.length + 1));
    slots[slot].push(item);
  });
  return slots.flatMap((items, index) =>
    index < base.length ? [...items, base[index]] : items);
}

// Apply the same fixed spacing to the full catalog or a filtered type.
// This presentation order never changes the content table or drop pool.
export function collectionDisplayOrder(specimens) {
  const common = specimens.filter(item => item.rarity === "common");
  const uncommon = specimens.filter(item => item.rarity !== "common" && item.rarity !== "special");
  const rare = specimens.filter(item => item.rarity === "special");
  return interleave(common, interleave(uncommon, rare));
}
