import { test, expect } from "@playwright/test";
import {
  setWater,
  startRound,
  chooseDrink,
  chooseAdditives,
  armSpecimen,
  applyIdealRecipe,
  setCompletedRounds,
} from "./helpers.js";

const storageKey = "lalala-dev";

// Choose a complete recipe-generated specimen through its real CDF interval.
const armOutcome = (page, characterId) => armSpecimen(page, characterId);

async function readSave(page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    storageKey,
  );
}

async function prepareRecipe(
  page,
  { drink = "water", additives = [], water = 750 } = {},
) {
  await chooseDrink(page, drink);
  await chooseAdditives(page, additives);
  await setWater(page, String(water));
}

const rareRecipes = [
  {
    id: "gold",
    drink: "water",
    additives: ["gold-leaf"],
    motif: "sunburst",
  },
  {
    id: "crystal",
    drink: "mineral-tonic",
    additives: ["crystal-seed"],
    motif: "facets",
  },
  {
    id: "rainbow",
    drink: "prism-soda",
    additives: ["rainbow-sugar"],
    motif: "rainbow",
  },
  {
    id: "jelly",
    drink: "water",
    additives: ["gelatin"],
    motif: "bubbles",
  },
  {
    id: "frost-crystal",
    additives: ["frost-salt"],
    water: 1000,
    motif: "snowflakes",
  },
  {
    id: "luminous",
    water: 1250,
    drink: "glow-soda",
    additives: ["stardust"],
    motif: "orbit",
  },
  { id: "meteor", additives: ["stardust"], water: 500, motif: "meteor" },
  {
    id: "amber-fossil",
    drink: "mineral-tonic",
    additives: ["amber-resin"],
    motif: "leaves",
  },
];

for (const recipe of rareRecipes)
  test(`a real ${recipe.id} draw reveals its own rare material presentation`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await prepareRecipe(page, recipe);
    const expected = await armOutcome(page, recipe.id);
    await startRound(page);
    const snapshot = (await readSave(page)).session;
    expect(snapshot.outcome).toMatchObject({
      characterId: recipe.id,
      type: expected.type,
      special: true,
    });
    await expect(page.locator("#result-dialog")).toBeVisible({
      timeout: 4000,
    });
    await expect(page.locator("#result-dialog")).toHaveAttribute(
      "data-rarity",
      "special",
    );
    await expect(page.locator("#result-dialog")).toHaveAttribute(
      "data-material",
      recipe.id,
    );
    await expect(page.locator("#result-dialog")).toHaveClass(/rare-result/);
    await expect(page.locator("#result-name")).toHaveText(expected.name);
    await expect(page.locator("#rare-reveal")).toBeVisible();
    await expect(page.locator("#rare-reveal")).toHaveAttribute(
      "data-material",
      recipe.id,
    );
    await expect(page.locator("#rare-reveal-title")).not.toBeEmpty();
    await expect(page.locator("#rare-reveal-copy")).not.toBeEmpty();
    await expect(
      page.locator(`.rare-reveal-motif.rare-motif-${recipe.motif}`),
    ).toHaveCount(1);
    await expect(page.locator("#rare-reveal")).toContainText(expected.material);
    expect(
      await page
        .locator("#result-dialog")
        .evaluate((dialog) =>
          getComputedStyle(dialog).getPropertyValue("--rare-accent").trim(),
        ),
    ).toMatch(/^#[\da-f]{6}$/i);
    await expect(page.locator(".rare-particle")).toHaveCount(12);
    await expect(page.locator("#rare-reveal-particles")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(page.locator("#play-again")).toBeEnabled();
    const save = await readSave(page);
    expect(save.total).toBe(1);
    expect(save.lastSettledSessionId).toBe(snapshot.id);
    expect(
      save.individuals.some((entry) => entry.characterId === recipe.id),
    ).toBe(true);
    if (["gold", "crystal", "rainbow", "jelly"].includes(recipe.id))
      await page.screenshot({
        path: `qa/rare-${recipe.id}.png`,
        animations: "disabled",
      });
    if (recipe.id === "gold") {
      await page.locator("#play-again").click();
      await page.locator("#collection-button").click();
      const collected = page.locator(`[data-stool="${expected.specimenId}"]`);
      await expect(collected).toHaveClass(/collected/);
      await expect(collected).toContainText(expected.name);
      await expect(page.locator(".stool-card.uncollected")).toHaveCount(55);
      const mysteries = await page
        .locator(".stool-card.uncollected")
        .evaluateAll((cards) =>
          cards.map((card) => ({
            id: card.dataset.stool,
            art: card.querySelector(".stool-art").innerHTML,
            text: card.textContent,
          })),
        );
      expect(new Set(mysteries.map((card) => card.art)).size).toBe(1);
      expect(await collected.locator(".stool-art").innerHTML()).not.toBe(
        mysteries[0].art,
      );
      const undiscovered = await page.evaluate(
        async (ids) => {
          const { characterById } = await import("/src/content/catalog.js");
          return ids.map((id) => ({
            id,
            name: characterById[id.split(":")[0]].name,
            description: characterById[id.split(":")[0]].description,
            hint: characterById[id.split(":")[0]].hint,
          }));
        },
        mysteries.map((card) => card.id),
      );
      for (const item of undiscovered) {
        const mystery = mysteries.find((card) => card.id === item.id);
        expect(mystery.text).not.toContain(item.name);
        expect(mystery.text).not.toContain(item.description);
        expect(mystery.text).not.toContain(item.hint);
      }
    }
    expect(errors).toEqual([]);
  });

test("common and uncommon collectibles keep their regular result presentation", async ({
  page,
}) => {
  await page.goto("/");
  for (const [id, rarity, additives] of [
    ["classic", "common", []],
    ["glitter", "uncommon", ["glitter"]],
  ]) {
    const { force } = await applyIdealRecipe(page, id, additives);
    const expected = await armOutcome(page, id);
    await startRound(page, force);
    await expect(page.locator("#result-dialog")).toBeVisible({
      timeout: 4000,
    });
    await expect(page.locator("#result-name")).toHaveText(expected.name);
    await expect(page.locator("#result-dialog")).toHaveAttribute(
      "data-rarity",
      rarity,
    );
    await expect(page.locator("#result-dialog")).not.toHaveClass(/rare-result/);
    await expect(page.locator("#rare-reveal")).toBeHidden();
    await expect(page.locator(".rare-particle")).toHaveCount(0);
    await expect(page.locator(".rare-reveal-motif")).toHaveCount(0);
    await page.locator("#play-again").click();
  }
  expect((await readSave(page)).total).toBe(2);
});

test("a rare active reload preserves its draw and settles only once", async ({
  page,
}) => {
  await page.goto("/");
  await prepareRecipe(page, rareRecipes[1]);

  await armOutcome(page, "crystal");
  await startRound(page);
  const snapshot = (await readSave(page)).session;
  await page.reload();
  expect((await readSave(page)).session).toEqual(snapshot);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 6000 });
  await expect(page.locator("#rare-reveal")).toHaveAttribute(
    "data-material",
    "crystal",
  );
  const settled = await readSave(page);
  expect(settled.total).toBe(1);
  expect(settled.session).toBeNull();
  expect(settled.lastSettledSessionId).toBe(snapshot.id);
  await page.keyboard.press("Escape");
  await expect(page.locator("#result-dialog")).toBeHidden();
  await expect(page.locator(".rare-particle")).toHaveCount(0);
  await page.reload();
  expect((await readSave(page)).total).toBe(1);
  expect((await readSave(page)).individuals).toEqual(settled.individuals);
  await expect(page.locator("#result-dialog")).toBeHidden();
  await expect(page.locator(".rare-particle")).toHaveCount(0);
});

