import { ABILITIES, ABILITY_INFO, SKILLS, modifier, type AbilityKey } from '../data/abilities'
import { ARMOR_BY_ID } from '../data/armor'
import { GEAR_BY_ID, pesoMonedas, totalEnCobre } from '../data/gear'
import type { TurnSlot } from '../data/turn'
import { FEAT_BY_ID } from '../data/feats'
import {
  CLASS_BY_ID, asiLevelsFor, proficiencyBonus, slotsFor,
  type CharClass, type ChoiceGroup, type ClassFeature, type ClassResource,
  type FightingStyle, type ResourceMax, type Subclass, type UnarmoredDefense,
} from '../data/classes'
import { RACE_BY_ID, breathWeaponDice, type DraconicAncestry, type Race, type Subrace, type Trait } from '../data/races'
import { SPELLS, SPELL_BY_ID, spellsOnList, type Spell } from '../data/spells'
import type { Character } from './types'

/**
 * Lo que pesa todo lo que llevas encima y hasta dónde aguantas.
 *
 * Reglas del Manual del Jugador: puedes cargar Fuerza × 15 libras. La regla
 * opcional de sobrecarga —la que casi todas las mesas usan cuando importa—
 * pone dos avisos antes: a Fuerza × 5 vas lento y a Fuerza × 10 vas muy lento.
 */
export interface CargaState {
  /** Libras, con un decimal ya redondeado. */
  peso: number
  /** Desglose: lo de la mochila, la armadura puesta y el peso de las monedas. */
  pesoMochila: number
  pesoArmadura: number
  pesoMonedas: number
  capacidad: number
  sobrecargaLeve: number
  sobrecargaFuerte: number
  /** 'bien' | 'lento' (−10 pies) | 'muy-lento' (−20 pies y desventaja) | 'pasado' */
  estado: 'bien' | 'lento' | 'muy-lento' | 'pasado'
  aviso: string | null
  /** Lo que valdría vender la mochila entera, en piezas de cobre. */
  valorMochila: number
  /** El dinero suelto, en piezas de cobre. */
  dinero: number
}

/** Una de las cosas concretas que se pagan con una reserva. */
export interface ResourceOption {
  name: string
  text: string
  /** Apartado del turno, cuando la opción se usa dentro de un turno. */
  turno?: TurnSlot
}

export interface ResourceState {
  id: string
  name: string
  detail: string
  /** Apartado del turno en que se usa, si se usa en combate. */
  turno?: TurnSlot
  /** Nombres de rasgos que se pagan con ella, cuando no llevan su nombre delante. */
  alimenta?: string[]
  /**
   * Lo que esta reserva te deja hacer: los efectos de tu juramento, la metamagia
   * que elegiste, tus disciplinas. Una reserva que solo dice «alimenta un efecto
   * mágico» no le sirve de nada a quien está aprendiendo.
   */
  opciones: ResourceOption[]
  max: number
  spent: number
  recharge: 'short' | 'long'
  kind: 'uses' | 'pool'
  source: string
}

export interface SmiteOption {
  slotLevel: number
  dice: string
  vsFiend: string
  remaining: number
}

export interface ScalingState {
  id: string
  name: string
  value: string
  detail?: string
}

export interface ChoiceState {
  group: ChoiceGroup
  max: number
  chosen: string[]
}

export interface CastingState {
  active: boolean
  ability: AbilityKey
  /** 'prepared' rebuilds each long rest; 'known' is locked in on level-up. */
  mode: 'prepared' | 'known'
  saveDC: number
  attack: number
  slotsMax: number[]
  maxSpellLevel: number
  /** Prepared limit, or spells-known limit, depending on `mode`. */
  spellLimit: number
  cantripLimit: number
  fixedCantripIds: string[]
  /** Every cantrip this character may pick, from all their sources. */
  cantripPool: Spell[]
  available: Spell[]
  chosenIds: string[]
  grantedIds: string[]
  grantedLabel: string
  note: string
  source: string
}

