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
        'src/types/**',
      ],
      thresholds: {
        // Ratchet for the legacy suite; new market-facing modules use a dedicated 100% gate.
        lines: 90,
        functions: 85,
        branches: 80,
        statements: 90,
      },
    },
  },
});
