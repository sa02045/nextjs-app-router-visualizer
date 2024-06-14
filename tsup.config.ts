import { defineConfig } from "tsup";

export default defineConfig((options) => {
  return {
    entryPoints: ["main.ts"],
    format: ["cjs", "esm"],
  };
});
