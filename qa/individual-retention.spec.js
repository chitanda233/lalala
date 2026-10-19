import { test, expect } from "@playwright/test";
import { chooseSpecimen } from "./helpers.js";

for (const [width, height] of [[320, 640], [402, 760]])
  test(`standard catalog covers and seven per-species records with merged repeats at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    const fixture = await page.evaluate(async () => {
      const { specimenBlueprints } = await import("/src/content/specimen-blueprints.js");
      const { classifySpecimen } = await import("/src/game/specimen.js");
      const { rollOutcome } = await import("/src/game/drops.js");
      const { characterSvg } = await import("/src/ui/artwork/stools.js");
      const { characterById } = await import("/src/content/catalog.js");
      const save = JSON.parse(localStorage.getItem("lalala-dev"));
      const primary = specimenBlueprints.find(entry => entry.id === "classic:4");
      const other = specimenBlueprints.find(entry => entry.id !== primary.id);
      const archived = specimenBlueprints.find(entry => entry.id !== primary.id && entry.id !== other.id);
      const appearance = rollOutcome({}, () => .5).appearance;
      const item = (blueprint, sequence, variant) => ({
        id: `history-${sequence}`, sequence,
        specimenId: blueprint.id, characterId: blueprint.characterId,
        morphology: blueprint.morphology, type: classifySpecimen(blueprint),
        createdAt: sequence * 1000, marks: ["enoki"], colorId: "berry",
        appearance: { ...appearance, grain: 1 + variant % 7,
          porosity: 1 + Math.floor(variant / 7), variationSeed: sequence,
          decorations: ["glitter"], residues: [{ foodId: "corn", retention: 5 }] },
        recipe: { foodIds: ["rice", "corn", "enoki"], drinkId: "water", water: 1250,
          digestionTime: "4", force: 50, additives: ["glitter"], toiletId: "standard" },
      });
      save.individuals = [
        ...Array.from({ length: 8 }, (_, i) => item(primary, i + 1, i)),
        item(primary, 9, 0),
        ...Array.from({ length: 3 }, (_, i) => item(other, i + 10, i)),
      ];
      save.total = 12;
      save.discoveredSpecimens = [primary.id, other.id, archived.id];
      localStorage.setItem("lalala-dev", JSON.stringify(save));
      const standard = new DOMParser().parseFromString(characterSvg(characterById[primary.characterId], false, primary.type), "image/svg+xml").documentElement;
      return { primary: primary.id, other: other.id, archived: archived.id,
        standardTint: standard.getAttribute("data-tint") };
    });
    await page.reload();
    const loaded = await page.evaluate(() => JSON.parse(localStorage.getItem("lalala-dev")));
    expect(loaded.individuals).toHaveLength(10);
    expect(loaded.individuals.filter(entry => entry.specimenId === fixture.primary).map(entry => entry.sequence)).toEqual([3, 4, 5, 6, 7, 8, 9]);
    expect(loaded.individuals.find(entry => entry.sequence === 9).occurrenceCount).toBe(2);
    expect(loaded.discoveredSpecimens).toHaveLength(3);
    await page.locator("#collection-button").click();
    await expect(page.locator("#collection-summary")).toContainText("保留 10 条记录");
    await chooseSpecimen(page, fixture.primary);
    const cover = page.locator(`[data-stool="${fixture.primary}"] .stool-art > svg`);
    await expect(cover).toHaveAttribute("data-marks", "");
    await expect(cover).toHaveAttribute("data-tint", fixture.standardTint);
    await expect(page.locator("[data-individual]")).toHaveAttribute("data-individual", "history-9");
    await expect(page.locator(".individual-art > svg")).toHaveAttribute("data-marks", "enoki");
    await expect(page.locator(".individual-history-nav")).toContainText("1 / 7 · 共2次");
    await expect(page.locator("[data-individual-prev]")).toBeDisabled();
    for (let sequence = 8; sequence >= 3; sequence--) {
      await page.locator("[data-individual-next]").click();
      await expect(page.locator("[data-individual]")).toHaveAttribute("data-individual", `history-${sequence}`);
    }
    await expect(page.locator("[data-individual-next]")).toBeDisabled();
    await expect(page.locator(".individual-history-nav")).toContainText("7 / 7");
    await page.locator("[data-individual-prev]").click();
    await expect(page.locator("[data-individual]")).toHaveAttribute("data-individual", "history-4");
    await page.locator('[data-detail-panel="recipe"]').click();
    await expect(page.locator("[data-recipe-for]")).toContainText("固定配方");
    await page.locator('[data-detail-panel="art"]').click();
    await expect(page.locator("[data-individual]")).toHaveAttribute("data-individual", "history-4");
    expect(await page.locator("#collection-dialog").evaluate(el => el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.screenshot({ path: `qa/图鉴标准封面与七条记录-${width}.png` });
    await chooseSpecimen(page, fixture.other);
    await expect(page.locator(".individual-history-nav")).toContainText("1 / 3");
    await chooseSpecimen(page, fixture.archived);
    await expect(page.locator("[data-discovered]")).toContainText("暂无保留个体");
    await page.locator("#collection-back").click();
    await page.locator("#collection-preview-all").check();
    await chooseSpecimen(page, fixture.primary);
    await expect(page.locator("[data-individual]")).toHaveAttribute("data-individual", "history-9");
    await expect(cover).toHaveAttribute("data-tint", fixture.standardTint);
    await page.reload();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("lalala-dev")))).toEqual(loaded);
    expect(errors).toEqual([]);
  });
