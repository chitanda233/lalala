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
import { rareBudget } from "../game/rare-probabilities.js";
import { outcomeMarks } from "../content/marks.js";
import { stoolColors } from "../content/colors.js";
import { classifySpecimen } from "../game/specimen.js";
import { diagnoseOutcome } from "../game/explanation.js";
import { characterSvg, mysterySvg } from "./artwork/stools.js";
import { renderPage } from "./pagination.js";
import { $, $$ } from "./dom.js";
import { rareRevealTheme } from "./rare-reveal.js";
import { collectionDisplayOrder } from "./collection-order.js";

function rareCardAttributes(character, unlocked = true) {
  const theme = rareRevealTheme(character);
  return theme
    ? `data-rare-card="${character.id}" data-rare-motif="${theme.motif}" data-rare-unlocked="${unlocked}" style="--rare-accent:${theme.accent};--rare-glow:${theme.glow}"`
    : "";
}
function unlockedAura(character, unlocked = true) {
  return unlocked && rareRevealTheme(character)
    ? '<span class="rare-unlock-aura" aria-hidden="true"></span>'
    : "";
}
function rareCardEffects(character, unlocked = true) {
  return rareRevealTheme(character)
    ? `<span class="rare-card-sheen" aria-hidden="true"></span>${unlockedAura(character, unlocked)}`
    : "";
}
function individualArt(character, svg) {
  return `<div class="individual-art${rareRevealTheme(character) ? " rare-collection-card" : ""}" ${rareCardAttributes(character)}>${rareCardEffects(character)}${svg}</div>`;
}

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
  const displaySpecimens = collectionDisplayOrder(specimenBlueprints);
  let filter = "all",
    page = 0,
    focusedId = null,
    detailOpen = false,
    detailPanel = "art",
    individualPage = 0,
    previewAll = false,
    revealFocused = false;
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
  function detailSpecimens() {
    const discovered = new Set(getSave().discoveredSpecimens);
    return displaySpecimens.filter(item => previewAll || discovered.has(item.id));
  }
  function detailHeading(blueprint, type, preview = false) {
    return `<h3 aria-live="polite">${blueprint.name}<small>${preview ? `第 ${type} 型 · 样式预览` : `固定归类 ${type} 型`}</small></h3>`;
  }
  function detailArtwork(character, svg) {
    const disabled = detailSpecimens().length < 2 ? "disabled" : "";
    const label = previewAll ? "图鉴" : "已解锁图鉴";
    return `<div class="collection-art-carousel" role="group" aria-label="切换图鉴"><button data-specimen-prev aria-label="上一个${label}" ${disabled}>‹</button>${individualArt(character, svg)}<button data-specimen-next aria-label="下一个${label}" ${disabled}>›</button></div>`;
  }
  function returnToList() {
    detailOpen = false;
    const blueprint = specimenBlueprintById[focusedId];
    if (blueprint && filter !== "all" && filter !== String(classifySpecimen(blueprint)))
      filter = "all";
    revealFocused = true;
    render();
    $(`[data-stool="${focusedId}"]`)?.focus({ preventScroll: true });
  }
  function detailTabs() {
    return `<div class="individual-nav" role="group" aria-label="详情内容">${[["art","形态"],["recipe","配方"],["source","来源"]].map(([id,label]) => `<button data-detail-panel="${id}" aria-pressed="${detailPanel === id}" ${detailPanel === id ? "disabled" : ""}>${label}</button>`).join("")}</div>`;
  }
  function individualNavigation(entry, total) {
    const title = `个体 #${String(entry.sequence).padStart(3, "0")}`;
    const count = entry.occurrenceCount > 1 ? ` · 共${entry.occurrenceCount}次` : "";
    if (total < 2) return `<strong>${title}${count}</strong>`;
    return `<nav class="individual-history-nav" aria-label="本款实际记录"><button data-individual-prev aria-label="查看较新的记录" ${individualPage === 0 ? "disabled" : ""}>‹</button><div><strong>${title}</strong><small>${individualPage + 1} / ${total}${count}</small></div><button data-individual-next aria-label="查看较早的记录" ${individualPage === total - 1 ? "disabled" : ""}>›</button></nav>`;
  }
  function sourceDetail(characterId) {
    const character = characterById[characterId];
    const zone = character.generation && forceZones.find(item => item.id === character.generation.forceZone);
    return `<article class="individual-card" data-source-for="${characterId}"><div><h3>来源条件</h3><p>${sourceRequirementText(character)}</p>${zone ? `<p>普通物态：第${character.homeType}型</p><p>造型偏好：${zone.name}</p><p>力度只影响同身份内造型。</p><p>理想配方用于提高概率；必需来源始终要满足。</p>` : "<p>每轮独立抽稀有，不受普通物态或原料限制。</p>"}</div></article>`;
  }
  function recipeDetail(characterId) {
    const recipe = stoolRecipeByCharacterId[characterId];
    if (!recipe) {
      const baseline = rareBudget(null);
      const theme = rareThemeRecipeById[characterId];
      const boost = theme ? rareBudget(additiveById[theme.additiveId]) : null;
      const themed = theme ? `<p>${theme.foodIds.map(id => foodById[id].name).join("＋")}</p><p>${drinkById[theme.drinkId].name} ${theme.water} mL</p><p>阶段 ${theme.digestionTime} · ${forceZones.find(zone => zone.id === theme.forceZone).name}</p><p>主题添加剂：${additiveById[theme.additiveId].name}</p><br>` : "";
      const baseProbability = baseline.entries.find(entry => entry.characterId === characterId)?.probability || 0;
      const boostedProbability = boost?.entries.find(entry => entry.characterId === characterId)?.probability || 0;
      return `<article class="individual-card" data-recipe-for="${characterId}"><div><h3>稀有主题搭配</h3>${themed}<p>无关联组：全体稀有均分基础 ${(baseline.rareProbability * 100).toFixed(0)}%，本款 ${(baseProbability * 100).toFixed(2)}%。</p>${boost ? `<p>使用主题添加剂：本款 ${(boostedProbability * 100).toFixed(2)}%。${boost.targets.length ? `当前目标组共享20%，每款${Number((boost.targetProbability * 100 / boost.targets.length).toFixed(2))}%；组外稀有概率为0。${boost.targets.includes(characterId) ? "" : "本款不在当前目标组。"}` : "当前没有有效关联组，沿用基础稀有概率。"}</p>` : ""}<p>主题搭配不是出现门槛；稀有保留自身固定造型。</p></div></article>`;
    }
    const zone = forceZones.find((item) => item.id === recipe.forceZone);
    const additiveText = recipe.requiredAdditive ? `必选${additiveById[recipe.requiredAdditive].name}，不能再加益生菌。` : "益生菌也能稳定自由组合。";
    let probabilityText;
    try {
      const forecast = getRecipeForecast({ ...recipe, additives: recipe.requiredAdditive ? [recipe.requiredAdditive] : [], force: zone.min }, characterId);
      const stabilized = recipe.requiredAdditive ? null : getRecipeForecast({ ...recipe, additives: ["probiotic"], force: zone.min }, characterId);
      probabilityText = `本款概率<br>未中稀有后 ${(forecast.targetConditionalProbability * 100).toFixed(0)}% · 整局 ${(forecast.targetProbability * 100).toFixed(1)}%${stabilized ? `<br>益生菌：普通分支 ${(stabilized.targetConditionalProbability * 100).toFixed(0)}% · 整局 ${(stabilized.targetProbability * 100).toFixed(0)}%` : ""}<br>当前主结果：${characterById[forecast.primaryCharacterId].name} · 整局 ${(forecast.primaryProbability * 100).toFixed(1)}%`;
    } catch (error) { probabilityText = `预览暂不可用：${error.message}`; }
    return `<article class="individual-card" data-recipe-for="${characterId}"><div><h3>固定配方</h3><p>${recipe.foodIds.map((id) => foodById[id].name).join("＋")}</p><p>${drinkById[recipe.drinkId].name} ${recipe.water} mL</p><p>消化阶段 ${recipe.digestionTime}</p><strong>${zone.name} · ${zone.min}–${zone.max}</strong><p>${additiveText}</p><br><p>${probabilityText}</p></div></article>`;
  }
  function renderDetail() {
    $("#collection-dialog").classList.toggle("detail-open", detailOpen);
    $("#collection-back").hidden = !detailOpen;
    $("#collection-close").setAttribute("aria-label", detailOpen ? "关闭详情" : "关闭图鉴");
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
    const entries = getSave().individuals
      .filter(entry => entry.specimenId === blueprint.id)
      .sort((a, b) => b.sequence - a.sequence);
    individualPage = Math.max(0, Math.min(individualPage, entries.length - 1));
    const entry = entries[individualPage];
    if (previewAll && !entry) {
      const character = characterById[blueprint.characterId];
      $("#collection-detail").innerHTML =
        `${detailHeading(blueprint, type, true)}${detailTabs()}${detailPanel === "recipe" ? recipeDetail(character.id) : detailPanel === "source" ? sourceDetail(character.id) : `<article class="individual-card" data-style-preview="${blueprint.id}">${detailArtwork(character, characterSvg(character, false, type))}<p>${character.description}</p></article>`}`;
      return;
    }
    if (!entry) {
      const character = characterById[blueprint.characterId];
      $("#collection-detail").innerHTML =
        `${detailHeading(blueprint, type)}${detailTabs()}${detailPanel === "recipe" ? recipeDetail(character.id) : detailPanel === "source" ? sourceDetail(character.id) : `<article class="individual-card" data-discovered="${blueprint.id}">${detailArtwork(character, characterSvg(character, false, type))}<p>${character.description}</p><p>暂无保留个体</p></article>`}`;
      return;
    }
    const diagnosis = diagnoseOutcome(entry);
    const marks = entry.marks.map((mark) => outcomeMarks[mark].name).join("、");
    $("#collection-detail").innerHTML =
      `${detailHeading(blueprint, type)}${detailTabs()}${detailPanel === "recipe" ? recipeDetail(entry.characterId) : detailPanel === "source" ? sourceDetail(entry.characterId) : `<article class="individual-card" data-individual="${entry.id}">${detailArtwork(characterById[entry.characterId], artwork(entry))}${individualNavigation(entry, entries.length)}<p>${stoolColors[entry.colorId]?.name || characterById[entry.characterId].material}${marks ? ` · ${marks}` : ""}</p><p>${diagnosis.summary}</p></article>`}`;
  }
  function render() {
    const save = getSave();
    const individuals = save.individuals;
    const discovered = new Set(save.discoveredSpecimens);
    const discoveredTypes = new Set([...discovered].map(id => classifySpecimen(specimenBlueprintById[id])));
    $("#collection-count").textContent = String(discoveredTypes.size).padStart(
      2,
      "0",
    );
    $("#collection-count").title =
      `已发现 ${discoveredTypes.size} / 7 型 · ${discovered.size} 种便便 · 保留 ${individuals.length} 条记录`;
    $("#collection-total").textContent = `${discoveredTypes.size} / 7 型`;
    $$("[data-type-filter]").forEach((button) => {
      const selected = button.dataset.typeFilter === filter;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected);
    });
    const visible = filter === "all" ? displaySpecimens : collectionDisplayOrder(
      specimenBlueprints.filter(blueprint => String(classifySpecimen(blueprint)) === filter),
    );
    $("#bristol-grid").innerHTML = visible
      .map((blueprint) => {
        const known = discovered.has(blueprint.id);
        const character = characterById[blueprint.characterId];
        const rare = rareRevealTheme(character);
        return `<button class="stool-card ${known ? "collected" : "uncollected"} ${focusedId === blueprint.id ? "focused" : ""}${rare ? " rare-collection-card" : ""}" ${rare ? rareCardAttributes(character, previewAll || known) : ""} data-stool="${blueprint.id}" aria-pressed="${focusedId === blueprint.id}">${rareCardEffects(character, previewAll || known)}<span class="stool-art">${previewAll || known ? characterSvg(character, false, classifySpecimen(blueprint)) : mysterySvg()}</span><span class="stool-title"><strong>${previewAll || known ? blueprint.name : "未发现的便便"}</strong><span>${rare ? "✦ 稀有 · " : ""}第 ${classifySpecimen(blueprint)} 型</span></span></button>`;
      })
      .join("");
    $("#collection-dialog").classList.toggle("detail-open", detailOpen);
    if (!detailOpen) {
      const cards = $$("#bristol-grid .stool-card");
      page = renderPage("collection", cards, page,
        revealFocused ? cards.find(card => card.dataset.stool === focusedId) : null);
      revealFocused = false;
      const currentPage = cards.filter((card) => !card.hidden);
      if (!currentPage.some((card) => card.dataset.stool === focusedId)) {
        focusedId = currentPage[0]?.dataset.stool;
      }
    }
    $$("[data-stool]").forEach((button) => {
      const focused = button.dataset.stool === focusedId;
      button.classList.toggle("focused", focused);
      button.setAttribute("aria-pressed", focused);
    });
    renderDetail();
    $("#collection-summary").textContent =
      `畅快 ${save.total} 次 · ${discovered.size} / ${specimenBlueprints.length} 种便便 · 保留 ${individuals.length} 条记录`;
  }
  $("#collection-preview-all").addEventListener("change", (event) => {
    previewAll = event.target.checked;
    if (detailOpen && !previewAll)
      detailOpen = getSave().discoveredSpecimens.includes(focusedId);
    detailPanel = "art";
    individualPage = 0;
    render();
    if (previewAll) $("#collection-preview-notice").showModal();
  });
  $("#collection-preview-notice").addEventListener("close", () => {
    if ($("#collection-dialog").open)
      $("#collection-preview-all").focus({ preventScroll: true });
  });
  $("#bristol-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-stool]");
    if (!button) return;
    focusedId = button.dataset.stool;
    detailPanel = "art";
    individualPage = 0;
    detailOpen = previewAll || getSave().discoveredSpecimens.includes(focusedId);
    render();
    if (detailOpen) $("#collection-back").focus({ preventScroll: true });
  });
  $("#type-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-type-filter]");
    if (!button) return;
    filter = button.dataset.typeFilter;
    page = 0;
    focusedId = null;
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
    const specimenPrevious = event.target.closest("[data-specimen-prev]");
    const specimenNext = event.target.closest("[data-specimen-next]");
    if (specimenPrevious || specimenNext) {
      const button = specimenPrevious || specimenNext;
      if (button.disabled) return;
      const specimens = detailSpecimens();
      const index = specimens.findIndex(item => item.id === focusedId);
      if (index < 0 || specimens.length < 2) return;
      focusedId = specimens[(index + (specimenNext ? 1 : -1) + specimens.length) % specimens.length].id;
      individualPage = 0;
      renderDetail();
      $(specimenNext ? "[data-specimen-next]" : "[data-specimen-prev]")?.focus({ preventScroll: true });
      return;
    }
    const previous = event.target.closest("[data-individual-prev]");
    const next = event.target.closest("[data-individual-next]");
    if (previous || next) {
      if ((previous || next).disabled) return;
      individualPage += next ? 1 : -1;
      renderDetail();
      $(next ? "[data-individual-next]" : "[data-individual-prev]")?.focus({ preventScroll: true });
      return;
    }
    const tab = event.target.closest("[data-detail-panel]");
    if (!tab) return;
    detailPanel = tab.dataset.detailPanel;
    renderDetail();
  });
  $("#collection-back").addEventListener("click", returnToList);
  $("#collection-close").addEventListener("click", () => {
    if (detailOpen) returnToList();
    else $("#collection-dialog").close();
  });
  $("#collection-dialog").addEventListener("cancel", (event) => {
    if (!detailOpen) return;
    event.preventDefault();
    returnToList();
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
