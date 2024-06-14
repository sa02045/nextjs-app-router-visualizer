import { defineConfig } from "tsup";

export default defineConfig((options) => {
  return {
    entryPoints: ["index.ts"],
    format: ["esm"],
  };
});
