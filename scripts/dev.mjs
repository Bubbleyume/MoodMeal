// Local dev server: esbuild in watch mode + Tailwind CLI in watch mode +
// a small static file server with SPA fallback and a lightweight
// auto-reload channel (Server-Sent Events) so the browser refreshes
// automatically after a rebuild, similar to Vite's dev server.
import { context } from "esbuild";
import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { root, outdir, esbuildOptions } from "./esbuild.config.mjs";

const PORT = Number(process.env.PORT || 5173);
const distDir = path.join(root, "dist");
const sseClients = new Set();

function log(tag, msg) {
  console.log(`\x1b[36m[${tag}]\x1b[0m ${msg}`);
}

function notifyReload() {
  for (const res of sseClients) {
    res.write("data: reload\n\n");
  }
}

fs.mkdirSync(outdir, { recursive: true });

// --- esbuild watch ---
const ctx = await context({
  ...esbuildOptions,
  minify: false,
  plugins: [
    {
      name: "reload-notifier",
      setup(build) {
        let first = true;
        build.onEnd((result) => {
          if (result.errors.length === 0) {
            if (!first) notifyReload();
            first = false;
            log("esbuild", "rebuilt main.js");
          } else {
            log("esbuild", `build failed with ${result.errors.length} error(s)`);
          }
        });
      },
    },
  ],
});
await ctx.watch();

// --- tailwind watch ---
const tailwindProc = spawn(
  process.execPath,
  [
    path.join(root, "node_modules", "tailwindcss", "lib", "cli.js"),
    "-i",
    path.join(root, "src", "styles", "index.css"),
    "-o",
    path.join(outdir, "styles.css"),
    "--watch",
  ],
  { cwd: root, stdio: "pipe" }
);
let tailwindReady = false;
tailwindProc.stdout.on("data", (d) => {
  const s = d.toString();
  if (/Done in/.test(s)) {
    if (tailwindReady) notifyReload();
    tailwindReady = true;
    log("tailwind", "rebuilt styles.css");
  }
});
tailwindProc.stderr.on("data", (d) => process.stderr.write(d));

// --- copy public/ once, then watch for changes ---
const publicDir = path.join(root, "public");
function copyPublic() {
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, distDir, { recursive: true, force: true });
  }
}
copyPublic();
if (fs.existsSync(publicDir)) {
  fs.watch(publicDir, { recursive: true }, () => {
    copyPublic();
    notifyReload();
  });
}

// --- static server ---
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function injectReloadScript(html) {
  const snippet = `\n<script>
    (function() {
      var es = new EventSource('/__reload');
      es.onmessage = function() { location.reload(); };
    })();
  </script>\n</body>`;
  return html.replace("</body>", snippet);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/__reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("\n");
    sseClients.add(res);
    req.on("close", () => sseClients.delete(res));
    return;
  }

  let filePath = path.join(distDir, decodeURIComponent(url.pathname));
  if (url.pathname === "/" || !path.extname(url.pathname)) {
    filePath = path.join(distDir, "index.html");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback for client-side routes
      fs.readFile(path.join(distDir, "index.html"), (err2, indexData) => {
        if (err2) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": MIME[".html"] });
        res.end(injectReloadScript(indexData.toString("utf-8")));
      });
      return;
    }
    const ext = path.extname(filePath);
    const contentType = MIME[ext] || "application/octet-stream";
    if (ext === ".html") {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(injectReloadScript(data.toString("utf-8")));
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
});

// write initial index.html into dist
function writeIndexHtml() {
  let html = fs.readFileSync(path.join(root, "index.html"), "utf-8");
  html = html.replace('src="/src/main.tsx"', 'src="/assets/main.js"');
  html = html.replace(
    "</head>",
    '  <link rel="stylesheet" href="/assets/styles.css" />\n</head>'
  );
  fs.writeFileSync(path.join(distDir, "index.html"), html);
}
writeIndexHtml();
fs.watch(path.join(root, "index.html"), () => {
  writeIndexHtml();
  notifyReload();
});

server.listen(PORT, () => {
  log("dev", `MoodMeal running at http://localhost:${PORT}`);
});
