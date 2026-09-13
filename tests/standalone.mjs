import { chromium } from 'playwright-core'
import { PESTANAS } from './serve.mjs'
import { copyFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * El caso real del usuario: un solo archivo HTML puesto en el teléfono y abierto
 * desde el explorador de archivos. Sin servidor, sin internet, sin cuenta.
 */
const dir = mkdtempSync(join(tmpdir(), 'ficha-'))
const destino = join(dir, 'ficha-dnd.html')
copyFileSync('dist-single/ficha-dnd.html', destino)
const F = `file://${destino}`

let fails = 0
const has = (h, n) => h.toLowerCase().includes(n.toLowerCase())
const check = (l, ok, extra = '') => { if (!ok) { fails++; console.log(`  ✗ ${l} ${extra}`) } else console.log(`  ✓ ${l}`) }

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 140)))
p.on('requestfailed', (r) => {
  const u = r.url()
  // Las tipografías de Google fallan si no hay red; la app tiene respaldo.
  if (!u.includes('fonts.g')) errs.push(`falló ${u.slice(0, 90)}`)
})

console.log('\nAbrir el archivo suelto desde el sistema de archivos')
await p.goto(F, { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
check('la app arranca', await p.locator('.nav-btn').count() === PESTANAS)
check('con el personaje de ejemplo', has(await p.locator('.topbar-name').innerText(), 'Âreen Velthar'))
check('y su retrato incrustado', await p.evaluate(() => (document.querySelector('.portrait-wrap img')?.naturalWidth ?? 0) > 0))
check('el origen es un archivo local', await p.evaluate(() => location.protocol) === 'file:')

console.log('\nGuarda datos y los conserva')
await p.locator('.nav-btn').nth(1).click()
await p.waitForTimeout(400)
await p.locator('.hp-input').fill('6')
await p.getByRole('button', { name: 'Recibir daño' }).click()
await p.waitForTimeout(500)
await p.getByRole('tab', { name: 'Diario' }).click()
await p.waitForTimeout(500)
await p.locator('.plate').filter({ has: p.locator('.eyebrow', { hasText: 'Notas' }) })
  .getByRole('button', { name: 'Nueva nota' }).click()
await p.waitForTimeout(400)
await p.getByLabel('Título de la nota').fill('Funciona sin servidor')
await p.waitForTimeout(600)

await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(1800)
check('la ficha sobrevive a cerrar y abrir', has(await p.locator('.topbar-sub').innerText(), '19/25'))
await p.getByRole('tab', { name: 'Diario' }).click()
await p.waitForTimeout(600)
check('la nota también', has(await p.locator('body').innerText(), 'Funciona sin servidor'))

console.log('\nLa galería también funciona en local')
const salud = await p.evaluate(async () => {
  const r = indexedDB.open('__probe2', 1)
  return await new Promise((res) => {
    r.onsuccess = () => { r.result.close(); indexedDB.deleteDatabase('__probe2'); res(true) }
    r.onerror = () => res(false)
    setTimeout(() => res(false), 3000)
  })
})
check('IndexedDB disponible desde file://', salud)

console.log('\nSin internet en ningún momento')
await ctx.setOffline(true)
await p.reload({ waitUntil: 'domcontentloaded' })
await p.waitForTimeout(1800)
check('sigue arrancando con la red cortada', await p.locator('.nav-btn').count() === PESTANAS)
check('y la ficha sigue ahí', has(await p.locator('.topbar-sub').innerText(), '19/25'))
await p.screenshot({ path: 'tests/screenshots/standalone.png' })
await ctx.setOffline(false)

if (errs.length) { fails++; console.log('\n✗ ERRORES:', errs.slice(0, 4)) }
console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ El archivo suelto funciona en el teléfono\n')
await b.close()
process.exit(fails ? 1 : 0)
