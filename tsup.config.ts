import { defineConfig } from "tsup";

export default defineConfig((options) => {
  return {
    entryPoints: ["src/index.ts"],
    outDir: "./",
    format: ["esm"],
  };
});
