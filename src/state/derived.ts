import { ABILITIES, ABILITY_INFO, SKILLS, modifier, type AbilityKey } from '../data/abilities'
import { ARMOR_BY_ID } from '../data/armor'
import { FEAT_BY_ID } from '../data/feats'
import {
  CLASS_BY_ID, asiLevelsFor, proficiencyBonus, slotsFor,
  type CharClass, type ChoiceGroup, type ClassFeature, type ClassResource,
  type FightingStyle, type ResourceMax, type Subclass, type UnarmoredDefense,
} from '../data/classes'
import { RACE_BY_ID, breathWeaponDice, type DraconicAncestry, type Race, type Subrace, type Trait } from '../data/races'
import { SPELLS, SPELL_BY_ID, spellsOnList, type Spell } from '../data/spells'
import type { Character } from './types'

export interface ResourceState {
  id: string
  name: string
  detail: string
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
  skills: { key: string; name: string; ability: AbilityKey; mod: number; proficient: boolean; expertise: boolean }[]
  passivePerception: number
  expertiseMax: number

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
    if (max > 0) resources.push({ ...r, max, spent: Math.min(max, c.usesSpent[r.id] ?? 0), source })
  }

  if (race.id === 'dragonborn' && ancestry) {
    const max = 1
    resources.push({
      id: 'breath-weapon',
      name: 'Arma de aliento',
      detail: `${breathWeaponDice(level)} de ${ancestry.damage.toLowerCase()} · ${ancestry.shape} · CD ${8 + mods.con + prof}`,
      max,
      spent: Math.min(max, c.usesSpent['breath-weapon'] ?? 0),
      recharge: 'short',
      kind: 'uses',
      source: `Dracónido (${ancestry.name})`,
    })
  }
  for (const r of (cls.resources ?? []).filter(inScope)) addResource(r, `${cls.name} ${r.level}`)
  for (const r of (subclass?.resources ?? []).filter(inScope)) addResource(r, subclass!.name)

  for (const id of c.featIds) {
    const f = FEAT_BY_ID[id]
    if (!f) continue
    if (id === 'lucky') resources.push({ id: 'feat-lucky', name: 'Puntos de suerte', detail: 'Tira un d20 extra y elige el resultado', max: 3, spent: Math.min(3, c.usesSpent['feat-lucky'] ?? 0), recharge: 'long', kind: 'uses', source: 'Dote: Afortunado' })
    if (id === 'magic-initiate') resources.push({ id: 'feat-magic-initiate', name: 'Conjuro de Iniciado', detail: 'Lanza tu conjuro de nivel 1 sin gastar espacio', max: 1, spent: Math.min(1, c.usesSpent['feat-magic-initiate'] ?? 0), recharge: 'long', kind: 'uses', source: 'Dote: Iniciado en la Magia' })
    if (id === 'fey-touched') resources.push({ id: 'feat-fey-touched', name: 'Conjuros feéricos', detail: 'Paso Brumoso y tu conjuro elegido, sin gastar espacio', max: 2, spent: Math.min(2, c.usesSpent['feat-fey-touched'] ?? 0), recharge: 'long', kind: 'uses', source: 'Dote: Tocado por lo Feérico' })
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

  const asiLevels = asiLevelsFor(cls.id)
  const asiSlots = asiLevels.filter((l) => l <= level).length

  let speed = subrace?.speed ?? race.speed
  speed += c.speedBonus + (hasFeat('mobile') ? 10 : 0)
  if (cls.unarmoredMovement && armor.id === 'none' && !c.shield) speed += at(cls.unarmoredMovement, level, 0)

  return {
    race, ancestry, subrace, cls, subclasses, subclass,
    scores, racialBonus, mods, prof,
    maxHp, ac, acSource,
    initiative: mods.dex + (hasFeat('alert') ? 5 : 0),
    speed, hitDie, hitDiceMax: level,
    saves, skills, passivePerception, expertiseMax,
    casting, smiteOptions,
    improvedSmite: cls.id === 'paladin' && level >= 11,
    fightingStyles, features, traits, resources, scalings, choices,
    asiLevels, asiSlots, featSlotsLeft: asiSlots - c.featIds.length,
  }
}
