import { foodAdmin } from "./admin.js";
import { validateManagedContent, propertyLabels, decorationLabels, shapeLabels } from "./content-schema.js";
import { contentValues } from "/src/content/managed-content.js";
import { foods } from "/src/content/foods.js";
import { characters, rarityLabels, refreshCharacterMetadata } from "/src/content/specimens.js";
import { stoolRecipes } from "/src/content/stool-recipes.js";
import { drinks } from "/src/content/drinks.js";
import { additives } from "/src/content/additives.js";
import { toilets } from "/src/content/toilets.js";
import { referenceStoolAssets } from "/src/content/stool-art-assets.js";
import { characterById, foodById } from "/src/content/catalog.js";
import { forceZones } from "/src/content/force.js";
import { characterSvg } from "/src/ui/artwork/stools.js";
import { toiletSvg } from "/src/ui/artwork/toilets.js";
import { getRecipeForecast } from "/src/game/outcome-pool.js";
import { sourceRequirementText } from "/src/game/source-conditions.js";
import { stoolColors } from "/src/content/colors.js";

const $ = (selector) => document.querySelector(selector);
const copy = (value) => structuredClone(value);
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const modules = [
  { id: "overview", name: "总览", symbol: "◫" },
  { id: "foods", name: "食物管理", symbol: "◒", description: "九项食物属性、颜色与完整配方试验。" },
  { id: "stools", name: "大便管理", symbol: "◆", description: "编辑收藏名称、描述、材质、配色和五项物态属性。" },
  { id: "recipes", name: "大便配方", symbol: "⌘", description: "每款普通收藏的食物集合、饮料与饮用量、消化阶段及力度，保存时检查配方冲突。" },
  { id: "gallery", name: "图片展示", symbol: "▧", description: "查看全部造型、大图与透明边缘，也可替换项目内的主图。" },
  { id: "drinks", name: "饮料管理", symbol: "◡", description: "编辑饮料的软硬、蓬松、标签、配色和顺畅效果。" },
  { id: "additives", name: "添加剂管理", symbol: "✳", description: "配置物态修正、表面装饰、稳定强度与稀有目标。" },
  { id: "toilets", name: "马桶管理", symbol: "▱", description: "管理马桶造型、配色、顺畅评分与解锁次数。" },
];
let saved = copy(contentValues), draft = copy(contentValues), runtimeDraft = copy(contentValues);
let revision = null, assets = [], loaded = false, loading = false, saving = false;
let errorMessage = "", validationMessage = "";
let active = "overview", page = 0, category = "all", galleryPage = 0;
const selected = Object.fromEntries(Object.entries(draft).map(([key, items]) => [key, items[0].id || items[0].characterId]));
const idOf = (item) => item.id || item.characterId;
const record = (key, id) => draft[key].find((item) => idOf(item) === id);
const changed = (key, item) => JSON.stringify(item) !== JSON.stringify(saved[key].find((other) => idOf(other) === idOf(item)));
const dirtyCount = (key) => draft[key].filter((item) => changed(key, item)).length;
const contentDirty = () => Object.keys(draft).reduce((sum, key) => sum + dirtyCount(key), 0);
const countFor = (key) => key === "foods" ? foods.length : key === "gallery" ? characters.length : draft[key]?.length || 0;
const dirtyFor = (key) => key === "foods" ? foodAdmin.state.count : key === "gallery" ? dirtyCount("artwork") : draft[key] ? dirtyCount(key) : 0;
const nameOf = (key, item) => key === "recipes" || key === "artwork" ? record("stools", idOf(item)).name : item.name;

function applyContent(value) {
  // Preserve the references held by the game catalog and outcome pool.
  for (const [key, collection] of [["stools", characters], ["recipes", stoolRecipes], ["drinks", drinks], ["additives", additives], ["toilets", toilets]]) {
    for (const item of value[key]) {
      const target = collection.find((other) => idOf(other) === idOf(item));
      for (const key of Object.keys(target)) delete target[key];
      Object.assign(target, copy(item));
    }
  }
  for (const id of Object.keys(referenceStoolAssets)) delete referenceStoolAssets[id];
  for (const item of value.artwork) if (item.path) referenceStoolAssets[item.id] = item.path;
  refreshCharacterMetadata();
}
foodAdmin.setPreviewContext((callback) => {
  applyContent(saved);
  try { return callback(); } finally { applyContent(runtimeDraft); }
});

