import { foods, foodCategories } from "/src/content/foods.js";
import { digestionOptions } from "/src/content/digestion.js";
import {
  foodAttributeFields,
  validateFoodAttributes,
  describeFoodAttributes,
} from "/src/content/food-attributes.js";
import { foodById, characterById } from "/src/content/catalog.js";
import { drinks } from "/src/content/drinks.js";
import { additives } from "/src/content/additives.js";
import { forceZones } from "/src/content/force.js";
import { toilets } from "/src/content/toilets.js";
import { stoolColors } from "/src/content/colors.js";
import { bristolTypes } from "/src/content/stools.js";
import { foodArt } from "/src/ui/artwork/foods.js";
import { characterSvg } from "/src/ui/artwork/stools.js";
import { typeDistribution } from "/src/game/stool-type.js";
import {
  getOutcomePool,
  rollOutcome,
} from "/src/game/drops.js";
import { getRecipeForecast } from "/src/game/outcome-pool.js";
import { specimenName } from "/src/game/specimen.js";
import { recipeLiquidText } from "/src/content/recipe-labels.js";
import { gameConfig } from "/src/config/game.js";

const $ = (selector) => document.querySelector(selector);
const escapeText = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const copy = (value) => structuredClone(value);
const categories = Object.fromEntries(
  foodCategories.map((item) => [item.id, item.name]),
);
let selectedId = foods[0].id;
let saved = Object.fromEntries(
  foods.map((food) => [food.id, copy(food.attributes)]),
);
let revision = null;
let loaded = false;
let loading = true;
let saving = false;
let previewFrame = null;
let errorMessage = "";
let withSavedContent = (callback) => callback();

