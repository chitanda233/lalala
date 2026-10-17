import test from "node:test";
import assert from "node:assert/strict";
import { foodById } from "../src/content/catalog.js";
import { diagnoseOutcome } from "../src/game/explanation.js";

test("diagnosis follows the actual form and does not infer a solid shape from its collectible", () => {
  const solid = diagnoseOutcome({
    type: 4,
    characterId: "classic",
    morphology: { form: "smooth-log" },
  });
  const liquid = diagnoseOutcome({
    type: 7,
    characterId: "classic",
    morphology: { form: "watery" },
  });
  assert.match(solid.summary, /软硬适中.*连续成形/);
  assert.match(liquid.summary, /水样.*缺少.*固体/);
  assert.notEqual(solid.summary, liquid.summary);
  assert.throws(
    () => diagnoseOutcome({ type: 7, characterId: "classic" }),
    RangeError,
  );
});

test("diagnosis reads saved appearance rather than recipe explanations or current food settings", () => {
  const outcome = {
    type: 4,
    characterId: "gold",
    morphology: { form: "smooth-log" },
    marks: ["enoki"],
    appearance: {
      grain: 6,
      porosity: 5,
      cohesion: 5,
      elongation: 6,
      colorStrength: 7,
      residues: [{ foodId: "corn", retention: 6 }],
      enokiRetention: 7,
    },
    reasons: ["华莱士汉堡、蓝莓浓浆、恒温暖座：水量 1500 mL。"],
  };
  const before = structuredClone(outcome);
  const diagnosis = diagnoseOutcome(outcome);
  const text = diagnosis.details.join("");
  assert.match(diagnosis.summary, /软硬适中.*连续成形/);
  assert.match(text, /黄金质感.*按 4 型判断/);
  assert.match(text, /粗颗粒.*气孔/);
  assert.match(text, /可见金针菇细丝状印记/);
  assert.match(text, /食材残留印记较明显/);
  assert.doesNotMatch(text, /华莱士汉堡|蓝莓浓浆|恒温暖座|mL|影响强度|抽中/);
  const retention = foodById.enoki.attributes.retention;
  try {
    foodById.enoki.attributes.retention = 1;
    assert.deepEqual(diagnoseOutcome(outcome), diagnosis);
  } finally {
    foodById.enoki.attributes.retention = retention;
  }
  assert.deepEqual(outcome, before);
});
