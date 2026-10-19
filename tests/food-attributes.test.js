import test from "node:test";
import assert from "node:assert/strict";
import { foods } from "../src/content/foods.js";
import { foodById, characterById } from "../src/content/catalog.js";
import { stoolColors } from "../src/content/colors.js";
import { foodAttributeFields, validateFoodAttributes, describeFoodAttributes, initialFoodAttributes } from "../src/content/food-attributes.js";
import { collectEffects } from "../src/game/effects.js";
import { typeDistribution } from "../src/game/stool-type.js";
import { recipeProperties, getRecipeForecast } from "../src/game/outcome-pool.js";
import { getDropPool, rollOutcome, specialProbability } from "../src/game/drops.js";
import { createSession, restoreSession, settleSession } from "../src/game/session.js";
import { normalizeSave } from "../src/storage/model.js";
import { characterSvg, mysterySvg } from "../src/ui/artwork/stools.js";

const numericKeys = [
  "softness",
  "cohesion",
  "elongation",
  "grain",
  "retention",
  "colorStrength",
  "porosity",
  "lubricity",
  "influence",
];
const baseline = {
  softness: 4,
  cohesion: 4,
  elongation: 4,
  grain: 1,
  retention: 1,
  colorStrength: 1,
  porosity: 1,
  lubricity: 4,
  influence: 4,
  pigmentId: null,
};
const meal = {
  foodIds: ["rice"],
  drinkId: "water",
  water: 1500,
  additives: [],
  toiletId: "standard",
  force: 50,
};
function withAttributes(overrides, run) {
  const previous = new Map();
  for (const [id, values] of Object.entries(overrides)) {
    previous.set(id, foodById[id].attributes);
    foodById[id].attributes = validateFoodAttributes({
      ...baseline,
      ...values,
    });
  }
  try {
    return run();
  } finally {
    for (const [id, values] of previous) foodById[id].attributes = values;
  }
}
function markup(outcome) {
  return characterSvg(
    characterById[outcome.characterId],
    false,
    outcome.type,
    outcome.colorId,
    outcome.marks,
    outcome.appearance,
  )
    .replaceAll(/specimen-\d+/g, "specimen-ID")
    .replaceAll(/\s(?:data-[\w-]+|aria-[\w-]+)="[^"]*"/g, "")
    .replaceAll(/<(title|desc)>[\s\S]*?<\/\1>/g, "");
}

test("all 53 foods expose a complete, validated and editable parameter set", () => {
  assert.equal(foods.length, 53);
  assert.equal(foodAttributeFields.length, numericKeys.length);
  assert.deepEqual(
    foodAttributeFields.map((field) => field.key).sort(),
    [...numericKeys].sort(),
  );
  assert.equal(foodAttributeFields.filter((field) => field.advanced).length, 2);
  assert.deepEqual(
    foodAttributeFields
      .filter((field) => field.group === "overall")
      .map((field) => field.key),
    ["influence"],
  );
  for (const food of foods) {
    assert.deepEqual(
      validateFoodAttributes(food.attributes),
      food.attributes,
      food.id,
    );
    assert.deepEqual(
      Object.keys(food.attributes).sort(),
      [...numericKeys, "pigmentId"].sort(),
    );
    for (const key of numericKeys) {
      assert.ok(Number.isInteger(food.attributes[key]), `${food.id}.${key}`);
      assert.ok(food.attributes[key] >= 1 && food.attributes[key] <= 7);
    }
    assert.ok(
      food.attributes.pigmentId === null ||
        Object.hasOwn(stoolColors, food.attributes.pigmentId),
    );
    const description = describeFoodAttributes(food);
    assert.ok(
      description && !JSON.stringify(description).includes("undefined"),
      food.id,
    );
  }
});

test("attribute validation rejects incomplete, nonnumeric, out-of-range and unsafe pigment values", () => {
  assert.deepEqual(validateFoodAttributes(baseline), baseline);
  for (const key of numericKeys) {
    for (const value of [
      0,
      8,
      1.5,
      NaN,
      Infinity,
      -Infinity,
      "4",
      null,
      undefined,
    ])
      assert.throws(
        () => validateFoodAttributes({ ...baseline, [key]: value }),
        `${key}: ${String(value)}`,
      );
    const missing = { ...baseline };
    delete missing[key];
    assert.throws(() => validateFoodAttributes(missing), `${key} is required`);
  }
  for (const value of [null, [], "food", 7])
    assert.throws(() => validateFoodAttributes(value));
  for (const pigmentId of ["unknown", "__proto__", "constructor", {}, 4])
    assert.throws(() => validateFoodAttributes({ ...baseline, pigmentId }));
});

