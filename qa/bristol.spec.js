import { test, expect } from "@playwright/test";
import {
  chooseMeal,
  chooseAdditives,
  setWater,
  armSpecimen,
  startRound,
  chooseSpecimen,
} from "./helpers.js";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
});
test("all seven concrete forms persist in one classification and can be paged without scrolling", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 402, height: 874 });
  await page.goto("/");
  const examples = [
    [1, "rice", 500],
    [2, "rice", 1000],
    [3, "rice", 1250],
    [4, "rice", 1500],
    [5, "banana", 1500],
    [6, "hotpot", 1500],
    [7, "hotpot", 2250],
  ];
  const recorded = [];
  const artwork = new Set();
  for (const [type, food, water] of examples) {
    await chooseMeal(page, [food]);
    await chooseAdditives(page, type === 7 ? ["chili"] : []);
    await setWater(page, water);
    const candidate = await armSpecimen(page, null, type);
    await startRound(page);
    await expect(page.locator("#result-dialog")).toBeVisible();
    await expect(page.locator("#result-type")).toContainText(`${type} 型`);
    artwork.add(await page.locator("#result-character").innerHTML());
    recorded.push(candidate);
    await page.locator("#play-again").click();
  }
  expect(artwork.size).toBe(7);
  await page.reload();
  await page.locator("#collection-button").click();
  await expect(page.locator("#collection-total")).toHaveText("7 / 7 型");
  for (const candidate of recorded) {
    await chooseSpecimen(page, candidate.specimenId);
    await expect(page.locator("#collection-detail")).toContainText(
      candidate.name,
    );
    await expect(page.locator("#collection-detail")).toContainText(
      `固定归类 ${candidate.type} 型`,
    );
    expect(
      await page
        .locator("#collection-dialog")
        .evaluate((el) => el.scrollHeight <= el.clientHeight),
    ).toBe(true);
  }
});

test("same collectible keeps independent records and paged individual identities after reload", async ({
  page,
}) => {
  await page.goto("/");
  for (let i = 0; i < 2; i++) {
    await armSpecimen(page, "classic", 4);
    await startRound(page);
    await expect(page.locator("#result-dialog")).toBeVisible();
    await page.locator("#play-again").click();
  }
  await page.reload();
  await page.locator("#collection-button").click();
  await chooseSpecimen(page, "classic:4");
  await expect(page.locator("#collection-detail")).toContainText(
    "已收集 2 个体",
  );
  const latest = await page
    .locator("[data-individual]")
    .getAttribute("data-individual");
  await page.locator("[data-individual-next]").click();
  const first = await page
    .locator("[data-individual]")
    .getAttribute("data-individual");
  expect(first).not.toBe(latest);
  await expect(page.locator("#collection-detail")).toContainText(
    "2 / 2 个独立个体",
  );
});

test("phone taxonomy filters are keyboard accessible and every unknown remains a silhouette", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await page.locator("#collection-button").click();
  await expect(page.locator("[data-stool]")).toHaveCount(56);
  await page.locator('[data-type-filter="all"]').focus();
  await page.keyboard.press("Tab");
  await expect(page.locator('[data-type-filter="1"]')).toBeFocused();
  await page.keyboard.press("Enter");
  expect(
    await page
      .locator("[data-stool]")
      .evaluateAll((items) =>
        items.every((item) => item.dataset.stool.endsWith(":1")),
      ),
  ).toBe(true);
  const unknown = await page
    .locator(".stool-art")
    .evaluateAll((items) => items.map((item) => item.innerHTML));
  expect(new Set(unknown).size).toBe(1);
  expect(
    await page
      .locator("#collection-dialog")
      .evaluate(
        (el) =>
          el.scrollHeight <= el.clientHeight &&
          el.scrollWidth <= el.clientWidth,
      ),
  ).toBe(true);
});
