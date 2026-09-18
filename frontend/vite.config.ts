import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Dengar di semua antarmuka, bukan cuma localhost: HP & iPad di WiFi yang
    // sama buka http://<ip-laptop>:5173 (Vite mencetak URL Network-nya saat start).
    host: true,
    // Backend dilayani lewat origin yang sama supaya tidak perlu CORS.
    // Lihat `VITE_API_BASE_URL=/api` di `.env`.
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (jalur) => jalur.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
