import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage } from 'node:http';

const apiTarget = process.env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:3000';

/**
 * Proxy API calls to the backend, but serve the SPA for browser document
 * navigations (Accept: text/html) so routes like /products are not hijacked.
 */
function apiProxy(): ProxyOptions {
  return {
    target: apiTarget,
    changeOrigin: true,
    bypass(req: IncomingMessage) {
      const accept = req.headers.accept ?? '';
      if (accept.includes('text/html')) {
        return '/index.html';
      }
      return undefined;
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/products': apiProxy(),
      '/auth': apiProxy(),
      '/api': apiProxy(),
      '/health': apiProxy(),
    },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: true,
  },
});