function renderNav() {
  $("#studio-nav").innerHTML = modules.map((item) => `<button type="button" data-module="${item.id}" class="nav-item" aria-current="${active === item.id ? "page" : "false"}"><span aria-hidden="true">${item.symbol}</span>${item.name}${item.id !== "overview" ? `<small>${countFor(item.id)}</small>` : ""}${dirtyFor(item.id) ? '<i class="nav-dirty" aria-label="有未保存修改"></i>' : ""}</button>`).join("");
}
function updateStatus() {
  const food = foodAdmin.state, count = food.count + contentDirty();
  const error = errorMessage || food.error || validationMessage;
  const busy = saving || loading || food.loading || food.saving;
  const status = $("#save-status");
  status.textContent = error || (saving ? "正在保存到项目…" : busy ? "正在读取项目配置…" : count ? `${count} 个条目有未保存的调整` : "所有调整已保存到项目");
  status.classList.toggle("is-dirty", !error && count > 0);
  status.classList.toggle("is-error", Boolean(error));
  $("#save-foods").disabled = busy || !loaded || !food.loaded || !count;
  $("#save-foods").textContent = saving ? "保存中…" : count ? `保存到项目 · ${count}` : "保存到项目";
  $("#reload-data").disabled = busy;
  $("#content-form").inert = !loaded || busy;
  if (draft[active]) {
    const item = record(active, selected[active]);
    $("#reset-record").disabled = !item || !changed(active, item) || busy;
    $("#record-dirty").textContent = item && changed(active, item) ? "有未保存的调整" : "";
  }
  renderNav();
  if (active === "overview") renderOverview();
}
function renderOverview() {
  const dirty = foodAdmin.state.count + contentDirty();
  $("#overview-view").innerHTML = `<div class="overview-intro"><div><span class="section-kicker">CONTENT STUDIO / 内容工作台</span><h2 id="overview-title">每一份收藏，都从这里开始。</h2><p>食材、配方、造型和场景，在同一个工作台管理。</p></div><div class="overview-summary"><strong>${characters.length}</strong><span>款独立收藏</span><small>${characters.filter((item) => item.rarity !== "special").length} 款普通 · ${characters.filter((item) => item.rarity === "special").length} 款稀有</small></div></div><div class="overview-grid">${modules.filter((item) => item.id !== "overview").map((item) => `<button type="button" class="overview-card panel" data-module="${item.id}"><span class="overview-card-top"><span class="module-symbol">${item.symbol}</span><span class="overview-number">${countFor(item.id)}</span></span><strong>${item.name}<span aria-hidden="true">↗</span></strong><p>${item.description}</p>${dirtyFor(item.id) ? `<small class="draft-badge">${dirtyFor(item.id)} 项未保存</small>` : ""}</button>`).join("")}</div><div class="overview-note panel"><span class="module-symbol">↳</span><div><h3>${dirty ? `${dirty} 个条目等待保存` : "从一个模块开始编辑"}</h3><p>切换模块会保留草稿。顶部按钮统一保存全部调整，刷新游戏后生效。图片主图与默认分层造型均可预览。</p></div></div>`;
}
function openModule(key, id) {
  if (!modules.some((item) => item.id === key)) key = "overview";
  if (active !== key) { page = 0; category = "all"; }
  active = key;
  if (id && draft[key]?.some((item) => idOf(item) === id)) selected[key] = id;
  history.replaceState(null, "", `#${key}`);
  $("#overview-view").hidden = key !== "overview";
  $("#food-view").hidden = key !== "foods";
  $("#gallery-view").hidden = key !== "gallery";
  $("#content-view").hidden = !draft[key] || key === "artwork";
  if (draft[key] && key !== "artwork") renderManager();
  if (key === "gallery") renderGallery();
  updateStatus();
}
function groupOf(key, item) {
  if (key === "stools" || key === "recipes") return `${record("stools", idOf(item)).homeType} 型`;
  if (key === "toilets") return item.unlock.kind === "open" ? "初始解锁" : "次数解锁";
  if (key === "additives") return item.rareTargets.length ? "稀有增益" : item.decoration ? "表面装饰" : "物态与稳定";
  return item.category;
}
const options = (items, value, empty) => (empty !== undefined ? `<option value="">${esc(empty)}</option>` : "") + items.map((item) => `<option value="${esc(item.id)}"${item.id === value ? " selected" : ""}>${esc(item.name)}</option>`).join("");
const dictionaryOptions = (object) => Object.entries(object).map(([id, name]) => ({ id, name }));
const badge = (value) => `<span class="summary-category">${esc(value)}</span>`;
function artFor(key, item) {
  if (key === "stools" || key === "recipes") return characterSvg(characterById[idOf(item)]);
  if (key === "toilets") return toiletSvg({ ...item, name: esc(item.name) });
  if (key === "additives") return `<span class="supply-symbol" style="color:${esc(item.color)}">${esc(item.symbol)}</span>`;
  return `<svg viewBox="0 0 80 80" role="img" aria-label="${esc(item.name)}"><path d="M19 17h42l-6 46q-15 9-30 0Z" fill="${esc(item.color)}"/><ellipse cx="40" cy="17" rx="21" ry="7" fill="${esc(item.color)}" stroke="white" stroke-width="2"/><path d="m30 28 3 25" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" opacity=".6"/></svg>`;
}
function pagination(selector, current, total, action, pageSize = 10) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  $(selector).innerHTML = `<button type="button" class="button button-quiet" data-${action}="${current - 1}" ${current <= 0 ? "disabled" : ""} aria-label="上一页">←</button><span>第 ${current + 1} / ${pages} 页 · ${total} 项</span><button type="button" class="button button-quiet" data-${action}="${current + 1}" ${current >= pages - 1 ? "disabled" : ""} aria-label="下一页">→</button>`;
}
function renderManager() {
  const module = modules.find((item) => item.id === active);
  $("#module-kicker").textContent = `CONTENT / ${active.toUpperCase()}`;
  $("#module-title").textContent = module.name;
  $("#module-description").textContent = module.description;
  $("#module-count").textContent = `${draft[active].length} 项`;
  const groups = [...new Set(draft[active].map((item) => groupOf(active, item)))];
  $("#record-category").innerHTML = options([{ id: "all", name: "全部分类" }, ...groups.map((id) => ({ id, name: id }))], category);
  renderList(); renderForm();
}
function renderList() {
  const items = draft[active].filter((item) => category === "all" || groupOf(active, item) === category);
  page = Math.min(page, Math.max(0, Math.ceil(items.length / 10) - 1));
  $("#record-count").textContent = `${items.length} 项`;
  $("#record-list").innerHTML = items.slice(page * 10, (page + 1) * 10).map((item) => `<button type="button" class="record-item" data-record="${esc(idOf(item))}" aria-pressed="${selected[active] === idOf(item)}"><span class="record-art">${artFor(active, item)}</span><span class="record-copy"><strong>${esc(nameOf(active, item))}</strong><small>${esc(groupOf(active, item))}</small></span>${changed(active, item) ? '<i class="food-dirty" aria-label="未保存"></i>' : ""}</button>`).join("") || '<p class="empty-list">这个分类暂无条目。</p>';
  pagination("#record-pagination", page, items.length, "record-page");
}
function input(path, label, value, { type = "text", min, max, step = 1, hint = "", maxLength = 300 } = {}) {
  const id = "field-" + path.replaceAll(".", "-");
  return `<label class="form-field" for="${id}"><span>${esc(label)}</span><input id="${id}" data-path="${path}" type="${type}" value="${esc(value)}" ${type === "number" ? `min="${min}" max="${max}" step="${step}"` : `maxlength="${maxLength}"`} ${type === "text" ? "required" : ""}/>${hint ? `<small>${esc(hint)}</small>` : ""}</label>`;
}
function select(path, label, items, value, empty) {
  return `<label class="form-field" for="field-${path.replaceAll(".", "-")}"><span>${esc(label)}</span><select id="field-${path.replaceAll(".", "-")}" data-path="${path}">${options(items, value, empty)}</select></label>`;
}
const area = (path, label, value) => `<label class="form-field field-wide" for="field-${path}"><span>${label}</span><textarea id="field-${path}" data-path="${path}" rows="3" maxlength="300" required>${esc(value)}</textarea></label>`;
const group = (title, fields) => `<fieldset class="form-group"><legend>${title}</legend><div class="form-grid">${fields}</div></fieldset>`;
const propertyInputs = (object, prefix, min = 1, max = 7) => Object.entries(propertyLabels).map(([key, label]) => input(`${prefix}.${key}`, label, object[key] ?? 0, { type: "number", min, max })).join("");
function renderForm() {
  const item = record(active, selected[active]);
  if (!item) return;
  const stool = ["stools", "recipes"].includes(active) ? record("stools", idOf(item)) : null;
  $("#record-summary").innerHTML = `<div class="record-summary-art">${artFor(active, item)}</div><div><span class="summary-id">${esc(idOf(item))}</span><h2>${esc(nameOf(active, item))}</h2><div>${badge(groupOf(active, item))}${stool ? badge(rarityLabels[stool.rarity]) : ""}</div></div>`;
  let fields = "";
  if (active === "recipes") {
    const volumeOptions = values => values.map(value => ({ id: String(value), name: `${value} mL` }));
    fields = group("食物集合 · 1–3 种，不分顺序", [0, 1, 2].map((index) => select(`foodIds.${index}`, `食物 ${index + 1}${index === 0 ? " · 必选" : ""}`, foods, item.foodIds[index] || "", index ? "不添加" : undefined)).join("")) + group("液体、阶段与力度", select("drinkId", "饮料", drinks, item.drinkId) + select("water", "饮用量", volumeOptions(Array.from({ length: 10 }, (_, i) => (i + 1) * 250)), String(item.water)) + select("digestionTime", "消化阶段", ["2", "4", "8"].map(id => ({ id, name: `阶段 ${id}` })), item.digestionTime) + select("forceZone", "力度区间", forceZones.map((zone) => ({ id: zone.id, name: `${zone.name} ${zone.min}–${zone.max}` })), item.forceZone) + select("requiredAdditive", "必选添加剂", additives, item.requiredAdditive || "", "不限，益生菌可选"));
    fields += '<p class="field-note">理想配方普通分支为 80%，只有一个合法候选时为 100%；偏离后平滑变化。益生菌也能稳定自由组合。必需来源始终要满足。</p>';
  } else {
    fields = group("基本资料", input("name", "名称", item.name, { maxLength: 60 }) + (item.category ? input("category", "分类", item.category, { maxLength: 40 }) : "") + area("description", "描述", item.description) + (item.effectLabel ? area("effectLabel", "效果说明", item.effectLabel) : ""));
    if (active === "stools") {
      fields += group("外观资料", input("material", "材质", item.material, { maxLength: 40 }) + input("color", "主体色", item.color, { type: "color" }) + input("light", "高光色", item.light, { type: "color" }));
      fields += group("五项物态属性 · 1–7", propertyInputs(item.properties, "properties"));
      fields += `<p class="field-note">固定分类：${item.homeType} 型 · ${rarityLabels[item.rarity]}。造型标识：${esc(item.art)}。属性用于自由组合候选匹配，图鉴分类保持固定。</p>`;
      if (item.generation) {
        const rule = item.generation.sources;
        const identityLabels = { base: "通用基础造型", enoki: "金针菇身份", corn: "玉米身份", ink: "墨黑身份" };
        const identities = [...new Set(draft.stools.flatMap(stool => stool.generation ? [stool.generation.identity] : []))].map(id => ({ id, name: identityLabels[id] || draft.stools.find(stool => stool.generation?.identity === id).name }));
        const tagNames = { wholegrain: "全谷物来源", petal: "花瓣来源", popping: "跳跳颗粒来源" };
        const sourceTags = [...new Set([...foods, ...drinks, ...additives].flatMap(source => source.tags))].sort().map(id => ({ id, name: tagNames[id] || id }));
        fields += group("生成身份与造型偏好", select("generation.identity", "身份分组", identities, item.generation.identity) + select("generation.forceZone", "造型偏好力度", forceZones, item.generation.forceZone));
        fields += group("必需来源 · 所有已选条件都要满足", [0,1,2].map(index => select(`generation.sources.foods.${index}`, `必需食物 ${index+1}`, foods, rule.foods[index] || "", "不限定食物")).join("") + [0,1,2].map(index => select(`generation.sources.tags.${index}`, `来源标签 ${index+1}`, sourceTags, rule.tags[index] || "", "不限定标签")).join("") + select("generation.sources.pigment", "实际主色素", Object.entries(stoolColors).map(([id,color])=>({id,name:color.name})), rule.pigment || "", "不限定主色") + select("generation.sources.additives.0", "必需添加剂", additives, rule.additives[0] || "", "不限定添加剂"));
        fields += '<p class="field-note">来源条件独立于理想配方；基础造型不设来源门槛。每一型都必须保留基础候选。</p>';
      }
    }
    if (active === "drinks") {
      fields += group("物态与评分", input("wetnessBias", "湿软偏置 · 正湿负干", item.wetnessBias, { type: "number", min: -2, max: 2, step: .01 }) + input("porosity", "蓬松修正", item.porosity, { type: "number", min: 0, max: 6 }) + input("effects.smoothnessBonus", "顺畅评分加成", item.effects.smoothnessBonus || 0, { type: "number", min: -10, max: 10, step: .1 }));
      fields += group("外观与标签", input("color", "饮料颜色", item.color, { type: "color" }) + select("icon", "图标", [{ id: "drop", name: "水滴" }, { id: "coffee", name: "咖啡" }], item.icon) + input("tags", "效果标签", item.tags.join(", "), { hint: "以英文逗号分隔；如 ink、bubbles、milk。" }));
    }
    if (active === "additives") {
      fields += group("外观与评分", input("symbol", "图标符号", item.symbol, { maxLength: 8 }) + input("color", "颜色", item.color, { type: "color" }) + select("decoration", "表面装饰", dictionaryOptions(decorationLabels), item.decoration || "") + input("effects.smoothnessBonus", "顺畅评分加成", item.effects.smoothnessBonus || 0, { type: "number", min: -10, max: 10, step: .1 }));
      fields += group("自由组合属性修正 · −6 至 +6", propertyInputs(item.propertyChanges || {}, "propertyChanges", -6, 6) + input("stability", "稳定强度", item.stability || 0, { type: "number", min: 0, max: 7 }));
      fields += group("稀有目标 · 合计增加 3 个百分点", `<div class="check-grid field-wide">${draft.stools.filter((stool) => stool.rarity === "special").map((stool) => `<label><input type="checkbox" data-rare-target="${stool.id}" ${item.rareTargets.includes(stool.id) ? "checked" : ""}/><span>${esc(stool.name)}</span></label>`).join("")}</div>`);
      fields += group("效果标签", input("tags", "标签", item.tags.join(", "), { hint: "以英文逗号分隔。益生菌配方稳定使用固定 ID probiotic。" }));
    }
    if (active === "toilets") {
      fields += group("造型与效果", input("material", "材质", item.material, { maxLength: 40 }) + input("feature", "特点", item.feature, { maxLength: 60 }) + select("shape", "造型", dictionaryOptions(shapeLabels), item.shape) + input("effects.smoothnessBonus", "顺畅评分加成", item.effects.smoothnessBonus || 0, { type: "number", min: -10, max: 10, step: .1 }));
      fields += group("解锁条件", select("unlock.kind", "解锁方式", [{ id: "open", name: "初始解锁" }, ...(item.id === "standard" ? [] : [{ id: "rounds", name: "累计完成次数" }])], item.unlock.kind) + `<div id="unlock-count-field" ${item.unlock.kind === "open" ? "hidden" : ""}>${input("unlock.count", "累计完成次数", item.unlock.count || 1, { type: "number", min: 1, max: 99999 })}</div>`);
      fields += group("马桶配色", item.palette.ceramic.map((value, index) => input(`palette.ceramic.${index}`, ["亮部", "主体", "暗部"][index], value, { type: "color" })).join(""));
      fields += group("场景标签", input("tags", "标签", item.tags.join(", "), { hint: "以英文逗号分隔。马桶只影响场景和顺畅评分。" }));
    }
  }
  $("#content-form").innerHTML = fields;
  renderInspector(); updateStatus();
}
function recipeText(recipe) {
  const zone = forceZones.find((zone) => zone.id === recipe.forceZone);
  return `${recipe.foodIds.map((id) => foodById[id]?.name || "未选食物").join(" ＋ ")} ＋ ${record("drinks", recipe.drinkId)?.name || "未选饮料"} ${recipe.water} mL · 阶段 ${recipe.digestionTime} · ${zone?.name || "未选力度"} ${zone?.min ?? ""}–${zone?.max ?? ""}${recipe.requiredAdditive ? ` · 需${record("additives", recipe.requiredAdditive)?.name}` : ""}`;
}
function renderInspector() {
  const item = record(active, selected[active]);
  if (!item) return;
  const stool = ["stools", "recipes"].includes(active) ? record("stools", idOf(item)) : null;
  let detail = "";
  if (active === "stools" || active === "recipes") {
    const recipe = record("recipes", idOf(item));
    if (recipe) {
      const zone = forceZones.find((zone) => zone.id === recipe.forceZone);
      const selection = { ...recipe, force: (zone.min + zone.max) / 2, additives: recipe.requiredAdditive ? [recipe.requiredAdditive] : [], toiletId: "standard" };
      const forecast = getRecipeForecast(selection);
      const stabilized = recipe.requiredAdditive ? "需装饰剂" : `${(getRecipeForecast({ ...selection, additives: ["probiotic"] }).recipeProbability * 100).toFixed(1)}%`;
      detail += `<div class="inspector-block"><h3>固定配方</h3><p>${esc(recipeText(recipe))}</p><p>湿软指数 ${forecast.physicalState.score.toFixed(2)} · 基础 ${forecast.physicalState.type} 型</p><div class="forecast-values"><span>整局目标概率<strong>${(forecast.recipeProbability * 100).toFixed(1)}%</strong></span><span>加益生菌后<strong>${stabilized}</strong></span></div><button class="button button-quiet" type="button" data-try-recipe="${esc(idOf(item))}">放进配方试验 ↗</button></div>`;
    } else detail += '<p class="field-note">稀有收藏不设固定配方；每局均有机会出现。</p>';
    if (stool.generation) detail += `<div class="inspector-block"><h3>必需来源</h3><p>${esc(sourceRequirementText(stool))}</p><p>理想配方与必需来源分别配置。</p></div>`;
    detail += `<div class="inspector-block"><h3>物态属性</h3>${Object.entries(propertyLabels).map(([key, label]) => `<div class="property-meter"><span>${label}</span><meter min="1" max="7" value="${stool.properties[key]}"></meter><strong>${stool.properties[key]}</strong></div>`).join("")}</div><div class="inspector-links"><button class="text-button" type="button" data-art="${stool.id}">查看 / 调整大图 ↗</button>${active === "stools" && recipe ? `<button class="text-button" type="button" data-go="recipes" data-id="${stool.id}">编辑配方 ↗</button>` : `<button class="text-button" type="button" data-go="stools" data-id="${stool.id}">编辑大便资料 ↗</button>`}</div>`;
  }
  if (active === "drinks") {
    const recipes = draft.recipes.filter((recipe) => recipe.drinkId === item.id);
    detail = `<div class="inspector-block"><h3>物态效果</h3><p>湿软偏置 ${item.wetnessBias} · 蓬松 +${item.porosity}</p><p>顺畅评分 ${item.effects.smoothnessBonus || 0}</p></div><div class="inspector-block"><h3>关联配方 · ${recipes.length} 款</h3><div class="related-links">${recipes.map((recipe) => `<button type="button" class="text-button" data-go="recipes" data-id="${recipe.characterId}">${esc(nameOf("recipes", recipe))} ↗</button>`).join("") || '<p class="field-note">暂无固定配方使用这款饮料。</p>'}</div></div>`;
  }
  if (active === "additives") {
    detail = `<div class="inspector-block"><h3>本轮效果</h3><p>${esc(item.effectLabel)}</p><p>表面装饰：${decorationLabels[item.decoration || ""]}</p><div class="forecast-values"><span>稀有合计<strong>${item.rareTargets.length ? "5" : "2"}%</strong></span><span>目标数量<strong>${item.rareTargets.length}</strong></span></div>${item.rareTargets.length ? `<p>每个目标额外增加 ${(3 / item.rareTargets.length).toFixed(2)} 个百分点。</p><div class="target-portraits">${item.rareTargets.map((id) => `<button type="button" data-go="stools" data-id="${id}">${characterSvg(characterById[id])}<span>${esc(record("stools", id).name)}</span></button>`).join("")}</div>` : ""}</div>`;
  }
  if (active === "toilets") detail = `<div class="inspector-block"><h3>${item.unlock.kind === "open" ? "初始可用" : `完成 ${item.unlock.count} 次后解锁`}</h3><p>${esc(item.feature)} · ${esc(item.material)}</p><p>顺畅评分 ${item.effects.smoothnessBonus || 0}</p><p>${esc(item.effectLabel)}</p></div>`;
  $("#record-preview").innerHTML = `<div class="inspector-art art-stage">${artFor(active, item)}</div><h2>${esc(nameOf(active, item))}</h2>${stool ? `<p class="inspector-subtitle">布里斯托 ${stool.homeType} 型 · ${rarityLabels[stool.rarity]}</p>` : ""}${detail}`;
}
function setPath(item, path, value) {
  const parts = path.split(".");
  let target = item;
  for (const key of parts.slice(0, -1)) target = target[key] ??= {};
  target[parts.at(-1)] = value;
}
function afterEdit() {
  errorMessage = ""; validationMessage = "";
  try { validateManagedContent(draft); runtimeDraft = copy(draft); applyContent(runtimeDraft); foodAdmin.refreshContent(); }
  catch (error) { validationMessage = error.message; }
  if (draft[active] && active !== "artwork") {
    renderList();
    if (!validationMessage) renderInspector();
    const item = record(active, selected[active]);
    $("#record-summary h2").textContent = nameOf(active, item);
  }
  updateStatus();
}
$("#content-form").addEventListener("submit", (event) => event.preventDefault());
$("#content-form").addEventListener("input", (event) => {
  const control = event.target, item = record(active, selected[active]);
  if (!item) return;
  if (control.dataset.rareTarget) item.rareTargets = [...$("#content-form").querySelectorAll("[data-rare-target]:checked")].map((input) => input.dataset.rareTarget);
  else if (control.dataset.path) {
    const path = control.dataset.path;
    const value = path === "tags" ? [...new Set(control.value.split(/[,，]/).map((value) => value.trim()).filter(Boolean))] : control.type === "number" || path === "water" ? control.value === "" ? NaN : Number(control.value) : ["requiredAdditive", "generation.sources.pigment"].includes(path) ? control.value || null : control.value;
    if (path.startsWith("foodIds.")) {
      // Read all slots before compacting optional selections.
      item.foodIds = [...$("#content-form").querySelectorAll('[data-path^="foodIds."]')].map((input) => input.value).filter(Boolean);
    } else if (/^generation\.sources\.(foods|tags|additives)\./.test(path)) {
      const key = path.split(".")[2];
      item.generation.sources[key] = [...$("#content-form").querySelectorAll(`[data-path^="generation.sources.${key}."]`)].map(control => control.value).filter(Boolean);
    } else if (path === "decoration" && !value) delete item.decoration;
    else setPath(item, path, value);
    if (path === "generation.identity") item.generation.base = value === "base";
    if (path === "unlock.kind") {
      item.unlock = value === "open" ? { kind: "open" } : { kind: "rounds", count: Number($("#field-unlock-count").value) || 1 };
      item.starter = value === "open";
      $("#unlock-count-field").hidden = item.starter;
    }
    if (path.startsWith("palette.ceramic.")) {
      item.palette.tank = [item.palette.ceramic[0], item.palette.ceramic[2]];
      item.palette.bowl = [item.palette.ceramic[2], item.palette.ceramic[1]];
    }
  } else return;
  afterEdit();
});
$("#record-category").addEventListener("change", (event) => {
  category = event.target.value; page = 0;
  const first = draft[active].find((item) => category === "all" || groupOf(active, item) === category);
  if (first) selected[active] = idOf(first);
  renderList(); renderForm();
});
$("#reset-record").addEventListener("click", () => {
  const index = draft[active].findIndex((item) => idOf(item) === selected[active]);
  draft[active][index] = copy(saved[active].find((item) => idOf(item) === selected[active]));
  afterEdit(); renderManager();
});

