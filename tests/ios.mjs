import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
import { preview } from './serve.mjs'

/**
 * Lo que iOS hace distinto: la descarga no funciona desde la pantalla de inicio,
 * y Safari borra el almacenamiento de una web a los siete días si no se instala.
 */
const { url, stop } = await preview()
let fails = 0
const has = (h, n) => h.toLowerCase().includes(n.toLowerCase())
const check = (l, ok, extra = '') => { if (!ok) { fails++; console.log(`  ✗ ${l} ${extra}`) } else console.log(`  ✓ ${l}`) }

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'

console.log('\nLo que se publica trae lo que iOS necesita')
const html = readFileSync('dist/index.html', 'utf8')
check('meta de app en pantalla completa', html.includes('apple-mobile-web-app-capable'))
check('título propio para el ícono', has(html, 'apple-mobile-web-app-title'))
check('ícono de 180 píxeles', html.includes('apple-touch-icon'))
check('diez pantallas de arranque', (html.match(/apple-touch-startup-image/g) ?? []).length === 10)
check('con sus media queries por modelo', html.includes('-webkit-device-pixel-ratio: 3'))
const suelto = readFileSync('dist-single/ficha-dnd.html', 'utf8')
check('el archivo suelto no las referencia, porque no las lleva al lado',
  !suelto.includes('apple-touch-startup-image'))

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })

console.log('\nEn Safari, sin instalar: avisa de que los datos caducan')
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE, hasTouch: true })
  const p = await ctx.newPage()
  await p.goto(`${url}?a=1#sheet`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1800)
  const datos = p.locator('.plate').filter({ has: p.locator('.eyebrow', { hasText: 'Tus datos' }) })
  const texto = await datos.innerText()
  check('dice que está en Safari, no en la app', has(texto, 'Estás en Safari'))
  check('explica los siete días', has(texto, 'siete días'))
  check('y dice exactamente qué tocar', has(texto, 'Añadir a pantalla de inicio'))
  await p.screenshot({ path: 'tests/screenshots/ios-safari.png', clip: { x: 0, y: 0, width: 390, height: 700 } })
  await ctx.close()
}

console.log('\nInstalada en la pantalla de inicio: ese aviso desaparece')
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE, hasTouch: true })
  const p = await ctx.newPage()
  await p.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { value: true, configurable: true }) })
  await p.goto(`${url}?b=1#sheet`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1800)
  const texto = await p.locator('.plate').filter({ has: p.locator('.eyebrow', { hasText: 'Tus datos' }) }).innerText()
  check('ya no avisa de Safari', !has(texto, 'Estás en Safari'))
  await ctx.close()
}

console.log('\nLa copia sale por la hoja de compartir, no por descarga')
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE, hasTouch: true, acceptDownloads: true })
  const p = await ctx.newPage()
  await p.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true })
    window.__compartido = null
    navigator.canShare = (d) => !!d?.files?.length
    navigator.share = async (d) => {
      const f = d.files[0]
      window.__compartido = { nombre: f.name, tipo: f.type, bytes: f.size }
    }
  })
  let descargas = 0
  p.on('download', () => descargas++)
  await p.goto(`${url}?c=1#sheet`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1800)
  const datos = p.locator('.plate').filter({ has: p.locator('.eyebrow', { hasText: 'Tus datos' }) })
  await datos.getByRole('button', { name: 'Guardar copia' }).click()
  await p.waitForTimeout(900)
  const c = await p.evaluate(() => window.__compartido)
  check('usó navigator.share', !!c, JSON.stringify(c))
  check('con un archivo .json de verdad', /\.json$/.test(c?.nombre ?? '') && (c?.bytes ?? 0) > 500, JSON.stringify(c))
  check('sin intentar una descarga que no funcionaría', descargas === 0)
  check('y lo explica en términos de iPhone', has(await datos.innerText(), 'Guárdala en Archivos'))
  await ctx.close()
}

console.log('\nCancelar la hoja de compartir no rompe nada')
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE, hasTouch: true })
  const p = await ctx.newPage()
  await p.addInitScript(() => {
    navigator.canShare = () => true
    navigator.share = async () => { const e = new Error('cancelado'); e.name = 'AbortError'; throw e }
  })
  await p.goto(`${url}?d=1#sheet`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1800)
  const datos = p.locator('.plate').filter({ has: p.locator('.eyebrow', { hasText: 'Tus datos' }) })
  await datos.getByRole('button', { name: 'Guardar copia' }).click()
  await p.waitForTimeout(700)
  check('lo dice sin alarmar', has(await datos.innerText(), 'Cancelaste el compartir'))
  await ctx.close()
}

console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ La app se comporta como debe en iPhone\n')
await b.close()
stop()
process.exit(fails ? 1 : 0)
