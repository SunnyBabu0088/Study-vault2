import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5500,
    strictPort: true,
    proxy: {
      '/api': { target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000', changeOrigin: true },
      '/uploads': { target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000', changeOrigin: true },
      '/socket.io': { target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:5000', ws: true },
    },
  },
});
