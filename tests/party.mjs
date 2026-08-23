import { chromium } from 'playwright-core'
import { preview } from './serve.mjs'

/** Monta cada personaje de la mesa y captura sus pantallas. */
const { url, stop: stopPreview } = await preview()
const OUT = 'tests/screenshots'
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })

const PARTY = [
  { file: 'sorcerer', classId: 'sorcerer', subclassId: 'draconic', raceId: 'dragonborn', branchId: 'white',
    name: 'Hechicero de hielo', scores: { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 15 },
    armorId: 'none', shield: false,
    cantripIds: ['ray-of-frost', 'fire-bolt', 'prestidigitation', 'minor-illusion'],
    preparedSpellIds: ['chromatic-orb', 'shield', 'magic-missile', 'mirror-image'],
    choices: { 'dragon-ancestor': ['white'], metamagic: ['quickened', 'twinned'] },
    tabs: ['spells', 'traits'] },
  { file: 'rogue', classId: 'rogue', subclassId: 'arcane-trickster', raceId: 'tiefling', branchId: null,
    name: 'Pícaro tiflin', scores: { str: 10, dex: 15, con: 13, int: 14, wis: 12, cha: 8 },
    armorId: 'studded', shield: false,
    skillProfs: ['stealth', 'sleightOfHand', 'perception', 'deception'], expertise: ['stealth', 'sleightOfHand'],
    cantripIds: ['minor-illusion', 'prestidigitation'],
    preparedSpellIds: ['disguise-self', 'silent-image', 'sleep'],
    tabs: ['combat', 'spells'] },
  { file: 'monk', classId: 'monk', subclassId: 'open-hand', raceId: 'tiefling', branchId: null,
    name: 'Monje tiflin', scores: { str: 12, dex: 15, con: 13, int: 8, wis: 14, cha: 10 },
    armorId: 'none', shield: false,
    skillProfs: ['acrobatics', 'stealth'],
    tabs: ['combat', 'traits'] },
]

for (const p of PARTY) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))

  const { file, tabs, ...patch } = p
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate((patch) => {
    const k = 'areen-velthar-companion:v1'
    const c = JSON.parse(localStorage.getItem(k))
    localStorage.setItem(k, JSON.stringify({ ...c, ...patch, portrait: null, notes: '', hpCurrent: 99, usesSpent: {}, slotsUsed: [0,0,0,0,0,0,0,0,0] }))
  }, patch)

  for (const t of tabs) {
    await page.goto(`${url}?v=${file}${t}#${t}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    await page.screenshot({ path: `${OUT}/party-${file}-${t}.png` })
  }
  const head = await page.locator('.topbar-sub').innerText()
  console.log(`${p.name.padEnd(20)} ${head}${errs.length ? '  ERRORES: ' + errs.slice(0, 2) : ''}`)
  await ctx.close()
}
await b.close()
stopPreview()
