import { test, expect } from "@playwright/test";
import { contentValues } from "../src/content/managed-content.js";
import { foods } from "../src/content/foods.js";
import { validateManagedContent } from "../admin/content-schema.js";

async function mockApis(page, { conflict = false } = {}) {
  let content = structuredClone(contentValues);
  let foodValues = Object.fromEntries(foods.map((food) => [food.id, structuredClone(food.attributes)]));
  let contentRevision = "content-1", foodRevision = "foods-1";
  const submissions = [];
  const assets = [...new Set(content.artwork.map((item) => item.path).filter(Boolean))];
  await page.route("**/api/admin/content", async (route) => {
    if (route.request().method() === "PUT") {
      const data = route.request().postDataJSON();
      submissions.push({ kind: "content", data });
      if (conflict) return route.fulfill({ status: 409, json: { error: "changed" } });
      expect(data.revision).toBe(contentRevision);
      content = validateManagedContent(data.content); contentRevision = "content-2";
    }
    await route.fulfill({ json: { version: 1, revision: contentRevision, content, assets } });
  });
  await page.route("**/api/admin/foods", async (route) => {
    if (route.request().method() === "PUT") {
      const data = route.request().postDataJSON();
      submissions.push({ kind: "foods", data });
      expect(data.revision).toBe(foodRevision);
      foodValues = data.foods; foodRevision = "foods-2";
    }
    await route.fulfill({ json: { version: 1, revision: foodRevision, foods: foodValues } });
  });
  return submissions;
}
const open = (page, key) => page.locator(`#studio-nav [data-module="${key}"]`).click();

