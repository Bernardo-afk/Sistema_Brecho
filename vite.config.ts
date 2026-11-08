import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// base './' faz o build funcionar em qualquer subcaminho (ex.: GitHub Pages
// em https://<usuario>.github.io/Sistema_Brecho/) sem configuração extra.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    chunkSizeWarningLimit: 1600,
  },
});
