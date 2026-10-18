import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.LALALA_PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".json": "application/json; charset=utf-8",
};
export async function createGameServer({
  root = projectRoot,
  adminEnabled = true,
  dataFile = process.env.LALALA_ADMIN_DATA_FILE ||
    path.join(projectRoot, "src/content/food-attribute-values.js"),
} = {}) {
  // Preview loads no development API modules or writable source data.
  const adminApi = adminEnabled
    ? (await import("./scripts/admin-api.mjs")).createAdminApi(dataFile)
    : null;
  return http.createServer(async (request, response) => {
    try {
      if (!request.url?.startsWith("/")) {
        response.writeHead(400).end("Bad request target");
        return;
      }
      // A leading // is still a request path, never a different URL authority.
      const url = new URL(`http://localhost${request.url}`);
      // Check routes after decoding and normalization, including case variants
      // on case-insensitive filesystems. Preview never serves the admin tree.
      const pathname = path.posix.normalize(
        decodeURIComponent(url.pathname).replace(/\\/g, "/"),
      );
      if (!adminEnabled && /^\/(?:admin|api\/admin)(?:\/|$)/i.test(pathname)) {
        response.writeHead(404).end("Not found");
        return;
      }
      if (pathname.startsWith("/api/admin")) {
        if (adminApi && pathname === "/api/admin/foods")
          await adminApi(request, response);
        else response.writeHead(404).end("Not found");
        return;
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        response
          .writeHead(405, { Allow: "GET, HEAD" })
          .end("Method not allowed");
        return;
      }
      let relative = pathname.replace(/^\/+/, "") || "index.html";
      if (relative === "admin" || relative === "admin/")
        relative = "admin/index.html";
      const file = path.resolve(root, relative);
      if (
        !file.startsWith(root + path.sep) ||
        relative.split(/[\\/]/).some((part) => part.startsWith(".")) ||
        ![".html", ".css", ".js", ".svg", ".png", ".webp"].includes(path.extname(file))
      ) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      if (!(await stat(file)).isFile()) throw new Error("Not a file");
      response.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      response.end(
        request.method === "HEAD" ? undefined : await readFile(file),
      );
    } catch {
      response
        .writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
        .end("页面不见了，回首页看看吧。");
    }
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const preview = process.argv.includes("--preview");
  const server = await createGameServer({
    root: preview ? path.join(projectRoot, "dist") : projectRoot,
    adminEnabled: !preview,
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `lalala ${preview ? "发布预览" : "开发服务"} → http://127.0.0.1:${port}`,
    ),
  );
  server.on("error", (error) => {
    console.error(
      error.code === "EADDRINUSE"
        ? `端口 ${port} 已被占用，请打开 http://127.0.0.1:${port} 或通过 LALALA_PORT 更换端口。`
        : error,
    );
    process.exitCode = 1;
  });
}