function isDirty(id) {
  return JSON.stringify(saved[id]) !== JSON.stringify(foodById[id].attributes);
}
function dirtyIds() {
  return foods.filter((food) => isDirty(food.id)).map((food) => food.id);
}
function updateStatus() {
  window.dispatchEvent(new CustomEvent("food-admin-change"));
  for (const control of document.querySelectorAll(
    ".editor input, .editor select",
  ))
    control.disabled = loading || saving || !loaded;
  $("#reset-food").disabled = !isDirty(selectedId) || saving;
  $("#selected-dirty-status").textContent = isDirty(selectedId)
    ? "这份食物有未保存的调整"
    : "";
  for (const button of document.querySelectorAll("[data-food-id]")) {
    const existing = button.querySelector(".food-dirty");
    const dirty = isDirty(button.dataset.foodId);
    if (dirty && !existing)
      button.insertAdjacentHTML(
        "beforeend",
        '<span class="food-dirty" aria-label="未保存"></span>',
      );
    if (!dirty && existing) existing.remove();
  }
}
function renderFoodList() {
  const category = $("#food-category").value;
  const matches = foods.filter(
    (food) => category === "all" || food.category === category,
  );
  $("#food-count").textContent = `${matches.length} / ${foods.length}`;
  $("#food-list").innerHTML = matches.length
    ? matches
        .map(
          (food) =>
            `<button type="button" class="food-item" data-food-id="${escapeText(food.id)}" aria-pressed="${food.id === selectedId}"><span class="food-icon">${foodArt(food.id)}</span><span class="food-item-copy"><strong>${escapeText(food.name)}</strong><small>${escapeText(categories[food.category] || "其他")}</small></span>${isDirty(food.id) ? '<span class="food-dirty" aria-label="未保存"></span>' : ""}</button>`,
        )
        .join("")
    : '<p class="empty-list">当前分类还没有食物。</p>';
}
function attributeRow(field) {
  const value = foodById[selectedId].attributes[field.key];
  return `<div class="attribute-row"><div class="attribute-topline"><label for="attribute-${escapeText(field.key)}">${escapeText(field.label)}</label><output id="output-${escapeText(field.key)}" class="attribute-output" for="attribute-${escapeText(field.key)}">${value}</output></div><p id="description-${escapeText(field.key)}" class="attribute-description">${escapeText(field.description)}</p><input id="attribute-${escapeText(field.key)}" class="attribute-range" data-attribute="${escapeText(field.key)}" type="range" min="1" max="7" step="1" value="${value}" aria-describedby="description-${escapeText(field.key)}" style="--progress:${((value - 1) / 6) * 100}%" /><div class="attribute-ends"><span>1 · ${escapeText(field.low)}</span><span>7 · ${escapeText(field.high)}</span></div></div>`;
}
function renderEditor() {
  const food = foodById[selectedId];
  $("#food-summary").innerHTML =
    `<div class="summary-art">${foodArt(food.id)}</div><div class="summary-meta"><div class="summary-id">${escapeText(food.id)}<span class="summary-category">${escapeText(categories[food.category] || "其他")}</span></div><h2 id="selected-food-name">${escapeText(food.name)}</h2><p>${escapeText(food.description)}</p></div>`;
  $("#main-attributes").innerHTML = foodAttributeFields
    .filter((field) => !field.advanced && field.group !== "overall")
    .map(attributeRow)
    .join("");
  $("#food-influence").innerHTML = foodAttributeFields
    .filter((field) => field.group === "overall")
    .map(attributeRow)
    .join("");
  $("#extra-attributes").innerHTML = foodAttributeFields
    .filter((field) => field.advanced)
    .map(attributeRow)
    .join("");
  $("#pigment-id").value = food.attributes.pigmentId || "";
  updateSwatch();
  updateCompanions();
  updateStatus();
  schedulePreview();
}
function updateSwatch() {
  const pigment = stoolColors[$("#pigment-id").value];
  $("#pigment-swatch").style.background = pigment ? pigment.color : "";
}
function optionList(items, selected, empty = "") {
  return (
    (empty ? `<option value="">${escapeText(empty)}</option>` : "") +
    items
      .map(
        (item) =>
          `<option value="${escapeText(item.id)}"${item.id === selected ? " selected" : ""}>${escapeText(item.name)}</option>`,
      )
      .join("")
  );
}
function updateCompanions() {
  const first = $("#companion-1");
  const second = $("#companion-2");
  const firstId = first.value !== selectedId ? first.value : "";
  const secondId =
    second.value !== selectedId && second.value !== firstId ? second.value : "";
  first.innerHTML = optionList(
    foods.filter((food) => food.id !== selectedId && food.id !== secondId),
    firstId,
    "不添加",
  );
  second.innerHTML = optionList(
    foods.filter((food) => food.id !== selectedId && food.id !== firstId),
    secondId,
    "不添加",
  );
}
function currentSelection() {
  return {
    foodIds: [
      selectedId,
      $("#companion-1").value,
      $("#companion-2").value,
    ].filter(Boolean),
    drinkId: $("#preview-drink").value,
    water: Number($("#preview-water").value),
    force: Number($("#preview-force").value),
    digestionTime: $("#preview-digestion").value,
    toiletId: $("#preview-toilet").value,
    additives: $("#preview-additive").value ? [$("#preview-additive").value] : [],
  };
}
function calculatePreview(selection) {
  const distribution = typeDistribution(selection);
  const pool = getOutcomePool(selection);
  const representative = pool
    .filter((entry) => !entry.special)
    .reduce(
      (best, entry) =>
        !best || entry.probability > best.probability ? entry : best,
      null,
    );
  const previewSelection = selection.digestionTime === "random"
    ? ["2", "4", "8"].map(digestionTime => ({ ...selection, digestionTime }))
      .sort((a, b) => (getOutcomePool(b).find(entry => entry.characterId === representative.characterId)?.probability || 0) - (getOutcomePool(a).find(entry => entry.characterId === representative.characterId)?.probability || 0))[0]
    : selection;
  const previewPool = getOutcomePool(previewSelection);
  const index = previewPool.findIndex(entry => entry.characterId === representative.characterId);
  // Preview the most likely ordinary individual from the production pool.
  const draws = [
    previewPool
      .slice(0, index)
      .reduce((total, entry) => total + entry.probability, 0) +
      previewPool[index].probability / 2,
    0.5,
  ];
  return {
    distribution,
    outcome: rollOutcome(previewSelection, () => draws.shift() ?? 0),
    forecast: getRecipeForecast(selection),
    pool,
  };
}
function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}
function specimenCard(label, data, after = false) {
  const outcome = data.outcome;
  const character = characterById[outcome.characterId];
  return `<div class="specimen${after ? " after" : ""}" data-character-id="${escapeText(character.id)}"><small>${label} · 代表外观</small>${characterSvg(character, false, outcome.type, outcome.colorId, outcome.marks, outcome.appearance)}<strong>${escapeText(specimenName(outcome))}</strong><p>${outcome.type} 型 · ${escapeText(bristolTypes[outcome.type - 1].name)}</p><p>稀有合计 ${formatPercent(data.forecast.rareProbability)}</p></div>`;
}
function recipeForecast(data) {
  const { forecast, pool } = data;
  const recipe = forecast.matchedRecipe || forecast.suggestedRecipe;
  if (!recipe) return `<p>${forecast.physicalState ? `湿软指数 ${forecast.physicalState.score.toFixed(2)} · 基础 ${forecast.physicalState.type} 型` : `随机三档综合：${forecast.phaseForecasts.map(phase=>`${phase.digestionTime}→${phase.physicalState.type}型`).join("、")}`}</p><p>按当前物态、力度与配方距离生成普通形态。</p>`;
  const target = characterById[recipe.characterId];
  const zone = forceZones.find((item) => item.id === recipe.forceZone);
  const actualProbability = pool
    .filter((entry) => entry.characterId === recipe.characterId)
    .reduce((sum, entry) => sum + entry.probability, 0);
  const stateText = forecast.physicalState ? `湿软指数 ${forecast.physicalState.score.toFixed(2)} · 基础 ${forecast.physicalState.type} 型` : `随机阶段综合：${forecast.phaseForecasts.map(phase => `${phase.digestionTime}→${phase.physicalState.type}型`).join("、")}`;
  return `<strong>${forecast.matchedRecipe ? "固定配方已匹配" : "当前主结果"} · ${escapeText(target.name)}</strong><p>${recipe.foodIds.map((id) => escapeText(foodById[id].name)).join(" + ")} + ${escapeText(drinks.find((item) => item.id === recipe.drinkId).name)} · ${zone.name} ${zone.min}–${zone.max}</p><p>${recipeLiquidText(recipe)}${recipe.requiredAdditive ? ` · 需${escapeText(additives.find(item => item.id === recipe.requiredAdditive).name)}` : ""}</p><p>${stateText}</p><div class="forecast-values"><span>目标实际概率<strong>${formatPercent(actualProbability)}</strong></span><span>稀有合计<strong>${formatPercent(forecast.rareProbability)}</strong></span></div><p>${forecast.matchedRecipe ? `未中稀有后，普通主结果命中 ${formatPercent(forecast.recipeConditionalProbability)}；整局命中 ${formatPercent(forecast.recipeProbability)}。` : "来源与物态先过滤，再平滑计算主结果；益生菌稳定每个已确定阶段的普通主结果。"}</p>`;
}
function renderPreview() {
  previewFrame = null;
  const selection = currentSelection();
  try {
    const drafts = foods.map((food) => [food, food.attributes]);
    let before;
    try {
      for (const [food] of drafts) food.attributes = saved[food.id];
      before = withSavedContent(() => calculatePreview(selection));
    } finally {
      for (const [food, attributes] of drafts) food.attributes = attributes;
    }
    const after = calculatePreview(selection);
    $("#preview-recipe").textContent = selection.foodIds
      .map((id) => foodById[id].name)
      .concat(
        `${drinks.find((item) => item.id === selection.drinkId).name} ${selection.water} mL`,
        `阶段 ${selection.digestionTime}`,
        selection.additives.length
          ? additives.find((item) => item.id === selection.additives[0]).name
          : "无添加剂",
      )
      .join(" ＋ ");
    $("#preview-forecast").innerHTML = recipeForecast(after);
    $("#specimen-preview").innerHTML =
      withSavedContent(() => specimenCard("已保存", before)) + specimenCard("当前草稿", after, true);
    const probabilities = (distribution) =>
      Object.fromEntries(
        distribution.map((item) => [item.type, item.probability]),
      );
    const oldValues = probabilities(before.distribution);
    const newValues = probabilities(after.distribution);
    $("#type-chart").innerHTML = bristolTypes
      .map((type) => {
        const oldValue = oldValues[type.id] || 0;
        const newValue = newValues[type.id] || 0;
        return `<div class="type-chart-row" data-type="${type.id}" aria-label="${type.id} 型 ${escapeText(type.name)}：已保存 ${formatPercent(oldValue)}，当前草稿 ${formatPercent(newValue)}"><span class="chart-type" title="${escapeText(type.name)}">${type.id} 型</span><span class="chart-bars"><span class="chart-track"><span class="chart-fill" style="width:${oldValue * 100}%"></span></span><span class="chart-track"><span class="chart-fill after" style="width:${newValue * 100}%"></span></span></span><span class="chart-values"><span>${formatPercent(oldValue)}</span><span class="arrow">→</span><strong>${formatPercent(newValue)}</strong></span></div>`;
      })
      .join("");
    $("#preview-features").textContent = describeFoodAttributes(
      foodById[selectedId],
    );
  } catch (error) {
    $("#preview-features").textContent = `预览暂不可用：${error.message}`;
  }
}
function schedulePreview() {
  if (previewFrame === null)
    previewFrame = requestAnimationFrame(renderPreview);
}
async function readResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      response.status === 409
        ? "磁盘配置已被其他窗口更新。草稿已保留，请重新读取后再调整。"
        : body.error || body.message || `请求失败（${response.status}）`,
    );
  if (body.version !== 1 || !body.foods || body.revision == null)
    throw new Error("配置文件格式不正确。");
  const parsed = {};
  for (const food of foods) {
    if (!body.foods[food.id]) throw new Error(`配置缺少食物：${food.name}`);
    parsed[food.id] = validateFoodAttributes(body.foods[food.id]);
  }
  return { foods: parsed, revision: body.revision };
}
async function loadData() {
  loading = true;
  errorMessage = "";
  updateStatus();
  try {
    const data = await readResponse(
      await fetch("/api/admin/foods", { cache: "no-store" }),
    );
    saved = copy(data.foods);
    revision = data.revision;
    for (const food of foods) food.attributes = copy(saved[food.id]);
    loaded = true;
    loading = false;
    renderFoodList();
    renderEditor();
    return true;
  } catch (error) {
    loading = false;
    errorMessage = `读取失败：${error.message} 请使用项目开发服务器打开此页面。`;
    updateStatus();
    return false;
  }
}
async function saveData() {
  if (!loaded || saving || !dirtyIds().length) return;
  saving = true;
  errorMessage = "";
  updateStatus();
  // Capture the request so edits made while it is in flight remain a draft.
  const submitted = Object.fromEntries(
    foods.map((food) => [food.id, copy(food.attributes)]),
  );
  try {
    const data = await readResponse(
      await fetch("/api/admin/foods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: 1, revision, foods: submitted }),
      }),
    );
    saved = copy(data.foods);
    revision = data.revision;
    schedulePreview();
    return true;
  } catch (error) {
    errorMessage = `保存失败：${error.message}`;
    return false;
  } finally {
    saving = false;
    updateStatus();
  }
}

