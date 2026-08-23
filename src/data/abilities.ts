export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
export type AbilityKey = (typeof ABILITIES)[number]

export const ABILITY_INFO: Record<AbilityKey, { name: string; short: string; en: string }> = {
  str: { name: 'Fuerza', short: 'FUE', en: 'Strength' },
  dex: { name: 'Destreza', short: 'DES', en: 'Dexterity' },
  con: { name: 'Constitución', short: 'CON', en: 'Constitution' },
  int: { name: 'Inteligencia', short: 'INT', en: 'Intelligence' },
  wis: { name: 'Sabiduría', short: 'SAB', en: 'Wisdom' },
  cha: { name: 'Carisma', short: 'CAR', en: 'Charisma' },
}

export const modifier = (score: number) => Math.floor((score - 10) / 2)
export const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

export type SkillKey =
  | 'acrobatics' | 'animalHandling' | 'arcana' | 'athletics' | 'deception'
  | 'history' | 'insight' | 'intimidation' | 'investigation' | 'medicine'
  | 'nature' | 'perception' | 'performance' | 'persuasion' | 'religion'
  | 'sleightOfHand' | 'stealth' | 'survival'

export const SKILLS: { key: SkillKey; name: string; en: string; ability: AbilityKey }[] = [
  { key: 'acrobatics', name: 'Acrobacias', en: 'Acrobatics', ability: 'dex' },
  { key: 'animalHandling', name: 'Trato con animales', en: 'Animal Handling', ability: 'wis' },
  { key: 'arcana', name: 'Arcanos', en: 'Arcana', ability: 'int' },
  { key: 'athletics', name: 'Atletismo', en: 'Athletics', ability: 'str' },
  { key: 'deception', name: 'Engaño', en: 'Deception', ability: 'cha' },
  { key: 'history', name: 'Historia', en: 'History', ability: 'int' },
  { key: 'insight', name: 'Perspicacia', en: 'Insight', ability: 'wis' },
  { key: 'intimidation', name: 'Intimidación', en: 'Intimidation', ability: 'cha' },
  { key: 'investigation', name: 'Investigación', en: 'Investigation', ability: 'int' },
  { key: 'medicine', name: 'Medicina', en: 'Medicine', ability: 'wis' },
  { key: 'nature', name: 'Naturaleza', en: 'Nature', ability: 'int' },
  { key: 'perception', name: 'Percepción', en: 'Perception', ability: 'wis' },
  { key: 'performance', name: 'Interpretación', en: 'Performance', ability: 'cha' },
  { key: 'persuasion', name: 'Persuasión', en: 'Persuasion', ability: 'cha' },
  { key: 'religion', name: 'Religión', en: 'Religion', ability: 'int' },
  { key: 'sleightOfHand', name: 'Juego de manos', en: 'Sleight of Hand', ability: 'dex' },
  { key: 'stealth', name: 'Sigilo', en: 'Stealth', ability: 'dex' },
  { key: 'survival', name: 'Supervivencia', en: 'Survival', ability: 'wis' },
]

export const SKILL_BY_KEY = Object.fromEntries(SKILLS.map((s) => [s.key, s])) as Record<SkillKey, (typeof SKILLS)[number]>
