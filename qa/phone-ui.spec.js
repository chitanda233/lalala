import { test, expect } from "@playwright/test";
import {
  chooseMeal,
  chooseDrink,
  chooseAdditives,
  startRound,
  chooseSpecimen,
  armSpecimen,
} from "./helpers.js";

async function noScroll(page, selector = "html") {
  const target =
    typeof selector === "string" ? page.locator(selector) : selector;
  const result = await target.evaluate((el) => ({
    height: el.clientHeight,
    scrollHeight: el.scrollHeight,
    width: el.clientWidth,
    scrollWidth: el.scrollWidth,
  }));
  const name = await target.evaluate(el => el.id || `${el.className} ${el.dataset.stool || ""}`);
  expect(result.scrollHeight, `${name} 的内容不应超出容器高度`).toBeLessThanOrEqual(result.height + 1);
  expect(result.scrollWidth, `${name} 的内容不应超出容器宽度`).toBeLessThanOrEqual(result.width + 1);
}
for (const [width, height] of [
  [402, 874],
  [402, 760],
  [390, 844],
  [320, 640],
  [1280, 900],
])
  test(`one phone layout fits ${width} × ${height} without scrolling or moving the play button`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await noScroll(page);
    const toilet = await page.locator("#bathroom-scene").boundingBox();
    const start = await page.locator("#start-button").boundingBox();
    const food = await page.locator("#choose-foods").boundingBox();
    const time = await page.locator("#choose-digestion").boundingBox();
    expect(start.y).toBeGreaterThan(toilet.y + toilet.height);
    expect(food.x + food.width).toBeLessThan(toilet.x + toilet.width / 2);
    expect(time.x).toBeGreaterThan(toilet.x + toilet.width / 2);
    expect(start.y + start.height).toBeLessThan(height);
    await page.locator(".bathroom-illustration").click();
    await expect(page.locator("#equipment-dialog")).toBeVisible();
    await expect(page.locator("#equipment-dialog select")).toHaveCount(0);
    await page.locator("#toilet-next").click();
    await expect(page.locator("#equipment-title")).toHaveText("薄荷舒享马桶");
    await expect(page.locator("#toilet-preview svg")).toHaveAttribute("aria-label", "薄荷舒享马桶");
    await page.locator("#toilet-prev").click();
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#equipment-title")).toHaveText("水晶观测马桶");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#toilet-page")).toHaveText("1 / 10");
    await noScroll(page, "#equipment-dialog");
    await noScroll(page, ".toilet-carousel");
    await expect(page.locator("#toilet-description")).toBeInViewport();
    await expect(page.locator("#confirm-toilet")).toBeInViewport();
    await page.locator("#confirm-toilet").click();
    await page.locator("#start-button").click();
    const moving = await page.locator("#start-button").boundingBox();
    expect(moving.y).toBeCloseTo(start.y, 0);
    expect(moving.x).toBeCloseTo(start.x, 0);
    const force = await page.locator("#force-meter").boundingBox();
    expect(force.y + force.height).toBeLessThanOrEqual(moving.y - 2);
    const meal = await page.locator(".meal-strip").boundingBox();
    const controls = await page.locator(".action-area").boundingBox();
    expect(controls.y + controls.height).toBeLessThanOrEqual(meal.y);
    await noScroll(page);
    await page.locator("#start-button").click();
    await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 1500 });
    await noScroll(page, "#result-dialog");
    await page.locator("#play-again").click();
    await noScroll(page);
  });

test("food, drinks, additives, digestion, equipment and catalog use complete paged phone surfaces", async ({
  page,
}) => {
  await page.setViewportSize({ width: 402, height: 760 });
  await page.goto("/");
  await page.locator("#choose-foods").click();
  expect(
    await page.locator(".food-card:visible").count(),
  ).toBeGreaterThanOrEqual(2);
  await noScroll(page, "#food-dialog");
  await page.locator("#food-next").click();
  await expect(page.locator("#food-page")).toHaveText(/^2 \/ \d+ 页$/);
  await noScroll(page, "#food-dialog");
  await page.keyboard.press("Escape");
  await chooseMeal(page, ["enoki", "banana", "guanyin-clay"]);
  await expect(page.locator("#meal-summary .filled")).toHaveCount(3);
  await chooseDrink(page, "glow-soda");
  await chooseAdditives(page, ["glitter", "stardust", "frost-salt"]);
  await page.locator("#choose-drinks").click();
  await noScroll(page, "#supply-dialog");
  await page.keyboard.press("Escape");
  await page.locator("#choose-additives").click();
  await noScroll(page, "#supply-dialog");
  await page.keyboard.press("Escape");
  await page.locator("#choose-digestion").click();
  await page.locator('[data-digestion="8"]').click();
  await noScroll(page, "#digestion-dialog");
  await page.locator('[data-close="digestion-dialog"]').first().click();
  await expect(page.locator("#digestion-summary")).toContainText("8");
  await page.locator("#choose-toilet").click();
  await noScroll(page, "#equipment-dialog");
  await page.keyboard.press("Escape");
  await page.locator("#collection-button").click();
  expect(
    await page.locator(".stool-card:visible").count(),
  ).toBeGreaterThanOrEqual(2);
  await noScroll(page, "#collection-dialog");
  const ids = [];
  for (let i = 0; i < 30; i++) {
    ids.push(
      ...(await page
        .locator(".stool-card:visible")
        .evaluateAll((items) => items.map((el) => el.dataset.stool))),
    );
    if (await page.locator("#collection-next").isEnabled())
      await page.locator("#collection-next").click();
    else break;
  }
  expect(new Set(ids).size).toBe(56);
  await noScroll(page, "#collection-dialog");
});

