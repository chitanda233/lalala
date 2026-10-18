import { test, expect } from "@playwright/test";
import { chooseSpecimen, chooseAdditives, startRound } from "./helpers.js";

test("seven recent unique species retain cumulative unlocks and replace repeated births", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 760 });
  await page.addInitScript(() => { Math.random = () => .5; });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  const archivedId = await page.evaluate(async () => {
    const { specimenBlueprints } = await import("/src/content/specimen-blueprints.js");
    const { classifySpecimen } = await import("/src/game/specimen.js");
    const { rollOutcome } = await import("/src/game/drops.js");
    const save = JSON.parse(localStorage.getItem("lalala-dev"));
    const appearance = rollOutcome({}, () => .5).appearance;
    const species = specimenBlueprints.slice(0, 9);
    save.individuals = [...species, species.at(-1)].map((blueprint, index) => ({
      id: `retention-fixture-${index + 1}`, sequence: index + 1,
      specimenId: blueprint.id, characterId: blueprint.characterId,
      morphology: blueprint.morphology, type: classifySpecimen(blueprint),
      createdAt: (index + 1) * 1000, marks: [], colorId: "classic",
      appearance: { ...appearance, variationSeed: index + 1 },
    }));
    save.total = 10;
    save.version = 5;
    delete save.discoveredSpecimens;
    localStorage.setItem("lalala-dev", JSON.stringify(save));
    return species[0].id;
  });
  await page.reload();
  const readSave = () => page.evaluate(() => JSON.parse(localStorage.getItem("lalala-dev")));
  const loaded = await readSave();
  expect(loaded.individuals).toHaveLength(7);
  expect(new Set(loaded.individuals.map(entry => entry.specimenId)).size).toBe(7);
  expect(loaded.individuals.map(entry => entry.sequence)).toEqual([3, 4, 5, 6, 7, 8, 10]);
  expect(loaded.discoveredSpecimens).toHaveLength(9);
  expect(loaded.total).toBe(10);
  await page.locator("#collection-button").click();
  await expect(page.locator("#collection-summary")).toHaveText("畅快 10 次 · 9 / 56 种便便 · 保留 7 个独立个体");
  await chooseSpecimen(page, archivedId);
  await expect(page.locator(`[data-stool="${archivedId}"]`)).toHaveClass(/collected/);
  await expect(page.locator("[data-discovered]")).toContainText("暂无保留个体");
  await page.locator('[data-detail-panel="recipe"]').click();
  await expect(page.locator("[data-recipe-for]")).toContainText("固定配方");
  await page.locator('[data-detail-panel="source"]').click();
  await expect(page.locator("[data-source-for]")).toContainText("来源条件");
  await page.getByRole("button", { name: "关闭图鉴", exact: true }).click();
  await chooseAdditives(page, ["probiotic"]);
  let previous;
  for (let round = 0; round < 2; round++) {
    await startRound(page, 50);
    await expect(page.locator("#result-dialog")).toBeVisible();
    const saved = await readSave();
    expect(saved.total).toBe(11 + round);
    expect(saved.individuals).toHaveLength(7);
    expect(saved.discoveredSpecimens).toHaveLength(9);
    expect(saved.individuals.at(-1).specimenId).toBe(archivedId);
    expect(saved.individuals.at(-1).sequence).toBe(11 + round);
    if (previous) {
      expect(saved.individuals.slice(0, -1)).toEqual(previous.individuals.slice(0, -1));
      expect(saved.individuals.at(-1).id).not.toBe(previous.individuals.at(-1).id);
    }
    previous = saved;
    await page.locator("#play-again").click();
  }
  await page.reload();
  expect(await readSave()).toEqual(previous);
  await page.locator("#collection-button").click();
  await chooseSpecimen(page, archivedId);
  await expect(page.locator("[data-individual]")).toContainText("个体 #012");
  await expect(page.locator("[data-individual-prev], [data-individual-next]")).toHaveCount(0);
  expect(await page.locator("#collection-dialog").evaluate(dialog => dialog.scrollHeight <= dialog.clientHeight && dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
  await page.screenshot({ path: "qa/最新七个去重个体.png" });
  expect(errors).toEqual([]);
});
