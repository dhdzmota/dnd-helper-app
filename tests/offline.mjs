import { chromium } from 'playwright-core'
import { preview } from './serve.mjs'

/** ¿Sobrevive la app a quedarse sin señal en mitad de la partida? */
const { url, stop: stopPreview } = await preview()
let fails = 0
const check = (l, ok, extra = '') => { if (!ok) { fails++; console.log(`  ✗ ${l} ${extra}`) } else console.log(`  ✓ ${l}`) }

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' })
const p = await ctx.newPage()

await p.goto(url, { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)

const sw = await p.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration()
  return { registrado: !!reg, activo: !!reg?.active, scope: reg?.scope ?? null }
})
check('el service worker se registra', sw.registrado, JSON.stringify(sw))
check('y queda activo', sw.activo)

// Dejar algo guardado para comprobar que sobrevive.
await p.goto(`${url}?a=1#combat`, { waitUntil: 'networkidle' })
await p.waitForTimeout(400)
await p.locator('.hp-input').fill('9')
await p.getByRole('button', { name: 'Recibir daño' }).click()
await p.waitForTimeout(400)
check('antes de cortar, 16/25 puntos de golpe', (await p.locator('.hp-cur').innerText()) === '16')

// Cortar la red del todo.
await ctx.setOffline(true)
await p.reload({ waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1800)

check('la app arranca sin conexión', await p.locator('.nav-btn').count() === 6)
check('y la ficha conserva el daño recibido', (await p.locator('.hp-cur').innerText()) === '16')

// El retrato vive en la pestaña Héroe, que hasta ahora no se había abierto.
await p.goto(`${url}?b=1#hero`, { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1200)
check('el retrato carga sin red', await p.evaluate(() => (document.querySelector('.portrait-wrap img')?.naturalWidth ?? 0) > 0))
check('y el sello de la cabecera también', await p.evaluate(() => (document.querySelector('.sigil')?.naturalWidth ?? 0) > 0))

// Sin red, las tipografías caen al respaldo, pero la app tiene que seguir usable.
await p.locator('.nav-btn').nth(3).click()
await p.waitForTimeout(500)
check('se puede navegar entre pestañas sin red', (await p.locator('.eyebrow').first().innerText()).length > 0)
await p.screenshot({ path: 'tests/screenshots/offline.png' })

await ctx.setOffline(false)
await ctx.close()

// El caso duro: primera visita, y te quedas sin señal antes de tocar nada.
console.log('\nPrimera visita y corte inmediato')
const fresh = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' })
const q = await fresh.newPage()
await q.goto(url, { waitUntil: 'networkidle' })
await q.evaluate(() => navigator.serviceWorker.ready)
await q.waitForTimeout(500)
await fresh.setOffline(true)
await q.goto(`${url}?primera=1#hero`, { waitUntil: 'domcontentloaded' })
await q.waitForTimeout(1500)
check('arranca sin haber vuelto a conectarse', await q.locator('.nav-btn').count() === 6)
check('con el retrato ya precargado', await q.evaluate(() => (document.querySelector('.portrait-wrap img')?.naturalWidth ?? 0) > 0))
await q.locator('.nav-btn').nth(2).click()
await q.waitForTimeout(500)
check('y los conjuros se pueden consultar', await q.locator('.slot-name').count() >= 1)
const fuentes = await q.evaluate(async () => {
  await document.fonts.ready
  return [...new Set([...document.fonts].map((f) => f.family))].sort()
})
check('las tipografías también estaban precargadas',
  JSON.stringify(fuentes) === JSON.stringify(['Cinzel', 'EB Garamond', 'Oswald']), JSON.stringify(fuentes))
await q.screenshot({ path: 'tests/screenshots/offline.png' })
await fresh.setOffline(false)

console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ La app funciona sin conexión\n')
await b.close()
stopPreview()
process.exit(fails ? 1 : 0)
