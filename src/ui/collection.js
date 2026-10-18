import { bristolTypes } from "../content/stools.js";
import { stoolForms } from "../content/stool-forms.js";
import {
  specimenBlueprints,
  specimenBlueprintById,
} from "../content/specimen-blueprints.js";
import { characterById, foodById, drinkById, additiveById } from "../content/catalog.js";
import { rareThemeRecipeById } from "../content/rare-theme-recipes.js";
import { stoolRecipeByCharacterId } from "../content/stool-recipes.js";
import { forceZones } from "../content/force.js";
import { getRecipeForecast } from "../game/outcome-pool.js";
import { sourceRequirementText } from "../game/source-conditions.js";
import { outcomeMarks } from "../content/marks.js";
import { stoolColors } from "../content/colors.js";
import { classifySpecimen } from "../game/specimen.js";
import { diagnoseOutcome } from "../game/explanation.js";
import { characterSvg, mysterySvg } from "./artwork/stools.js";
import { renderPage } from "./pagination.js";
import { $, $$ } from "./dom.js";

const artwork = (entry) =>
  characterSvg(
    characterById[entry.characterId],
    false,
    entry.type,
    entry.colorId,
    entry.marks,
    entry.appearance,
  );
export function createCollectionView(getSave) {
  let filter = "all",
    page = 0,
    focusedId = null,
    individualIndex = 0,
    detailOpen = false,
    detailPanel = "art",
    previewAll = false;
  $("#type-filters").innerHTML = [
    { id: "all", label: "全部", name: "全部形态" },
    ...bristolTypes.map((type) => ({
      id: String(type.id),
      label: `${type.id} 型`,
      name: stoolForms[type.id - 1].shortName,
      description: type.name,
    })),
  ]
    .map(
      (type) =>
        `<button data-type-filter="${type.id}" aria-label="${type.label} · ${type.description || type.name}" aria-pressed="${type.id === filter}">${type.label}${type.id === "all" ? "" : `<span>${type.name}</span>`}</button>`,
    )
    .join("");
  function detailTabs() {
    return `<div class="individual-nav" role="group" aria-label="详情内容">${[["art","形态"],["recipe","配方"],["source","来源"]].map(([id,label]) => `<button data-detail-panel="${id}" aria-pressed="${detailPanel === id}" ${detailPanel === id ? "disabled" : ""}>${label}</button>`).join("")}</div>`;
  }
  function sourceDetail(characterId) {
    const character = characterById[characterId];
    const zone = character.generation && forceZones.find(item => item.id === character.generation.forceZone);
    return `<article class="individual-card" data-source-for="${characterId}"><div><h3>来源条件</h3><p>${sourceRequirementText(character)}</p>${zone ? `<p>普通物态：第${character.homeType}型</p><p>造型偏好：${zone.name}</p><p>力度只影响同身份内造型。</p><p>理想配方用于提高概率；必需来源始终要满足。</p>` : "<p>每轮独立抽稀有，不受普通物态或原料限制。</p>"}</div></article>`;
  }
  function recipeDetail(characterId) {
    const recipe = stoolRecipeByCharacterId[characterId];
    if (!recipe) {
      const forecast = getRecipeForecast({ additives: [] });
      const theme = rareThemeRecipeById[characterId];
      const themed = theme ? `<p>${theme.foodIds.map(id => foodById[id].name).join("＋")}</p><p>${drinkById[theme.drinkId].name} ${theme.water} mL</p><p>阶段 ${theme.digestionTime} · ${forceZones.find(zone => zone.id === theme.forceZone).name}</p><p>主题添加剂：${additiveById[theme.additiveId].name}</p><br>` : "";
      return `<article class="individual-card" data-recipe-for="${characterId}"><div><h3>稀有主题搭配</h3>${themed}<p>每局先抽稀有，基础合计 ${(forecast.rareProbability * 100).toFixed(0)}%，各款 0.2%。</p><p>主题食物、水量和阶段不是出现门槛；对应稀有添加剂才提高概率。</p></div></article>`;
    }
    const zone = forceZones.find((item) => item.id === recipe.forceZone);
    const forecast = getRecipeForecast({ ...recipe, additives: recipe.requiredAdditive ? [recipe.requiredAdditive] : [], force: zone.min });
    const stabilized = getRecipeForecast({ ...recipe, additives: ["probiotic"], force: zone.min });
    const additiveText = recipe.requiredAdditive ? `必选${additiveById[recipe.requiredAdditive].name}，不能再加益生菌。` : "益生菌也能稳定自由组合。";
    const probabilityText = recipe.requiredAdditive
      ? `未中稀有后 ${(forecast.recipeConditionalProbability * 100).toFixed(0)}% · 整局 ${(forecast.recipeProbability * 100).toFixed(1)}%`
      : `未中稀有：基础 ${(forecast.recipeConditionalProbability * 100).toFixed(0)}% · 益生菌 100%<br>整局：基础 ${(forecast.recipeProbability * 100).toFixed(1)}% · 益生菌 ${(stabilized.recipeProbability * 100).toFixed(0)}%`;
    return `<article class="individual-card" data-recipe-for="${characterId}"><div><h3>固定配方</h3><p>${recipe.foodIds.map((id) => foodById[id].name).join("＋")}</p><p>${drinkById[recipe.drinkId].name} ${recipe.water} mL</p><p>消化阶段 ${recipe.digestionTime}</p><strong>${zone.name} · ${zone.min}–${zone.max}</strong><p>${additiveText}</p><br><p>${probabilityText}</p></div></article>`;
  }
  function renderDetail() {
    $("#collection-dialog").classList.toggle("detail-open", detailOpen);
    $("#collection-back").hidden = !detailOpen;
    if (!detailOpen) {
      const blueprint = specimenBlueprintById[focusedId];
      const type = blueprint ? bristolTypes[classifySpecimen(blueprint) - 1] : null;
      $("#collection-detail").innerHTML = type
        ? `<p>${type.id} 型建议：${type.hint}</p>`
        : "<p>选择一个分类，查看更容易出现的搭配。</p>";
      return;
    }
    const blueprint = specimenBlueprintById[focusedId];
    if (!blueprint) {
      $("#collection-detail").innerHTML = "<p>选择一只便便，看看它的形态。</p>";
      return;
    }
    const type = classifySpecimen(blueprint);
    if (previewAll) {
      const character = characterById[blueprint.characterId];
      $("#collection-detail").innerHTML =
        `<h3>${blueprint.name}<small>第 ${type} 型 · 样式预览</small></h3>${detailTabs()}${detailPanel === "recipe" ? recipeDetail(character.id) : detailPanel === "source" ? sourceDetail(character.id) : `<article class="individual-card" data-style-preview="${blueprint.id}"><div class="individual-art">${characterSvg(character, false, type)}</div><p>${character.description}</p></article>`}`;
      return;
    }
    const records = getSave()
      .individuals.filter((entry) => entry.specimenId === blueprint.id)
      .slice()
      .reverse();
    if (!records.length) {
      $("#collection-detail").innerHTML =
        `<p>${type} 型建议：${bristolTypes[type - 1].hint}</p>`;
      return;
    }
    individualIndex = Math.max(
      0,
      Math.min(individualIndex, records.length - 1),
    );
    const entry = records[individualIndex];
    const diagnosis = diagnoseOutcome(entry);
    const marks = entry.marks.map((mark) => outcomeMarks[mark].name).join("、");
    $("#collection-detail").innerHTML =
      `<h3>${blueprint.name} <small>固定归类 ${type} 型</small></h3>${detailTabs()}${detailPanel === "recipe" ? recipeDetail(entry.characterId) : detailPanel === "source" ? sourceDetail(entry.characterId) : `<article class="individual-card" data-individual="${entry.id}"><div class="individual-art">${artwork(entry)}</div><strong>个体 #${String(entry.sequence).padStart(3, "0")}</strong><p>${stoolColors[entry.colorId]?.name || characterById[entry.characterId].material}${marks ? ` · ${marks}` : ""}</p><p>${diagnosis.summary}</p></article>`}<div class="individual-nav"><button data-individual-prev ${individualIndex === 0 ? "disabled" : ""} aria-label="上一个个体">‹</button><span>${individualIndex + 1} / ${records.length} 个独立个体</span><button data-individual-next ${individualIndex >= records.length - 1 ? "disabled" : ""} aria-label="下一个个体">›</button></div>`;
  }
  function render() {
    const save = getSave();
    const individuals = save.individuals;
    const discoveredTypes = new Set(individuals.map(classifySpecimen));
    const discovered = new Set(individuals.map((entry) => entry.specimenId));
    $("#collection-count").textContent = String(discoveredTypes.size).padStart(
      2,
      "0",
    );
    $("#collection-count").title =
      `已发现 ${discoveredTypes.size} / 7 型 · ${discovered.size} 种便便 · ${individuals.length} 个独立个体`;
    $("#collection-total").textContent = `${discoveredTypes.size} / 7 型`;
    $$("[data-type-filter]").forEach((button) => {
      const selected = button.dataset.typeFilter === filter;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected);
    });
    const visible = specimenBlueprints.filter(
      (blueprint) =>
        filter === "all" || String(classifySpecimen(blueprint)) === filter,
    );
    $("#bristol-grid").innerHTML = visible
      .map((blueprint) => {
        const recorded = individuals.findLast(
          (entry) => entry.specimenId === blueprint.id,
        );
        return `<button class="stool-card ${recorded ? "collected" : "uncollected"} ${focusedId === blueprint.id ? "focused" : ""}" data-stool="${blueprint.id}" aria-pressed="${focusedId === blueprint.id}"><span class="stool-art">${previewAll ? characterSvg(characterById[blueprint.characterId], false, classifySpecimen(blueprint)) : recorded ? artwork(recorded) : mysterySvg()}</span><span class="stool-title"><strong>${previewAll || recorded ? blueprint.name : "未发现的便便"}</strong><span>第 ${classifySpecimen(blueprint)} 型</span></span></button>`;
      })
      .join("");
    $("#collection-dialog").classList.toggle("detail-open", detailOpen);
    if (!detailOpen) {
      const cards = $$("#bristol-grid .stool-card");
      page = renderPage("collection", cards, page);
      const currentPage = cards.filter((card) => !card.hidden);
      if (!currentPage.some((card) => card.dataset.stool === focusedId)) {
        focusedId = currentPage[0]?.dataset.stool;
        individualIndex = 0;
      }
    }
    $$("[data-stool]").forEach((button) => {
      const focused = button.dataset.stool === focusedId;
      button.classList.toggle("focused", focused);
      button.setAttribute("aria-pressed", focused);
    });
    renderDetail();
    $("#collection-summary").textContent =
      `畅快 ${save.total} 次 · ${discovered.size} / ${specimenBlueprints.length} 种便便 · ${individuals.length} 个独立个体`;
  }
  $("#collection-preview-all").addEventListener("change", (event) => {
    previewAll = event.target.checked;
    if (detailOpen && !previewAll)
      detailOpen = getSave().individuals.some(entry => entry.specimenId === focusedId);
    individualIndex = 0;
    detailPanel = "art";
    render();
  });
  $("#bristol-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-stool]");
    if (!button) return;
    focusedId = button.dataset.stool;
    individualIndex = 0;
    detailPanel = "art";
    detailOpen = previewAll || getSave().individuals.some(
      (entry) => entry.specimenId === focusedId,
    );
    render();
    if (detailOpen) $("#collection-back").focus({ preventScroll: true });
  });
  $("#type-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-type-filter]");
    if (!button) return;
    filter = button.dataset.typeFilter;
    page = 0;
    focusedId = null;
    individualIndex = 0;
    render();
  });
  $("#collection-prev").addEventListener("click", () => {
    page--;
    render();
  });
  $("#collection-next").addEventListener("click", () => {
    page++;
    render();
  });
  $("#collection-detail").addEventListener("click", (event) => {
    const tab = event.target.closest("[data-detail-panel]");
    if (tab) detailPanel = tab.dataset.detailPanel;
    else if (event.target.closest("[data-individual-prev]")) individualIndex--;
    else if (event.target.closest("[data-individual-next]")) individualIndex++;
    else return;
    renderDetail();
  });
  $("#collection-back").addEventListener("click", () => {
    detailOpen = false;
    render();
    $(`[data-stool="${focusedId}"]`)?.focus({ preventScroll: true });
  });
  $("#collection-dialog").addEventListener("close", () => {
    detailOpen = false;
    renderDetail();
  });
  window.addEventListener("layoutchange", () => {
    if ($("#collection-dialog").open) render();
  });
  return { render };
}
