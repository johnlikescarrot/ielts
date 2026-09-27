import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

await build({
  entryPoints: ["src/background.ts"],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "firefox142",
  outfile: "dist/background.js",
  minify: true,
});
await rm("web-ext-artifacts", { recursive: true, force: true });
await mkdir("web-ext-artifacts", { recursive: true });
await cp("dist", "web-ext-artifacts/ielts-compass", { recursive: true });
console.log("Extension staged in web-ext-artifacts/ielts-compass");
