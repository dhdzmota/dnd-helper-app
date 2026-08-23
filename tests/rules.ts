/* Comprobaciones de las reglas. Ejecutar con: npm run check */
import { AREEN } from '../src/state/defaults'
import { derive } from '../src/state/derived'
import { FULL_CASTER_SLOTS, HALF_CASTER_SLOTS, THIRD_CASTER_SLOTS, proficiencyBonus } from '../src/data/classes'
import { SPELLS, SPELL_LISTS, cantripDamage } from '../src/data/spells'
import { blankCharacter } from '../src/state/defaults'
import type { Character } from '../src/state/types'

let failures = 0
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) { failures++; console.log(`  ✗ ${label}: obtuvo ${JSON.stringify(got)}, esperaba ${JSON.stringify(want)}`) }
  else console.log(`  ✓ ${label}`)
}
const at = (patch: Partial<Character>) => derive({ ...AREEN, ...patch })

console.log('\nÂreen Velthar, paladín 3 — el caso de uso')
{
  const d = at({})
  eq('bonificador de competencia', d.prof, 2)
  eq('modificadores tras bono racial', [d.mods.str, d.mods.cha, d.mods.con], [3, 3, 1])
  eq('puntos de golpe máximos', d.maxHp, 25)
  eq('clase de armadura (cota de malla + escudo)', d.ac, 18)
  eq('conjuros preparables (CAR +3 + nivel/2)', d.casting.spellLimit, 4)
  eq('espacios de conjuro', d.casting.slotsMax, [3, 0, 0, 0, 0])
  eq('nivel máximo de conjuro', d.casting.maxSpellLevel, 1)
  eq('conjuros de juramento a nivel 3', d.casting.grantedIds, ['protection-from-evil-and-good', 'sanctuary'])
  eq('reserva de Imposición de Manos', d.resources.find((r) => r.id === 'lay-on-hands')?.max, 15)
  eq('CD de conjuros', d.casting.saveDC, 13)
  eq('ataque de conjuro', d.casting.attack, 5)
  eq('Castigo Divino con espacio de nivel 1', d.smiteOptions[0]?.dice, '2d8')
  eq('Castigo Divino contra no-muertos', d.smiteOptions[0]?.vsFiend, '3d8')
  eq('Castigo Divino Mejorado todavía no', d.improvedSmite, false)
  const ids = d.resources.map((r) => r.id)
  eq('recursos con Tasha\'s', ids, ['breath-weapon', 'divine-sense', 'lay-on-hands', 'channel-divinity', 'harness-divine-power'])
  eq('recursos solo con el Manual', at({ useTashas: false }).resources.map((r) => r.id),
     ['breath-weapon', 'divine-sense', 'lay-on-hands', 'channel-divinity'])
  eq('usos de Sentido Divino (1 + CAR)', d.resources.find((r) => r.id === 'divine-sense')?.max, 4)
  eq('Arma de aliento recarga con descanso corto', d.resources.find((r) => r.id === 'breath-weapon')?.recharge, 'short')
  eq('detalle del aliento', d.resources.find((r) => r.id === 'breath-weapon')?.detail, '2d6 de fuego · Cono de 15 pies · CD 11')
  eq('sin espacios de dote a nivel 3', d.asiSlots, 0)
  eq('Ataque Adicional aún no está', d.features.some((f) => f.name === 'Ataque Adicional'), false)
}

console.log('\nEl mismo paladín a nivel 5')
{
  const d = at({ level: 5 })
  eq('competencia sube a +3', d.prof, 3)
  eq('espacios', d.casting.slotsMax, [4, 2, 0, 0, 0])
  eq('ya lanza conjuros de nivel 2', d.casting.maxSpellLevel, 2)
  eq('el juramento añade dos conjuros más', d.casting.grantedIds.length, 4)
  eq('preparables = 3 + 2', d.casting.spellLimit, 5)
  eq('Ataque Adicional aparece', d.features.some((f) => f.name === 'Ataque Adicional'), true)
  eq('un espacio de dote (nivel 4)', d.asiSlots, 1)
  eq('reserva de curación 25', d.resources.find((r) => r.id === 'lay-on-hands')?.max, 25)
  eq('Castigo con espacio de nivel 2', d.smiteOptions[1]?.dice, '3d8')
}

