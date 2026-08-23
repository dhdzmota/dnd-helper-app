import { chromium } from 'playwright-core'
import { preview } from './serve.mjs'

const { stop: stopPreview } = await preview()
let fails = 0
const check = (l, ok) => { if (!ok) { fails++; console.log(`  ✗ ${l}`) } else console.log(`  ✓ ${l}`) }
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true })
const p = await ctx.newPage()

console.log('\nSin la capacidad del visor (PWA normal): descarga por archivo')
await p.goto('http://127.0.0.1:4173/#sheet', { waitUntil: 'networkidle' })
await p.waitForTimeout(400)
const dl = p.waitForEvent('download', { timeout: 5000 }).catch(() => null)
await p.getByRole('button', { name: 'Ficha y diario' }).click()
const d = await dl
check('descarga un archivo', !!d)
check('con el nombre del personaje y la fecha',
  /^areen-velthar-\d{4}-\d{2}-\d{2}\.json$/.test(d?.suggestedFilename() ?? ''), d?.suggestedFilename())

console.log('\nCon la capacidad del visor: se lo pide al anfitrión')
const p2 = await ctx.newPage()
await p2.addInitScript(() => {
  window.__saved = null
  window.claude = { use: async (n) => (n === 'downloads' ? { save: async (r) => { window.__saved = r; return { status: 'saved' } } } : null) }
})
await p2.goto('http://127.0.0.1:4173/#sheet', { waitUntil: 'networkidle' })
await p2.waitForTimeout(400)
await p2.getByRole('button', { name: 'Ficha y diario' }).click()
await p2.waitForTimeout(400)
const saved = await p2.evaluate(() => window.__saved)
check('usa claude.use("downloads")', !!saved)
check('manda un nombre con fecha', /^areen-velthar-\d{4}-\d{2}-\d{2}\.json$/.test(saved?.filename ?? ''), saved?.filename)
const copia = JSON.parse(saved?.data ?? '{}')
check('la copia se identifica como tal', copia.app === 'areen-companion')
check('lleva la ficha dentro', copia.character?.name === 'Âreen Velthar')
check('y también el diario', !!copia.journal && Array.isArray(copia.journal.notes))
check('sin imágenes en la copia ligera', copia.images === undefined)
check('avisa de que se guardó', (await p2.locator('.field-hint').filter({ hasText: 'Copia guardada' }).count()) === 1)

console.log('\nSi el visor lo rechaza, ofrece el texto')
const p3 = await ctx.newPage()
await p3.addInitScript(() => {
  window.claude = { use: async () => ({ save: async () => { const e = new Error('no'); e.code = 'declined'; throw e } }) }
})
await p3.goto('http://127.0.0.1:4173/#sheet', { waitUntil: 'networkidle' })
await p3.waitForTimeout(400)
await p3.getByRole('button', { name: 'Ficha y diario' }).click()
await p3.waitForTimeout(300)
check('explica que se canceló', (await p3.locator('.field-hint').filter({ hasText: 'Cancelaste' }).count()) === 1)
const ta = p3.locator('textarea[aria-label="Copia en formato JSON"]')
check('y abre el texto sin que haya que pedirlo', await ta.count() === 1)

console.log('\nPegar una copia la restaura')
check('el texto trae la ficha actual', (await ta.inputValue()).includes('Âreen Velthar'))
const actual = JSON.parse(await ta.inputValue())
await ta.fill(JSON.stringify({ ...actual, character: { ...actual.character, name: 'Kaerith', level: 7 } }))
await p3.getByRole('button', { name: 'Restaurar desde este texto' }).click()
await p3.waitForTimeout(400)
check('carga el nombre nuevo', (await p3.locator('.topbar-name').innerText()) === 'Kaerith')
check('y el nivel nuevo', (await p3.locator('.topbar-sub').innerText()).toLowerCase().includes('paladín 7'))

await p3.getByRole('button', { name: 'Copiar o pegar texto' }).click()
await p3.waitForTimeout(200)
await p3.locator('textarea[aria-label="Copia en formato JSON"]').fill('esto no es json')
await p3.getByRole('button', { name: 'Restaurar desde este texto' }).click()
await p3.waitForTimeout(200)
check('rechaza texto inválido con un mensaje claro', (await p3.locator('.field-hint').filter({ hasText: 'no es una copia válida' }).count()) === 1)
check('y no rompe la ficha cargada', (await p3.locator('.topbar-name').innerText()) === 'Kaerith')

console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ Guardar y cargar funcionan en los dos entornos\n')
await b.close()
stopPreview()
process.exit(fails ? 1 : 0)
