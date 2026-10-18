import test from "node:test";
import assert from "node:assert/strict";
import { foods } from "../src/content/foods.js";
import { drinks } from "../src/content/drinks.js";
import { additives } from "../src/content/additives.js";
import { toilets } from "../src/content/toilets.js";
import { characters } from "../src/content/stools.js";
import { characterById } from "../src/content/catalog.js";
import { normalizeSelection } from "../src/game/selection.js";
import {
  getDropPool,
  specialProbability,
  rollOutcome,
} from "../src/game/drops.js";
import {
  resolveBristolType,
  typeDistribution,
} from "../src/game/stool-type.js";
import { resolveColor } from "../src/game/color.js";
import { createSession, restoreSession } from "../src/game/session.js";
import { normalizeSave } from "../src/storage/model.js";
import { characterSvg } from "../src/ui/artwork/stools.js";
import { toiletSvg } from "../src/ui/artwork/toilets.js";
import { outcomeDraws } from "./outcome-helpers.js";
import { classifySpecimen } from "../src/game/specimen.js";

const base = {
  foodIds: ["rice"],
  drinkId: "water",
  additives: [],
  toiletId: "standard",
  water: 1500,
  force: 50,
};
const seeds = {
  classic: base,
  garden: { ...base, foodIds: ["broccoli"] },
  bread: { ...base, foodIds: ["toast"] },
  fire: { ...base, additives: ["chili"] },
  coffee: { ...base, drinkId: "coffee" },
  cloud: { ...base, water: 2250, additives: ["probiotic"] },
  pebble: { ...base, water: 500 },
  pancake: { ...base, foodIds: ["burger"] },
  // User-approved type-7 additions: valid recipes still need a probabilistic hit.
  "enoki-jet": { ...base, foodIds: ["enoki", "burger", "hotpot"], additives: ["chili"], water: 2500, force: 90, digestionTime: "2" },
  "corn-cannon": { ...base, foodIds: ["corn", "burger", "hotpot"], additives: ["chili"], water: 2500, force: 90, digestionTime: "2" },
  "golden-juice": { ...base, foodIds: ["burger"], additives: ["gold-leaf", "chili"], water: 2500, force: 90, digestionTime: "2" },
  "rainbow-falls": { ...base, foodIds: ["burger"], additives: ["rainbow-sugar", "chili"], water: 2500, force: 90, digestionTime: "2" },
  "glitter-galaxy": { ...base, foodIds: ["burger"], drinkId: "ink-tonic", additives: ["glitter", "chili"], water: 2500, force: 90, digestionTime: "2" },
  "ink-fountain": { ...base, foodIds: ["burger"], drinkId: "ink-tonic", additives: ["chili"], water: 2500, force: 90, digestionTime: "2" },
};

// A witness is a playable recipe and a possible actual type, not an injected outcome.
export function findWitness(item) {
  if (seeds[item.id])
    return {
      selection: seeds[item.id],
      type: item.homeType,
    };
  const selection = { ...base, additives: [] };
  const conditions = item.drop.conditions;
  if (conditions.additivesAll) selection.additives = [...conditions.additivesAll];
  if (conditions.foodIdsAny) selection.foodIds = [conditions.foodIdsAny[0]];
  if (conditions.toiletId) selection.toiletId = conditions.toiletId;
  if (conditions.forceZone)
    selection.force = { low: 20, medium: 50, high: 90 }[conditions.forceZone];
  if (conditions.tagsAny) {
    const tag = conditions.tagsAny[0];
    const source = [
      ...additives.map((value) => ({ kind: "additive", value })),
      ...drinks.map((value) => ({ kind: "drink", value })),
      ...foods.map((value) => ({ kind: "food", value })),
      ...toilets.map((value) => ({ kind: "toilet", value })),
    ].find(({ value }) => value.tags.includes(tag));
    if (source?.kind === "additive") selection.additives = [source.value.id];
    if (source?.kind === "drink") selection.drinkId = source.value.id;
    if (source?.kind === "food") selection.foodIds = [source.value.id];
    if (source?.kind === "toilet") selection.toiletId = source.value.id;
    if (tag === "high-force") selection.force = 90;
  }
  for (let water = 250; water <= 2500; water += 250) {
    selection.water = water;
    for (const form of typeDistribution(selection)) {
      if (
        getDropPool(selection, form.type).some(
          (entry) => entry.characterId === item.id,
        )
      )
        return { selection: structuredClone(selection), type: form.type };
    }
  }
  return null;
}