test("all seven modules retain drafts, save together, and reload into game-backed previews", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const submissions = await mockApis(page);
  await page.goto("/admin/");
  await expect(page.locator("#save-status")).toHaveText("所有调整已保存到项目");
  await expect(page.locator(".overview-card")).toHaveCount(7);
  await open(page, "stools");
  await page.locator("#field-name").fill("后台编辑收藏");
  await page.locator("#field-properties-grain").fill("5");
  await page.locator('[data-go="recipes"][data-id="classic"]').click();
  await page.locator("#field-foodIds-0").selectOption("banana");
  await expect(page.locator("[data-target-probability]")).toHaveText("0.0%");
  await expect(page.locator("[data-stabilized-probability]")).toHaveText("0.0%");
  await expect(page.locator("[data-primary-result]")).not.toContainText("后台编辑收藏");
  await expect(page.locator("#content-warnings")).toBeVisible();
  await page.locator('[data-try-recipe="classic"]').click();
  await expect(page.locator("#preview-recipe")).toContainText("熟香蕉");
  await expect(page.locator("#preview-forecast")).toContainText("当前主结果");
  await expect(page.locator("#preview-forecast")).not.toContainText("后台编辑收藏");
  await page.locator("#attribute-influence").evaluate((input) => {
    input.value = input.value === "1" ? "7" : "1";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await open(page, "drinks");
  await page.locator("#field-wetnessBias").fill("0.7");
  await open(page, "additives");
  await page.locator('[data-rare-target="gold"]').check();
  await page.locator("#field-propertyChanges-hardness").fill("-1");
  await expect(page.locator("#record-preview")).toContainText("20%");
  await open(page, "toilets");
  await page.locator('[data-record="comfort"]').click();
  await page.locator("#field-unlock-count").fill("11");
  await expect(page.locator("#record-preview")).toContainText("完成 11 次后解锁");
  await open(page, "gallery");
  await page.locator('[data-art="classic"]').click();
  await expect(page.locator("#art-dialog")).toBeVisible();
  await page.locator("#art-path").selectOption("/assets/stools/reference-v2/jet.png");
  await expect(page.locator("#art-dialog-image image").first()).toHaveAttribute("href", "/assets/stools/reference-v2/jet.png");
  await page.locator("#close-art-dialog").click();
  await expect(page.locator("#save-foods")).toHaveText("保存到项目 · 7");
  await page.locator("#save-foods").click();
  await expect(page.locator("#save-status")).toHaveText("所有调整已保存到项目");
  expect(submissions.map((item) => item.kind)).toEqual(["content", "foods"]);
  expect(submissions[0].data.content.stools[0].name).toBe("后台编辑收藏");
  expect(submissions[0].data.content.recipes.find(recipe => recipe.characterId === "classic").foodIds).toEqual(["banana"]);
  await page.reload();
  await expect(page.locator("#save-foods")).toBeDisabled();
  await open(page, "stools");
  await expect(page.locator("#field-name")).toHaveValue("后台编辑收藏");
  await open(page, "foods");
  await page.locator('[data-food-id="banana"]').click();
  expect(await page.locator("#attribute-influence").inputValue()).toBe(String(submissions[1].data.foods.banana.influence));
  expect(errors).toEqual([]);
});

test("disk conflicts preserve drafts and reset affects only the selected record", async ({ page }) => {
  await mockApis(page, { conflict: true });
  await page.goto("/admin/#recipes");
  await expect(page.locator("#save-status")).toHaveText("所有调整已保存到项目");
  await page.locator("#field-water").selectOption("0");
  await page.locator("#save-foods").click();
  await expect(page.locator("#save-status")).toContainText("草稿已保留");
  await page.locator("#reset-record").click();
  await expect(page.locator("#field-water")).toHaveValue("250");
  await open(page, "stools");
  await page.locator("#field-name").fill("保留的草稿");
  await open(page, "drinks");
  await page.locator("#field-wetnessBias").fill("0.7");
  await page.locator("#reset-record").click();
  await expect(page.locator("#save-foods")).toHaveText("保存到项目 · 1");
  await page.locator("#save-foods").click();
  await expect(page.locator("#save-status")).toContainText("草稿已保留");
  await open(page, "stools");
  await expect(page.locator("#field-name")).toHaveValue("保留的草稿");
  await expect(page.locator("#save-foods")).toBeEnabled();
  page.on("dialog", (dialog) => dialog.dismiss());
  await page.locator("#reload-data").click();
  await expect(page.locator("#field-name")).toHaveValue("保留的草稿");
});

test("gallery filters, pagination, empty states, and large transparent artwork work", async ({ page }) => {
  await mockApis(page);
  await page.goto("/admin/#gallery");
  await expect(page.locator("#save-status")).toHaveText("所有调整已保存到项目");
  await expect(page.locator(".gallery-card")).toHaveCount(12);
  await page.locator('[data-gallery-page="1"]').click();
  await expect(page.locator("#gallery-pagination")).toContainText("第 2 / 5 页");
  await page.locator("#gallery-type").selectOption("7");
  await expect(page.locator(".gallery-card")).toHaveCount(10);
  await page.locator("#gallery-rarity").selectOption("special");
  await expect(page.locator(".gallery-card")).toHaveCount(2);
  await page.locator("#gallery-background").selectOption("dark");
  await page.locator('[data-art="golden-juice"]').click();
  await expect(page.locator("#art-dialog-image")).toHaveAttribute("data-background", "dark");
  await page.keyboard.press("Escape");
  await page.locator("#gallery-type").selectOption("3");
  await page.locator("#gallery-rarity").selectOption("uncommon");
  await expect(page.locator(".empty-gallery")).toHaveText("这个分类暂无图片。");
  expect(await page.locator('input[type="search"]').count()).toBe(0);
});

test("the unified navigation and editors fit a narrow admin window", async ({ page }) => {
  await mockApis(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/#toilets");
  await expect(page.locator("#save-status")).toHaveText("所有调整已保存到项目");
  await page.locator('[data-record="comfort"]').click();
  await page.locator("#field-unlock-kind").selectOption("open");
  await expect(page.locator("#unlock-count-field")).toBeHidden();
  await expect(page.locator("#record-preview")).toContainText("初始可用");
  await expect(page.locator("#save-foods")).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#reset-record").click();
  await open(page, "gallery");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("a pigment-only food edit saves despite affected recipe sources and reloads its warning", async ({ page }) => {
  const submissions = await mockApis(page);
  await page.goto("/admin/#foods");
  await expect(page.locator("#save-status")).toHaveText("所有调整已保存到项目");
  await page.locator('[data-food-id="spinach"]').click();
  await page.locator("#pigment-id").selectOption("");
  await expect(page.locator("#content-warnings")).toBeVisible();
  await page.locator("#content-warnings summary").click();
  await expect(page.locator("#content-warnings")).toContainText("森林小精灵");
  await page.locator("#save-foods").click();
  await expect(page.locator("#save-status")).toHaveText("所有调整已保存到项目");
  expect(submissions.map(s => s.kind)).toEqual(["foods"]);
  expect(submissions[0].data.foods.spinach.pigmentId).toBeNull();
  await page.reload();
  await page.locator('[data-food-id="spinach"]').click();
  await expect(page.locator("#pigment-id")).toHaveValue("");
  await expect(page.locator("#content-warnings")).toBeVisible();
});
