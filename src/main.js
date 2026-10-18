import { gameConfig } from "./config/game.js";
import "./ui/viewport.js";
import { characterById } from "./content/catalog.js";
import { normalizeSelection } from "./game/selection.js";
import { createAimingSession, sessionProgress } from "./game/session.js";
import { oscillatingForce } from "./content/force.js";
import { equipToilet } from "./progression/toilets.js";
import { canEatFoods } from "./progression/foods.js";
import { createSaveStore } from "./storage/save.js";
import { createSelectionView } from "./ui/selection.js";
import { createCollectionView } from "./ui/collection.js";
import { createSessionView } from "./ui/session.js";
import { createAudio } from "./ui/audio.js";
import { bindDialogs } from "./ui/dialogs.js";
import { $, $$ } from "./ui/dom.js";

const store = createSaveStore();
let save = store.read();
let selection = normalizeSelection(save.settings);
let frame;
let finishing = false;
const audio = createAudio(() => save.sound);
const collectionView = createCollectionView(() => save);
const sessionView = createSessionView();
const selectionView = createSelectionView({
  getSelection: () => selection,
  getInventory: () => save.toilets,
  getFoodInventory: () => save.foods,
  getTotal: () => save.total,
  onChange(change) {
    if (save.session || finishing) return false;
    if (change.toiletId && !equipToilet(save.toilets, change.toiletId))
      return false;
    if (change.foodIds && !canEatFoods(save.foods, change.foodIds))
      return false;
    selection = normalizeSelection({ ...selection, ...change });
    persist();
    selectionView.render();
    sessionView.showIdle();
    audio.play([440], 0.06);
    return true;
  },
});

function persist() {
  save.settings = structuredClone(selection);
  store.write(save);
  if (!store.available)
    $("#saved-note").textContent = "本次进度仅在当前页面保留";
}

function startSession() {
  if (save.session?.phase === "aiming") {
    void stopForce();
    return;
  }
  if (save.session || finishing || $$("dialog[open]").length) return;
  if (!equipToilet(save.toilets, selection.toiletId)) return;
  if (!canEatFoods(save.foods, selection.foodIds)) return;
  save.session = createAimingSession(selection);
  persist();
  selectionView.lock(true);
  sessionView.showRunning(save.session);
  audio.play([330, 440, 550]);
  cancelAnimationFrame(frame);
  tick();
}

async function stopForce() {
  if (finishing || save.session?.phase !== "aiming") return;
  const stoppedAt = Date.now();
  finishing = true;
  cancelAnimationFrame(frame);
  $("#start-button").disabled = true;
  try {
    const stopped = await store.lockForce(save.session.id, stoppedAt);
    save = stopped.save;
    selection = normalizeSelection(save.settings);
    if (save.session) {
      sessionView.showRunning(save.session);
      audio.play([550, 440, 330], 0.06);
    } else sessionView.showIdle();
  } finally {
    finishing = false;
    selectionView.lock(Boolean(save.session));
    if (save.session) tick();
  }
}

function tick() {
  if (!save.session || finishing) return;
  if (save.session.phase === "aiming") {
    sessionView.renderForce(
      oscillatingForce(Date.now() - save.session.startedAt),
    );
    frame = requestAnimationFrame(tick);
    return;
  }
  const progress = sessionProgress(save.session);
  if (!progress.remaining) {
    void finishSession();
    return;
  }
  frame = requestAnimationFrame(tick);
}

async function finishSession() {
  if (!save.session || finishing) return;
  finishing = true;
  cancelAnimationFrame(frame);
  try {
    const settled = await store.settle(save.session.id);
    save = settled.save;
    selection = normalizeSelection(save.settings);
    selectionView.render();
    collectionView.render();
    if (settled.result) {
      sessionView.showIdle();
      sessionView.showResult(settled.result);
      audio.playResult(
        characterById[settled.result.session.outcome.characterId],
      );
    } else if (!save.session) sessionView.showIdle();
  } finally {
    finishing = false;
    selectionView.lock(Boolean(save.session));
    if (save.session) tick();
  }
}

bindDialogs();
$("#start-button").addEventListener("click", startSession);
$("#play-again").addEventListener("click", () => {
  $("#result-dialog").close();
  audio.play([620, 440, 260], 0.07);
  $("#start-button").focus({ preventScroll: true });
});
$("#result-dialog").addEventListener("close", () => {
  if (!$("#result-dialog").open) audio.stopResult();
});
$("#collection-button").addEventListener("click", () => {
  $("#collection-dialog").showModal();
  collectionView.render();
});
$("#help-button").addEventListener("click", () =>
  $("#help-dialog").showModal(),
);
$("#sound-button").addEventListener("click", () => {
  save.sound = !save.sound;
  if (!save.sound) audio.stop();
  audio.render();
  persist();
  audio.play([440, 660], 0.09);
});
document.addEventListener("keydown", (event) => {
  if (
    event.code !== "Space" ||
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    $$("dialog[open]").length ||
    ["INPUT", "BUTTON", "A", "TEXTAREA", "SELECT"].includes(
      event.target.tagName,
    )
  )
    return;
  event.preventDefault();
  startSession();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && save.session) {
    cancelAnimationFrame(frame);
    tick();
  }
});
window.addEventListener("storage", (event) => {
  if (event.key !== gameConfig.storageKey || finishing) return;
  save = store.read();
  selection = normalizeSelection(save.settings);
  cancelAnimationFrame(frame);
  selectionView.render();
  collectionView.render();
  audio.render();
  selectionView.lock(Boolean(save.session));
  if (save.session) {
    sessionView.showRunning(save.session);
    tick();
  } else sessionView.showIdle();
});

persist();
selectionView.render();
collectionView.render();
audio.render();
selectionView.lock(Boolean(save.session));
if (save.session) {
  sessionView.showRunning(save.session);
  tick();
} else sessionView.showIdle();
if (!store.available) {
  $("#toast").textContent = "浏览器未允许保存，当前页面仍可正常游玩。";
  $("#toast").classList.add("visible");
  setTimeout(() => $("#toast").classList.remove("visible"), 4000);
}