test("larger food hardness values increase the profile and recheck the fixed recipe physical type", () => {
  let previous = 0;
  for (let softness = 1; softness <= 7; softness++)
    withAttributes({ rice: { softness } }, () => {
      const hardness = recipeProperties(meal).hardness;
      assert.ok(hardness > previous);
      previous = hardness;
      const forecast = getRecipeForecast(meal);
      if (forecast.physicalState.type === 4) {
        assert.equal(forecast.matchedRecipe.characterId, "classic");
        assert.ok(Math.abs(forecast.recipeProbability - 0.784) < 1e-12);
      } else {
        assert.equal(forecast.matchedRecipe, null);
        assert.ok(forecast.primaryProbability > 0);
        assert.equal(characterById[forecast.primaryCharacterId].homeType, forecast.physicalState.type);
      }
    });
});

test("hardness labels, generated defaults and the recipe profile agree on 1 soft and 7 hard", () => {
  const field = foodAttributeFields.find((item) => item.key === "softness");
  assert.equal(field.low, "非常软");
  assert.equal(field.high, "非常硬");
  withAttributes({ rice: { softness: 1 } }, () =>
    assert.ok(recipeProperties(meal).hardness < 4),
  );
  withAttributes({ rice: { softness: 7 } }, () =>
    assert.ok(recipeProperties(meal).hardness > 4),
  );
  const plain = {
    traits: { fiber: 0, fat: 0, spice: 0, moisture: 0, fermented: 0 },
    tags: [],
    effects: {},
  };
  assert.equal(initialFoodAttributes(plain).softness, 4);
  assert.ok(
    initialFoodAttributes({
      ...plain,
      traits: { ...plain.traits, fat: 3, spice: 3 },
    }).softness < 4,
  );
  assert.ok(
    initialFoodAttributes({ ...plain, effects: { typeShift: -2 } }).softness >
      4,
  );
});

test("cohesion and elongation adjust separate attributes without overriding a fixed shape", () => {
  const profiles = {};
  for (const key of ["cohesion", "elongation"])
    for (const level of [1, 7])
      withAttributes({ rice: { [key]: level } }, () => {
        profiles[key + level] = recipeProperties(meal);
        assert.equal(getRecipeForecast(meal).matchedRecipe.characterId, "classic");
      });
  assert.ok(profiles.cohesion7.cohesion > profiles.cohesion1.cohesion);
  assert.equal(profiles.cohesion7.elongation, profiles.cohesion1.elongation);
  assert.ok(profiles.elongation7.elongation > profiles.elongation1.elongation);
  assert.equal(profiles.elongation7.cohesion, profiles.elongation1.cohesion);
});

test("grain and porosity change rendered texture independently and remain in the result snapshot", () => {
  const renderWith = (values) =>
    withAttributes({ rice: values }, () => rollOutcome(meal, () => 0.5));
  const plain = renderWith({ grain: 1, porosity: 1 });
  const speckled = renderWith({ grain: 2, porosity: 1 });
  const grainy = renderWith({ grain: 7, porosity: 1 });
  const porous = renderWith({ grain: 1, porosity: 2 });
  const bubbly = renderWith({ grain: 1, porosity: 7 });
  assert.ok(grainy.appearance.grain > plain.appearance.grain);
  assert.equal(grainy.appearance.porosity, plain.appearance.porosity);
  assert.ok(bubbly.appearance.porosity > plain.appearance.porosity);
  assert.equal(bubbly.appearance.grain, plain.appearance.grain);
  assert.notEqual(markup(grainy), markup(plain));
  assert.notEqual(markup(grainy), markup(speckled));
  assert.notEqual(markup(bubbly), markup(plain));
  assert.notEqual(markup(bubbly), markup(porous));
  assert.notEqual(markup(grainy), markup(bubbly));
});