$("#gallery-type").innerHTML = options([{ id: "all", name: "全部七型" }, ...Array.from({ length: 7 }, (_, i) => ({ id: String(i + 1), name: `布里斯托 ${i + 1} 型` }))], "all");
$("#gallery-rarity").innerHTML = options([{ id: "all", name: "全部稀有度" }, ...dictionaryOptions(rarityLabels)], "all");
function renderGallery() {
  const type = $("#gallery-type").value, rarity = $("#gallery-rarity").value;
  const items = draft.stools.filter((item) => (type === "all" || item.homeType === Number(type)) && (rarity === "all" || item.rarity === rarity));
  galleryPage = Math.min(galleryPage, Math.max(0, Math.ceil(items.length / 12) - 1));
  $("#gallery-grid").dataset.background = $("#gallery-background").value;
  $("#gallery-grid").innerHTML = items.slice(galleryPage * 12, (galleryPage + 1) * 12).map((item) => `<button type="button" class="gallery-card panel" data-art="${item.id}"><span class="gallery-art art-stage">${characterSvg(characterById[item.id])}</span><span class="gallery-card-copy"><strong>${esc(item.name)}</strong><small>${item.homeType} 型 · ${rarityLabels[item.rarity]}${changed("artwork", record("artwork", item.id)) ? " · 主图已调整" : ""}</small></span></button>`).join("") || '<p class="panel empty-gallery">这个分类暂无图片。</p>';
  pagination("#gallery-pagination", galleryPage, items.length, "gallery-page", 12);
}
for (const id of ["gallery-type", "gallery-rarity", "gallery-background"]) $("#" + id).addEventListener("change", () => { galleryPage = 0; renderGallery(); });
function openArt(id) {
  const stool = record("stools", id), artwork = record("artwork", id);
  $("#art-dialog").dataset.id = id;
  $("#art-dialog-title").textContent = stool.name;
  $("#art-dialog-image").innerHTML = characterSvg(characterById[id]);
  $("#art-dialog-image").dataset.background = $("#gallery-background").value;
  $("#art-dialog-caption").textContent = `${stool.homeType} 型 · ${rarityLabels[stool.rarity]} · ${artwork.path ? "项目主图" : "默认分层造型"}`;
  const paths = assets.map((path) => ({ id: path, name: path.replace("/assets/stools/", "") }));
  $("#art-dialog-actions").innerHTML = `<label class="form-field" for="art-path"><span>主图素材</span><select id="art-path" ${!loaded || saving ? "disabled" : ""}>${options(paths, artwork.path, "使用默认分层造型")}</select><small>选择项目现有图片，主图会保留自己的材质；顶部统一保存。</small></label><div class="dialog-action-links"><a class="text-link" href="${esc(artwork.path || `/assets/stools/${id}-${stool.homeType}.png`)}" target="_blank" rel="noopener">打开原图 ↗</a><button class="text-button" type="button" data-reset-art="${id}" ${changed("artwork", artwork) ? "" : "disabled"}>还原主图</button><button class="text-button" type="button" data-go="stools" data-id="${id}">编辑资料 ↗</button></div>`;
  if (!$("#art-dialog").open) $("#art-dialog").showModal();
}
$("#art-dialog-actions").addEventListener("change", (event) => {
  if (event.target.id !== "art-path") return;
  const id = $("#art-dialog").dataset.id;
  record("artwork", id).path = event.target.value;
  afterEdit(); renderGallery(); openArt(id);
});
$("#close-art-dialog").addEventListener("click", () => $("#art-dialog").close());
$("#art-dialog").addEventListener("click", (event) => { if (event.target === $("#art-dialog")) $("#art-dialog").close(); });

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.module) openModule(target.dataset.module);
  if (target.dataset.go) {
    $("#art-dialog").close(); openModule(target.dataset.go, target.dataset.id);
  }
  if (target.dataset.record) { selected[active] = target.dataset.record; renderList(); renderForm(); }
  if (target.dataset.recordPage !== undefined) { page = Number(target.dataset.recordPage); renderList(); }
  if (target.dataset.galleryPage !== undefined) { galleryPage = Number(target.dataset.galleryPage); renderGallery(); }
  if (target.dataset.art) openArt(target.dataset.art);
  if (target.dataset.resetArt) {
    const id = target.dataset.resetArt;
    record("artwork", id).path = saved.artwork.find((item) => item.id === id).path;
    afterEdit(); renderGallery(); openArt(id);
  }
  if (target.dataset.tryRecipe) { foodAdmin.tryRecipe(record("recipes", target.dataset.tryRecipe)); openModule("foods"); }
});

