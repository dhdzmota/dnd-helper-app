import type { AbilityKey } from './abilities'

export interface Trait {
  name: string
  text: string
  /** Character level at which the trait comes online. Defaults to 1. */
  level?: number
}

export interface DraconicAncestry {
  id: string
  name: string
  damage: string
  shape: string
  save: AbilityKey
}

export interface Subrace {
  id: string
  name: string
  asi: Partial<Record<AbilityKey, number>>
  traits: Trait[]
  speed?: number
}

export interface Race {
  id: string
  name: string
  asi: Partial<Record<AbilityKey, number>>
  speed: number
  size: string
  darkvision: number
  traits: Trait[]
  /** Label for the dependent dropdown, e.g. "Linaje dracónico". Absent = no second choice. */
  branchLabel?: string
  subraces?: Subrace[]
  ancestries?: DraconicAncestry[]
}

export const DRACONIC_ANCESTRIES: DraconicAncestry[] = [
  { id: 'black', name: 'Negro', damage: 'Ácido', shape: 'Línea de 30 pies × 5', save: 'dex' },
  { id: 'blue', name: 'Azul', damage: 'Relámpago', shape: 'Línea de 30 pies × 5', save: 'dex' },
  { id: 'brass', name: 'Latón', damage: 'Fuego', shape: 'Línea de 30 pies × 5', save: 'dex' },
  { id: 'bronze', name: 'Bronce', damage: 'Relámpago', shape: 'Línea de 30 pies × 5', save: 'dex' },
  { id: 'copper', name: 'Cobre', damage: 'Ácido', shape: 'Línea de 30 pies × 5', save: 'dex' },
  { id: 'gold', name: 'Oro', damage: 'Fuego', shape: 'Cono de 15 pies', save: 'dex' },
  { id: 'green', name: 'Verde', damage: 'Veneno', shape: 'Cono de 15 pies', save: 'con' },
  { id: 'red', name: 'Rojo', damage: 'Fuego', shape: 'Cono de 15 pies', save: 'dex' },
  { id: 'silver', name: 'Plata', damage: 'Frío', shape: 'Cono de 15 pies', save: 'con' },
  { id: 'white', name: 'Blanco', damage: 'Frío', shape: 'Cono de 15 pies', save: 'con' },
]

/** Breath Weapon scales with character level, not class level. */
export function breathWeaponDice(level: number): string {
  if (level >= 16) return '5d6'
  if (level >= 11) return '4d6'
  if (level >= 6) return '3d6'
  return '2d6'
}

export const RACES: Race[] = [
  {
    id: 'dragonborn',
    name: 'Dracónido',
    asi: { str: 2, cha: 1 },
    speed: 30,
    size: 'Mediano',
    darkvision: 0,
    branchLabel: 'Linaje dracónico',
    ancestries: DRACONIC_ANCESTRIES,
    traits: [
      {
        name: 'Arma de aliento',
        text: 'Como acción, exhalas energía destructiva en el área que marca tu linaje. Cada criatura en el área hace una tirada de salvación; la CD es 8 + tu modificador de Constitución + tu bonificador de competencia. Recibe el daño completo si falla, la mitad si tiene éxito. Recuperas el uso al terminar un descanso corto o largo.',
      },
      {
        name: 'Resistencia al daño',
        text: 'Tienes resistencia al tipo de daño de tu linaje dracónico: recibes la mitad del daño de esa clase.',
      },
      {
        name: 'Ascendencia dracónica',
        text: 'Hablas, lees y escribes Común y Dracónico.',
      },
    ],
  },
  {
    id: 'human',
    name: 'Humano',
    asi: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    speed: 30,
    size: 'Mediano',
    darkvision: 0,
    traits: [{ name: 'Versátil', text: 'Hablas Común y un idioma adicional a tu elección.' }],
  },
  {
    id: 'half-elf',
    name: 'Semielfo',
    asi: { cha: 2 },
    speed: 30,
    size: 'Mediano',
    darkvision: 60,
    traits: [
      { name: 'Ascendencia feérica', text: 'Ventaja en salvaciones contra ser encantado, y la magia no puede dormirte.' },
      { name: 'Versatilidad en habilidades', text: 'Ganas competencia en dos habilidades a tu elección.' },
      { name: 'Mejora de característica', text: 'Sube otras dos características distintas de Carisma en +1 cada una.' },
    ],
  },
  {
    id: 'tiefling',
    name: 'Tiflin',
    asi: { int: 1, cha: 2 },
    speed: 30,
    size: 'Mediano',
    darkvision: 60,
    traits: [
      { name: 'Resistencia infernal', text: 'Tienes resistencia al daño de fuego.' },
      { name: 'Legado infernal', text: 'Conoces el truco Thaumaturgy. A nivel 3 puedes lanzar Hellish Rebuke a nivel 2 una vez por descanso largo; a nivel 5, Darkness una vez por descanso largo. Carisma es tu característica de lanzamiento.' },
    ],
  },
  {
    id: 'dwarf',
    name: 'Enano',
    asi: { con: 2 },
    speed: 25,
    size: 'Mediano',
    darkvision: 60,
    branchLabel: 'Linaje enano',
    subraces: [
      { id: 'hill', name: 'Enano de las colinas', asi: { wis: 1 }, traits: [{ name: 'Dureza enana', text: 'Tu máximo de puntos de golpe aumenta en 1, y en 1 más cada vez que subes de nivel.' }] },
      { id: 'mountain', name: 'Enano de las montañas', asi: { str: 2 }, traits: [{ name: 'Entrenamiento con armaduras enanas', text: 'Ganas competencia con armaduras ligeras y medias.' }] },
    ],
    traits: [
      { name: 'Resiliencia enana', text: 'Ventaja en salvaciones contra veneno y resistencia al daño de veneno.' },
      { name: 'Entrenamiento de combate enano', text: 'Competencia con hacha de batalla, hacha de mano, martillo ligero y martillo de guerra.' },
    ],
  },
  {
    id: 'elf',
    name: 'Elfo',
    asi: { dex: 2 },
    speed: 30,
    size: 'Mediano',
    darkvision: 60,
    branchLabel: 'Linaje élfico',
    subraces: [
      { id: 'high', name: 'Alto elfo', asi: { int: 1 }, traits: [{ name: 'Truco', text: 'Conoces un truco de la lista de mago. Inteligencia es tu característica de lanzamiento para él.' }] },
      { id: 'wood', name: 'Elfo de los bosques', asi: { wis: 1 }, speed: 35, traits: [{ name: 'Máscara de la espesura', text: 'Puedes intentar esconderte incluso cuando solo te oculta follaje, lluvia intensa, nieve o fenómenos naturales similares.' }] },
      { id: 'drow', name: 'Drow', asi: { cha: 1 }, traits: [{ name: 'Sensibilidad a la luz solar', text: 'Desventaja en tiradas de ataque y de Percepción basadas en la vista bajo luz solar directa.' }] },
    ],
    traits: [
      { name: 'Sentidos agudos', text: 'Ganas competencia en Percepción.' },
      { name: 'Ascendencia feérica', text: 'Ventaja en salvaciones contra ser encantado, y la magia no puede dormirte.' },
      { name: 'Trance', text: 'No duermes: meditas 4 horas al día y eso cuenta como 8 horas de sueño.' },
    ],
  },
]

export const RACE_BY_ID = Object.fromEntries(RACES.map((r) => [r.id, r])) as Record<string, Race>
