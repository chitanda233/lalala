import {
  bristolTypes,
  resolveBristolType,
  stoolShape,
  bristolSvg,
} from "./bristol.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const STORAGE_KEY = "lalala-save-v1";
const recipes = {
  balanced: {
    name: "均衡套餐",
    description: "平平淡淡，才是肚子的浪漫。",
  },
  garden: {
    name: "绿色生活",
    description: "一口绿色，一整个轻盈的好心情。",
  },
  carbs: {
    name: "快乐碳水",
    description: "快乐吃得饱饱，惊喜慢慢酝酿。",
  },
  spicy: {
    name: "火辣挑战",
    description: "生活需要热情，马桶也是。",
  },
};
const characters = [
  {
    id: "classic",
    name: "顺畅小能手",
    tag: "日常小确幸",
    color: "#ac8861",
    light: "#cba880",
    description: "不紧不慢，刚刚好。平凡的一天，也能拥有满分的畅快。",
    hint: "均衡套餐，朴素的快乐。",
  },
  {
    id: "garden",
    name: "森林小精灵",
    tag: "一身轻盈",
    color: "#91a66d",
    light: "#b1c18d",
    description: "把绿色吃进肚子，把轻盈留给自己。今天也是清新的一天。",
    hint: "一份绿色，等一个精灵。",
  },
  {
    id: "bread",
    name: "碳水小面包",
    tag: "松松软软",
    color: "#d3a365",
    light: "#edc68c",
    description: "快乐碳水的终点，是一枚暖乎乎的小面包。软软的，刚刚好。",
    hint: "面包脑袋的专属快乐。",
  },
  {
    id: "fire",
    name: "火山小辣椒",
    tag: "热情似火",
    color: "#c87d5d",
    light: "#e5a27b",
    description: "一腔热情，释放完毕。连今天的烦恼，都被这股热情融化了。",
    hint: "来点火辣的，或者再加点辣。",
  },
  {
    id: "coffee",
    name: "醒神咖啡豆",
    tag: "精神满满",
    color: "#826b56",
    light: "#a58b6e",
    description: "咖啡叫醒了灵魂，也叫醒了今天的小惊喜。新的状态，已上线。",
    hint: "闻到咖啡香了吗？",
  },
  {
    id: "cloud",
    name: "轻盈小云朵",
    tag: "软乎乎的快乐",
    color: "#b4bc9b",
    light: "#d7ddbc",
    description: "咕噜咕噜，轻轻松松。像云朵一样，连心情也变得软绵绵。",
    hint: "益生菌和充足的水，会碰出什么？",
  },
  {
    id: "pebble",
    name: "倔强小石头",
    tag: "有点小个性",
    color: "#a79a7d",
    light: "#c4b99d",
    description: "今天的你，有一点点倔强。下次换个配方，也许会有新的惊喜。",
    hint: "喝得少一点，个性多一点。",
  },
  {
    id: "gold",
    name: "黄金传说",
    tag: "稀有 · 完美释放",
    color: "#c7a44e",
    light: "#edce76",
    description:
      "绿色、益生菌和刚刚好的水量，组成了这份黄金默契。今天的你，闪闪发光！",
    hint: "绿色生活 + 益生菌 + 1,500–2,000 mL。",
  },
];

