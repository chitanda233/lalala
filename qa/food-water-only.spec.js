import { test, expect } from "@playwright/test";

// The closed time input must also disappear from help and result summaries.
test("time controls stay closed while food inputs and the force pointer remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#meal-summary")).not.toBeEmpty();
  for (const id of ["choose-foods", "choose-drinks", "choose-additives"])
    await expect(page.locator(`#${id}`)).toBeVisible();
  await expect(page.locator('#choose-digestion, #digestion-dialog, [data-digestion]')).toHaveCount(0);
  const before = await page.locator("#start-button").boundingBox();
  await page.locator("#help-button").click();
  await expect(page.locator("#help-dialog")).not.toContainText("消化");
  await expect(page.locator("#help-dialog")).toContainText("力度影响同类造型");
  await page.locator('[data-close="help-dialog"]').last().click();
  await page.locator("#start-button").click();
  await expect(page.locator("#start-button")).toHaveAttribute("data-phase", "aiming");
  await expect(page.locator("#force-meter")).toBeVisible();
  await expect(page.locator("#force-value")).toContainText("/ 100");
  const aiming = await page.locator("#start-button").boundingBox();
  expect(aiming.y).toBe(before.y);
  expect(aiming.height).toBe(before.height);
  await page.locator("#start-button").click();
  await expect(page.locator("#result-dialog")).toBeVisible();
  await expect(page.locator("#result-additives")).not.toContainText("消化");
  await page.locator("#play-again").click();
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  expect(errors).toEqual([]);
});
