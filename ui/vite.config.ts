import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The engine (../engine) and card data (../data) live outside /ui, so allow
// the dev server to read the repo root. Relative base so the build works when
// served from any path (incl. Capacitor's file://).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: true, fs: { allow: ['..'] } },
});
