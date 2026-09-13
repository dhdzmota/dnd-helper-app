/**
 * Lo que este personaje puede hacer ahora mismo.
 *
 * Cruza el catálogo de `src/data/turn.ts` con la ficha: quita lo que todavía no
 * tiene por nivel o por clase, añade sus armas y sus conjuros, y marca como
 * agotado lo que ya se gastó. Si un hechicero se quedó sin espacios, sus
 * conjuros salen tachados con el motivo, no desaparecen: quien está aprendiendo
 * necesita ver que existen y por qué hoy no puede.
 */
import { FEAT_BY_ID } from '../data/feats'
import { SPELL_BY_ID } from '../data/spells'
import { MOVES, SLOT_INFO, TURN_SLOTS, type MoveCost, type TurnMove, type TurnSlot } from '../data/turn'
import type { Derived } from './derived'
import type { Character } from './types'

export interface TurnOption {
  id: string
  name: string
  en: string
  slot: TurnSlot
  text: string
  /** Falso cuando ya no queda: el motivo va en `motivo`. */
  disponible: boolean
  motivo: string | null
  /** «3 de 3», «12 puntos», «espacio de nivel 1». Lo que queda, en corto. */
  restante: string | null
  /** Qué gastar al pulsarlo, si se puede gastar desde aquí. */
  gasto: { kind: 'recurso'; id: string; n: number } | { kind: 'espacio'; level: number } | null
  /** Números propios de la opción: el bono de ataque, el daño, el alcance. */
  datos: string | null
  /** Lo concreto que se puede hacer, cuando la opción es una reserva. */
  opciones: { name: string; text: string }[]
  destacada: boolean
  /** Posición de fábrica dentro de su apartado, cuando el jugador no ha ordenado. */
  rango: number
}

export interface TurnSection {
  slot: TurnSlot
  name: string
  en: string
  hint: string
  options: TurnOption[]
}

const noQueda = (m: TurnMove) => `Ya no te quedan usos de ${m.name.toLowerCase()}.`

/** Espacios libres por nivel, índice 0 = nivel 1. */
const librePorNivel = (c: Character, d: Derived) =>
  d.casting.slotsMax.map((max, i) => Math.max(0, max - (c.slotsUsed[i] ?? 0)))

/** El espacio libre más bajo que sirva para algo de este nivel. */
const espacioMasBajo = (c: Character, d: Derived, minLevel: number): number | null => {
  const libres = librePorNivel(c, d)
  for (let i = minLevel - 1; i < libres.length; i++) if (libres[i] > 0) return i + 1
  return null
}

function evaluarCoste(cost: MoveCost | undefined, m: TurnMove, c: Character, d: Derived) {
  if (!cost || cost.kind === 'ninguno' || cost.kind === 'turno') {
    return { disponible: true, motivo: null, restante: null, gasto: null as TurnOption['gasto'] }
  }
  if (cost.kind === 'recurso') {
    const r = d.resources.find((x) => x.id === cost.id)
    if (!r) return { disponible: true, motivo: null, restante: null, gasto: null as TurnOption['gasto'] }
    const quedan = r.max - r.spent
    return {
      disponible: quedan >= cost.n,
      motivo: quedan >= cost.n ? null : noQueda(m),
      restante: r.kind === 'pool' ? `${quedan} puntos` : `${quedan} de ${r.max}`,
      gasto: quedan >= cost.n
        ? ({ kind: 'recurso', id: cost.id, n: cost.n } as TurnOption['gasto'])
        : null,
    }
  }
  // Espacio de conjuro
  const nivel = espacioMasBajo(c, d, cost.minLevel)
  const libres = librePorNivel(c, d)
  const total = libres.reduce((n, x) => n + x, 0)
  return {
    disponible: nivel !== null,
    motivo: nivel !== null ? null : 'No te quedan espacios de conjuro. Vuelven con un descanso largo.',
    restante: nivel !== null ? `${total} espacio${total === 1 ? '' : 's'}` : null,
    gasto: nivel !== null ? ({ kind: 'espacio', level: nivel } as TurnOption['gasto']) : null,
  }
}

/**
 * ¿Lleva encima dos armas ligeras? Con una sola no se puede pelear con dos
 * armas, así que se cuentan, no se busca si hay alguna. Sale de la mochila y de
 * los ataques apuntados en la ficha.
 */
const llevaArmaLigera = (c: Character) => {
  const enMochila = c.items
    .filter((i) => /ligera/i.test(i.notes) || /ligera/i.test(i.name))
    .reduce((n, i) => n + i.qty, 0)
  const apuntadas = c.attacks.filter((a) => /ligera/i.test(a.notes)).length
  return enMochila + apuntadas >= 2
}

/** ¿Este personaje tiene siquiera esta opción? */
function pasaElFiltro(m: TurnMove, c: Character, d: Derived): boolean {
  const g = m.gate
  if (!g) return true
  if (g.classes && !g.classes.includes(d.cls.id)) return false
  if (g.level && c.level < g.level) return false
  if (g.subclass && d.subclass?.id !== g.subclass) return false
  if (g.tashas && !c.useTashas) return false
  if (g.armaLigera && !llevaArmaLigera(c)) return false
  return true
}

