import { test, expect } from "@playwright/test";

const activeSession = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("lalala-dev")).session);

for (const width of [1440, 390, 320])
  test(`button stays in place through start and stop, then reveals in 400ms at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const now = new Date("2026-10-17T10:00:00Z");
    await page.clock.install({ time: now });
    await page.clock.pauseAt(new Date(now.getTime() + 1000));
    const button = page.locator("#start-button");
    await button.scrollIntoViewIfNeeded();
    const before = await button.boundingBox();
    const scroll = await page.evaluate(() => scrollY);
    await button.click();
    await expect(page.locator("#force-meter")).toBeVisible();
    await page.clock.runFor(750);
    const aiming = await button.boundingBox();
    expect(aiming.x).toBeCloseTo(before.x, 0);
    expect(aiming.y).toBeCloseTo(before.y, 0);
    expect(await page.evaluate(() => scrollY)).toBe(scroll);
    await button.click();
    await expect(button).toHaveAttribute("data-phase", "running");
    const locked = await button.boundingBox();
    expect(locked.x).toBeCloseTo(before.x, 0);
    expect(locked.y).toBeCloseTo(before.y, 0);
    expect(await page.evaluate(() => scrollY)).toBe(scroll);
    const session = await activeSession(page);
    expect(session.endsAt - session.lockedAt).toBe(400);
    await page.clock.runFor(350);
    await expect(page.locator("#result-dialog")).not.toBeVisible();
    await page.clock.runFor(100);
    await expect(page.locator("#result-dialog")).toBeVisible();
  });

test("start reveals a repeating pointer, stop locks its force, and refresh preserves both phases", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.clock.install();
  await expect(page.locator("#force-meter")).toBeHidden();
  await expect(page.locator("#pace-select")).toHaveCount(0);

  await page.locator("#start-button").click();
  await expect(page.locator("#force-meter")).toBeVisible();
  await expect(page.locator("#start-button")).toHaveText("停止");
  await expect(page.locator("#start-button")).toBeEnabled();
  await expect(page.locator("#water")).toBeDisabled();
  await expect(page.locator("#session-progress")).toHaveCount(0);
  const aiming = await activeSession(page);
  expect(aiming.phase).toBe("aiming");
  expect(aiming.outcome).toBeNull();
  expect(aiming.force).toBeNull();
  await page.clock.runFor(1200);
  const right = Number(
    await page.locator("#force-track").getAttribute("aria-valuenow"),
  );
  await page.clock.runFor(1000);
  const left = Number(
    await page.locator("#force-track").getAttribute("aria-valuenow"),
  );
  expect(right).toBeGreaterThan(65);
  expect(left).toBeLessThan(right);
  await expect(page.locator("#result-dialog")).not.toBeVisible();
  await page.reload();
  expect(await activeSession(page)).toEqual(aiming);
  await expect(page.locator("#start-button")).toHaveText("停止");
  await page.locator("#start-button").click();
  await expect(page.locator("#force-meter")).toHaveClass(/locked/);
  const locked = await activeSession(page);
  expect(locked.phase).toBe("running");
  expect(locked.force).toBeGreaterThanOrEqual(0);
  expect(locked.force).toBeLessThanOrEqual(100);
  expect(locked.outcome.individualId).toBe(aiming.id);
  await page.reload();
  expect(await activeSession(page)).toEqual(locked);
  await page.clock.runFor(2200);
  await expect(page.locator("#result-dialog")).toBeVisible();
  await expect(page.locator("#result-additives")).toContainText(
    `力度 ${locked.force}/100`,
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("lalala-dev")),
  );
  expect(saved.individuals).toHaveLength(1);
  expect(saved.individuals[0].recipe.force).toBe(locked.force);
  await page.locator("#play-again").click();
  await expect(page.locator("#force-meter")).toBeHidden();
  await expect(page.locator("#start-button")).toHaveText("开始拉屎");
  expect(errors).toEqual([]);
});

test("320px keyboard start and stop retain accessible force controls without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  await page.locator("h1").click();
  await page.keyboard.press("Space");
  await expect(page.locator("#force-meter")).toBeVisible();
  await page.screenshot({ path: "qa/force-mobile.png" });
  await expect(page.locator("#force-track")).toHaveAttribute("role", "meter");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Space");
  await expect(page.locator("#start-button")).toBeDisabled();
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 5000 });
});
