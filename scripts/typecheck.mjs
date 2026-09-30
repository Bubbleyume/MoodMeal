import { execFileSync } from "node:child_process";
import path from "node:path";
import { root } from "./esbuild.config.mjs";

try {
  execFileSync(
    process.execPath,
    [path.join(root, "node_modules", "typescript", "bin", "tsc"), "--noEmit"],
    { stdio: "inherit", cwd: root }
  );
  console.log("\x1b[32m✓ TypeScript: no errors\x1b[0m");
} catch (e) {
  process.exit(1);
}
