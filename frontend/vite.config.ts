import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5008,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});