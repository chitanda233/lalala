import { drinks } from "../content/drinks.js";
import { additives } from "../content/additives.js";
import { drinkById, additiveById } from "../content/catalog.js";
import { gameConfig } from "../config/game.js";
import { $, $$ } from "./dom.js";
import { renderPage } from "./pagination.js";

const drinkArt = (drink) =>
  `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m17 15 4 37q11 6 22 0l4-37Z" fill="${drink.color}" opacity=".75" stroke="${drink.color}" stroke-width="2"/><ellipse cx="32" cy="15" rx="15" ry="5" fill="${drink.color}"/><path d="m26 23 2 21" stroke="#fffdf2" stroke-width="3" stroke-linecap="round" opacity=".7"/>${drink.tags.includes("tapioca") ? '<g fill="#584333"><circle cx="26" cy="44" r="3"/><circle cx="34" cy="46" r="3"/><circle cx="40" cy="42" r="3"/><circle cx="31" cy="38" r="3"/></g>' : drink.tags.includes("grass-jelly") ? '<g fill="#443d32"><rect x="23" y="33" width="7" height="8" rx="2"/><rect x="34" y="40" width="7" height="8" rx="2"/><rect x="34" y="27" width="7" height="8" rx="2"/></g>' : ""}${drink.tags.includes("bubbles") ? '<g fill="#fffdf2"><circle cx="35" cy="31" r="3"/><circle cx="39" cy="43" r="2"/><circle cx="31" cy="46" r="1.5"/></g>' : ""}</svg>`;

const additiveArt = item => `<span class="additive-icon" style="color:${item.color};background:${item.color}22" aria-hidden="true">${item.symbol}</span>`;

