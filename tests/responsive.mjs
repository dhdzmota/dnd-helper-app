import { chromium } from 'playwright-core'
import { preview } from './serve.mjs'

const { stop: stopPreview } = await preview()
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
let fails = 0
// Un nombre largo es el caso que rompe la barra superior; probarlo siempre.
const NOMBRE_LARGO = 'Âreen Velthar de la Orden del Alba Perpetua'

for (const w of [320, 360, 390, 430, 768, 1280]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 800 }, hasTouch: w < 700 })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
  await p.evaluate((name) => {
    const k = 'areen-velthar-companion:v1'
    localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k)), name }))
  }, NOMBRE_LARGO)
  for (const t of ['hero', 'combat', 'spells', 'traits', 'sheet']) {
    await p.goto(`http://127.0.0.1:4173/?w=${w}${t}#${t}`, { waitUntil: 'networkidle' })
    await p.waitForTimeout(300)
    // Si el viewport no es el que pedimos, la prueba no está midiendo nada.
    const real = await p.evaluate(() => window.innerWidth)
    if (real !== w) { fails++; console.log(`✗ ${w}px: el navegador reporta ${real}px, la medición no vale`); break }
    const r = await p.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      offenders: [...document.querySelectorAll('*')]
        .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1)
        .slice(0, 3).map((e) => `${e.tagName}.${e.className}`.slice(0, 50)),
      restsClipped: (() => {
        const r = document.querySelector('.rests')?.getBoundingClientRect()
        return !!r && r.right > window.innerWidth + 1
      })(),
      smallTaps: [...document.querySelectorAll('button')]
        .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.height < 24 || b.width < 24) })
        .slice(0, 3).map((e) => `${e.className}:${Math.round(e.getBoundingClientRect().height)}x${Math.round(e.getBoundingClientRect().width)}`),
    }))
    if (r.overflow || r.smallTaps.length || r.restsClipped) { fails++; console.log(`✗ ${w}px #${t}`, JSON.stringify(r)) }
  }
  await ctx.close()
}
console.log(fails === 0
  ? '✓ Sin desbordes, recortes ni objetivos táctiles pequeños en 320–1280px, con nombre largo'
  : `✗ ${fails} problema(s)`)
if (fails) process.exitCode = 1
await b.close()
stopPreview()