console.log('\nNivel 11 y nivel 20')
{
  const d11 = at({ level: 11 })
  eq('Castigo Divino Mejorado activo', d11.improvedSmite, true)
  eq('aliento sube a 4d6', d11.resources.find((r) => r.id === 'breath-weapon')?.detail.startsWith('4d6'), true)
  // A nivel 11 el paladín todavía no tiene espacios de nivel 4, así que su castigo tope es 4d8.
  eq('a nivel 11 el castigo tope es 4d8', d11.smiteOptions.at(-1)?.dice, '4d8')
  eq('5d8 llega con el primer espacio de nivel 4 (nivel 13)', at({ level: 13 }).smiteOptions.at(-1)?.dice, '5d8')
  eq('el castigo no pasa de 5d8 ni con espacio de nivel 5', at({ level: 17 }).smiteOptions.at(-1)?.dice, '5d8')

  const d20 = at({ level: 20 })
  eq('competencia máxima', d20.prof, 6)
  eq('espacios a nivel 20', d20.casting.slotsMax, [4, 3, 3, 3, 2])
  eq('los diez conjuros del juramento', d20.casting.grantedIds.length, 10)
  eq('Nimbo Sagrado como recurso gastable', d20.resources.some((r) => r.id === 'holy-nimbus'), true)
  eq('Toque Purificador con usos = CAR', d20.resources.find((r) => r.id === 'cleansing-touch')?.max, 3)
}

console.log('\nLos preparados se filtran por lo que puedes lanzar')
{
  const d = at({ level: 3, preparedSpellIds: ['bless', 'aid', 'sanctuary'] })
  eq('Auxilio (nivel 2) queda fuera a nivel 3', d.casting.chosenIds, ['bless'])
  const d5 = at({ level: 5, preparedSpellIds: ['bless', 'aid', 'lesser-restoration'] })
  eq('a nivel 5 Auxilio ya cuenta', d5.casting.chosenIds, ['bless', 'aid'])
  eq('Restauración Menor no cuenta: es del juramento', d5.casting.grantedIds.includes('lesser-restoration'), true)
}

console.log('\nOtros linajes y dotes')
{
  const enano = at({ raceId: 'dwarf', branchId: 'hill', level: 4 })
  eq('el enano de las colinas suma 1 PG por nivel', enano.maxHp, at({ raceId: 'dwarf', branchId: 'mountain', level: 4 }).maxHp + 4)
  eq('sin arma de aliento fuera del dracónido', enano.resources.some((r) => r.id === 'breath-weapon'), false)

  const conDotes = at({ level: 8, featIds: ['tough', 'lucky'] })
  eq('dos espacios de dote a nivel 8', conDotes.asiSlots, 2)
  eq('ninguno libre', conDotes.featSlotsLeft, 0)
  eq('Afortunado aporta 3 puntos de suerte', conDotes.resources.find((r) => r.id === 'feat-lucky')?.max, 3)
  eq('Duro suma 2 PG por nivel', conDotes.maxHp - at({ level: 8, featIds: ['lucky'] }).maxHp, 16)

  const movil = at({ featIds: ['mobile'], level: 4 })
  eq('Móvil da +10 pies', movil.speed, 40)
  eq('Alerta da +5 a iniciativa', at({ featIds: ['alert'], level: 4 }).initiative, 5)
}

