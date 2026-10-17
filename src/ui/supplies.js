import { drinks } from "../content/drinks.js";
import { additives } from "../content/additives.js";
import { drinkById } from "../content/catalog.js";
import { gameConfig } from "../config/game.js";
import { $, $$ } from "./dom.js";
import { renderPage } from "./pagination.js";

const drinkArt = (drink) =>
  `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m17 15 4 37q11 6 22 0l4-37Z" fill="${drink.color}" opacity=".75" stroke="${drink.color}" stroke-width="2"/><ellipse cx="32" cy="15" rx="15" ry="5" fill="${drink.color}"/><path d="m26 23 2 21" stroke="#fffdf2" stroke-width="3" stroke-linecap="round" opacity=".7"/>${drink.tags.includes("bubbles") ? '<g fill="#fffdf2"><circle cx="35" cy="31" r="3"/><circle cx="39" cy="43" r="2"/><circle cx="31" cy="46" r="1.5"/></g>' : ""}</svg>`;

export function createSuppliesView({ getSelection, onChange }) {
  let locked = false;
  let page = 0;
  let kind = "drink";
  const dialog = $("#supply-dialog");
  $("#drink-options").innerHTML = drinks
    .map(
      (drink) =>
        `<button class="drink-choice supply-drink" data-drink="${drink.id}" aria-pressed="false">${drinkArt(drink)}<span><strong>${drink.name}</strong><small>${drink.effectLabel}</small></span><span class="supply-kind">${drink.category}</span></button>`,
    )
    .join("");
  $("#additive-options").innerHTML = additives
    .map(
      (item) =>
        `<label class="additive supply-additive"><span class="additive-icon" style="color:${item.color};background:${item.color}22">${item.symbol}</span><span class="additive-copy"><strong>${item.name}</strong><small>${item.description}</small><span>${item.effectLabel}</span></span><input type="checkbox" value="${item.id}" class="additive-input"/><span class="switch" aria-hidden="true"></span></label>`,
    )
    .join("");
  for (const choice of ["drink", "additive"]) {
    $(`#choose-${choice}s`).addEventListener("click", () => {
      if (locked) return;
      kind = choice;
      page = 0;
      $("#supply-dialog-title").textContent =
        kind === "drink" ? "今天喝点什么" : "给配方加一点想象";
      $("#drink-library").hidden = kind !== "drink";
      $("#additive-library").hidden = kind !== "additive";
      $("#water-section").hidden = kind !== "drink";
      $("#supply-intro").textContent =
        kind === "drink"
          ? `${drinks.length} 种饮料 · 选一种，选择后自动保存`
          : `${additives.length} 种添加剂 · 当前全部开放 · 最多 ${gameConfig.maxAdditives} 种，选择后自动保存`;
      dialog.showModal();
      render();
    });
  }
  $("#drink-options").addEventListener("click", (event) => {
    const button = event.target.closest("[data-drink]");
    if (button && !locked) onChange({ drinkId: button.dataset.drink });
  });
  $("#additive-options").addEventListener("change", (event) => {
    if (locked) return render();
    const selected = $$(".additive-input:checked").map((input) => input.value);
    if (selected.length > gameConfig.maxAdditives) return render();
    onChange({ additives: selected });
    // Retain focus on the toggle; unchecked choices become disabled at capacity.
    if (event.target.disabled) $("#supply-count").focus();
  });
  function render() {
    const selection = getSelection();
    const drink = drinkById[selection.drinkId];
    $("#drink-summary").textContent = drink.name;
    $("#drink-effect").textContent = drink.effectLabel;
    $("#additive-summary").textContent = selection.additives.length
      ? selection.additives
          .map((id) => additives.find((item) => item.id === id).name)
          .join("、")
      : "还没加料，原味也有惊喜";
    $("#additive-count").textContent =
      `${selection.additives.length} / ${gameConfig.maxAdditives}`;
    $$("[data-drink]").forEach((button) => {
      const selected = button.dataset.drink === selection.drinkId;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected);
      button.disabled = locked;
    });
    $$(".additive-input").forEach((input) => {
      input.checked = selection.additives.includes(input.value);
      input.disabled =
        locked ||
        (!input.checked &&
          selection.additives.length >= gameConfig.maxAdditives);
      input.closest("label").classList.toggle("selected", input.checked);
    });
    $("#supply-count").textContent = $("#drink-library").hidden
      ? `已加入 ${selection.additives.length} / ${gameConfig.maxAdditives} 种 · 取消勾选可移除`
      : `${drink.name} · ${drink.description}`;
    page = renderPage(
      "supply",
      $$(kind === "drink" ? "#drink-options > *" : "#additive-options > *"),
      page,
    );
  }
  $("#supply-prev").addEventListener("click", () => {
    page--;
    render();
  });
  $("#supply-next").addEventListener("click", () => {
    page++;
    render();
  });
  window.addEventListener("layoutchange", () => {
    if (dialog.open) render();
  });
  function lock(value) {
    locked = value;
    $("#choose-drinks").disabled = value;
    $("#choose-additives").disabled = value;
    if (value && dialog.open) dialog.close();
    render();
  }
  return { render, lock };
}
