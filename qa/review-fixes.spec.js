import { test, expect } from "@playwright/test";
import { chooseSpecimen, chooseMeal, startRound } from "./helpers.js";

test("collection shows zero for an unreachable ordinary target and a rare removed from its theme group", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const { stoolRecipeByCharacterId } = await import("/src/content/stool-recipes.js");
    const { additiveById } = await import("/src/content/catalog.js");
    Object.assign(stoolRecipeByCharacterId.classic, { water: 0, digestionTime: "8" });
    additiveById["gold-leaf"].rareTargets = ["crystal"];
  });
  await page.locator("#collection-button").click();
  await page.locator("#collection-preview-all").check();
  await chooseSpecimen(page, "classic:4");
  await page.locator('[data-detail-panel="recipe"]').click();
  const ordinary = page.locator('[data-recipe-for="classic"]');
  await expect(ordinary).toContainText("未中稀有后 0% · 整局 0.0%");
  await expect(ordinary).toContainText("益生菌：普通分支 0% · 整局 0%");
  await expect(ordinary).toContainText("当前主结果：按摩珠珠串");
  await chooseSpecimen(page, "gold:4");
  await page.locator('[data-detail-panel="recipe"]').click();
  await expect(page.locator('[data-recipe-for="gold"]')).toContainText("使用主题添加剂：本款 0.00%");
  await expect(page.locator('[data-recipe-for="gold"]')).toContainText("本款不在当前目标组");
});

test("a saved configuration with no legal ordinary candidate cancels safely without a reward or page error", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/");
  await page.evaluate(async () => {
    const { characters } = await import("/src/content/specimens.js");
    for (const c of characters.filter(c => c.generation)) c.generation.sources.foods = ["enoki"];
  });
  await page.locator("#start-button").click();
  await page.locator("#start-button").click();
  await expect(page.locator("#start-button")).toHaveAttribute("data-phase", "idle");
  await expect(page.locator("#saved-note")).toContainText("没有满足来源条件的普通形态");
  await expect(page.locator("#result-dialog")).not.toBeVisible();
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem("lalala-dev")));
  expect(save.total).toBe(0);
  expect(save.individuals).toEqual([]);
  expect(save.session).toBeNull();
  await chooseMeal(page, ["enoki"]);
  await expect(page.locator("#saved-note")).not.toContainText("本次未生成");
  await startRound(page);
  await expect(page.locator("#result-dialog")).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("lalala-dev")).total)).toBe(1);
  expect(errors).toEqual([]);
});

test("rasterized ordinary reference bodies really change colour while corn and pale enoki remain visible", async ({ page }) => {
  await page.goto("/");
  const results = await page.evaluate(async () => {
    const { characterById } = await import("/src/content/catalog.js");
    const { characterSvg } = await import("/src/ui/artwork/stools.js");
    async function pixels(svg) {
      const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
      doc.documentElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      for (const node of doc.querySelectorAll("image")) {
        const blob = await (await fetch(node.getAttribute("href"))).blob();
        const reader = new FileReader();
        const data = await new Promise(resolve => { reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob); });
        node.setAttribute("href", data);
      }
      const img = new Image();
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(doc))));
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 320;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, 320, 320);
      return ctx.getImageData(0, 0, 320, 320).data;
    }
    const results = [];
    for (const id of ["enoki-jet", "corn-cannon"]) {
      const original = await pixels(characterSvg(characterById[id], false, 7, "classic"));
      const ink = await pixels(characterSvg(characterById[id], false, 7, "ink"));
      let changedBody = 0, foodPixels = 0, preservedFood = 0;
      for (let i = 0; i < original.length; i += 4) {
        const [r, g, b, a] = original.slice(i, i + 4);
        if (a < 220) continue;
        const delta = Math.abs(r - ink[i]) + Math.abs(g - ink[i + 1]) + Math.abs(b - ink[i + 2]);
        if (r > g * 1.4 && r > b * 1.4 && delta > 30) changedBody++;
        const food = id === "corn-cannon" ? r > 120 && g > 100 && g > b * 1.8 && r < g * 1.3 : r > 170 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20;
        if (food) { foodPixels++; if (delta < 10) preservedFood++; }
      }
      results.push({ id, changedBody, foodPixels, preservedFood });
    }
    return results;
  });
  for (const r of results) {
    expect(r.changedBody, r.id).toBeGreaterThan(1000);
    expect(r.foodPixels, r.id).toBeGreaterThan(10);
    expect(r.preservedFood / r.foodPixels, r.id).toBeGreaterThan(.8);
  }
});
