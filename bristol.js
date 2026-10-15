// Shape definitions follow Cleveland Clinic's Bristol Stool Chart.
// The recipe resolver is a fictional game rule, not a physiological model.
export const bristolTypes = [
  {
    id: 1,
    name: "颗粒硬块型",
    description: "分散的坚硬小块，像一颗颗小石子。",
    group: "hard",
    groupLabel: "偏硬",
    hint: "试试少量饮水的配方。",
    color: "#a58d70",
    light: "#c8b296",
  },
  {
    id: 2,
    name: "结块条状型",
    description: "连成香肠状，但表面结块、质地坚硬。",
    group: "hard",
    groupLabel: "偏硬",
    hint: "把水量稍微往上调一点。",
    color: "#ae906b",
    light: "#cfb18a",
  },
  {
    id: 3,
    name: "表面开裂型",
    description: "呈香肠状，表面有明显裂纹。",
    group: "formed",
    groupLabel: "成形",
    hint: "快乐碳水搭配适中的水量。",
    color: "#b59a71",
    light: "#d9be94",
  },
  {
    id: 4,
    name: "光滑柔软型",
    description: "光滑、柔软，呈蛇形或长条状。",
    group: "formed",
    groupLabel: "成形",
    hint: "均衡套餐和适中的水量，刚刚好。",
    color: "#b49767",
    light: "#d8bc8c",
  },
  {
    id: 5,
    name: "边缘清晰软块型",
    description: "柔软的小块，边缘清楚、轮廓分明。",
    group: "loose",
    groupLabel: "偏稀",
    hint: "试试火辣挑战的基础配方。",
    color: "#b6a17a",
    light: "#d6c29c",
  },
  {
    id: 6,
    name: "松散糊状型",
    description: "蓬松、糊状的碎块，边缘参差不齐。",
    group: "loose",
    groupLabel: "偏稀",
    hint: "火辣挑战，再给它加一点水。",
    color: "#baa781",
    light: "#dbcca7",
  },
  {
    id: 7,
    name: "无固体水样型",
    description: "完全呈水样液体，没有固体块。",
    group: "loose",
    groupLabel: "偏稀",
    hint: "火辣挑战搭配高水量，看看会怎样。",
    color: "#b5a583",
    light: "#d9ccad",
  },
];

export function resolveBristolType(config) {
  const additives = new Set(config.additives);
  let type = { balanced: 4, garden: 4, carbs: 3, spicy: 5 }[config.recipe] || 4;
  if (config.water <= 500) type -= 3;
  else if (config.water <= 1000) type -= 2;
  else if (config.water >= 2250) type += 2;
  else if (config.water >= 1750) type += 1;
  if (additives.has("probiotic")) type += Math.sign(4 - type);
  if (additives.has("coffee")) type += 1;
  if (additives.has("chili")) type += 1;
  return Math.max(1, Math.min(7, type));
}

