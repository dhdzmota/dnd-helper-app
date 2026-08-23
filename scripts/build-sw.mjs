/**
 * Inyecta en dist/sw.js la lista real de archivos construidos, para que la
 * primera visita deje todo en caché y la app funcione sin señal desde el minuto uno.
 * Se ejecuta después de `vite build`.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, posix, relative, sep } from 'node:path'

const DIST = 'dist'

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const files = walk(DIST)
  .map((f) => './' + relative(DIST, f).split(sep).join(posix.sep))
  .filter((f) => f !== './sw.js')
  .sort()

// El nombre de la caché cambia con el contenido, así que un despliegue nuevo
// invalida el anterior sin dejar restos.
const hash = createHash('sha256')
for (const f of files) hash.update(readFileSync(join(DIST, f.slice(2))))
const version = hash.digest('hex').slice(0, 8)

const swPath = join(DIST, 'sw.js')
let sw = readFileSync(swPath, 'utf8')

const precache = ['./', ...files]
sw = sw.replace(/const CACHE = '[^']*'/, `const CACHE = 'areen-${version}'`)
sw = sw.replace(/const SHELL = \[[^\]]*\]/s, `const SHELL = ${JSON.stringify(precache, null, 2)}`)

if (!sw.includes(version)) throw new Error('No se pudo inyectar la versión de caché en sw.js')
writeFileSync(swPath, sw)
console.log(`sw.js — caché areen-${version}, ${precache.length} archivos precargados`)
