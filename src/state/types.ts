import type { AbilityKey, SkillKey } from '../data/abilities'

export interface Attack {
  id: string
  name: string
  ability: AbilityKey
  proficient: boolean
  damage: string
  damageType: string
  damageBonus: number
  notes: string
}

export interface Character {
  version: 1
  name: string
  player: string
  portrait: string | null

  raceId: string
  /** Draconic ancestry or subrace id — null when the race offers no branch. */
  branchId: string | null
  classId: string
  subclassId: string | null
  level: number

  /** Base scores before racial bonuses. */
  scores: Record<AbilityKey, number>
  skillProfs: SkillKey[]
  expertise: SkillKey[]
  fightingStyleId: string | null
  featIds: string[]
  cantripIds: string[]
  /** Prepared spells, or known spells for classes that learn a fixed list. */
  preparedSpellIds: string[]
  /** Picks per choice group id, e.g. metamagic or elemental disciplines. */
  choices: Record<string, string[]>

  /** Tasha's marca sus rasgos de clase como opcionales: el DM decide si entran. */
  useTashas: boolean

  armorId: string
  shield: boolean
  acBonus: number
  acOverride: number | null
  maxHpOverride: number | null
  speedBonus: number
  attacks: Attack[]
  notes: string

  // ── Live, spendable state ────────────────────────────────────────────────
  hpCurrent: number
  hpTemp: number
  hitDiceSpent: number
  deathSuccesses: number
  deathFailures: number
  /** Slots consumed per spell level, index 0 = level 1. */
  slotsUsed: number[]
  /** Resource id → uses or pool points spent. */
  usesSpent: Record<string, number>
  inspiration: boolean
  conditions: string[]
  concentratingOn: string | null
}
