import { test, expect } from "@playwright/test";
import {
  chooseMeal,
  chooseAdditives,
  setWater,
  armSpecimen,
  startRound,
  chooseSpecimen,
  applyIdealRecipe,
  setCompletedRounds,
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
  await setCompletedRounds(page, 40);
  const examples = ["pebble", "segmented", "cracked", "classic", "soft-pillows", "mashed-potato", "jet"];
  const recorded = [];
  const artwork = new Set();
  for (const [index, id] of examples.entries()) {
    const type = index + 1;
    const { force } = await applyIdealRecipe(page, id);
    const candidate = await armSpecimen(page, id, type, force);
    await startRound(page, force);
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

test("an identical result merges its prior record while retaining total and discovery", async ({
  page,
}) => {
  await page.goto("/");
  await applyIdealRecipe(page, "classic");
  const ids = [];
  for (let i = 0; i < 2; i++) {
    await armSpecimen(page, "classic", 4);
    await startRound(page);
    await expect(page.locator("#result-dialog")).toBeVisible();
    ids.push(await page.evaluate(() => JSON.parse(localStorage.getItem("lalala-dev")).individuals[0].id));
    await page.locator("#play-again").click();
  }
  await page.reload();
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem("lalala-dev")));
  expect(save.total).toBe(2);
  expect(save.individuals).toHaveLength(1);
  expect(ids[0]).not.toBe(ids[1]);
  expect(save.individuals[0].id).toBe(ids[1]);
  expect(save.individuals[0].occurrenceCount).toBe(2);
  await page.locator("#collection-button").click();
  await chooseSpecimen(page, "classic:4");
  await expect(page.locator("[data-individual]")).toHaveAttribute("data-individual", ids[1]);
  await expect(page.locator("[data-individual-next]")).toHaveCount(0);

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
