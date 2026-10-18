import { setCompletedRounds } from "./helpers.js";
import { toilets } from "../src/content/toilets.js";
import { test, expect } from "@playwright/test";
import {
  chooseSpecimen,
  showPageItem,
  chooseToilet,
  startRound,
  chooseDrink,
  chooseAdditives,
  armSpecimen,
} from "./helpers.js";
const storageKey = "lalala-dev";

test("eleven drinks and eighteen open additives support persistent selection with a three-item limit", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator("#choose-drinks").click();
  await expect(page.locator("[data-drink]")).toHaveCount(11);
  await showPageItem(page, '[data-drink="prune-juice"]');
  await page.locator('[data-drink="prune-juice"]').click();
  await expect(page.locator('[data-drink="prune-juice"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#supply-count")).not.toBeEmpty();
  await expect(page.locator("#supply-count")).not.toContainText("西梅汁");
  await page.screenshot({
    path: "qa/drinks-desktop.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(page.locator("#drink-summary")).toHaveText("西梅汁");
  await chooseAdditives(page, ["glitter", "gold-leaf", "crystal-seed"]);
  await page.locator("#choose-additives").click();
  await expect(page.locator(".additive-input")).toHaveCount(18);
  await expect(page.locator(".additive-input:checked")).toHaveCount(3);
  await expect(page.locator('[value="rainbow-sugar"]')).toBeDisabled();
  await showPageItem(page, '[value="gold-leaf"]');
  await page.locator('[value="gold-leaf"]').uncheck();
  await expect(page.locator('[value="rainbow-sugar"]')).toBeEnabled();
  await showPageItem(page, '[value="rainbow-sugar"]');
  await page.locator('[value="rainbow-sugar"]').check();
  await page.screenshot({
    path: "qa/additives-desktop.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await page.reload();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    storageKey,
  );
  expect(saved.settings.additives.sort()).toEqual(
    ["glitter", "crystal-seed", "rainbow-sugar"].sort(),
  );
  expect(saved.settings.drinkId).toBe("prune-juice");
  expect(errors).toEqual([]);
});

test("a purple glitter result keeps its color and explanation across an active reload", async ({
  page,
}) => {
  await page.goto("/");
  await setCompletedRounds(page, 5);
  await chooseDrink(page, "prune-juice");
  await chooseAdditives(page, ["glitter"]);
  await chooseToilet(page, "heated");

  await armSpecimen(page, "glitter", 4);
  await startRound(page);
  await expect(page.locator("#choose-drinks")).toBeDisabled();
  await expect(page.locator("#choose-additives")).toBeDisabled();
  await expect(page.locator("#force-meter")).toHaveClass(/locked/);
  const snapshot = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)).session,
    storageKey,
  );
  expect(snapshot.outcome.characterId).toBe("glitter");
  expect(snapshot.outcome.colorId).toBe("berry");
  await page.reload();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).session,
      storageKey,
    ),
  ).toEqual(snapshot);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 6000 });
  await expect(page.locator("#result-name")).toHaveText("闪粉派对");
  await expect(page.locator("#result-rarity")).toContainText("蓝莓紫");
  expect(await page.locator("#result-character").innerHTML()).toContain(
    "#9b7ca6",
  );
  await page.locator("#result-explanation summary").click();
  await expect(page.locator("#result-explanation summary")).toHaveText(
    "查看形态诊断",
  );
  await expect(page.locator("#result-reasons")).toContainText("反光颗粒");
  await expect(page.locator("#result-reasons")).toContainText("蓝莓紫");
  await expect(page.locator("#result-reasons")).not.toContainText(
    /西梅汁|恒温暖座|影响强度|抽中|mL/,
  );
  await page.screenshot({
    path: "qa/recipe-lab-result.png",
    animations: "disabled",
  });
  await page.locator("#play-again").click();
  await page.locator("#collection-button").click();
  await expect(page.locator('[data-stool="glitter:4"]')).toHaveClass(
    /collected/,
  );
});

test("fifty collectibles have one home classification and ten toilets display different equipment", async ({
  page,
}) => {
  await page.goto("/");
  await setCompletedRounds(page, 40);
  const drawings = new Set();
  const ids = toilets.map((toilet) => toilet.id);
  expect(ids).toHaveLength(10);
  for (const id of ids) {
    await chooseToilet(page, id);
    drawings.add(await page.locator(".toilet-body").innerHTML());
    await expect(page.locator("#bathroom-scene")).toHaveAttribute(
      "data-toilet",
      id,
    );
    await expect(page.locator("#toilet-description")).not.toBeEmpty();
  }
  expect(drawings.size).toBe(10);
  await chooseToilet(page, "squat");
  await page.screenshot({
    path: "qa/toilet-squat.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.locator("#collection-button").click();
  await expect(page.locator("[data-stool]")).toHaveCount(56);
  await expect(page.locator(".rarity-special")).toHaveCount(0);
  await expect(page.locator(".stool-card.uncollected")).toHaveCount(56);
  for (const id of ["gold:4", "crystal:3", "rainbow:4", "jelly:5"])
    await expect(page.locator(`[data-stool="${id}"]`)).toHaveClass(
      /uncollected/,
    );
  await chooseSpecimen(page, "spiral:4");
  await expect(page.locator("#collection-detail")).toContainText(
    "4 型建议：",
  );
  await expect(page.locator("#collection-detail")).not.toContainText("慢慢来");
  await page.screenshot({
    path: "qa/catalog-desktop.png",
    animations: "disabled",
  });
  const seen = [];
  for (const type of [1, 2, 3, 4, 5, 6, 7]) {
    await page.locator(`[data-type-filter="${type}"]`).click();
    const visibleCount = await page.locator(".stool-card:visible").count();
    expect(visibleCount).toBeGreaterThan(0);
    expect(visibleCount).toBeLessThanOrEqual(6);
    seen.push(
      ...(await page
        .locator("[data-stool]")
        .evaluateAll((items) => items.map((item) => item.dataset.stool))),
    );
  }
  expect(new Set(seen).size).toBe(56);
  expect(seen.length).toBe(56);
});

for (const [width, height] of [
  [390, 844],
  [320, 640],
])
  test(`recipe lab and full catalog remain usable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await chooseDrink(page, "glow-soda");
    await chooseAdditives(page, ["stardust", "amber-resin", "frost-salt"]);
    await page.locator("#choose-additives").click();
    expect(
      await page
        .locator("#supply-dialog")
        .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: `qa/lab-mobile-${width}.png`,
      animations: "disabled",
    });
    await page.locator(".supply-footer [data-close]").click();
    await chooseToilet(page, "stone");
    await page.locator("#collection-button").click();
    await chooseSpecimen(page, "meteor:1");
    await expect(page.locator("#collection-detail")).toContainText(
      "1 型建议：",
    );
    expect(
      await page
        .locator("#collection-dialog")
        .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: `qa/catalog-mobile-${width}.png`,
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);

    await startRound(page);
    await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 4000 });
    await page.locator("#result-explanation summary").click();
    expect(
      await page
        .locator("#result-dialog")
        .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
    ).toBe(true);
    await page.locator("#play-again").click();
  });
