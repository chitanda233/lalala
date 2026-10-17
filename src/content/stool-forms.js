// Physical structure is recorded on an individual before it is classified.
export const stoolForms = [
  { type: 1, id: "hard-pellets", name: "硬颗粒便", shortName: "硬颗粒" },
  { type: 2, id: "lumpy-log", name: "结块条状便", shortName: "结块条" },
  { type: 3, id: "cracked-log", name: "裂纹条状便", shortName: "裂纹条" },
  { type: 4, id: "smooth-log", name: "柔软成形便", shortName: "柔软长条" },
  { type: 5, id: "soft-blobs", name: "清晰软块便", shortName: "软块" },
  { type: 6, id: "mushy-fragments", name: "松散糊状便", shortName: "糊状团" },
  { type: 7, id: "watery", name: "水样便", shortName: "水样便" },
];
export const stoolFormById = Object.fromEntries(
  stoolForms.map((form) => [form.id, form]),
);
