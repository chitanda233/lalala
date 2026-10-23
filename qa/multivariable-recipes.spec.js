import { test, expect } from "@playwright/test";
import { enableCollectionPreview, chooseAdditives, startRound, chooseSpecimen } from "./helpers.js";

for (const [width, height] of [[320, 640], [402, 760]])
  test(`drink intake changes the meal without a time input at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(() => { Math.random = () => .5; });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await chooseAdditives(page, ["probiotic"]);
    await expect(page.locator('#choose-digestion, #digestion-dialog')).toHaveCount(0);
    const producedTypes = new Set();
    for (const water of [0, 500, 1250]) {
      await page.locator('#choose-drinks').click();
      await page.locator('#water').fill(String(water));
      await expect(page.locator('#water-value')).toHaveText(`${water.toLocaleString("en-US")} mL`);
      await expect(page.locator('#drink-volume, #total-liquid')).toHaveCount(0);
      await expect(page.locator('#water-section')).not.toContainText("额外清水");
      expect(await page.locator('#supply-dialog').evaluate(el => el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth)).toBe(true);
      await page.locator('#confirm-supply').click();
      const expected = await page.evaluate(async () => {
        const { getRecipeForecast } = await import('/src/game/outcome-pool.js');
        const forecast = getRecipeForecast({ ...JSON.parse(localStorage.getItem('lalala-dev')).settings, force: 50 });
        return { id: forecast.primaryCharacterId, type: forecast.physicalState.type };
      });
      producedTypes.add(expected.type);
      await startRound(page, 50);
      await expect(page.locator('#result-dialog')).toBeVisible();
      await expect(page.locator('#result-type')).toContainText(`布里斯托 ${expected.type} 型`);
      const individual = await page.evaluate(() => JSON.parse(localStorage.getItem('lalala-dev')).individuals.at(-1));
      expect(individual.characterId).toBe(expected.id);
      expect(individual.recipe.water).toBe(water);
      expect(individual.recipe).not.toHaveProperty("digestionTime");
      expect(individual.recipe).not.toHaveProperty("drinkVolume");
      await page.locator('#play-again').click();
    }
    expect(producedTypes.size).toBeGreaterThan(1);
    await expect(page.locator('.action-area')).not.toContainText(/预告|概率|主结果|[%％]/);
    await page.locator('#start-button').click();
    const aiming = await page.evaluate(() => JSON.parse(localStorage.getItem('lalala-dev')).session);
    expect(aiming).not.toHaveProperty('digestionTime');
    await page.reload();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lalala-dev')).session)).toEqual(aiming);
    expect(errors).toEqual([]);
  });

test('the catalogue and content studio expose volume and force recommendations without time', async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 760 });
  await page.goto('/');
  const recipe = await page.evaluate(async () => (await import('/src/content/stool-recipes.js')).stoolRecipeByCharacterId.classic);
  await page.locator('#collection-button').click();
  await enableCollectionPreview(page);
  await chooseSpecimen(page, 'classic:4');
  await page.locator('[data-detail-panel="recipe"]').click();
  await expect(page.locator('[data-recipe-for="classic"]')).toContainText(`${recipe.water} mL`);
  await expect(page.locator('[data-recipe-for="classic"]')).not.toContainText(/消化|阶段/);
  await expect(page.locator('[data-recipe-for="classic"]')).toContainText('力度');
  expect(await page.locator('#collection-dialog').evaluate(el => el.scrollHeight <= el.clientHeight)).toBe(true);
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('/admin/#recipes');
  await expect(page.locator('#field-drinkVolume, #field-digestionTime')).toHaveCount(0);
  await expect(page.locator('#field-water')).toBeVisible();
  await expect(page.locator('#field-forceZone')).toBeVisible();
  await expect(page.locator('#field-requiredAdditive')).toBeVisible();
  const response = await page.request.get('/api/admin/foods');
  expect(response.ok()).toBe(true);
  expect(Object.keys((await response.json()).foods)).toHaveLength(53);
});
