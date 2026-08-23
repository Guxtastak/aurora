import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// BASE_PATH é definido no deploy do GitHub Pages (ex.: /aurora/), porque o site
// fica em um subdiretório. Em desenvolvimento continua na raiz.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