export interface Derived {
  race: Race
  ancestry: DraconicAncestry | null
  subrace: Subrace | null
  cls: CharClass
  /** Subclasses in scope for the sources in play. */
  subclasses: Subclass[]
  subclass: Subclass | null

  scores: Record<AbilityKey, number>
  racialBonus: Partial<Record<AbilityKey, number>>
  mods: Record<AbilityKey, number>
  prof: number

  maxHp: number
  ac: number
  acSource: string
  initiative: number
  speed: number
  hitDie: number
  hitDiceMax: number

  saves: { key: AbilityKey; mod: number; proficient: boolean }[]
  skills: { key: string; name: string; en: string; ability: AbilityKey; mod: number; proficient: boolean; expertise: boolean }[]
  passivePerception: number
  expertiseMax: number

  carga: CargaState

  casting: CastingState
  smiteOptions: SmiteOption[]
  improvedSmite: boolean

  fightingStyles: FightingStyle[]
  features: ClassFeature[]
  traits: Trait[]
  resources: ResourceState[]
  scalings: ScalingState[]
  choices: ChoiceState[]
  asiLevels: number[]
  asiSlots: number
  featSlotsLeft: number
}

const at = <T,>(table: T[] | undefined, level: number, fallback: T): T =>
  table?.[Math.min(table.length, Math.max(1, level)) - 1] ?? fallback

