import { stoolColors } from "../../content/colors.js";
import { bristolTypes } from "../../content/stools.js";
import { normalizeMarks, outcomeMarks } from "../../content/marks.js";
import { normalizeAppearance } from "../../game/food-appearance.js";
import { foodArt } from "./foods.js";
import { specimenName } from "../../game/specimen.js";
import { referenceStoolAssets } from "../../content/stool-art-assets.js";

// Reference-led transparent sprites and code-rendered resin collectibles share
// the same surface-clipped food marks and functional additive decorations.
const assetRoot = "/assets/stools/";
const materialArts = new Set([
  "metal",
  "crystal",
  "rainbow",
  "jelly",
  "frost",
  "glow",
  "meteor",
  "amber",
]);
const tintableReferenceIds = new Set([
  "classic", "spiral", "stacked-stones", "cracked", "soft-pillows",
  "mashed-potato", "pancake", "jet", "bubbly",
]);

function referenceSpriteSvg(character, type, colorId, marks, appearance) {
  const signatures = normalizeMarks(marks);
  const id = `specimen-${++illustrationId}`;
  let palette = stoolColors[colorId] || character;
  if (appearance && tintableReferenceIds.has(character.id)) {
    const amount = (appearance.colorStrength - 1) / 6;
    palette = {
      color: mixHex(stoolColors.classic.color, palette.color, amount),
      light: mixHex(stoolColors.classic.light, palette.light, amount),
    };
  }
  // Plain brown sculptures can still take drink colors. Corn, ink, gold and other
  // reference materials retain the deliberate colors of their source artwork.
  const tinted = tintableReferenceIds.has(character.id) && colorId && colorId !== "classic";
  const filter = tinted
    ? `<defs>${tintFilter(`${id}-tint`, palette.color, palette.light, true)}</defs>`
    : "";
  const body = `<image href="${referenceStoolAssets[character.id]}" x="12" y="12" width="296" height="296" preserveAspectRatio="xMidYMid meet"${tinted ? ` filter="url(#${id}-tint)"` : ""}/>`;
  const signature = signatures.map(mark => imageAsset(`type-${type}-${mark}`)).join("");
  return `<svg viewBox="0 0 320 320" role="img" aria-label="${safeText(character.name)} · 布里斯托 ${type} 型" data-specimen="${safeText(character.id)}:${type}" data-material="${safeText(character.material)}" data-tint="${palette.color}" data-marks="${signatures.join(" ")}">${filter}${body}${textureLayers(`type-${type}`, `${id}-texture`, appearance, palette, body)}${additiveDecorationLayers(body, `${id}-decor`, appearance)}${signature ? `${surfaceMask(body, id)}<g mask="url(#${id}-surface)" opacity="${appearance ? 0.25 + appearance.enokiRetention * 0.107 : 1}">${signature}</g>` : ""}</svg>`;
}

let illustrationId = 0;
const normalizeType = (type) =>
  Number.isInteger(type) && type >= 1 && type <= 7 ? type : 4;
