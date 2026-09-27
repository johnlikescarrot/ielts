import {build} from 'esbuild';

const shared = {
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'firefox142',
  sourcemap: true,
  legalComments: 'none',
};

await Promise.all([
  build({
    ...shared,
    entryPoints: ['src/extension/background.ts'],
    outfile: 'dist/background.js',
  }),
]);
