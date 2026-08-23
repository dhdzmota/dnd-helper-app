import { chromium } from 'playwright-core'
import { artifactPreview } from './serve.mjs'

/** Comprueba que el fragmento publicable funciona dentro del envoltorio del visor. */
const { url, stop } = await artifactPreview()
let fails = 0
const check = (l, ok, extra = '') => { if (!ok) { fails++; console.log(`  \u2717 ${l} ${extra}`) } else console.log(`  \u2713 ${l}`) }

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
p.on('response', (r) => r.status() >= 400 && errs.push(`HTTP ${r.status()} ${r.url().slice(0, 70)}`))

await p.goto(url, { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)

const info = await p.evaluate(async () => {
  await document.fonts.ready
  return {
    appH: Math.round(document.querySelector('.app')?.getBoundingClientRect().height ?? 0),
    nav: Math.round(document.querySelector('.nav')?.getBoundingClientRect().height ?? 0),
    name: document.querySelector('.portrait-name')?.textContent,
    portrait: (document.querySelector('.portrait-wrap img')?.naturalWidth ?? 0) > 0,
    sigil: (document.querySelector('.sigil')?.naturalWidth ?? 0) > 0,
    fonts: [...new Set([...document.fonts].map((f) => f.family))].sort(),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }
})

check('la app ocupa el alto del visor', info.appH > 700, `(${info.appH}px)`)
check('la barra de pestañas se ve', info.nav > 40)
check('el retrato va incrustado en el archivo', info.portrait)
check('el sello va incrustado en el archivo', info.sigil)
check('el nombre sale del estado guardado', info.name === '\u00c2reen Velthar')
check('las tres tipografías cargan', JSON.stringify(info.fonts) === JSON.stringify(['Cinzel', 'EB Garamond', 'Oswald']), JSON.stringify(info.fonts))
check('el fondo se pinta explícitamente', info.bodyBg === 'rgb(8, 9, 10)', info.bodyBg)
check('no desborda a lo ancho', !info.overflow)

await p.locator('.nav-btn').nth(1).click()
await p.waitForTimeout(400)
await p.locator('.hp-input').fill('7')
await p.getByRole('button', { name: 'Recibir daño' }).click()
check('sigue siendo interactiva dentro del envoltorio', (await p.locator('.hp-cur').innerText()) === '18')

await p.screenshot({ path: 'tests/screenshots/artifact.png' })
if (errs.length) { fails++; console.log('  \u2717 errores:', errs.slice(0, 4)) }
console.log(fails ? `\n\u2717 ${fails} fallo(s)\n` : '\n\u2713 El fragmento publicable funciona en el visor\n')
await b.close()
stop()
process.exit(fails ? 1 : 0)
