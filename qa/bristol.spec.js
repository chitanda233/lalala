import { test, expect } from "@playwright/test";

const storageKey = "lalala-save-v1";

test("all seven forms produce distinct illustrations and persist in the classified collection", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const examples = [
    { type: 1, recipe: "balanced", water: 500, name: "颗粒硬块型" },
    { type: 2, recipe: "balanced", water: 1000, name: "结块条状型" },
    { type: 3, recipe: "carbs", water: 1500, name: "表面开裂型" },
    { type: 4, recipe: "balanced", water: 1500, name: "光滑柔软型" },
    { type: 5, recipe: "spicy", water: 1500, name: "边缘清晰软块型" },
    { type: 6, recipe: "spicy", water: 1750, name: "松散糊状型" },
    { type: 7, recipe: "spicy", water: 2250, name: "无固体水样型" },
  ];
  const illustrations = new Set();
  for (const example of examples) {
    await page.locator(`[data-recipe="${example.recipe}"]`).click();
    await page.locator("#water").fill(String(example.water));
    await expect(page.locator("#forecast-type")).toHaveText(
      `${example.type} 型 · ${example.name}`,
    );
    await page.locator('[data-duration="2"]').click();
    await page.locator("#start-button").click();
    await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 4000 });
    await expect(page.locator("#result-type")).toHaveText(
      `布里斯托 ${example.type} 型 · ${example.name}`,
    );
    await expect(page.locator("#result-character svg")).toHaveAttribute(
      "aria-label",
      new RegExp(`布里斯托 ${example.type} 型`),
    );
    illustrations.add(await page.locator("#result-character").innerHTML());
    if (example.type === 7)
      await page.screenshot({
        path: "qa/bristol-result.png",
        fullPage: true,
        animations: "disabled",
      });
    await page.locator("#play-again").click();
  }
  expect(illustrations.size).toBe(7);
  await page.reload();
  await expect(page.locator("#collection-count")).toHaveText("07");
  await page.locator("#collection-button").click();
  await expect(page.locator("#collection-total")).toHaveText("7 / 7 型");
  await expect(page.locator(".bristol-card.discovered")).toHaveCount(7);
  await page.screenshot({
    path: "qa/bristol-collection.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.locator('[data-type-filter="hard"]').click();
  await expect(page.locator(".bristol-card")).toHaveCount(2);
  await expect(
    page.locator('.bristol-card[data-bristol-type="1"]'),
  ).toBeVisible();
  await page.locator('[data-type-filter="formed"]').click();
  await expect(page.locator(".bristol-card")).toHaveCount(2);
  await expect(
    page.locator('.bristol-card[data-bristol-type="4"]'),
  ).toBeVisible();
  await page.locator('[data-type-filter="loose"]').click();
  await expect(page.locator(".bristol-card")).toHaveCount(3);
  await page.locator('[data-collection-view="characters"]').click();
  await expect(
    page
      .locator("#characters-panel .collection-item")
      .filter({ hasText: "火山小辣椒" })
      .locator(".character-types"),
  ).toHaveText("5 型6 型7 型");
  expect(errors).toEqual([]);
});

test("old character collections remain intact and new form discoveries are recorded independently", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          collection: ["garden", "gold"],
          total: 3,
          settings: {
            recipe: "garden",
            water: 1750,
            additives: ["probiotic"],
            duration: "2",
          },
        }),
      ),
    storageKey,
  );
  await page.reload();
  await page.locator("#collection-button").click();
  await expect(page.locator("#collection-total")).toHaveText("0 / 7 型");
  await page.locator('[data-collection-view="characters"]').click();
  await expect(page.locator("#collection-total")).toHaveText("2 / 8");
  await expect(page.locator(".type-pending")).toHaveCount(2);
  await page.keyboard.press("Escape");
  await page.locator("#start-button").click();
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 4000 });
  await expect(page.locator("#result-name")).toHaveText("黄金传说");
  await expect(page.locator("#result-type")).toContainText("4 型");
  await page.locator("#play-again").click();
  await page.locator("#collection-button").click();
  await expect(page.locator("#collection-total")).toHaveText("2 / 8");
  await page.locator('[data-collection-view="forms"]').click();
  await expect(page.locator("#collection-total")).toHaveText("1 / 7 型");
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    storageKey,
  );
  expect(saved.total).toBe(4);
  expect(saved.collection).toEqual(["garden", "gold"]);
  expect(saved.specimens).toEqual([{ type: 4, characterId: "gold" }]);
});

test("mobile form collection fits the viewport and tabs support keyboard navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#collection-button").click();
  await expect(page.locator(".bristol-card")).toHaveCount(7);
  await page.screenshot({
    path: "qa/bristol-mobile.png",
    animations: "disabled",
  });
  await page.locator(".classification-source").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "qa/bristol-mobile-bottom.png",
    animations: "disabled",
  });
  expect(
    await page
      .locator("#collection-dialog")
      .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
  ).toBe(true);
  await page.locator("#forms-tab").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#characters-tab")).toBeFocused();
  await expect(page.locator("#characters-panel")).toBeVisible();
  await page.keyboard.press("Home");
  await expect(page.locator("#forms-tab")).toBeFocused();
  await expect(page.locator("#bristol-panel")).toBeVisible();
  await expect(page.locator(".classification-source a")).toHaveAttribute(
    "href",
    "https://my.clevelandclinic.org/health/articles/bristol-stool-chart",
  );
});