test("reduced motion retains the rare palette and motif without animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await prepareRecipe(page, rareRecipes[3]);
  await armOutcome(page, "jelly");
  await startRound(page);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 4000 });
  await expect(page.locator("#result-dialog")).toHaveClass(/rare-result/);
  await expect(page.locator("#rare-reveal")).toBeVisible();
  await expect(page.locator(".rare-reveal-motif")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator("#result-dialog")
        .evaluate(
          (dialog) =>
            dialog
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === "running").length,
        ),
    )
    .toBe(0);
  await page.screenshot({
    path: "qa/rare-reduced-motion.png",
    animations: "disabled",
  });
  await page.locator("#play-again").click();
  await expect(page.locator("#rare-reveal")).toBeHidden();
  await expect(page.locator(".rare-particle")).toHaveCount(0);
});

for (const [width, height] of [
  [390, 844],
  [320, 640],
])
  test(`a ${width}px rare result can close and replay without leftover effects`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await prepareRecipe(page, rareRecipes[2]);
    await armOutcome(page, "rainbow");
    await startRound(page);
    await expect(page.locator("#result-dialog")).toBeVisible({
      timeout: 4000,
    });
    await expect(page.locator("#rare-reveal")).toBeVisible();
    expect(
      await page
        .locator("#result-dialog")
        .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `qa/rare-mobile-${width}.png`,
      animations: "disabled",
    });
    await page.locator("#play-again").scrollIntoViewIfNeeded();
    await expect(page.locator("#play-again")).toBeInViewport();
    await page.locator("#play-again").click();
    await expect(page.locator("#result-dialog")).toBeHidden();
    await expect(page.locator("#rare-reveal")).toBeHidden();
    await expect(page.locator(".rare-particle")).toHaveCount(0);
    await expect(page.locator(".rare-reveal-motif")).toHaveCount(0);
    await expect(page.locator("#result-dialog")).not.toHaveClass(/rare-result/);
    await applyIdealRecipe(page, "classic");
    await armOutcome(page, "classic");
    await startRound(page);
    await expect(page.locator("#rare-reveal")).toBeHidden();
    await expect(page.locator(".rare-particle")).toHaveCount(0);
    await expect(page.locator("#result-dialog")).toBeVisible({
      timeout: 4000,
    });
    await expect(page.locator("#result-dialog")).toHaveAttribute(
      "data-rarity",
      "common",
    );
    await expect(page.locator(".rare-particle")).toHaveCount(0);
    expect((await readSave(page)).total).toBe(2);
    await page.keyboard.press("Escape");
    await expect(page.locator("#result-dialog")).toBeHidden();
  });
