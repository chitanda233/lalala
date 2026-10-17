export function toiletDrawing(toilet) {
  const [light, color, dark] = toilet.palette.ceramic;
  const bowl = `<ellipse class="toilet-water" cx="278" cy="318" rx="68" ry="25" fill="#c4ded9" stroke="${dark}" stroke-width="3"/>`;
  const stroke = `stroke="${dark}" stroke-width="4" stroke-linejoin="round"`;
  if (toilet.shape === "squat")
    return `<g ${stroke}><path d="m151 389 26-113h207l30 113-33 55H181Z" fill="${light}"/><ellipse cx="280" cy="350" rx="49" ry="70" fill="${dark}"/>${bowl}<path d="m184 318-9 67m13-63-8 59m185-63 9 67m-22-63 8 59" stroke-width="5" stroke-linecap="round"/></g>`;
  if (toilet.shape === "stones")
    return `<g ${stroke}><path d="m157 423 18-63 66-4 13 64-28 29h-51Zm157-64 65-8 28 65-21 29-65-9Z" fill="${color}"/><path d="m172 347 18-33 186-1 19 37-23 32H194Z" fill="${light}"/><ellipse cx="282" cy="345" rx="46" ry="18" fill="${dark}"/><path d="m188 371 26 17-7 32m147-52 20 25-11 28" fill="none"/></g>`;
  const tank =
    toilet.shape === "wood"
      ? `<path d="M251 135h145v131H251Z" fill="${color}"/>`
      : `<path d="M260 120q70-19 137-6l9 152-146 17Z" fill="${light}"/><path d="M255 117q72-19 146-6l10 22H253Z" fill="${color}"/>`;
  const detail =
    {
      royal: `<path d="m274 98-9-31 28 13 26-30 24 29 29-15-7 34Z" fill="#d7b45b"/><path d="m208 357 7 12 14-1-7 12 6 12-14-2-10 10 1-14-11-9 14-3Z" fill="#edcf7b" stroke="none"/>`,
      wood: '<path d="M265 153q55 31 115 0m-113 20q60 27 113 0m-114 21q53 24 112 0m-164 158q58 33 128 0m-115 23q41 28 92 3" fill="none" stroke-width="2.5"/>',
      heated:
        '<path d="M252 218q-12-13 0-27m31 24q-12-13 0-27m31 24q-12-13 0-27" fill="none" stroke="#cf9c7e" stroke-linecap="round"/><path d="M175 287q91-60 214-3" fill="none" stroke="#d6aa83" stroke-width="10"/>',
      massage:
        '<g fill="#9ab2c2"><circle cx="225" cy="285" r="9"/><circle cx="260" cy="268" r="9"/><circle cx="296" cy="268" r="9"/><circle cx="332" cy="278" r="9"/><circle cx="355" cy="296" r="9"/></g>',
      vortex:
        '<path d="M241 314c-5-28 82-30 79-3-3 21-59 20-58 3 0-9 24-14 34-5" stroke="#75aaa8" stroke-width="4" fill="none"/>',
      crystal:
        '<path d="m260 133 55 70-46 61m50-138-4 77 81 43m-210 93 75 61-13 68m93-124-80 56 51 71" fill="none" stroke="#eefcff" stroke-width="3"/><path d="m418 179 4 14 15 4-15 4-4 15-4-15-15-4 15-4Z" fill="#d7edf5" stroke="none"/>',
    }[toilet.shape] || "";
  return `<g ${stroke}>${tank}<path d="M185 306c-4 60 24 97 63 108l-14 50q50 26 102 0l-10-65c43-18 62-52 62-93Z" fill="${color}"/><ellipse cx="278" cy="292" rx="125" ry="66" fill="${light}"/><ellipse cx="278" cy="294" rx="99" ry="45" fill="${dark}"/>${bowl}<path d="M171 289q100-68 217 0" fill="none" stroke="${light}" stroke-width="13" stroke-linecap="round"/>${detail}</g>`;
}
export function toiletSvg(toilet) {
  return `<svg viewBox="130 40 310 460" role="img" aria-label="${toilet.name}">${toiletDrawing(toilet)}</svg>`;
}
