import type { AbilityKey, SkillKey } from '../abilities'

/** Absent = Manual del Jugador. 'TCE' = rasgo opcional de Tasha's. */
export type Source = 'TCE'

export interface ClassFeature {
  name: string
  level: number
  text: string
  /** Marks the feature as belonging to a subclass; absent = base class. */
  subclass?: string
  source?: Source
  /** What this optional feature replaces, shown so the swap is explicit. */
  replaces?: string
}

export interface FightingStyle {
  id: string
  name: string
  text: string
  source?: Source
  /** Blessed Warrior and the like: cantrips from another class's list. */
  grantsCantrips?: { count: number; listId: string; ability: AbilityKey }
}

/** How a resource's maximum is worked out from the character. */
export type ResourceMax =
  | { type: 'level' }
  | { type: 'levelTimes'; factor: number }
  | { type: 'fixed'; n: number }
  | { type: 'ability'; ability: AbilityKey; plus?: number; min?: number }
  | { type: 'proficiency'; times?: number }
  /** One entry per class level, index 0 = level 1. */
  | { type: 'table'; values: number[] }

export interface ClassResource {
  id: string
  name: string
  detail: string
  recharge: 'short' | 'long'
  kind: 'uses' | 'pool'
  /** Class level at which the resource appears. */
  level: number
  max: ResourceMax
  /** Present only for a resource a particular subclass grants. */
  subclass?: string
  source?: Source
}

/** A named number or die that grows with class level, e.g. Sneak Attack. */
export interface Scaling {
  id: string
  name: string
  detail?: string
  /** One entry per class level, index 0 = level 1. */
  byLevel: string[]
}

/** "Pick N of these" — metamagic, elemental disciplines, and the like. */
export interface ChoiceGroup {
  id: string
  label: string
  hint: string
  level: number
  /** How many picks at each class level, index 0 = level 1. */
  countByLevel: number[]
  options: { id: string; name: string; text: string; source?: Source }[]
}

/** Armour class from a class feature instead of worn armour. */
export interface UnarmoredDefense {
  name: string
  base: number
  abilities: AbilityKey[]
  /** Monk loses it with a shield; draconic sorcerer keeps it. */
  allowsShield: boolean
}

export interface Subclass {
  id: string
  name: string
  flavor: string
  source?: Source
  /** Always-prepared spells keyed by the class level at which they are granted. */
  oathSpells?: Record<number, string[]>
  features: ClassFeature[]
  resources?: ClassResource[]
  scalings?: Scaling[]
  unarmoredDefense?: UnarmoredDefense
  /** Extra maximum hit points per class level, e.g. Draconic Resilience. */
  hpPerLevel?: number
  choiceGroups?: ChoiceGroup[]
  /** Subclasses that unlock casting on an otherwise non-casting class. */
  casting?: SubclassCasting
}

export interface SubclassCasting {
  casterType: 'third'
  ability: AbilityKey
  spellListId: string
  spellsKnownByLevel: number[]
  cantripsKnownByLevel: number[]
  /** Spell ids the subclass forces you to know, e.g. Mage Hand. */
  fixedCantrips?: string[]
  note: string
}

export interface CharClass {
  id: string
  name: string
  hitDie: number
  primary: AbilityKey[]
  savingThrows: AbilityKey[]
  skillChoices: number
  skillList: SkillKey[]

  casterType: 'full' | 'half' | 'third' | 'none'
  /** 'prepared' rebuilds the list each long rest; 'known' is fixed on level-up. */
  spellPrep: 'prepared' | 'known' | 'none'
  spellcastingAbility?: AbilityKey
  spellcastingLevel: number
  spellListId?: string
  spellsKnownByLevel?: number[]
  cantripsKnownByLevel?: number[]

  subclassLabel: string
  subclassLevel: number
  subclasses: Subclass[]

  fightingStyles?: FightingStyle[]
  fightingStyleLevel?: number
  /** Number of skills you may double proficiency on, index 0 = level 1. */
  expertiseByLevel?: number[]
  unarmoredDefense?: UnarmoredDefense
  /** Extra speed while unarmoured, one entry per class level. */
  unarmoredMovement?: number[]
  choiceGroups?: ChoiceGroup[]

  features: ClassFeature[]
  resources?: ClassResource[]
  scalings?: Scaling[]
}
