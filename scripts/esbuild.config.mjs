import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(__dirname, "..");
export const outdir = path.join(root, "dist", "assets");

/** @type {import('esbuild').BuildOptions} */
export const esbuildOptions = {
  entryPoints: [path.join(root, "src", "main.tsx")],
  bundle: true,
  outfile: path.join(outdir, "main.js"),
  format: "esm",
  splitting: false,
  sourcemap: true,
  target: ["es2020"],
  jsx: "automatic",
  jsxImportSource: "react",
  loader: {
    ".png": "file",
    ".jpg": "file",
    ".jpeg": "file",
    ".svg": "file",
    ".gif": "file",
    ".webp": "file",
  },
  assetNames: "img/[name]-[hash]",
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
  logLevel: "info",
};
