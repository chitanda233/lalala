import {
  cp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const runtimeFiles = [
  "index.html",
  "app.js",
  "bristol.js",
  "styles.css",
  "src/main.js",
];
const runtimeDirectories = [
  "assets",
  "src/config",
  "src/content",
  "src/game",
  "src/progression",
  "src/storage",
  "src/ui",
];

async function allFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const file = path.join(directory, entry.name);
        return entry.isDirectory() ? allFiles(file) : [file];
      }),
    )
  ).flat();
}

async function verifyRuntimeImports(directory) {
  for (const file of await allFiles(directory)) {
    const extension = path.extname(file);
    if (![".js", ".html", ".css"].includes(extension)) continue;
    const source = await readFile(file, "utf8");
    if (
      extension === ".js" &&
      [...source.matchAll(/\bimport\s*\(([^)]*)\)/g)].some(
        (match) => !/^\s*(["'])[^"']+\1\s*$/.test(match[1]),
      )
    )
      throw new Error(
        `发布文件不能包含无法检查的动态模块路径：${path.relative(directory, file)}`,
      );
    if (extension !== ".js") {
      const references =
        extension === ".html"
          ? [...source.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)]
          : [...source.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)];
      for (const [, reference] of references) {
        if (/^(?:[a-z]+:|#|\/\/)/i.test(reference)) continue;
        const pathname = path.posix.normalize(
          decodeURIComponent(
            new URL(reference, "http://localhost/").pathname,
          ).replace(/\\/g, "/"),
        );
        if (/\/(?:admin(?:[\/._-]|$)|scripts\/|api\/admin)/i.test(pathname))
          throw new Error(
            `发布文件不能引用后台资源：${path.relative(directory, file)} → ${reference}`,
          );
      }
      continue;
    }
    const imports = [
      ...source.matchAll(
        /\b(?:import|export)\s+(?:[^;"']*?\s+from\s*)?["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']/g,
      ),
    ];
    for (const match of imports) {
      const specifier = match[1] || match[2];
      const target = specifier.startsWith("/")
        ? path.resolve(directory, `.${specifier}`)
        : path.resolve(path.dirname(file), specifier);
      if (
        (!specifier.startsWith(".") && !specifier.startsWith("/")) ||
        !target.startsWith(directory + path.sep) ||
        /(?:^|\/)admin(?:[\/._-]|$)|\/scripts\//i.test(target) ||
        !(await stat(target).catch(() => null))?.isFile()
      )
        throw new Error(
          `发布文件存在不可用的运行时引用：${path.relative(directory, file)} → ${specifier}`,
        );
    }
  }
}

async function applyBasePath(directory, basePath) {
  if (basePath === "/") return;
  for (const file of await allFiles(directory)) {
    if (![".js", ".html", ".css"].includes(path.extname(file))) continue;
    const source = await readFile(file, "utf8");
    let deployed = source.replace(
      /(["'`])\/(assets\/|src\/|app\.js|bristol\.js|styles\.css)/g,
      (_, quote, resource) => `${quote}${basePath}${resource}`,
    );
    if (path.basename(file) === "index.html")
      deployed = deployed.replaceAll('href="/"', `href="${basePath}"`);
    if (deployed !== source) await writeFile(file, deployed);
  }
}

export async function buildRelease(
  destination = path.join(projectRoot, "dist"),
  { sourceRoot = projectRoot, basePath = "/" } = {},
) {
  if (
    typeof basePath !== "string" ||
    !/^\/(?:[A-Za-z0-9._~-]+\/)*$/.test(basePath) ||
    basePath.split("/").some((part) => part === "." || part === "..")
  )
    throw new Error("发布路径必须以 / 开头和结尾，且不能包含相对路径段。");
  const sourceDirectory = path.resolve(sourceRoot);
  const target = path.resolve(destination);
  if (
    target === sourceDirectory ||
    sourceDirectory.startsWith(target + path.sep) ||
    (target.startsWith(sourceDirectory + path.sep) &&
      target !== path.join(sourceDirectory, "dist"))
  )
    throw new Error("发布目录只能使用项目 dist 或项目外的独立目录。");
  const temporary = path.join(
    path.dirname(target),
    `.lalala-build-${randomUUID()}`,
  );
  await mkdir(temporary, { recursive: true });
  try {
    for (const entry of [...runtimeFiles, ...runtimeDirectories]) {
      await cp(path.join(sourceDirectory, entry), path.join(temporary, entry), {
        recursive: true,
        filter: (source) =>
          !path
            .relative(sourceDirectory, source)
            .split(path.sep)
            .some(
              (part) =>
                part.startsWith(".") ||
                /^(?:admin(?:[._-].*)?|devtools|tools)$/i.test(part),
            ),
      });
    }
    await verifyRuntimeImports(temporary);
    await applyBasePath(temporary, basePath);
    await rm(target, { recursive: true, force: true });
    await rename(temporary, target);
    return target;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const basePath = process.argv.find((argument) => argument.startsWith("--base-path="))?.slice("--base-path=".length) || "/";
  console.log(`发布文件已生成 → ${await buildRelease(undefined, { basePath })}`);
}
