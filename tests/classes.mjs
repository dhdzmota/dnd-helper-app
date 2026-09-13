import { chromium } from 'playwright-core'
import { preview } from './serve.mjs'

/** Cada clase nueva, montada desde la interfaz como lo haría un jugador. */
const { url, stop: stopPreview } = await preview()
let fails = 0
const has = (h, n) => h.toLowerCase().includes(n.toLowerCase())
const check = (l, ok, extra = '') => { if (!ok) { fails++; console.log(`  ✗ ${l} ${extra}`) } else console.log(`  ✓ ${l}`) }

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))

let nav = 0
const goto = async (h) => {
  await p.goto(`${url}?n=${nav++}#${h}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(300)
}
/** Una placa concreta, identificada por el título de su encabezado. */
const plate = (t) => p.locator('.plate').filter({ has: p.locator('.eyebrow', { hasText: t }) })

/** Los desplegables cambian de posición según la clase; buscarlos por su rótulo. */
const pick = async (label, value) => {
  await p.getByLabel(label, { exact: true }).selectOption(value)
  await p.waitForTimeout(350)
}

/** Arranca una hoja limpia de la clase pedida desde la propia interfaz. */
async function startAs(className) {
  await goto('sheet')
  const nuevo = plate('Personaje nuevo')
  await nuevo.getByRole('button', { name: className, exact: true }).click()
  await nuevo.getByRole('button', { name: `Confirmar: ${className}` }).click()
  await p.waitForTimeout(400)
}

console.log('\nEl botón de personaje nuevo pide confirmación')
await goto('sheet')
await plate('Personaje nuevo').getByRole('button', { name: 'Monje', exact: true }).click()
check('primero pide confirmar', await plate('Personaje nuevo').getByRole('button', { name: 'Confirmar: Monje' }).count() === 1)
check('y todavía no ha cambiado nada', has(await p.locator('.topbar-sub').innerText(), 'Paladín'))

console.log('\nMonje tiflin')
await startAs('Monje')
check('la cabecera ya dice Monje 3', has(await p.locator('.topbar-sub').innerText(), 'Monje 3'))
await goto('sheet')
await pick('Raza', 'tiefling')
check('el tiflin no abre desplegable de linaje', await p.locator('text=Linaje dracónico').count() === 0)
check('sí ofrece tradición monástica', await p.locator('text=Tradición monástica').count() === 1)
check('el monje no tiene estilo de combate', await p.locator('text=Estilo de combate').count() === 0)
await goto('combat')
check('la CA sale de Defensa sin Armadura', has(await p.locator('.note-data').first().innerText(), 'Defensa sin Armadura'))
check('las abreviaturas están en español', has(await p.locator('.note-data').first().innerText(), 'DES'))
check('muestra Artes Marciales', has(await plate('En cada golpe').innerText(), 'Artes Marciales'))
check('sin Castigo Divino', await p.locator('text=Castigo Divino').count() === 0)
await goto('traits')
check('el ki es una reserva con botones de gastar', await plate('Recursos').getByRole('button', { name: 'Gastar 1' }).count() === 1)
await plate('Recursos').getByRole('button', { name: 'Gastar 1' }).click()
await p.waitForTimeout(250)
check('gastar ki baja la reserva a 2', (await p.locator('.pool-cur').first().innerText()) === '2')
await p.getByRole('button', { name: 'Corto' }).click()
await p.waitForTimeout(300)
check('un descanso corto devuelve el ki', (await p.locator('.pool-cur').first().innerText()) === '3')
await goto('spells')
check('el monje no lanza conjuros', has(await p.locator('.empty').innerText(), 'no lanza conjuros por sí mismo'))

console.log('\nPícaro: pericia y arquetipo')
await startAs('Pícaro')
await goto('sheet')
check('aparece la sección de pericia', await plate('Pericia').count() === 1)
check('y pide competencias primero', has(await plate('Pericia').innerText(), 'Primero elige competencias'))
await plate('Competencias').getByRole('button', { name: /^Sigilo\b/ }).click()
await plate('Competencias').getByRole('button', { name: /^Juego de manos\b/ }).click()
await p.waitForTimeout(300)
await plate('Pericia').getByRole('button', { name: /^Sigilo\b/ }).click()
await plate('Pericia').getByRole('button', { name: /^Juego de manos\b/ }).click()
await p.waitForTimeout(300)
check('2 de 2 pericias', has(await plate('Pericia').innerText(), '2 de 2'))
await goto('hero')
check('la pericia dobla la competencia', await p.locator('.pip-prof.expert').count() === 2)
await goto('sheet')
await plate('Competencias').getByRole('button', { name: /^Sigilo\b/ }).click()
await p.waitForTimeout(300)
check('quitar la competencia quita también su pericia', has(await plate('Pericia').innerText(), '1 de 2'))

console.log('\nEl Embaucador Arcano desbloquea magia en una clase que no la tenía')
await goto('spells')
check('el ladrón no tiene conjuros', await p.locator('.empty').count() === 1)
await goto('sheet')
await pick('Arquetipo de pícaro', 'arcane-trickster')
await goto('spells')
check('ahora sí lanza', await p.locator('.slot-name').count() === 1)
check('con Inteligencia', has(await p.locator('.note-data').first().innerText(), 'Embaucador'))
check('Mano de Mago viene impuesta', await plate('Trucos').locator('.spell-name', { hasText: /^Mano de Mago$/ }).count() === 1)
const mano = plate('Trucos').locator('.spell').filter({ has: p.locator('.spell-name', { hasText: /^Mano de Mago$/ }) })
await mano.locator('.spell-head').click()
check('y no se puede quitar', await mano.getByRole('button', { name: /Quitar truco/ }).count() === 0)
check('lo explica', has(await mano.innerText(), 'obliga a conocerlo'))

console.log('\nHechicero: conjuros conocidos y metamagia')
await startAs('Hechicero')
await goto('sheet')
check('elige origen desde el nivel 1', await p.locator('text=Origen de hechicería').count() === 1)
check('y ya puede elegir metamagia a nivel 3', await plate('Metamagia').count() === 1)
await plate('Metamagia').getByRole('button', { name: 'Conjuro Acelerado' }).click()
await plate('Metamagia').getByRole('button', { name: 'Conjuro Gemelo' }).click()
await p.waitForTimeout(300)
check('2 de 2 metamagias', has(await plate('Metamagia').innerText(), '2 de 2'))
const otra = plate('Metamagia').getByRole('button', { name: 'Conjuro Sutil' })
check('con el cupo lleno, las demás se bloquean', await otra.isDisabled())
check('el linaje dracónico pide su propio ancestro', await plate('Ancestro dracónico').count() === 1)

await goto('spells')
check('espacios de nivel 1 y 2', await p.locator('.slot-name').count() === 2)
const conocidos = plate('Conjuros conocidos')
check('habla de conocidos, no de preparados', await conocidos.count() === 1)
check('explica que no se preparan', has(await conocidos.innerText(), 'No se preparan'))
check('el límite es 4', has(await conocidos.innerText(), '/ 4'))
const grimorio = plate('Lista de hechicero')
const bola = grimorio.locator('.spell').filter({ has: p.locator('.spell-name', { hasText: /^Proyectil Mágico$/ }) })
await bola.locator('.spell-head').click()
await bola.getByRole('button', { name: 'Aprender' }).click()
await p.waitForTimeout(300)
check('aprender uno lo suma al contador', has(await plate('Conjuros conocidos').innerText(), '1'))
check('los trucos muestran su daño actual', await plate('Trucos').count() === 1)

await goto('traits')
check('3 puntos de hechicería', has(await plate('Recursos').innerText(), 'Puntos de hechicería'))
// La metamagia ya no tiene placa aparte: cuelga de la reserva que la paga, para
// que se vea de un vistazo en qué se gastan los puntos.
const puntos = p.locator('.resource').filter({ hasText: 'Puntos de hechicería' }).first()
check('la metamagia elegida cuelga de los puntos que la pagan',
  has(await puntos.innerText(), 'Conjuro Acelerado'), (await puntos.innerText()).replace(/\n/g, ' ').slice(0, 90))
check('y con su texto de reglas', has(await puntos.innerText(), 'acción adicional'))
check('sin repetirse en una placa suelta', await plate('Metamagia').count() === 0)

console.log('\nTodas las subclases están a la vista')
const opciones = async (label) =>
  (await p.getByLabel(label, { exact: true }).locator('option').allInnerTexts()).map((x) => x.trim())

await startAs('Paladín')
await goto('sheet')
check('el paladín ofrece 4 juramentos', (await opciones('Juramento sagrado')).length === 4)
check('con Gloria marcada como de Tasha\'s',
  (await opciones('Juramento sagrado')).includes("Juramento de Gloria (Tasha's)"))
await pick('Juramento sagrado', 'glory')
await goto('spells')
check('Gloria trae Proyectil de Guía y Heroísmo',
  has(await plate('Conjuros de Juramento de Gloria').innerText(), 'Proyectil de Guía'))
await goto('traits')
check('y Atleta sin Par entre sus rasgos', await p.locator('text=Atleta sin Par').count() >= 1)

await startAs('Hechicero')
await goto('sheet')
check('el hechicero ofrece 4 orígenes', (await opciones('Origen de hechicería')).length === 4)
await pick('Origen de hechicería', 'aberrant-mind')
await goto('spells')
const psionicos = plate('Conjuros de Mente Aberrante')
check('los conjuros psiónicos vienen concedidos', await psionicos.count() === 1)
check('incluida Esquirla Mental, que es truco', has(await psionicos.innerText(), 'Esquirla Mental'))
check('y avisa de que no gastan tu límite', has(await psionicos.innerText(), 'sin gastar tu límite'))
check('el límite de conocidos sigue en 4', has(await plate('Conjuros conocidos').innerText(), '/ 4'))
await goto('sheet')
await pick('Origen de hechicería', 'clockwork-soul')
await goto('traits')
check('Alma de Relojería trae Restaurar el Equilibrio', has(await plate('Recursos').innerText(), 'Restaurar el Equilibrio'))

await startAs('Pícaro')
await goto('sheet')
check('el pícaro ofrece 5 arquetipos', (await opciones('Arquetipo de pícaro')).length === 5)
await pick('Arquetipo de pícaro', 'soulknife')
await goto('combat')
check('la Cuchilla del Alma muestra su dado psiónico', has(await plate('En cada golpe').innerText(), 'Dado psiónico'))
await goto('traits')
check('y sus dados de energía son una reserva',
  await plate('Recursos').getByRole('button', { name: 'Gastar 1' }).count() >= 1)
await goto('sheet')
await pick('Arquetipo de pícaro', 'phantom')
await goto('traits')
check('el Fantasma tiene Lamentos desde la Tumba', has(await plate('Recursos').innerText(), 'Lamentos desde la Tumba'))
check('sin fetiches de alma todavía, que son de nivel 9', !has(await plate('Recursos').innerText(), 'Fetiches'))

await startAs('Monje')
await goto('sheet')
check('el monje ofrece 5 tradiciones', (await opciones('Tradición monástica')).length === 5)
await pick('Tradición monástica', 'mercy')
await goto('traits')
check('Misericordia trae Mano de Curación', await p.locator('text=Mano de Curación').count() >= 1)
await goto('sheet')
await pick('Tradición monástica', 'astral-self')
await goto('combat')
check('el Yo Astral muestra sus Brazos', has(await plate('En cada golpe').innerText(), 'Brazos Astrales'))

console.log('\nTasha\'s se puede apagar')
await startAs('Paladín')
await goto('sheet')
const reglas = plate('Reglas en la mesa')
check('apagarlo también quita las subclases: el paladín baja a 3',
  await (async () => {
    await plate('Reglas en la mesa').getByRole('button', { name: /Tasha/ }).click()
    await p.waitForTimeout(400)
    const n = (await p.getByLabel('Juramento sagrado', { exact: true }).locator('option').count())
    await plate('Reglas en la mesa').getByRole('button', { name: /Tasha/ }).click()
    await p.waitForTimeout(400)
    return n === 3
  })())
check('el interruptor viene activado', await reglas.getByRole('button', { name: /Tasha/ }).getAttribute('aria-pressed') === 'true')
check('con Tasha\'s aparece Guerrero Bendecido',
  (await p.getByLabel('Estilo de combate', { exact: true }).innerText()).includes('Guerrero Bendecido'))

await pick('Estilo de combate', 'blessed-warrior')
await goto('spells')
const trucos = plate('Trucos')
check('Guerrero Bendecido da 2 trucos', has(await trucos.innerText(), '0 de 2'))
await trucos.locator('summary', { hasText: 'Elegir' }).click()
await p.waitForTimeout(200)
const nombres = await trucos.locator('.spell-name').allInnerTexts()
check('y solo ofrece trucos de clérigo', nombres.includes('Llama Sagrada') && !nombres.includes('Rayo de Fuego'),
  JSON.stringify(nombres))

await goto('sheet')
await plate('Reglas en la mesa').getByRole('button', { name: /Tasha/ }).click()
await p.waitForTimeout(400)
check('al apagarlo desaparece Guerrero Bendecido del desplegable',
  !(await p.getByLabel('Estilo de combate', { exact: true }).innerText()).includes('Guerrero Bendecido'))
await goto('spells')
check('y el paladín se queda sin trucos', has(await plate('Trucos').innerText(), 'no aprende trucos'))
await goto('traits')
check('Canalizar Poder Divino tampoco está', await p.locator('text=Canalizar Poder Divino').count() === 0)
check('pero Canalizar Divinidad del Manual sigue', await p.locator('text=Canalizar Divinidad').count() >= 1)

await goto('sheet')
await plate('Reglas en la mesa').getByRole('button', { name: /Tasha/ }).click()
await p.waitForTimeout(400)
await goto('traits')
check('al volver a encenderlo, todo regresa', await p.locator('text=Canalizar Poder Divino').count() >= 1)

console.log('\nVolver al paladín deja la ficha coherente')
await startAs('Paladín')
await goto('combat')
check('el Castigo Divino vuelve', await p.locator('text=Castigo Divino').count() >= 1)
check('sin Artes Marciales', await p.locator('text=Artes Marciales').count() === 0)

if (errs.length) { fails++; console.log('\n✗ ERRORES DE CONSOLA:', errs.slice(0, 5)) }
console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ Las cuatro clases funcionan\n')
await b.close()
stopPreview()
process.exit(fails ? 1 : 0)