test("catalog includes 56 classified, described, illustrated and reachable collectibles", () => {
  assert.equal(characters.length, 56);
  assert.equal(new Set(characters.map((item) => item.id)).size, 56);
  assert.equal(drinks.length, 20);
  assert.equal(additives.length, 18);
  assert.equal(toilets.length, 10);
  for (const catalog of [drinks, additives, toilets]) {
    assert.equal(new Set(catalog.map((item) => item.id)).size, catalog.length);
    for (const item of catalog) {
      assert.ok(["open", "rounds"].includes(item.unlock.kind));
      if (item.unlock.kind === "rounds") assert.ok(item.unlock.count > 0);
      assert.ok(item.description && item.effectLabel);
    }
  }
  const artwork = new Set();
  for (const item of characters) {
    assert.ok(item.types.includes(item.homeType));
    assert.ok(item.description.length > 10 && item.hint.length > 5);
    assert.ok(findWitness(item), `No playable recipe reaches ${item.id}`);
    artwork.add(
      characterSvg(item)
        .replaceAll(/specimen-\d+/g, "specimen")
        .replace(/aria-label="[^"]*"/g, ""),
    );
  }
  assert.equal(artwork.size, 56);
  for (const type of [1, 2, 3, 4, 5, 6, 7])
    assert.ok(characters.some((item) => item.homeType === type));
  assert.equal(new Set(toilets.map((item) => toiletSvg(item))).size, 10);
});

test("every artwork family can produce a complete classified specimen", () => {
  for (const item of characters) {
    const { selection, type } = findWitness(item);
    const draws = outcomeDraws(
      selection,
      (entry) =>
        entry.characterId === item.id && classifySpecimen(entry) === type,
    );
    const outcome = rollOutcome(selection, () => draws.shift());
    assert.equal(outcome.characterId, item.id);
    assert.equal(outcome.type, type);
    assert.equal(outcome.special, item.rarity === "special");
    assert.ok(outcome.reasons.length >= 4);
  }
});

test("drinks change softness, color, bubbles, and material eligibility independently", () => {
  assert.ok(
    resolveBristolType({ ...base, drinkId: "coffee" }) >
      resolveBristolType(base),
  );
  assert.ok(
    resolveBristolType({ ...base, drinkId: "black-tea", water: 1250 }) <
      resolveBristolType({ ...base, water: 1250 }),
  );
  for (const [drinkId, color] of [
    ["dragon-juice", "dragon"],
    ["blueberry-juice", "berry"],
    ["beet-juice", "beet"],
    ["ink-tonic", "ink"],
    ["milk", "milk"],
  ]) {
    assert.equal(
      resolveColor({ ...base, drinkId }, characterById.classic),
      color,
    );
  }
  assert.ok(
    getDropPool({ ...base, drinkId: "soda" }, 6).some(
      (entry) => entry.characterId === "bubbly",
    ),
  );
  for (const [drinkId, characterId] of [
    ["prism-soda", "rainbow"],
    ["gel-drink", "jelly"],
    ["mineral-tonic", "crystal"],
    ["glow-soda", "luminous"],
  ]) {
    assert.ok(
      getDropPool(
        { ...base, drinkId },
        characterById[characterId].homeType,
      ).some((entry) => entry.characterId === characterId),
    );
    assert.ok(
      !getDropPool(base, characterById[characterId].homeType).some(
        (entry) => entry.characterId === characterId,
      ),
    );
  }
});

