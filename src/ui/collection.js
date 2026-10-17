import { bristolTypes } from "../content/stools.js";
import { stoolForms } from "../content/stool-forms.js";
import {
  specimenBlueprints,
  specimenBlueprintById,
} from "../content/specimen-blueprints.js";
import { characterById } from "../content/catalog.js";
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
    detailOpen = false;
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
        `<button data-type-filter="${type.id}" aria-label="${type.label} · ${type.description || type.name}" aria-pressed="${type.id === filter}">${type.label}<span>${type.name}</span></button>`,
    )
    .join("");
  function renderDetail() {
    $("#collection-dialog").classList.toggle("detail-open", detailOpen);
    $("#collection-back").hidden = !detailOpen;
    if (!detailOpen) {
      $("#collection-detail").innerHTML =
        "<p>点击已发现的便便查看个体。真实模样还藏在虚影里，发现后才会揭晓。</p>";
      return;
    }
    const blueprint = specimenBlueprintById[focusedId];
    if (!blueprint) {
      $("#collection-detail").innerHTML = "<p>选择一只便便，看看它的形态。</p>";
      return;
    }
    const type = classifySpecimen(blueprint);
    const records = getSave()
      .individuals.filter((entry) => entry.specimenId === blueprint.id)
      .slice()
      .reverse();
    if (!records.length) {
      $("#collection-detail").innerHTML =
        `<h3>还藏在虚影里</h3><p>这是第 ${type} 型的未知收藏。真实模样还藏在虚影里，发现后才会揭晓。</p><small>换一份餐盘、调整消化时间或力度，试试新的组合。</small>`;
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
      `<h3>${blueprint.name} <small>固定归类 ${type} 型 · 已收集 ${records.length} 个体</small></h3><article class="individual-card" data-individual="${entry.id}"><div class="individual-art">${artwork(entry)}</div><strong>个体 #${String(entry.sequence).padStart(3, "0")}</strong><p>${stoolColors[entry.colorId]?.name || characterById[entry.characterId].material}${marks ? ` · ${marks}` : ""}</p><p>${diagnosis.summary}</p></article><div class="individual-nav"><button data-individual-prev ${individualIndex === 0 ? "disabled" : ""} aria-label="上一个个体">‹</button><span>${individualIndex + 1} / ${records.length} 个独立个体</span><button data-individual-next ${individualIndex >= records.length - 1 ? "disabled" : ""} aria-label="下一个个体">›</button></div>`;
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
        return `<button class="stool-card ${recorded ? "collected" : "uncollected"} ${focusedId === blueprint.id ? "focused" : ""}" data-stool="${blueprint.id}" aria-pressed="${focusedId === blueprint.id}"><span class="stool-art">${recorded ? artwork(recorded) : mysterySvg()}</span><span class="stool-title"><strong>${recorded ? blueprint.name : "未发现的便便"}</strong><span>第 ${classifySpecimen(blueprint)} 型${recorded ? " · 已收集" : " · 虚影"}</span></span></button>`;
      })
      .join("");
    renderDetail();
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
    $("#collection-summary").textContent =
      `畅快 ${save.total} 次 · ${discovered.size} / ${specimenBlueprints.length} 种便便 · ${individuals.length} 个独立个体`;
  }
  $("#bristol-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-stool]");
    if (!button) return;
    focusedId = button.dataset.stool;
    individualIndex = 0;
    detailOpen = getSave().individuals.some(
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
    if (event.target.closest("[data-individual-prev]")) individualIndex--;
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
