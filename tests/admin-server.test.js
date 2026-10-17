import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { execFile as execFileCallback } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { createGameServer } from "../server.mjs";
import { buildRelease } from "../scripts/build.mjs";
import { foods } from "../src/content/foods.js";
import { foodAttributeValues } from "../src/content/food-attribute-values.js";

const execFile = promisify(execFileCallback);

async function fixture(t, options = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "lalala-admin-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const dataFile = path.join(directory, "food-attribute-values.mjs");
  await writeFile(
    dataFile,
    `export const foodAttributeValues = ${JSON.stringify(foodAttributeValues)};\n`,
  );
  await mkdir(path.join(directory, "admin"));
  await writeFile(path.join(directory, "index.html"), "game");
  await writeFile(
    path.join(directory, "admin/index.html"),
    "local planning tools",
  );
  const server = await createGameServer({
    root: directory,
    dataFile,
    ...options,
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  );
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    directory,
    dataFile,
    origin,
    get: () => fetch(`${origin}/api/admin/foods`),
    put: (body, headers = {}) =>
      fetch(`${origin}/api/admin/foods`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Origin: origin,
          ...headers,
        },
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
  };
}

test("local admin writes all validated food parameters atomically and rejects stale edits", async (t) => {
  const { get, put, dataFile, origin } = await fixture(t);
  assert.equal(await (await fetch(`${origin}/`)).text(), "game");
  assert.equal(
    await (await fetch(`${origin}/admin`)).text(),
    "local planning tools",
  );
  assert.equal(
    await (await fetch(`${origin}/admin/`)).text(),
    "local planning tools",
  );
  const current = await (await get()).json();
  assert.equal(current.version, 1);
  assert.equal(Object.keys(current.foods).length, foods.length);
  const edited = structuredClone(current);
  edited.foods.banana.softness = 7;
  edited.foods.banana.influence = 6;
  edited.foods.banana.unused = "discard me";
  const savedResponse = await put(edited);
  assert.equal(savedResponse.status, 200);
  const saved = await savedResponse.json();
  assert.notEqual(saved.revision, current.revision);
  assert.equal(saved.foods.banana.softness, 7);
  assert.equal(saved.foods.banana.influence, 6);
  assert.equal(saved.foods.banana.unused, undefined);
  assert.deepEqual(await (await get()).json(), saved);
  const module = await import(pathToFileURL(dataFile).href);
  assert.deepEqual(module.foodAttributeValues, saved.foods);
  assert.equal((await put(current)).status, 409);
  assert.deepEqual(await (await get()).json(), saved);
  assert.deepEqual(
    (await readdir(path.dirname(dataFile))).filter((name) =>
      name.endsWith(".tmp"),
    ),
    [],
  );
});

test("admin validates ranges, identifiers, JSON and same-origin writes without touching data", async (t) => {
  const { get, put, dataFile, origin } = await fixture(t);
  const current = await (await get()).json();
  const original = await readFile(dataFile, "utf8");
  for (const value of [0, 8, 2.5, "4", null, Infinity]) {
    const body = structuredClone(current);
    body.foods.banana.softness = value;
    assert.equal((await put(body)).status, 400);
  }
  const badColor = structuredClone(current);
  badColor.foods.banana.pigmentId = "unknown";
  assert.equal((await put(badColor)).status, 400);
  const missing = structuredClone(current);
  delete missing.foods.banana;
  assert.equal((await put(missing)).status, 400);
  const unknown = structuredClone(current);
  unknown.foods["../outside"] = unknown.foods.banana;
  assert.equal((await put(unknown)).status, 400);
  assert.equal((await put("{broken")).status, 400);
  assert.equal(
    (await put(current, { Origin: "https://elsewhere.example" })).status,
    403,
  );
  assert.equal(
    (await put(current, { "Sec-Fetch-Site": "cross-site" })).status,
    403,
  );
  assert.equal(
    (await put(current, { "Content-Type": "text/plain" })).status,
    415,
  );
  assert.equal((await put("x".repeat(256 * 1024 + 1))).status, 413);
  assert.equal(
    (await fetch(`${origin}/api/admin/foods`, { method: "DELETE" })).status,
    405,
  );
  assert.equal((await fetch(`${origin}/api/admin/not-a-file`)).status, 404);
  assert.equal(await readFile(dataFile, "utf8"), original);
});