test("food residues are deterministic visible signatures that retain the selected food identity", () => {
  const result = (retention) =>
    withAttributes({ rice: { retention } }, () => rollOutcome(meal, () => 0.5));
  const faint = result(1);
  const trace = result(2);
  const visible = result(7);
  const residue = visible.appearance.residues.find(
    (entry) => entry.foodId === "rice",
  );
  assert.ok(residue && residue.retention > 1);
  const weak = faint.appearance.residues.find(
    (entry) => entry.foodId === "rice",
  );
  assert.ok(!weak || weak.retention < residue.retention);
  assert.notEqual(markup(visible), markup(faint));
  assert.ok(
    trace.appearance.residues.find((entry) => entry.foodId === "rice")
      .retention < residue.retention,
  );
  assert.notEqual(markup(visible), markup(trace));
  const draws = [0.5, 0.5];
  withAttributes({ rice: { retention: 7 } }, () => {
    const outcome = rollOutcome(meal, () => draws.shift());
    assert.equal(
      draws.length,
      0,
      "appearance must not consume another game random draw",
    );
    assert.deepEqual(outcome.appearance.residues, visible.appearance.residues);
  });
});

test("color strength visibly changes a chosen pigment while rare materials retain their own palette", () => {
  const painted = (colorStrength) =>
    withAttributes({ rice: { colorStrength, pigmentId: "berry" } }, () =>
      rollOutcome(meal, () => 0.5),
    );
  const faint = painted(2);
  const saturated = painted(7);
  assert.ok(
    saturated.appearance.colorStrength > faint.appearance.colorStrength,
  );
  assert.notEqual(markup(faint), markup(saturated));
  withAttributes({ rice: { colorStrength: 7, pigmentId: "berry" } }, () => {
    const gold = characterById.gold;
    const unpainted = characterSvg(gold, false, 4);
    const paintedGold = characterSvg(
      gold,
      false,
      4,
      null,
      [],
      saturated.appearance,
    );
    assert.match(paintedGold, /\/assets\/stools\/reference-v2\/gold\.png/);
    assert.ok(!/gold\.png[^>]*filter=/.test(paintedGold));
    assert.ok(!/gold\.png[^>]*filter=/.test(unpainted));
  });
});