console.log('\nClase de armadura según la armadura elegida')
{
  eq('sin armadura ni escudo', at({ armorId: 'none', shield: false }).ac, 10)
  eq('media armadura limita DES a +2', at({ armorId: 'half-plate', shield: false, scores: { ...AREEN.scores, dex: 18 } }).ac, 17)
  eq('el estilo Defensa suma +1', at({ fightingStyleId: 'defense' }).ac, 19)
  eq('Defensa no aplica sin armadura', at({ fightingStyleId: 'defense', armorId: 'none', shield: false }).ac, 10)
  eq('valor manual manda', at({ acOverride: 21 }).ac, 21)
}

// ══ Los tres personajes de la mesa, todos a nivel 3 ═══════════════════════
const party = (classId: string, patch: Partial<Character> = {}) =>
  derive({ ...blankCharacter(classId, 3), ...patch })

console.log('\nHechicero dracónico de hielo, nivel 3')
{
  const d = party('sorcerer', {
    raceId: 'dragonborn', branchId: 'white', subclassId: 'draconic',
    scores: { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 15 },
    choices: { 'dragon-ancestor': ['white'], metamagic: ['quickened', 'twinned'] },
  })
  eq('lanzador completo desde nivel 1', d.casting.active, true)
  eq('espacios de nivel 3', d.casting.slotsMax, [4, 2, 0, 0, 0, 0, 0, 0, 0])
  eq('llega a conjuros de nivel 2', d.casting.maxSpellLevel, 2)
  eq('conoce conjuros, no los prepara', d.casting.mode, 'known')
  eq('4 conjuros conocidos', d.casting.spellLimit, 4)
  eq('4 trucos', d.casting.cantripLimit, 4)
  eq('CD de conjuros con CAR 16', d.casting.saveDC, 13)
  eq('3 puntos de hechicería', d.resources.find((r) => r.id === 'sorcery-points')?.max, 3)
  eq('los puntos son una reserva', d.resources.find((r) => r.id === 'sorcery-points')?.kind, 'pool')
  eq('2 metamagias a elegir', d.choices.find((g) => g.group.id === 'metamagic')?.max, 2)
  eq('el ancestro dracónico es una elección aparte', d.choices.some((g) => g.group.id === 'dragon-ancestor'), true)
  eq('aliento de frío por ser dracónido blanco', d.resources.find((r) => r.id === 'breath-weapon')?.detail.includes('frío'), true)
  eq('Resiliencia Dracónica: 6+2+2 de dado más 3 de CON más 3 de linaje', d.maxHp, 6 + 4 + 4 + 3 * 2 + 3)
  eq('sin armadura, CA 13 + DES', d.ac, 15)
  eq('nada de dotes a nivel 3', d.asiSlots, 0)
}

console.log('\nPícaro tiflin, nivel 3')
{
  const thief = party('rogue', { raceId: 'tiefling', subclassId: 'thief' })
  eq('no lanza conjuros', thief.casting.active, false)
  eq('Ataque Furtivo 2d6 a nivel 3', thief.scalings.find((x) => x.id === 'sneak-attack')?.value, '2d6')
  eq('4 competencias de clase', thief.cls.skillChoices, 4)
  eq('2 pericias', thief.expertiseMax, 2)
  eq('salvaciones de DES e INT', thief.saves.filter((x) => x.proficient).map((x) => x.key), ['dex', 'int'])
  eq('el ladrón no abre pestaña de conjuros', thief.casting.available.length, 0)

  const at3 = party('rogue', { raceId: 'tiefling', subclassId: 'arcane-trickster' })
  eq('el embaucador sí lanza', at3.casting.active, true)
  eq('lanzador de un tercio: 2 espacios de nivel 1', at3.casting.slotsMax, [2, 0, 0, 0])
  eq('solo conjuros de nivel 1', at3.casting.maxSpellLevel, 1)
  eq('lanza con Inteligencia', at3.casting.ability, 'int')
  eq('3 conjuros conocidos', at3.casting.spellLimit, 3)
  eq('3 trucos', at3.casting.cantripLimit, 3)
  eq('Mano de Mago es obligatorio', at3.casting.fixedCantripIds, ['mage-hand'])
  eq('Ataque Furtivo sigue siendo 2d6', at3.scalings.find((x) => x.id === 'sneak-attack')?.value, '2d6')

  const at13 = party('rogue', { subclassId: 'arcane-trickster', level: 13 })
  eq('a nivel 13 llega a conjuros de nivel 3', at13.casting.maxSpellLevel, 3)
  eq('Ataque Furtivo 7d6', at13.scalings.find((x) => x.id === 'sneak-attack')?.value, '7d6')
  eq('4 pericias desde nivel 6', at13.expertiseMax, 4)

  eq('el pícaro tiene mejora extra en el 10', party('rogue', { level: 10 }).asiSlots, 3)
}

