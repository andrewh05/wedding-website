const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const { handler: dbHandler } = require("./netlify/functions/db");

const port = Number(process.env.PORT || 3000);
const publicDir = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg"
};

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
  });
  res.end(JSON.stringify(body));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy(new Error("Request body is too large."));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function handleDatabaseRequest(req, res, url) {
  try {
    const body = await readRequestBody(req);
    const result = await dbHandler({
      httpMethod: req.method,
      body,
      queryStringParameters: Object.fromEntries(url.searchParams.entries())
    });

    res.writeHead(result.statusCode || 200, result.headers || {});
    res.end(result.body || "");
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Database request failed." });
  }
}

function resolveStaticPath(urlPathname) {
  const cleanPath = decodeURIComponent(urlPathname.split("/").filter(Boolean).join("/"));
  const requestedPath = cleanPath || "index.html";
  const filePath = path.normalize(path.join(publicDir, requestedPath));

  if (!filePath.startsWith(publicDir)) return null;
  return filePath;
}

function serveStaticFile(req, res, url) {
  const filePath = resolveStaticPath(url.pathname);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/db" || url.pathname === "/.netlify/functions/db") {
    handleDatabaseRequest(req, res, url);
    return;
  }

  serveStaticFile(req, res, url);
});

server.listen(port, () => {
  console.log(`Wedding website running at http://localhost:${port}`);
});
