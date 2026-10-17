import test from "node:test";
import assert from "node:assert/strict";
import { foods } from "../src/content/foods.js";
import { foodById, characterById } from "../src/content/catalog.js";
import { stoolColors } from "../src/content/colors.js";
import {
  foodAttributeFields,
  validateFoodAttributes,
  describeFoodAttributes,
  initialFoodAttributes,
} from "../src/content/food-attributes.js";
import { collectEffects } from "../src/game/effects.js";
import { typeDistribution } from "../src/game/stool-type.js";
import {
  getDropPool,
  rollOutcome,
  specialProbability,
} from "../src/game/drops.js";
import {
  createSession,
  restoreSession,
  settleSession,
} from "../src/game/session.js";
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
const meanType = (selection) =>
  typeDistribution(selection).reduce(
    (total, entry) => total + entry.type * entry.probability,
    0,
  );
const chance = (selection, types) =>
  typeDistribution(selection)
    .filter((entry) => types.includes(entry.type))
    .reduce((total, entry) => total + entry.probability, 0);
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
function variantOdds(selection, type, characterId) {
  const pool = getDropPool(selection, type);
  const candidate = pool.find((entry) => entry.characterId === characterId);
  const ordinary = pool.find((entry) => entry.characterId === "classic");
  assert.ok(
    candidate && ordinary,
    `${characterId} must be an eligible ordinary candidate`,
  );
  return candidate.probability / ordinary.probability;
}

test("all 51 foods expose a complete, validated and editable parameter set", () => {
  assert.equal(foods.length, 51);
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

test("larger hardness values move actual form probabilities toward harder types monotonically", () => {
  const means = [];
  for (let softness = 1; softness <= 7; softness++)
    withAttributes({ rice: { softness } }, () => {
      const distribution = typeDistribution(meal);
      assert.ok(
        distribution.every(
          (entry) =>
            entry.type >= 1 && entry.type <= 7 && entry.probability >= 0,
        ),
      );
      assert.ok(
        Math.abs(
          distribution.reduce((total, entry) => total + entry.probability, 0) -
            1,
        ) < 1e-12,
      );
      means.push(meanType(meal));
    });
  for (let index = 1; index < means.length; index++)
    assert.ok(means[index] <= means[index - 1], means.join(", "));
  assert.ok(
    means[0] > means.at(-1) + 2,
    "the hardness slider must have a substantial observable effect",
  );
});

test("hardness labels, generated defaults and actual endpoints agree on 1 soft and 7 hard", () => {
  const field = foodAttributeFields.find((item) => item.key === "softness");
  assert.equal(field.low, "非常软");
  assert.equal(field.high, "非常硬");
  withAttributes({ rice: { softness: 1 } }, () =>
    assert.equal(typeDistribution(meal)[0].type, 7),
  );
  withAttributes({ rice: { softness: 7 } }, () =>
    assert.equal(typeDistribution(meal)[0].type, 1),
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

test("cohesion and elongation independently change compatible ordinary sculpture odds", () => {
  const selection = { ...meal, force: 20, additives: ["oil"] };
  const odds = (values, id) =>
    withAttributes({ rice: values }, () => variantOdds(selection, 4, id));
  assert.ok(odds({ cohesion: 7 }, "spiral") > odds({ cohesion: 1 }, "spiral"));
  assert.ok(
    odds({ elongation: 7 }, "long-rope") > odds({ elongation: 1 }, "long-rope"),
  );
  for (const cohesion of [1, 7])
    for (const elongation of [1, 7])
      withAttributes({ rice: { cohesion, elongation } }, () => {
        for (const form of typeDistribution(selection))
          for (const drop of getDropPool(selection, form.type)) {
            const item = characterById[drop.characterId];
            if (item.drop)
              assert.ok(
                item.types.includes(form.type),
                `${item.id}: ${form.type}`,
              );
          }
      });
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
    assert.match(paintedGold, /\/assets\/stools\/gold-4\.png/);
    assert.ok(!/gold-4\.png[^>]*filter=/.test(paintedGold));
    assert.ok(!/gold-4\.png[^>]*filter=/.test(unpainted));
  });
});

test("a food pigment changes its matching collectible color gradually and a null pigment adds no dye", () => {
  const selection = { ...meal, foodIds: ["broccoli"] };
  const result = (pigmentId, colorStrength) =>
    withAttributes({ broccoli: { pigmentId, colorStrength } }, () =>
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
  for (const outcome of outcomes) assert.equal(outcome.characterId, "garden");
  const tints = outcomes.map(tint);
  assert.equal(tints[0], stoolColors.classic.color);
  assert.equal(tints[2], stoolColors.garden.color);
  assert.ok(distance(tints[0], tints[2]) > distance(tints[1], tints[2]));
  assert.ok(distance(tints[1], tints[2]) > 0);
  assert.notEqual(markup(outcomes[0]), markup(outcomes[1]));
  assert.notEqual(markup(outcomes[1]), markup(outcomes[2]));

  const noPigment = [1, 7].map((strength) => result(null, strength));
  assert.equal(noPigment[0].colorId, noPigment[1].colorId);
  assert.equal(tint(noPigment[0]), tint(noPigment[1]));
  assert.equal(markup(noPigment[0]), markup(noPigment[1]));
  withAttributes({ broccoli: { pigmentId: null, colorStrength: 7 } }, () => {
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
      () => meanType(selection),
    );
  assert.ok(expected(7) > expected(1));
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

test("extreme food parameters never bypass the shared rare budget or required source conditions", () => {
  for (const food of foods)
    for (const softness of [1, 4, 7])
      withAttributes(
        {
          [food.id]: {
            softness,
            cohesion: 7,
            elongation: 7,
            grain: 7,
            retention: 7,
            colorStrength: 7,
            porosity: 7,
            lubricity: 7,
            influence: 7,
          },
        },
        () => {
          const selection = {
            ...meal,
            foodIds: [food.id],
            additives: ["gold-leaf", "crystal-seed", "gelatin"],
            toiletId: "golden",
          };
          assert.ok(
            specialProbability(selection) <= 0.005 + 1e-12,
            `${food.id}: ${softness}`,
          );
          for (const form of typeDistribution(selection)) {
            assert.ok(form.type >= 1 && form.type <= 7);
            if (!food.tags.includes("rainbow-source"))
              assert.ok(
                !getDropPool(selection, form.type).some(
                  (drop) => drop.characterId === "rainbow",
                ),
                "attributes cannot invent a rainbow source",
              );
          }
        },
      );
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
