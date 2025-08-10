import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  target: 'node18',
  minify: false,
  treeshake: true,
  external: ['node:fs', 'node:fs/promises', 'node:readline', 'node:os', 'node:path', 'node:crypto'],
});
