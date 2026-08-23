import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { preview } from './serve.mjs'

/**
 * La galería con fotos como las de un teléfono de verdad, y con los navegadores
 * portándose mal como se portan en móviles. El fallo original era mudo: toBlob
 * no llamaba nunca de vuelta y la app se quedaba en "Guardando…" para siempre.
 */
const dir = mkdtempSync(join(tmpdir(), 'fotos-'))
execFileSync('python3', ['-c', `
from PIL import Image
d = '${dir}'
grande = Image.new('RGB', (4032, 3024))
px = grande.load()
for y in range(0, 3024, 8):
    for x in range(0, 4032, 8):
        c = ((x*3)%255, (y*5)%255, ((x+y)*2)%255)
        for dy in range(8):
            for dx in range(8):
                if x+dx < 4032 and y+dy < 3024: px[x+dx, y+dy] = c
grande.save(d + '/camara.jpg', quality=92)
vertical = grande.resize((1600, 1200))
exif = vertical.getexif(); exif[274] = 6
vertical.save(d + '/vertical.jpg', quality=88, exif=exif)
`], { stdio: 'inherit' })

const camara = { name: 'IMG_0421.jpg', mimeType: 'image/jpeg', buffer: readFileSync(join(dir, 'camara.jpg')) }
const vertical = { name: 'IMG_0422.jpg', mimeType: 'image/jpeg', buffer: readFileSync(join(dir, 'vertical.jpg')) }
const sinTipo = { name: 'IMG_0423.jpg', mimeType: '', buffer: readFileSync(join(dir, 'vertical.jpg')) }

const { url, stop } = await preview()
let fails = 0
const check = (l, ok, extra = '') => { if (!ok) { fails++; console.log(`  ✗ ${l} ${extra}`) } else console.log(`  ✓ ${l}`) }

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })

/** Sube archivos con el navegador saboteado y devuelve qué pasó. */
async function subir(guion, archivos, limiteMs = 25000) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  const p = await ctx.newPage()
  if (guion) await p.addInitScript(guion)
  await p.goto(`${url}#journal`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.getByRole('button', { name: /^Galería/ }).click()
  await p.waitForTimeout(300)
  const t0 = Date.now()
  await p.locator('input[type=file][accept="image/*"]').setInputFiles(archivos)
  const colgado = await p.waitForFunction(
    () => !document.body.innerText.includes('GUARDANDO'), { timeout: limiteMs },
  ).then(() => false).catch(() => true)
  const g = p.locator('.plate').filter({ has: p.locator('.eyebrow', { hasText: 'Galería' }) })
  const r = {
    guardadas: await p.locator('.shot-img img').count(),
    segundos: (Date.now() - t0) / 1000,
    colgado,
    dims: await p.locator('.shot-img img').first().evaluate((i) => `${i.naturalWidth}×${i.naturalHeight}`).catch(() => null),
    aviso: (await g.locator('.field-hint').allInnerTexts()).find((t) => t.includes('No se') || t.includes('Se guardaron')) ?? '',
  }
  await ctx.close()
  return r
}

console.log('\nFotos como las que da un teléfono')
{
  const r = await subir(null, [camara])
  check('una foto de 12 megapíxeles entra', r.guardadas === 1, JSON.stringify(r))
  check('y se reduce a 1600 píxeles', r.dims === '1600×1200', r.dims)
}
{
  const r = await subir(null, [vertical])
  check('una foto vertical se guarda derecha, no tumbada', r.dims === '1200×1600', r.dims)
}
{
  const r = await subir(null, [sinTipo])
  check('un archivo sin tipo MIME también entra', r.guardadas === 1, r.aviso)
}
{
  const r = await subir(null, [camara, vertical])
  check('varias a la vez', r.guardadas === 2, JSON.stringify(r))
}

console.log('\nNavegadores de móvil portándose mal')
{
  // El fallo original: la app se quedaba en "Guardando…" y no aparecía nada.
  const r = await subir(() => { HTMLCanvasElement.prototype.toBlob = function () {} }, [vertical])
  check('si toBlob no responde nunca, la app se recupera sola', !r.colgado && r.guardadas === 1, JSON.stringify(r))
  check('y no tarda más de lo razonable', r.segundos < 15, `${r.segundos}s`)
}
{
  const r = await subir(() => { HTMLCanvasElement.prototype.toBlob = function () { throw new Error('no') } }, [vertical])
  check('si toBlob revienta, tira de toDataURL', r.guardadas === 1, JSON.stringify(r))
}
{
  const r = await subir(() => { delete window.createImageBitmap }, [vertical])
  check('sin createImageBitmap, tira de <img>', r.guardadas === 1, JSON.stringify(r))
  check('y sigue respetando la orientación', r.dims === '1200×1600', r.dims)
}
{
  const r = await subir(() => { window.createImageBitmap = () => Promise.reject(new Error('formato desconocido')) }, [vertical])
  check('si el formato no se entiende, cae al respaldo', r.guardadas === 1, JSON.stringify(r))
}

console.log('\nCuando de verdad no se puede, lo dice')
{
  const r = await subir(() => {
    delete window.createImageBitmap
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      set() { setTimeout(() => this.onerror?.(new Event('error')), 10) },
    })
  }, [vertical])
  check('no se queda callada', r.guardadas === 0 && r.aviso.length > 0, JSON.stringify(r))
  check('y explica el motivo', r.aviso.includes('no supo abrir'), r.aviso)
  check('sin dejar el botón bloqueado', !r.colgado)
}
{
  const r = await subir(() => {
    let n = 0
    const original = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (cb, ...resto) {
      // La primera falla, la segunda va: como cuando la memoria anda justa.
      if (n++ === 0) return cb(null)
      return original.call(this, cb, ...resto)
    }
  }, [vertical, camara])
  check('un fallo suelto no arrastra a las demás', r.guardadas >= 1, JSON.stringify(r))
}

console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ La galería aguanta fotos reales y navegadores difíciles\n')
await b.close()
stop()
process.exit(fails ? 1 : 0)
