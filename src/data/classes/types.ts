import type { AbilityKey, SkillKey } from '../abilities'
import type { TurnSlot } from '../turn'

/** Absent = Manual del Jugador. 'TCE' = rasgo opcional de Tasha's. */
export type Source = 'TCE'

export interface ClassFeature {
  name: string
  level: number
  text: string
  /** Apartado del turno en que se usa, si se usa en combate. */
  turno?: TurnSlot
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
  /** Apartado del turno en que se usa, si se usa en combate. */
  turno?: TurnSlot
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
  /**
   * Nombres de los rasgos que se pagan con esta reserva, cuando no se llaman
   * «Reserva: Efecto». Sin esto, una reserva de puntos enseña cuántos te quedan
   * sin decir en qué gastarlos, que es lo que menos ayuda a quien empieza.
   */
  alimenta?: string[]
  /** Apartado del turno en que se usa, si se usa en combate. */
  turno?: TurnSlot
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
  /**
   * Id de la reserva que paga estas opciones: la metamagia sale de los puntos de
   * hechicería y las disciplinas del ki. Sirve para que la reserva enseñe lo que
   * alimenta en vez de un texto vago.
   */
  resourceId?: string
  options: { id: string; name: string; text: string; source?: Source; turno?: TurnSlot }[]
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
