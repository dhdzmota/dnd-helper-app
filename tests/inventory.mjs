import { chromium } from 'playwright-core'
import { preview } from './serve.mjs'

/**
 * El inventario: que el dinero cuadre al céntimo, que la carga sume lo que
 * llevas encima —armadura incluida— y, sobre todo, que una ficha guardada
 * antes de que esto existiera no pierda nada ni herede la mochila de Âreen.
 */
const { url, stop } = await preview()
let fails = 0
const check = (l, ok, extra = '') => { if (!ok) { fails++; console.log(`  ✗ ${l} ${extra}`) } else console.log(`  ✓ ${l}`) }

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
const p = await ctx.newPage()
const errores = []
p.on('pageerror', (e) => errores.push(String(e)))

let nav = 0
const ir = async (t) => {
  await p.goto(`${url}?v=${nav++}#${t}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(400)
}
const plate = (t) => p.locator('.plate').filter({ has: p.locator('.eyebrow', { hasText: t }) })
const monedas = () => plate('Dinero').locator('.coin-input').evaluateAll((n) => n.map((x) => Number(x.value)))
const total = async () => (await plate('Dinero').locator('.count').innerText()).toLowerCase()
const carga = async () => Number((await plate('Carga').locator('.count').innerText()).match(/[\d.]+/)[0])

console.log('\nDinero: el cambio cuadra')
await ir('gear')
check('Âreen empieza con 15 po', (await monedas()).join('/') === '0/15/0/0/0', (await monedas()).join('/'))
check('y el total lo dice en oro', (await total()) === '15 po', await total())

const pagar = async (texto) => {
  await plate('Dinero').getByLabel('Cantidad').fill(texto)
  await plate('Dinero').getByRole('button', { name: 'Pagar' }).click()
  await p.waitForTimeout(250)
}

await pagar('2 po')
check('pagar 2 po deja 13 po', (await monedas()).join('/') === '0/13/0/0/0', (await monedas()).join('/'))

// Pagar medio oro obliga a romper una moneda y devolver el cambio.
await pagar('5 pp')
check('pagar 5 pp rompe un oro y devuelve 5 pp', (await monedas()).join('/') === '0/12/0/5/0', (await monedas()).join('/'))
check('el total baja exactamente eso', (await total()) === '12 po 5 pp', await total())

await pagar('7 pc')
check('pagar 7 pc rompe una plata y devuelve 3 pc', (await monedas()).join('/') === '0/12/0/4/3', (await monedas()).join('/'))
check('sin inventar electro por el camino', (await monedas())[2] === 0)

await pagar('500 po')
check('no te deja pagar lo que no tienes', (await monedas()).join('/') === '0/12/0/4/3', (await monedas()).join('/'))
check('y lo dice', (await plate('Dinero').locator('.pago-msg').innerText()).includes('No te alcanza'))

await plate('Dinero').getByLabel('Cantidad').fill('3 pp 5 pc')
await plate('Dinero').getByRole('button', { name: 'Cobrar' }).click()
await p.waitForTimeout(250)
check('cobrar suma en plata y cobre', (await monedas()).join('/') === '0/12/0/7/8', (await monedas()).join('/'))

await plate('Dinero').getByLabel('Piezas de cobre').fill('250')
await p.waitForTimeout(250)
const antesDeJuntar = await total()
await plate('Dinero').getByRole('button', { name: 'Juntar el suelto' }).click()
await p.waitForTimeout(250)
check('juntar el suelto sube 250 pc a oro y plata', (await monedas()).join('/') === '0/15/0/2/0', (await monedas()).join('/'))
check('y el total no cambia al juntarlo', (await total()) === antesDeJuntar, `${antesDeJuntar} → ${await total()}`)

console.log('\nCarga: pesa lo que llevas, no lo que apuntas')
const pesoInicial = await carga()
check('la cota de malla y el escudo cuentan aunque no estén en la mochila',
  (await plate('Carga').innerText()).includes('ARMADURA 61 LB'), await plate('Carga').innerText())
check('las monedas también pesan', (await plate('Carga').innerText()).includes('MONEDAS'))

await plate('Añadir equipo').getByLabel('Buscar equipo').fill('cuerda de cáñamo')
await p.waitForTimeout(300)
await plate('Añadir equipo').locator('.hallazgo').first().click()
await p.waitForTimeout(300)
check('añadir del catálogo trae el peso que dice el manual', (await carga()) === pesoInicial + 10, `${pesoInicial} → ${await carga()}`)

await plate('Añadir equipo').getByLabel('Buscar equipo').fill('rope')
await p.waitForTimeout(300)
check('y se busca igual por su nombre en inglés',
  (await plate('Añadir equipo').locator('.hallazgo').first().innerText()).includes('Cuerda de cáñamo'))
await plate('Añadir equipo').locator('.hallazgo').first().click()
await p.waitForTimeout(300)
check('lo repetido se apila en la misma línea en vez de duplicarse',
  (await plate('Mochila').locator('.inv-nombre', { hasText: 'Cuerda de cáñamo' }).count()) === 1)
check('y el peso sube otra vez', (await carga()) === pesoInicial + 20, String(await carga()))

console.log('\nSubir de nivel al equipo: lo guardado no se toca')
// Se simula una ficha guardada por la versión anterior: sin monedas ni mochila.
// Hay que sembrarla en una pestaña nueva y antes de que la app arranque: al
// ocultarse, la app vuelca su estado a localStorage y pisaría este montaje.
const CLAVE = 'areen-velthar-companion:v1'
const vieja = await p.evaluate((k) => {
  const c = JSON.parse(localStorage.getItem(k))
  delete c.coins
  delete c.items
  c.name = 'Ficha vieja'
  c.hpCurrent = 7
  return JSON.stringify(c)
}, CLAVE)

const ctxViejo = await b.newContext({ viewport: { width: 390, height: 844 } })
await ctxViejo.addInitScript(([k, v]) => localStorage.setItem(k, v), [CLAVE, vieja])
const q = await ctxViejo.newPage()
const erroresViejos = []
q.on('pageerror', (e) => erroresViejos.push(String(e)))
await q.goto(`${url}#gear`, { waitUntil: 'networkidle' })
await q.waitForTimeout(600)
const plateQ = (t) => q.locator('.plate').filter({ has: q.locator('.eyebrow', { hasText: t }) })

check('una ficha sin inventario abre sin romperse', erroresViejos.length === 0, erroresViejos.join(' | '))
check('y conserva lo que sí traía', (await q.locator('.topbar-name').innerText()) === 'Ficha vieja')
check('incluidos los puntos de golpe', (await q.locator('.topbar-sub').innerText()).includes('7/'))
check('la mochila empieza vacía, no con el equipo de Âreen',
  (await plateQ('Mochila').innerText()).toLowerCase().includes('vacía'),
  (await plateQ('Mochila').innerText()).slice(0, 60).replace(/\n/g, ' '))
check('y sin dinero heredado',
  (await plateQ('Dinero').locator('.coin-input').evaluateAll((n) => n.map((x) => Number(x.value)))).join('/') === '0/0/0/0/0')
// Y desde vacía, el botón de equipo inicial la llena de una vez.
const cargaQ = async () => Number((await plateQ('Carga').locator('.count').innerText()).match(/[\d.]+/)[0])
await plateQ('Añadir equipo').getByRole('button', { name: /^Equipo inicial/ }).click()
await q.waitForTimeout(500)
check('el botón de equipo inicial la llena de una vez', (await cargaQ()) > 30, String(await cargaQ()))
check('con el paquete desplegado en sus cosas, no como una línea suelta',
  (await plateQ('Mochila').innerText()).includes('Incensario'))

await q.goto(`${url}?otra=1#gear`, { waitUntil: 'networkidle' })
await q.waitForTimeout(600)
check('y todo eso sobrevive a cerrar y abrir la app', (await cargaQ()) > 30, String(await cargaQ()))
check('sin perder el nombre por el camino', (await q.locator('.topbar-name').innerText()) === 'Ficha vieja')
await ctxViejo.close()

check('sin errores en consola en toda la prueba', errores.length === 0, errores.join(' | '))
console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ El inventario cuadra y no se lleva nada por delante\n')
await b.close()
stop()
process.exit(fails ? 1 : 0)
