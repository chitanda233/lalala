// 便便属性与食物后台使用相同的 1–7 直观量表；数值越大越硬。
const typeProperties = {
  1: [7, 1, 1, 4, 1],
  2: [6, 5, 4, 4, 1],
  3: [5, 6, 6, 2, 1],
  4: [4, 7, 6, 1, 1],
  5: [3, 3, 2, 1, 3],
  6: [2, 2, 1, 2, 5],
  7: [1, 1, 1, 1, 1],
};
export const stoolPropertyFields = [
  { key: "hardness", name: "软硬" },
  { key: "cohesion", name: "凝聚" },
  { key: "elongation", name: "延展" },
  { key: "grain", name: "颗粒" },
  { key: "porosity", name: "蓬松" },
];
export function stoolProperties(type, art) {
  const values = [...typeProperties[type]];
  if (["foam", "bubbles"].includes(art)) values[4] = 7;
  if (["corn", "grain", "oats", "bran", "charcoal", "popping"].includes(art)) values[3] = 6;
  if (["spiral", "rope", "ribbon", "spring", "warm", "curve"].includes(art)) values[2] = 7;
  return Object.fromEntries(stoolPropertyFields.map((field, i) => [field.key, values[i]]));
}