/**
 * Orden de fábrica dentro de cada apartado. Primero lo que se usa en cada
 * turno, después las armas con sus números, luego el repertorio general y al
 * final los conjuros, que son muchos y ya tienen su propia pestaña.
 */
const RANGO = { atacar: 0, destacada: 10, arma: 20, normal: 40, conjuro: 60 }

export function turnOptions(c: Character, d: Derived): TurnSection[] {
  const opciones: TurnOption[] = []

  for (const m of MOVES) {
    if (!pasaElFiltro(m, c, d)) continue
    // Este se decide al final: sobra en cuanto haya conjuros con nombre propio.
    if (m.id === 'lanzar') continue
    const ev = evaluarCoste(m.cost, m, c, d)
    const base = m.id === 'atacar' ? RANGO.atacar : m.destacada ? RANGO.destacada : RANGO.normal
    opciones.push({
      id: m.id, name: m.name, en: m.en, slot: m.slot, text: m.text,
      disponible: ev.disponible, motivo: ev.motivo, restante: ev.restante, gasto: ev.gasto,
      datos: null, opciones: [],
      destacada: !!m.destacada,
      rango: base + MOVES.indexOf(m) / 1000,
    })
  }

  // ── Lo que sale de los datos: raza, dotes, clase, subclase y reservas ────
  //
  // Todo esto ya viene filtrado por nivel, subclase y si la mesa usa Tasha's,
  // así que lo que no te toca no llega hasta aquí. Se recorre por orden de
  // preferencia y se evita repetir: un mismo nombre puede ser rasgo y reserva
  // a la vez —Imposición de Manos lo es— y gana la versión que sabe contar.
  const vistos = new Set(opciones.map((o) => o.name.toLowerCase()))

  /**
   * La reserva que alimenta a un rasgo. «Imposición de Manos» el rasgo gasta la
   * reserva «Imposición de Manos», y «Canalizar Divinidad: Arma Sagrada» gasta
   * un uso de «Canalizar Divinidad». Sin esto el rasgo saldría sin contador y no
   * habría forma de marcarlo desde aquí.
   */
  const reservaDe = (nombre: string): MoveCost | undefined => {
    const r = d.resources.find((x) => x.name === nombre || nombre.startsWith(`${x.name}: `))
    return r ? { kind: 'recurso', id: r.id, n: 1 } : undefined
  }

  const añadir = (
    nombre: string, en: string, slot: TurnSlot, texto: string,
    cost: MoveCost | undefined, id: string, rango: number,
    sub: { name: string; text: string }[] = [],
  ) => {
    if (vistos.has(nombre.toLowerCase())) return
    vistos.add(nombre.toLowerCase())
    cost = cost ?? reservaDe(nombre)
    const falso = { id, name: nombre, en, slot, text: texto } as TurnMove
    const ev = evaluarCoste(cost, falso, c, d)
    opciones.push({
      id, name: nombre, en, slot, text: texto,
      disponible: ev.disponible, motivo: ev.motivo, restante: ev.restante, gasto: ev.gasto,
      datos: null, opciones: sub, destacada: false, rango,
    })
  }

  // Las reservas primero: son las que saben cuántos usos te quedan.
  d.resources.forEach((r, i) => {
    if (!r.turno) return
    añadir(r.name, r.name, r.turno, r.detail, { kind: 'recurso', id: r.id, n: 1 }, `recurso-${r.id}`, RANGO.destacada + i / 1000, r.opciones)
  })
  // Rasgos raciales: el arma de aliento del dracónido vive aquí.
  d.traits.forEach((t, i) => {
    if (!t.turno) return
    añadir(t.name, t.name, t.turno, t.text, undefined, `rasgo-${t.name}`, RANGO.destacada + 0.1 + i / 1000)
  })
  // Rasgos de clase y de subclase.
  d.features.forEach((f, i) => {
    if (!f.turno) return
    añadir(f.name, f.name, f.turno, f.text, undefined, `clase-${f.name}`, RANGO.normal + 10 + i / 1000)
  })
  // Tu estilo de combate, si el que elegiste se usa en el turno.
  const estilo = d.fightingStyles.find((f) => f.id === c.fightingStyleId)
  if (estilo?.turno) {
    añadir(estilo.name, estilo.name, estilo.turno, estilo.text, undefined, `estilo-${estilo.id}`, RANGO.normal + 20)
  }
  // Tus dotes.
  c.featIds.forEach((id, i) => {
    const f = FEAT_BY_ID[id]
    if (!f?.turno) return
    añadir(f.name, f.en, f.turno, f.text, undefined, `dote-${f.id}`, RANGO.normal + 30 + i / 1000)
  })
  // Lo que elegiste en los grupos de elección: metamagia, disciplinas…
  d.choices.forEach((ch) => {
    for (const opcionId of ch.chosen) {
      const o = ch.group.options.find((x) => x.id === opcionId)
      if (!o?.turno) continue
      añadir(o.name, o.name, o.turno, o.text, undefined, `eleccion-${o.id}`, RANGO.normal + 40)
    }
  })

  // ── Tus armas, con los números ya hechos ─────────────────────────────────
  c.attacks.forEach((a, iArma) => {
    const hit = d.mods[a.ability] + (a.proficient ? d.prof : 0)
    const dmgMod = d.mods[a.ability] + a.damageBonus
    opciones.push({
      id: `arma-${a.id}`,
      name: a.name,
      en: 'Attack',
      slot: 'accion',
      text: a.notes || 'Ataque con arma.',
      disponible: true,
      motivo: null,
      restante: null,
      gasto: null,
      datos: `${hit >= 0 ? '+' : ''}${hit} al ataque · ${a.damage}${dmgMod !== 0 ? (dmgMod > 0 ? `+${dmgMod}` : dmgMod) : ''} ${a.damageType.toLowerCase()}`,
      opciones: [],
      destacada: true,
      rango: RANGO.arma + iArma / 1000,
    })
  })

  // ── Tus conjuros, repartidos según lo que tardan en lanzarse ─────────────
  if (d.casting.active) {
    const ids = [...new Set([...d.casting.grantedIds, ...d.casting.chosenIds, ...c.cantripIds, ...d.casting.fixedCantripIds])]
    for (const id of ids) {
      const sp = SPELL_BY_ID[id]
      if (!sp) continue
      // Un conjuro que tarda un minuto o una hora no se lanza en un turno.
      const slot: TurnSlot | null =
        /acción adicional/i.test(sp.time) ? 'adicional'
          : /reacción/i.test(sp.time) ? 'reaccion'
            : /^1 acción/i.test(sp.time) ? 'accion' : null
      if (!slot) continue

      const truco = sp.level === 0
      const nivel = truco ? null : espacioMasBajo(c, d, sp.level)
      const disponible = truco || nivel !== null
      const libres = librePorNivel(c, d)
      const deSuNivel = libres.slice(sp.level - 1).reduce((n, x) => n + x, 0)

      opciones.push({
        id: `conjuro-${sp.id}`,
        name: sp.name,
        en: sp.en,
        slot,
        text: sp.text,
        disponible,
        motivo: disponible ? null
          : `No te quedan espacios de nivel ${sp.level} o más alto. Vuelven con un descanso largo.`,
        restante: truco ? 'Truco: sin límite' : disponible ? `${deSuNivel} espacio${deSuNivel === 1 ? '' : 's'}` : null,
        gasto: truco || nivel === null ? null : { kind: 'espacio', level: nivel },
        datos: [
          truco ? 'Truco' : `Nivel ${sp.level}`,
          sp.range,
          sp.concentration ? 'Concentración' : null,
        ].filter(Boolean).join(' · '),
        opciones: [],
        destacada: false,
        rango: RANGO.conjuro + sp.level + sp.name.charCodeAt(0) / 1000,
      })
    }
  }

  // Un lanzador sin nada preparado necesita que le digan por qué no ve conjuros.
  if (d.casting.active && !opciones.some((o) => o.id.startsWith('conjuro-'))) {
    const m = MOVES.find((x) => x.id === 'lanzar')!
    opciones.push({
      id: m.id, name: m.name, en: m.en, slot: 'accion',
      text: 'Todavía no tienes ninguno preparado. Se eligen en la pestaña Conjuros.',
      disponible: false,
      motivo: 'Sin conjuros preparados. Elígelos en Conjuros.',
      restante: null, gasto: null, datos: null, opciones: [], destacada: false, rango: RANGO.conjuro,
    })
  }

  // ── Ordenar: manda lo que el jugador haya puesto arriba ──────────────────
  const preferido = c.turnOrder ?? []
  const peso = (o: TurnOption) => {
    const i = preferido.indexOf(o.id)
    return i >= 0 ? i : preferido.length + o.rango
  }

  return TURN_SLOTS.map((slot) => {
    const info = SLOT_INFO[slot]
    const options = opciones
      .filter((o) => o.slot === slot)
      .sort((a, b) => peso(a) - peso(b))
    return { slot, name: info.name, en: info.en, hint: info.hint, options }
  }).filter((s) => s.options.length > 0)
}

/**
 * Sube o baja una opción dentro de su apartado y devuelve el orden completo,
 * listo para guardarlo en la ficha. Se guarda la lista entera —no solo lo
 * movido— para que el orden aguante aunque mañana el catálogo crezca.
 */
export function reordenar(secciones: TurnSection[], id: string, dir: -1 | 1): string[] {
  const out: string[] = []
  for (const sec of secciones) {
    const ids = sec.options.map((o) => o.id)
    const i = ids.indexOf(id)
    if (i >= 0) {
      const j = i + dir
      if (j >= 0 && j < ids.length) { ids[i] = ids[j]; ids[j] = id }
    }
    out.push(...ids)
  }
  return out
}
