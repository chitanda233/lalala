import { test, expect } from "@playwright/test";
import {
  setWater,
  setCompletedRounds,
  chooseToilet,
  startRound,
  chooseMeal,
  chooseDrink,
  chooseAdditives,
  armSpecimen,
  applyIdealRecipe,
} from "./helpers.js";

const storageKey = "lalala-dev";

test("food, drinks and toilet equipment survive a running-session reload", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let draw = 0;
    Math.random = () => (++draw % 2 === 0 ? 0.999999 : 0.5);
  });
  await page.goto("/");
  await setCompletedRounds(page, 40);
  await expect(page.locator("#meal-summary .meal-summary-slot")).toHaveCount(3);
  await page.locator("#choose-drinks").click();
  await expect(page.locator("[data-drink]")).toHaveCount(11);
  await page.locator("#confirm-supply").click();
  await page.locator("#choose-additives").click();
  await expect(page.locator(".additive-input")).toHaveCount(18);
  await page.locator("#confirm-supply").click();
  await chooseMeal(page, ["rice"]);
  await setWater(page, "1250");
  await setWater(page, "750");
  await chooseToilet(page, "comfort");
  await chooseToilet(page, "golden");
  await expect(page.locator("#bathroom-scene")).toHaveAttribute(
    "data-toilet",
    "golden",
  );
  await chooseDrink(page, "coffee");
  await expect(page.locator("#drink-summary")).toHaveText("一杯咖啡");
  await chooseDrink(page, "water");

  await armSpecimen(page, "gold", 4);
  await startRound(page);
  await expect(page.locator("#choose-toilet")).toBeDisabled();
  await expect(page.locator("#choose-drinks")).toBeDisabled();
  const session = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)).session,
    storageKey,
  );
  expect(session.outcome.characterId).toBe("gold");
  await page.reload();
  await expect(page.locator("#bathroom-scene")).toHaveAttribute("data-toilet", "golden");
  await expect(page.locator("#choose-toilet")).toBeDisabled();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).session,
      storageKey,
    ),
  ).toEqual(session);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 6000 });
  await expect(page.locator("#result-name")).toHaveText("黄金传说");
  await expect(page.locator("#result-type")).toContainText("4 型");
  await expect(page.locator("#result-toilet")).toHaveText("黄金马桶");
  await page.screenshot({ path: "qa/modules-result.png", fullPage: true });
  await page.locator("#play-again").click();
  await page.reload();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).total,
      storageKey,
    ),
  ).toBe(41);
  await page.screenshot({ path: "qa/modules-desktop.png", fullPage: true });
});

test("explicit coffee settings reload while mobile equipment stays usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          total: 3,
          settings: {
            foodIds: ["toast"],
            drinkId: "coffee",
            water: 750,
            additives: ["probiotic"],
          },
        }),
      ),
    storageKey,
  );
  await page.reload();
  await expect(page.locator("#drink-summary")).toHaveText("一杯咖啡");
  await expect(page.locator("#additive-summary")).toHaveText("益生菌");
  await expect(page.locator("#meal-summary")).toContainText("白吐司");
  await chooseToilet(page, "comfort");
  await page.reload();
  await expect(page.locator("#bathroom-scene")).toHaveAttribute("data-toilet", "comfort");
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    storageKey,
  );
  expect(saved.version).toBe(6);
  expect(saved.settings.drinkId).toBe("coffee");
  expect(saved.settings.additives).toEqual(["probiotic"]);
  expect(saved.individuals).toEqual([]);
  expect(saved.toilets.equipped).toBe("comfort");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "qa/modules-mobile.png", fullPage: true });
});

test("two tabs finish the same active session without granting duplicate discoveries", async ({
  page,
  context,
}) => {
  await page.goto("/");

  await startRound(page);
  const other = await context.newPage();
  await other.goto("/");
  await expect(other.locator("#start-button")).toBeDisabled();
  await expect
    .poll(
      () =>
        page.evaluate(
          (key) => JSON.parse(localStorage.getItem(key)).total,
          storageKey,
        ),
      { timeout: 6000 },
    )
    .toBe(1);
  await expect(page.locator("#start-button")).toBeEnabled();
  await expect(other.locator("#start-button")).toBeEnabled();
  const saved = await other.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    storageKey,
  );
  expect(saved.total).toBe(1);
  expect(saved.individuals).toHaveLength(1);
  expect(saved.session).toBeNull();
});

test("a matching green recipe with the golden toilet still usually produces an ordinary collectible", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.goto("/");
  await setCompletedRounds(page, 40);
  await applyIdealRecipe(page, "garden", ["probiotic"]);
  await chooseToilet(page, "golden");

  await startRound(page);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 4000 });
  await expect(page.locator("#result-name")).toHaveText("森林小精灵");
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    storageKey,
  );
  expect(saved.individuals.map((entry) => entry.characterId)).toEqual([
    "garden",
  ]);
});
