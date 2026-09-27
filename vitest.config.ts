import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/ast/**/*.ts',
        'src/background/**/*.ts',
        'src/calculator/**/*.ts',
        'src/contentScript/**/*.ts',
        'src/data/**/*.ts',
        'src/designSystem/**/*.tsx',
        'src/i18n/**/*.ts',
        'src/popup/**/*.tsx',
        'src/srs/**/*.ts',
        'src/storage/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        'dist/**',
        'public/**',
        'tests/**',
        'vite.config.ts',
        'vitest.config.ts',
        'tailwind.config.js',
        'postcss.config.js',
        'eslint.config.js',
        'src/dashboard/main.tsx',
        'src/popup/main.tsx',
        'src/components/**',
        'src/**/types.ts',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 95,
        statements: 100,
      },
    },
  },
});
