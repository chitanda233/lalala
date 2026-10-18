import { test, expect } from "@playwright/test";
import {
  chooseSpecimen,
  setWater,
  startRound,
  stopForce,
  chooseMeal,
  chooseDrink,
  chooseAdditives,
  armSpecimen,
} from "./helpers.js";

const storageKey = "lalala-dev";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
});

test("desktop: recipe controls, quick result, collection, and saved progress", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/lalala/);
  await expect(page.locator("#time-options")).toHaveCount(0);
  await page.screenshot({ path: "qa/desktop.png", fullPage: true });
  await chooseMeal(page, ["broccoli"]);
  await setWater(page, "1750");
  await chooseAdditives(page, ["probiotic"]);

  await expect(page.locator("#water-value")).toContainText("1,750");
  await startRound(page);
  await expect(page.locator("#start-button")).toBeDisabled();
  await expect(page.locator("#water")).toBeDisabled();
  await expect(page.locator("#force-meter")).toHaveClass(/locked/);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("#result-name")).toHaveText("森林小精灵");
  await expect(page.locator("#result-time")).toContainText("秒");
  await expect(page.locator("#collection-count")).toHaveText("01");
  await page.screenshot({ path: "qa/result.png", fullPage: true });
  await page.locator("#play-again").click();
  await page.locator("#collection-button").click();
  await chooseSpecimen(page, "garden:4");
  await expect(page.locator("#collection-detail")).toContainText("森林小精灵");
  await expect(page.locator("#collection-summary")).toContainText("畅快 1 次");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator("#meal-summary")).toContainText("西兰花");
  await expect(page.locator("#water-value")).toContainText("1,750");
  await expect(page.locator("#collection-count")).toHaveText("01");
  expect(errors).toEqual([]);
});

test("reload resumes a locked quick reveal and credits it once", async ({
  page,
}) => {
  await page.goto("/");

  await startRound(page);

  await page.reload();
  await expect(page.locator("#start-button")).toBeDisabled();
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#result-time")).toContainText("秒");
  await page.reload();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).total,
      storageKey,
    ),
  ).toBe(1);
  await expect(page.locator("#start-button")).toBeEnabled();
});

test("quick rounds retain all eight discoveries and the fixed reveal delay", async ({
  page,
}) => {
  test.setTimeout(60000);
  const cases = [
    ["classic", "rice", 1500, []],
    ["garden", "broccoli", 1500, []],
    ["bread", "toast", 1500, []],
    ["fire", "burger", 1500, ["chili"]],
    ["coffee", "rice", 1500, ["coffee"]],
    ["cloud", "rice", 2250, ["probiotic"]],
    ["pebble", "rice", 500, []],
    ["gold", "broccoli", 1750, ["probiotic"]],
  ];
  await page.goto("/");
  for (const [id, recipe, water, additives] of cases) {
    await chooseMeal(page, [recipe]);
    await setWater(page, String(water));
    await chooseDrink(page, additives.includes("coffee") ? "coffee" : "water");
    await chooseAdditives(
      page,
      additives.filter((id) => id !== "coffee"),
    );

    await armSpecimen(page, id);
    await startRound(page);
    await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 4000 });
    expect(
      await page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)).individuals.at(-1).characterId,
        storageKey,
      ),
    ).toBe(id);
    await page.locator("#play-again").click();
  }

  await startRound(page);
  const seconds = await page.evaluate((key) => {
    const session = JSON.parse(localStorage.getItem(key)).session;
    return session.endsAt - session.lockedAt;
  }, storageKey);
  expect(seconds).toBe(400);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 10000 });
  await page.locator("#play-again").click();
  await page.locator("#collection-button").click();
  await expect(page.locator("#collection-summary")).toContainText(
    "8 / 56 种便便",
  );
  await expect(page.locator(".stool-card.collected")).toHaveCount(8);
  await expect(page.locator("#collection-total")).toHaveText("5 / 7 型");
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
  await chooseMeal(page, ["toast"]);

  await startRound(page);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("#result-name")).toHaveText("顺畅小能手");
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

  await page.locator("h1").click();
  await page.keyboard.press("Space");
  await stopForce(page);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 5000 });
  expect(external).toEqual([]);
});
