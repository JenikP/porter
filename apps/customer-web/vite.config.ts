import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { aliases } from '../../scripts/vite-aliases';

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: { '/api': { target: process.env.PORTER_API_TARGET || 'http://127.0.0.1:3001', changeOrigin: true } } },
  resolve: { alias: aliases },
});

