import {test,expect} from '@playwright/test';
import {chooseMeal,chooseDrink,chooseAdditives,setWater,startRound,chooseSpecimen,setCompletedRounds} from './helpers.js';
for(const [width,height]of [[320,640],[402,760]])test(`the player's free meal is predictable and probiotic-stable at ${width}`,async({page})=>{
  await page.setViewportSize({width,height});
  await page.addInitScript(()=>{Math.random=()=>.5;});
  await page.goto('/');await setCompletedRounds(page,42);
  await chooseMeal(page,['rice','pumpkin']);await chooseDrink(page,'grass-jelly');await setWater(page,1250);
  await page.locator('#choose-digestion').click();await page.locator('[data-digestion="2"]').click();await page.locator('[data-close="digestion-dialog"]').last().click();
  await chooseAdditives(page,['probiotic']);
  await expect(page.locator('#action-title')).toHaveText('主结果 · 软软小枕头');
  await expect(page.locator('.idle-hint')).toContainText('主结果 98%');
  await expect(page.locator('.idle-hint')).toContainText('普通分支 100%');
  for(const force of [14,39,88]){
    await startRound(page,force);await expect(page.locator('#result-dialog')).toBeVisible();
    await expect(page.locator('#result-name')).toHaveText('软软小枕头');
    await expect(page.locator('#result-type')).toContainText('布里斯托 5 型');
    const recorded=await page.evaluate(()=>JSON.parse(localStorage.getItem('lalala-dev')).individuals.at(-1));
    await page.reload();await expect(page.locator('#start-button')).toHaveAttribute('data-phase','idle');
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('lalala-dev')).individuals.at(-1))).toEqual(recorded);
    await expect(page.locator('#action-title')).toHaveText('主结果 · 软软小枕头');
  }
  await page.screenshot({path:`qa/生成机制重构-主结果-${width}.png`});
  await page.locator('#collection-button').click();await page.locator('#collection-preview-all').check();await chooseSpecimen(page,'corn-pebbles:5');
  await page.locator('[data-detail-panel="source"]').click();
  await expect(page.locator('[data-source-for="corn-pebbles"]')).toContainText('蒸玉米');
  expect(await page.locator('#collection-dialog').evaluate(el=>el.scrollHeight<=el.clientHeight&&el.scrollWidth<=el.clientWidth)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

 test('the content studio exposes independent source conditions and shape preferences',async({page})=>{
  await page.goto('/admin/#stools');
  await expect(page.locator('#field-generation-identity')).toBeVisible();
  await expect(page.locator('#field-generation-forceZone')).toBeVisible();
  await expect(page.locator('#field-generation-sources-foods-0')).toBeVisible();
  await expect(page.locator('#field-generation-sources-pigment')).toBeVisible();
  const response=await page.request.get('/api/admin/content');
  expect(response.ok()).toBe(true);
  const {content}=await response.json();
  expect(content.stools.filter(s=>s.generation)).toHaveLength(46);
  expect(content.stools.find(s=>s.id==='corn-pebbles').generation.sources.foods).toEqual(['corn']);
});

test('aiming preview follows continuous force changes within the same zone',async({page})=>{
  await page.goto('/');await setWater(page,1250);await page.locator('#start-button').click();
  const labels=[];
  for(const force of [35,60]){
    const expected=await page.evaluate(async(force)=>{
      const save=JSON.parse(localStorage.getItem('lalala-dev'));
      Date.now=()=>save.session.startedAt+1500*force/100;
      const {getRecipeForecast}=await import('/src/game/outcome-pool.js');
      const forecast=getRecipeForecast({...save.session,force});
      return `主结果 ${(forecast.primaryProbability*100).toFixed(1).replace(/\.0$/,'')}%`;
    },force);
    await expect(page.locator('#force-value')).toContainText(`${force} / 100`);
    await expect(page.locator('.force-heading strong')).toHaveText(expected);labels.push(expected);
  }
  expect(labels[0]).not.toBe(labels[1]);
});