console.log('\nMonje tiflin, nivel 3')
{
  const d = party('monk', {
    raceId: 'tiefling', subclassId: 'open-hand',
    scores: { str: 12, dex: 15, con: 13, int: 8, wis: 14, cha: 10 },
  })
  eq('Artes Marciales 1d4 a nivel 3', d.scalings.find((x) => x.id === 'martial-arts')?.value, '1d4')
  eq('3 puntos de ki', d.resources.find((r) => r.id === 'ki')?.max, 3)
  eq('el ki vuelve con descanso corto', d.resources.find((r) => r.id === 'ki')?.recharge, 'short')
  eq('CA 10 + DES + SAB, sin armadura', d.ac, 10 + 2 + 2)
  eq('velocidad 30 + 10 sin armadura', d.speed, 40)
  eq('no lanza conjuros', d.casting.active, false)
  eq('Desviar Proyectiles ya está', d.features.some((f) => f.name === 'Desviar Proyectiles'), true)
  eq('Golpe Aturdidor todavía no', d.features.some((f) => f.name === 'Golpe Aturdidor'), false)

  const shielded = party('monk', { subclassId: 'open-hand', armorId: 'chain-mail', shield: true })
  eq('con armadura pierde la defensa sin armadura', shielded.ac, 16 + 2)
  eq('y pierde la velocidad extra', shielded.speed, 30)

  const d5 = party('monk', { level: 5 })
  eq('Artes Marciales sube a 1d6 en el nivel 5', d5.scalings.find((x) => x.id === 'martial-arts')?.value, '1d6')
  eq('5 puntos de ki', d5.resources.find((r) => r.id === 'ki')?.max, 5)

  const cuatro = party('monk', { subclassId: 'four-elements', level: 6 })
  eq('el Camino de los Cuatro Elementos elige disciplinas', cuatro.choices.find((g) => g.group.id === 'elemental-disciplines')?.max, 2)
}

console.log('\nListas de conjuros y trucos')
{
  eq('sin duplicados en el catálogo', new Set(SPELLS.map((x) => x.id)).size, SPELLS.length)
  const ids = new Set(SPELLS.map((x) => x.id))
  for (const [name, list] of Object.entries(SPELL_LISTS)) {
    eq(`todos los ids de la lista de ${name} existen`, [...list].filter((i) => !ids.has(i)), [])
  }
  const fireBolt = SPELLS.find((x) => x.id === 'fire-bolt')!
  eq('Rayo de Fuego 1d10 a nivel 3', cantripDamage(fireBolt, 3), '1d10')
  eq('2d10 a nivel 5', cantripDamage(fireBolt, 5), '2d10')
  eq('4d10 a nivel 17', cantripDamage(fireBolt, 17), '4d10')
  eq('los trucos son de nivel 0', SPELLS.filter((x) => x.level === 0).length > 15, true)
}