$("#food-category").innerHTML = optionList(
  foodCategories.map((category) => ({ id: category.id, name: category.name })),
  "all",
);
$("#pigment-id").innerHTML =
  '<option value="">不提供染色</option>' +
  Object.entries(stoolColors)
    .map(
      ([id, color]) =>
        `<option value="${escapeText(id)}">${escapeText(color.name)}</option>`,
    )
    .join("");
$("#preview-drink").innerHTML = optionList(drinks, "water");
$("#preview-additive").innerHTML = optionList(additives, "", "无添加剂");
$("#preview-digestion").innerHTML = optionList(digestionOptions, "4");
$("#preview-toilet").innerHTML = optionList(toilets, "standard");
$("#preview-water").innerHTML = Array.from(
  { length: (gameConfig.water.max - gameConfig.water.min) / gameConfig.water.step + 1 },
  (_, i) => gameConfig.water.min + i * gameConfig.water.step,
)
  .map(
    (amount) =>
      `<option value="${amount}"${amount === gameConfig.water.default ? " selected" : ""}>${amount} mL</option>`,
  )
  .join("");
$("#food-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-food-id]");
  if (!button) return;
  selectedId = button.dataset.foodId;
  renderFoodList();
  renderEditor();
});
$("#food-category").addEventListener("change", renderFoodList);
$(".editor").addEventListener("input", (event) => {
  const field = event.target.dataset.attribute;
  if (!field) return;
  const value = Number(event.target.value);
  foodById[selectedId].attributes = validateFoodAttributes({
    ...foodById[selectedId].attributes,
    [field]: value,
  });
  $(`#output-${field}`).textContent = value;
  event.target.style.setProperty("--progress", `${((value - 1) / 6) * 100}%`);
  updateStatus();
  schedulePreview();
});
$("#pigment-id").addEventListener("change", () => {
  foodById[selectedId].attributes = validateFoodAttributes({
    ...foodById[selectedId].attributes,
    pigmentId: $("#pigment-id").value || null,
  });
  updateSwatch();
  updateStatus();
  schedulePreview();
});
$("#reset-food").addEventListener("click", () => {
  foodById[selectedId].attributes = copy(saved[selectedId]);
  renderEditor();
});
$("#preview-force").addEventListener("input", schedulePreview);
for (const element of document.querySelectorAll(".preview-controls select"))
  element.addEventListener("change", () => {
    if (element.id.startsWith("companion-")) updateCompanions();
    schedulePreview();
  });
