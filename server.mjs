import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.LALALA_PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
};
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const relative =
      decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    const file = path.resolve(root, relative);
    if (
      !file.startsWith(root + path.sep) ||
      relative.split(/[\\/]/).some((part) => part.startsWith(".")) ||
      ![".html", ".css", ".js", ".svg", ".png"].includes(path.extname(file))
    ) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    if (!(await stat(file)).isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    response.end(await readFile(file));
  } catch {
    response
      .writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
      .end("页面不见了，回首页看看吧。");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`lalala 已启动 → http://127.0.0.1:${port}`),
);
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `端口 ${port} 已被占用，请打开 http://127.0.0.1:${port} 或通过 LALALA_PORT 更换端口。`
      : error,
  );
  process.exitCode = 1;
});
