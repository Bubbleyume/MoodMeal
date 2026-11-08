// Runs the standalone unit test files, each in its own Node process, and
// reports each result separately. Same esbuild setup as test-knowledge.mjs:
// each file is bundled to a temporary .cjs file (too large for `node -e` on Windows).
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { root } from "./esbuild.config.mjs";

const FILES = ["tests/wellness.test.ts", "tests/recordId.test.ts"];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "moodmeal-unit-"));
const results = [];
try {
  for (const file of FILES) {
    console.log(`\n${file}`);
    const outfile = path.join(dir, path.basename(file, ".ts") + ".cjs");
    let status;
    try {
      await build({ entryPoints: [file], absWorkingDir: root, bundle: true, platform: "node", format: "cjs", outfile, logLevel: "error" });
      const run = spawnSync(process.execPath, [outfile], { cwd: root, stdio: "inherit" });
      if (run.error) console.error(run.error);
      status = run.status ?? 1;
    } catch (error) {
      console.error(error);
      status = 1;
    }
    results.push({ file, status });
  }
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log("");
for (const { file, status } of results) console.log(`${status === 0 ? "PASS" : "FAIL"}  ${file}${status === 0 ? "" : ` (exit ${status})`}`);
process.exit(results.every(r => r.status === 0) ? 0 : 1);
