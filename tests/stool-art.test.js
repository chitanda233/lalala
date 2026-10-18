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
const waterAtlasIds = new Set([
  "enoki-jet", "corn-cannon", "golden-juice",
  "rainbow-falls", "glitter-galaxy", "ink-fountain",
]);
test("all 56 collectible species have dedicated artwork (50 PNG, six atlas crops)", () => {
  const atlas = new URL("../assets/stools/water-type-seven-atlas.webp", import.meta.url);
  assert.ok(existsSync(atlas), "water type-7 atlas is missing");
  assert.equal(readFileSync(atlas).subarray(0, 4).toString("ascii"), "RIFF");
  let forms = 0;
  for (const item of characters)
    for (const type of item.types) {
      if (waterAtlasIds.has(item.id)) {
        assert.match(characterSvg(item, false, type), /water-type-seven-atlas\.webp/);
        forms++;
        continue;
      }
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
  assert.equal(forms, 56);
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

test("all collectible geometry fits the shader primitive budget and has finite positive dimensions", async () => {
  const { geometry } = await import("../scripts/stool-art/geometry.js");
  for (const [variant, item] of characters.entries()) {
    const shape = geometry(item.art, item.homeType, variant);
    assert.equal(shape.a.length, shape.b.length, item.id);
    assert.ok(shape.a.length / 4 <= 128, `${item.id} exceeds GPU primitive budget`);
    assert.ok([...shape.a, ...shape.b].every(Number.isFinite), item.id);
    assert.ok(shape.vertical > 0 && shape.blend > 0, item.id);
    for (let i = 0; i < shape.a.length; i += 4) {
      if (shape.a[i + 3] === 0)
        assert.ok(shape.b.slice(i, i + 3).every(value => value > 0), `${item.id} has invalid ellipse radii`);
      else
        assert.ok(shape.a[i + 3] > 0 && shape.b[i + 3] > 0, `${item.id} has invalid tube radii`);
    }
  }
});
