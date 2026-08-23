import { chromium } from 'playwright-core'
import { preview } from './serve.mjs'

const { stop: stopPreview } = await preview()
const OUT = 'tests/screenshots'
let fails = 0
const has = (haystack, needle) => haystack.toLowerCase().includes(needle.toLowerCase())
const check = (label, ok, extra = '') => {
  if (!ok) { fails++; console.log(`  ✗ ${label} ${extra}`) } else console.log(`  ✓ ${label}`)
}

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

const plate = (t) => page.locator('.plate').filter({ has: page.locator('.eyebrow', { hasText: t }) })
const goto = async (h) => { await page.goto(`http://127.0.0.1:4173/#${h}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(350) }
const topbar = () => page.locator('.topbar-sub').innerText()

console.log('\nDaño, muerte y curación')
await goto('combat')
check('arranca a 25/25', (await page.locator('.hp-cur').innerText()) === '25')
await page.locator('.hp-input').fill('10')
await page.getByRole('button', { name: 'Recibir daño' }).click()
check('10 de daño deja 15', (await page.locator('.hp-cur').innerText()) === '15')
check('la cabecera se entera', (await topbar()).includes('15/25'))
check('sin salvaciones de muerte todavía', await page.locator('text=Salvaciones de muerte').count() === 0)

await page.locator('.hp-input').fill('40')
await page.getByRole('button', { name: 'Recibir daño' }).click()
check('el daño no baja de cero', (await page.locator('.hp-cur').innerText()) === '0')
check('a 0 aparecen las salvaciones de muerte', await page.locator('text=Salvaciones de muerte').count() === 1)
await page.locator('.death-mark.failure').nth(1).click()
check('dos fallos marcados', await page.locator('.death-mark.failure.on').count() === 2)

await page.locator('.hp-input').fill('4')
await page.getByRole('button', { name: 'Curar' }).click()
check('curar devuelve a 4', (await page.locator('.hp-cur').innerText()) === '4')
check('curar borra las salvaciones de muerte', await page.locator('.death-mark.on').count() === 0)
check('y el bloque desaparece', await page.locator('text=Salvaciones de muerte').count() === 0)

console.log('\nPuntos temporales')
await page.getByLabel('Sumar un punto temporal').click()
await page.getByLabel('Sumar un punto temporal').click()
check('2 puntos temporales', (await page.locator('.hp-temp').innerText()).includes('2'))
await page.locator('.hp-input').fill('1')
await page.getByRole('button', { name: 'Recibir daño' }).click()
check('el daño se come primero los temporales', (await page.locator('.hp-cur').innerText()) === '4')
check('queda 1 temporal', (await page.locator('.hp-temp').innerText()).includes('1'))

console.log('\nCastigo Divino gasta espacios de verdad')
const smite = page.locator('.smite-opt').first()
check('ofrece 3 espacios libres', (await smite.innerText()).includes('3 libre'))
await smite.click()
check('tras castigar quedan 2', (await page.locator('.smite-opt').first().innerText()).includes('2 libre'))
await goto('spells')
check('el rombo gastado se ve en Conjuros', await page.locator('.mark.diamond.spent').count() === 1)

console.log('\nPreparar conjuros con el límite puesto')
const prepared = async () => (await page.locator('.prep-cur').innerText()).trim()
check('empieza con 4 de 4 preparados', await prepared() === '4')
const grimorio = page.locator('.plate').filter({ has: page.locator('.eyebrow', { hasText: 'Grimorio de paladín' }) })
const sinPreparar = grimorio.locator('.spell').filter({ has: page.locator('.spell-name', { hasText: /^Heroísmo$/ }) })
await sinPreparar.locator('.spell-head').click()
const fullBtn = sinPreparar.getByRole('button', { name: 'Lista llena' })
check('con la lista llena no deja preparar más', await fullBtn.count() === 1 && await fullBtn.isDisabled())
await sinPreparar.locator('.spell-head').click()
// Aunque la lista esté llena, uno ya preparado tiene que poder quitarse desde el grimorio.
const yaPreparado = grimorio.locator('.spell').filter({ has: page.locator('.spell-name', { hasText: /^Bendición$/ }) })
await yaPreparado.locator('.spell-head').click()
check('el que ya está preparado sí ofrece quitarse desde el grimorio',
  await yaPreparado.getByRole('button', { name: 'Quitar de preparados' }).isEnabled())
await yaPreparado.locator('.spell-head').click()

const prepPlate = page.locator('.plate').filter({ has: page.locator('.eyebrow', { hasText: 'Preparados hoy' }) })
await prepPlate.locator('.spell-head').first().click()
await prepPlate.getByRole('button', { name: 'Quitar de preparados' }).first().click()
check('quitar uno baja a 3', await prepared() === '3')
await sinPreparar.locator('.spell-head').click()
check('con hueco libre ya deja preparar', await sinPreparar.getByRole('button', { name: 'Preparar' }).isEnabled())
await sinPreparar.getByRole('button', { name: 'Preparar' }).click()
check('y vuelve a 4 de 4', await prepared() === '4')
await sinPreparar.getByRole('button', { name: 'Quitar de preparados' }).click()

console.log('\nLos conjuros del juramento no se tocan')
const oath = page.locator('.plate').filter({ has: page.locator('.eyebrow', { hasText: 'Conjuros de Juramento de Devoción' }) })
await oath.locator('.spell-head').first().click()
check('no ofrece quitarlos', await oath.getByRole('button', { name: /Quitar de preparados|Preparar/ }).count() === 0)
check('lo explica en su sitio', (await oath.innerText()).includes('no ocupa sitio en tu límite'))
check('y no cuentan en el contador', await prepared() === '3')

console.log('\nRecursos y descansos')
await goto('traits')
await page.locator('.mark').first().click()   // Arma de aliento
check('el aliento queda gastado', await page.locator('.mark.spent').count() >= 1)
await page.getByRole('button', { name: 'Corto' }).click()
await page.waitForTimeout(250)
check('el descanso corto lo devuelve', await page.locator('.mark.spent').count() === 0)

await plate('Recursos').getByRole('button', { name: 'Gastar 5' }).click()
check('la reserva de curación baja a 10', (await page.locator('.pool-cur').first().innerText()) === '10')
await page.getByRole('button', { name: 'Largo' }).click()
await page.waitForTimeout(250)
check('el descanso largo repone la reserva', (await page.locator('.pool-cur').first().innerText()) === '15')
check('y avisa de lo que ha hecho', (await page.locator('.toast').innerText()).includes('descanso largo') || (await page.locator('.toast').innerText()).includes('Descanso largo'))
await goto('combat')
check('el descanso largo cura del todo', (await page.locator('.hp-cur').innerText()) === '25')
await goto('spells')
check('y devuelve los espacios', await page.locator('.mark.diamond.spent').count() === 0)

console.log('\nSubir de nivel abre y cierra opciones')
await goto('sheet')
check('a nivel 3 no hay dotes que elegir', (await plate('Dotes').innerText()).includes('El primer espacio de mejora llega en el nivel 4'))
for (let i = 0; i < 2; i++) await page.getByLabel('Subir un nivel').click()
await page.waitForTimeout(250)
check('a nivel 5 sí hay una dote', has(await plate('Dotes').innerText(), '0 de 1'))
await plate('Dotes').getByRole('button', { name: 'Iniciado en la Magia' }).click()
await page.waitForTimeout(250)
check('la dote no añade trucos en Ficha: se eligen en Conjuros',
  await plate('Trucos').count() === 0)

await goto('spells')
const trucos = page.locator('.plate').filter({ has: page.locator('.eyebrow', { hasText: 'Trucos' }) })
check('el paladín con la dote ya tiene presupuesto de trucos', has(await trucos.innerText(), '0 de 2'))
await trucos.locator('summary', { hasText: 'Elegir' }).click()
await page.waitForTimeout(200)
const luz = trucos.locator('.spell').filter({ has: page.locator('.spell-name', { hasText: /^Luz$/ }) })
await luz.locator('.spell-head').click()
await luz.getByRole('button', { name: 'Aprender truco' }).click()
await page.waitForTimeout(300)
check('el truco elegido se guarda', has(await trucos.innerText(), '1 de 2'))
check('y aparece como conocido', await trucos.locator('.spell-name', { hasText: /^Luz$/ }).count() >= 1)

check('a nivel 5 hay espacios de nivel 2', await page.locator('.slot-name').count() === 2)
check('el juramento añadió sus conjuros de nivel 5', (await plate('Conjuros de Juramento').innerText()).includes('Restauración Menor'))

console.log('\nLa ficha sobrevive a cerrar la app')
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(400)
check('sigue en nivel 5 tras recargar', has(await topbar(), 'Paladín 5'))

console.log('\nCambiar de raza reencadena el desplegable')
await goto('sheet')
await page.selectOption('select >> nth=0', 'human')
await page.waitForTimeout(250)
check('el humano no tiene desplegable de linaje', await page.locator('text=Linaje dracónico').count() === 0)
await goto('traits')
check('y pierde el arma de aliento', (await plate('Recursos').innerText()).includes('Arma de aliento') === false)
await goto('sheet')
await page.selectOption('select >> nth=0', 'elf')
await page.waitForTimeout(250)
check('el elfo sí trae desplegable de linaje', await page.locator('text=Linaje élfico').count() === 1)

await page.screenshot({ path: `${OUT}/flow-final.png` })
if (errors.length) { fails++; console.log('\n✗ ERRORES DE CONSOLA:', errors.slice(0, 5)) }
console.log(fails === 0 ? '\n✓ Todos los flujos pasan\n' : `\n✗ ${fails} fallo(s)\n`)
await browser.close()
stopPreview()
process.exit(fails ? 1 : 0)