// Original SVG illustrations, drawn to match each type's shape and consistency.
export function stoolShape(type, color, light) {
  const shapes = {
    1: `<g fill="${color}"><path d="M45 65c-16-14-34 6-24 22 12 14 34 0 24-22Z"/><path d="M81 49c-18-7-31 11-21 23 14 15 34-8 21-23Z"/><path d="M127 62c-14-15-36 3-24 20 14 15 36-7 24-20Z"/><path d="M61 100c-18-11-34 10-21 23 16 12 35-6 21-23Z"/><path d="M109 105c-16-13-34 6-24 21 15 12 35-4 24-21Z"/><path d="M150 98c-14-15-33 3-22 18 13 13 34-4 22-18Z"/></g><path d="m28 73 7-4m29-11 8-4m39 15 8-3m-74 47 6-5m42 11 7-4m34-14 6-4" stroke="${light}" stroke-width="5" stroke-linecap="round" fill="none"/>`,
    2: `<g fill="${color}"><ellipse cx="32" cy="103" rx="18" ry="23" transform="rotate(25 32 103)"/><ellipse cx="44" cy="79" rx="20" ry="23" transform="rotate(25 44 79)"/><ellipse cx="67" cy="63" rx="23" ry="21"/><ellipse cx="94" cy="61" rx="22" ry="20"/><ellipse cx="119" cy="71" rx="22" ry="20"/><ellipse cx="141" cy="78" rx="19" ry="19"/></g><path d="M25 91q13-5 22 6M35 67q15-1 21 11m3-30q16 4 15 18m17-17q-5 11 2 23m24-12q-10 8-8 20m28-11q-8 3-9 13" fill="none" stroke="${light}" stroke-width="3.5" stroke-linecap="round"/>`,
    3: `<path d="M31 111c-23-27-3-62 31-69 23-5 42 12 62 10 29-4 35 30 13 39-21 9-43-8-63-2-17 6-21 37-43 22Z" fill="${color}"/><path d="m51 51 7 12-8 8 6 10m26-35-6 13 10 8-4 15m27-29-8 12 9 9-2 11m28-27-8 8 5 10" fill="none" stroke="${light}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>`,
    4: `<path d="M30 112C4 89 31 51 62 46c26-4 49 10 65 3 25-10 38 23 15 35-27 15-47-6-66 0-22 6-24 42-46 28Z" fill="${color}"/><path d="M30 88c5-18 19-29 34-30 19-3 43 10 62 3" fill="none" stroke="${light}" stroke-width="6" stroke-linecap="round"/>`,
    5: `<g fill="${color}"><path d="M29 53c-20 2-21 28-3 34 14 5 30-4 27-18-2-11-14-18-24-16Z"/><path d="M83 42c-20-7-36 11-26 27 8 15 38 15 40-4 1-10-5-20-14-23Z"/><path d="M126 62c-19-7-32 13-21 27 13 12 36 5 36-10 0-8-8-15-15-17Z"/><path d="M62 97c-22-11-45 6-35 23 8 13 37 18 46 2 4-9-3-22-11-25Z"/><path d="M116 109c-22-17-45 1-32 19 12 15 40 10 41-3 0-7-3-13-9-16Z"/></g><path d="m24 64 12-2m30-8 13-1m35 20 12 2m-84 32 14 2m39 9 14 4" fill="none" stroke="${light}" stroke-width="5" stroke-linecap="round"/>`,
    6: `<g fill="${color}"><path d="m29 58 10-15 12 7 10-7 5 14 12 2-2 14 9 10-15 5-6 12-15-6-14 4-2-14-13-6 9-10Z"/><path d="m109 41 10 8 13-4 3 12 16 5-8 14 4 13-15 1-10 11-9-11-16 1 2-15-9-11 13-7Z"/><path d="m69 108 13-11 11 7 12-5 7 12 14 2-2 14-14 5-12 8-13-8-15 2 1-13-12-8Z"/></g><path d="m39 64 14-1m57-4 13 7m-42 48 16 2" fill="none" stroke="${light}" stroke-width="5" stroke-linecap="round"/>`,
    7: `<path d="M28 88c-18-12 5-22 25-16 13-11 38-9 44-1 24-8 47 1 39 10 24-1 37 12 16 19 17 13-8 24-28 18-14 10-40 10-51 1-25 9-52-2-43-12-21-2-23-13-2-19Z" fill="${color}" opacity=".7"/><path d="M35 87q16-7 33 0t32 0 33 0M46 102q15-6 30 0t31 0" fill="none" stroke="${light}" stroke-width="3" stroke-linecap="round"/><ellipse cx="20" cy="68" rx="6" ry="3" fill="${color}" opacity=".5"/><ellipse cx="154" cy="121" rx="7" ry="3" fill="${color}" opacity=".5"/><path d="m44 53-2-7m90 13 4-7m-26 1 1-8" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`,
  };
  return shapes[type] || shapes[4];
}

export function bristolSvg(type) {
  const data = bristolTypes[type - 1];
  return `<svg viewBox="0 0 174 150" role="img" aria-label="布里斯托 ${type} 型：${data.name}">${stoolShape(type, data.color, data.light)}</svg>`;
}
