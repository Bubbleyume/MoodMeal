// Simple static server for previewing a production build (`npm run build`
// then `npm run preview`), with SPA fallback so client-side routes work.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { root } from "./esbuild.config.mjs";

const PORT = Number(process.env.PORT || 4173);
const distDir = path.join(root, "dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = path.join(distDir, decodeURIComponent(url.pathname));
  if (url.pathname === "/" || !path.extname(url.pathname)) {
    filePath = path.join(distDir, "index.html");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(distDir, "index.html"), (err2, indexData) => {
        if (err2) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": MIME[".html"] });
        res.end(indexData);
      });
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Preview running at http://localhost:${PORT}`);
});
