import { createSuppliesView } from "./supplies.js";
import { toiletDrawing, toiletSvg } from "./artwork/toilets.js";
import { toilets } from "../content/toilets.js";
import { toiletUnlockHint } from "../progression/toilets.js";
import { toiletById } from "../content/catalog.js";
import { gameConfig } from "../config/game.js";
import { digestionOptions, digestionById } from "../content/digestion.js";
import { createFoodPicker } from "./food-picker.js";
import { $, $$ } from "./dom.js";

export function createSelectionView({
  getSelection,
  getInventory,
  getFoodInventory,
  getTotal,
  onChange,
}) {
  const foodPicker = createFoodPicker({
    getSelection,
    getInventory: getFoodInventory,
    getTotal,
    onCommit: (foodIds) => onChange({ foodIds }),
  });
  const supplies = createSuppliesView({ getSelection, onChange });
  $("#digestion-options").innerHTML = digestionOptions
    .map(
      (option) =>
        `<button class="digestion-option" data-digestion="${option.id}" aria-pressed="false"><strong>${option.label}</strong><span>${option.name}</span><small>${option.description}</small></button>`,
    )
    .join("");
  $("#choose-digestion").addEventListener("click", () =>
    $("#digestion-dialog").showModal(),
  );
  const equipmentDialog = $("#equipment-dialog");
  let previewToiletId = getSelection().toiletId;
  let locked = false;
  $("#choose-toilet").addEventListener("click", () => {
    if (locked) return;
    previewToiletId = getSelection().toiletId;
    renderToiletPicker();
    equipmentDialog.showModal();
  });
  $("#digestion-options").addEventListener("click", (event) => {
    const option = event.target.closest("[data-digestion]");
    if (option) onChange({ digestionTime: option.dataset.digestion });
  });
  function switchToilet(direction) {
    if (locked) return;
    const index = toilets.findIndex((toilet) => toilet.id === previewToiletId);
    previewToiletId =
      toilets[(index + direction + toilets.length) % toilets.length].id;
    renderToiletPicker();
  }
  function renderToiletPicker() {
    const toilet = toiletById[previewToiletId];
    const owned = getInventory().owned.includes(toilet.id);
    const equipped = getSelection().toiletId === toilet.id;
    equipmentDialog.dataset.preview = toilet.id;
    equipmentDialog.dataset.locked = String(!owned);
    $("#equipment-title").textContent = toilet.name;
    $("#toilet-preview").innerHTML = toiletSvg(toilet);
    $("#toilet-description").textContent = toilet.description;
    $("#toilet-page").textContent =
      `${toilets.findIndex((item) => item.id === toilet.id) + 1} / ${toilets.length}`;
    $("#toilet-availability").hidden = owned;
    $("#toilet-availability").textContent = owned
      ? ""
      : toiletUnlockHint(toilet, getTotal());
    $("#confirm-toilet-label").textContent = equipped
      ? "正在使用"
      : owned ? "蹲它" : "未解锁";
    $("#confirm-toilet").classList.toggle("current", equipped);
    $("#confirm-toilet").classList.toggle("locked", !owned);
    $("#toilet-lock-icon").toggleAttribute("hidden", owned);
    $("#confirm-toilet").disabled = locked;
    $("#toilet-prev").disabled = locked || toilets.length < 2;
    $("#toilet-next").disabled = locked || toilets.length < 2;
  }
  $("#confirm-toilet").addEventListener("click", () => {
    if (locked) return;
    if (!getInventory().owned.includes(previewToiletId)) return;
    if (previewToiletId === getSelection().toiletId) {
      equipmentDialog.close();
      return;
    }
    if (onChange({ toiletId: previewToiletId }) !== false)
      equipmentDialog.close();
  });
  $("#toilet-prev").addEventListener("click", () => switchToilet(-1));
  $("#toilet-next").addEventListener("click", () => switchToilet(1));
  $("#equipment-dialog").addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    switchToilet(event.key === "ArrowLeft" ? -1 : 1);
  });
  Object.assign($("#water"), {
    min: gameConfig.water.min,
    max: gameConfig.water.max,
    step: gameConfig.water.step,
  });

  $("#water").addEventListener("input", (event) =>
    onChange({ water: Number(event.target.value) }),
  );
  function render() {
    const selection = getSelection();
    const digestion = digestionById[selection.digestionTime];
    $("#digestion-summary").textContent =
      `${digestion.label} · ${selection.digestionTime === "random" ? "随缘" : selection.digestionTime === "2" ? "短时" : selection.digestionTime === "8" ? "较久" : "适中"}`;
    $$("[data-digestion]").forEach((button) => {
      const selected = button.dataset.digestion === selection.digestionTime;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected);
    });
    for (const [attribute, value] of [["drink", selection.drinkId]]) {
      $$(`[data-${attribute}]`).forEach((button) => {
        const selected = button.dataset[attribute] === value;
        button.classList.toggle("selected", selected);
        button.setAttribute("aria-pressed", selected);
      });
    }
    $("#water").value = selection.water;
    $("#water-value").innerHTML =
      `${selection.water.toLocaleString("en-US")} <small>mL</small>`;
    const percent =
      ((selection.water - gameConfig.water.min) /
        (gameConfig.water.max - gameConfig.water.min)) *
      100;
    $("#water").style.background =
      `linear-gradient(to right,#9bb77a 0%,#9bb77a ${percent}%,#e8ecdf ${percent}%,#e8ecdf 100%)`;
    $$(".additive-input").forEach((input) => {
      input.checked = selection.additives.includes(input.value);
    });
    const toilet = toiletById[selection.toiletId];
    $("#toilet-name").textContent = toilet.name;
    $("#choose-toilet").setAttribute(
      "aria-label",
      `更换马桶，当前：${toilet.name}`,
    );
    renderToiletPicker();
    $(".toilet-body").innerHTML = toiletDrawing(toilet);
    supplies.render();
    $("#bathroom-scene").dataset.toilet = toilet.id;
    $(".bathroom-illustration").setAttribute(
      "aria-label",
      `浅绿瓷砖背景中的${toilet.name}`,
    );
    foodPicker.render();
  }

  function lock(value) {
    locked = value;
    if (locked && $("#equipment-dialog").open) $("#equipment-dialog").close();
    renderToiletPicker();
    foodPicker.lock(locked);
    supplies.lock(locked);
    $$(
      ".recipe-card, .drink-choice, #water, #choose-toilet, #choose-digestion, [data-digestion]",
    ).forEach((input) => {
      input.disabled = locked;
    });
  }
  return { render, lock };
}
