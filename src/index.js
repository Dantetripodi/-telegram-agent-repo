import http from "http";
import fs from "fs/promises";
import path from "path";
import { URL } from "url";
import { fileURLToPath } from "url";
import { ingestBatch, ingestMessage } from "./agent.js";
import { filterItems, getItems, getStats, searchItems, updateItemMetadata, updateItemStatus } from "./storage.js";
import { startTelegramBot } from "./telegram.js";

const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "..", "public");

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/") {
      return sendFile(res, path.join(PUBLIC_DIR, "index.html"), "text/html; charset=utf-8");
    }

    if (req.method === "GET" && url.pathname === "/app.js") {
      return sendFile(res, path.join(PUBLIC_DIR, "app.js"), "application/javascript; charset=utf-8");
    }

    if (req.method === "GET" && url.pathname === "/styles.css") {
      return sendFile(res, path.join(PUBLIC_DIR, "styles.css"), "text/css; charset=utf-8");
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, { ok: true, service: "whatsapp-inbox-agent" });
    }

    if (req.method === "GET" && url.pathname === "/items") {
      const items = await filterItems({
        project: url.searchParams.get("project"),
        status: url.searchParams.get("status"),
        dateFrom: url.searchParams.get("dateFrom"),
        dateTo: url.searchParams.get("dateTo")
      });
      return sendJson(res, 200, items);
    }

    if (req.method === "GET" && url.pathname === "/stats") {
      const stats = await getStats();
      return sendJson(res, 200, stats);
    }

    if (req.method === "GET" && url.pathname === "/search") {
      const results = await searchItems({
        q: url.searchParams.get("q"),
        category: url.searchParams.get("category"),
        tag: url.searchParams.get("tag"),
        resourceType: url.searchParams.get("resourceType"),
        hasLink: url.searchParams.get("hasLink"),
        project: url.searchParams.get("project"),
        status: url.searchParams.get("status"),
        dateFrom: url.searchParams.get("dateFrom"),
        dateTo: url.searchParams.get("dateTo")
      });
      return sendJson(res, 200, results);
    }

    if (req.method === "POST" && url.pathname === "/ingest/batch") {
      const body = await readJson(req);
      const result = await ingestBatch(body);
      return sendJson(res, 201, result);
    }

    if (req.method === "POST" && url.pathname === "/ingest") {
      const body = await readJson(req);
      const result = await ingestMessage(body);
      return sendJson(res, 201, result);
    }

    if (req.method === "PATCH" && url.pathname.startsWith("/items/")) {
      const id = url.pathname.split("/")[2];
      const body = await readJson(req);
      const updated = body.status
        ? await updateItemStatus(id, body.status)
        : await updateItemMetadata(id, {
            project: body.project,
            tags: body.tags
          });
      if (!updated) {
        return sendJson(res, 404, { error: "Item no encontrado" });
      }
      return sendJson(res, 200, updated);
    }

    return sendJson(res, 404, { error: "Ruta no encontrada" });
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`WhatsApp Inbox Agent escuchando en http://localhost:${PORT}`);
});

if (process.env.ENABLE_TELEGRAM === "true") {
  startTelegramBot().catch((error) => {
    console.error("No se pudo iniciar Telegram:", error.message);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

async function sendFile(res, filePath, contentType) {
  try {
    const contents = await fs.readFile(filePath, "utf8");
    res.writeHead(200, { "Content-Type": contentType });
    res.end(contents);
  } catch {
    sendJson(res, 404, { error: "Archivo no encontrado" });
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("JSON invalido"));
      }
    });

    req.on("error", reject);
  });
}