function readSave() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const validSession =
      value.session &&
      recipes[value.session.recipe] &&
      Number.isFinite(value.session.startedAt) &&
      Number.isFinite(value.session.endsAt) &&
      value.session.endsAt > value.session.startedAt &&
      value.session.endsAt - value.session.startedAt <= 8000 &&
      Number.isFinite(value.session.water) &&
      Array.isArray(value.session.additives);
    return {
      specimens: Array.isArray(value.specimens)
        ? value.specimens.filter(
            (entry, index, entries) =>
              entry &&
              Number.isInteger(entry.type) &&
              entry.type >= 1 &&
              entry.type <= 7 &&
              characters.some(
                (character) => character.id === entry.characterId,
              ) &&
              entries.findIndex(
                (other) =>
                  other?.type === entry.type &&
                  other?.characterId === entry.characterId,
              ) === index,
          )
        : [],
      collection: Array.isArray(value.collection)
        ? value.collection.filter((id) =>
            characters.some((character) => character.id === id),
          )
        : [],
      total:
        Number.isSafeInteger(value.total) && value.total >= 0 ? value.total : 0,
      sound: value.sound === true,
      session: validSession ? value.session : null,
      settings: value.settings || {},
    };
  } catch {
    return {
      specimens: [],
      collection: [],
      total: 0,
      sound: false,
      session: null,
      settings: {},
    };
  }
}

const save = readSave();
const initial = save.settings;
let selection = {
  recipe: recipes[initial.recipe] ? initial.recipe : "balanced",
  water: Number.isFinite(initial.water)
    ? Math.max(250, Math.min(2500, Math.round(initial.water / 250) * 250))
    : 1500,
  additives: new Set(
    Array.isArray(initial.additives)
      ? initial.additives.filter((item) =>
          ["probiotic", "coffee", "chili"].includes(item),
        )
      : [],
  ),
  duration: ["2", "4", "8", "random"].includes(initial.duration)
    ? initial.duration
    : "4",
};
let frame;
let audioContext;
let toastTimer;
let storageAvailable = true;
let collectionView = "forms";
let collectionFilter = "all";

function persist() {
  save.settings = { ...selection, additives: [...selection.additives] };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    storageAvailable = false;
    $("#saved-note").textContent = "本次进度仅在当前页面保留";
  }
}

function sound(notes = [390, 520], length = 0.1) {
  if (!save.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended")
      audioContext.resume().catch(() => {});
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      const at = audioContext.currentTime + index * length;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.05, at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, at + length);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(at);
      oscillator.stop(at + length + 0.02);
    });
  } catch {
    /* Audio is optional; the game also runs without an audio device. */
  }
}

function characterSvg(character, locked = false, type = null) {
  const { id, color, light } = character;
  const crown =
    id === "gold"
      ? '<path d="m63 29-8-20 20 9L87 1l11 17 21-10-8 24Z" fill="#e4bf56" stroke="#b69242" stroke-width="2"/><path d="m42 49 2 7 7 2-7 2-2 7-2-7-7-2 7-2Zm93 41 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#dfbf64"/>'
      : "";
  const leaf =
    id === "garden"
      ? '<path d="M87 38c-21-4-25-19-18-29 17 1 24 14 18 29Z" fill="#789557" stroke="#617e48" stroke-width="2"/><path d="M87 36c0-21 14-25 25-20 0 15-10 23-25 20Z" fill="#a2b97b" stroke="#617e48" stroke-width="2"/>'
      : "";
  const flame =
    id === "fire"
      ? '<path d="M87 35c-18-12 0-25-1-34 19 16 16 24 7 34Z" fill="#e5b469"/>'
      : "";
  const coffee =
    id === "coffee"
      ? '<path d="M76 7q-7 8 0 15m14-20q-7 8 0 15m13-10q-7 8 0 15" fill="none" stroke="#b8a689" stroke-width="2.5" stroke-linecap="round"/>'
      : "";
  const shape = type
    ? stoolShape(type, color, light)
    : id === "pebble"
      ? `<ellipse cx="63" cy="99" rx="23" ry="21" fill="${color}"/><ellipse cx="106" cy="94" rx="24" ry="25" fill="${light}"/><ellipse cx="87" cy="66" rx="24" ry="25" fill="${color}"/>`
      : id === "cloud"
        ? `<path d="M41 113c-19-9-13-33 6-35-10-18 10-34 26-24 1-27 31-27 35-4 24-8 40 18 24 32 23 13 11 38-10 38H54Z" fill="${color}"/><path d="M48 80q8-17 25-10m9-17q14-4 17 8" fill="none" stroke="${light}" stroke-width="6" stroke-linecap="round"/>`
        : `<path d="M57 74c-8-15 1-26 18-30 8-2 15-9 12-19 27 9 28 29 19 39 20-1 31 17 22 30 21 9 17 31-4 34H48c-25 0-29-26-7-35-5-7 0-17 16-19Z" fill="${color}"/><path d="M63 64q9-13 23-15m-34 44q27 7 66-2" fill="none" stroke="${light}" stroke-width="6" stroke-linecap="round"/>`;
  const faceTransform =
    {
      1: "translate(16 72) scale(.4)",
      2: "translate(35 7) scale(.6)",
      3: "translate(35 7) scale(.6)",
      4: "translate(35 7) scale(.6)",
      5: "translate(7 59) scale(.5)",
      6: "translate(47 63) scale(.5)",
    }[type] || "";
  return `<svg viewBox="0 0 174 150" role="img" aria-label="${locked ? "尚未解锁" : character.name}${type ? ` · 布里斯托 ${type} 型` : ""}">${crown}${leaf}${flame}${coffee}${shape}<g transform="${faceTransform}"><g fill="#fff9e7"><ellipse cx="68" cy="98" rx="3.5" ry="4.5"/><ellipse cx="105" cy="98" rx="3.5" ry="4.5"/></g><path d="M79 111q8 8 15 0" fill="none" stroke="#fff9e7" stroke-width="3" stroke-linecap="round"/><ellipse cx="56" cy="108" rx="6" ry="3" fill="#e7b9a0" opacity=".5"/><ellipse cx="117" cy="108" rx="6" ry="3" fill="#e7b9a0" opacity=".5"/></g></svg>`;
}

