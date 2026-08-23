import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** La versión sale de android/version.json, que es la única fuente de verdad. */
const version = JSON.parse(readFileSync('android/version.json', 'utf8')).versionName as string

export default defineConfig({
  plugins: [react()],
  base: './',
  // El WebView de Android puede ir por detrás de Chrome de escritorio.
  // chrome90 cubre cualquier WebView actualizado desde 2021 en adelante.
  build: { target: 'chrome90' },
  define: {
    __SINGLE_FILE__: 'false',
    __APP_VERSION__: JSON.stringify(version),
  },
})
