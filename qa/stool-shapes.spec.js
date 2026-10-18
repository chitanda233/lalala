import { test, expect } from "@playwright/test";
import { chooseMeal, chooseDrink, armSpecimen, startRound, chooseSpecimen } from "./helpers.js";
import { referenceStoolAssets } from "../src/content/stool-art-assets.js";
import { stoolRecipeByCharacterId } from "../src/content/stool-recipes.js";

// Compare opaque bodies, ignoring the shared soft contact shadow and palette.
test("liquid silhouettes differ at phone card size and sprites stay within their canvas", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { characters } = await import("/src/content/specimens.js");
    const { referenceStoolAssets } = await import("/src/content/stool-art-assets.js");
    const masks = {};
    const clipped = [];
    for (const item of characters.filter(item => item.homeType >= 5)) {
      const image = new Image();
      const reference=referenceStoolAssets[item.id];
      image.src = reference || `/assets/stools/${item.id}-${item.homeType}.png`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 96;
      const context = canvas.getContext("2d");
      const inset=reference ? 96*12/320 : 0;
      context.drawImage(image, inset, inset, 96-inset*2, 96-inset*2);
      const { data } = context.getImageData(0, 0, 96, 96);
      const mask = Array.from({ length: 96 * 96 }, (_, i) => data[i * 4 + 3] > 240);
      masks[item.id] = mask;
      if (mask.some((on, i) => on && (i % 96 < 2 || i % 96 > 93 || i < 192 || i >= 96 * 94))) clipped.push(item.id);
    }
    const overlap = (a, b) => {
      let intersection = 0, union = 0;
      a.forEach((on, i) => { if (on && b[i]) intersection++; if (on || b[i]) union++; });
      return intersection / union;
    };
    const liquids = characters.filter(item => item.homeType === 7).map(item => item.id);
    return {
      clipped,
      liquids,
      comparisons: ['pancake','ink-black','bubbly','jet'].flatMap((a, i, ids) => ids.slice(i + 1).map(b => [a, b, overlap(masks[a], masks[b])])),
      softPaste: overlap(masks["soft-pillows"], masks["mashed-potato"]),
    };
  });
  expect(result.clipped).toEqual([]);
  expect(result.liquids).toHaveLength(10);
  for (const [a, b, overlap] of result.comparisons)
    expect(overlap, `${a} vs ${b} silhouette overlap`).toBeLessThan(.75);
  expect(result.softPaste).toBeLessThan(.65);
});

for (const [width, height] of [[320, 640], [402, 760]])
  test(`all four liquid shapes reveal, persist and fit the collection at ${width} × ${height}`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => { if (response.status() >= 400) errors.push(response.url()); });
    await page.goto("/");
    for (const id of ["pancake", "ink-black", "bubbly", "jet"]) {
      const recipe=stoolRecipeByCharacterId[id];
      const force={low:20,medium:50,high:90}[recipe.forceZone];
      await chooseMeal(page, recipe.foodIds);
      await chooseDrink(page, recipe.drinkId);
      await page.evaluate(force => {
        const save = JSON.parse(localStorage.getItem("lalala-dev"));
        save.settings.force = force;
        localStorage.setItem("lalala-dev", JSON.stringify(save));
      }, force);
      await armSpecimen(page, id, 7);
      await startRound(page, force);
      await expect(page.locator("#result-dialog")).toBeVisible();
      await expect(page.locator("#result-character > svg")).toHaveAttribute("data-specimen", `${id}:7`);
      await page.locator("#play-again").click();
    }
    await page.reload();
    await page.locator("#collection-button").click();
    for (const id of ["pancake", "ink-black", "bubbly", "jet"]) {
      await chooseSpecimen(page, `${id}:7`);
      await expect(page.locator("#collection-detail")).toContainText("固定归类 7 型");
      await expect(page.locator(".individual-art > svg image").first()).toHaveAttribute("href", referenceStoolAssets[id] || `/assets/stools/${id}-7.png`);
      expect(await page.locator("#collection-dialog").evaluate(el => el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth)).toBe(true);
    }
    await page.screenshot({ path: `qa/liquid-shapes-${width}.png` });
    expect(errors).toEqual([]);
  });
