import { test, expect } from "@playwright/test";
import { chooseSpecimen, enableCollectionPreview, showPageItem } from "./helpers.js";

for (const [width, height] of [[320, 640], [402, 760]])
  test(`catalog details browse unlocked species, close one level and warn about debug preview at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    const fixture = await page.evaluate(async () => {
      const { specimenBlueprints } = await import("/src/content/specimen-blueprints.js");
      const { classifySpecimen } = await import("/src/game/specimen.js");
      const { rollOutcome } = await import("/src/game/drops.js");
      const { collectionDisplayOrder } = await import("/src/ui/collection-order.js");
      const display = collectionDisplayOrder(specimenBlueprints);
      const save = JSON.parse(localStorage.getItem("lalala-dev"));
      const ids = ["classic:4", "gold:4", "frost-crystal:2"];
      const classic = specimenBlueprints.find(item => item.id === ids[0]);
      const appearance = rollOutcome({}, () => .5).appearance;
      save.individuals = [1, 2].map(sequence => ({
        id: `navigation-${sequence}`, sequence, specimenId: classic.id,
        characterId: classic.characterId, type: 4, morphology: classic.morphology,
        colorId: "classic", marks: [],
        appearance: { ...appearance, grain: sequence * 2, variationSeed: sequence },
      }));
      save.discoveredSpecimens = ids;
      save.total = 2;
      localStorage.setItem("lalala-dev", JSON.stringify(save));
      const unknownIndex = display.findIndex((item, index) =>
        !ids.includes(item.id) && !ids.includes(display[(index + 1) % display.length].id));
      return {
        known: display.filter(item => ids.includes(item.id)),
        unknown: display[unknownIndex],
        unknownNext: display[(unknownIndex + 1) % display.length],
        crossType: specimenBlueprints.find(item => ids.includes(item.id) && classifySpecimen(item) !== 4),
      };
    });
    await page.reload();
    const startingIndex = fixture.known.findIndex(item => item.id === "classic:4");
    const saved = await page.evaluate(() => localStorage.getItem("lalala-dev"));
    const dialog = page.locator("#collection-dialog");
    const heading = page.locator("#collection-detail > h3");
    const fits = async (target = dialog) => expect(await target.evaluate(el => el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.locator("#collection-button").click();
    await chooseSpecimen(page, "classic:4");
    const art = await page.locator(".individual-art").boundingBox();
    for (const selector of ["[data-specimen-prev]", "[data-specimen-next]"]) {
      const arrow = await page.locator(selector).boundingBox();
      expect(arrow.y + arrow.height / 2).toBeCloseTo(art.y + art.height / 2, 0);
    }
    await expect(page.locator("[data-individual]")).toHaveAttribute("data-individual", "navigation-2");
    await page.locator("[data-individual-next]").click();
    await expect(page.locator("[data-individual]")).toHaveAttribute("data-individual", "navigation-1");
    await expect(heading).toContainText(fixture.known[startingIndex].name);
    for (let index = 1; index <= fixture.known.length; index++) {
      await page.locator("[data-specimen-next]").click();
      await expect(heading).toContainText(fixture.known[(startingIndex + index) % fixture.known.length].name);
    }
    await expect(page.locator("[data-individual]")).toHaveAttribute("data-individual", "navigation-2");
    await page.locator("[data-specimen-prev]").click();
    await expect(heading).toContainText(fixture.known[(startingIndex + fixture.known.length - 1) % fixture.known.length].name);
    await page.locator("[data-specimen-next]").click();
    await expect(heading).toContainText(fixture.known[startingIndex].name);
    await chooseSpecimen(page, "gold:4");
    await fits();
    await page.screenshot({ path: `qa/图鉴详情大图切换-${width}.png`, animations: "disabled" });
    await chooseSpecimen(page, "classic:4");
    const crossTypeSteps = (fixture.known.findIndex(item => item.id === fixture.crossType.id) - startingIndex + fixture.known.length) % fixture.known.length;
    for (let index = 0; index < crossTypeSteps; index++)
      await page.locator("[data-specimen-next]").click();
    await expect(heading).toContainText(fixture.crossType.name);
    await page.locator("#collection-close").click();
    await expect(dialog).toBeVisible();
    await expect(dialog).not.toHaveClass(/detail-open/);
    await expect(page.locator(`[data-stool="${fixture.crossType.id}"]`)).toBeVisible();
    await expect(page.locator(`[data-stool="${fixture.crossType.id}"]`)).toBeFocused();
    await chooseSpecimen(page, "classic:4");
    await page.locator('[data-detail-panel="recipe"]').click();
    await page.locator("#collection-close").click();
    await expect(dialog).toBeVisible();
    await expect(dialog).not.toHaveClass(/detail-open/);
    await page.locator("#collection-close").click();
    await expect(dialog).toBeHidden();
    await page.locator("#collection-button").click();
    await chooseSpecimen(page, "classic:4");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await expect(dialog).not.toHaveClass(/detail-open/);
    await page.locator("#collection-preview-all").check();
    const notice = page.locator("#collection-preview-notice");
    await expect(notice).toBeVisible();
    await expect(notice).toContainText("仅供调试使用");
    await expect(notice).toContainText("降低探索和收集的游戏乐趣");
    await fits(notice);
    await page.screenshot({ path: `qa/图鉴调试提示-${width}.png`, animations: "disabled" });
    await notice.getByRole("button", { name: "知道了" }).click();
    await expect(notice).toBeHidden();
    await expect(dialog).toBeVisible();
    await chooseSpecimen(page, fixture.unknown.id);
    await page.locator("[data-specimen-next]").click();
    await expect(heading).toContainText(fixture.unknownNext.name);
    await page.locator("#collection-preview-all").uncheck();
    await expect(dialog).not.toHaveClass(/detail-open/);
    await page.locator("#collection-preview-all").check();
    await expect(notice).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(notice).toBeHidden();
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("lalala-dev"))).toBe(saved);
    await page.evaluate(() => {
      const save = JSON.parse(localStorage.getItem("lalala-dev"));
      save.individuals = [];
      save.discoveredSpecimens = ["gold:4"];
      localStorage.setItem("lalala-dev", JSON.stringify(save));
    });
    await page.reload();
    await page.locator("#collection-button").click();
    await chooseSpecimen(page, "gold:4");
    await expect(page.locator("[data-specimen-prev]")).toBeDisabled();
    await expect(page.locator("[data-specimen-next]")).toBeDisabled();
    await fits();
    expect(errors).toEqual([]);
  });

for (const [width, height] of [[320, 640], [402, 760]])
  test(`rare catalog effects stay within cards throughout animation at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const dialog = page.locator("#collection-dialog");
    const card = page.locator('[data-stool="gold:4"]');
    const checkBounds = async target => {
      const frames = await target.evaluate(el => {
        const animations = el.getAnimations({ subtree: true });
        animations.forEach(animation => animation.pause());
        return [0, .2, .4, .65, .85, .99].map(progress => {
          animations.forEach(animation => {
            animation.currentTime = Number(animation.effect.getTiming().duration) * progress;
          });
          return {
            height: el.clientHeight, scrollHeight: el.scrollHeight,
            width: el.clientWidth, scrollWidth: el.scrollWidth,
          };
        });
      });
      for (const frame of frames) {
        expect(frame.scrollHeight).toBeLessThanOrEqual(frame.height + 1);
        expect(frame.scrollWidth).toBeLessThanOrEqual(frame.width + 1);
      }
    };
    await page.locator("#collection-button").click();
    await showPageItem(page, '[data-stool="gold:4"]', "collection");
    await expect(card).toContainText("未发现的便便");
    await expect(card.locator(".rare-unlock-aura")).toHaveCount(0);
    await checkBounds(card);

    await enableCollectionPreview(page);
    await expect(card.locator(".rare-unlock-aura")).toHaveCount(1);
    await checkBounds(card);
    await page.screenshot({ path: `qa/稀有卡片裁切-${width}.png`, animations: "disabled" });
    await chooseSpecimen(page, "gold:4");
    await checkBounds(page.locator(".individual-art"));
    await checkBounds(dialog);

    await page.evaluate(() => {
      const save = JSON.parse(localStorage.getItem("lalala-dev"));
      save.discoveredSpecimens = ["gold:4"];
      localStorage.setItem("lalala-dev", JSON.stringify(save));
    });
    await page.reload();
    await page.locator("#collection-button").click();
    await showPageItem(page, '[data-stool="gold:4"]', "collection");
    await expect(card).toHaveClass(/collected/);
    await expect(card.locator(".rare-unlock-aura")).toHaveCount(1);
    await checkBounds(card);
    await chooseSpecimen(page, "gold:4");
    await checkBounds(page.locator(".individual-art"));
    await checkBounds(dialog);
    await page.screenshot({ path: `qa/稀有详情裁切-${width}.png`, animations: "disabled" });
  });
