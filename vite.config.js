import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  // Base path for deployed site. Use the repo name for GitHub Pages
  // If you prefer relative paths (works on GH Pages and local file preview), use "./"
  base: '/Project-lead-ui/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Redirige /api/* al backend Express en desarrollo
      '/api': {
        target:      'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
