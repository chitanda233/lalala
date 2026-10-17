import { createSuppliesView } from "./supplies.js";
import { toiletDrawing } from "./artwork/toilets.js";
import { toilets } from "../content/toilets.js";
import { bristolTypes } from "../content/stools.js";
import { toiletById } from "../content/catalog.js";
import { gameConfig } from "../config/game.js";
import { digestionOptions, digestionById } from "../content/digestion.js";
import { resolveBristolType } from "../game/stool-type.js";
import { smoothness } from "../game/smoothness.js";
import { specialProbability } from "../game/drops.js";
import { createFoodPicker } from "./food-picker.js";
import { collectEffects } from "../game/effects.js";
import { typeDistribution } from "../game/stool-type.js";
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
  $("#choose-toilet").addEventListener("click", () =>
    $("#equipment-dialog").showModal(),
  );
  $("#digestion-options").addEventListener("click", (event) => {
    const option = event.target.closest("[data-digestion]");
    if (option) onChange({ digestionTime: option.dataset.digestion });
  });
  $("#toilet-select").innerHTML = toilets
    .map((toilet) => `<option value="${toilet.id}">${toilet.name}</option>`)
    .join("");
  Object.assign($("#water"), {
    min: gameConfig.water.min,
    max: gameConfig.water.max,
    step: gameConfig.water.step,
  });

  $("#water").addEventListener("input", (event) =>
    onChange({ water: Number(event.target.value) }),
  );
  $("#toilet-select").addEventListener("change", (event) =>
    onChange({ toiletId: event.target.value }),
  );
  function render() {
    const selection = getSelection();
    const inventory = getInventory();
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
    const level = smoothness(selection);
    $$("#smooth-bars i").forEach((bar, index) =>
      bar.classList.toggle("active", index < level),
    );
    $("#smooth-bars").setAttribute("aria-label", `顺畅指数 ${level} / 5`);
    const effects = collectEffects(selection);
    $("#surprise-value").textContent =
      effects.food.spice >= 3
        ? "热辣出场"
        : selection.foodIds.length >= 2
          ? "混搭时刻"
          : "小小期待";
    const type = bristolTypes[resolveBristolType(selection) - 1];
    $("#forecast-description").textContent = `预计${type.assessment}`;
    $("#forecast-type").textContent = `${type.id} 型 · ${type.name}`;
    $("#forecast-type").title = typeDistribution(selection)
      .map(
        (entry) => `${entry.type} 型 ${Math.round(entry.probability * 100)}%`,
      )
      .join(" · ");
    const probability = specialProbability(selection) * 100;
    $("#special-chance").textContent = `${Number(probability.toFixed(2))}%`;
    $("#toilet-select").value = selection.toiletId;
    $$("#toilet-select option").forEach((option) => {
      option.disabled = !inventory.owned.includes(option.value);
    });
    const toilet = toiletById[selection.toiletId];
    $("#choose-toilet").innerHTML = `${toilet.name} <span>⌄</span>`;
    $("#toilet-description").textContent =
      `${toilet.material} · ${toilet.feature}。${toilet.description} ${toilet.effectLabel}。`;
    $(".toilet-body").innerHTML = toiletDrawing(toilet);
    supplies.render();
    $("#bathroom-scene").dataset.toilet = toilet.id;
    $(".bathroom-illustration").setAttribute(
      "aria-label",
      `浅绿瓷砖背景中的${toilet.name}`,
    );
    foodPicker.render();
  }

  function lock(locked) {
    foodPicker.lock(locked);
    supplies.lock(locked);
    $$(
      ".recipe-card, .drink-choice, #water, #toilet-select, #choose-toilet, #choose-digestion, [data-digestion]",
    ).forEach((input) => {
      input.disabled = locked;
    });
  }
  return { render, lock };
}