console.log('\nSubir el máximo de puntos de golpe sube los actuales')
{
  // No es cosmético: en 5e subir Constitución es retroactivo.
  const base = { ...AREEN }
  const conMas = derive({ ...base, scores: { ...base.scores, con: base.scores.con + 2 } })
  eq('CON +2 sube el máximo en 3 a nivel 3', conMas.maxHp - derive(base).maxHp, 3)
  const nivel4 = derive({ ...base, level: 4 })
  eq('subir de nivel sube el máximo en 6 + CON', nivel4.maxHp - derive(base).maxHp, 7)
  eq('la dote Duro suma 2 por nivel', derive({ ...base, featIds: ['tough'] }).maxHp - derive(base).maxHp, 6)
}

console.log('\nLas subclases de Tasha\'s')
{
  const gloria = at({ subclassId: 'glory' })
  eq('Juramento de Gloria concede sus conjuros a nivel 3', gloria.casting.grantedIds, ['guiding-bolt', 'heroism'])
  eq('y los diez a nivel 17', at({ subclassId: 'glory', level: 17 }).casting.grantedIds.length, 10)
  eq('Atleta sin Par está desde el 3', gloria.features.some((f) => f.name === 'Canalizar Divinidad: Atleta sin Par'), true)
  eq('Defensa Gloriosa es un recurso a nivel 15',
     at({ subclassId: 'glory', level: 15 }).resources.find((r) => r.id === 'glorious-defense')?.max, 3)

  eq('Mente Aberrante concede un truco y dos conjuros a nivel 1',
     party('sorcerer', { subclassId: 'aberrant-mind', level: 1 }).casting.grantedIds,
     ['mind-sliver', 'arms-of-hadar', 'dissonant-whispers'])
  const aberrante = party('sorcerer', { subclassId: 'aberrant-mind' })
  eq('a nivel 3 se suman los dos siguientes', aberrante.casting.grantedIds.length, 5)
  eq('Esquirla Mental es un truco', SPELLS.find((x) => x.id === 'mind-sliver')?.level, 0)
  eq('los psiónicos no gastan tu límite de conocidos', aberrante.casting.spellLimit, 4)
  eq('a nivel 9 son once: el truco más cinco parejas',
     party('sorcerer', { subclassId: 'aberrant-mind', level: 9 }).casting.grantedIds.length, 11)

  eq('Alma de Relojería concede Alarma y Protección desde el 1',
     party('sorcerer', { subclassId: 'clockwork-soul', level: 1 }).casting.grantedIds,
     ['alarm', 'protection-from-evil-and-good'])
  const reloj = party('sorcerer', { subclassId: 'clockwork-soul' })
  eq('a nivel 3 ya son cuatro', reloj.casting.grantedIds.length, 4)
  eq('y diez a nivel 9', party('sorcerer', { subclassId: 'clockwork-soul', level: 9 }).casting.grantedIds.length, 10)
  eq('Restaurar el Equilibrio usa el bonificador de competencia', reloj.resources.find((r) => r.id === 'restore-balance')?.max, 2)
  eq('y sube con él a nivel 9', party('sorcerer', { subclassId: 'clockwork-soul', level: 9 }).resources.find((r) => r.id === 'restore-balance')?.max, 4)

  const fantasma = party('rogue', { subclassId: 'phantom' })
  eq('Lamentos desde la Tumba: usos = competencia', fantasma.resources.find((r) => r.id === 'wails-from-the-grave')?.max, 2)
  eq('los fetiches de alma llegan en el 9', fantasma.resources.some((r) => r.id === 'soul-trinkets'), false)
  eq('y están a nivel 9', party('rogue', { subclassId: 'phantom', level: 9 }).resources.some((r) => r.id === 'soul-trinkets'), true)
  eq('el fantasma no lanza conjuros', fantasma.casting.active, false)

  const cuchilla = party('rogue', { subclassId: 'soulknife' })
  eq('dado psiónico d6 a nivel 3', cuchilla.scalings.find((x) => x.id === 'psionic-die')?.value, 'd6')
  eq('d8 a nivel 5', party('rogue', { subclassId: 'soulknife', level: 5 }).scalings.find((x) => x.id === 'psionic-die')?.value, 'd8')
  eq('d12 a nivel 17', party('rogue', { subclassId: 'soulknife', level: 17 }).scalings.find((x) => x.id === 'psionic-die')?.value, 'd12')
  eq('dados de energía = 2 × competencia', cuchilla.resources.find((r) => r.id === 'psionic-energy')?.max, 4)
  eq('y 12 a nivel 17', party('rogue', { subclassId: 'soulknife', level: 17 }).resources.find((r) => r.id === 'psionic-energy')?.max, 12)
  eq('son una reserva, no marcas sueltas', cuchilla.resources.find((r) => r.id === 'psionic-energy')?.kind, 'pool')

  const misericordia = party('monk', { subclassId: 'mercy' })
  eq('Mano de Curación y Mano de Daño desde el 3',
     ['Mano de Curación', 'Mano de Daño'].every((n) => misericordia.features.some((f) => f.name === n)), true)
  eq('la Misericordia Última llega a nivel 17', party('monk', { subclassId: 'mercy', level: 17 }).resources.some((r) => r.id === 'hand-of-ultimate-mercy'), true)

  const astral = party('monk', { subclassId: 'astral-self' })
  eq('Brazos Astrales 1d10', astral.scalings.find((x) => x.id === 'astral-arms')?.value, '1d10')
  eq('el ki sigue siendo su recurso', astral.resources.find((r) => r.id === 'ki')?.max, 3)

  // Las subclases de Tasha's desaparecen si la mesa no las usa.
  eq('con Tasha\'s el paladín tiene 4 juramentos', at({}).subclasses.length, 4)
  eq('sin Tasha\'s quedan 3', at({ useTashas: false }).subclasses.length, 3)
  eq('el pícaro pasa de 5 a 3 arquetipos',
     [party('rogue').subclasses.length, party('rogue', { useTashas: false }).subclasses.length], [5, 3])
  eq('el monje, de 5 a 3 tradiciones',
     [party('monk').subclasses.length, party('monk', { useTashas: false }).subclasses.length], [5, 3])
  eq('el hechicero, de 4 a 2 orígenes',
     [party('sorcerer').subclasses.length, party('sorcerer', { useTashas: false }).subclasses.length], [4, 2])
  eq('y una subclase de Tasha\'s elegida deja de aplicarse', at({ subclassId: 'glory', useTashas: false }).subclass, null)
}

