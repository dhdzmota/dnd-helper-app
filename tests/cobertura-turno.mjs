import { readFileSync, readdirSync } from 'node:fs'

/**
 * La red de seguridad de «Tu turno».
 *
 * El fallo que motivó esta prueba: el Arma de aliento del dracónido existía en
 * los datos pero no salía en la ayuda de combate, porque la ayuda se alimentaba
 * de una lista escrita a mano en vez de los datos. Ahora cada rasgo, dote o
 * reserva que se usa en un turno lleva un campo `turno`, y esto recorre los
 * archivos de datos y falla si alguno describe un coste de acción sin llevarlo.
 *
 * Así, cuando alguien añada una clase o un rasgo nuevo, la prueba le dirá que
 * falta anotarlo en vez de que el jugador lo descubra en mitad de una partida.
 */
let fails = 0
const check = (l, ok, extra = '') => { if (!ok) { fails++; console.log(`  ✗ ${l} ${extra}`) } else console.log(`  ✓ ${l}`) }

const archivos = ['src/data/races.ts', 'src/data/feats.ts']
  .concat(readdirSync('src/data/classes').map((f) => `src/data/classes/${f}`))

// Reservas que son solo un depósito de puntos: lo que se hace con ellas ya sale
// con su propio nombre, así que no deben aparecer como opción de turno.
const SIN_TURNO = new Set(['Ki', 'Poder Psiónico'])

const slotEsperado = (t) => {
  if (/acci[oó]n adicional/i.test(t)) return 'adicional'
  if (/tu reacci[oó]n|como reacci[oó]n/i.test(t)) return 'reaccion'
  if (/con una acci[oó]n|como acci[oó]n|usas tu acci[oó]n|acci[oó]n para/i.test(t)) return 'accion'
  return null
}

const OBJ = /\{[^{}]*?name:\s*'((?:[^'\\]|\\.)+)'[^{}]*?(?:text|detail):\s*'((?:[^'\\]|\\.)*)'[^{}]*?\}/gs

console.log('\nTodo lo que cuesta una acción está anotado')
const faltan = []
const anotados = []
for (const f of archivos) {
  const s = readFileSync(f, 'utf8')
  for (const m of s.matchAll(OBJ)) {
    const [bloque, nombre, texto] = m
    const tiene = /turno:\s*'(\w+)'/.exec(bloque)
    if (tiene) anotados.push(nombre)
    if (SIN_TURNO.has(nombre)) {
      check(`«${nombre}» se queda fuera a propósito: es solo una reserva`, !tiene)
      continue
    }
    if (slotEsperado(texto) && !tiene) faltan.push(`${nombre} (${f.split('/').pop()})`)
  }
}
check('ningún rasgo, dote ni reserva se queda sin su apartado de turno',
  faltan.length === 0, faltan.join(', '))
check('y hay una cantidad razonable anotada', anotados.length >= 60, String(anotados.length))

console.log('\nLos apartados son los que la app conoce')
const validos = new Set(['movimiento', 'accion', 'adicional', 'reaccion', 'gratis'])
const malos = []
for (const f of archivos) {
  for (const m of readFileSync(f, 'utf8').matchAll(/turno:\s*'(\w+)'/g)) {
    if (!validos.has(m[1])) malos.push(`${m[1]} en ${f}`)
  }
}
check('sin apartados inventados', malos.length === 0, malos.join(', '))

console.log('\nEl catálogo a mano se queda en lo que no sale de los datos')
const turno = readFileSync('src/data/turn.ts', 'utf8')
const clase = turno.slice(turno.indexOf('MOVES_CLASE'))
const aMano = [...clase.matchAll(/id: '([a-z-]+)', name: '([^']+)'/g)].map((m) => m[2])
check('son pocas y con motivo', aMano.length <= 8, `${aMano.length}: ${aMano.join(', ')}`)
for (const n of aMano) {
  check(`«${n}» no está duplicado en los datos de clase`,
    !anotados.includes(n), 'saldría dos veces en la lista')
}

console.log('\nCada reserva dice en qué se gasta')
const { CLASSES } = await import('../node_modules/.tmp/clases.mjs')
const huerfanas = []
const sinEnlazar = []
for (const cl of CLASSES) {
  const subs = cl.subclasses
  const feats = [...cl.features, ...subs.flatMap((x) => x.features)]
  const grupos = [...(cl.choiceGroups ?? []), ...subs.flatMap((x) => x.choiceGroups ?? [])]
  const recursos = [...(cl.resources ?? []), ...subs.flatMap((x) => x.resources ?? [])]

  for (const r of recursos) {
    // Un rasgo llamado «Reserva: Efecto» tiene que poder encontrar su reserva.
    const hijos = feats.filter((f) => f.name.startsWith(`${r.name}: `))
    const grupo = grupos.find((g) => g.resourceId === r.id)
    // Una reserva cuyo detalle no dice qué hacer necesita colgar de algo.
    const detalleVago = /alimenta|se gasta en|para tus rasgos/i.test(r.detail)
    const nombrados = (r.alimenta ?? []).filter((n) => feats.some((f) => f.name === n))
    if (detalleVago && hijos.length === 0 && !grupo && nombrados.length === 0) {
      huerfanas.push(`${cl.name}: ${r.name} — "${r.detail}"`)
    }
  }
  // Un grupo de elección que se paga con puntos debe decir con cuáles.
  for (const g of grupos) {
    const pagaConPuntos = /punto/i.test(g.hint) || g.options.some((o) => /punto[s]? de (ki|hechicer)/i.test(o.text))
    if (pagaConPuntos && !g.resourceId) sinEnlazar.push(`${cl.name}: ${g.label}`)
    if (g.resourceId && !recursos.some((r) => r.id === g.resourceId)) {
      sinEnlazar.push(`${cl.name}: ${g.label} apunta a una reserva que no existe (${g.resourceId})`)
    }
  }
}
check('ninguna reserva se queda diciendo solo «alimenta un efecto»',
  huerfanas.length === 0, huerfanas.join(' | '))
check('los grupos que se pagan con puntos saben de qué reserva salen',
  sinEnlazar.length === 0, sinEnlazar.join(' | '))

const fantasmas = []
for (const cl of CLASSES) {
  const feats = [...cl.features, ...cl.subclasses.flatMap((x) => x.features)]
  for (const r of [...(cl.resources ?? []), ...cl.subclasses.flatMap((x) => x.resources ?? [])]) {
    for (const n of r.alimenta ?? []) {
      if (!feats.some((f) => f.name === n)) fantasmas.push(`${cl.name}: ${r.name} → «${n}»`)
    }
  }
}
check('y lo que una reserva dice alimentar existe de verdad', fantasmas.length === 0, fantasmas.join(' | '))

// Los efectos del juramento existen para los cuatro juramentos, no solo el mío.
const paladin = CLASSES.find((x) => x.id === 'paladin')
for (const jur of paladin.subclasses) {
  const propios = jur.features.filter((f) => f.name.startsWith('Canalizar Divinidad: '))
  check(`${jur.name} trae sus efectos de Canalizar Divinidad`, propios.length >= 1,
    `tiene ${propios.length}`)
  for (const f of propios) {
    check(`  «${f.name.slice(21)}» explica qué hace`, f.text.length > 60)
  }
}

console.log(fails ? `\n✗ ${fails} fallo(s)\n` : '\n✓ Nada con coste de acción se queda fuera, y cada reserva dice en qué se gasta\n')
process.exit(fails ? 1 : 0)