async function responseData(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 409 ? "磁盘配置已被其他窗口更新，草稿已保留；请重新读取后再编辑。" : data.error || `请求失败（${response.status}）`);
  if (data.version !== 1 || typeof data.revision !== "string" || !Array.isArray(data.assets)) throw new Error("内容配置格式不正确。");
  return { ...data, content: validateManagedContent(data.content) };
}
async function loadContent() {
  loading = true; errorMessage = ""; updateStatus();
  try {
    const data = await responseData(await fetch("/api/admin/content", { cache: "no-store" }));
    saved = copy(data.content); draft = copy(data.content); revision = data.revision; assets = data.assets;
    loaded = true; validationMessage = "";
    runtimeDraft = copy(draft); applyContent(runtimeDraft); foodAdmin.refreshContent();
    if (draft[active] && active !== "artwork") renderManager();
    if (active === "gallery") renderGallery();
    if ($("#art-dialog").open) openArt($("#art-dialog").dataset.id);
  } catch (error) { errorMessage = `读取失败：${error.message}`; }
  finally { loading = false; updateStatus(); }
}
async function saveAll() {
  if (saving || !loaded || !foodAdmin.state.loaded) return;
  errorMessage = "";
  try { validateManagedContent(draft); } catch (error) { validationMessage = error.message; updateStatus(); return; }
  saving = true;
  $("#food-view").inert = true;
  $("#art-dialog-actions").inert = true;
  updateStatus();
  try {
    if (contentDirty()) {
      const submitted = copy(draft);
      const data = await responseData(await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: 1, revision, content: submitted }) }));
      saved = copy(data.content); draft = copy(data.content); revision = data.revision; assets = data.assets;
      runtimeDraft = copy(draft); applyContent(runtimeDraft); foodAdmin.refreshContent();
    }
    if (foodAdmin.state.count) await foodAdmin.save();
  } catch (error) { errorMessage = `保存失败：${error.message}`; }
  finally {
    saving = false; $("#food-view").inert = false; $("#art-dialog-actions").inert = false;
    if (draft[active] && active !== "artwork") renderList();
    updateStatus();
  }
}
$("#save-foods").addEventListener("click", saveAll);
$("#reload-data").addEventListener("click", async () => {
  if ((contentDirty() || foodAdmin.state.count) && !window.confirm("重新读取会放弃所有模块未保存的调整，继续吗？")) return;
  await Promise.all([loadContent(), foodAdmin.load()]);
});
window.addEventListener("food-admin-change", updateStatus);
window.addEventListener("beforeunload", (event) => { if (contentDirty()) { event.preventDefault(); event.returnValue = ""; } });
window.addEventListener("hashchange", () => openModule(location.hash.slice(1)));
openModule(location.hash.slice(1));
loadContent();
