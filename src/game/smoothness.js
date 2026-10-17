import { collectEffects } from "./effects.js";
import { resolveBristolType } from "./stool-type.js";

export function smoothness(selection, type = resolveBristolType(selection)) {
  const base = [1, 2, 4, 5, 3, 2, 1][type - 1];
  return Math.round(
    Math.max(1, Math.min(5, base + collectEffects(selection).smoothnessBonus)),
  );
}
