// Writes research-output/catalog.json, coverage.json and COVERAGE.md from the
// live recipe catalog. Read-only for app data; the bundle lives in a temp dir.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { root } from "./esbuild.config.mjs";

const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const provenance = {
  sourceCommit: git("rev-parse", "HEAD"),
  dirtyTree: git("status", "--porcelain").length > 0,
};

const outDir = path.join(root, "research-output");
// research-output/ must be git-ignored before anything is written there.
try {
  execFileSync("git", ["check-ignore", "-q", "research-output/catalog.json"], { cwd: root });
} catch {
  console.error("research-output/ is not git-ignored; refusing to write.");
  process.exit(1);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "moodmeal-catalog-"));
try {
  await build({
    entryPoints: ["tools/research/catalog-export.ts", "tools/research/knowledge-export.ts"],
    absWorkingDir: root,
    bundle: true,
    platform: "node",
    format: "cjs",
    outdir: dir,
    outExtension: { ".js": ".cjs" },
    loader: { ".png": "file", ".jpg": "file", ".jpeg": "file", ".svg": "file", ".gif": "file", ".webp": "file" },
    logLevel: "error",
  });
  const load = createRequire(import.meta.url);
  const { buildCatalog } = load(path.join(dir, "catalog-export.cjs"));
  const { buildKnowledge } = load(path.join(dir, "knowledge-export.cjs"));
  const { catalog, coverage, md } = buildCatalog(provenance);
  const knowledge = buildKnowledge(provenance);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
  fs.writeFileSync(path.join(outDir, "coverage.json"), JSON.stringify(coverage, null, 2) + "\n");
  fs.writeFileSync(path.join(outDir, "COVERAGE.md"), md);
  fs.writeFileSync(path.join(outDir, "knowledge.json"), JSON.stringify(knowledge, null, 2) + "\n");
  console.log(`Exported ${catalog.recipeCount} recipes; ${coverage.publishedEstimates.length} published estimates; ${knowledge.claimCount} knowledge claims.`);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
