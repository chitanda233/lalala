import { test, expect } from "@playwright/test";
import {
  chooseSpecimen,
  startRound,
  chooseMeal,
  chooseDrink,
  chooseAdditives,
  armSpecimen,
} from "./helpers.js";

const readSave = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("lalala-dev")));

test("each meal saves an independent visible specimen under exactly one morphology class", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await chooseMeal(page, ["enoki", "corn"]);
  await chooseDrink(page, "prune-juice");
  await chooseAdditives(page, ["glitter"]);

  await armSpecimen(page, "glitter", 4);
  await startRound(page);
  const active = (await readSave(page)).session;
  await page.reload();
  expect((await readSave(page)).session).toEqual(active);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 4000 });
  await expect(page.locator("#result-individual")).toContainText("#001");
  await expect(page.locator("#result-character > svg")).toHaveAttribute(
    "data-specimen",
    "glitter:4",
  );
  await expect(page.locator("#result-character > svg")).toHaveAttribute(
    "data-marks",
    "enoki",
  );
  const first = structuredClone((await readSave(page)).individuals[0]);
  await page.locator("#play-again").click();
  await chooseMeal(page, ["corn"]);
  await chooseDrink(page, "water");
  await armSpecimen(page, "glitter", 4);
  await startRound(page);
  await expect(page.locator("#result-dialog")).toBeVisible({ timeout: 4000 });
  await expect(page.locator("#result-individual")).toContainText("#002");
  const save = await readSave(page);
  expect(save.individuals).toHaveLength(2);
  expect(save.individuals[0]).toEqual(first);
  expect(save.individuals[1].id).not.toBe(first.id);
  expect(save.individuals[1].specimenId).toBe(first.specimenId);
  expect(save.individuals[1].marks).toEqual([]);
  await page.locator("#play-again").click();
  await page.reload();
  await page.locator("#collection-button").click();
  await chooseSpecimen(page, "glitter:4");
  await expect(page.locator("#collection-detail")).toContainText(
    "1 / 2 个独立个体",
  );
  await expect(page.locator("[data-individual]")).toHaveAttribute(
    "data-individual",
    save.individuals[1].id,
  );
  await expect(page.locator(".individual-art > svg")).toHaveAttribute(
    "data-marks",
    "",
  );
  await page.locator("[data-individual-next]").click();
  await expect(page.locator("[data-individual]")).toHaveAttribute(
    "data-individual",
    first.id,
  );
  await expect(page.locator(".individual-art > svg")).toHaveAttribute(
    "data-marks",
    "enoki",
  );
  await expect(page.locator("#collection-detail")).toContainText(
    "固定归类 4 型",
  );
  expect(
    await page
      .locator("#collection-dialog")
      .evaluate(
        (dialog) =>
          dialog.scrollHeight <= dialog.clientHeight &&
          dialog.scrollWidth <= dialog.clientWidth,
      ),
  ).toBe(true);
  await page.screenshot({
    path: "qa/independent-specimens-mobile.png",
    animations: "disabled",
  });
  await page.locator("#collection-back").click();
  await page.locator('[data-type-filter="7"]').click();
  await expect(page.locator('[data-stool="glitter:4"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
