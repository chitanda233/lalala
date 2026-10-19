import { expect } from "@playwright/test";

export async function chooseMeal(page, ids) {
  await page.locator("#choose-foods").click();
  while (await page.locator("[data-remove-food]").count())
    await page.locator("[data-remove-food]").first().click();
  for (const id of ids) {
    await focusFood(page, id);
    await page.locator(`[data-add-food="${id}"]`).click();
  }
  await page.locator("#confirm-foods").click();
}

export async function chooseDrink(page, id) {
  await page.locator("#choose-drinks").click();
  await showPageItem(page, `[data-drink="${id}"]`);
  const add = page.locator(`[data-add-drink="${id}"]`);
  if (await add.isEnabled()) await add.click();
  await page.locator('#confirm-supply').click();
}
export async function chooseAdditives(page, ids) {
  await page.locator("#choose-additives").click();
  for (const selected of await page.locator(".additive-input:checked").all()) {
    const id = await selected.getAttribute("value");
    await showPageItem(page, `.additive-input[value="${id}"]`);
    await page.locator(`.additive-input[value="${id}"]`).uncheck();
  }
  for (const id of ids) {
    await showPageItem(page, `.additive-input[value="${id}"]`);
    await page.locator(`.additive-input[value="${id}"]`).check();
  }
  await page.locator('#confirm-supply').click();
}

export async function armSpecimen(page, characterId = null, type = null, force = 50) {
  return page.evaluate(
    async ({ characterId, type, force }) => {
      const selection = { ...JSON.parse(localStorage.getItem("lalala-dev")).settings, force };
      const [
        { getOutcomePool },
        { classifySpecimen, specimenName },
        { characterById },
      ] = await Promise.all([
        import("/src/game/drops.js"),
        import("/src/game/specimen.js"),
        import("/src/content/catalog.js"),
      ]);
      const pool = getOutcomePool(selection);
      const index = pool.findIndex(
        (entry) =>
          (!characterId || entry.characterId === characterId) &&
          (!type || classifySpecimen(entry) === type),
      );
      if (index < 0) throw new Error("配方中没有目标标本。");
      const candidate = pool[index];
      const draws = [
        pool
          .slice(0, index)
          .reduce((sum, entry) => sum + entry.probability, 0) +
          candidate.probability / 2,
        0.5,
      ];
      Math.random = () => draws.shift() ?? 0.5;
      const character = characterById[candidate.characterId];
      return {
        type: classifySpecimen(candidate),
        specimenId: candidate.specimenId,
        name: specimenName({
          characterId: candidate.characterId,
          type: classifySpecimen(candidate),
        }),
        material: character.material,
        rarity: character.rarity,
      };
    },
    { characterId, type, force },
  );
}
// Keep catalog regressions on a reproducible force zone; pointer timing has its own tests.
export async function stopForce(page, force = 50) {
  await page.evaluate((force) => {
    const session = JSON.parse(localStorage.getItem("lalala-dev")).session;
    window.qaOriginalNow = Date.now;
    Date.now = () => session.startedAt + (1500 * force) / 100;
  }, force);
  try {
    await page.locator("#start-button").click();
    await expect(page.locator("#start-button")).toHaveAttribute(
      "data-phase",
      "running",
    );
  } finally {
    await page.evaluate(() => {
      Date.now = window.qaOriginalNow;
      delete window.qaOriginalNow;
    });
  }
}

export async function startRound(page, force = 50) {
  await page.locator("#start-button").click();
  await stopForce(page, force);
}

