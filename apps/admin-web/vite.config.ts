import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { aliases } from '../../scripts/vite-aliases';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: aliases },
});