console.log('\nAlcance: solo Manual del Jugador y Tasha\'s')
{
  // Nada de Xanathar, Fizban ni otros suplementos.
  const FUERA = ['ceremony', 'toll-the-dead', 'word-of-radiance', 'green-flame-blade', 'booming-blade',
                 'shadow-blade', 'absorb-elements', 'silvery-barbs', 'aid-xge']
  for (const id of FUERA) eq(`${id} no está en el catálogo`, SPELLS.some((x) => x.id === id), false)
  eq('Ceremonia fuera de la lista de paladín', SPELL_LISTS.paladin.has('ceremony'), false)

  const conTasha = at({})
  const sinTasha = at({ useTashas: false })
  eq('con Tasha\'s el paladín tiene Canalizar Poder Divino', conTasha.features.some((f) => f.name === 'Canalizar Poder Divino'), true)
  eq('sin Tasha\'s no lo tiene', sinTasha.features.some((f) => f.name === 'Canalizar Poder Divino'), false)
  eq('sin Tasha\'s tampoco su recurso', sinTasha.resources.some((r) => r.id === 'harness-divine-power'), false)
  eq('los rasgos del Manual siguen intactos', sinTasha.features.some((f) => f.name === 'Castigo Divino'), true)

  eq('con Tasha\'s hay 7 estilos de combate', conTasha.fightingStyles.length, 7)
  eq('sin Tasha\'s quedan los 4 del Manual', sinTasha.fightingStyles.length, 4)

  const sorc = party('sorcerer', { subclassId: 'draconic' })
  const sorcPHB = party('sorcerer', { subclassId: 'draconic', useTashas: false })
  eq('con Tasha\'s hay 10 metamagias', sorc.choices.find((g) => g.group.id === 'metamagic')?.group.options.length, 10)
  eq('sin Tasha\'s quedan las 8 del Manual', sorcPHB.choices.find((g) => g.group.id === 'metamagic')?.group.options.length, 8)

  eq('el pícaro gana Puntería Firme con Tasha\'s', party('rogue').features.some((f) => f.name === 'Puntería Firme'), true)
  eq('y no sin Tasha\'s', party('rogue', { useTashas: false }).features.some((f) => f.name === 'Puntería Firme'), false)
  eq('el monje gana Ataque Alimentado por Ki', party('monk').features.some((f) => f.name === 'Ataque Alimentado por Ki'), true)
}

