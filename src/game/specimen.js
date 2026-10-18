import { specimenMaterial } from "../content/materials.js";
import { specimenBlueprintById } from "../content/specimen-blueprints.js";
import { stoolFormById, stoolForms } from "../content/stool-forms.js";

export function classifySpecimen(specimen) {
  const form = stoolFormById[specimen.morphology?.form];
  if (!form) throw new RangeError("标本必须有可识别的实际形态。");
  return form.type;
}

export function specimenBlueprint(outcome) {
  return specimenBlueprintById[`${outcome.characterId}:${outcome.type}`];
}

export function specimenName(outcome) {
  const material = specimenMaterial(outcome);
  if (material) {
    const shapes = ["颗粒", "结块条", "裂纹条", "长条", "软块", "糊", "液"];
    return `${material.material}${shapes[classifySpecimen(outcome) - 1]}`;
  }
  return specimenBlueprint(outcome)?.name || stoolForms[outcome.type - 1].name;
}
