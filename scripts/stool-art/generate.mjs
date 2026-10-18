import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { characters } from "../../src/content/specimens.js";
const root = new URL("../../", import.meta.url);
const destination = new URL("assets/stools/", root);
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.LALALA_CHROME ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({
  viewport: { width: 320, height: 320 },
  deviceScaleFactor: 1,
});
page.on("pageerror", (error) => {
  console.error(error);
  process.exitCode = 1;
});
await page.goto(
  process.env.STOOL_ART_URL ||
    "http://127.0.0.1:4175/scripts/stool-art/renderer.html",
);
await page.waitForFunction(() => window.rendererReady);
const prototype = process.argv.includes("--prototype");
const onlyMarks = process.argv.includes("--marks-only");
const onlyType = Number(
  process.argv.find((arg) => arg.startsWith("--type="))?.split("=")[1],
);
// Six type-7 concepts are stored in a dedicated raster atlas, not renderer PNG triplets.
const atlasArtIds = new Set([
  "enoki-jet", "corn-cannon", "golden-juice",
  "rainbow-falls", "glitter-galaxy", "ink-fountain",
]);
const chosen = prototype
  ? characters.filter((item) =>
      [
        "classic",
        "pebble",
        "spiral",
        "gold",
        "crystal",
        "jelly",
        "luminous",
        "mashed-potato",
        "jet",
        "rainbow",
      ].includes(item.id),
    )
  : characters.filter((item) => !atlasArtIds.has(item.id));
let rendered = 0;
for (const [index, item] of characters.entries()) {
  if (!chosen.includes(item)) continue;
  const types = prototype ? [item.homeType] : item.types;
  for (const type of types) {
    if (onlyType && type !== onlyType) continue;
    for (const pass of onlyMarks ? [] : [0, 1]) {
      const url = await page.evaluate(
        (args) => window.renderCollectible(args),
        { art: item.art, type, variant: index, pass, size: 320 },
      );
      const filename = `${item.id}-${type}${pass ? "-decor" : ""}.png`;
      await writeFile(
        new URL(filename, destination),
        Buffer.from(url.split(",")[1], "base64"),
      );
    }
    const mark = await page.evaluate((args) => window.renderCollectible(args), {
      art: item.art,
      type,
      variant: index,
      pass: 1,
      signature: "enoki",
      size: 320,
    });
    await writeFile(
      new URL(`${item.id}-${type}-enoki.png`, destination),
      Buffer.from(mark.split(",")[1], "base64"),
    );
    rendered++;
    if (rendered % 10 === 0)
      console.log(`Rendered ${rendered} collectible forms`);
  }
}
if (!prototype) {
  for (let type = 1; type <= 7; type++) {
    if (onlyType && type !== onlyType) continue;
    if (!onlyMarks) {
      const url = await page.evaluate(
        (args) => window.renderCollectible(args),
        {
          art: type === 3 ? "cracks" : "plain",
          type,
          variant: 0,
          pass: 0,
          size: 320,
        },
      );
      await writeFile(
        new URL(`type-${type}.png`, destination),
        Buffer.from(url.split(",")[1], "base64"),
      );
    }
    const mark = await page.evaluate((args) => window.renderCollectible(args), {
      art: type === 3 ? "cracks" : "plain",
      type,
      variant: 0,
      pass: 1,
      signature: "enoki",
      size: 320,
    });
    await writeFile(
      new URL(`type-${type}-enoki.png`, destination),
      Buffer.from(mark.split(",")[1], "base64"),
    );
  }
}
console.log(
  `Generated ${rendered} forms, 320 × 320 RGBA, ${prototype ? "prototype" : "full catalog"}`,
);
await browser.close();