console.log('\nGuerrero Bendecido responde la pregunta de los trucos')
{
  const sinEstilo = at({ fightingStyleId: 'dueling' })
  eq('un paladín sin el estilo no tiene trucos', sinEstilo.casting.cantripLimit, 0)

  const bendecido = at({ fightingStyleId: 'blessed-warrior' })
  eq('con Guerrero Bendecido son 2 trucos', bendecido.casting.cantripLimit, 2)
  eq('y salen de la lista de clérigo', bendecido.casting.cantripPool.map((x) => x.id).sort(),
     ['guidance', 'light', 'mending', 'resistance', 'sacred-flame', 'spare-the-dying', 'thaumaturgy'])
  eq('sigue preparando sus conjuros normales', bendecido.casting.spellLimit, 4)

  const nivel1 = at({ fightingStyleId: 'blessed-warrior', level: 1 })
  eq('a nivel 1 todavía no hay estilo de combate, así que no hay trucos', nivel1.casting.cantripLimit, 0)

  const phb = at({ fightingStyleId: 'blessed-warrior', useTashas: false })
  eq('sin Tasha\'s el estilo no existe y no da trucos', phb.casting.cantripLimit, 0)

  // Una dote abre el catálogo entero, no solo la lista de clérigo.
  const iniciado = at({ level: 4, featIds: ['magic-initiate'] })
  eq('Iniciado en la Magia da 2 trucos', iniciado.casting.cantripLimit, 2)
  eq('y puede elegir entre todos', iniciado.casting.cantripPool.length > 15, true)
}

console.log('\nTabla de espacios de lanzador medio')
{
  eq('longitud de la tabla', HALF_CASTER_SLOTS.length, 20)
  eq('nivel 1 no tiene espacios', HALF_CASTER_SLOTS[0], [0, 0, 0, 0, 0])
  eq('nivel 2 abre la magia', HALF_CASTER_SLOTS[1], [2, 0, 0, 0, 0])
  eq('nivel 17 llega a conjuros de nivel 5', HALF_CASTER_SLOTS[16], [4, 3, 3, 3, 1])
  eq('competencia por nivel', [1, 4, 5, 9, 13, 17].map(proficiencyBonus), [2, 2, 3, 4, 5, 6])
  eq('lanzador completo: nivel 1 ya tiene espacios', FULL_CASTER_SLOTS[0], [2, 0, 0, 0, 0, 0, 0, 0, 0])
  eq('lanzador completo: nivel 20 llega a nivel 9', FULL_CASTER_SLOTS[19], [4, 3, 3, 3, 3, 2, 2, 1, 1])
  eq('lanzador de un tercio: nada hasta el nivel 3', THIRD_CASTER_SLOTS[1], [0, 0, 0, 0])
  eq('lanzador de un tercio: nivel 20', THIRD_CASTER_SLOTS[19], [4, 3, 3, 1])
}

console.log(failures === 0 ? '\n✓ Todas las comprobaciones pasan\n' : `\n✗ ${failures} fallo(s)\n`)
if (failures > 0) throw new Error(`${failures} comprobación(es) de reglas fallaron`)
