/**
 * Genera las pantallas de arranque que iOS pide para una app en la pantalla de
 * inicio. Sin ellas, Safari muestra un destello blanco antes de abrir la app,
 * que en un tema oscuro canta mucho.
 *
 * Necesita Python con Pillow, que ya se usa para el resto de imágenes.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

/** Tamaños de iPhone en uso, con su tamaño lógico y su densidad. */
const PANTALLAS = [
  { w: 1290, h: 2796, cssW: 430, cssH: 932, dpr: 3 },
  { w: 1179, h: 2556, cssW: 393, cssH: 852, dpr: 3 },
  { w: 1284, h: 2778, cssW: 428, cssH: 926, dpr: 3 },
  { w: 1170, h: 2532, cssW: 390, cssH: 844, dpr: 3 },
  { w: 1125, h: 2436, cssW: 375, cssH: 812, dpr: 3 },
  { w: 1242, h: 2688, cssW: 414, cssH: 896, dpr: 3 },
  { w: 828, h: 1792, cssW: 414, cssH: 896, dpr: 2 },
  { w: 1242, h: 2208, cssW: 414, cssH: 736, dpr: 3 },
  { w: 750, h: 1334, cssW: 375, cssH: 667, dpr: 2 },
  { w: 640, h: 1136, cssW: 320, cssH: 568, dpr: 2 },
]

const python = `
from PIL import Image
import sys, json
sello = Image.open('src/assets/sigil.png').convert('RGBA')
for w, h in json.loads(sys.argv[1]):
    lienzo = Image.new('RGB', (w, h), (8, 9, 10))
    lado = int(min(w, h) * 0.30)
    s = sello.resize((lado, lado), Image.LANCZOS)
    lienzo.paste(s, ((w - lado) // 2, (h - lado) // 2), s)
    lienzo.save(f'public/splash-{w}x{h}.png', optimize=True)
`
execFileSync('python3', ['-c', python, JSON.stringify(PANTALLAS.map((p) => [p.w, p.h]))], { stdio: 'inherit' })

const enlaces = PANTALLAS.map((p) =>
  `    <link rel="apple-touch-startup-image" href="./splash-${p.w}x${p.h}.png"` +
  ` media="(device-width: ${p.cssW}px) and (device-height: ${p.cssH}px)` +
  ` and (-webkit-device-pixel-ratio: ${p.dpr}) and (orientation: portrait)" />`
).join('\n')

writeFileSync('scripts/ios-splash-links.html', enlaces + '\n')
console.log(`${PANTALLAS.length} pantallas de arranque generadas`)
