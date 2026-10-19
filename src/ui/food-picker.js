import { foods, foodCategories } from "../content/foods.js";
import { foodById } from "../content/catalog.js";
import { gameConfig } from "../config/game.js";
import { canEatFoods } from "../progression/foods.js";
import { foodArt } from "./artwork/foods.js";
import { $, $$ } from "./dom.js";
import { renderPage } from "./pagination.js";
import { foodAttributeFields } from "../content/food-attributes.js";

export function createFoodPicker({
  getSelection,
  getInventory,
  getTotal,
  onCommit,
}) {
  const dialog = $("#food-dialog");
  let draft = [],
    focusedId = "rice",
    category = "all",
    activeSlot = null,
    page = 0,
    locked = false;

  function showMessage(message = "") {
    $("#food-picker-message").textContent = message;
  }
  function removeFood(index) {
    draft.splice(index, 1);
    activeSlot = null;
    showMessage(
      draft.length
        ? "已移除，可以选择别的食物。"
        : "餐盘还是空的，请至少加入一种食物。",
    );
  }
  function toggleFood(id) {
    if (locked || !getInventory().unlocked.includes(id)) return;
    const selectedIndex = draft.indexOf(id);
    if (selectedIndex >= 0) {
      removeFood(selectedIndex);
    } else {
      const canReplace = activeSlot !== null && activeSlot < draft.length;
      if (draft.length >= gameConfig.maxFoods && !canReplace) return;
      if (canReplace) draft[activeSlot] = id;
      else draft.push(id);
      activeSlot = null;
      showMessage(`已加入${foodById[id].name}。`);
    }
    focusedId = id;
    renderDialog(true);
    $(`#food-grid [data-add-food="${id}"]`)?.focus({ preventScroll: true });
  }
  function renderSummary() {
    const ids = getSelection().foodIds;
    $("#meal-count").textContent =
      `已选 ${ids.length} / ${gameConfig.maxFoods}`;
    $("#meal-summary").innerHTML = Array.from(
      { length: gameConfig.maxFoods },
      (_, index) => {
        const food = foodById[ids[index]];
        return `<button class="meal-summary-slot ${food ? "filled" : ""}" data-open-food-slot="${index}" ${locked ? "disabled" : ""} aria-label="${food ? `更换${food.name}` : `添加第${index + 1}种食物`}">${food ? `${foodArt(food.id)}<span>${food.name}</span>` : '<span class="empty-meal">＋</span><small>添加食物</small>'}</button>`;
      },
    ).join("");
  }
  function renderDetails() {
    const food = foodById[focusedId];
    const unlocked = getInventory().unlocked.includes(food.id);
    const attributeTags = foodAttributeFields
      .filter((field) =>
        ["softness", "retention", "influence"].includes(field.key),
      )
      .map(
        (field) =>
          `<span>${field.label} ${food.attributes[field.key]}/7</span>`,
      )
      .join("");
    $("#food-details").classList.toggle("locked", !unlocked);
    $("#food-details").innerHTML =
      `<div class="food-detail-art">${foodArt(food.id)}</div><h3>${food.name}</h3><p>${unlocked ? food.description : `完成 ${food.unlockAt} 次游戏后解锁，目前 ${Math.min(getTotal(), food.unlockAt)} / ${food.unlockAt} 次。`}</p>${unlocked ? `<div class="food-trait-tags">${attributeTags}${food.fictional ? "<span>幻想配料</span>" : ""}</div>` : ""}`;
  }
  function renderDialog(revealFocused = false) {
    const inventory = getInventory();
    const unlockedIds = new Set(inventory.unlocked);
    $("#food-unlock-count").textContent =
      `已解锁 ${inventory.unlocked.length} / ${foods.length}`;
    $("#food-filters").innerHTML = foodCategories
      .map(
        (item) =>
          `<button data-food-category="${item.id}" class="${category === item.id ? "selected" : ""}" aria-pressed="${category === item.id}">${item.name}</button>`,
      )
      .join("");
    const visibleFoods = foods
      .filter((food) => category === "all" || food.category === category)
      .sort(
        (a, b) => Number(unlockedIds.has(b.id)) - Number(unlockedIds.has(a.id)),
      );
    $("#food-empty").hidden = visibleFoods.length > 0;
    $("#food-grid").innerHTML = visibleFoods
      .map((food) => {
        const unlocked = unlockedIds.has(food.id);
        const selected = draft.includes(food.id);
        const full = draft.length >= gameConfig.maxFoods && activeSlot === null;
        return `<article class="food-card ${unlocked ? "unlocked" : "locked"} ${food.id === focusedId ? "focused" : ""} ${selected ? "selected" : ""}" data-food-card="${food.id}"><button class="food-card-main ${unlocked ? "unlocked" : "locked"}" data-food="${food.id}" aria-pressed="${food.id === focusedId}" aria-label="${food.name}${unlocked ? "" : "，尚未解锁"}">${foodArt(food.id)}<strong>${food.name}</strong>${!unlocked ? `<span>${food.unlockAt} 次解锁</span>` : ""}</button><button class="card-action" data-add-food="${food.id}" aria-label="${selected ? `移除${food.name}` : `加入${food.name}`}" aria-pressed="${selected}" ${locked || !unlocked || (!selected && full) ? "disabled" : ""}>${selected ? "✓" : "＋"}</button></article>`;
      })
      .join("");
    $("#food-draft-count").textContent =
      `${draft.length} / ${gameConfig.maxFoods}`;
    $("#food-slots").innerHTML = Array.from(
      { length: gameConfig.maxFoods },
      (_, index) => {
        const food = foodById[draft[index]];
        return `<article class="food-slot ${activeSlot === index ? "active" : ""}"><button data-slot-target="${index}" class="food-slot-main" aria-label="${food ? `替换第${index + 1}格${food.name}` : `选择第${index + 1}格食物`}">${food ? `${foodArt(food.id)}<span>${food.name}</span>` : '<span class="food-slot-plus">＋</span><span>添加食物</span>'}</button>${food ? `<button data-remove-food="${index}" class="food-slot-remove" aria-label="移除${food.name}">×</button>` : ""}</article>`;
      },
    ).join("");
    $("#confirm-foods").disabled = !canEatFoods(inventory, draft);
    renderDetails();
    const cards = $$("#food-grid .food-card");
    page = renderPage("food", cards, page, revealFocused ? cards.find(card => card.dataset.foodCard === focusedId) : null);
  }
  function open(index = null) {
    if (locked) return;
    draft = [...getSelection().foodIds];
    focusedId = draft[index] || draft[0] || "rice";
    category = "all";
    page = 0;
    activeSlot = index !== null && index < draft.length ? index : null;
    showMessage("点右上角加号加入，再点勾选移除；点食物看介绍。最多三种，确认后生效。");
    dialog.showModal();
    renderDialog(true);
  }
  $("#choose-foods").addEventListener("click", () => open());
  $("#meal-summary").addEventListener("click", (event) => {
    const slot = event.target.closest("[data-open-food-slot]");
    if (slot) open(Number(slot.dataset.openFoodSlot));
  });
  $("#food-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-food-category]");
    if (!button) return;
    category = button.dataset.foodCategory;
    page = 0;
    renderDialog();
    $(`#food-filters [data-food-category="${category}"]`).focus();
  });
  $("#food-grid").addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-add-food]");
    if (toggle) return toggleFood(toggle.dataset.addFood);
    const button = event.target.closest("[data-food]");
    if (!button) return;
    focusedId = button.dataset.food;
    renderDialog(true);
    $(`#food-grid [data-food="${focusedId}"]`).focus({ preventScroll: true });
  });
  $("#food-slots").addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-food]");
    const slot = event.target.closest("[data-slot-target]");
    if (remove) {
      removeFood(Number(remove.dataset.removeFood));
    } else if (slot) {
      const index = Number(slot.dataset.slotTarget);
      activeSlot = index < draft.length ? index : null;
      if (draft[index]) {
        focusedId = draft[index];
        category = "all";
      }
      showMessage(
        draft[index]
          ? `选另一种食物，替换第 ${index + 1} 格。`
          : "选一种已解锁食物，加入空位。",
      );
    } else return;
    renderDialog(Boolean(slot && !remove));
  });
  $("#confirm-foods").addEventListener("click", () => {
    if (locked || !canEatFoods(getInventory(), draft)) return;
    if (onCommit([...draft]) !== false) dialog.close();
  });
  $("#food-prev").addEventListener("click", () => {
    page--;
    renderDialog();
  });
  $("#food-next").addEventListener("click", () => {
    page++;
    renderDialog();
  });
  window.addEventListener("layoutchange", () => {
    if (dialog.open) renderDialog();
  });
  return {
    render() {
      renderSummary();
      if (dialog.open) renderDialog();
    },
    lock(value) {
      locked = value;
      $("#choose-foods").disabled = value;
      if (value && dialog.open) dialog.close();
      renderSummary();
    },
  };
}