function smoothness(config = selection) {
  return [1, 2, 4, 5, 3, 2, 1][resolveBristolType(config) - 1];
}

function renderSelection() {
  $$(".recipe-card").forEach((button) => {
    const selected = button.dataset.recipe === selection.recipe;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected);
  });
  $$(".time-option").forEach((button) => {
    const selected = button.dataset.duration === selection.duration;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected);
  });
  $("#water").value = selection.water;
  $("#water-value").innerHTML =
    `${selection.water.toLocaleString("en-US")} <small>mL</small>`;
  const percent = ((selection.water - 250) / 2250) * 100;
  $("#water").style.background =
    `linear-gradient(to right,#9bb77a 0%,#9bb77a ${percent}%,#e8ecdf ${percent}%,#e8ecdf 100%)`;
  $$(".additive-input").forEach((input) => {
    input.checked = selection.additives.has(input.value);
  });
  const smooth = smoothness();
  $$("#smooth-bars i").forEach((bar, index) =>
    bar.classList.toggle("active", index < smooth),
  );
  $("#smooth-bars").setAttribute("aria-label", `顺畅指数 ${smooth} / 5`);
  $("#surprise-value").textContent =
    selection.additives.size >= 2
      ? "惊喜拉满"
      : selection.recipe === "spicy" || selection.additives.size
        ? "有点意思"
        : "小小期待";
  $("#forecast-description").textContent =
    selection.water <= 750
      ? "有点干巴巴，倔强的小惊喜正在路上。"
      : selection.additives.has("chili")
        ? "辣度加倍，今天注定是热情的一天。"
        : recipes[selection.recipe].description;
  const bristol = bristolTypes[resolveBristolType(selection) - 1];
  $("#forecast-type").textContent = `${bristol.id} 型 · ${bristol.name}`;
  persist();
}

function resolveCharacter(session) {
  const additives = new Set(session.additives);
  if (session.water <= 750) return "pebble";
  if (
    session.recipe === "garden" &&
    additives.has("probiotic") &&
    session.water >= 1500 &&
    session.water <= 2000 &&
    !additives.has("chili") &&
    !additives.has("coffee")
  )
    return "gold";
  if (additives.has("chili") || session.recipe === "spicy") return "fire";
  if (additives.has("coffee")) return "coffee";
  if (additives.has("probiotic") && session.water >= 2000) return "cloud";
  return (
    { balanced: "classic", garden: "garden", carbs: "bread" }[session.recipe] ||
    "classic"
  );
}

