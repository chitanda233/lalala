import { test, expect } from "@playwright/test";
import { foods } from "../src/content/foods.js";

async function mockAdminApi(page, { conflict = false } = {}) {
  let revision = "test-revision-1";
  let saved = Object.fromEntries(
    foods.map((food) => [food.id, structuredClone(food.attributes)]),
  );
  const submissions = [];
  await page.route("**/api/admin/foods", async (route) => {
    if (route.request().method() === "PUT") {
      const data = route.request().postDataJSON();
      submissions.push(data);
      if (conflict)
        return route.fulfill({
          status: 409,
          json: { error: "Configuration changed" },
        });
      expect(data.revision).toBe(revision);
      expect(Object.keys(data.foods)).toHaveLength(51);
      revision = "test-revision-2";
      saved = data.foods;
    }
    return route.fulfill({
      json: { version: 1, revision, foods: saved },
    });
  });
  return submissions;
}

async function setAttribute(page, key, value) {
  await page.locator(`#attribute-${key}`).evaluate((input, value) => {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
  await expect(page.locator(`#output-${key}`)).toHaveText(String(value));
}

test("admin edits nine intuitive attributes with an actual seven-type preview, then saves to the project API", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const submissions = await mockAdminApi(page);
  await page.goto("/admin/index.html");
  await expect(page.locator("#save-status")).toHaveText("所有调整已保存到项目");
  await page.locator('[data-food-id="banana"]').click();
  await expect(page.locator(".food-item")).toHaveCount(51);
  await expect(page.locator("#food-influence input")).toHaveCount(1);
  await expect(page.locator("#main-attributes input")).toHaveCount(6);
  await expect(page.locator("#extra-attributes input")).toHaveCount(2);
  await expect(
    page.locator("#food-influence #attribute-influence"),
  ).toBeVisible();
  expect(
    await page
      .locator("#advanced-attributes")
      .evaluate((details) => details.open),
  ).toBe(false);
  expect(
    await page.locator("#food-influence").evaluate((control) => {
      const summary = document.querySelector("#food-summary");
      const main = document.querySelector("#main-attributes");
      const pigment = document.querySelector("#pigment-id");
      return (
        Boolean(
          control.compareDocumentPosition(summary) &
          Node.DOCUMENT_POSITION_PRECEDING,
        ) &&
        Boolean(
          control.compareDocumentPosition(main) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ) &&
        Boolean(
          control.compareDocumentPosition(pigment) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        )
      );
    }),
  ).toBe(true);
  const before = await page.locator("#type-chart").innerText();
  await page.locator("#preview-force").fill("20");
  await page.locator("#preview-toilet").selectOption("vortex");
  await setAttribute(page, "softness", 4);
  await setAttribute(page, "cohesion", 7);
  await setAttribute(page, "elongation", 7);
  await expect(page.locator(".specimen.after")).toHaveAttribute(
    "data-character-id",
    "ribbon",
  );
  await expect(page.locator(".specimen.after")).toContainText("代表外观");
  await setAttribute(page, "softness", 1);
  await expect(page.locator("#type-chart")).not.toHaveText(before);
  await expect(page.locator("#save-foods")).toHaveText("保存到项目 · 1");
  await page.locator("#pigment-id").selectOption("ink");
  await setAttribute(page, "influence", 7);
  expect(
    await page
      .locator("#advanced-attributes")
      .evaluate((details) => details.open),
  ).toBe(false);
  await page.locator("#companion-1").selectOption("enoki");
  await page.locator("#companion-2").selectOption("burger");
  await expect(page.locator("#preview-recipe")).toHaveText(
    "熟香蕉 ＋ 金针菇 ＋ 华莱士汉堡",
  );
  await page.locator("#preview-water").selectOption("2250");
  await page.locator("#preview-drink").selectOption("coffee");
  await page.locator("#preview-toilet").selectOption("golden");
  await page.locator("#save-foods").click();
  await expect(page.locator("#save-status")).toHaveText("所有调整已保存到项目");
  expect(submissions).toHaveLength(1);
  expect(submissions[0].foods.banana).toMatchObject({
    softness: 1,
    influence: 7,
    pigmentId: "ink",
  });
  await page.reload();
  await expect(page.locator("#attribute-softness")).toHaveValue("1");
  await expect(page.locator("#attribute-influence")).toHaveValue("7");
  await expect(
    page.locator("#food-influence #attribute-influence"),
  ).toBeVisible();
  await expect(page.locator("#pigment-id")).toHaveValue("ink");
  await expect(page.locator("#save-foods")).toBeDisabled();
  await page.screenshot({
    path: "qa/admin-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
});

test("softness runs from very soft 1 to very hard 7 while Bristol taxonomy keeps its original direction", async ({
  page,
}) => {
  await mockAdminApi(page);
  await page.goto("/admin/index.html");
  await expect(page.locator("#save-status")).toHaveText("所有调整已保存到项目");
  await expect(page.getByLabel("软硬程度", { exact: true })).toHaveAttribute(
    "id",
    "attribute-softness",
  );
  const row = page
    .locator(".attribute-row")
    .filter({ has: page.locator("#attribute-softness") });
  await expect(row).toContainText("1 · 非常软");
  await expect(row).toContainText("7 · 非常硬");
  await page.locator('[data-food-id="rice"]').click();
  await setAttribute(page, "cohesion", 4);
  await setAttribute(page, "elongation", 4);
  await setAttribute(page, "softness", 1);
  await expect(page.locator(".specimen.after")).toContainText(
    "7 型 · 无固体水样型",
  );
  await setAttribute(page, "softness", 7);
  await expect(page.locator(".specimen.after")).toContainText(
    "1 型 · 颗粒硬块型",
  );
  await page.locator("#reset-food").click();
});

test("food drafts survive category switching and selected reset leaves other drafts intact", async ({
  page,
}) => {
  const submissions = await mockAdminApi(page);
  await page.goto("/admin/index.html");
  await expect(page.locator("#save-status")).toHaveText("所有调整已保存到项目");
  await page.locator('[data-food-id="banana"]').click();
  await setAttribute(page, "softness", 7);
  await setAttribute(page, "influence", 2);
  await page.locator("#food-category").selectOption("vegetable");
  await expect(page.locator('input[type="search"]')).toHaveCount(0);
  await page.locator('[data-food-id="enoki"]').click();
  await setAttribute(page, "grain", 7);
  await expect(page.locator("#save-foods")).toHaveText("保存到项目 · 2");
  await page.locator("#reset-food").click();
  await expect(page.locator("#save-foods")).toHaveText("保存到项目 · 1");
  await page.locator("#food-category").selectOption("fruit");
  await page.locator('[data-food-id="banana"]').click();
  await expect(page.locator("#attribute-softness")).toHaveValue("7");
  await expect(page.locator("#attribute-influence")).toHaveValue("2");
  await page.locator("#reset-food").click();
  await expect(page.locator("#save-foods")).toBeDisabled();
  expect(submissions).toEqual([]);
});

test("a stale disk revision preserves the draft and clearly reports a save conflict", async ({
  page,
}) => {
  await mockAdminApi(page, { conflict: true });
  await page.goto("/admin/index.html");
  await expect(page.locator("#save-status")).toHaveText("所有调整已保存到项目");
  await setAttribute(page, "softness", 7);
  await page.locator("#save-foods").click();
  await expect(page.locator("#save-status")).toContainText(
    "磁盘配置已被其他窗口更新",
  );
  await expect(page.locator("#attribute-softness")).toHaveValue("7");
  await expect(page.locator("#save-foods")).toBeEnabled();
  page.on("dialog", (dialog) => dialog.dismiss());
  await page.locator("#reload-data").click();
  await expect(page.locator("#attribute-softness")).toHaveValue("7");
});

for (const width of [390, 320]) {
  test(`admin remains usable without horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await mockAdminApi(page);
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/admin/index.html");
    await expect(page.locator("#save-status")).toHaveText(
      "所有调整已保存到项目",
    );
    await page.locator("#food-category").selectOption("staple");
    await page.locator('[data-food-id="corn"]').click();
    await expect(
      page.locator("#food-influence #attribute-influence"),
    ).toBeVisible();
    expect(
      await page
        .locator("#advanced-attributes")
        .evaluate((details) => details.open),
    ).toBe(false);
    await page.locator("#attribute-influence").scrollIntoViewIfNeeded();
    await setAttribute(page, "influence", 6);
    expect(
      await page
        .locator("#advanced-attributes")
        .evaluate((details) => details.open),
    ).toBe(false);
    await setAttribute(page, "retention", 7);
    await expect(
      page.locator('.specimen.after [data-food-residue="corn"]').first(),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const svg = document.querySelector(
            '.specimen.after [data-food-residue="corn"] svg',
          );
          const art = document.querySelector(".specimen.after > svg");
          const iconWidth = svg?.getBoundingClientRect().width || 0;
          const artWidth = art?.getBoundingClientRect().width || 0;
          return iconWidth > 0 && artWidth > 0 && iconWidth < artWidth / 4;
        }),
      )
      .toBe(true);
    await page.locator("#advanced-attributes summary").click();
    await setAttribute(page, "porosity", 7);
    await expect(page.locator("#type-chart .type-chart-row")).toHaveCount(7);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `qa/admin-mobile-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.locator("#reset-food").click();
  });
}
