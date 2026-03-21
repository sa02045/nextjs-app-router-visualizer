import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin.ts'],
  outDir: 'dist',
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
});