function renderCollection() {
  const discoveredTypes = new Set(save.specimens.map((entry) => entry.type));
  $("#collection-count").textContent = String(discoveredTypes.size).padStart(
    2,
    "0",
  );
  $("#collection-count").title =
    `已发现 ${discoveredTypes.size} / 7 型 · 已收集 ${save.collection.length} / 8 种角色`;
  $("#collection-total").textContent =
    collectionView === "forms"
      ? `${discoveredTypes.size} / 7 型`
      : `${save.collection.length} / ${characters.length}`;
  $$("[data-collection-view]").forEach((button) => {
    const selected = button.dataset.collectionView === collectionView;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-selected", selected);
    button.tabIndex = selected ? 0 : -1;
  });
  $("#bristol-panel").hidden = collectionView !== "forms";
  $("#characters-panel").hidden = collectionView !== "characters";
  $$("[data-type-filter]").forEach((button) => {
    const selected = button.dataset.typeFilter === collectionFilter;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected);
  });
  $("#bristol-grid").innerHTML = bristolTypes
    .filter(
      (type) => collectionFilter === "all" || type.group === collectionFilter,
    )
    .map((type) => {
      const entries = save.specimens.filter((entry) => entry.type === type.id);
      return `<article class="bristol-card ${entries.length ? "discovered" : "undiscovered"}" data-bristol-type="${type.id}"><div class="bristol-art">${bristolSvg(type.id)}</div><div class="bristol-card-copy"><div class="bristol-card-heading"><span class="type-number">TYPE ${String(type.id).padStart(2, "0")}</span><span class="type-group ${type.group}">${type.groupLabel}</span></div><h3>${type.name}</h3><p>${type.description}</p><div class="type-discoveries">${entries.length ? `<span class="discovery-dot"></span>已发现 ${entries.length} 种角色外观` : `待发现 · ${type.hint}`}</div>${entries.length ? `<div class="specimen-tags">${entries.map((entry) => `<span>${characters.find((character) => character.id === entry.characterId).name}</span>`).join("")}</div>` : ""}</div></article>`;
    })
    .join("");
  $("#collection-grid").innerHTML = characters
    .map((character) => {
      const unlocked = save.collection.includes(character.id);
      const entries = save.specimens.filter(
        (entry) => entry.characterId === character.id,
      );
      return `<div class="collection-item ${unlocked ? "" : "locked"}">${characterSvg(character, !unlocked, entries[0]?.type)}<strong>${unlocked ? character.name : "???"}</strong><p>${unlocked ? character.tag : character.hint}</p>${unlocked ? `<div class="character-types">${entries.length ? entries.map((entry) => `<span>${entry.type} 型</span>`).join("") : '<span class="type-pending">形态待发现</span>'}</div>` : ""}</div>`;
    })
    .join("");
  $("#collection-summary").textContent = save.total
    ? `已经畅快 ${save.total} 次 · 已发现 ${discoveredTypes.size} / 7 型 · 收集了 ${save.collection.length} 种角色`
    : "7 种形态，8 种角色外观。你的第一份小发现，正在等你。";
}

function lockSettings(locked) {
  $$(".recipe-card, .time-option, .additive-input, #water").forEach((input) => {
    input.disabled = locked;
  });
  $("#start-button").disabled = locked;
}

function startSession() {
  if (save.session || $$("dialog[open]").length) return;
  const seconds =
    selection.duration === "random"
      ? Math.floor(Math.random() * 7) + 2
      : Number(selection.duration);
  const startedAt = Date.now();
  save.session = {
    recipe: selection.recipe,
    water: selection.water,
    additives: [...selection.additives],
    startedAt,
    endsAt: startedAt + seconds * 1000,
    seconds,
  };
  persist();
  sound([330, 440, 550]);
  showRunning();
}

