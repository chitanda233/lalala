import { test, expect } from "@playwright/test";
import { enableCollectionPreview, chooseAdditives, startRound, chooseSpecimen } from "./helpers.js";

for(const [width,height] of [[320,640],[402,760]])
  test(`Drink intake and digestion controls change the rice meal and random phases stay locked at ${width}`, async ({page}) => {
    await page.setViewportSize({width,height});
    await page.addInitScript(()=>{Math.random=()=>.5;});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('/');
    await chooseAdditives(page,['probiotic']);
    for(const [water,phase,type] of [[0,'8',2],[500,'4',3],[1250,'4',4],[1250,'2',5]]) {
      await page.locator('#choose-drinks').click();
      await page.locator('#water').fill(String(water));
      await expect(page.locator('#water-value')).toHaveText(`${water.toLocaleString("en-US")} mL`);
      await expect(page.locator('#drink-volume, #total-liquid')).toHaveCount(0);
      await expect(page.locator('#water-section')).not.toContainText("额外清水");
      expect(await page.locator('#supply-dialog').evaluate(el=>el.scrollHeight<=el.clientHeight&&el.scrollWidth<=el.clientWidth)).toBe(true);
      await page.locator('#confirm-supply').click();
      await page.locator('#choose-digestion').click();
      await page.locator(`[data-digestion="${phase}"]`).click();
      await page.locator('[data-close="digestion-dialog"]').last().click();
      await startRound(page,50);
      await expect(page.locator('#result-dialog')).toBeVisible();
      await expect(page.locator('#result-type')).toContainText(`布里斯托 ${type} 型`);
      const recipe=await page.evaluate(()=>JSON.parse(localStorage.getItem('lalala-dev')).individuals.at(-1).recipe);
      expect([recipe.water,recipe.digestionTime]).toEqual([water,phase]);
      expect(recipe).not.toHaveProperty("drinkVolume");
      await page.locator('#play-again').click();
    }
    await page.locator('#choose-digestion').click();
    await page.locator('[data-digestion="random"]').click();
    await page.locator('[data-close="digestion-dialog"]').last().click();
    await expect(page.locator('#action-title')).toHaveText('准备好，开始吧。');
    await expect(page.locator('.action-area')).not.toContainText(/预告|概率|主结果|[%％]/);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.locator('#start-button').click();
    const aiming=await page.evaluate(()=>JSON.parse(localStorage.getItem('lalala-dev')).session);
    expect(aiming.digestionTime).toBe('4');
    await expect(page.locator('#action-description')).not.toContainText('本局阶段');
    await page.reload();
    expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('lalala-dev')).session)).digestionTime).toBe('4');
    expect(errors).toEqual([]);
  });

test('the catalogue and content studio expose complete volume and phase recipes',async({page})=>{
  await page.setViewportSize({width:402,height:760});
  await page.goto('/');
  await page.locator('#collection-button').click();
  await enableCollectionPreview(page);
  await chooseSpecimen(page,'classic:4');
  await page.locator('[data-detail-panel="recipe"]').click();
  await expect(page.locator('[data-recipe-for="classic"]')).toContainText('1250 mL');
  await expect(page.locator('[data-recipe-for="classic"]')).toContainText('消化阶段 4');
  expect(await page.locator('#collection-dialog').evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);
  await page.setViewportSize({width:1400,height:900});
  await page.goto('/admin/#recipes');
  await expect(page.locator('#field-drinkVolume')).toHaveCount(0);
  await expect(page.locator('#field-water')).toBeVisible();
  await expect(page.locator('#field-digestionTime')).toBeVisible();
  await expect(page.locator('#field-requiredAdditive')).toBeVisible();
  const response=await page.request.get('/api/admin/foods');
  expect(response.ok()).toBe(true);
  expect(Object.keys((await response.json()).foods)).toHaveLength(53);
});
