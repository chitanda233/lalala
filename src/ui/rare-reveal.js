// Presentation only: the settled outcome has already been drawn and saved.
// Keeping the particle layout deterministic also avoids consuming game randomness.
export const rareRevealThemes = {
  gold: {
    title: "黄金传说，闪亮登场！",
    copy: "这一局，普通日子真的被点成了金。",
    accent: "#d2aa39",
    glow: "#f3d77d",
    surface: "#fff9e8",
    ink: "#8a6425",
    motif: "sunburst",
    symbol: "✦",
    notes: [523.25, 659.25, 783.99, 1046.5, 1318.51],
  },
  crystal: {
    title: "晶莹时刻，棱角分明。",
    copy: "晶种等到了自己的聚光灯，每一面都接住了光。",
    accent: "#72aabe",
    glow: "#bde5ed",
    surface: "#f0fbff",
    ink: "#39768e",
    motif: "facets",
    symbol: "◇",
    notes: [783.99, 1174.66, 1567.98, 2093],
  },
  rainbow: {
    title: "七色到齐，一起出场！",
    copy: "颜色们罕见地排好了队，把整场快乐接成一条彩虹。",
    accent: "#b88cc1",
    glow: "#ecc5d7",
    surface: "#fff4fb",
    ink: "#916a9d",
    motif: "rainbow",
    symbol: "✧",
    notes: [523.25, 587.33, 659.25, 783.99, 880, 1046.5],
  },
  jelly: {
    title: "Q 弹登场，稳稳接住！",
    copy: "软软的边缘弹了一下，今天的运气也跟着晃了晃。",
    accent: "#c18dbb",
    glow: "#eed0e7",
    surface: "#fff3fb",
    ink: "#91638e",
    motif: "bubbles",
    symbol: "○",
    notes: [392, 523.25, 440, 659.25, 783.99],
  },
  "frost-crystal": {
    title: "霜花落定，收藏小冬天。",
    copy: "细小的冰晶把这一刻镶了边，连登场都透着清凉。",
    accent: "#91b9c2",
    glow: "#d7edf3",
    surface: "#f3fbff",
    ink: "#517c91",
    motif: "snowflakes",
    symbol: "❄",
    notes: [1046.5, 1567.98, 1318.51, 2093],
  },
  luminous: {
    title: "微光亮起，发现夜光浮岛。",
    copy: "不用开大灯，这份罕见的小快乐自己会发光。",
    accent: "#91ca9f",
    glow: "#caedb0",
    surface: "#eaf5eb",
    ink: "#4d815d",
    motif: "orbit",
    symbol: "✧",
    notes: [659.25, 783.99, 987.77, 1318.51],
  },
  meteor: {
    title: "星尘着陆，宇宙来信。",
    copy: "一小块银河落在了这里，这次真的接到了天外之物。",
    accent: "#929ecb",
    glow: "#c1c9ee",
    surface: "#f0f1fa",
    ink: "#626c9c",
    motif: "meteor",
    symbol: "✦",
    notes: [261.63, 392, 523.25, 783.99, 1046.5],
  },
  "amber-fossil": {
    title: "琥珀封存，这一局值得留住。",
    copy: "暖色光晕把叶纹轻轻收好，时间也愿意为它停一停。",
    accent: "#cc9955",
    glow: "#f2d29a",
    surface: "#fff7e9",
    ink: "#956a37",
    motif: "leaves",
    symbol: "❧",
    notes: [440, 554.37, 659.25, 880],
  },
};

const fallbackTheme = {
  ...rareRevealThemes.crystal,
  title: "罕见的快乐，终于遇见！",
  copy: "这是一份值得专门留在图鉴里的小幸运。",
};

export function rareRevealTheme(character) {
  return character?.rarity === "special"
    ? rareRevealThemes[character.id] || fallbackTheme
    : null;
}

export function createRareReveal(dialog) {
  const stage = dialog.querySelector("#result-character");
  const decoration = dialog.querySelector(".result-decoration");
  const reveal = document.createElement("section");
  reveal.id = "rare-reveal";
  reveal.className = "rare-reveal";
  reveal.hidden = true;
  reveal.setAttribute("role", "status");
  reveal.setAttribute("aria-live", "polite");
  reveal.setAttribute("aria-atomic", "true");
  reveal.innerHTML =
    '<span class="rare-reveal-eyebrow"></span><strong id="rare-reveal-title"></strong><p id="rare-reveal-copy"></p>';
  dialog.insertBefore(reveal, stage);

  function clear() {
    dialog.classList.remove("rare-result");
    delete dialog.dataset.rarity;
    delete dialog.dataset.material;
    reveal.hidden = true;
    delete reveal.dataset.material;
    reveal.querySelector(".rare-reveal-eyebrow").textContent = "";
    reveal.querySelector("#rare-reveal-title").textContent = "";
    reveal.querySelector("#rare-reveal-copy").textContent = "";
    stage
      .querySelectorAll(".rare-reveal-motif, #rare-reveal-particles")
      .forEach((node) => node.remove());
    for (const property of ["accent", "glow", "surface", "ink"])
      dialog.style.removeProperty(`--rare-${property}`);
    if (decoration) decoration.hidden = false;
  }

  function show(character) {
    clear();
    dialog.dataset.rarity = character.rarity || "common";
    const theme = rareRevealTheme(character);
    if (!theme) return false;

    dialog.classList.add("rare-result");
    dialog.dataset.material = character.id;
    for (const property of ["accent", "glow", "surface", "ink"])
      dialog.style.setProperty(`--rare-${property}`, theme[property]);
    reveal.dataset.material = character.id;
    reveal.querySelector(".rare-reveal-eyebrow").textContent =
      `✦ 稀有发现 · ${character.material}`;
    reveal.querySelector("#rare-reveal-title").textContent = theme.title;
    reveal.querySelector("#rare-reveal-copy").textContent = theme.copy;
    reveal.hidden = false;
    if (decoration) decoration.hidden = true;

    const motif = document.createElement("div");
    motif.className = `rare-reveal-motif rare-motif-${theme.motif}`;
    motif.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 3; index++) {
      const shape = document.createElement("span");
      shape.textContent = theme.symbol;
      motif.append(shape);
    }
    const particles = document.createElement("div");
    particles.id = "rare-reveal-particles";
    particles.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 12; index++) {
      const particle = document.createElement("span");
      particle.className = "rare-particle";
      particle.textContent = theme.symbol;
      const angle = (index / 12) * Math.PI * 2;
      particle.style.setProperty("--particle-x", `${Math.cos(angle) * 118}px`);
      particle.style.setProperty("--particle-y", `${Math.sin(angle) * 66}px`);
      particle.style.setProperty("--particle-turn", `${index * 37 - 150}deg`);
      particle.style.setProperty(
        "--particle-size",
        `${index % 3 === 0 ? 14 : 9}px`,
      );
      particles.append(particle);
    }
    stage.prepend(motif, particles);
    return true;
  }

  dialog.addEventListener("close", () => {
    // A close event can arrive after a subsequent result has reopened the dialog.
    if (!dialog.open) clear();
  });

  return { show, clear };
}
