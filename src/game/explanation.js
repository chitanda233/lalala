import { specimenMaterial } from "../content/materials.js";
import { characterById } from "../content/catalog.js";
import { bristolTypes } from "../content/stools.js";
import { stoolColors } from "../content/colors.js";
import { normalizeMarks } from "../content/marks.js";
import { normalizeAppearance } from "./food-appearance.js";
import { classifySpecimen } from "./specimen.js";

const surfaces = [
  "颗粒轮廓分明，块体彼此分离。",
  "条体凹凸不平，可见结块。",
  "表面可见裂纹，条体仍保持连贯。",
  "表面平滑，轮廓连续。",
  "软块边缘清楚，块体之间可以分开辨认。",
  "边缘松散，缺少清晰的成形边界。",
  "液面摊开，缺少固体支撑。",
];

// Describe the observed result without reading its recipe
// or today's food parameters. A material never overrides the actual stool type.
export function diagnoseOutcome(outcome) {
  const type = bristolTypes[classifySpecimen(outcome) - 1];
  const character = characterById[outcome.characterId];
  const compatible = character.types.includes(type.id);
  const appearance = normalizeAppearance(outcome.appearance);
  const details = [
    `形态：${type.description}`,
    `造型：${compatible ? character.description : type.description}`,
  ];

  const texture = [];
  if (appearance?.grain > 1)
    texture.push(appearance.grain >= 5 ? "粗颗粒纹理明显" : "可见细小颗粒纹理");
  if (appearance?.porosity > 1)
    texture.push(
      appearance.porosity >= 5 ? "气孔纹理较密集" : "可见少量气孔纹理",
    );
  details.push(
    `表面：${texture.length ? `${texture.join("，")}。` : surfaces[type.id - 1]}`,
  );

  const coating = specimenMaterial(outcome);
  const material = coating || (compatible && character.rarity === "special");
  const color =
    appearance?.colorStrength === 1 && !material
      ? stoolColors.classic.name
      : stoolColors[outcome.colorId]?.name;
  details.push(
    material
      ? `材质：可见${coating?.material || character.material}质感；软硬与成形仍按 ${type.id} 型判断。`
      : `色泽：${color ? `${appearance?.colorStrength < 7 ? "底色带有" : "呈"}${color}色调` : "保留本款底色"}。`,
  );

  if (appearance?.decorations.length) {
    const names = { glitter: "闪粉", "gold-flake": "金箔", silver: "银色斑点", petals: "花瓣", popping: "跳跳颗粒", charcoal: "炭色斑点" };
    details.push(`添加物：${appearance.decorations.map(id => names[id]).join("、")}。`);
  }

  const residues = [];
  if (normalizeMarks(outcome.marks).includes("enoki"))
    residues.push("可见金针菇细丝状印记");
  if (appearance?.residues.length)
    residues.push(
      appearance.residues.some((entry) => entry.retention >= 5)
        ? "食材残留印记较明显"
        : "可见少量食材残留印记",
    );
  if (residues.length) details.push(`可见残留：${residues.join("，")}。`);

  return { summary: type.assessment, details };
}

export function explainOutcome(outcome) {
  return diagnoseOutcome(outcome).details;
}
