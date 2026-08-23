import { chromium } from 'playwright-core'
import { preview } from './serve.mjs'

/** Editar la ficha no debe dejarte herido sin haber recibido daño. */
const { url, stop } = await preview()
let fails = 0
const check = (l, ok, extra = '') => { if (!ok) { fails++; console.log(`  ✗ ${l} ${extra}`) } else console.log(`  ✓ ${l}`) }
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
const p = await ctx.newPage()
let nav = 0
const ir = async (t, y = 0) => {
  await p.goto(`${url}?v=${nav++}#${t}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(400)
  if (y) { await p.locator('.scroll').evaluate((e, y) => e.scrollTo(0, y), y); await p.waitForTimeout(250) }
}
const barra = async () => (await p.locator('.topbar-sub').innerText())

await ir('hero')
check('Âreen empieza a tope', (await barra()).includes('25/25'))

await ir('sheet')
await p.getByLabel('Subir Constitución').click()
await p.getByLabel('Subir Constitución').click()
await p.waitForTimeout(400)
check('subir Constitución sube máximo y actuales a la vez', (await barra()).includes('28/28'), await barra())

await p.getByLabel('Subir un nivel').click()
await p.waitForTimeout(400)
check('subir de nivel también', (await barra()).includes('36/36'), await barra())

await p.getByLabel('Bajar Constitución').click()
await p.getByLabel('Bajar Constitución').click()
await p.waitForTimeout(400)
check('bajarla recorta el máximo y los actuales', (await barra()).includes('32/32'), await barra())

// Estando herido, subir el máximo suma la diferencia sin curarte del todo.
await ir('combat')
await p.locator('.hp-input').fill('20')
await p.getByRole('button', { name: 'Recibir daño' }).click()
await p.waitForTimeout(400)
check('tras 20 de daño quedan 12', (await p.locator('.hp-cur').innerText()) === '12')
const leer = async () => {
  const [, cur, max] = (await barra()).match(/(\d+)\/(\d+) PG/).map(Number)
  return { cur, max }
}
const antes = await leer()
await ir('sheet')
await p.getByLabel('Subir un nivel').click()
await p.waitForTimeout(400)
const despues = await leer()
check('subir de nivel herido suma exactamente lo que creció el máximo',
  despues.cur - antes.cur === despues.max - antes.max && despues.max > antes.max,
  JSON.stringify({ antes, despues }))
check('y sigue herido: no te cura por subir de nivel', despues.cur < despues.max)

console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ Los puntos de golpe siguen a la ficha\n')
await b.close()
stop()
process.exit(fails ? 1 : 0)
