export type School =
  | 'Abjuración' | 'Conjuración' | 'Adivinación' | 'Encantamiento'
  | 'Evocación' | 'Ilusión' | 'Nigromancia' | 'Transmutación'

/** id, nombre, inglés, nivel, escuela, tiempo, alcance, componentes, duración, texto */
export type Raw = [string, string, string, number, School, string, string, string, string, string]

export interface Spell {
  id: string
  name: string
  en: string
  /** 0 = truco. */
  level: number
  school: School
  time: string
  range: string
  components: string
  duration: string
  text: string
  concentration: boolean
  ritual?: boolean
  /** True for the paladin "smite" spells: bonus action, held until you hit. */
  smite?: boolean
  /** Cantrip damage at character levels 1 / 5 / 11 / 17. */
  scale?: [string, string, string, string]
}
