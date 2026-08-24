import { chromium } from 'playwright-core'
import { readFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { preview } from './serve.mjs'

/**
 * El retrato acepta fotos de cámara. Antes se guardaba tal cual y una foto
 * grande reventaba la cuota del navegador, y al reventarla se perdía la ficha
 * entera sin decir nada.
 */
const dir = mkdtempSync(join(tmpdir(), 'retrato-'))
execFileSync('python3', ['-c', `
from PIL import Image
import random
random.seed(1)
im = Image.new('RGB', (4032, 3024))
px = im.load()
for y in range(3024):
    for x in range(0, 4032, 2):
        c = (random.randint(0,255), random.randint(0,255), random.randint(0,255))
        px[x,y] = c
        if x+1 < 4032: px[x+1,y] = c
im.save('${dir}/camara.jpg', quality=92)
vert = im.resize((1600,1200))
exif = vert.getexif(); exif[274] = 6
vert.save('${dir}/vertical.jpg', quality=88, exif=exif)
`], { stdio: 'inherit' })

const grande = { name: 'IMG_9001.jpg', mimeType: 'image/jpeg', buffer: readFileSync(join(dir, 'camara.jpg')) }
const vertical = { name: 'IMG_9002.jpg', mimeType: 'image/jpeg', buffer: readFileSync(join(dir, 'vertical.jpg')) }

const { url, stop } = await preview()
let fails = 0
const has = (h, n) => h.toLowerCase().includes(n.toLowerCase())
const check = (l, ok, extra = '') => { if (!ok) { fails++; console.log(`  ✗ ${l} ${extra}`) } else console.log(`  ✓ ${l}`) }

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(String(e).slice(0, 130)))

console.log(`\nUna foto de cámara de ${Math.round(grande.buffer.length / 1024 / 1024)} MB como retrato`)
await p.goto(`${url}#sheet`, { waitUntil: 'networkidle' })
await p.waitForTimeout(900)
await p.locator('input[type=file][accept="image/*"]').setInputFiles([grande])
await p.waitForFunction(() => document.body.innerText.includes('Retrato listo'), { timeout: 20000 }).catch(() => {})
await p.waitForTimeout(600)

const estado = await p.evaluate(() => {
  const raw = localStorage.getItem('areen-velthar-companion:v1')
  let f = null
  try { f = JSON.parse(raw ?? '') } catch {}
  return { fichaKB: raw ? Math.round(raw.length / 1024) : 0, retratoKB: Math.round((f?.portrait ?? '').length / 1024), nombre: f?.name }
})
check('la app dice que quedó listo', has(await p.locator('.field-hint').filter({ hasText: 'Retrato listo' }).innerText(), 'KB'))
check('el retrato se reduce hasta caber holgado', estado.retratoKB > 0 && estado.retratoKB <= 260, `${estado.retratoKB} KB`)
check('la ficha cabe de sobra en el navegador', estado.fichaKB < 500, `${estado.fichaKB} KB`)
check('y sigue siendo la ficha correcta', estado.nombre === 'Âreen Velthar', estado.nombre)
check('sin excepciones de cuota', errs.length === 0, JSON.stringify(errs.slice(0, 2)))

await p.goto(`${url}?v=1#hero`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
const retrato = await p.evaluate(() => {
  const i = document.querySelector('.portrait-wrap img')
  return { ancho: i?.naturalWidth ?? 0, alto: i?.naturalHeight ?? 0 }
})
check('el retrato sobrevive a recargar', retrato.ancho > 0, JSON.stringify(retrato))
check('a un tamaño razonable', Math.max(retrato.ancho, retrato.alto) <= 900 && Math.max(retrato.ancho, retrato.alto) >= 500, JSON.stringify(retrato))

// La foto es horizontal con orientación EXIF 6, o sea "girar 90°": al aplicarla
// tiene que salir vertical. Si se ignorase el EXIF, saldría horizontal.
console.log('\nUna foto con orientación EXIF se guarda derecha')
await p.goto(`${url}?v=2#sheet`, { waitUntil: 'networkidle' })
await p.waitForTimeout(900)
await p.locator('input[type=file][accept="image/*"]').setInputFiles([vertical])
await p.waitForFunction(() => document.body.innerText.includes('Retrato listo'), { timeout: 20000 })
// El guardado va con retardo: navegar antes de tiempo se lleva el cambio por delante.
await p.waitForTimeout(800)
await p.goto(`${url}?v=3#hero`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
const v = await p.evaluate(() => {
  const i = document.querySelector('.portrait-wrap img')
  return { ancho: i?.naturalWidth ?? 0, alto: i?.naturalHeight ?? 0 }
})
check('sale vertical, como se ve en el teléfono', v.alto > v.ancho, JSON.stringify(v))

console.log('\nSi el navegador se pone difícil, lo dice en vez de callarse')
{
  const c2 = await b.newContext({ viewport: { width: 390, height: 844 } })
  const q = await c2.newPage()
  await q.addInitScript(() => {
    delete window.createImageBitmap
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      set() { setTimeout(() => this.onerror?.(new Event('error')), 10) },
    })
  })
  await q.goto(`${url}#sheet`, { waitUntil: 'networkidle' })
  await q.waitForTimeout(900)
  await q.locator('input[type=file][accept="image/*"]').setInputFiles([vertical])
  await q.waitForTimeout(3000)
  const t = await q.locator('.field-hint').allInnerTexts()
  check('explica el motivo', t.some((x) => x.includes('no supo abrir')), JSON.stringify(t.slice(0, 3)))
  await c2.close()
}

console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ El retrato aguanta fotos de cámara\n')
await b.close()
stop()
process.exit(fails ? 1 : 0)
