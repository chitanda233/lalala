import { createSuppliesView } from "./supplies.js";
import { toiletDrawing, toiletSvg } from "./artwork/toilets.js";
import { toilets } from "../content/toilets.js";
import { toiletUnlockHint } from "../progression/toilets.js";
import { toiletById } from "../content/catalog.js";
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
  const equipmentDialog = $("#equipment-dialog");
  let previewToiletId = getSelection().toiletId;
  let locked = false;
  $("#choose-toilet").addEventListener("click", () => {
    if (locked) return;
    previewToiletId = getSelection().toiletId;
    renderToiletPicker();
    equipmentDialog.showModal();
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
  function render() {
    const selection = getSelection();
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
      ".recipe-card, .drink-choice, #water, #choose-toilet",
    ).forEach((input) => {
      input.disabled = locked;
    });
  }
  return { render, lock };
}
