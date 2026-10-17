import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { characters } from "../src/content/stools.js";
import {
  characterSvg,
  mysterySvg,
  bristolSvg,
} from "../src/ui/artwork/stools.js";

function assertPng(name) {
  const file = new URL(`../assets/stools/${name}.png`, import.meta.url);
  assert.ok(existsSync(file), `${name} asset is missing`);
  const bytes = readFileSync(file);
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(bytes.readUInt32BE(16), 320);
  assert.equal(bytes.readUInt32BE(20), 320);
  assert.ok(bytes.length > 300, `${name} is unexpectedly empty`);
}
test("all 50 collectible species and seven fallback illustrations have complete 3D sprite assets", () => {
  let forms = 0;
  for (const item of characters)
    for (const type of item.types) {
      assertPng(`${item.id}-${type}`);
      assertPng(`${item.id}-${type}-decor`);
      assertPng(`${item.id}-${type}-enoki`);
      const markup = characterSvg(item, false, type);
      assert.match(
        markup,
        new RegExp(`/assets/stools/${item.id}-${type}\\.png`),
      );
      forms++;
    }
  assert.equal(forms, 50);
  assert.equal(
    readdirSync(new URL("../assets/stools/", import.meta.url)).filter((name) =>
      name.endsWith(".png"),
    ).length,
    50 * 3 + 7 * 2,
  );
  for (let type = 1; type <= 7; type++) {
    assertPng(`type-${type}`);
    assertPng(`type-${type}-enoki`);
    assert.match(bristolSvg(type), new RegExp(`type-${type}\\.png`));
  }
});
test("locked art is one anonymous silhouette with no name, material, palette or asset references", () => {
  const locked = characters.map((item) => characterSvg(item, true));
  assert.equal(new Set(locked).size, 1);
  assert.equal(locked[0], mysterySvg());
  assert.ok(!locked[0].includes("/assets/stools/"));
  for (const item of characters) {
    assert.ok(!locked[0].includes(item.name));
    assert.ok(!locked[0].includes(item.description));
  }
});
