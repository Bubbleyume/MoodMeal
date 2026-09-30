// Production build: bundles the app with esbuild, compiles Tailwind CSS,
// copies public assets, and writes the final dist/index.html.
// This plays the role Vite's `vite build` would play, using tooling that is
// actually available in this environment (see README.md).
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { root, outdir, esbuildOptions } from "./esbuild.config.mjs";

const distDir = path.join(root, "dist");

function log(msg) {
  console.log(`\x1b[35m[build]\x1b[0m ${msg}`);
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(outdir, { recursive: true });

log("Bundling TypeScript/React with esbuild...");
await build({
  ...esbuildOptions,
  minify: true,
  sourcemap: false,
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
});

log("Compiling Tailwind CSS...");
execFileSync(
  process.execPath,
  [
    path.join(root, "node_modules", "tailwindcss", "lib", "cli.js"),
    "-i",
    path.join(root, "src", "styles", "index.css"),
    "-o",
    path.join(outdir, "styles.css"),
    "--minify",
  ],
  { stdio: "inherit", cwd: root }
);

log("Copying public assets...");
const publicDir = path.join(root, "public");
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, distDir, { recursive: true });
}

log("Writing index.html...");
let html = fs.readFileSync(path.join(root, "index.html"), "utf-8");
html = html.replace('src="/src/main.tsx"', 'src="/assets/main.js"');
html = html.replace(
  "</head>",
  '  <link rel="stylesheet" href="/assets/styles.css" />\n</head>'
);
fs.writeFileSync(path.join(distDir, "index.html"), html);

log("Build complete -> dist/");