test("concurrent saves serialize revision checks and external source edits invalidate the old revision", async (t) => {
  const { get, put, dataFile } = await fixture(t);
  const current = await (await get()).json();
  const a = structuredClone(current);
  const b = structuredClone(current);
  a.foods.banana.softness = 2;
  b.foods.banana.softness = 6;
  const results = await Promise.all([put(a), put(b)]);
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  const saved = await (await get()).json();
  assert.ok([2, 6].includes(saved.foods.banana.softness));
  const source = await readFile(dataFile, "utf8");
  await writeFile(dataFile, `${source}\n`);
  assert.equal((await put(saved)).status, 409);
  assert.notEqual((await (await get()).json()).revision, saved.revision);
  await writeFile(
    dataFile,
    "globalThis.foodAttributeInjected = true; export const foodAttributeValues = {};",
  );
  assert.equal((await get()).status, 500);
  assert.equal(globalThis.foodAttributeInjected, undefined);
});

test("release contains only playable runtime files and preview exposes no admin pages or API", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "lalala-release-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const destination = await buildRelease(path.join(directory, "dist"));
  assert.deepEqual((await readdir(destination)).sort(), [
    "app.js",
    "assets",
    "bristol.js",
    "index.html",
    "src",
    "styles.css",
  ]);
  for (const name of [
    "admin",
    "scripts",
    "docs",
    "tests",
    "qa",
    "node_modules",
    "server.mjs",
    "package.json",
  ])
    assert.equal(
      await stat(path.join(destination, name)).catch(() => null),
      null,
    );
  assert.ok(
    (
      await stat(path.join(destination, "src/content/food-attribute-values.js"))
    ).isFile(),
  );
  const { origin, put } = await fixture(t, {
    root: destination,
    adminEnabled: false,
    dataFile: "/file-that-does-not-exist",
  });
  assert.match(await (await fetch(`${origin}/`)).text(), /<!doctype html>/i);
  assert.equal((await fetch(`${origin}/src/main.js`)).status, 200);
  for (const route of [
    "/admin",
    "/admin/",
    "/admin/index.html",
    "/api/admin/foods",
    "/api/admin/other",
  ])
    assert.equal((await fetch(`${origin}${route}`)).status, 404);
  assert.equal((await put({})).status, 404);
});

test("preview rejects encoded, normalized and case variants even when an admin file exists on disk", async (t) => {
  const { origin } = await fixture(t, { adminEnabled: false });
  for (const route of [
    "/admin",
    "/admin/",
    "/admin/index.html",
    "/ADMIN/index.html",
    "/%61dmin/index.html",
    "/%61%64%6d%69%6e/index.html",
    "//admin/index.html",
    "/admin%2findex.html",
    "/admin%5cindex.html",
    "/x%2f..%2fadmin/index.html",
    "/%2e/admin/index.html",
    "/api/admin/foods",
    "/%61pi/%61dmin/foods",
    "/API/ADMIN/foods",
    "//api/admin/foods",
    "/api/admin%2ffoods",
    "/api%5cadmin%5cfoods",
  ]) {
    assert.equal((await fetch(`${origin}${route}`)).status, 404, route);
    assert.equal(
      (await fetch(`${origin}${route}`, { method: "HEAD" })).status,
      404,
      `HEAD ${route}`,
    );
  }
});

