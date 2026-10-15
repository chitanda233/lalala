import { test, expect } from "@playwright/test";

const storageKey = "lalala-save-v1";

test("desktop: recipe controls, 2-second round, collection, and saved progress", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/lalala/);
  await expect(page.locator('[data-duration="4"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.screenshot({ path: "qa/desktop.png", fullPage: true });
  await page.locator('[data-recipe="garden"]').click();
  await page.locator("#water").fill("1750");
  await page.locator('[value="probiotic"]').check();
  await page.locator('[data-duration="2"]').click();
  await expect(page.locator("#water-value")).toContainText("1,750");
  await page.locator("#start-button").click();
  await expect(page.locator("#start-button")).toBeDisabled();
  await expect(page.locator("#water")).toBeDisabled();
  await expect(page.locator("#session-progress")).toBeVisible();
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("#result-name")).toHaveText("黄金传说");
  await expect(page.locator("#result-time")).toHaveText("2 秒");
  await expect(page.locator("#collection-count")).toHaveText("01");
  await page.screenshot({ path: "qa/result.png", fullPage: true });
  await page.locator("#play-again").click();
  await page.locator("#collection-button").click();
  await page.locator('[data-collection-view="characters"]').click();
  await expect(page.locator(".collection-item:not(.locked)")).toHaveCount(1);
  await expect(page.locator("#collection-summary")).toContainText("畅快 1 次");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator('[data-recipe="garden"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("#water-value")).toContainText("1,750");
  await expect(page.locator("#collection-count")).toHaveText("01");
  expect(errors).toEqual([]);
});

test("reload resumes an 8-second round and credits it once", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-duration="8"]').click();
  await page.locator("#start-button").click();
  await page.waitForTimeout(900);
  await page.reload();
  await expect(page.locator("#start-button")).toBeDisabled();
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#result-time")).toHaveText("8 秒");
  await page.reload();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).total,
      storageKey,
    ),
  ).toBe(1);
  await expect(page.locator("#start-button")).toBeEnabled();
});

test("random round uses 2–8 seconds; all eight discoveries can be reached", async ({
  page,
}) => {
  const cases = [
    ["classic", "balanced", 1500, []],
    ["garden", "garden", 1500, []],
    ["bread", "carbs", 1500, []],
    ["fire", "spicy", 1500, []],
    ["coffee", "balanced", 1500, ["coffee"]],
    ["cloud", "balanced", 2250, ["probiotic"]],
    ["pebble", "balanced", 500, []],
    ["gold", "garden", 1750, ["probiotic"]],
  ];
  await page.goto("/");
  for (const [id, recipe, water, additives] of cases) {
    await page.locator(`[data-recipe="${recipe}"]`).click();
    await page.locator("#water").fill(String(water));
    for (const value of ["probiotic", "coffee", "chili"])
      await page
        .locator(`.additive-input[value="${value}"]`)
        .setChecked(additives.includes(value));
    await page.locator('[data-duration="2"]').click();
    await page.locator("#start-button").click();
    await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 4000 });
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)).collection.at(-1),
        storageKey,
      ),
    ).toBe(id);
    await page.locator("#play-again").click();
  }
  await page.locator('[data-duration="random"]').click();
  await page.locator("#start-button").click();
  const seconds = await page.evaluate((key) => {
    const session = JSON.parse(localStorage.getItem(key)).session;
    return (session.endsAt - session.startedAt) / 1000;
  }, storageKey);
  expect(seconds).toBeGreaterThanOrEqual(2);
  expect(seconds).toBeLessThanOrEqual(8);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 10000 });
  await page.locator("#play-again").click();
  await page.locator("#collection-button").click();
  await page.locator('[data-collection-view="characters"]').click();
  await expect(page.locator(".collection-item.locked")).toHaveCount(0);
  await expect(page.locator("#collection-total")).toHaveText("8 / 8");
  await page.screenshot({ path: "qa/collection.png", fullPage: true });
});

test("mobile: no horizontal overflow, all controls accessible, round works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "qa/mobile.png", fullPage: true });
  await page.locator('[data-recipe="carbs"]').click();
  await page.locator('[data-duration="2"]').click();
  await page.locator("#start-button").click();
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("#result-name")).toHaveText("碳水小面包");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("keyboard, help, sound, and no external runtime requests", async ({
  page,
}) => {
  const external = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4173"))
      external.push(request.url());
  });
  await page.goto("/");
  await page.locator("#help-button").click();
  await expect(page.locator("#help-dialog")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.locator("#start-button")).toBeEnabled();
  await page.keyboard.press("Escape");
  await page.locator("#sound-button").click();
  await expect(page.locator("#sound-button")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator('[data-duration="2"]').click();
  await page.locator("h1").click();
  await page.keyboard.press("Space");
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 5000 });
  expect(external).toEqual([]);
});
