import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory()
      ? files(path)
      : /\.[cm]?js$/.test(path)
        ? [path]
        : [];
  });
}
const sources = [
  "app.js",
  "bristol.js",
  "server.mjs",
  "playwright.config.js",
  ...["src", "admin", "tests", "qa", "scripts"].flatMap(files),
];
for (const source of sources) {
  const result = spawnSync(process.execPath, ["--check", source], {
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Syntax checked ${sources.length} JavaScript files.`);
