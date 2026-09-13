import { chromium } from 'playwright-core'
import { preview } from './serve.mjs'

/** Notas, bitácora y galería: que se escriban, que se guarden y que sobrevivan. */
const { url, stop } = await preview()
const S = '/tmp/claude-1000/-mnt-c-Users-52333-Documents-projects-dnd/ffdabd6a-2075-47db-9f5f-e4f2046429e3/scratchpad'
let fails = 0
const has = (h, n) => h.toLowerCase().includes(n.toLowerCase())
const check = (l, ok, extra = '') => { if (!ok) { fails++; console.log(`  ✗ ${l} ${extra}`) } else console.log(`  ✓ ${l}`) }

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))

let nav = 0
const ir = async (t) => { await p.goto(`${url}?v=${nav++}#${t}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(500) }
const plate = (t) => p.locator('.plate').filter({ has: p.locator('.eyebrow', { hasText: t }) })

console.log('\nLa pestaña Diario existe y tiene tres apartados')
await ir('journal')
check('hay siete pestañas', await p.locator('.nav-btn').count() === 7)
check('Diario está en la barra',
  has(await p.locator('.nav-btn').nth(5).innerText(), 'Diario'),
  (await p.locator('.nav-btn').allInnerTexts()).join('/'))
check('ya no hay galería', await p.getByRole('button', { name: /^Galería/ }).count() === 0)
for (const v of ['Notas', 'Bitácora']) {
  check(`el apartado ${v} se puede abrir`, await p.getByRole('button', { name: new RegExp(`^${v}`) }).count() === 1)
}

console.log('\nNotas')
check('arranca vacío y lo dice', has(await plate('Notas').innerText(), 'Todavía nada'))
await plate('Notas').getByRole('button', { name: 'Nueva nota' }).click()
await p.waitForTimeout(400)
await p.getByLabel('Título de la nota').fill('El sello de la puerta')
await p.getByLabel('Contenido de la nota').fill('Tres runas: fuego, luna y una tercera borrada. El herrero dijo que no la tocáramos.')
await p.waitForTimeout(500)
check('la nota queda escrita', has(await plate('Notas').innerText(), 'El sello de la puerta'))
await plate('Notas').getByRole('button', { name: 'Nueva nota' }).click()
await p.waitForTimeout(300)
await p.getByLabel('Título de la nota').fill('Deuda con Maryse')
await p.waitForTimeout(400)
check('la segunda también', has(await plate('Notas').innerText(), 'Deuda con Maryse'))

console.log('\nBitácora')
await p.getByRole('button', { name: /^Bitácora/ }).click()
await p.waitForTimeout(400)
check('arranca vacía', has(await plate('Bitácora').innerText(), 'La campaña empieza aquí'))
await plate('Bitácora').getByRole('button', { name: 'Anotar la sesión de hoy' }).click()
await p.waitForTimeout(400)
const fecha = await p.getByLabel('Fecha de la sesión').inputValue()
check('la fecha viene puesta con la de hoy', fecha === new Date().toISOString().slice(0, 10), fecha)
await p.getByLabel('Título de la sesión').fill('La cripta bajo el molino')
await p.getByLabel('Relato de la sesión').fill('Bajamos por el pozo. Kalvys curó a Âreen dos veces antes de llegar al fondo.')
await p.waitForTimeout(500)
await p.getByLabel('Fecha de la sesión').fill('2026-01-15')
await p.waitForTimeout(400)
check('se puede fechar hacia atrás', has(await plate('Bitácora').innerText(), '15 de enero de 2026'))

console.log('\nTodo sobrevive a cerrar la app')
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
await ir('journal')
check('las notas siguen', has(await plate('Notas').innerText(), 'El sello de la puerta'))
await p.getByRole('button', { name: /^Bitácora/ }).click()
await p.waitForTimeout(400)
check('la bitácora sigue', has(await plate('Bitácora').innerText(), 'La cripta bajo el molino'))

console.log('\nEstado del almacenamiento')
await ir('sheet')
const datos = plate('Tus datos')
// Las fotos llegan de IndexedDB: esperar a que el botón sepa cuántas hay.
// Los .btn llevan text-transform: uppercase, y eso entra en el nombre accesible.
const botonCompleto = datos.getByRole('button', { name: 'Guardar copia' })
await botonCompleto.waitFor({ timeout: 10000 })
check('informa de si está protegido contra borrado', has(await datos.innerText(), 'borrado automático'))
check('avisa de que nunca has hecho copia', has(await datos.innerText(), 'Nunca has guardado una copia'))
check('ofrece guardar copia', await botonCompleto.count() === 1)

console.log('\nCopia y restauración')
const dl = p.waitForEvent('download', { timeout: 8000 })
await botonCompleto.click()
const archivo = await dl
check('descarga la copia', !!archivo)
check('con nombre reconocible', /areen-velthar-\d{4}-\d{2}-\d{2}\.json/.test(archivo.suggestedFilename()), archivo.suggestedFilename())
const ruta = `${S}/copia.json`
await archivo.saveAs(ruta)
await p.waitForTimeout(600)
check('y registra que hiciste copia hoy', has(await plate('Tus datos').innerText(), 'Última copia: hoy'))

// Borrar todo desde cero y restaurar desde el archivo.
const limpio = await b.newContext({ viewport: { width: 390, height: 844 } })
const q = await limpio.newPage()
await q.goto(url, { waitUntil: 'networkidle' })
await q.waitForTimeout(800)
await q.goto(`${url}?x=1#journal`, { waitUntil: 'networkidle' })
await q.waitForTimeout(600)
const plateQ = (t) => q.locator('.plate').filter({ has: q.locator('.eyebrow', { hasText: t }) })
check('el dispositivo nuevo empieza en blanco', has(await plateQ('Notas').innerText(), 'Todavía nada'))
await q.goto(`${url}?x=2#sheet`, { waitUntil: 'networkidle' })
await q.waitForTimeout(600)
await q.setInputFiles('input[type=file][accept="application/json,.json"]', ruta)
await q.waitForTimeout(3000)
const msg = await plateQ('Tus datos').innerText()
check('la restauración dice qué recuperó', has(msg, 'Restaurado') && has(msg, 'notas') && has(msg, 'sesiones'), msg.slice(0, 200))
await q.goto(`${url}?x=3#journal`, { waitUntil: 'networkidle' })
await q.waitForTimeout(900)
check('las notas volvieron', has(await plateQ('Notas').innerText(), 'El sello de la puerta'))
await q.getByRole('button', { name: /^Bitácora/ }).click()
await q.waitForTimeout(400)
check('la bitácora volvió', has(await plateQ('Bitácora').innerText(), 'La cripta bajo el molino'))

if (errs.length) { fails++; console.log('\n✗ ERRORES DE CONSOLA:', errs.slice(0, 4)) }
console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ El diario guarda, sobrevive y se puede restaurar\n')
await b.close()
stop()
process.exit(fails ? 1 : 0)
