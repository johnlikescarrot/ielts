import {resolve} from 'node:path';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        dashboard: resolve(import.meta.dirname, 'index.html'),
        popup: resolve(import.meta.dirname, 'popup.html'),
        sidebar: resolve(import.meta.dirname, 'sidebar.html'),
      },
    },
  },
});