export function derive(c: Character): Derived {
  const race = RACE_BY_ID[c.raceId] ?? RACE_BY_ID.dragonborn
  const cls = CLASS_BY_ID[c.classId] ?? CLASS_BY_ID.paladin
  const level = Math.min(20, Math.max(1, c.level))

  const ancestry = race.ancestries?.find((a) => a.id === c.branchId) ?? null
  const subrace = race.subraces?.find((s) => s.id === c.branchId) ?? null

  // Los rasgos de Tasha's son opcionales: el DM decide si están en la mesa.
  const inScope = <T extends { source?: string }>(x: T) => c.useTashas || x.source !== 'TCE'
  const subclasses = cls.subclasses.filter(inScope)
  const subclass = level >= cls.subclassLevel ? subclasses.find((s) => s.id === c.subclassId) ?? null : null

  // ── Ability scores ───────────────────────────────────────────────────────
  const racialBonus: Partial<Record<AbilityKey, number>> = { ...race.asi }
  for (const [k, v] of Object.entries(subrace?.asi ?? {})) {
    racialBonus[k as AbilityKey] = (racialBonus[k as AbilityKey] ?? 0) + (v as number)
  }
  const scores = {} as Record<AbilityKey, number>
  const mods = {} as Record<AbilityKey, number>
  for (const a of ABILITIES) {
    scores[a] = Math.min(30, c.scores[a] + (racialBonus[a] ?? 0))
    mods[a] = modifier(scores[a])
  }

  const prof = proficiencyBonus(level)
  const hasFeat = (id: string) => c.featIds.includes(id)

  const fightingStyles = (cls.fightingStyles ?? []).filter(inScope)
  const style = fightingStyles.find((f) => f.id === c.fightingStyleId)

  // ── Hit points ───────────────────────────────────────────────────────────
  const hitDie = cls.hitDie
  let maxHp = hitDie + (level - 1) * (hitDie / 2 + 1) + level * mods.con
  if (hasFeat('tough')) maxHp += level * 2
  if (subrace?.id === 'hill') maxHp += level
  if (subclass?.hpPerLevel) maxHp += level * subclass.hpPerLevel
  maxHp = Math.max(1, maxHp)
  if (c.maxHpOverride != null) maxHp = c.maxHpOverride

  // ── Armour class ─────────────────────────────────────────────────────────
  const armor = ARMOR_BY_ID[c.armorId] ?? ARMOR_BY_ID.none
  const dexApplied = armor.dex === 'full' ? mods.dex : armor.dex === 'max2' ? Math.min(2, mods.dex) : 0
  const defenseStyle = style?.id === 'defense' && armor.id !== 'none' ? 1 : 0
  const shieldBonus = c.shield ? 2 : 0

  let ac = armor.base + dexApplied + shieldBonus + c.acBonus + defenseStyle
  let acSource = [
    `${armor.name} ${armor.base}`,
    dexApplied ? `DES +${dexApplied}` : null,
    shieldBonus ? 'Escudo +2' : null,
    defenseStyle ? 'Defensa +1' : null,
    c.acBonus ? `Otro ${c.acBonus >= 0 ? '+' : ''}${c.acBonus}` : null,
  ].filter(Boolean).join(' · ')

  // A class feature can replace the armour formula while you wear nothing.
  const ud: UnarmoredDefense | undefined = subclass?.unarmoredDefense ?? cls.unarmoredDefense
  if (ud && armor.id === 'none' && (ud.allowsShield || !c.shield)) {
    const udAc = ud.base + ud.abilities.reduce((n, a) => n + mods[a], 0) + shieldBonus + c.acBonus
    if (udAc > ac) {
      ac = udAc
      acSource = [
        `${ud.name} ${ud.base}`,
        ...ud.abilities.map((a) => `${ABILITY_INFO[a].short} ${mods[a] >= 0 ? '+' : ''}${mods[a]}`),
        shieldBonus ? 'Escudo +2' : null,
        c.acBonus ? `Otro ${c.acBonus >= 0 ? '+' : ''}${c.acBonus}` : null,
      ].filter(Boolean).join(' · ')
    }
  }
  if (c.acOverride != null) { ac = c.acOverride; acSource = 'Valor manual' }

  // ── Saves & skills ───────────────────────────────────────────────────────
  const saveProfs = new Set<AbilityKey>(cls.savingThrows)
  if (cls.id === 'rogue' && level >= 15) saveProfs.add('wis')
  if (cls.id === 'monk' && level >= 14) for (const a of ABILITIES) saveProfs.add(a)
  if (hasFeat('resilient')) { /* the player picks the ability; add it by hand in Ficha */ }
  const saves = ABILITIES.map((key) => ({
    key,
    proficient: saveProfs.has(key),
    mod: mods[key] + (saveProfs.has(key) ? prof : 0),
  }))

  const expertiseMax = at(cls.expertiseByLevel, level, 0)
  const expertise = c.expertise.slice(0, expertiseMax)
  const skills = SKILLS.map((s) => {
    const proficient = c.skillProfs.includes(s.key)
    const isExpert = proficient && expertise.includes(s.key)
    return {
      key: s.key,
      name: s.name,
      en: s.en,
      ability: s.ability,
      proficient,
      expertise: isExpert,
      mod: mods[s.ability] + (isExpert ? prof * 2 : proficient ? prof : 0),
    }
  })
  const passivePerception = 10 + skills.find((s) => s.key === 'perception')!.mod

  // ── Spellcasting: from the class, or unlocked by a subclass ──────────────
  const sub = subclass?.casting
  const castsFromClass = cls.casterType !== 'none' && level >= cls.spellcastingLevel
  const castsFromSubclass = !!sub && level >= cls.subclassLevel
  const castAbility: AbilityKey = sub ? sub.ability : cls.spellcastingAbility ?? 'cha'
  const casterType = sub ? sub.casterType : cls.casterType
  const listId = sub ? sub.spellListId : cls.spellListId
  const mode: 'prepared' | 'known' = sub ? 'known' : cls.spellPrep === 'prepared' ? 'prepared' : 'known'

  const active = castsFromClass || castsFromSubclass
  const slotsMax = active ? slotsFor(casterType, level) : []
  const maxSpellLevel = slotsMax.reduce((acc, n, i) => (n > 0 ? i + 1 : acc), 0)

  const grantedIds: string[] = []
  if (subclass?.oathSpells) {
    for (const [lvl, ids] of Object.entries(subclass.oathSpells)) {
      if (level >= Number(lvl)) grantedIds.push(...ids)
    }
  }

  const spellLimit = !active
    ? 0
    : mode === 'prepared'
      ? Math.max(1, mods[castAbility] + Math.floor(level / 2))
      : at(sub ? sub.spellsKnownByLevel : cls.spellsKnownByLevel, level, 0)

  const classCantrips = !active ? 0 : at(sub ? sub.cantripsKnownByLevel : cls.cantripsKnownByLevel, level, 0)
  const fixedCantripIds = (sub?.fixedCantrips ?? []).filter(() => active)

  // Un truco puede venir de la clase, de un estilo de combate o de una dote.
  let cantripLimit = classCantrips
  const cantripSources = new Set<string>()
  if (classCantrips > 0 && listId) cantripSources.add(listId)

  const styleGrant = style?.grantsCantrips
  if (styleGrant && cls.fightingStyleLevel != null && level >= cls.fightingStyleLevel) {
    cantripLimit += styleGrant.count
    cantripSources.add(styleGrant.listId)
  }
  const featCantrips = c.featIds.reduce((n, id) => n + (FEAT_BY_ID[id]?.cantrips ?? 0), 0)
  if (featCantrips > 0) cantripLimit += featCantrips

  // Una dote abre el catálogo entero; si no, te limitas a tus listas.
  const cantripPool = (featCantrips > 0
    ? SPELLS
    : [...cantripSources].flatMap((id) => spellsOnList(id))
  ).filter((sp) => sp.level === 0)
    .filter((sp, i, all) => all.findIndex((x) => x.id === sp.id) === i)
    .sort((a, b) => a.name.localeCompare(b.name))

  const available = spellsOnList(listId)
  const chosenIds = c.preparedSpellIds.filter((id) => {
    const s = SPELL_BY_ID[id]
    return s && s.level > 0 && s.level <= maxSpellLevel && !grantedIds.includes(id)
  })

  const casting: CastingState = {
    active,
    ability: castAbility,
    mode,
    saveDC: 8 + prof + mods[castAbility],
    attack: prof + mods[castAbility],
    slotsMax,
    maxSpellLevel,
    spellLimit,
    cantripLimit,
    fixedCantripIds,
    cantripPool,
    available,
    chosenIds,
    grantedIds,
    grantedLabel: subclass ? `Conjuros de ${subclass.name}` : 'Conjuros concedidos',
    note: sub?.note ?? '',
    source: sub ? `${subclass!.name} · ${cls.name} ${cls.subclassLevel}` : `${cls.name} ${cls.spellcastingLevel}`,
  }

  // ── Divine Smite ─────────────────────────────────────────────────────────
  const canSmite = cls.id === 'paladin' && level >= 2
  const smiteOptions: SmiteOption[] = canSmite
    ? slotsMax
        .map((max, i) => ({ lvl: i + 1, max, used: c.slotsUsed[i] ?? 0 }))
        .filter((s) => s.max > 0)
        .map((s) => {
          const d = Math.min(2 + (s.lvl - 1), 5)
          return { slotLevel: s.lvl, dice: `${d}d8`, vsFiend: `${d + 1}d8`, remaining: Math.max(0, s.max - s.used) }
        })
    : []

  // ── Features and traits available at this level ──────────────────────────
  const features = [...cls.features, ...(subclass?.features ?? [])]
    .filter(inScope)
    .filter((f) => f.level <= level)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))

  const traits: Trait[] = [...race.traits, ...(subrace?.traits ?? [])].filter((t) => (t.level ?? 1) <= level)

  // ── Spendable resources ──────────────────────────────────────────────────
  const resolveMax = (m: ResourceMax): number => {
    switch (m.type) {
      case 'level': return level
      case 'levelTimes': return level * m.factor
      case 'fixed': return m.n
      case 'ability': return Math.max(m.min ?? 0, mods[m.ability] + (m.plus ?? 0))
      case 'proficiency': return prof * (m.times ?? 1)
      case 'table': return at(m.values, level, 0)
    }
  }

  const resources: ResourceState[] = []
  const addResource = (r: ClassResource, source: string) => {
    if (level < r.level) return
    const max = resolveMax(r.max)
    if (max > 0) resources.push({ ...r, max, spent: Math.min(max, c.usesSpent[r.id] ?? 0), source, opciones: [] })
  }

  if (race.id === 'dragonborn' && ancestry) {
    const max = 1
    resources.push({
      id: 'breath-weapon',
      name: 'Arma de aliento',
      detail: `${breathWeaponDice(level)} de ${ancestry.damage.toLowerCase()} · ${ancestry.shape} · CD ${8 + mods.con + prof}`,
      // El apartado de turno no se marca aquí: lo pone el rasgo racial «Arma de
      // aliento», que trae el texto entero, y de aquí hereda los usos que quedan.
      max,
      spent: Math.min(max, c.usesSpent['breath-weapon'] ?? 0),
      recharge: 'short',
      kind: 'uses',
      source: `Dracónido (${ancestry.name})`,
      opciones: [],
    })
  }
  for (const r of (cls.resources ?? []).filter(inScope)) addResource(r, `${cls.name} ${r.level}`)
  for (const r of (subclass?.resources ?? []).filter(inScope)) addResource(r, subclass!.name)

  for (const id of c.featIds) {
    const f = FEAT_BY_ID[id]
    if (!f) continue
    if (id === 'lucky') resources.push({ id: 'feat-lucky', name: 'Puntos de suerte', detail: 'Tira un d20 extra y elige el resultado', max: 3, spent: Math.min(3, c.usesSpent['feat-lucky'] ?? 0), recharge: 'long', kind: 'uses', source: 'Dote: Afortunado', opciones: [] })
    if (id === 'magic-initiate') resources.push({ id: 'feat-magic-initiate', name: 'Conjuro de Iniciado', detail: 'Lanza tu conjuro de nivel 1 sin gastar espacio', max: 1, spent: Math.min(1, c.usesSpent['feat-magic-initiate'] ?? 0), recharge: 'long', kind: 'uses', source: 'Dote: Iniciado en la Magia', opciones: [] })
    if (id === 'fey-touched') resources.push({ id: 'feat-fey-touched', name: 'Conjuros feéricos', detail: 'Paso Brumoso y tu conjuro elegido, sin gastar espacio', max: 2, spent: Math.min(2, c.usesSpent['feat-fey-touched'] ?? 0), recharge: 'long', kind: 'uses', source: 'Dote: Tocado por lo Feérico', opciones: [] })
  }

  // ── Values that scale with class level ───────────────────────────────────
  const scalings: ScalingState[] = [...(cls.scalings ?? []), ...(subclass?.scalings ?? [])]
    .map((s) => ({ id: s.id, name: s.name, detail: s.detail, value: at(s.byLevel, level, '—') }))
    .filter((s) => s.value !== '—')

  // ── "Pick N of these" groups ─────────────────────────────────────────────
  const choices: ChoiceState[] = [...(cls.choiceGroups ?? []), ...(subclass?.choiceGroups ?? [])]
    .filter((g) => level >= g.level)
    .map((g) => ({
      group: { ...g, options: g.options.filter(inScope) },
      max: at(g.countByLevel, level, 0),
      chosen: (c.choices?.[g.id] ?? []).filter((id) => g.options.some((o) => o.id === id && inScope(o))),
    }))
    .filter((c2) => c2.max > 0)

  /**
   * Colgar de cada reserva lo que de verdad se puede hacer con ella.
   *
   * Dos orígenes: los rasgos que se llaman «Reserva: Efecto» —los del juramento
   * del paladín— y las opciones que el jugador ya eligió en un grupo que se paga
   * con esa reserva —su metamagia, sus disciplinas—. Se hace aquí y no en cada
   * pantalla para que la ayuda de turno, Rasgos y Combate cuenten lo mismo.
   */
  for (const r of resources) {
    const delJuramento = features
      .filter((f) => f.name.startsWith(`${r.name}: `))
      .map((f) => ({ name: f.name.slice(r.name.length + 2), text: f.text, turno: f.turno }))
    // Rasgos que se pagan con la reserva pero no llevan su nombre delante.
    const nombrados = (r.alimenta ?? [])
      .map((n) => features.find((f) => f.name === n))
      .filter((f): f is NonNullable<typeof f> => !!f)
      .map((f) => ({ name: f.name, text: f.text, turno: f.turno }))
    const elegidas = choices
      .filter((ch) => ch.group.resourceId === r.id)
      .flatMap((ch) => ch.chosen
        .map((id) => ch.group.options.find((o) => o.id === id))
        .filter((o): o is NonNullable<typeof o> => !!o)
        .map((o) => ({ name: o.name, text: o.text, turno: o.turno })))
    r.opciones = [...delJuramento, ...nombrados, ...elegidas]
  }

  const asiLevels = asiLevelsFor(cls.id)
  const asiSlots = asiLevels.filter((l) => l <= level).length

  let speed = subrace?.speed ?? race.speed
  speed += c.speedBonus + (hasFeat('mobile') ? 10 : 0)
  if (cls.unarmoredMovement && armor.id === 'none' && !c.shield) speed += at(cls.unarmoredMovement, level, 0)

  // ── Carga ────────────────────────────────────────────────────────────────
  // La armadura y el escudo pesan aunque no estén en la mochila: se cuentan
  // desde la ficha para que un mismo objeto no aparezca dos veces.
  const pesoMochila = c.items.reduce((n, i) => n + i.weight * i.qty, 0)
  const pesoArmadura = (ARMOR_BY_ID[c.armorId]?.weight ?? 0) + (c.shield ? GEAR_BY_ID['shield'].weight : 0)
  const pesoDelDinero = pesoMonedas(c.coins)
  const pesoTotal = pesoMochila + pesoArmadura + pesoDelDinero
  const capacidad = scores.str * 15
  const sobrecargaLeve = scores.str * 5
  const sobrecargaFuerte = scores.str * 10
  const estado: CargaState['estado'] =
    pesoTotal > capacidad ? 'pasado'
      : pesoTotal > sobrecargaFuerte ? 'muy-lento'
        : pesoTotal > sobrecargaLeve ? 'lento' : 'bien'
  // Los dos primeros avisos son la regla opcional de sobrecarga: se dice, porque
  // hay mesas que no la usan y no conviene que nadie se crea lento sin serlo.
  const avisos: Record<CargaState['estado'], string | null> = {
    bien: null,
    lento: 'Sobrecargado (regla opcional): tu velocidad baja 10 pies. Sin esa regla no te pasa nada hasta las ' + scores.str * 15 + ' libras.',
    'muy-lento': 'Muy sobrecargado (regla opcional): tu velocidad baja 20 pies y tiras con desventaja en las pruebas, ataques y salvaciones de Fuerza, Destreza y Constitución.',
    pasado: 'Pasas de tu capacidad de carga: esto ya no es opcional, no puedes moverte llevando todo esto.',
  }
  const un = (n: number) => Math.round(n * 10) / 10
  const carga: CargaState = {
    peso: un(pesoTotal),
    pesoMochila: un(pesoMochila),
    pesoArmadura: un(pesoArmadura),
    pesoMonedas: un(pesoDelDinero),
    capacidad,
    sobrecargaLeve,
    sobrecargaFuerte,
    estado,
    aviso: avisos[estado],
    valorMochila: c.items.reduce((n, i) => n + i.cost * i.qty, 0),
    dinero: totalEnCobre(c.coins),
  }

  return {
    race, ancestry, subrace, cls, subclasses, subclass,
    scores, racialBonus, mods, prof,
    maxHp, ac, acSource,
    initiative: mods.dex + (hasFeat('alert') ? 5 : 0),
    speed, hitDie, hitDiceMax: level,
    saves, skills, passivePerception, expertiseMax, carga,
    casting, smiteOptions,
    improvedSmite: cls.id === 'paladin' && level >= 11,
    fightingStyles, features, traits, resources, scalings, choices,
    asiLevels, asiSlots, featSlotsLeft: asiSlots - c.featIds.length,
  }
}
