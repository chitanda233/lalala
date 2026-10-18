import { test, expect } from "@playwright/test";
import { focusFood, chooseMeal, showPageItem } from "./helpers.js";

async function noOverflow(page, selector) {
  expect(await page.locator(selector).evaluate(el => el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth)).toBe(true);
}

for (const [width, height] of [[320, 640], [402, 760]])
  test(`quick add and current selections stay visible at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await page.locator("#choose-foods").click();
    await expect(page.locator('[data-add-food="rice"]')).toHaveText("✓");
    await expect(page.locator('[data-add-food="rice"]')).toBeDisabled();
    for (const id of ["banana", "enoki"]) {
      const category = await page.evaluate(async id => (await import("/src/content/catalog.js")).foodById[id].category, id);
      await page.locator(`[data-food-category="${category}"]`).click();
      await showPageItem(page, `[data-add-food="${id}"]`, "food");
      await page.locator(`[data-add-food="${id}"]`).click();
      await expect(page.locator(`[data-add-food="${id}"]`)).toHaveText("✓");
      await expect(page.locator(`[data-add-food="${id}"]`)).toBeDisabled();
    }
    await expect(page.locator("#food-draft-count")).toHaveText("3 / 3");
    await focusFood(page, "broccoli");
    await expect(page.locator('[data-add-food="broccoli"]')).toBeDisabled();
    await page.locator('[data-slot-target="0"]').click();
    await focusFood(page, "broccoli");
    await page.locator('[data-add-food="broccoli"]').click();
    await expect(page.locator('#food-slots [data-slot-target="0"]')).toContainText("西兰花");
    await noOverflow(page, "#food-dialog");
    await page.locator("#food-dialog .food-cancel").click();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("lalala-dev")).settings.foodIds)).toEqual(["rice"]);

    await chooseMeal(page, ["broccoli"]);
    await page.locator('[data-open-food-slot="0"]').click();
    await expect(page.locator('[data-food="broccoli"]')).toBeVisible();
    await expect(page.locator('[data-add-food="broccoli"]')).toHaveText("✓");
    await noOverflow(page, "#food-dialog");
    await page.screenshot({ path: `qa/食物一键加入-${width}.png` });
    await page.locator("#food-dialog .food-cancel").click();

    await expect(page.locator("#add-food")).toHaveCount(0);
    const settings = () => page.evaluate(() => JSON.parse(localStorage.getItem("lalala-dev")).settings);
    await page.locator("#choose-drinks").click();
    await expect(page.locator("#water")).toHaveAttribute("min", "0");
    await expect(page.locator("#water")).toHaveAttribute("max", "1250");
    await expect(page.locator("#water")).toHaveAttribute("step", "250");
    expect(await page.locator("#water-stops span").allTextContents()).toEqual(["0","250","500","750","1000","1250"]);
    for (const amount of [0,250,500,750,1000,1250]) {
      await page.locator("#water").fill(String(amount));
      await expect(page.locator("#water-value")).toContainText(amount.toLocaleString("en-US"));
    }
    await showPageItem(page, '[data-drink="grass-jelly"]');
    await page.locator('[data-drink="grass-jelly"]').click();
    await expect(page.locator("#supply-details")).toContainText("仙草冻饮");
    await expect(page.locator("#supply-details button")).toHaveCount(0);
    await expect(page.locator("#supply-slots")).toContainText("清水");
    await page.locator('[data-add-drink="grass-jelly"]').click();
    await page.locator("#water").fill("1250");
    await expect(page.locator("#supply-slots")).toContainText("仙草冻饮");
    await expect(page.locator("#supply-slots")).toContainText("1,250 mL");
    expect((await settings()).drinkId).toBe("water");
    expect((await settings()).water).toBe(750);
    await page.locator('.supply-footer .food-cancel').click();
    await page.locator("#choose-drinks").click();
    await expect(page.locator("#supply-slots")).toContainText("清水");
    await expect(page.locator("#water")).toHaveValue("750");
    await showPageItem(page, '[data-add-drink="grass-jelly"]');
    await page.locator('[data-add-drink="grass-jelly"]').click();
    await page.locator("#water").fill("1250");
    await page.locator('#confirm-supply').click();
    expect((await settings()).drinkId).toBe("grass-jelly");
    expect((await settings()).water).toBe(1250);
    await page.locator("#choose-drinks").click();
    await expect(page.locator('[data-drink="grass-jelly"]')).toBeVisible();
    await expect(page.locator('[data-add-drink="grass-jelly"]')).toHaveText("✓");
    while (await page.locator("#supply-prev").isEnabled()) await page.locator("#supply-prev").click();
    await expect(page.locator("#supply-slots")).toContainText("仙草冻饮");
    await page.locator('[data-current-supply]').click();
    await noOverflow(page, "#supply-dialog");
    await page.screenshot({ path: `qa/饮料统一选择界面-${width}.png` });
    await page.locator('[data-remove-supply]').click();
    await expect(page.locator('#confirm-supply')).toBeDisabled();
    await page.locator('.supply-footer .food-cancel').click();

    await page.locator("#choose-additives").click();
    await expect(page.locator("#supply-draft-count")).toHaveText("0 / 1");
    await showPageItem(page, '[data-additive="gelatin"]');
    await page.locator('[data-additive="gelatin"]').click();
    await expect(page.locator("#supply-details")).toContainText("弹弹凝胶");
    await expect(page.locator("#supply-draft-count")).toHaveText("0 / 1");
    await showPageItem(page, '.additive-input[value="glitter"]');
    await page.locator('.additive-input[value="glitter"]').click();
    await showPageItem(page, '.additive-input[value="gelatin"]');
    await page.locator('.additive-input[value="gelatin"]').click();
    await expect(page.locator(".additive-input:checked")).toHaveCount(1);
    await expect(page.locator("#supply-slots")).toContainText("弹弹凝胶");
    expect((await settings()).additives).toEqual([]);
    await page.locator('.supply-footer .food-cancel').click();
    await page.locator("#choose-additives").click();
    await expect(page.locator("#supply-draft-count")).toHaveText("0 / 1");
    await showPageItem(page, '.additive-input[value="gelatin"]');
    await page.locator('.additive-input[value="gelatin"]').click();
    await page.locator('#confirm-supply').click();
    expect((await settings()).additives).toEqual(["gelatin"]);
    await page.locator("#choose-additives").click();
    await expect(page.locator('.additive-input[value="gelatin"]')).toBeVisible();
    await expect(page.locator('.additive-input[value="gelatin"]')).toBeChecked();
    await noOverflow(page, "#supply-dialog");
    await page.screenshot({ path: `qa/添加剂统一选择界面-${width}.png` });
    await page.locator('[data-remove-supply]').click();
    await expect(page.locator("#supply-draft-count")).toHaveText("0 / 1");
    await page.locator('#confirm-supply').click();
    expect((await settings()).additives).toEqual([]);
    expect(errors).toEqual([]);
  });
