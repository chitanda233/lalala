import {test,expect} from '@playwright/test';
import {enableCollectionPreview,chooseAdditives,setWater,startRound,armSpecimen,chooseSpecimen} from './helpers.js';

for(const [width,height] of [[320,640],[402,760]])test(`shared rare groups and visual effects persist at ${width}`,async({page})=>{
  await page.setViewportSize({width,height});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await setWater(page,1250);await chooseAdditives(page,['crystal-seed']);
  const forecast=await page.evaluate(async()=>{
    const {getOutcomePool,getRecipeForecast}=await import('/src/game/outcome-pool.js');
    const input={...JSON.parse(localStorage.getItem('lalala-dev')).settings,force:50};
    return {pool:getOutcomePool(input),forecast:getRecipeForecast(input)};
  });
  expect(forecast.pool.filter(e=>e.special).map(e=>[e.characterId,e.probability])).toEqual([['crystal',.2]]);
  const ordinary = forecast.pool.filter(entry => !entry.special);
  expect(ordinary.reduce((sum, entry) => sum + entry.probability, 0)).toBeCloseTo(.8,12);
  expect(ordinary.length).toBeGreaterThan(1);
  expect(forecast.forecast.primaryProbability).toBeCloseTo(Math.max(...ordinary.map(entry => entry.probability)),12);
  await expect(page.locator('.action-area')).not.toContainText(/概率|主结果|[%％]/);
  await armSpecimen(page,'classic',4);await startRound(page,50);
  await expect(page.locator('#result-name')).toHaveText('顺畅小能手');
  await expect(page.locator('#result-character [data-visual-effect="crystal"]')).toHaveCount(1);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('lalala-dev')).individuals.at(-1));
  expect(saved.appearance.visualEffects).toEqual(['crystal']);
  await page.reload();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lalala-dev')).individuals.at(-1))).toEqual(saved);
  await armSpecimen(page,'crystal',3);await startRound(page,50);
  await expect(page.locator('#result-name')).toHaveText('晶簇收藏家');
  await expect(page.locator('#result-type')).toContainText('布里斯托 3 型');
  await page.screenshot({path:`qa/新规则晶体特效-${width}.png`});
  await page.locator('#play-again').click();
  await page.locator('#collection-button').click();await enableCollectionPreview(page);
  await chooseSpecimen(page,'crystal:3');await page.locator('[data-detail-panel="recipe"]').click();
  await expect(page.locator('[data-recipe-for="crystal"]')).toContainText('目标组共享20%');
  await expect(page.locator('[data-recipe-for="crystal"]')).toContainText('组外稀有概率为0');
  expect(await page.locator('#collection-dialog').evaluate(el=>el.scrollHeight<=el.clientHeight&&el.scrollWidth<=el.clientWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('the studio edits general multi-target groups and explicit functional roles',async({page})=>{
  await page.setViewportSize({width:1400,height:900});
  await page.goto('/admin/#additives');
  await page.locator('[data-record="glitter"]').click();
  await expect(page.locator('#field-functional')).toHaveValue('false');
  await expect(page.locator('#field-visualEffect')).toBeVisible();
  for(const id of ['crystal','rainbow','luminous'])await page.locator(`[data-rare-target="${id}"]`).check();
  await expect(page.locator('#record-preview')).toContainText('稀有合计20.0%');
  await expect(page.locator('#record-preview')).toContainText('每款 6.67%');
  await expect(page.locator('#record-preview')).toContainText('组外稀有概率为0');
  await page.locator('#field-functional').selectOption('true');
  await page.locator('#field-visualEffect').selectOption('magnet');
  await expect(page.locator('#record-preview')).toContainText('物态／结构功能');
  await expect(page.locator('#record-preview')).toContainText('磁力砂簇');
  await page.screenshot({path:'qa/添加剂职责与稀有组.png'});
});
