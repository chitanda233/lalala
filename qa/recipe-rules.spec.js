import { test, expect } from "@playwright/test";
import { chooseAdditives, chooseSpecimen, showPageItem, startRound, setWater, enableCollectionPreview } from "./helpers.js";

const readSave = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("lalala-dev")));
const closeSupplies = (page) => page.locator('#confirm-supply').click();

// Match the seeded draw to the actual pool; recommendation odds are no longer fixed.
async function expectedDraw(page) {
  return page.evaluate(async () => {
    const { getOutcomePool } = await import('/src/game/outcome-pool.js');
    const { specimenName } = await import('/src/game/specimen.js');
    const input = { ...JSON.parse(localStorage.getItem('lalala-dev')).settings, force: 50 };
    const pool = getOutcomePool(input);
    let cumulative = 0;
    const entry = pool.find(item => (cumulative += item.probability) > .5);
    return { id: entry.characterId, name: specimenName({ ...entry, type: Number(entry.specimenId.split(':')[1]) }) };
  });
}

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
  test(`recommended meals, optional probiotic, locked reload and collection stay usable at ${width} × ${height}`, async ({ page }) => {
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

    const expected = await expectedDraw(page);
    const now = new Date("2026-10-18T08:00:00Z");
    await page.clock.install({ time: now });
    await page.clock.pauseAt(new Date(now.getTime() + 1000));
    await startRound(page, 50);
    const locked = (await readSave(page)).session;
    expect(locked.force).toBe(50);
    expect(locked.outcome.characterId).toBe(expected.id);
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
    await expect(page.locator("#result-name")).toHaveText(expected.name);
    const completed = await readSave(page);
    expect(completed.total).toBe(1);
    expect(completed.individuals).toHaveLength(1);
    expect(completed.individuals[0].id).toBe(locked.id);
    expect(completed.individuals[0].characterId).toBe(expected.id);
    expect(completed.individuals[0].appearance).toEqual(locked.outcome.appearance);

    await page.locator("#play-again").click();
    const recommendation = await page.evaluate(async () => {
      const { stoolRecipeByCharacterId } = await import('/src/content/stool-recipes.js');
      const { getRecipeForecast } = await import('/src/game/outcome-pool.js');
      const { forceZones } = await import('/src/content/force.js');
      const { foodById, drinkById } = await import('/src/content/catalog.js');
      const recipe = stoolRecipeByCharacterId.classic;
      const zone = forceZones.find(zone => zone.id === recipe.forceZone);
      const force = { low: 20, medium: 50, high: 90 }[recipe.forceZone];
      const forecast = getRecipeForecast({ ...recipe, force, additives: [] }, 'classic');
      const stable = getRecipeForecast({ ...recipe, force, additives: ['probiotic'] }, 'classic');
      return {
        foods: recipe.foodIds.map(id => foodById[id].name), drink: drinkById[recipe.drinkId].name,
        zone: `${zone.name} · ${zone.min}–${zone.max}`,
        probability: `未中稀有后 ${(forecast.targetConditionalProbability * 100).toFixed(0)}% · 整局 ${(forecast.targetProbability * 100).toFixed(1)}%`,
        stable: `益生菌：普通分支 ${(stable.targetConditionalProbability * 100).toFixed(0)}% · 整局 ${(stable.targetProbability * 100).toFixed(0)}%`,
      };
    });
    await page.locator("#collection-button").click();
    await enableCollectionPreview(page);
    await chooseSpecimen(page, "classic:4");
    await page.locator('[data-detail-panel="recipe"]').click();
    const recipe = page.locator('[data-recipe-for="classic"]');
    await expect(recipe).toBeVisible();
    await expect(recipe).toContainText("推荐搭配");
    for (const food of recommendation.foods) await expect(recipe).toContainText(food);
    await expect(recipe).toContainText(recommendation.drink);
    await expect(recipe).toContainText(recommendation.zone);
    await expect(recipe).toContainText(recommendation.probability);
    await expect(recipe).toContainText(recommendation.stable);
    await expect(recipe).not.toContainText(/消化|阶段/);
    await expect(recipe.locator("p").filter({ hasText: "未中稀有后" })).toBeInViewport();
  });

test("single additives render glitter and preserve the exclusive 20% crystal budget with dynamic ordinary odds", async ({ page }) => {
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
  const glitterExpected = await expectedDraw(page);
  await startRound(page, 50);
  await expect(page.locator("#result-dialog")).toBeVisible();
  await expect(page.locator("#result-name")).toHaveText(glitterExpected.name);
  await expect(page.locator('#result-character [data-decoration="glitter"]')).toHaveCount(1);
  const glitter = (await readSave(page)).individuals[0];
  expect(glitter.appearance.decorations).toEqual(["glitter"]);
  expect(glitter.characterId).toBe(glitterExpected.id);
  expect(glitter.appearance.materialId).toBeUndefined();

  await page.locator("#play-again").click();
  await chooseAdditives(page, ["crystal-seed"]);
  await expectNoSpoilers(page);
  expect((await readSave(page)).settings.additives).toEqual(["crystal-seed"]);
  const actual = await page.evaluate(async () => {
    const { getOutcomePool, getRecipeForecast } = await import("/src/game/outcome-pool.js");
    const input = { ...JSON.parse(localStorage.getItem("lalala-dev")).settings, force: 50 };
    const pool = getOutcomePool(input), forecast = getRecipeForecast(input);
    return {
      rare: pool.filter((entry) => entry.special).reduce((sum, entry) => sum + entry.probability, 0),
      target: pool.find((entry) => entry.characterId === forecast.primaryCharacterId).probability,
      conditional: forecast.primaryConditionalProbability,
    };
  });
  expect(actual.rare).toBeCloseTo(0.2, 12);
  expect(actual.target).toBeCloseTo(.8 * actual.conditional, 12);
  expect(actual.conditional).toBeGreaterThan(0);
  expect(actual.conditional).toBeLessThanOrEqual(1);
  const crystalExpected = await expectedDraw(page);
  await startRound(page, 50);
  await expect(page.locator("#result-dialog")).toBeVisible();
  await expect(page.locator("#result-name")).toHaveText(crystalExpected.name);
  const final = await readSave(page);
  expect(final.total).toBe(2);
  expect(final.individuals.at(-1).recipe.additives).toEqual(["crystal-seed"]);
  expect(final.individuals.at(-1).characterId).toBe(crystalExpected.id);
});
