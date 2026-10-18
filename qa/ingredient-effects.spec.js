import { test, expect } from "@playwright/test";
import {
  chooseSpecimen,
  focusFood,
  startRound,
  chooseMeal,
  chooseDrink,
  chooseAdditives,
  armSpecimen,
} from "./helpers.js";
import { bristolTypes } from "../src/content/stools.js";
const key = "lalala-dev";

test("food-specific effects appear in the picker", async ({ page }) => {
  await page.goto("/");
  await page.locator("#choose-foods").click();
  await focusFood(page, "enoki");
  await expect(page.locator("#food-details")).toContainText("形态保留度 7/7");
});

test("three-food enoki signature survives a running reload, pigment, decoration and collection", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.goto("/");
  await chooseMeal(page, ["banana", "enoki", "burger"]);
  await chooseDrink(page, "prune-juice");
  await chooseAdditives(page, ["glitter"]);

  await startRound(page);
  const before = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)).session,
    key,
  );
  expect(before.outcome.marks).toEqual(["enoki"]);
  expect(before.outcome.colorId).toBe("berry");
  await page.reload();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).session,
      key,
    ),
  ).toEqual(before);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 6000 });
  await expect(page.locator("#result-character svg")).toHaveAttribute(
    "data-marks",
    "enoki",
  );
  await expect(page.locator("#result-character svg")).toHaveAttribute(
    "data-tint",
    "#9b7ca6",
  );
  await expect(
    page.locator('#result-character image[href$="-enoki.png"]'),
  ).toHaveCount(1);
  await expect(page.locator("#result-rarity")).toContainText("金针菇印记");
  await page.locator("#result-explanation summary").click();
  await expect(page.locator("#result-reasons")).toContainText(
    "可见金针菇细丝状印记",
  );
  await page.screenshot({
    path: "qa/enoki-mixed-result.png",
    animations: "disabled",
  });
  await page.locator("#play-again").click();
  await page.reload();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    key,
  );
  expect(saved.individuals).toContainEqual(
    expect.objectContaining({
      type: before.outcome.type,
      characterId: before.outcome.characterId,
      marks: before.outcome.marks,
      appearance: before.outcome.appearance,
    }),
  );
  await page.locator("#collection-button").click();
  const card = page.locator(
    `[data-stool="${before.outcome.characterId}:${before.outcome.type}"]`,
  );
  await expect(card.locator(".stool-art svg")).toHaveAttribute(
    "data-marks",
    "enoki",
  );
  await chooseSpecimen(page, before.outcome.specimenId);
  await expect(page.locator("#collection-detail")).toContainText("金针菇印记");
  expect(errors).toEqual([]);
});

test("diagnosis describes the physical snapshot without displaying recipe logs", async ({
  page,
}) => {
  await page.goto("/");
  const outcome = await page.evaluate(async (storageKey) => {
    const { createSession } = await import("/src/game/session.js");
    const { normalizeSave } = await import("/src/storage/model.js");
    const session = createSession(
      { foodIds: ["burger"] },
      { now: Date.now() - 10000, random: () => 0.5 },
    );
    session.outcome.reasons = [
      "华莱士汉堡、西梅汁、恒温暖座：1500 mL，影响强度 7。",
    ];
    localStorage.setItem(
      storageKey,
      JSON.stringify(normalizeSave({ session })),
    );
    return session.outcome;
  }, key);
  await page.reload();
  await expect(page.locator("#result-dialog")).toBeVisible();
  await expect(page.locator("#result-type")).toContainText(
    `${outcome.type} 型`,
  );
  await expect(page.locator("#result-description")).toHaveText(
    bristolTypes[outcome.type - 1].assessment,
  );
  await page.locator("#result-explanation summary").click();
  await expect(page.locator("#result-reasons")).toContainText("形态：");
  await expect(page.locator("#result-reasons")).not.toContainText(
    /华莱士汉堡|西梅汁|恒温暖座|影响强度|mL|抽中/,
  );
  await page.screenshot({
    path: "qa/stool-diagnosis-result.png",
    animations: "disabled",
  });
});

test("guaranteed enoki signature remains visible on a real rare-material draw", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await chooseMeal(page, ["enoki"]);
  await chooseAdditives(page, ["gold-leaf"]);

  await armSpecimen(page, "gold", 4);
  await startRound(page);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 4000 });
  await expect(page.locator("#result-name")).toHaveText("黄金传说");
  await expect(page.locator("#result-dialog")).toHaveAttribute(
    "data-rarity",
    "special",
  );
  await expect(page.locator("#result-character svg")).toHaveAttribute(
    "data-marks",
    "enoki",
  );
  await expect(
    page.locator('#result-character image[href$="-enoki.png"]'),
  ).toHaveCount(1);
  expect(
    await page
      .locator("#result-dialog")
      .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth),
  ).toBe(true);
  await page.screenshot({
    path: "qa/enoki-gold-mobile.png",
    animations: "disabled",
  });
});
