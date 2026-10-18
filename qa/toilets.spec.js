import { test, expect } from "@playwright/test";
import { chooseToilet, setCompletedRounds, startRound } from "./helpers.js";

const savedToilets = (page) => page.evaluate(() => {
  const save = JSON.parse(localStorage.getItem("lalala-dev"));
  return { ...save.toilets, setting: save.settings.toiletId };
});

test("browse every toilet, show unlock conditions immediately, cancel previews and confirm with 蹲它", async ({ page }) => {
  await page.goto("/");
  const before = await savedToilets(page);
  expect(before.owned).toEqual(["standard", "squat", "stone"]);
  await page.locator(".bathroom-illustration").click();
  await expect(page.locator("#confirm-toilet")).toHaveText("正在使用");
  await expect(page.locator("#toilet-availability")).not.toBeVisible();
  await page.locator("#toilet-next").click();
  await expect(page.locator("#equipment-title")).toHaveText("薄荷舒享马桶");
  await expect(page.locator("#confirm-toilet")).toHaveClass(/locked/);
  await expect(page.locator("#confirm-toilet")).toBeEnabled();
  await expect(page.locator("#toilet-lock-icon")).toBeVisible();
  await expect(page.locator("#toilet-availability")).toHaveText("累计完成 3 次后解锁（当前 0 次）");
  await page.locator("#confirm-toilet").click();
  await expect(page.locator("#equipment-dialog")).toBeVisible();
  expect(await savedToilets(page)).toEqual(before);
  await page.locator("#equipment-dialog [data-close]").click();

  await page.locator("#choose-toilet").click();
  await expect(page.locator("#equipment-dialog")).toHaveAttribute("data-preview", "standard");
  for (let index = 0; index < 6; index++) await page.locator("#toilet-next").click();
  await expect(page.locator("#equipment-title")).toHaveText("经典蹲坑");
  await expect(page.locator("#confirm-toilet")).toHaveText("蹲它");
  await expect(page.locator("#toilet-availability")).not.toBeVisible();
  await expect(page.locator("#toilet-lock-icon")).not.toBeVisible();
  expect(await savedToilets(page)).toEqual(before);
  await page.keyboard.press("Escape");
  expect(await savedToilets(page)).toEqual(before);
  await chooseToilet(page, "squat");
  await page.reload();
  expect(await savedToilets(page)).toEqual({ ...before, equipped: "squat", setting: "squat" });
});

test("finishing the threshold round unlocks a toilet without equipping it", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await setCompletedRounds(page, 2);
  await chooseToilet(page, "squat");
  expect((await savedToilets(page)).owned).not.toContain("comfort");
  await startRound(page);
  await expect(page.locator("#result-dialog")).toBeVisible();
  await expect(page.locator("#result-new")).toContainText("解锁 1 款新马桶");
  expect(await page.locator("#result-dialog").evaluate((el) =>
    el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth,
  )).toBe(true);
  const after = await savedToilets(page);
  expect(after.owned).toContain("comfort");
  expect(after.equipped).toBe("squat");
  expect(after.setting).toBe("squat");
  await page.locator("#play-again").click();
  await page.reload();
  await chooseToilet(page, "comfort");
  await page.reload();
  expect((await savedToilets(page)).equipped).toBe("comfort");
});
