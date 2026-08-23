import { chromium } from 'playwright-core'
import { preview } from './serve.mjs'

const { stop: stopPreview } = await preview()
const OUT = 'tests/screenshots'
const tabs = process.argv[2] ? [process.argv[2]] : ['hero', 'combat', 'spells', 'traits', 'sheet']
const full = process.argv[3] === 'full'

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

for (const t of tabs) {
  await page.goto(`http://127.0.0.1:4173/#${t}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const m = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    docScrollW: document.documentElement.scrollWidth,
    bodyScrollW: document.body.scrollWidth,
    appW: document.querySelector('.app')?.getBoundingClientRect().width,
    wide: [...document.querySelectorAll('*')]
      .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1)
      .slice(0, 8)
      .map((e) => `${e.tagName}.${e.className || ''}`.slice(0, 60) + ' → ' + Math.round(e.getBoundingClientRect().right)),
  }))
  console.log(t, JSON.stringify(m))
  await page.screenshot({ path: `${OUT}/pw-${t}.png`, fullPage: full })
}
if (errors.length) console.log('CONSOLE ERRORS:', errors.slice(0, 6))
await browser.close()
stopPreview()
