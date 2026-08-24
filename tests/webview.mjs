import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFileSync, existsSync, rmSync, cpSync } from 'node:fs'
import { join, extname } from 'node:path'

/**
 * Reproduce lo que hace el contenedor de Android: sirve los assets del APK
 * desde https://ficha.local/, sin service worker, y con el puente AndroidFicha
 * puesto. Todo lo que falle aquí, fallaría dentro de la app.
 */
const RAIZ = 'android/build/assets/www'
if (!existsSync(RAIZ)) { console.log('Falta android/build. Ejecuta: bash scripts/build-apk.sh'); process.exit(1) }
if (existsSync(join(RAIZ, 'sw.js'))) { console.log('✗ sw.js sigue dentro del APK'); process.exit(1) }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' }

let noEncontrados = []
const srv = createServer((req, res) => {
  let ruta = new URL(req.url, 'http://x').pathname
  if (ruta === '/') ruta = '/index.html'
  const archivo = join(RAIZ, ruta)
  if (!existsSync(archivo)) {
    // Igual que el contenedor: sin extensión es navegación, con extensión es 404.
    const tieneExt = extname(ruta) !== ''
    if (!tieneExt) return res.writeHead(200, { 'content-type': 'text/html' }).end(readFileSync(join(RAIZ, 'index.html')))
    noEncontrados.push(ruta)
    return res.writeHead(404).end()
  }
  res.writeHead(200, { 'content-type': MIME[extname(ruta)] ?? 'application/octet-stream' }).end(readFileSync(archivo))
})
await new Promise((r) => srv.listen(4200, '127.0.0.1', r))
const URL_APP = 'http://127.0.0.1:4200/index.html'

let fails = 0
const has = (h, n) => h.toLowerCase().includes(n.toLowerCase())
const check = (l, ok, extra = '') => { if (!ok) { fails++; console.log(`  ✗ ${l} ${extra}`) } else console.log(`  ✓ ${l}`) }

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 140)))

// El puente que expone la Activity, con la misma forma.
const guardados = []
await p.addInitScript(() => {
  window.__guardados = []
  window.AndroidFicha = {
    guardarEnDescargas: (nombre, base64, mime) => { window.__guardados.push({ nombre, mime, bytes: atob(base64).length }); return true },
    version: () => '1.0',
  }
})

let externas = []
p.on('request', (r) => { if (!r.url().startsWith('http://127.0.0.1:4200') && !r.url().startsWith('data:')) externas.push(r.url().slice(0, 60)) })

console.log('\nLa app dentro del contenedor')
await p.goto(URL_APP, { waitUntil: 'networkidle' })
await p.waitForTimeout(1800)
check('arranca', await p.locator('.nav-btn').count() === 6)
check('sin pedir nada a internet', externas.length === 0, JSON.stringify(externas.slice(0, 3)))
check('sin ningún 404', noEncontrados.length === 0, JSON.stringify(noEncontrados))
check('no intenta registrar service worker',
  await p.evaluate(() => navigator.serviceWorker?.controller === null || navigator.serviceWorker === undefined))
const fuentes = await p.evaluate(async () => { await document.fonts.ready; return [...new Set([...document.fonts].map((f) => f.family))].sort() })
check('con las tres tipografías incrustadas', JSON.stringify(fuentes) === JSON.stringify(['Cinzel', 'EB Garamond', 'Oswald']), JSON.stringify(fuentes))
check('el retrato carga', await p.evaluate(() => (document.querySelector('.portrait-wrap img')?.naturalWidth ?? 0) > 0))

console.log('\nGuardar y navegar')
await p.locator('.nav-btn').nth(1).click()
await p.waitForTimeout(400)
await p.locator('.hp-input').fill('8')
await p.getByRole('button', { name: 'Recibir daño' }).click()
await p.waitForTimeout(500)
check('la ficha responde', (await p.locator('.hp-cur').innerText()) === '17')
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
check('y los datos persisten', has(await p.locator('.topbar-sub').innerText(), '17/25'))

console.log('\nLa copia usa el puente de Android, no una descarga del navegador')
await p.goto(`${URL_APP}?a=1#sheet`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
const datos = p.locator('.plate').filter({ has: p.locator('.eyebrow', { hasText: 'Tus datos' }) })
await datos.getByRole('button', { name: 'Guardar copia' }).click()
await p.waitForTimeout(800)
const g = await p.evaluate(() => window.__guardados)
check('llamó a guardarEnDescargas', g.length === 1, JSON.stringify(g))
check('con nombre y tipo correctos', g[0]?.mime === 'application/json' && /\.json$/.test(g[0]?.nombre ?? ''), JSON.stringify(g[0]))
check('y contenido real dentro', (g[0]?.bytes ?? 0) > 500)
check('avisa de dónde quedó', has(await datos.innerText(), 'Guardado en Descargas'))

console.log('\nUn WebView viejo recibe una explicación, no una pantalla negra')
const viejo = await b.newContext({ viewport: { width: 390, height: 844 } })
const v = await viejo.newPage()
await v.addInitScript(() => {
  // Simular un WebView sin IndexedDB, como los anteriores a 2016.
  Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true })
})
await v.goto(URL_APP, { waitUntil: 'networkidle' })
await v.waitForTimeout(1200)
const texto = await v.locator('#root').innerText()
check('avisa de que el navegador es antiguo', has(texto, 'muy antiguo'), texto.slice(0, 80))
check('dice exactamente qué hacer', has(texto, 'Android System WebView'))
check('y tranquiliza sobre los datos', has(texto, 'no se han tocado'))
await v.screenshot({ path: 'tests/screenshots/webview-viejo.png' })
await viejo.close()

console.log('\nEl enrutado por hash sobrevive a una ruta inventada')
await p.goto('http://127.0.0.1:4200/loquesea#traits', { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
check('una ruta desconocida devuelve la app', await p.locator('.nav-btn').count() === 6)

await p.goto(`${URL_APP}#hero`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
await p.screenshot({ path: 'tests/screenshots/webview.png' })

if (errs.length) { fails++; console.log('\n✗ ERRORES DE CONSOLA:', errs.slice(0, 4)) }
console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ La app funciona como la servirá el APK\n')
await b.close()
srv.close()
process.exit(fails ? 1 : 0)