export async function showPageItem(page, selector, prefix = "supply") {
  while (await page.locator(`#${prefix}-prev`).isEnabled())
    await page.locator(`#${prefix}-prev`).click();
  for (let index = 0; index < 30; index++) {
    if (await page.locator(selector).isVisible()) return;
    if (!(await page.locator(`#${prefix}-next`).isEnabled())) break;
    await page.locator(`#${prefix}-next`).click();
  }
  throw new Error(`找不到可见条目：${selector}`);
}
export async function focusFood(page, id) {
  const category = await page.evaluate(
    async (id) =>
      (await import("/src/content/catalog.js")).foodById[id].category,
    id,
  );
  await page.locator(`[data-food-category="${category}"]`).click();
  await showPageItem(page, `#food-grid [data-food="${id}"]`, "food");
  await page.locator(`#food-grid [data-food="${id}"]`).click();
}
export async function setWater(page, value) {
  const wasOpen = await page.locator("#supply-dialog").isVisible();
  if (!wasOpen) await page.locator("#choose-drinks").click();
  await page.locator("#water").fill(String(value));
  if (!wasOpen)
    await page.locator('#confirm-supply').click();
}
export async function setCompletedRounds(page, total) {
  await page.evaluate((total) => {
    const save = JSON.parse(localStorage.getItem("lalala-dev"));
    save.total = total;
    localStorage.setItem("lalala-dev", JSON.stringify(save));
  }, total);
  await page.reload();
}
export async function chooseToilet(page, id) {
  await page.locator("#choose-toilet").click();
  for (let index = 0; index < 10; index++) {
    if ((await page.locator("#equipment-dialog").getAttribute("data-preview")) === id) break;
    await page.locator("#toilet-next").click();
  }
  await expect(page.locator("#equipment-dialog")).toHaveAttribute("data-preview", id);
  await page.locator("#confirm-toilet").click();
  await expect(page.locator("#equipment-dialog")).not.toBeVisible();
  await expect(page.locator("#bathroom-scene")).toHaveAttribute("data-toilet", id);
}
export async function chooseSpecimen(page, id) {
  if (await page.locator("#collection-back").isVisible())
    await page.locator("#collection-back").click();
  await page.locator(`[data-type-filter="${id.split(":")[1]}"]`).click();
  await showPageItem(page, `[data-stool="${id}"]`, "collection");
  await page.locator(`[data-stool="${id}"]`).click();
}

export async function enableCollectionPreview(page) {
  await page.locator("#collection-preview-all").check();
  const notice = page.locator("#collection-preview-notice");
  if (await notice.isVisible())
    await notice.getByRole("button", { name: "知道了" }).click();
}

export async function chooseDigestion(page, phase) {
  await page.locator("#choose-digestion").click();
  await page.locator(`[data-digestion="${phase}"]`).click();
  await page.locator('[data-close="digestion-dialog"]').last().click();
}

// Exercise the actual input UI with the current complete recipe, including phase.
export async function applyIdealRecipe(page, characterId, additiveIds = null) {
  const recipe = await page.evaluate(async id => {
    const { stoolRecipeByCharacterId } = await import("/src/content/stool-recipes.js");
    const { rareThemeRecipeById } = await import("/src/content/rare-theme-recipes.js");
    return stoolRecipeByCharacterId[id] || rareThemeRecipeById[id];
  }, characterId);
  await chooseMeal(page, recipe.foodIds);
  await chooseDrink(page, recipe.drinkId);
  await setWater(page, recipe.water);
  await chooseDigestion(page, recipe.digestionTime);
  await chooseAdditives(page, additiveIds || (recipe.requiredAdditive ? [recipe.requiredAdditive] : recipe.additiveId ? [recipe.additiveId] : []));
  return { recipe, force: { low: 20, medium: 50, high: 90 }[recipe.forceZone] };
}

export async function expectedTint(page, outcome) {
  return page.evaluate(async outcome => {
    const { characterById } = await import("/src/content/catalog.js");
    const { characterSvg } = await import("/src/ui/artwork/stools.js");
    return new DOMParser().parseFromString(characterSvg(characterById[outcome.characterId], false, outcome.type, outcome.colorId, outcome.marks, outcome.appearance), "image/svg+xml").documentElement.getAttribute("data-tint");
  }, outcome);
}