test("rare results, diagnosis and independent specimen detail also fit the same phone screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await chooseMeal(page, ["enoki"]);
  await chooseDrink(page, "mineral-tonic");
  await chooseAdditives(page, ["crystal-seed"]);
  const selected = await armSpecimen(page, "crystal", 3);
  await startRound(page);
  await expect(page.locator("#result-dialog")).toBeVisible();
  await expect(page.locator("#result-dialog")).toHaveClass(/rare-result/);
  await noScroll(page, "#result-dialog");
  await page.locator("#result-explanation summary").click();
  await noScroll(page, "#result-dialog");
  await noScroll(page, "#result-explanation");
  await page.locator("#play-again").click();
  await page.locator("#collection-button").click();
  await chooseSpecimen(page, selected.specimenId);
  await expect(page.locator("#collection-detail")).toContainText("个体 #001");
  await noScroll(page, "#collection-dialog");
});

test("all foods remain reachable without search and follow the available phone height", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const viewport = new EventTarget();
    Object.assign(viewport, { height: 844, offsetTop: 0 });
    Object.defineProperty(window, "visualViewport", { value: viewport });
  });
  await page.goto("/");
  await page.locator("#choose-foods").click();
  await expect(page.locator('input[type="search"]')).toHaveCount(0);
  const ids = [];
  let sawLocked = false;
  for (let index = 0; index < 30; index++) {
    const visible = await page
      .locator(".food-card:visible")
      .evaluateAll((items) =>
        items.map((item) => ({
          id: item.dataset.foodCard,
          locked: item.classList.contains("locked"),
        })),
      );
    for (const item of visible) {
      if (item.locked) sawLocked = true;
      else expect(sawLocked).toBe(false);
      ids.push(item.id);
    }
    if (await page.locator("#food-next").isEnabled())
      await page.locator("#food-next").click();
    else break;
  }
  expect(new Set(ids).size).toBe(53);
  await page.evaluate(() => {
    Object.assign(window.visualViewport, { height: 650, offsetTop: 24 });
    window.visualViewport.dispatchEvent(new Event("resize"));
  });
  const dialog = await page.locator("#food-dialog").boundingBox();
  expect(dialog.y).toBeGreaterThanOrEqual(24);
  expect(dialog.y + dialog.height).toBeLessThanOrEqual(674);
  await expect(page.locator("#confirm-foods")).toBeInViewport();
  await noScroll(page, "#food-dialog");
  await page.evaluate(() => {
    Object.assign(window.visualViewport, { height: 844, offsetTop: 0 });
    window.visualViewport.dispatchEvent(new Event("resize"));
  });
  await expect(page.locator("#food-details")).toBeVisible();
  await page.locator("#confirm-foods").click();
  await noScroll(page);
});

test("larger type and cards remain readable on a compact phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  for (const selector of [
    ".tool-button strong",
    "#start-button",
    ".welcome p",
  ]) {
    const sizes = await page
      .locator(selector)
      .evaluateAll((items) =>
        items.map((item) => parseFloat(getComputedStyle(item).fontSize)),
      );
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(14);
  }
  for (const [entry, dialog, cards] of [
    ["#choose-foods", "#food-dialog", ".food-card:visible"],
    ["#choose-drinks", "#supply-dialog", "#drink-options .supply-card:visible"],
    ["#choose-additives", "#supply-dialog", "#additive-options .supply-card:visible"],
    ["#choose-digestion", "#digestion-dialog"],
    ["#choose-toilet", "#equipment-dialog"],
    ["#collection-button", "#collection-dialog", ".stool-card:visible"],
    ["#help-button", "#help-dialog"],
  ]) {
    await page.locator(entry).click();
    await noScroll(page, dialog);
    if (cards) {
      for (const card of await page.locator(cards).all()) {
        await noScroll(page, card);
        const bounds = await card.boundingBox();
        expect(bounds.width).toBeGreaterThan(120);
        expect(bounds.height).toBeGreaterThan(70);
      }
    }
    await page.keyboard.press("Escape");
  }
});
