import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { root } from "./esbuild.config.mjs";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "moodmeal-test-"));
const outfile = path.join(dir, "knowledge.cjs");
await build({
  entryPoints: ["tests/knowledge.test.ts"],
  absWorkingDir: root,
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile,
});
const run = spawnSync(process.execPath, [outfile], {
  cwd: root,
  stdio: "inherit",
});
fs.unlinkSync(outfile);
fs.rmdirSync(dir);
if (run.error) console.error(run.error);
process.exit(run.status ?? 1);
