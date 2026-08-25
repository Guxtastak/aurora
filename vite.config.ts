import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
// BASE_PATH é definido no deploy do GitHub Pages (ex.: /aurora/), porque o site
// fica em um subdiretório. Em desenvolvimento continua na raiz.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  // "@" aponta para src/. Assim um import diz de onde a coisa vem sem
  // depender de quantas pastas acima o arquivo esta: @/compartilhado/... e
  // @/modulo/..., nunca ../../../.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
})