function showRunning() {
  lockSettings(true);
  $("#bathroom-scene").classList.add("running");
  $("#room-status").textContent = "私人卫生间 · 使用中";
  $("#ready-tag").innerHTML = "<span></span>嘘，正在认真办大事";
  $("#action-title").textContent = "放轻松，慢慢来。";
  $("#action-description").textContent =
    `${recipes[save.session.recipe].name}正在酝酿，给好事一点时间。`;
  $("#floating-note").innerHTML =
    '<svg class="icon"><use href="#i-clock"/></svg> 你的快乐正在路上';
  $("#session-progress").hidden = false;
  $(".button-text").textContent = "正在努力中…";
  $("#keyboard-hint").textContent = "深呼吸，把这一刻留给自己。";
  cancelAnimationFrame(frame);
  tick();
}

function tick() {
  if (!save.session) return;
  const remaining = Math.max(0, save.session.endsAt - Date.now());
  const progress = Math.max(
    0,
    Math.min(1, 1 - remaining / (save.session.endsAt - save.session.startedAt)),
  );
  $("#countdown").textContent =
    `00:${String(Math.ceil(remaining / 1000)).padStart(2, "0")}`;
  $("#progress-fill").style.width = `${progress * 100}%`;
  $("#session-label").textContent =
    progress < 0.4
      ? "美好正在酝酿"
      : progress < 0.8
        ? "快乐蓄力中"
        : "马上就好啦";
  if (!remaining) {
    finishSession();
    return;
  }
  frame = requestAnimationFrame(tick);
}

function finishSession() {
  const session = save.session;
  if (!session) return;
  cancelAnimationFrame(frame);
  const character = characters.find(
    (item) => item.id === resolveCharacter(session),
  );
  const isNew = !save.collection.includes(character.id);
  if (isNew) save.collection.push(character.id);
  const bristol = bristolTypes[resolveBristolType(session) - 1];
  const isNewType = !save.specimens.some((entry) => entry.type === bristol.id);
  const isNewSpecimen = !save.specimens.some(
    (entry) => entry.type === bristol.id && entry.characterId === character.id,
  );
  if (isNewSpecimen)
    save.specimens.push({ type: bristol.id, characterId: character.id });
  save.total += 1;
  save.session = null;
  persist();
  renderCollection();
  lockSettings(false);
  $("#bathroom-scene").classList.remove("running");
  $("#room-status").textContent = "私人卫生间 · 空闲中";
  $("#ready-tag").innerHTML = "<span></span>一切就绪，等你落座";
  $("#action-title").textContent = "把烦恼，统统冲走。";
  $("#action-description").textContent = "选好今天的配方，剩下的交给时间。";
  $("#floating-note").innerHTML =
    '<svg class="icon"><use href="#i-leaf"/></svg> 放轻松，好事正在发生';
  $("#session-progress").hidden = true;
  $(".button-text").textContent = "开始拉屎";
  $("#keyboard-hint").innerHTML =
    "给自己一点时间 <span>SPACE</span> 也可以开始";
  $("#result-character").innerHTML = characterSvg(character, false, bristol.id);
  $("#result-type").textContent = `布里斯托 ${bristol.id} 型 · ${bristol.name}`;
  $("#result-type").className = `result-type type-group ${bristol.group}`;
  $("#result-form-description").textContent = bristol.description;
  $("#result-rarity").textContent = character.tag;
  $("#result-name").textContent = character.name;
  $("#result-description").textContent = character.description;
  $("#result-recipe").textContent = recipes[session.recipe].name;
  $("#result-time").textContent =
    `${Math.round((session.endsAt - session.startedAt) / 1000)} 秒`;
  $("#result-score").textContent =
    `${Math.min(100, 50 + smoothness(session) * 9 + (character.id === "gold" ? 5 : 0))} 分`;
  $("#result-new").textContent = isNewType
    ? `✦ 新形态！${bristol.id} 型已收进图鉴${isNew ? "，还解锁了新角色" : ""}`
    : isNew
      ? "✦ 新角色！已收进你的图鉴"
      : isNewSpecimen
        ? "✦ 新组合！这个角色有了新的形态"
        : "熟悉的小快乐，又见面啦";
  // A running session can finish while another dialog is open. Show one modal at a time.
  $$("dialog[open]").forEach((dialog) => dialog.close());
  $("#result-dialog").showModal();
  sound([523.25, 659.25, 783.99, 1046.5], 0.13);
}

