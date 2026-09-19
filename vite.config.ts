import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    open: false,
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    cors: true,
  },
});
