import type { AbilityKey } from '../data/abilities'
import { CLASS_BY_ID } from '../data/classes'
import type { Character } from './types'
import portrait from '../assets/portrait.jpg'

/** Âreen Velthar — the character this app was built around. */
export const AREEN: Character = {
  version: 1,
  name: 'Âreen Velthar',
  player: '',
  portrait,

  raceId: 'dragonborn',
  branchId: 'red',
  classId: 'paladin',
  subclassId: 'devotion',
  level: 3,

  scores: { str: 15, dex: 10, con: 13, int: 8, wis: 10, cha: 15 },
  skillProfs: ['athletics', 'persuasion', 'insight', 'religion'],
  expertise: [],
  fightingStyleId: 'dueling',
  featIds: [],
  cantripIds: [],
  choices: {},
  preparedSpellIds: ['bless', 'cure-wounds', 'shield-of-faith', 'command'],

  useTashas: true,

  armorId: 'chain-mail',
  shield: true,
  acBonus: 0,
  acOverride: null,
  maxHpOverride: null,
  speedBonus: 0,
  attacks: [
    { id: 'longsword', name: 'Espada larga', ability: 'str', proficient: true, damage: '1d8', damageType: 'Cortante', damageBonus: 2, notes: 'Versátil (1d10) — a dos manos renuncias al escudo' },
    { id: 'javelin', name: 'Jabalina', ability: 'str', proficient: true, damage: '1d6', damageType: 'Perforante', damageBonus: 0, notes: 'Arrojadiza, alcance 30/120 pies' },
  ],
  notes: 'Juró proteger al mundo de la magia. Ahora protege la verdad de la mentira.',

  hpCurrent: 25,
  hpTemp: 0,
  hitDiceSpent: 0,
  deathSuccesses: 0,
  deathFailures: 0,
  slotsUsed: [0, 0, 0, 0, 0],
  usesSpent: {},
  inspiration: false,
  conditions: [],
  concentratingOn: null,
}

/**
 * Una hoja en blanco para la clase elegida: reparte el array estándar
 * (15, 14, 13, 12, 10, 8) según lo que la clase necesita, y deja el resto por decidir.
 */
export function blankCharacter(classId: string, level = 3): Character {
  const cls = CLASS_BY_ID[classId]
  const order: AbilityKey[] = [...(cls?.primary ?? ['str'])]
  for (const a of ['con', 'dex', 'wis', 'cha', 'int', 'str'] as AbilityKey[]) {
    if (!order.includes(a)) order.push(a)
  }
  const array = [15, 14, 13, 12, 10, 8]
  const scores = {} as Record<AbilityKey, number>
  order.forEach((a, i) => { scores[a] = array[i] })

  const armorId = cls?.unarmoredDefense ? 'none' : cls?.hitDie === 6 ? 'none' : 'chain-shirt'

  return {
    ...AREEN,
    name: '',
    portrait: null,
    notes: '',
    raceId: 'human',
    branchId: null,
    classId,
    subclassId: cls?.subclasses[0]?.id ?? null,
    level,
    scores,
    skillProfs: [],
    expertise: [],
    fightingStyleId: null,
    featIds: [],
    cantripIds: [],
    choices: {},
    preparedSpellIds: [],
    armorId,
    shield: false,
    acBonus: 0,
    acOverride: null,
    maxHpOverride: null,
    speedBonus: 0,
    attacks: [],
    hpCurrent: 1,
    hpTemp: 0,
    hitDiceSpent: 0,
    deathSuccesses: 0,
    deathFailures: 0,
    slotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    usesSpent: {},
    inspiration: false,
    conditions: [],
    concentratingOn: null,
  }
}

export const CONDITIONS = [
  'Agarrado', 'Apresado', 'Asustado', 'Aturdido', 'Cegado', 'Derribado',
  'Encantado', 'Ensordecido', 'Envenenado', 'Incapacitado', 'Inconsciente',
  'Invisible', 'Paralizado', 'Petrificado', 'Cansancio',
]
