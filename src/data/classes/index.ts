import type { CharClass } from './types'
import { PALADIN } from './paladin'
import { SORCERER } from './sorcerer'
import { ROGUE } from './rogue'
import { MONK } from './monk'

export * from './types'
export * from './tables'

export const CLASSES: CharClass[] = [PALADIN, SORCERER, ROGUE, MONK]
export const CLASS_BY_ID = Object.fromEntries(CLASSES.map((c) => [c.id, c])) as Record<string, CharClass>

/** Levels at which each class gains an Ability Score Improvement or a feat. */
export const ASI_LEVELS_BY_CLASS: Record<string, number[]> = {
  paladin: [4, 8, 12, 16, 19],
  sorcerer: [4, 8, 12, 16, 19],
  rogue: [4, 8, 10, 12, 16, 19],
  monk: [4, 8, 12, 16, 19],
}

export const asiLevelsFor = (classId: string) => ASI_LEVELS_BY_CLASS[classId] ?? [4, 8, 12, 16, 19]

export { PALADIN, SORCERER, ROGUE, MONK }