test("a food pigment changes its matching collectible color gradually and a null pigment adds no dye", () => {
  const selection = { ...meal, foodIds: ["rice", "spinach"] };
  const result = (pigmentId, colorStrength) =>
    withAttributes({ spinach: { pigmentId, colorStrength } }, () =>
      rollOutcome(selection, () => 0.5),
    );
  const tint = (outcome) => {
    const svg = characterSvg(
      characterById[outcome.characterId],
      false,
      outcome.type,
      outcome.colorId,
      outcome.marks,
      outcome.appearance,
    );
    return svg.match(/data-tint="(#[a-f\d]{6})"/i)?.[1];
  };
  const channels = (hex) =>
    [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const distance = (hex, target) =>
    channels(hex).reduce(
      (total, channel, index) =>
        total + (channel - channels(target)[index]) ** 2,
      0,
    );
  const outcomes = [1, 2, 7].map((strength) => result("garden", strength));
  assert.notEqual(outcomes[0].characterId, "garden");
  assert.equal(outcomes[0].colorId, "classic");
  for (const outcome of outcomes.slice(1)) assert.equal(outcome.colorId, "garden");
  const tints = outcomes.map(tint);
  assert.equal(tints[0], stoolColors.classic.color);
  assert.ok(distance(tints[2], stoolColors.garden.color) < distance(tints[1], stoolColors.garden.color));
  assert.ok(distance(tints[0], tints[2]) > distance(tints[1], tints[2]));
  assert.ok(distance(tints[1], tints[2]) > 0);
  assert.notEqual(markup(outcomes[0]), markup(outcomes[1]));
  assert.notEqual(markup(outcomes[1]), markup(outcomes[2]));

  const noPigment = [1, 7].map((strength) => result(null, strength));
  assert.equal(noPigment[0].colorId, noPigment[1].colorId);
  assert.equal(tint(noPigment[0]), tint(noPigment[1]));
  assert.equal(markup(noPigment[0]), markup(noPigment[1]));
  withAttributes({ spinach: { pigmentId: null, colorStrength: 7 } }, () => {
    assert.equal(collectEffects(selection).food.hasPigment, false);
  });
});

test("lubricity improves actual smoothness and score without needing a different stool type", () => {
  const result = (lubricity) =>
    withAttributes({ rice: { softness: 2, lubricity } }, () =>
      rollOutcome(meal, () => 0.5),
    );
  const rough = result(1);
  const smooth = result(7);
  assert.equal(smooth.type, rough.type);
  assert.ok(smooth.smoothness > rough.smoothness);
  assert.ok(smooth.score > rough.score);
});

test("influence lets one food lead a mixed meal without making slot order matter", () => {
  const selection = { ...meal, foodIds: ["rice", "egg"] };
  const expected = (influence) =>
    withAttributes(
      { rice: { softness: 1, influence }, egg: { softness: 7, influence: 4 } },
      () => recipeProperties(selection).hardness,
    );
  assert.ok(expected(7) < expected(1));
  withAttributes(
    { rice: { softness: 1, influence: 7 }, egg: { softness: 7, influence: 2 } },
    () => {
      const reverse = {
        ...selection,
        foodIds: [...selection.foodIds].reverse(),
      };
      assert.deepEqual(collectEffects(selection), collectEffects(reverse));
      assert.deepEqual(typeDistribution(selection), typeDistribution(reverse));
      assert.deepEqual(
        rollOutcome(selection, () => 0.5),
        rollOutcome(reverse, () => 0.5),
      );
      assert.deepEqual(
        typeDistribution(selection),
        typeDistribution({ ...selection, foodIds: ["egg", "rice", "rice"] }),
      );
    },
  );
});

test("a staple leads an equally influential side food in the mixed shape profile", () => {
  withAttributes({ rice: { grain: 1, influence: 4 }, egg: { grain: 7, influence: 4 } }, () => {
    const properties = recipeProperties({ ...meal, foodIds: ["rice", "egg"] });
    assert.ok(properties.grain < 4, "the main staple must carry more weight than the side food");
    assert.ok(properties.grain > 1, "the side food must still contribute");
  });
});

test("extreme food parameters cannot change the independent rare roll or require source ingredients", () => {
  for (const id of ["rice", "burger", "guanyin-clay"])
    for (const softness of [1, 7])
      withAttributes({ [id]: { softness, cohesion: 7, elongation: 7, grain: 7, retention: 7, colorStrength: 7, porosity: 7, lubricity: 7, influence: 7 } }, () => {
        const selection = { ...meal, foodIds: [id] };
        assert.ok(Math.abs(specialProbability(selection) - 0.02) < 1e-12);
        assert.ok(Math.abs(specialProbability({ ...selection, additives: ["crystal-seed"] }) - 0.20) < 1e-12);
        assert.ok(getDropPool(selection, 4).some((entry) => entry.characterId === "rainbow"));
      });
});

test("appearance snapshots survive reload and later tuning without rerolling an active reward", () => {
  let session;
  withAttributes(
    {
      rice: {
        grain: 7,
        porosity: 6,
        retention: 7,
        colorStrength: 7,
        pigmentId: "berry",
      },
    },
    () => {
      session = createSession(meal, { now: 1000, random: () => 0.5 });
      assert.ok(session.outcome.appearance.residues.length > 0);
    },
  );
  const frozen = structuredClone(session);
  const save = normalizeSave({ session });
  settleSession(save, session.endsAt);
  assert.deepEqual(save.individuals[0].appearance, frozen.outcome.appearance);
  assert.equal(save.individuals[0].colorId, frozen.outcome.colorId);
  const frozenSpecimens = structuredClone(save.individuals);
  withAttributes(
    {
      rice: {
        softness: 7,
        grain: 1,
        porosity: 1,
        retention: 1,
        colorStrength: 1,
      },
    },
    () => {
      assert.deepEqual(
        restoreSession(JSON.parse(JSON.stringify(session))),
        frozen,
      );
      assert.notDeepEqual(
        rollOutcome(meal, () => 0.5).appearance,
        frozen.outcome.appearance,
      );
      assert.deepEqual(normalizeSave(save).individuals, frozenSpecimens);
    },
  );
  const incomplete = structuredClone(session);
  delete incomplete.outcome.appearance;
  assert.equal(restoreSession(incomplete), null);
  assert.equal(
    characterSvg(
      characterById.classic,
      true,
      4,
      "berry",
      ["enoki"],
      frozen.outcome.appearance,
    ),
    mysterySvg(),
  );
});
