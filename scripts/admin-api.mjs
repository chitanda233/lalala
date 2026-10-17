import { createHash, randomUUID } from "node:crypto";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { foods } from "../src/content/foods.js";
import { validateFoodAttributes } from "../src/content/food-attributes.js";

const knownFoodIds = foods.map((food) => food.id).sort();
const maxBodyBytes = 256 * 1024;

class AdminError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function validateValues(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AdminError(400, "食物数据必须是一个对象。");
  const ids = Object.keys(value).sort();
  if (
    ids.length !== knownFoodIds.length ||
    ids.some((id, index) => id !== knownFoodIds[index])
  )
    throw new AdminError(400, "请完整保留项目中的全部食物，不能添加未知 ID。");
  return Object.fromEntries(
    knownFoodIds.map((id) => {
      try {
        return [id, validateFoodAttributes(value[id])];
      } catch (error) {
        throw new AdminError(400, `${id}：${error.message}`);
      }
    }),
  );
}

function revision(source) {
  return createHash("sha256").update(source).digest("hex");
}

function parseValues(source) {
  const match = source.match(
    /^\s*export\s+const\s+foodAttributeValues\s*=\s*([\s\S]*?);?\s*$/,
  );
  if (!match) throw new Error("食物参数文件格式不正确，请恢复 JSON 数据模块。");
  // The writable module is deliberately restricted to one JSON literal.
  // Never evaluate source supplied through the development API.
  return validateValues(JSON.parse(match[1]));
}

function isSameLocalOrigin(request) {
  try {
    const host = new URL(`http://${request.headers.host}`);
    const origin = new URL(request.headers.origin);
    const allowedHosts = ["localhost", "127.0.0.1", "[::1]"];
    return (
      allowedHosts.includes(host.hostname) &&
      Number(host.port || 80) === request.socket.localPort &&
      origin.origin === host.origin &&
      (!request.headers["sec-fetch-site"] ||
        request.headers["sec-fetch-site"] === "same-origin")
    );
  } catch {
    return false;
  }
}

async function readBody(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maxBodyBytes)
      throw new AdminError(413, "参数文件过大，最多允许 256 KB。");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AdminError(400, "请求内容必须是有效的 JSON。");
  }
}

function json(response, status, value, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  response.end(JSON.stringify(value));
}

export function createAdminApi(dataFile) {
  let queue = Promise.resolve();
  const readCurrent = async () => {
    const source = await readFile(dataFile, "utf8");
    return {
      version: 1,
      revision: revision(source),
      foods: parseValues(source),
    };
  };

  return async (request, response) => {
    try {
      if (request.method === "GET") {
        await queue;
        json(response, 200, await readCurrent());
        return;
      }
      if (request.method !== "PUT") {
        json(
          response,
          405,
          { error: "只支持读取和保存食物参数。" },
          {
            Allow: "GET, PUT",
          },
        );
        return;
      }
      if (!isSameLocalOrigin(request))
        throw new AdminError(403, "请从本机管理页面保存参数。");
      if (
        !/^application\/json(?:\s*;|$)/i.test(
          request.headers["content-type"] || "",
        )
      )
        throw new AdminError(415, "保存参数需要 application/json。");
      if (Number(request.headers["content-length"]) > maxBodyBytes)
        throw new AdminError(413, "参数文件过大，最多允许 256 KB。");
      const body = await readBody(request);
      if (
        !body ||
        body.version !== 1 ||
        typeof body.revision !== "string" ||
        !/^[a-f0-9]{64}$/.test(body.revision)
      )
        throw new AdminError(400, "参数版本不正确，请重新载入后保存。");
      const values = validateValues(body.foods);
      const save = queue.then(async () => {
        const current = await readCurrent();
        if (current.revision !== body.revision)
          throw new AdminError(
            409,
            "参数已被其他窗口或开发者修改，请重新载入后再编辑。",
          );
        const source = `export const foodAttributeValues = ${JSON.stringify(values, null, 2)};\n`;
        const temporary = path.join(
          path.dirname(dataFile),
          `.${path.basename(dataFile)}.${randomUUID()}.tmp`,
        );
        try {
          await writeFile(temporary, source, { flag: "wx" });
          await rename(temporary, dataFile);
        } finally {
          await unlink(temporary).catch(() => {});
        }
        return { version: 1, revision: revision(source), foods: values };
      });
      // A rejected save must not poison the queue for later valid edits.
      queue = save.catch(() => {});
      json(response, 200, await save);
    } catch (error) {
      json(response, error.status || 500, {
        error: error.status
          ? error.message
          : "读取或保存失败，请检查本地参数文件。",
      });
    }
  };
}