window.addEventListener("beforeunload", (event) => {
  if (!dirtyIds().length) return;
  event.preventDefault();
  event.returnValue = "";
});
renderFoodList();
renderEditor();
loadData();

export const foodAdmin = {
  get state() { return { loaded, loading, saving, error: errorMessage, count: dirtyIds().length }; },
  load: loadData,
  save: saveData,
  setPreviewContext(callback) { withSavedContent = callback; schedulePreview(); },
  refreshContent() {
    for (const [id, items] of [["preview-drink", drinks], ["preview-additive", additives], ["preview-toilet", toilets]]) {
      const control = $("#" + id), value = control.value;
      control.innerHTML = optionList(items, value, id === "preview-additive" ? "无添加剂" : "");
    }
    schedulePreview();
  },
  tryRecipe(recipe, additiveId = "") {
    selectedId = recipe.foodIds[0];
    $("#food-category").value = "all";
    $("#companion-1").value = "";
    $("#companion-2").value = "";
    renderFoodList(); renderEditor();
    $("#companion-1").value = recipe.foodIds[1] || "";
    updateCompanions();
    $("#companion-2").value = recipe.foodIds[2] || "";
    $("#preview-drink").value = recipe.drinkId;
    $("#preview-additive").value = recipe.requiredAdditive || additiveId;
    $("#preview-water").value = recipe.water;
    $("#preview-digestion").value = recipe.digestionTime;
    const zone = forceZones.find((item) => item.id === recipe.forceZone);
    $("#preview-force").value = Math.round((zone.min + zone.max) / 2);
    schedulePreview();
  },
};
