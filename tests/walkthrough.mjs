import { chromium } from 'playwright-core'
import { preview } from './serve.mjs'

/**
 * Crea un Monje tiflin de nivel 3 usando solo la interfaz, como lo haría
 * un jugador, y captura cada paso. Sirve de guía y de prueba de extremo a extremo.
 */
const { url, stop } = await preview()
const OUT = 'tests/screenshots/guia'
const WEB = 'tests/screenshots/guia/web'
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
// Escala 1: las capturas salen ya al tamaño en que se publican, sin reescalar después.
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))

let n = 0
let nav = 0

/** Navegar recarga la página: úsalo solo entre pasos, nunca dentro de uno. */
const ir = async (tab, y = 0) => {
  await p.goto(`${url}?v=${nav++}#${tab}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(450)
  if (y) { await p.locator('.scroll').evaluate((e, y) => e.scrollTo(0, y), y); await p.waitForTimeout(300) }
}

/**
 * Encuadra el paso: lleva la placa relevante al borde superior del área que
 * hace scroll y recorta a la altura pedida, para que la imagen enseñe eso y no
 * media pantalla vacía. Sin `foco`, captura la pantalla entera.
 */
const foto = async (titulo, { foco, alto = 560, y } = {}) => {
  if (foco) {
    await p.locator('.plate').filter({ has: p.locator('.eyebrow', { hasText: foco }) })
      .first().evaluate((el) => el.scrollIntoView({ block: 'start' }))
    await p.waitForTimeout(350)
  } else if (y != null) {
    await p.locator('.scroll').evaluate((e, y) => e.scrollTo(0, y), y)
    await p.waitForTimeout(300)
  }
  const clip = alto ? { x: 0, y: 0, width: 390, height: alto } : undefined
  const nombre = `${String(++n).padStart(2, '0')}-${titulo}`
  await p.screenshot({ path: `${WEB}/${nombre}.jpg`, type: 'jpeg', quality: 82, clip })
  console.log(`${String(n).padStart(2, '0')}. ${titulo}`)
}

const plate = (t) => p.locator('.plate').filter({ has: p.locator('.eyebrow', { hasText: t }) })
const campo = (t) => plate('Ataques').locator(`[aria-label="${t}"]`).first()
const pick = async (label, value) => {
  await p.getByLabel(label, { exact: true }).selectOption(value)
  await p.waitForTimeout(350)
}

// 1 — La app recién abierta trae a Âreen de ejemplo.
await ir('hero')
await foto('app-recien-abierta', { alto: 0 })

// 2 — Ficha: arriba del todo está "Personaje nuevo".
await ir('sheet')
await foto('ficha-personaje-nuevo', { foco: 'Personaje nuevo', alto: 470 })

// 3 — Eliges Monje y te pide confirmación, porque reemplaza lo que haya.
await plate('Personaje nuevo').getByRole('button', { name: 'Monje', exact: true }).click()
await p.waitForTimeout(300)
await foto('elegir-clase', { foco: 'Personaje nuevo', alto: 470 })

// 4 — Hoja en blanco, con el array estándar ya repartido para un monje.
await plate('Personaje nuevo').getByRole('button', { name: 'Confirmar: Monje' }).click()
await p.waitForTimeout(600)
await foto('hoja-en-blanco', { foco: 'Características', alto: 620 })

// 5 — Nombre y lema.
await ir('sheet')
await p.getByLabel('Nombre', { exact: true }).fill('Kalvys Emberfoot')
await p.getByLabel('Lema o descripción', { exact: true }).fill('El monasterio le enseñó a curar. La calle, a cuándo no hacerlo.')
await p.waitForTimeout(400)
await foto('poner-nombre', { foco: 'Identidad', alto: 620 })

// 6 — Raza: tiflin. No abre desplegable de linaje, y explica el bono que da.
await pick('Raza', 'tiefling')
await foto('elegir-raza', { foco: 'Linaje', alto: 540 })

// 7 — Tradición monástica, que es lo que se elige justo en el nivel 3.
await ir('sheet')
await pick('Tradición monástica', 'mercy')
await foto('elegir-tradicion', { foco: 'Clase', alto: 700 })

// 8 — Características: mover puntos hacia Destreza y Sabiduría.
await ir('sheet')
const mover = async (abbr, dir, veces) => {
  for (let i = 0; i < veces; i++) { await p.getByLabel(`${dir} ${abbr}`).click(); await p.waitForTimeout(90) }
}
await mover('Carisma', 'Bajar', 2)
await mover('Inteligencia', 'Bajar', 2)
await mover('Sabiduría', 'Subir', 1)
await mover('Constitución', 'Subir', 1)
await p.waitForTimeout(400)
await foto('caracteristicas', { foco: 'Características', alto: 560 })

// 9 — Competencias: dos de la lista del monje, dos del trasfondo.
await ir('sheet')
for (const sk of ['Acrobacias', 'Sigilo', 'Perspicacia', 'Religión']) {
  await plate('Competencias').getByRole('button', { name: sk, exact: true }).click()
  await p.waitForTimeout(120)
}
await foto('competencias', { foco: 'Competencias', alto: 620 })

// 10 — Defensa: sin armadura, que es como pelea un monje.
await ir('sheet')
await foto('defensa', { foco: 'Defensa', alto: 600 })

// 11 — Ataques: el golpe sin armas, con Destreza por Artes Marciales.
await ir('sheet')
await plate('Ataques').getByRole('button', { name: 'Añadir ataque' }).click()
await p.waitForTimeout(400)
await campo('Nombre del ataque').fill('Golpe sin armas')
await campo('Dados de daño').fill('1d4')
await campo('Tipo de daño').fill('Contundente')
await campo('Característica del ataque').selectOption('dex')
await campo('Notas').fill('Artes Marciales: usas Destreza')
await p.waitForTimeout(400)
await foto('ataques', { foco: 'Ataques', alto: 700 })

// 12, 13, 14 — El resultado en las tres pestañas de uso.
await ir('hero')
await foto('resultado-heroe', { alto: 0 })
await ir('combat')
await foto('resultado-combate', { alto: 0 })
await ir('traits')
await foto('resultado-rasgos', { alto: 0 })

// 15 a 18 — El diario, con contenido de ejemplo para que se vea de qué va.
await ir('journal')
for (const [t, cuerpo] of [
  ['El sello de la puerta', 'Tres runas: fuego, luna y una tercera borrada. El herrero dijo que no la tocáramos hasta hablar con la archivista.'],
  ['Deuda con Maryse', 'Nos adelantó 40 po para el pasaje. Quiere el anillo del capitán, no monedas.'],
  ['La voz del pozo', 'Habla en dracónico antiguo. Solo responde de noche.'],
]) {
  await plate('Notas').getByRole('button', { name: 'Nueva nota' }).click()
  await p.waitForTimeout(300)
  await p.getByLabel('Título de la nota').fill(t)
  await p.getByLabel('Contenido de la nota').fill(cuerpo)
  await p.waitForTimeout(250)
  await p.locator('.entry-head').first().click()
  await p.waitForTimeout(200)
}
await foto('notas', { foco: 'Notas', alto: 620 })

await p.getByRole('button', { name: /^Bitácora/ }).click()
await p.waitForTimeout(400)
for (const [fecha, t, cuerpo] of [
  ['2026-02-07', 'La cripta bajo el molino', 'Bajamos por el pozo seco. Kalvys curó a Âreen dos veces antes de llegar al fondo. Encontramos el sello y, por una vez, no lo tocamos.'],
  ['2026-02-21', 'El mercado de Vhel', 'Maryse nos encontró antes de que la encontráramos.'],
]) {
  await plate('Bitácora').getByRole('button', { name: 'Anotar la sesión de hoy' }).click()
  await p.waitForTimeout(300)
  await p.getByLabel('Fecha de la sesión').fill(fecha)
  await p.getByLabel('Título de la sesión').fill(t)
  await p.getByLabel('Relato de la sesión').fill(cuerpo)
  await p.waitForTimeout(250)
  await p.locator('.entry-head').first().click()
  await p.waitForTimeout(200)
}
await foto('bitacora', { foco: 'Bitácora', alto: 620 })

await p.getByRole('button', { name: /^Galería/ }).click()
await p.waitForTimeout(400)
await p.setInputFiles('input[type=file][accept="image/*"]', [
  'references/portrait-limpio.png',
  'tests/screenshots/sub-glory.png',
  'src/assets/sigil.png',
  'tests/screenshots/party-monk-combat.png',
])
await p.waitForTimeout(4500)
await foto('galeria', { foco: 'Galería', alto: 620 })

await ir('sheet')
await p.waitForTimeout(1500)
await foto('datos', { foco: 'Tus datos', alto: 700 })

const resumen = await p.evaluate(() => ({
  cabecera: document.querySelector('.topbar-sub')?.textContent,
  nombre: document.querySelector('.topbar-name')?.textContent,
}))
console.log('\nResultado:', resumen.nombre, '—', resumen.cabecera)
if (errs.length) { console.log('✗ ERRORES:', errs.slice(0, 3)); process.exitCode = 1 }
await b.close()
stop()