const safeText = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
function channel(hex, index) {
  return parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
}
function tintFilter(id, color, light, desaturate = false) {
  const functions = ["R", "G", "B"]
    .map((letter, index) => {
      const main = channel(color, index),
        highlight = channel(light, index);
      const points = [
        main * 0.2,
        main * 0.68,
        main * 0.96,
        main * 0.35 + highlight * 0.65,
        Math.min(1, highlight * 1.08),
      ];
      return `<feFunc${letter} type="table" tableValues="${points.map((value) => value.toFixed(4)).join(" ")}"/>`;
    })
    .join("");
  return `<filter id="${id}" color-interpolation-filters="sRGB">${desaturate ? '<feColorMatrix type="saturate" values="0"/>' : ""}<feComponentTransfer>${functions}<feFuncA type="identity"/></feComponentTransfer></filter>`;
}
function imageAsset(filename, filter = "") {
  return `<image href="${assetRoot}${filename}.png" x="0" y="0" width="320" height="320"${filter ? ` filter="url(#${filter})"` : ""}/>`;
}
// Genuine PNG alpha clips food texture and additions to the visible surface.
function surfaceMask(body, id) {
  return `<defs><filter id="${id}-solid" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncA type="discrete" tableValues="0 0 1 1"/></feComponentTransfer></filter><mask id="${id}-surface" maskUnits="userSpaceOnUse" x="0" y="0" width="320" height="320" style="mask-type:alpha"><g filter="url(#${id}-solid)">${body}</g></mask></defs>`;
}
function additiveDecorationLayers(body, id, appearance) {
  const decorations = appearance?.decorations || [];
  const effects = appearance?.visualEffects || [];
  if (!decorations.length && !effects.length) return "";
  const designs = {
    glitter: '<path d="M10 4v12M4 10h12" stroke="#fff4bd" stroke-width="2"/><circle cx="30" cy="29" r="2.1" fill="#fcf3dd"/>',
    "gold-flake": '<path d="m7 7 9-2 4 6-8 5Z" fill="#e4b93f"/><path d="m29 28 7-2 2 5-6 3Z" fill="#f4d77a"/>',
    silver: '<circle cx="11" cy="12" r="3" fill="#e7edf2"/><circle cx="31" cy="31" r="2.2" fill="#b7c4d2"/>',
    petals: '<ellipse cx="12" cy="11" rx="5" ry="2.5" transform="rotate(-30 12 11)" fill="#db93ad"/><ellipse cx="29" cy="30" rx="4" ry="2" fill="#e6b9d0"/>',
    popping: '<circle cx="11" cy="12" r="3" fill="#e1a1a8"/><circle cx="31" cy="30" r="2.8" fill="#d7c76e"/>',
    charcoal: '<circle cx="11" cy="12" r="2.4" fill="#465050"/><circle cx="29" cy="31" r="1.7" fill="#5c6761"/>',
  };
  const layers = decorations.map((decoration, index) => `<defs><pattern id="${id}-${index}" width="44" height="46" patternUnits="userSpaceOnUse">${designs[decoration]}</pattern></defs><rect data-decoration="${decoration}" width="320" height="320" fill="url(#${id}-${index})"/>`).join("");
  const patterns = {
    crystal: '<path d="m2 24 18-20 18 20-18 22Z" fill="#d5f1fc" opacity=".28"/><path d="m2 24 18-20v42m-18-22h36" fill="none" stroke="#eefbff" opacity=".65"/>',
    rainbow: '<path d="M0 4h48" stroke="#ffa6c9" stroke-width="9"/><path d="M0 14h48" stroke="#f8e798" stroke-width="9"/><path d="M0 24h48" stroke="#a1f0cf" stroke-width="9"/><path d="M0 34h48" stroke="#a2cef8" stroke-width="9"/><path d="M0 44h48" stroke="#ccb0ef" stroke-width="9"/>',
    jelly: '<path d="M8 10q10-8 20-3" fill="none" stroke="#f2ffe7" stroke-width="5" stroke-linecap="round"/><circle cx="35" cy="32" r="4" fill="#d4f3be" opacity=".7"/>',
    frost: '<path d="M22 8v28M10 15l24 14M10 29l24-14m-19-1 7 4 7-4m-14 16 7-4 7 4" fill="none" stroke="#e9fbff" stroke-width="1.5"/>',
    glow: '<path d="m15 6 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#eddf97"/><circle cx="35" cy="36" r="2.5" fill="#eef6db"/>',
    magnet: '<g fill="#515a68"><circle cx="17" cy="20" r="4"/><circle cx="25" cy="23" r="3"/><circle cx="19" cy="28" r="3"/><circle cx="30" cy="31" r="2"/></g><path d="M6 11q-7 17 6 26M34 8q14 10 5 23" fill="none" stroke="#adb9c5" stroke-width="1.3"/>',
    amber: '<path d="M2 3h44v44H2Z" fill="#e8a549" opacity=".22"/><circle cx="16" cy="18" r="5" fill="none" stroke="#f8d5a0"/><circle cx="34" cy="35" r="2" fill="#f8ddb0"/>',
  };
  const visualLayers = effects.map((effect, index) => `<defs><pattern id="${id}-effect-${index}" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">${patterns[effect]}</pattern></defs><rect data-visual-effect="${effect}" width="320" height="320" fill="url(#${id}-effect-${index})" opacity="${effect === "rainbow" ? ".32" : ".75"}"/>`).join("");
  return `${surfaceMask(body, id)}<g mask="url(#${id}-surface)">${layers}${visualLayers}</g>`;
}
function mixHex(first, second, amount) {
  const parts = [0, 1, 2].map((index) =>
    Math.round(
      (channel(first, index) * (1 - amount) + channel(second, index) * amount) *
        255,
    )
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${parts.join("")}`;
}
function textureLayers(filename, id, appearance, palette, body = null) {
  if (!appearance) return "";
  const { grain, porosity, residues } = appearance;
  if (grain <= 1 && porosity <= 1 && !residues.length) return "";
  const mask = `${id}-surface`;
  const definitions = surfaceMask(body || imageAsset(filename), id);
  let layers = "";
  const phase =
    appearance.variationSeed == null
      ? 0
      : ((appearance.variationSeed % 97) / 97) * 24;
  if (grain > 1) {
    const size = 44 - grain * 3,
      r = 0.6 + grain * 0.3;
    layers += `<defs><pattern id="${id}-grain" width="${size}" height="${size}" patternUnits="userSpaceOnUse" patternTransform="translate(${phase} ${phase / 2})"><circle cx="7" cy="8" r="${r}" fill="${palette.color}"/><circle cx="${size * 0.7}" cy="${size * 0.7}" r="${r * 0.7}" fill="#715f48"/><ellipse cx="6" cy="7" rx="${r * 0.7}" ry="${r * 0.35}" fill="${palette.light}"/></pattern></defs><rect data-layer="grain" width="320" height="320" fill="url(#${id}-grain)" opacity="${0.18 + grain * 0.035}"/>`;
  }
  if (porosity > 1) {
    const size = 58 - porosity * 3,
      r = 1 + porosity * 0.6;
    layers += `<defs><pattern id="${id}-pores" width="${size}" height="${size}" patternUnits="userSpaceOnUse"><ellipse cx="15" cy="17" rx="${r}" ry="${r * 0.72}" fill="#776951" opacity=".48"/><path d="M${15 - r} 18q${r} ${r * 1.3} ${r * 2} 0" fill="none" stroke="${palette.light}" stroke-width="1.3" opacity=".7"/></pattern></defs><rect data-layer="porosity" width="320" height="320" fill="url(#${id}-pores)" opacity="${0.22 + porosity * 0.04}"/>`;
  }
  const positions = [
    [119, 158],
    [178, 183],
    [149, 124],
    [200, 137],
    [135, 213],
    [186, 224],
  ];
  residues.forEach((residue, foodIndex) => {
    const count = 1 + Math.floor((residue.retention - 2) / 2);
    const size = 10 + residue.retention * 2.2;
    const opacity = 0.25 + residue.retention * 0.085;
    for (let index = 0; index < count; index++) {
      const [x, y] =
        positions[
          (index * 2 + foodIndex + Math.floor(phase / 4)) % positions.length
        ];
      const mark = foodArt(residue.foodId).replace(
        "<svg ",
        `<svg x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size * 0.9}" style="width:${size}px;height:${size * 0.9}px;margin:0;filter:none;display:block;overflow:hidden" `,
      );
      layers += `<g data-food-residue="${safeText(residue.foodId)}" opacity="${opacity}">${mark}</g>`;
    }
  });
  return `${definitions}<g mask="url(#${mask})">${layers}</g>`;
}
export function stoolShape(type, color, light) {
  type = normalizeType(type);
  const filterId = `specimen-${++illustrationId}-tint`;
  const palette = bristolTypes[type - 1];
  return `<defs>${tintFilter(filterId, color || palette.color, light || palette.light)}</defs>${imageAsset(`type-${type}`, filterId)}`;
}
export function bristolSvg(type) {
  type = normalizeType(type);
  const data = bristolTypes[type - 1];
  return `<svg viewBox="0 0 320 320" role="img" aria-label="布里斯托 ${type} 型：${data.name}">${stoolShape(type, data.color, data.light)}</svg>`;
}
export function mysterySvg() {
  return '<svg viewBox="0 0 320 320" role="img" aria-label="待发现藏品"><defs><radialGradient id="mystery-volume" cx="35%" cy="24%" r="80%"><stop stop-color="#c8cbbf"/><stop offset=".65" stop-color="#a7ada0"/><stop offset="1" stop-color="#8e9789"/></radialGradient></defs><ellipse cx="160" cy="258" rx="82" ry="12" fill="#7f8b79" opacity=".14"/><path d="M88 230c-24-20-12-50 13-58-15-20 0-47 27-49-8-23 8-46 28-59 6 23 33 28 33 52 28 1 48 27 35 48 31 8 42 37 23 59-20 26-133 29-159 7Z" fill="url(#mystery-volume)"/><path d="M143 130c1-16 27-21 36-7 9 15-15 22-16 34" fill="none" stroke="#edf0e6" stroke-width="12" stroke-linecap="round"/><circle cx="162" cy="183" r="7" fill="#edf0e6"/></svg>';
}
export function characterSvg(
  character,
  locked = false,
  type = character.homeType,
  colorId = null,
  marks = [],
  appearance = null,
) {
  if (locked) return mysterySvg();
  type = normalizeType(type);
  if (Object.hasOwn(referenceStoolAssets, character.id) && type === character.homeType)
    return referenceSpriteSvg(character, type, colorId, marks, normalizeAppearance(appearance));
  const id = `specimen-${++illustrationId}`;
  const compatible =
    character.types?.includes(type) ?? type === character.homeType;
  const filename = compatible ? `${character.id}-${type}` : `type-${type}`;
  const material = compatible && materialArts.has(character.art);
  appearance = normalizeAppearance(appearance);
  let palette = stoolColors[colorId] || character;
  if (appearance && !material) {
    const amount = (appearance.colorStrength - 1) / 6;
    const neutral = stoolColors.classic;
    palette = {
      color: mixHex(neutral.color, palette.color, amount),
      light: mixHex(neutral.light, palette.light, amount),
    };
  }
  const body = material
    ? imageAsset(filename)
    : `<defs>${tintFilter(`${id}-tint`, palette.color, palette.light)}</defs>${imageAsset(filename, `${id}-tint`)}`;
  const signatures = normalizeMarks(marks);
  const stretch =
    appearance && [3, 4].includes(type)
      ? 1 + (appearance.elongation - 4) * 0.025
      : 1;
  const sculpture = `${body}${compatible ? imageAsset(`${filename}-decor`) : ""}${textureLayers(filename, id, appearance, palette)}${additiveDecorationLayers(imageAsset(filename), `${id}-decor`, appearance)}${signatures.map((mark) => `<g opacity="${appearance ? 0.25 + appearance.enokiRetention * 0.107 : 1}">${imageAsset(`${filename}-${mark}`)}</g>`).join("")}`;
  const rotation =
    appearance?.variationSeed == null
      ? 0
      : (appearance.variationSeed / 1000000 - 0.5) * 3;
  return `<svg viewBox="0 0 320 320" role="img" aria-label="${safeText(specimenName({ characterId: character.id, type }))} · 布里斯托 ${type} 型${signatures.length ? ` · ${signatures.map((mark) => outcomeMarks[mark].name).join("、")}` : ""}" data-specimen="${safeText(character.id)}:${type}" data-material="${safeText(character.material || "普通")}" data-tint="${palette.color}" data-marks="${signatures.join(" ")}"><g transform="translate(${160 * (1 - stretch)} 0) scale(${stretch} 1) rotate(${rotation} 160 160)">${sculpture}</g></svg>`;
}
