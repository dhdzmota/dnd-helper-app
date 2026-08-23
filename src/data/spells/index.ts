import { ARCANE_SPELLS } from './arcane'
import { CANTRIP_SCALING, CANTRIP_SPELLS } from './cantrips'
import { DIVINE_SPELLS } from './divine'
import { EXPANDED_SPELLS } from './expanded'
import type { Raw, Spell } from './types'

export * from './types'

const SMITE_IDS = new Set([
  'searing-smite', 'thunderous-smite', 'wrathful-smite', 'branding-smite',
  'blinding-smite', 'staggering-smite', 'banishing-smite',
])

const build = ([id, name, en, level, school, time, range, components, duration, text]: Raw): Spell => ({
  id, name, en, level, school, time, range, components, duration, text,
  concentration: duration.startsWith('Concentración'),
  ritual: text.startsWith('Ritual.') || undefined,
  smite: SMITE_IDS.has(id) || undefined,
  scale: CANTRIP_SCALING[id],
})

export const SPELLS: Spell[] = [
  ...CANTRIP_SPELLS, ...DIVINE_SPELLS, ...ARCANE_SPELLS, ...EXPANDED_SPELLS,
].map(build)
export const SPELL_BY_ID = Object.fromEntries(SPELLS.map((s) => [s.id, s])) as Record<string, Spell>

const CANTRIPS_ARCANE = [
  'acid-splash', 'blade-ward', 'chill-touch', 'dancing-lights', 'fire-bolt', 'friends',
  'light', 'mage-hand', 'mending', 'message', 'minor-illusion', 'poison-spray',
  'prestidigitation', 'ray-of-frost', 'shocking-grasp', 'true-strike',
]

const SORCERER_IDS = [
  ...CANTRIPS_ARCANE,
  // Nivel 1
  'burning-hands', 'charm-person', 'chromatic-orb', 'color-spray', 'comprehend-languages',
  'detect-magic', 'disguise-self', 'expeditious-retreat', 'false-life', 'feather-fall',
  'fog-cloud', 'jump', 'mage-armor', 'magic-missile', 'ray-of-sickness', 'shield',
  'silent-image', 'sleep', 'thunderwave', 'witch-bolt',
  // Nivel 2
  'alter-self', 'blindness-deafness', 'blur', 'cloud-of-daggers', 'crown-of-madness',
  'darkness', 'darkvision', 'detect-thoughts', 'enhance-ability', 'enlarge-reduce',
  'gust-of-wind', 'hold-person', 'invisibility', 'knock', 'levitate', 'mirror-image',
  'misty-step', 'phantasmal-force', 'scorching-ray', 'see-invisibility', 'shatter',
  'spider-climb', 'suggestion', 'web',
  // Nivel 3
  'blink', 'clairvoyance', 'counterspell', 'daylight', 'dispel-magic', 'fear', 'fireball',
  'fly', 'gaseous-form', 'haste', 'hypnotic-pattern', 'lightning-bolt', 'major-image',
  'protection-from-energy', 'sleet-storm', 'slow', 'stinking-cloud', 'tongues',
  'water-breathing', 'water-walk',
]

const ARCANE_TRICKSTER_IDS = [
  ...CANTRIPS_ARCANE,
  // Nivel 1
  'charm-person', 'color-spray', 'comprehend-languages', 'detect-magic', 'disguise-self',
  'expeditious-retreat', 'false-life', 'feather-fall', 'find-familiar', 'fog-cloud',
  'grease', 'identify', 'jump', 'mage-armor', 'magic-missile', 'shield', 'silent-image',
  'sleep', 'tashas-hideous-laughter', 'thunderwave', 'unseen-servant',
  // Nivel 2
  'alter-self', 'blindness-deafness', 'blur', 'cloud-of-daggers', 'crown-of-madness',
  'darkness', 'darkvision', 'detect-thoughts', 'enlarge-reduce', 'gust-of-wind',
  'hold-person', 'invisibility', 'knock', 'levitate', 'magic-mouth', 'mirror-image',
  'misty-step', 'phantasmal-force', 'see-invisibility', 'shatter', 'spider-climb',
  'suggestion', 'web',
  // Nivel 3
  'blink', 'clairvoyance', 'counterspell', 'dispel-magic', 'fear', 'fly', 'gaseous-form',
  'haste', 'hypnotic-pattern', 'major-image', 'slow', 'tongues', 'water-breathing', 'water-walk',
]

const PALADIN_IDS = [
  'bless', 'command', 'compelled-duel', 'cure-wounds', 'detect-evil-and-good', 'detect-magic',
  'detect-poison-and-disease', 'divine-favor', 'heroism', 'protection-from-evil-and-good',
  'purify-food-and-drink', 'searing-smite', 'shield-of-faith', 'thunderous-smite', 'wrathful-smite',
  'aid', 'branding-smite', 'find-steed', 'lesser-restoration', 'locate-object', 'magic-weapon',
  'protection-from-poison', 'warding-bond', 'zone-of-truth',
  'aura-of-vitality', 'blinding-smite', 'create-food-and-water', 'crusaders-mantle', 'daylight',
  'dispel-magic', 'elemental-weapon', 'magic-circle', 'remove-curse', 'revivify',
  'aura-of-life', 'aura-of-purity', 'banishment', 'death-ward', 'locate-creature', 'staggering-smite',
  'banishing-smite', 'circle-of-power', 'destructive-wave', 'dispel-evil-and-good', 'geas', 'raise-dead',
]

/** Trucos de clérigo, para el estilo Guerrero Bendecido de Tasha's. */
const CLERIC_CANTRIP_IDS = [
  'guidance', 'light', 'mending', 'resistance', 'sacred-flame', 'spare-the-dying', 'thaumaturgy',
]

/** Which spells each class (or casting subclass) may learn. */
export const SPELL_LISTS: Record<string, Set<string>> = {
  paladin: new Set(PALADIN_IDS),
  sorcerer: new Set(SORCERER_IDS),
  'arcane-trickster': new Set(ARCANE_TRICKSTER_IDS),
  'cleric-cantrips': new Set(CLERIC_CANTRIP_IDS),
}

export const spellsOnList = (listId: string | undefined) =>
  listId && SPELL_LISTS[listId] ? SPELLS.filter((s) => SPELL_LISTS[listId].has(s.id)) : []

/** Cantrip damage at the character's level. */
export function cantripDamage(spell: Spell, characterLevel: number): string | null {
  if (!spell.scale) return null
  const i = characterLevel >= 17 ? 3 : characterLevel >= 11 ? 2 : characterLevel >= 5 ? 1 : 0
  return spell.scale[i]
}

/** Legacy alias kept so existing imports keep resolving. */
export const PALADIN_SPELL_IDS = SPELL_LISTS.paladin
