import {
  foodById,
  drinkById,
  additiveById,
  toiletById,
  characterById,
} from "../content/catalog.js";
import { stoolColors } from "../content/colors.js";
import { normalizeMarks, outcomeMarks } from "../content/marks.js";
import { forceZone } from "../content/force.js";
import { bristolTypes } from "../content/stools.js";
import { diagnoseOutcome } from "../game/explanation.js";
import { specimenName } from "../game/specimen.js";
import { formatDuration } from "../config/game.js";
import { characterSvg } from "./artwork/stools.js";
import { closeDialogs } from "./dialogs.js";
import { createRareReveal } from "./rare-reveal.js";
import { $ } from "./dom.js";

export function createSessionView() {
  const resultDialog = $("#result-dialog");
  const rareReveal = createRareReveal(resultDialog);

  function renderForce(force, locked = false) {
    const zone = forceZone(force);
    $("#force-pointer").style.left = `${force}%`;
    $("#force-value").textContent = `${force} / 100 · ${zone.name}`;
    $("#force-track").setAttribute("aria-valuenow", force);
    $("#force-track").setAttribute("aria-valuetext", `${force}，${zone.name}`);
    $("#force-meter").dataset.zone = zone.id;
    $("#force-meter").classList.toggle("locked", locked);
  }
  function showRunning(session) {
    const aiming = session.phase === "aiming";
    if (resultDialog.open) resultDialog.close();
    rareReveal.clear();
    $("#bathroom-scene").classList.add("running");
    $("#action-title").textContent = aiming ? "放轻松，跟着感觉来。" : "惊喜马上揭晓…";
    $("#action-description").textContent = aiming
      ? "指针来回摆动，点击停止锁定本次力度。"
      : "力度已锁定，结果马上揭晓。";
    $("#keyboard-hint").textContent = aiming ? "点击停止，锁定力度" : "";
    $("#ready-tag").innerHTML = "<span></span>嘘，正在认真办大事";
    $("#floating-note").innerHTML =
      '<svg class="icon"><use href="#i-clock"/></svg> 你的快乐正在路上';
    $("#force-meter").hidden = false;
    $("#force-hint").textContent = aiming
      ? "指针来回摆动，点击停止锁定本次力度。"
      : "已经锁定本次力度。";
    renderForce(aiming ? 0 : session.force, !aiming);
    $("#start-button").disabled = !aiming;
    $("#start-button").dataset.phase = session.phase;
    $(".button-text").textContent = aiming ? "停止" : "马上揭晓…";
  }
  function showIdle() {
    $("#bathroom-scene").classList.remove("running");
    $("#ready-tag").innerHTML = "<span></span>一切就绪，等你落座";
    $("#action-title").textContent = "准备好，开始吧。";
    $("#action-description").textContent = "选好配方，点击开始，再点击停止锁定力度。";
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
      `${session.additives.length ? session.additives.map((id) => additiveById[id].name).join("、") : "原味无添加"} · 力度 ${session.force}/100 · ${forceZone(session.force).name}`;
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