test("speckles inherit pigments while solid rare materials stay rare and require a source", () => {
  const selection = {
    ...base,
    drinkId: "blueberry-juice",
    additives: ["glitter"],
  };
  const glitter = getDropPool(selection, 4).find(
    (entry) => entry.characterId === "glitter",
  );
  assert.ok(glitter && !glitter.special && glitter.probability > 0.1);
  assert.equal(resolveColor(selection, characterById.glitter), "berry");
  assert.match(
    characterSvg(characterById.glitter, false, 4, "berry"),
    /#9b7ca6/,
  );
  const goldChance = (input) =>
    getDropPool(input, 4).find((entry) => entry.characterId === "gold")
      .probability;
  assert.ok(
    goldChance({ ...base, additives: ["gold-leaf"] }) > goldChance(base),
  );
  assert.ok(goldChance({ ...base, drinkId: "golden-tea" }) > goldChance(base));
  assert.ok(
    getDropPool({ ...base, additives: ["gold-leaf"] }, 4).find(
      (entry) => entry.characterId === "gold-flake",
    ).probability > 0.1,
  );
  for (const id of ["gold", "crystal", "rainbow", "jelly"])
    assert.equal(characterById[id].rarity, "special");
  for (const item of characters.filter(
    (item) => item.rarity === "special" && item.id !== "gold",
  ))
    for (const type of item.types)
      assert.ok(
        !getDropPool(base, type).some((entry) => entry.characterId === item.id),
        `${item.id} requires its source ingredient`,
      );
  const boosted = getDropPool(
    {
      ...base,
      drinkId: "golden-tea",
      toiletId: "golden",
      additives: ["gold-leaf", "crystal-seed", "rainbow-sugar"],
    },
    4,
  );
  assert.ok(
    Math.abs(
      boosted
        .filter((entry) => entry.special)
        .reduce((sum, entry) => sum + entry.probability, 0) - 0.005,
    ) < 1e-12,
  );
  for (const toilet of toilets)
    for (const drink of drinks) {
      const input = {
        ...base,
        toiletId: toilet.id,
        drinkId: drink.id,
        additives: ["gold-leaf", "crystal-seed", "rainbow-sugar"],
      };
      for (const type of [1, 2, 3, 4, 5, 6, 7]) {
        const pool = getDropPool(input, type);
        const total = pool
          .filter((entry) => entry.special)
          .reduce((sum, entry) => sum + entry.probability, 0);
        assert.ok(total <= 0.005 + 1e-12);
        for (const entry of pool.filter((entry) => entry.special))
          assert.ok(characterById[entry.characterId].types.includes(type));
      }
      assert.ok(specialProbability(input) <= 0.005 + 1e-12);
    }
});

test("force, toilet materials, and equipment functions create distinct eligible shapes", () => {
  assert.ok(
    getDropPool({ ...base, force: 20 }, 4).some(
      (entry) => entry.characterId === "spiral",
    ),
  );
  assert.ok(
    !getDropPool(base, 4).some((entry) => entry.characterId === "spiral"),
  );
  assert.ok(
    getDropPool({ ...base, force: 90 }, 7).some(
      (entry) => entry.characterId === "jet",
    ),
  );
  for (const [toiletId, characterId, type] of [
    ["sandalwood", "wood-grain", 3],
    ["heated", "warm-coil", 4],
    ["massage", "massage-beads", 2],
    ["stone", "stone-tower", 2],
    ["squat", "squat-spring", 4],
  ]) {
    assert.ok(
      getDropPool({ ...base, toiletId }, type).some(
        (entry) => entry.characterId === characterId,
      ),
    );
    assert.ok(
      !getDropPool(base, type).some(
        (entry) => entry.characterId === characterId,
      ),
    );
  }
});

test("loadouts and diagnoses use the current snapshot schema", () => {
  const input = {
    ...base,
    force: 20,
    drinkId: "blueberry-juice",
    additives: ["glitter", "flower-petal"],
    toiletId: "heated",
  };
  const session = createSession(input, { now: 1000, random: () => 0.5 });
  assert.deepEqual(
    restoreSession(JSON.parse(JSON.stringify(session))),
    session,
  );
  const incomplete = structuredClone(session);
  delete incomplete.outcome.morphology;
  assert.equal(restoreSession(incomplete), null);
  const save = normalizeSave({
    settings: {
      ...input,
      additives: ["glitter", "glitter", "gold-leaf", "gelatin", "stardust"],
    },
    session,
  });
  assert.equal(save.version, 5);
  assert.equal(save.toilets.owned.length, 3);
  assert.equal(save.settings.additives.length, 3);
  assert.deepEqual(save.individuals, []);
  assert.equal(normalizeSelection({ force: "unknown" }).force, 50);
});
