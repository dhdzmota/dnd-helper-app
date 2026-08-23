/**
 * Prepara dist-single/index.html para vivir como archivo suelto en un teléfono:
 * quita las referencias a archivos que no van a estar al lado (manifiesto, íconos)
 * e incrusta el ícono para que la pestaña no salga en blanco.
 * Se ejecuta después de `vite build --config vite.single.config.ts`.
 */
import { readFileSync, writeFileSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'dist-single'
const src = join(DIR, 'index.html')
let html = readFileSync(src, 'utf8')

const icono = `data:image/png;base64,${readFileSync('public/icon-192.png').toString('base64')}`

// Estas apuntan a archivos hermanos que no existen cuando el HTML viaja solo.
const antes = html.length
html = html
  .replace(/\s*<link rel="manifest"[^>]*>/g, '')
  .replace(/\s*<link rel="apple-touch-startup-image"[^>]*>/g, '')
  .replace(/\s*<!-- Pantallas de arranque de iOS[^>]*-->/g, '')
  .replace(/\s*<link rel="apple-touch-icon"[^>]*>/g, `\n    <link rel="apple-touch-icon" href="${icono}" />`)
  .replace(/\s*<link rel="icon"[^>]*>/g, `\n    <link rel="icon" type="image/png" href="${icono}" />`)

if (/href="\.\/(manifest|icon-|apple-touch|splash-)/.test(html)) {
  throw new Error('Siguen quedando referencias a archivos externos')
}

const destino = join(DIR, 'ficha-dnd.html')
writeFileSync(src, html)
renameSync(src, destino)
console.log(`${destino} — ${(html.length / 1024 / 1024).toFixed(2)} MB (antes ${(antes / 1024 / 1024).toFixed(2)} MB)`)
