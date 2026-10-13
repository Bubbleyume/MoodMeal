import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { root } from "./esbuild.config.mjs";
const result = await build({ entryPoints: ["tests/modularAvatars.test.ts"], absWorkingDir: root, bundle: true, platform: "node", format: "cjs", write: false });
const run = spawnSync(process.execPath, ["-e", result.outputFiles[0].text], { cwd: root, stdio: "inherit" });
process.exit(run.status ?? 1);
