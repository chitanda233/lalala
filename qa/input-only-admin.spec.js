import { test, expect } from "@playwright/test";
import { enableCollectionPreview, chooseSpecimen } from "./helpers.js";

test("recommendation editor has only recipe inputs and reports the target's actual pool probability", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/admin/#recipes");
  await expect(page.locator("#save-status")).toContainText("所有调整已保存");
  await expect(page.locator("#field-digestionTime, #preview-digestion")).toHaveCount(0);
  await expect(page.locator("#field-forceZone")).toBeVisible();
  await expect(page.locator("#preview-force")).toHaveCount(1);
  await page.locator("#record-category").selectOption("4 型");
  await page.locator('[data-record="classic"]').click();
  await page.locator("#field-foodIds-0").selectOption("toast");
  await page.locator("#field-water").selectOption("0");
  const actual = await page.evaluate(async () => {
    const { stoolRecipeByCharacterId } = await import("/src/content/stool-recipes.js");
    const { getOutcomePool, getRecipeForecast } = await import("/src/game/outcome-pool.js");
    const recipe = stoolRecipeByCharacterId.classic;
    const input = { ...recipe, force: { low: 20, medium: 50, high: 90 }[recipe.forceZone], additives: recipe.requiredAdditive ? [recipe.requiredAdditive] : [] };
    const forecast = getRecipeForecast(input, "classic");
    return { target: getOutcomePool(input).find(entry => entry.characterId === "classic")?.probability || 0, forecast };
  });
  expect(actual.forecast.targetProbability).toBe(actual.target);
  expect(actual.target).toBe(0);
  await expect(page.locator("[data-target-probability]")).toHaveText(`${(actual.target * 100).toFixed(1)}%`);
  await expect(page.locator("[data-stabilized-probability]")).toHaveText("0.0%");
  await page.locator('[data-try-recipe="classic"]').click();
  await expect(page.locator("#preview-forecast")).toContainText("当前主结果");
  await expect(page.locator("#preview-forecast")).not.toContainText("预览暂不可用");
  await expect(page.locator("#specimen-preview .specimen")).toHaveCount(2);
  await page.locator('#studio-nav [data-module="stools"]').click();
  await page.locator("#record-category").selectOption("4 型");
  await page.locator('[data-record="classic"]').click();
  await expect(page.locator("#field-generation-forceZone")).toBeVisible();
  expect(errors).toEqual([]);
});

test("catalogue recommendation shows its target probability rather than the primary result probability", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto("/");
  const expected = await page.evaluate(async () => {
    const { stoolRecipeByCharacterId } = await import("/src/content/stool-recipes.js");
    const { getRecipeForecast } = await import("/src/game/outcome-pool.js");
    const { characterById } = await import("/src/content/catalog.js");
    Object.assign(stoolRecipeByCharacterId.classic, { foodIds: ["toast"], drinkId: "water", water: 0, requiredAdditive: null });
    const forecast = getRecipeForecast({ ...stoolRecipeByCharacterId.classic, force: { low: 20, medium: 50, high: 90 }[stoolRecipeByCharacterId.classic.forceZone], additives: [] }, "classic");
    return { target: forecast.targetProbability, primary: characterById[forecast.primaryCharacterId].name };
  });
  expect(expected.target).toBe(0);
  await page.locator("#collection-button").click();
  await enableCollectionPreview(page);
  await chooseSpecimen(page, "classic:4");
  await page.locator('[data-detail-panel="recipe"]').click();
  const recipe = page.locator('[data-recipe-for="classic"]');
  await expect(recipe).toContainText("推荐搭配");
  await expect(recipe).toContainText("未中稀有后 0% · 整局 0.0%");
  await expect(recipe).toContainText("益生菌：普通分支 0% · 整局 0%");
  await expect(recipe).toContainText(`当前主结果：${expected.primary}`);
  await expect(recipe).not.toContainText(/消化|阶段/);
  await expect(recipe).toContainText(/力度/);
  expect(errors).toEqual([]);
});
