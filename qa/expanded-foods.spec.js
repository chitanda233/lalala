import { test, expect } from "@playwright/test";
import { focusFood, startRound, chooseMeal } from "./helpers.js";
const key = "lalala-dev";

test("find banana, clay and twenty new foods through categories and pages", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#choose-foods").click();
  await expect(page.locator(".food-card")).toHaveCount(53);
  await expect(page.locator(".food-card.unlocked")).toHaveCount(33);
  await focusFood(page, "banana");
  await expect(page.locator(".food-card")).toHaveCount(7);
  await expect(page.locator('[data-food="banana"]')).toHaveClass(/unlocked/);
  await focusFood(page, "guanyin-clay");
  await expect(page.locator("#food-details")).toContainText("幻想配料");
  await expect(page.locator("#food-details")).toContainText("软硬程度 6/7");
  await expect(page.locator("#add-food")).toBeEnabled();
  await page.locator('[data-food-category="fantasy"]').click();
  await expect(page.locator(".food-card")).toHaveCount(4);
  await page.locator('[data-food-category="all"]').click();
  await expect(page.locator('[data-food-category="all"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".food-card")).toHaveCount(53);
  await expect(page.locator('input[type="search"]')).toHaveCount(0);
  await page.screenshot({
    path: "qa/food-categories.png",
    animations: "disabled",
  });
});

test("new three-food meal survives save, running reload and result", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.goto("/");
  await chooseMeal(page, ["guanyin-clay", "banana", "rose-cake"]);
  await expect(page.locator("#meal-summary")).toContainText("观音土");

  await startRound(page);
  const before = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)).session,
    key,
  );
  expect(before.foodIds).toEqual(["guanyin-clay", "banana", "rose-cake"]);
  expect(before.outcome.colorId).toBe("clay");
  await page.reload();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).session,
      key,
    ),
  ).toEqual(before);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 6000 });
  await expect(page.locator("#result-recipe")).toContainText("观音土");
  await expect(page.locator("#result-rarity")).toContainText("陶土浅灰");
  await page.locator("#play-again").click();
  await page.reload();
  const settled = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    key,
  );
  expect(settled.total).toBe(1);
  expect(settled.individuals).toContainEqual(
    expect.objectContaining({
      type: before.outcome.type,
      characterId: before.outcome.characterId,
      appearance: before.outcome.appearance,
    }),
  );
  expect(before.outcome.appearance.residues).toContainEqual({
    foodId: "rose-cake",
    retention: 4,
  });
});

for (const [width, height] of [
  [390, 844],
  [320, 640],
])
  test(`categories and new food details stay usable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.locator("#choose-foods").click();
    await focusFood(page, "guanyin-clay");
    await expect(page.locator("#food-details")).toContainText("幻想配料");
    await page.locator("#add-food").click();
    await expect(page.locator("#confirm-foods")).toBeInViewport();
    expect(
      await page
        .locator("#food-dialog")
        .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: `qa/new-food-mobile-${width}.png`,
      animations: "disabled",
    });
    await page.locator("#confirm-foods").click();
    await expect(page.locator("#meal-summary")).toContainText("观音土");
  });
