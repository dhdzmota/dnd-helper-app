import { chromium } from 'playwright-core'
import { preview } from './serve.mjs'

/**
 * La ayuda de combate. Lo que importa: que no enseñe nada que el personaje no
 * tenga, que lo gastado se marque como gastado con su motivo, y que el orden
 * que cada jugador se monte se quede guardado en su ficha.
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
  await p.waitForTimeout(450)
}
const plate = (t) => p.locator('.plate').filter({ has: p.locator('.eyebrow', { hasText: t }) })
const abrir = async () => {
  await ir('combat')
  if ((await p.locator('.turno-sec').count()) === 0) {
    await p.locator('.turno-abrir').click()
    await p.waitForTimeout(400)
  }
}
const nombres = async (slot) =>
  (await p.locator(`.turno-sec[data-slot="${slot}"] .turno-op-nombre`).allInnerTexts())
    .map((t) => t.split('\n')[0])
const agotadas = async () =>
  (await p.locator('.turno-op.agotada .turno-op-nombre').allInnerTexts()).map((t) => t.split('\n')[0])

console.log('\nEl turno de un paladín de nivel 3')
await abrir()
check('los cinco apartados salen en orden de turno',
  (await p.locator('.turno-sec .skill-group-title').allInnerTexts()).map((t) => t.split('\n')[0]).join('>')
  === 'MOVIMIENTO>ACCIÓN>ACCIÓN ADICIONAL>REACCIÓN>GRATIS',
  (await p.locator('.turno-sec .skill-group-title').allInnerTexts()).join('>'))

const acciones = await nombres('accion')
check('sus armas salen con las acciones', acciones.includes('Espada larga') && acciones.includes('Jabalina'))
check('y las acciones que tiene cualquiera también', acciones.includes('Esquivar') && acciones.includes('Ayudar'))
check('Imposición de Manos está, que es de paladín', acciones.includes('Imposición de Manos'))
check('Canalizar Divinidad también, que llega al nivel 3',
  acciones.some((n) => n.startsWith('Canalizar Divinidad')), acciones.join('/'))

const gratis = await nombres('gratis')
check('Castigo Divino va en lo gratis, no en la acción', gratis.includes('Castigo Divino'))
check('un paladín no ve el Ataque Furtivo del pícaro', !(await p.locator('.turno-op').allInnerTexts()).join(' ').includes('Ataque Furtivo'))
check('ni Ráfaga de Golpes, que es del monje', !(await p.locator('.turno-op').allInnerTexts()).join(' ').includes('Ráfaga de Golpes'))
check('con espada larga no le ofrece pelear con dos armas',
  !(await nombres('adicional')).includes('Pelear con dos armas'))

console.log('\nLo que viene de la raza, la subclase y las reservas')
check('el Arma de aliento del dracónido sale entre las acciones',
  acciones.includes('Arma de aliento'), acciones.join('/'))
const aliento = p.locator('.turno-op').filter({ hasText: 'Arma de aliento' }).first()
check('y dice cuántos usos le quedan',
  (await aliento.locator('.turno-op-queda').innerText()).includes('1 de 1'),
  await aliento.locator('.turno-op-queda').innerText())
check('Canalizar Divinidad sale con el efecto concreto de su juramento',
  acciones.some((n) => n.startsWith('Canalizar Divinidad: Arma Sagrada')), acciones.join('/'))
check('y no con los efectos de otros juramentos',
  !acciones.some((n) => n.includes('Expulsar a los Infieles')), acciones.join('/'))
const cd = p.locator('.turno-op').filter({ hasText: 'Arma Sagrada' }).first()
check('el efecto del juramento hereda los usos de Canalizar Divinidad',
  (await cd.locator('.turno-op-queda').innerText()).includes('1 de 1'),
  await cd.locator('.turno-op-queda').innerText())
const manos = p.locator('.turno-op').filter({ hasText: 'Imposición de Manos' }).first()
check('Imposición de Manos enseña su reserva de puntos',
  (await manos.locator('.turno-op-queda').innerText()).includes('15 puntos'),
  await manos.locator('.turno-op-queda').innerText())

console.log('\nLo gastado deja de estar disponible')
check('de entrada no hay nada agotado', (await agotadas()).length === 0, (await agotadas()).join('/'))

await ir('spells')
for (const m of await p.locator('.mark.diamond').all()) { await m.click(); await p.waitForTimeout(120) }
// La ficha se guarda con 150 ms de rebote: salir antes se lleva el último clic.
await p.waitForTimeout(400)
await abrir()
const fuera = await agotadas()
check('sin espacios, los conjuros salen tachados', fuera.includes('Bendición') && fuera.includes('Curar Heridas'), fuera.join('/'))
check('y el Castigo Divino también, que gasta espacio', fuera.includes('Castigo Divino'))
check('con el motivo escrito, no en silencio',
  (await p.locator('.turno-motivo').first().innerText()).includes('descanso largo'))
check('pero Esquivar sigue ahí: no gasta nada', !fuera.includes('Esquivar'))

// Vaciar la reserva de Imposición de Manos desde la propia ayuda.
const lay = p.locator('.turno-op').filter({ hasText: 'Imposición de Manos' }).first()
await lay.locator('.turno-op-btn').click()
await p.waitForTimeout(300)
const quedaAntes = await lay.locator('.turno-op-queda').innerText()
await lay.getByRole('button', { name: 'Marcar que lo usé' }).click()
await p.waitForTimeout(400)
check('gastar desde la ayuda descuenta de verdad',
  (await lay.locator('.turno-op-queda').innerText()) !== quedaAntes,
  `${quedaAntes} → ${await lay.locator('.turno-op-queda').innerText()}`)
const reserva = p.locator('.resource').filter({ hasText: 'Imposición de Manos' }).first()
check('y se ve descontado en el resto de la app, no solo aquí',
  (await reserva.locator('.pool-cur').innerText()) === '14',
  await reserva.locator('.pool-cur').innerText())

console.log('\nUn descanso largo lo devuelve todo')
await p.getByRole('button', { name: 'Largo' }).click()
await p.waitForTimeout(600)
await abrir()
check('tras descansar no queda nada agotado', (await agotadas()).length === 0, (await agotadas()).join('/'))

console.log('\nCada jugador ordena sus opciones')
const antes = await nombres('accion')
await p.getByRole('button', { name: 'Ordenar a mi gusto' }).click()
await p.waitForTimeout(300)
const tercera = antes[2]
await p.getByLabel(`Subir ${tercera}`).click()
await p.waitForTimeout(250)
await p.getByLabel(`Subir ${tercera}`).click()
await p.waitForTimeout(250)
await p.getByRole('button', { name: 'Listo' }).click()
await p.waitForTimeout(300)
const despues = await nombres('accion')
check('subir una opción la pone la primera', despues[0] === tercera, `${antes.slice(0, 3).join('/')} → ${despues.slice(0, 3).join('/')}`)

await abrir()
check('y el orden sobrevive a cerrar y abrir la app', (await nombres('accion'))[0] === tercera)

await p.getByRole('button', { name: 'Orden de fábrica' }).click()
await p.waitForTimeout(300)
check('se puede volver al orden de fábrica', (await nombres('accion'))[0] === antes[0])

console.log('\nCada clase ve lo suyo')
await ir('sheet')
await plate('Personaje nuevo').getByRole('button', { name: 'Pícaro' }).click()
await p.waitForTimeout(200)
await plate('Personaje nuevo').getByRole('button', { name: 'Confirmar: Pícaro' }).click()
await p.waitForTimeout(600)
await abrir()
const todo = (await p.locator('.turno-op').allInnerTexts()).join(' ')
check('el pícaro ve su Acción Astuta', todo.includes('Acción Astuta'))
check('y su Ataque Furtivo', todo.includes('Ataque Furtivo'))
check('pero ya no la Imposición de Manos del paladín', !todo.includes('Imposición de Manos'))
check('ni Canalizar Divinidad', !todo.includes('Canalizar Divinidad'))
check('con dos dagas sí le ofrece pelear con dos armas',
  (await nombres('adicional')).includes('Pelear con dos armas'),
  (await nombres('adicional')).join('/'))
check('Esquiva Asombrosa no, que es de nivel 5', !todo.includes('Esquiva Asombrosa'))
check('ve Manos Rápidas, de su arquetipo de Ladrón', todo.includes('Manos Rápidas'))
check('y no el Arma de aliento, que era de la raza del paladín', !todo.includes('Arma de aliento'))

console.log('\nEl monje, que tiene una sola arma ligera')
await ir('sheet')
await plate('Personaje nuevo').getByRole('button', { name: 'Monje', exact: true }).click()
await p.waitForTimeout(200)
await plate('Personaje nuevo').getByRole('button', { name: 'Confirmar: Monje' }).click()
await p.waitForTimeout(600)
await abrir()
const adicMonje = await nombres('adicional')
check('con una espada corta sola no le ofrece pelear con dos armas',
  !adicMonje.includes('Pelear con dos armas'), adicMonje.join('/'))
check('pero sí su Ráfaga de Golpes', adicMonje.includes('Ráfaga de Golpes'))
check('y Desviar Proyectiles en las reacciones, que llega al nivel 3',
  (await nombres('reaccion')).includes('Desviar Proyectiles'), (await nombres('reaccion')).join('/'))
check('el Golpe Aturdidor no, que es de nivel 5',
  !(await p.locator('.turno-op').allInnerTexts()).join(' ').includes('Golpe Aturdidor'))

check('sin errores en consola', errores.length === 0, errores.join(' | '))
console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ La ayuda de turno enseña solo lo que hay y lo gastado se nota\n')
await b.close()
stop()
process.exit(fails ? 1 : 0)
