import { cp, mkdir } from 'node:fs/promises';

import { build } from 'esbuild';

await build({
  entryPoints: ['src/background/main.ts'],
  bundle: true,
  outfile: 'dist/background.js',
  format: 'iife',
  platform: 'browser',
  target: ['firefox128'],
  legalComments: 'none',
  sourcemap: false,
  minify: true,
});

await mkdir('dist/_locales', { recursive: true });
await cp('_locales', 'dist/_locales', { recursive: true, force: true });