export function createSuppliesView({ getSelection, onChange }) {
  let locked = false, page = 0, kind = "drink", focusedId = "water", draft = null;
  const dialog = $("#supply-dialog");
  const items = () => kind === "drink" ? drinks : additives;
  const selectedId = () => kind === "drink" ? draft.drinkId : draft.additives[0];
  const itemArt = item => kind === "drink" ? drinkArt(item) : additiveArt(item);

  Object.assign($("#water"), {
    min: gameConfig.water.min, max: gameConfig.water.max, step: gameConfig.water.step,
  });
  $("#water-stops").innerHTML = Array.from(
    { length: (gameConfig.water.max - gameConfig.water.min) / gameConfig.water.step + 1 },
    (_, index) => `<span>${gameConfig.water.min + index * gameConfig.water.step}</span>`,
  ).join("");
  function open(choice) {
    if (locked) return;
    kind = choice;
    draft = structuredClone(getSelection());
    focusedId = selectedId() || items()[0].id;
    page = 0;
    $("#supply-dialog-title").textContent = kind === "drink" ? "今天喝点什么" : "给配方加一点想象";
    $("#supply-intro").textContent = kind === "drink" ? `${drinks.length} 种饮料 · 选一种` : `${additives.length} 种添加剂 · 可不加`;
    $("#drink-library").hidden = kind !== "drink";
    $("#additive-library").hidden = kind !== "additive";
    $("#water-section").hidden = kind !== "drink";
    dialog.showModal();
    renderDialog(true);
  }
  for (const choice of ["drink", "additive"])
    $(`#choose-${choice}s`).addEventListener("click", () => open(choice));

  function renderDialog(revealFocused = false) {
    if (!draft) return;
    const selected = selectedId();
    const grid = $(kind === "drink" ? "#drink-options" : "#additive-options");
    grid.innerHTML = items().map(item => {
      const added = item.id === selected;
      const action = kind === "drink"
        ? `<button class="card-action" data-add-drink="${item.id}" aria-label="${added ? "已加入" : "加入"}${item.name}" ${added || locked ? "disabled" : ""}>${added ? "✓" : "＋"}</button>`
        : `<input type="checkbox" class="additive-input" value="${item.id}" aria-label="${item.name}" ${added ? "checked" : ""} ${locked ? "disabled" : ""}/>`;
      return `<article class="food-card supply-card ${added ? "selected" : ""} ${item.id === focusedId ? "focused" : ""}" data-supply-card="${item.id}"><button class="food-card-main ${kind === "drink" ? "drink-choice" : ""}" data-${kind}="${item.id}" aria-pressed="${item.id === focusedId}" ${locked ? "disabled" : ""}>${itemArt(item)}<strong>${item.name}</strong>${kind === "drink" ? `<span>${item.category}</span>` : ""}</button>${action}</article>`;
    }).join("");
    const focused = items().find(item => item.id === focusedId) || items()[0];
    $("#supply-details").innerHTML = `<div class="food-detail-art">${itemArt(focused)}</div><h3>${focused.name}</h3><p>${focused.description}</p>`;
    $("#supply-cart-title").textContent = kind === "drink" ? "这次喝这个" : "这次加这个";
    $("#supply-draft-count").textContent = `${selected ? 1 : 0} / 1`;
    const chosen = items().find(item => item.id === selected);
    $("#supply-slots").innerHTML = `<article class="food-slot supply-slot"><button class="food-slot-main" data-current-supply aria-label="${chosen ? `查看已加入的${chosen.name}` : "选择配料"}">${chosen ? `${itemArt(chosen)}<span class="supply-slot-copy"><strong>${chosen.name}</strong>${kind === "drink" ? `<small>${draft.water.toLocaleString("en-US")} mL</small>` : ""}</span>` : `<span class="food-slot-plus">＋</span><span>添加${kind === "drink" ? "饮料" : "添加剂"}</span>`}</button>${chosen ? `<button class="food-slot-remove" data-remove-supply aria-label="移除${chosen.name}">×</button>` : ""}</article>`;
    $("#supply-count").textContent = chosen ? `已加入${chosen.name}` : "添加栏为空";
    $("#confirm-supply").disabled = locked || (kind === "drink" && !chosen);
    if (kind === "drink") {
      $("#water").value = draft.water;
      $("#water-value").innerHTML = `${draft.water.toLocaleString("en-US")} <small>mL</small>`;
      const percent = (draft.water - gameConfig.water.min) / (gameConfig.water.max - gameConfig.water.min) * 100;
      $("#water").style.background = `linear-gradient(to right,#9bb77a 0%,#9bb77a ${percent}%,#e8ecdf ${percent}%,#e8ecdf 100%)`;
    }
    const cards = [...grid.children];
    page = renderPage("supply", cards, page, revealFocused ? cards.find(card => card.dataset.supplyCard === focusedId) : null);
  }
  function handleCard(event) {
    if (locked || !draft) return;
    const add = event.target.closest("[data-add-drink]");
    const card = event.target.closest(`[data-${kind}]`);
    if (add) {
      draft.drinkId = add.dataset.addDrink;
      focusedId = draft.drinkId;
    } else if (card) focusedId = card.dataset[kind];
    else return;
    renderDialog(true);
    $(`#${kind}-options [data-${kind}="${focusedId}"]`)?.focus({ preventScroll: true });
  }
  $("#drink-options").addEventListener("click", handleCard);
  $("#additive-options").addEventListener("click", handleCard);
  $("#additive-options").addEventListener("change", event => {
    const input = event.target.closest(".additive-input");
    if (locked || !draft || !input) return;
    draft.additives = input.checked ? [input.value] : [];
    focusedId = input.value;
    renderDialog(true);
    $(`#additive-options input[value="${focusedId}"]`)?.focus({ preventScroll: true });
  });
  $("#water").addEventListener("input", event => {
    if (locked || !draft || kind !== "drink") return;
    draft.water = Number(event.target.value);
    renderDialog();
  });
  $("#supply-slots").addEventListener("click", event => {
    if (locked || !draft) return;
    if (event.target.closest("[data-remove-supply]")) {
      if (kind === "drink") draft.drinkId = null;
      else draft.additives = [];
      renderDialog();
    } else if (event.target.closest("[data-current-supply]")) {
      focusedId = selectedId() || focusedId;
      renderDialog(true);
    }
  });
  $("#confirm-supply").addEventListener("click", () => {
    if (locked || !draft || (kind === "drink" && !draft.drinkId)) return;
    const change = kind === "drink" ? { drinkId: draft.drinkId, water: draft.water } : { additives: [...draft.additives] };
    if (onChange(change) !== false) dialog.close();
  });
  dialog.addEventListener("close", () => { draft = null; });
  $("#supply-prev").addEventListener("click", () => { page--; renderDialog(); });
  $("#supply-next").addEventListener("click", () => { page++; renderDialog(); });
  window.addEventListener("layoutchange", () => { if (dialog.open) renderDialog(); });
  function render() {
    const selection = getSelection(), drink = drinkById[selection.drinkId];
    $("#drink-summary").textContent = drink.name;
    $("#choose-drinks").setAttribute("aria-label", `${drink.name} ${selection.water} mL`);
    $("#drink-effect").textContent = drink.effectLabel;
    const additiveName = selection.additives.length ? selection.additives.map(id => additiveById[id].name).join("、") : "未添加";
    $("#additive-summary").textContent = additiveName;
    $("#additive-summary").title = additiveName;
    $("#choose-additives").setAttribute("aria-label", `添加剂，当前：${additiveName}`);
    if (dialog.open) renderDialog();
  }
  function lock(value) {
    locked = value;
    $("#choose-drinks").disabled = value;
    $("#choose-additives").disabled = value;
    if (value && dialog.open) dialog.close();
    render();
  }
  return { render, lock };
}
