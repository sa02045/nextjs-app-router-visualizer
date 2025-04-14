import { defineConfig } from 'tsup';

export default defineConfig(options => {
  return {
    entryPoints: ['src/index.ts', 'src/bin.ts'],
    outDir: 'dist',
    format: ['esm'],
  };
});
