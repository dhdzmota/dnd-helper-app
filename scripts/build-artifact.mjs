/**
 * Convierte la build de un solo archivo (dist-single/index.html) en un
 * fragmento listo para publicar: sin doctype, html, head ni body, porque
 * el visor los aporta. Ejecutar tras `npm run build:single`.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const src = readFileSync('dist-single/ficha-dnd.html', 'utf8')

const pick = (re, label) => {
  const m = src.match(re)
  if (!m) throw new Error(`No se encontró ${label} en dist-single/ficha-dnd.html`)
  return m[0]
}

// El <link> de las tipografías, no el preconnect que lo precede.
const fonts = pick(/<link\b(?=[^>]*rel=["']stylesheet["'])(?=[^>]*fonts\.googleapis\.com)[^>]*>/s, 'la hoja de tipografías')
const styles = [...src.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0])
const scripts = [...src.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0])
if (!styles.length) throw new Error('No se encontró ningún <style> en línea')
if (!scripts.length) throw new Error('No se encontró ningún <script> en línea')

// vite-plugin-singlefile deja rel/crossorigin sobrantes al convertir link → style.
const clean = (tag) => tag.replace(/\s+(rel|crossorigin|as)=(["'][^"']*["'])?/g, '')

const html = [
  '<title>Âreen Velthar</title>',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  fonts,
  ...styles.map(clean),
  '<div id="root"></div>',
  ...scripts.map((s) => s.replace(/\s+crossorigin/g, '')),
].join('\n')

for (const tag of ['!doctype', 'html', 'head', 'body']) {
  if (new RegExp(`<${tag}\\b`, 'i').test(html)) throw new Error(`El fragmento no debe contener <${tag}>`)
}

mkdirSync('artifact', { recursive: true })
writeFileSync('artifact/areen-velthar.html', html)
console.log(`artifact/areen-velthar.html — ${Math.round(html.length / 1024)} KB, ${styles.length} estilo(s), ${scripts.length} script(s)`)
console.log(`tipografías: ${fonts.slice(0, 90)}…`)
