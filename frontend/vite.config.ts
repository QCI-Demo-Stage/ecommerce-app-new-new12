import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/products': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: true,
  },
});
