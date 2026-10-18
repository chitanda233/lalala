import { test, expect } from "@playwright/test";
import { focusFood, startRound, chooseMeal } from "./helpers.js";
const key = "lalala-dev";

test("food library shows locks, descriptions and category filters", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#choose-foods").click();
  await expect(page.locator(".food-card")).toHaveCount(53);
  await expect(page.locator(".food-card.unlocked")).toHaveCount(33);
  await expect(page.locator(".food-card.locked")).toHaveCount(18);
  await focusFood(page, "enoki");
  await expect(page.locator("#food-details")).toContainText("See you tomorrow");
  await expect(page.locator("#add-food")).toBeEnabled();
  await focusFood(page, "hotpot");
  await expect(page.locator("#food-details")).toContainText(
    "完成 5 次游戏后解锁",
  );
  await expect(page.locator("#add-food")).toBeDisabled();
  await page.locator('[data-food-category="fruit"]').click();
  await expect(page.locator(".food-card")).toHaveCount(7);
  await page.locator('[data-food-category="all"]').click();
  await expect(page.locator(".food-card")).toHaveCount(53);
  await focusFood(page, "burger");
  await page.screenshot({
    path: "qa/foods-desktop.png",
    animations: "disabled",
  });
});

test("three slots enforce capacity and uniqueness, support replacement and save only on confirm", async ({
  page,
}) => {
  await page.goto("/");
  await chooseMeal(page, ["burger", "enoki", "oatmeal"]);
  await expect(page.locator("#meal-count")).toHaveText("已选 3 / 3");
  await page.locator("#choose-foods").click();
  await focusFood(page, "burger");
  await expect(page.locator("#add-food")).toHaveText("已在餐盘");
  await focusFood(page, "banana");
  await expect(page.locator("#add-food")).toHaveText("餐盘已满");
  await page.locator('[data-slot-target="1"]').click();
  await focusFood(page, "banana");
  await expect(page.locator("#add-food")).toHaveText("替换第 2 格");
  await page.locator("#add-food").click();
  await page.locator("#confirm-foods").click();
  await page.reload();
  const selection = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)).settings.foodIds,
    key,
  );
  expect(selection).toEqual(["burger", "banana", "oatmeal"]);
  await page.locator("#choose-foods").click();
  await page.locator('[data-remove-food="0"]').click();
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).settings.foodIds,
      key,
    ),
  ).toEqual(selection);
  await page.locator("#choose-foods").click();
  while (await page.locator("[data-remove-food]").count())
    await page.locator("[data-remove-food]").first().click();
  await expect(page.locator("#confirm-foods")).toBeDisabled();
  await page.locator(".food-cancel").click();
  await expect(page.locator("#meal-count")).toHaveText("已选 3 / 3");
});

test("a three-food meal survives an active-session reload and appears on the result", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.goto("/");
  await chooseMeal(page, ["oatmeal", "apple", "broccoli"]);

  await startRound(page);
  await expect(page.locator("#choose-foods")).toBeDisabled();
  const before = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)).session,
    key,
  );
  await page.reload();
  await expect(page.locator("#choose-foods")).toBeDisabled();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).session,
      key,
    ),
  ).toEqual(before);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 6000 });
  for (const name of ["原味燕麦粥", "带皮苹果", "西兰花"])
    await expect(page.locator("#result-recipe")).toContainText(name);
});

test("finishing the third round unlocks new foods and keeps progress after reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 3,
          total: 2,
          settings: { foodIds: ["rice"] },
        }),
      ),
    key,
  );
  await page.reload();
  await page.locator("#choose-foods").click();
  await expect(page.locator('[data-food="snail-noodles"]')).toHaveClass(
    /locked/,
  );
  await page.keyboard.press("Escape");
  await startRound(page);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 4000 });
  await expect(page.locator("#result-new")).toContainText("解锁 2 种新食物");
  await page.locator("#play-again").click();
  await page.reload();
  await page.locator("#choose-foods").click();
  await expect(page.locator(".food-card.unlocked")).toHaveCount(35);
  await expect(page.locator('[data-food="snail-noodles"]')).toHaveClass(
    /unlocked/,
  );
});

test("mobile food picker keeps three slots and confirmation accessible without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#choose-foods").click();
  await focusFood(page, "burger");
  await expect(page.locator("#food-details")).toContainText("喷射战士");
  await page.locator("#add-food").click();
  await expect(page.locator("#food-slots .food-slot")).toHaveCount(3);
  await expect(page.locator("#confirm-foods")).toBeInViewport();
  expect(
    await page
      .locator("#food-dialog")
      .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: "qa/foods-mobile.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 320, height: 640 });
  await focusFood(page, "enoki");
  await page.locator("#add-food").click();
  await expect(page.locator("#confirm-foods")).toBeInViewport();
  expect(
    await page
      .locator("#food-dialog")
      .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
  ).toBe(true);
  await page.locator("#confirm-foods").click();
  await expect(page.locator("#meal-summary")).toContainText("华莱士汉堡");
  await expect(page.locator("#meal-summary")).toContainText("金针菇");
});
