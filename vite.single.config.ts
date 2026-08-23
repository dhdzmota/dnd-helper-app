import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/** La versión sale de android/version.json, que es la única fuente de verdad. */
const version = JSON.parse(readFileSync('android/version.json', 'utf8')).versionName as string

// Empaqueta toda la app en un único HTML autónomo (dist-single/), para poder
// pasarlo al teléfono como archivo y abrirlo sin servidor.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  // En la versión de un solo archivo no hay sw.js que registrar.
  define: {
    __SINGLE_FILE__: 'true',
    __APP_VERSION__: JSON.stringify(version),
  },
  build: { outDir: 'dist-single', target: 'chrome90', assetsInlineLimit: 100_000_000, cssCodeSplit: false },
})
