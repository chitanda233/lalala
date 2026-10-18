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
import { recipeLiquidText } from "../content/recipe-labels.js";
import { typeDistribution } from "../game/stool-type.js";

const percent = (value) => `${(value * 100).toFixed(1).replace(/\.0$/, "")}%`;

export function createSessionView(getSelection = () => ({})) {
  const resultDialog = $("#result-dialog");
  const rareReveal = createRareReveal(resultDialog);
  let activeSelection = null;
  let lastForecastForce = null;

  function guidance(selection, force = selection.force) {
    const forecast = getRecipeForecast({ ...selection, force });
    const recipe = forecast.matchedRecipe || forecast.suggestedRecipe;
    const zone = recipe && forceZones.find((item) => item.id === recipe.forceZone);
    const targetForecast = recipe && !forecast.matchedRecipe
      ? getRecipeForecast({ ...selection, force: zone.min })
      : forecast;
    const readyForForce = !!recipe && targetForecast.matchedRecipe?.characterId === recipe.characterId;
    return { forecast, recipe, zone, targetForecast, readyForForce };
  }

  function stateLabel(forecast) {
    return forecast.physicalState ? `基础第 ${forecast.physicalState.type} 型` : "随机阶段 · 三档综合预告";
  }
  function recipeRequirement(recipe) {
    return `${recipeLiquidText(recipe)}${recipe.requiredAdditive ? ` · 需${additiveById[recipe.requiredAdditive].name}` : ""}`;
  }

  function renderAimingForecast(force) {
    const { forecast, recipe, zone, readyForForce } = guidance(activeSelection, force);
    const primary = characterById[forecast.primaryCharacterId];
    $("#action-title").textContent = `${forecast.matchedRecipe || readyForForce ? "目标" : "主结果"} · ${primary.name}`;
    $(".force-heading strong").textContent = forecast.matchedRecipe
      ? `命中 ${percent(forecast.primaryProbability)}` : `主结果 ${percent(forecast.primaryProbability)}`;
    $("#keyboard-hint").textContent = `未中稀有后 ${percent(forecast.primaryConditionalProbability)} · 稀有 ${percent(forecast.rareProbability)}`;
    const chosenPhase = getSelection().digestionTime === "random" ? `本局阶段 ${activeSelection.digestionTime}。` : "";
    $("#action-description").textContent = chosenPhase + (readyForForce
      ? `${primary.name}的理想力度为${zone.name}，${zone.min}到${zone.max}。当前整局命中率${percent(forecast.primaryProbability)}。`
      : `${stateLabel(forecast)}，${activeSelection.additives.includes("probiotic") ? "益生菌已稳定本次普通主结果。" : "力度调整同身份内造型；接近理想配方可提高命中率。"}`);
  }

  function renderForce(force, locked = false) {
    const zone = forceZone(force);
    $("#force-pointer").style.left = `${force}%`;
    $("#force-value").textContent = `${force} / 100 · ${zone.name}`;
    $("#force-track").setAttribute("aria-valuenow", force);
    $("#force-track").setAttribute("aria-valuetext", `${force}，${zone.name}`);
    $("#force-meter").dataset.zone = zone.id;
    $("#force-meter").classList.toggle("locked", locked);
    if (activeSelection && force !== lastForecastForce) {
      lastForecastForce = force;
      renderAimingForecast(force);
    }
  }
  function showRunning(session) {
    const aiming = session.phase === "aiming";
    activeSelection = session;
    lastForecastForce = null;
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
    lastForecastForce = null;
    const { forecast, recipe, zone, targetForecast, readyForForce } = guidance(getSelection());
    $("#bathroom-scene").classList.remove("running");
    $("#ready-tag").innerHTML = "<span></span>一切就绪，等你落座";
    $("#action-title").textContent = getSelection().digestionTime === "random" ? "随机阶段 · 综合预告" : readyForForce
      ? `目标 · ${characterById[recipe.characterId].name}`
      : `主结果 · ${characterById[forecast.primaryCharacterId].name}`;
    $("#action-description").textContent = getSelection().digestionTime === "random"
      ? "开始时等概率锁定阶段 2、4、8，再按该阶段和本次水量产出。当前显示三档混合后的概率。"
      : readyForForce
      ? `点击开始，指针到${zone.name}${zone.min}到${zone.max}时点击停止。未中稀有后，配方命中率${percent(targetForecast.recipeConditionalProbability)}。`
      : `${stateLabel(forecast)}，${getSelection().additives.includes("probiotic") ? "益生菌稳定当前阶段与力度下的普通主结果。" : "接近理想配方可提高命中率，力度调整同身份内造型。"}`;
    $(".idle-hint").innerHTML = getSelection().digestionTime === "random"
      ? `${typeDistribution(getSelection()).slice(0,3).map(entry => `${entry.type}型 ${percent(entry.probability)}`).join(" · ")}<br><span>三档等概率 · 稀有 ${percent(forecast.rareProbability)}</span>`
      : readyForForce
      ? `停在${zone.name} ${zone.min}–${zone.max}<br><span>命中 ${percent(targetForecast.recipeProbability)} · 稀有 ${percent(forecast.rareProbability)}</span>`
      : `主结果 ${percent(forecast.primaryProbability)}<br><span>普通分支 ${percent(forecast.primaryConditionalProbability)} · 稀有 ${percent(forecast.rareProbability)}</span>`;
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
      `${session.foodIds.map((id) => foodById[id].name).join("、")} · ${drinkById[session.drinkId].name} ${session.water} mL`;
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