function renderSound() {
  $("#sound-button").innerHTML =
    `<svg class="icon"><use href="#i-${save.sound ? "sound" : "mute"}"/></svg><span>音效${save.sound ? "开" : "关"}</span>`;
  $("#sound-button").setAttribute("aria-pressed", save.sound);
  $("#sound-button").setAttribute(
    "aria-label",
    `${save.sound ? "关闭" : "开启"}音效`,
  );
}

$$(".recipe-card").forEach((button) =>
  button.addEventListener("click", () => {
    if (save.session) return;
    selection.recipe = button.dataset.recipe;
    renderSelection();
    sound([440], 0.06);
  }),
);
$$(".time-option").forEach((button) =>
  button.addEventListener("click", () => {
    if (save.session) return;
    selection.duration = button.dataset.duration;
    renderSelection();
    sound([480], 0.06);
  }),
);
$("#water").addEventListener("input", (event) => {
  if (save.session) return;
  selection.water = Number(event.target.value);
  renderSelection();
});
$$(".additive-input").forEach((input) =>
  input.addEventListener("change", () => {
    if (save.session) return;
    input.checked
      ? selection.additives.add(input.value)
      : selection.additives.delete(input.value);
    renderSelection();
    sound([460], 0.06);
  }),
);
$("#start-button").addEventListener("click", startSession);
$("#play-again").addEventListener("click", () => {
  $("#result-dialog").close();
  sound([620, 440, 260], 0.07);
  $("#start-button").focus({ preventScroll: true });
});
$("#collection-button").addEventListener("click", () => {
  renderCollection();
  $("#collection-dialog").showModal();
});
$$("[data-collection-view]").forEach((button) =>
  button.addEventListener("click", () => {
    collectionView = button.dataset.collectionView;
    renderCollection();
  }),
);
$(".collection-tabs").addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const tabs = $$("[data-collection-view]");
  const current = tabs.indexOf(document.activeElement);
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
          tabs.length;
  collectionView = tabs[next].dataset.collectionView;
  renderCollection();
  tabs[next].focus();
});
$$("[data-type-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    collectionFilter = button.dataset.typeFilter;
    renderCollection();
  }),
);
$("#help-button").addEventListener("click", () =>
  $("#help-dialog").showModal(),
);
$$("[data-close]").forEach((button) =>
  button.addEventListener("click", () =>
    document.getElementById(button.dataset.close).close(),
  ),
);
$$("dialog").forEach((dialog) =>
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  }),
);
$("#sound-button").addEventListener("click", () => {
  save.sound = !save.sound;
  renderSound();
  persist();
  sound([440, 660], 0.09);
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

// Prevent two open tabs from crediting the same session independently.
window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  const updated = readSave();
  if (updated.total > save.total) {
    save.total = updated.total;
    save.collection = updated.collection;
    save.specimens = updated.specimens;
    if (save.session && !updated.session) {
      save.session = null;
      cancelAnimationFrame(frame);
      location.reload();
      return;
    }
    renderCollection();
  }
});

renderSelection();
renderCollection();
renderSound();
if (save.session) showRunning();
if (!storageAvailable) {
  $("#toast").textContent = "浏览器未允许保存，当前页面仍可正常游玩。";
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 4000);
}
