import { test, expect } from "@playwright/test";
import { chooseAdditives, chooseSpecimen, showPageItem, startRound, setWater } from "./helpers.js";

const readSave = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("lalala-dev")));
const closeSupplies = (page) => page.locator('#confirm-supply').click();

async function prepare(page, viewport) {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => {
    window.qaRecipeRandomDraws = 0;
    Math.random = () => {
      window.qaRecipeRandomDraws++;
      return 0.5;
    };
  });
  await page.goto("/");
  await setWater(page, 1250);
  await expect(page.locator("#start-button")).toHaveAttribute("data-phase", "idle");
}

async function expectNoSpoilers(page) {
  await expect(page.locator("#action-title")).toHaveText("准备好，开始吧。");
  await expect(page.locator(".action-area")).not.toContainText(/主结果|目标|概率|命中|普通分支|稀有|预告|[%％]/);
  await expect(page.locator("#action-description")).toHaveText("选好配方，点击开始，再点击停止锁定力度。");
}

for (const [width, height] of [[320, 640], [402, 760]])
  test(`fixed recipes, optional probiotic, locked reload and collection stay usable at ${width} × ${height}`, async ({ page }) => {
    await prepare(page, { width, height });
    const initial = await readSave(page);
    expect(initial.settings.foodIds).toEqual(["rice"]);
    expect(initial.settings.drinkId).toBe("water");
    expect(initial.settings.additives).toEqual([]);
    await expectNoSpoilers(page);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await chooseAdditives(page, ["probiotic"]);
    await expectNoSpoilers(page);
    expect((await readSave(page)).settings.additives).toEqual(["probiotic"]);
    await page.locator("#choose-additives").click();
    await expect(page.locator(".additive-input:checked")).toHaveCount(1);
    await expect(page.locator('.additive-input[value="probiotic"]')).toBeChecked();
    await page.locator('.additive-input[value="probiotic"]').uncheck();
    await expect(page.locator(".additive-input:checked")).toHaveCount(0);
    await closeSupplies(page);
    await expectNoSpoilers(page);
    expect((await readSave(page)).settings.additives).toEqual([]);

    const now = new Date("2026-10-18T08:00:00Z");
    await page.clock.install({ time: now });
    await page.clock.pauseAt(new Date(now.getTime() + 1000));
    await startRound(page, 50);
    const locked = (await readSave(page)).session;
    expect(locked.force).toBe(50);
    expect(locked.outcome.characterId).toBe("classic");
    expect(locked.outcome.special).toBe(false);
    await expect(page.locator(".force-heading strong")).toHaveText("拉屎力度");
    await expect(page.locator(".action-area")).not.toContainText(/顺畅小能手|主结果|概率|命中|稀有|[%％]/);
    await expect(page.locator("#result-dialog")).not.toBeVisible();
    await page.reload();
    await expect(page.locator("#start-button")).toHaveAttribute("data-phase", "running");
    expect((await readSave(page)).session).toEqual(locked);
    expect(await page.evaluate(() => window.qaRecipeRandomDraws)).toBe(0);
    await page.clock.runFor(1200);
    await expect(page.locator("#result-dialog")).toBeVisible();
    await expect(page.locator("#result-name")).toHaveText("顺畅小能手");
    const completed = await readSave(page);
    expect(completed.total).toBe(1);
    expect(completed.individuals).toHaveLength(1);
    expect(completed.individuals[0].id).toBe(locked.id);
    expect(completed.individuals[0].characterId).toBe("classic");
    expect(completed.individuals[0].appearance).toEqual(locked.outcome.appearance);

    await page.locator("#play-again").click();
    await page.locator("#collection-button").click();
    await chooseSpecimen(page, "classic:4");
    await page.locator('[data-detail-panel="recipe"]').click();
    const recipe = page.locator('[data-recipe-for="classic"]');
    await expect(recipe).toBeVisible();
    await expect(recipe).toContainText("白米饭");
    await expect(recipe).toContainText("清水");
    await expect(recipe).toContainText("中等力度 · 34–66");
    await expect(recipe).toContainText("基础 80% · 益生菌 100%");
    await expect(recipe).toContainText("基础 78.4% · 益生菌 98%");
    await expect(recipe.locator("p").filter({ hasText: "未中稀有：" })).toBeInViewport();
  });

test("single functional additives render glitter and give crystal a 5% rare pool with a 76% fixed target", async ({ page }) => {
  await prepare(page, { width: 402, height: 760 });
  await chooseAdditives(page, ["probiotic"]);
  await page.locator("#choose-additives").click();
  await showPageItem(page, '.additive-input[value="glitter"]');
  await page.locator('.additive-input[value="glitter"]').check();
  await expect(page.locator(".additive-input:checked")).toHaveCount(1);
  await expect(page.locator('.additive-input[value="probiotic"]')).not.toBeChecked();
  await closeSupplies(page);
  expect((await readSave(page)).settings.additives).toEqual(["glitter"]);
  await expectNoSpoilers(page);
  await startRound(page, 50);
  await expect(page.locator("#result-dialog")).toBeVisible();
  await expect(page.locator("#result-name")).toHaveText("顺畅小能手");
  await expect(page.locator('#result-character [data-decoration="glitter"]')).toHaveCount(1);
  const glitter = (await readSave(page)).individuals[0];
  expect(glitter.appearance.decorations).toEqual(["glitter"]);
  expect(glitter.characterId).toBe("classic");
  expect(glitter.appearance.materialId).toBeUndefined();

  await page.locator("#play-again").click();
  await chooseAdditives(page, ["crystal-seed"]);
  await expectNoSpoilers(page);
  expect((await readSave(page)).settings.additives).toEqual(["crystal-seed"]);
  const actual = await page.evaluate(async () => {
    const { getOutcomePool, getRecipeForecast } = await import("/src/game/outcome-pool.js");
    const input = { ...JSON.parse(localStorage.getItem("lalala-dev")).settings, force: 50 };
    const pool = getOutcomePool(input);
    return {
      rare: pool.filter((entry) => entry.special).reduce((sum, entry) => sum + entry.probability, 0),
      target: pool.find((entry) => entry.characterId === "classic").probability,
      conditional: getRecipeForecast(input).recipeConditionalProbability,
    };
  });
  expect(actual.rare).toBeCloseTo(0.05, 12);
  expect(actual.target).toBeCloseTo(0.76, 12);
  expect(actual.conditional).toBe(0.8);
  await startRound(page, 50);
  await expect(page.locator("#result-dialog")).toBeVisible();
  await expect(page.locator("#result-name")).toHaveText("顺畅小能手");
  const final = await readSave(page);
  expect(final.total).toBe(2);
  expect(final.individuals.at(-1).recipe.additives).toEqual(["crystal-seed"]);
  expect(final.individuals.at(-1).characterId).toBe("classic");
});