async function readFreshGame(directory) {
  const catalogUrl = pathToFileURL(
    path.join(directory, "src/content/catalog.js"),
  ).href;
  const typeUrl = pathToFileURL(
    path.join(directory, "src/game/stool-type.js"),
  ).href;
  const dropsUrl = pathToFileURL(
    path.join(directory, "src/game/drops.js"),
  ).href;
  const script = `
    const { foodById } = await import(${JSON.stringify(catalogUrl)});
    const { resolveBristolType, typeDistribution } = await import(${JSON.stringify(typeUrl)});
    const { rollOutcome } = await import(${JSON.stringify(dropsUrl)});
    const recipe = { foodIds: ["banana"], water: 1500, drinkId: "water", additives: [], toiletId: "standard", force: 50, };
    console.log(JSON.stringify({ attributes: foodById.banana.attributes, type: resolveBristolType(recipe), distribution: typeDistribution(recipe), outcome: rollOutcome(recipe, () => 0) }));
  `;
  const { stdout } = await execFile(process.execPath, [
    "--input-type=module",
    "--eval",
    script,
  ]);
  return JSON.parse(stdout);
}

test("saved admin parameters reach the actual game rules and an isolated release without modifying project data", async (t) => {
  const originalFile = new URL(
    "../src/content/food-attribute-values.js",
    import.meta.url,
  );
  const originalSource = await readFile(originalFile, "utf8");
  const directory = await mkdtemp(path.join(os.tmpdir(), "lalala-authoring-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const isolated = await buildRelease(path.join(directory, "project"));
  await writeFile(path.join(isolated, "package.json"), '{"type":"module"}\n');
  const dataFile = path.join(isolated, "src/content/food-attribute-values.js");
  const before = await readFreshGame(isolated);
  assert.notEqual(before.type, 1);
  const { get, put, origin } = await fixture(t, { root: isolated, dataFile });
  const edited = await (await get()).json();
  Object.assign(edited.foods.banana, {
    softness: 7,
    cohesion: 1,
    elongation: 1,
    pigmentId: "berry",
    colorStrength: 7,
  });
  assert.equal((await put(edited)).status, 200);
  const servedSource = await (
    await fetch(`${origin}/src/content/food-attribute-values.js`)
  ).text();
  assert.equal(servedSource, await readFile(dataFile, "utf8"));
  const after = await readFreshGame(isolated);
  assert.equal(after.type, 1);
  assert.equal(after.attributes.softness, 7);
  assert.equal(after.outcome.colorId, "berry");
  assert.notDeepEqual(after.distribution, before.distribution);
  const released = await buildRelease(path.join(isolated, "dist"), {
    sourceRoot: isolated,
  });
  assert.equal(
    await readFile(
      path.join(released, "src/content/food-attribute-values.js"),
      "utf8",
    ),
    servedSource,
  );
  assert.deepEqual(await readFreshGame(released), after);
  assert.equal(await readFile(originalFile, "utf8"), originalSource);
  assert.equal(
    await stat(path.join(released, "admin")).catch(() => null),
    null,
  );
});

test("release rejects hidden dynamic module paths and references back into the admin tree", async (t) => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "lalala-build-check-"),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));
  const isolated = await buildRelease(path.join(directory, "project"));
  const entryFile = path.join(isolated, "app.js");
  const entrySource = await readFile(entryFile, "utf8");
  await writeFile(entryFile, `${entrySource}\nimport(window.modulePath);\n`);
  await assert.rejects(
    buildRelease(path.join(isolated, "dist"), { sourceRoot: isolated }),
    /动态模块路径/,
  );
  await writeFile(entryFile, `${entrySource}\nimport("./admin/admin.js");\n`);
  await assert.rejects(
    buildRelease(path.join(isolated, "dist"), { sourceRoot: isolated }),
    /不可用的运行时引用/,
  );
  await writeFile(entryFile, entrySource);
  const indexFile = path.join(isolated, "index.html");
  await writeFile(
    indexFile,
    `${await readFile(indexFile, "utf8")}\n<script src="/%61dmin/admin.js"></script>`,
  );
  await assert.rejects(
    buildRelease(path.join(isolated, "dist"), { sourceRoot: isolated }),
    /后台资源/,
  );
});
