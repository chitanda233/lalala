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
  return specimenBlueprint(outcome)?.name || stoolForms[outcome.type - 1].name;
}
