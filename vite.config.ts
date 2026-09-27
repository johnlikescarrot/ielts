import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: { allowedHosts: true },
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "background"
            ? "background.js"
            : "assets/[name]-[hash].js",
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      all: true,
      include: ["src/core/**/*.ts"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
