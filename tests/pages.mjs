import { chromium } from 'playwright-core'
import { PESTANAS } from './serve.mjs'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

/**
 * GitHub Pages sirve un proyecto en https://usuario.github.io/repo/, no en la
 * raíz del dominio. Todo lo que dependa de rutas absolutas se rompería ahí.
 */
const BASE = '/mi-repo'
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2',
}

let fails = 0
const check = (l, ok, extra = '') => { if (!ok) { fails++; console.log(`  ✗ ${l} ${extra}`) } else console.log(`  ✓ ${l}`) }
const noEncontrados = []

const srv = createServer((req, res) => {
  let ruta = new URL(req.url, 'http://x').pathname
  if (!ruta.startsWith(BASE)) { noEncontrados.push(ruta + ' (fuera del subdirectorio)'); return res.writeHead(404).end() }
  ruta = ruta.slice(BASE.length) || '/'
  if (ruta === '/') ruta = '/index.html'
  const f = join('dist', ruta)
  if (!existsSync(f)) { noEncontrados.push(ruta); return res.writeHead(404).end() }
  res.writeHead(200, { 'content-type': MIME[extname(ruta)] ?? 'application/octet-stream' }).end(readFileSync(f))
})
await new Promise((r) => srv.listen(4210, '127.0.0.1', r))
const RAIZ = `http://127.0.0.1:4210${BASE}/`

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(String(e).slice(0, 120)))

console.log('\nServida desde un subdirectorio, como en GitHub Pages')
await p.goto(RAIZ, { waitUntil: 'networkidle' })
await p.evaluate(() => navigator.serviceWorker.ready.then(() => true))
await p.waitForTimeout(1500)

const info = await p.evaluate(async () => {
  await document.fonts.ready
  const reg = await navigator.serviceWorker.getRegistration()
  return {
    pestañas: document.querySelectorAll('.nav-btn').length,
    retrato: (document.querySelector('.portrait-wrap img')?.naturalWidth ?? 0) > 0,
    fuentes: [...new Set([...document.fonts].map((f) => f.family))].sort(),
    swScope: reg?.scope ?? null,
    manifest: document.querySelector('link[rel=manifest]')?.href ?? null,
    icono: document.querySelector('link[rel=apple-touch-icon]')?.href ?? null,
  }
})
check('la app arranca', info.pestañas === PESTANAS, String(info.pestañas))
check('sin ninguna ruta rota', noEncontrados.length === 0, JSON.stringify(noEncontrados.slice(0, 5)))
check('el retrato carga', info.retrato)
check('las tipografías cargan', info.fuentes.length === 3, JSON.stringify(info.fuentes))
check('el service worker se registra dentro del subdirectorio', info.swScope === RAIZ, info.swScope)
check('el manifiesto resuelve al subdirectorio', info.manifest === `${RAIZ}manifest.webmanifest`, info.manifest)
check('el ícono de iPhone también', info.icono === `${RAIZ}apple-touch-icon.png`, info.icono)

console.log('\nInstalable y funcional sin red')
await p.goto(`${RAIZ}?a=1#combat`, { waitUntil: 'networkidle' })
await p.waitForTimeout(600)
await p.locator('.hp-input').fill('5')
await p.getByRole('button', { name: 'Recibir daño' }).click()
await p.waitForTimeout(500)
await ctx.setOffline(true)
await p.goto(`${RAIZ}?b=1#combat`, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1800)
check('sigue abriendo sin conexión', await p.locator('.nav-btn').count() === PESTANAS)
check('y conserva la ficha', (await p.locator('.hp-cur').innerText()) === '20')
await ctx.setOffline(false)

if (errs.length) { fails++; console.log('\n✗ ERRORES:', errs.slice(0, 4)) }
console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ Lista para GitHub Pages\n')
await b.close()
srv.close()
process.exit(fails ? 1 : 0)
