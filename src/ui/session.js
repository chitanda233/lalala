import {
  foodById,
  drinkById,
  additiveById,
  toiletById,
  characterById,
} from "../content/catalog.js";
import { stoolColors } from "../content/colors.js";
import { normalizeMarks, outcomeMarks } from "../content/marks.js";
import { forceZone, forceZones } from "../content/force.js";
import { digestionById } from "../content/digestion.js";
import { bristolTypes } from "../content/stools.js";
import { diagnoseOutcome } from "../game/explanation.js";
import { specimenName } from "../game/specimen.js";
import { formatDuration } from "../config/game.js";
import { getRecipeForecast } from "../game/outcome-pool.js";
import { characterSvg } from "./artwork/stools.js";
import { closeDialogs } from "./dialogs.js";
import { createRareReveal } from "./rare-reveal.js";
import { $ } from "./dom.js";

const percent = (value) => `${(value * 100).toFixed(1).replace(/\.0$/, "")}%`;

export function createSessionView(getSelection = () => ({})) {
  const resultDialog = $("#result-dialog");
  const rareReveal = createRareReveal(resultDialog);
  let activeSelection = null;
  let lastForecastZone = null;

  function guidance(selection, force = selection.force) {
    const forecast = getRecipeForecast({ ...selection, force });
    const recipe = forecast.matchedRecipe || forecast.suggestedRecipe;
    const zone = recipe && forceZones.find((item) => item.id === recipe.forceZone);
    const targetForecast = recipe && !forecast.matchedRecipe
      ? getRecipeForecast({ ...selection, force: zone.min })
      : forecast;
    return { forecast, recipe, zone, targetForecast };
  }

  function renderAimingForecast(force) {
    const { forecast, recipe, zone } = guidance(activeSelection, force);
    const missedAtLock = activeSelection.phase === "running" && !forecast.matchedRecipe;
    $("#action-title").textContent = missedAtLock
      ? "自由组合 · 力度已锁定"
      : recipe
      ? `目标 · ${characterById[recipe.characterId].name}`
      : "自由组合，试试手气。";
    $(".force-heading strong").textContent = forecast.matchedRecipe
      ? `命中 ${percent(forecast.recipeProbability)}`
      : missedAtLock ? "未匹配配方" : recipe ? `停在 ${zone.min}–${zone.max}` : "拉屎力度";
    $("#keyboard-hint").textContent = forecast.matchedRecipe
      ? `未中稀有后 ${percent(forecast.recipeConditionalProbability)} · 稀有 ${percent(forecast.rareProbability)}`
      : missedAtLock
        ? `本次按属性生成 · 稀有 ${percent(forecast.rareProbability)}`
        : recipe
        ? `${zone.name}匹配配方 · 稀有 ${percent(forecast.rareProbability)}`
        : `图鉴可查固定配方 · 稀有 ${percent(forecast.rareProbability)}`;
    $("#action-description").textContent = recipe
      ? `${characterById[recipe.characterId].name}需要${zone.name}，${zone.min}到${zone.max}。${forecast.matchedRecipe ? `当前整局命中率${percent(forecast.recipeProbability)}。` : "指针到达该区间时点击停止。"}`
      : "当前为自由组合。图鉴中的配方页可以查看食物、饮料和力度要求。";
  }

  function renderForce(force, locked = false) {
    const zone = forceZone(force);
    $("#force-pointer").style.left = `${force}%`;
    $("#force-value").textContent = `${force} / 100 · ${zone.name}`;
    $("#force-track").setAttribute("aria-valuenow", force);
    $("#force-track").setAttribute("aria-valuetext", `${force}，${zone.name}`);
    $("#force-meter").dataset.zone = zone.id;
    $("#force-meter").classList.toggle("locked", locked);
    if (activeSelection && zone.id !== lastForecastZone) {
      lastForecastZone = zone.id;
      renderAimingForecast(force);
    }
  }
  function showRunning(session) {
    const aiming = session.phase === "aiming";
    activeSelection = session;
    lastForecastZone = null;
    if (resultDialog.open) resultDialog.close();
    rareReveal.clear();
    $("#bathroom-scene").classList.add("running");
    $("#ready-tag").innerHTML = "<span></span>嘘，正在认真办大事";
    $("#floating-note").innerHTML =
      '<svg class="icon"><use href="#i-clock"/></svg> 你的快乐正在路上';
    $("#force-meter").hidden = false;
    $("#force-hint").textContent = aiming
      ? "指针来回摆动，点击停止锁定本次力度。"
      : forceZone(session.force).description;
    renderForce(aiming ? 0 : session.force, !aiming);
    $("#start-button").disabled = !aiming;
    $("#start-button").dataset.phase = session.phase;
    $(".button-text").textContent = aiming ? "停止" : "马上揭晓…";
  }
  function showIdle() {
    activeSelection = null;
    lastForecastZone = null;
    const { forecast, recipe, zone, targetForecast } = guidance(getSelection());
    $("#bathroom-scene").classList.remove("running");
    $("#ready-tag").innerHTML = "<span></span>一切就绪，等你落座";
    $("#action-title").textContent = recipe
      ? `目标 · ${characterById[recipe.characterId].name}`
      : "自由组合，试试手气。";
    $("#action-description").textContent = recipe
      ? `点击开始，指针到${zone.name}${zone.min}到${zone.max}时点击停止。未中稀有后，配方命中率${percent(targetForecast.recipeConditionalProbability)}。`
      : "当前食物与饮料没有对应的固定配方，可打开图鉴的配方页查看搭配。";
    $(".idle-hint").innerHTML = recipe
      ? `停在${zone.name} ${zone.min}–${zone.max}<br><span>命中 ${percent(targetForecast.recipeProbability)} · 稀有 ${percent(forecast.rareProbability)}</span>`
      : `图鉴可查固定配方<br><span>每局稀有 ${percent(forecast.rareProbability)}</span>`;
    $("#floating-note").innerHTML =
      '<svg class="icon"><use href="#i-leaf"/></svg> 放轻松，好事正在发生';
    $("#force-meter").hidden = true;
    $("#start-button").disabled = false;
    $("#start-button").dataset.phase = "idle";
    $(".button-text").textContent = "开始拉屎";
    $("#keyboard-hint").innerHTML = "点击开始，再次点击停止";
  }
  function showResult({
    session,
    isNew,
    isNewType,
    unlockedFoods = [],
    unlockedToilets = [],
    individual,
  }) {
    const { outcome } = session;
    const character = characterById[outcome.characterId];
    const type = bristolTypes[outcome.type - 1];
    const diagnosis = diagnoseOutcome(outcome);
    $("#result-character").innerHTML = characterSvg(
      character,
      false,
      type.id,
      outcome.colorId,
      outcome.marks,
      outcome.appearance,
    );
    $("#result-type").textContent = `布里斯托 ${type.id} 型 · ${type.name}`;
    $("#result-type").className = `result-type type-group ${type.group}`;
    $("#result-form-description").textContent = type.description;
    $("#result-rarity").textContent =
      `${character.tag}${outcome.colorId ? ` · ${stoolColors[outcome.colorId].name}` : ""}${normalizeMarks(
        outcome.marks,
      )
        .map((mark) => ` · ${outcomeMarks[mark].name}`)
        .join("")}`;
    $("#result-name").textContent = specimenName(outcome);
    $("#result-individual").textContent = individual
      ? `个体 #${String(individual.sequence).padStart(3, "0")}`
      : "本次标本";
    $("#result-description").textContent = diagnosis.summary;
    $("#result-additives").textContent =
      `${session.additives.length ? session.additives.map((id) => additiveById[id].name).join("、") : "原味无添加"} · 消化 ${digestionById[session.digestionTime].label} · 力度 ${session.force}/100 · ${forceZone(session.force).name}`;
    $("#result-explanation").hidden = false;
    $("#result-explanation").open = false;
    $("#result-reasons").replaceChildren(
      ...diagnosis.details.map((reason) => {
        const li = document.createElement("li");
        li.textContent = reason;
        return li;
      }),
    );
    $("#result-recipe").textContent =
      `${session.foodIds.map((id) => foodById[id].name).join("、")} · ${drinkById[session.drinkId].name}`;
    $("#result-toilet").textContent = toiletById[session.toiletId].name;
    $("#result-time").textContent = formatDuration(session.seconds);
    $("#result-score").textContent = `${outcome.score} 分`;
    const discoveries = [];
    if (isNewType) discoveries.push("✦ 新形态已收进图鉴");
    else if (isNew) discoveries.push("✦ 新便便已收进图鉴");
    if (unlockedFoods.length)
      discoveries.push(`解锁 ${unlockedFoods.length} 种新食物`);
    if (unlockedToilets.length)
      discoveries.push(`解锁 ${unlockedToilets.length} 款新马桶`);
    $("#result-new").textContent = discoveries.join(" · ");
    $("#result-new").hidden = discoveries.length === 0;
    closeDialogs();
    rareReveal.show(character);
    resultDialog.showModal();
  }
  return { showRunning, showIdle, renderForce, showResult };
}
