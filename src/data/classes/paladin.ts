import type { CharClass, ClassResource, FightingStyle, Subclass } from './types'
import { GLORY } from './paladin-glory'

const PALADIN_FIGHTING_STYLES: FightingStyle[] = [
  { id: 'defense', name: 'Defensa', text: 'Mientras lleves armadura, ganas +1 a la Clase de Armadura.' },
  { id: 'dueling', name: 'Duelo', text: 'Cuando empuñas un arma cuerpo a cuerpo en una mano y ningún otra arma, ganas +2 al daño con esa arma.' },
  { id: 'great-weapon', name: 'Arma grande', text: 'Cuando sacas un 1 o un 2 en un dado de daño con un arma cuerpo a cuerpo a dos manos o versátil empuñada a dos manos, puedes volver a tirar el dado y usar el nuevo resultado.' },
  { id: 'protection', name: 'Protección', turno: 'reaccion', text: 'Cuando una criatura que puedes ver ataca a un objetivo a 5 pies o menos de ti, puedes usar tu reacción para imponer desventaja a la tirada de ataque. Debes empuñar un escudo.' },
  {
    id: 'blessed-warrior', name: 'Guerrero Bendecido', source: 'TCE',
    text: 'Aprendes dos trucos de la lista de clérigo. Carisma es tu característica de lanzamiento para ellos. Cada vez que ganes un nivel de paladín puedes cambiar uno de los dos por otro truco de clérigo.',
    grantsCantrips: { count: 2, listId: 'cleric-cantrips', ability: 'cha' },
  },
  { id: 'blind-fighting', name: 'Lucha a Ciegas', source: 'TCE', text: 'Tienes percepción ciega con alcance de 10 pies: dentro de ese radio ves cualquier cosa que no esté tras cobertura total, aunque estés cegado o la criatura sea invisible.' },
  { id: 'interception', name: 'Intercepción', turno: 'reaccion', source: 'TCE', text: 'Cuando una criatura que puedes ver acierta a un objetivo a 5 pies de ti, puedes usar tu reacción para reducir el daño en 1d10 + tu bonificador de competencia. Debes empuñar un escudo o un arma.' },
]

const DEVOTION: Subclass = {
  id: 'devotion',
  name: 'Juramento de Devoción',
  flavor: 'Honestidad, valor, compasión, honor y deber. El paladín que jura devoción es el ideal del caballero de brillante armadura, atado a la verdad por encima de todo.',
  oathSpells: {
    3: ['protection-from-evil-and-good', 'sanctuary'],
    5: ['lesser-restoration', 'zone-of-truth'],
    9: ['beacon-of-hope', 'dispel-magic'],
    13: ['freedom-of-movement', 'guardian-of-faith'],
    17: ['commune', 'flame-strike'],
  },
  features: [
    { level: 3, subclass: 'devotion', name: 'Canalizar Divinidad: Arma Sagrada', turno: 'accion', text: 'Como acción, imbuyes un arma que empuñas con energía positiva durante 1 minuto. Añades tu modificador de Carisma a las tiradas de ataque con ella (mínimo +1). El arma emite luz brillante en 20 pies y luz tenue 20 pies más. Si el arma no era mágica, lo es mientras dure. Termina si sueltas el arma o si usas esta opción otra vez.' },
    { level: 3, subclass: 'devotion', name: 'Canalizar Divinidad: Expulsar a los Impíos', turno: 'accion', text: 'Como acción, presentas tu símbolo sagrado y cada fiend o no-muerto a 30 pies que pueda verte u oírte hace una salvación de Sabiduría. Si falla, queda expulsado 1 minuto o hasta recibir daño.' },
    { level: 7, subclass: 'devotion', name: 'Aura de Devoción', text: 'Tú y las criaturas amistosas a 10 pies de ti no podéis ser encantados mientras estés consciente. A nivel 18 el radio sube a 30 pies.' },
    { level: 15, subclass: 'devotion', name: 'Pureza de Espíritu', text: 'Estás siempre bajo el efecto de un conjuro de protección contra el bien y el mal.' },
    { level: 20, subclass: 'devotion', name: 'Nimbo Sagrado', turno: 'accion', text: 'Como acción, emanas luz solar durante 1 minuto: luz brillante en 30 pies. Los enemigos que empiecen su turno dentro reciben 10 de daño radiante, y tienes ventaja en salvaciones contra conjuros de fiends y no-muertos. Una vez por descanso largo.' },
  ],
  resources: [
    { id: 'holy-nimbus', name: 'Nimbo Sagrado', detail: 'Luz solar en 30 pies durante 1 minuto', recharge: 'long', kind: 'uses', level: 20, max: { type: 'fixed', n: 1 } },
  ],
}

const ANCIENTS: Subclass = {
  id: 'ancients',
  name: 'Juramento de los Ancestros',
  flavor: 'Preservar la luz y la vida allí donde aún ardan. El paladín verde, atado a la naturaleza y a la alegría antes que a la ley.',
  oathSpells: {
    3: ['ensnaring-strike', 'speak-with-animals'],
    5: ['misty-step', 'moonbeam'],
    9: ['plant-growth', 'protection-from-energy'],
    13: ['ice-storm', 'stoneskin'],
    17: ['commune-with-nature', 'tree-stride'],
  },
  features: [
    { level: 3, subclass: 'ancients', name: 'Canalizar Divinidad: Ira de la Naturaleza', turno: 'accion', text: 'Como acción, invocas zarcillos espectrales alrededor de una criatura a 10 pies. Debe superar una salvación de Fuerza o Destreza o quedar apresada. Puede repetir la salvación al final de cada uno de sus turnos.' },
    { level: 3, subclass: 'ancients', name: 'Canalizar Divinidad: Expulsar a los Infieles', turno: 'accion', text: 'Como acción, presentas tu símbolo sagrado y cada fey o fiend a 30 pies que pueda verte u oírte hace una salvación de Sabiduría o queda expulsado 1 minuto.' },
    { level: 7, subclass: 'ancients', name: 'Aura de Guarda', text: 'Tú y las criaturas amistosas a 10 pies tenéis resistencia al daño de conjuros. A nivel 18 el radio sube a 30 pies.' },
    { level: 15, subclass: 'ancients', name: 'Centinela Imperecedero', text: 'Cuando bajas a 0 puntos de golpe y no mueres al instante, quedas en 1 punto de golpe. Una vez por descanso largo.' },
    { level: 20, subclass: 'ancients', name: 'Campeón Ancestral', turno: 'accion', text: 'Como acción, asumes forma primigenia 1 minuto: regeneras 10 puntos de golpe al inicio de cada turno, tus conjuros se lanzan como acción adicional, y los enemigos a 10 pies tienen desventaja en salvaciones contra tus conjuros. Una vez por descanso largo.' },
  ],
  resources: [
    { id: 'undying-sentinel', name: 'Centinela Imperecedero', detail: 'Al caer a 0 puntos de golpe, quedas en 1', recharge: 'long', kind: 'uses', level: 15, max: { type: 'fixed', n: 1 } },
    { id: 'elder-champion', name: 'Campeón Ancestral', detail: 'Forma primigenia durante 1 minuto', recharge: 'long', kind: 'uses', level: 20, max: { type: 'fixed', n: 1 } },
  ],
}

const VENGEANCE: Subclass = {
  id: 'vengeance',
  name: 'Juramento de Venganza',
  flavor: 'Castigar a quienes cometieron un pecado grave. Cuando el mal es demasiado grande, la piedad se aparta.',
  oathSpells: {
    3: ['bane', 'hunters-mark'],
    5: ['hold-person', 'misty-step'],
    9: ['haste', 'protection-from-energy'],
    13: ['banishment', 'dimension-door'],
    17: ['hold-monster', 'scrying'],
  },
  features: [
    { level: 3, subclass: 'vengeance', name: 'Canalizar Divinidad: Abjurar Enemigo', turno: 'accion', text: 'Como acción, eliges una criatura a 60 pies que puedas ver. Hace una salvación de Sabiduría o queda asustada 1 minuto (velocidad 0). Si la supera, su velocidad se reduce a la mitad 1 minuto.' },
    { level: 3, subclass: 'vengeance', name: 'Canalizar Divinidad: Voto de Enemistad', turno: 'adicional', text: 'Como acción adicional, eliges una criatura a 10 pies. Ganas ventaja en tiradas de ataque contra ella durante 1 minuto o hasta que caiga a 0 puntos de golpe.' },
    { level: 7, subclass: 'vengeance', name: 'Vengador Implacable', text: 'Cuando aciertas un ataque de oportunidad, puedes moverte hasta la mitad de tu velocidad como parte de la reacción, sin provocar ataques de oportunidad.' },
    { level: 15, subclass: 'vengeance', name: 'Alma de Venganza', turno: 'reaccion', text: 'Cuando una criatura bajo tu Voto de Enemistad ataca, puedes usar tu reacción para hacerle un ataque cuerpo a cuerpo.' },
    { level: 20, subclass: 'vengeance', name: 'Ángel Vengador', turno: 'accion', text: 'Como acción, ganas alas y vuelo 60 pies durante 1 hora. Los enemigos a 30 pies hacen una salvación de Sabiduría o quedan asustados 1 minuto. Una vez por descanso largo.' },
  ],
  resources: [
    { id: 'avenging-angel', name: 'Ángel Vengador', detail: 'Alas y vuelo 60 pies durante 1 hora', recharge: 'long', kind: 'uses', level: 20, max: { type: 'fixed', n: 1 } },
  ],
}

const PALADIN_RESOURCES: ClassResource[] = [
  {
    id: 'divine-sense',
    name: 'Sentido Divino',
    detail: 'Detecta celestiales, fiends y no-muertos a 60 pies',
    recharge: 'long', kind: 'uses', level: 1,
    max: { type: 'ability', ability: 'cha', plus: 1, min: 1 },
  },
  {
    id: 'lay-on-hands',
    name: 'Imposición de Manos',
    detail: 'Reparte curación tocando a quien la necesite; 5 puntos curan una enfermedad o un veneno',
    recharge: 'long', kind: 'pool', level: 1,
    max: { type: 'levelTimes', factor: 5 },
  },
  {
    id: 'channel-divinity',
    name: 'Canalizar Divinidad',
    detail: 'Alimenta un efecto mágico de tu juramento',
    recharge: 'short', kind: 'uses', level: 3,
    max: { type: 'fixed', n: 1 },
  },
  {
    id: 'harness-divine-power',
    name: 'Canalizar Poder Divino',
    detail: 'Gastas un uso de Canalizar Divinidad para recuperar un espacio de conjuro',
    recharge: 'long', kind: 'uses', level: 2, source: 'TCE',
    max: { type: 'table', values: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3] },
  },
  {
    id: 'cleansing-touch',
    name: 'Toque Purificador',
    detail: 'Termina un conjuro sobre ti o sobre quien toques',
    recharge: 'long', kind: 'uses', level: 14,
    max: { type: 'ability', ability: 'cha', min: 1 },
  },
]

export const PALADIN: CharClass = {
  id: 'paladin',
  name: 'Paladín',
  hitDie: 10,
  primary: ['str', 'cha'],
  savingThrows: ['wis', 'cha'],
  skillChoices: 2,
  skillList: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
  casterType: 'half',
  spellPrep: 'prepared',
  spellcastingAbility: 'cha',
  spellcastingLevel: 2,
  spellListId: 'paladin',
  subclassLabel: 'Juramento sagrado',
  subclassLevel: 3,
  subclasses: [DEVOTION, ANCIENTS, VENGEANCE, GLORY],
  fightingStyles: PALADIN_FIGHTING_STYLES,
  fightingStyleLevel: 2,
  resources: PALADIN_RESOURCES,
  scalings: [
    {
      id: 'divine-smite',
      name: 'Castigo Divino',
      detail: 'Daño radiante extra al gastar un espacio; +1d8 contra no-muertos y fiends',
      byLevel: ['—', '2d8', '2d8', '2d8', '2d8', '2d8', '2d8', '2d8', '2d8', '2d8',
                '2d8', '2d8', '2d8', '2d8', '2d8', '2d8', '2d8', '2d8', '2d8', '2d8'],
    },
  ],
  features: [
    { level: 1, name: 'Sentido Divino', turno: 'accion', text: 'Como acción, hasta el final de tu siguiente turno detectas la presencia de celestiales, fiends y no-muertos a 60 pies que no estén tras cobertura total, y percibes lugares u objetos consagrados o profanados. Usos: 1 + tu modificador de Carisma, por descanso largo.' },
    { level: 1, name: 'Imposición de Manos', turno: 'accion', text: 'Tienes una reserva de curación que se repone en cada descanso largo, igual a 5 × tu nivel de paladín. Como acción, tocas una criatura y gastas puntos de la reserva para restaurarle esa cantidad de puntos de golpe. Alternativamente puedes gastar 5 puntos para curar una enfermedad o neutralizar un veneno.' },
    { level: 2, name: 'Estilo de Combate', text: 'Adoptas un estilo de combate como especialidad. No puedes elegir el mismo estilo más de una vez, aunque después ganes otro.' },
    { level: 2, name: 'Lanzamiento de Conjuros', text: 'Aprendes a canalizar magia divina. Carisma es tu característica de lanzamiento: preparas un número de conjuros igual a tu modificador de Carisma + la mitad de tu nivel de paladín, redondeando hacia abajo. Puedes cambiar la lista al terminar un descanso largo.' },
    { level: 2, name: 'Castigo Divino', text: 'Cuando aciertas un ataque cuerpo a cuerpo con arma, puedes gastar un espacio de conjuro para infligir daño radiante adicional: 2d8 por un espacio de nivel 1, +1d8 por cada nivel por encima, hasta 5d8. El daño aumenta en 1d8 si el objetivo es no-muerto o fiend.' },
    { level: 2, name: 'Canalizar Poder Divino', turno: 'adicional', source: 'TCE', text: 'Como acción adicional, gastas un uso de Canalizar Divinidad para recuperar un espacio de conjuro gastado, de nivel igual o inferior a la mitad de tu bonificador de competencia, redondeando hacia arriba. Una vez por descanso largo, dos veces a nivel 7 y tres a nivel 15.' },
    { level: 4, name: 'Versatilidad Marcial', source: 'TCE', text: 'Cada vez que ganes una mejora de característica, puedes cambiar tu estilo de combate por otro que esté disponible para paladines.' },
    { level: 3, name: 'Salud Divina', text: 'La magia divina que fluye por ti te hace inmune a las enfermedades.' },
    { level: 3, name: 'Canalizar Divinidad', text: 'Tu juramento te permite canalizar energía divina para alimentar efectos mágicos. Tienes un uso, y lo recuperas al terminar un descanso corto o largo.' },
    { level: 4, name: 'Mejora de Característica', text: 'Sube una característica en 2, o dos características en 1 cada una. No puedes pasar de 20. Alternativamente, puedes tomar una dote.' },
    { level: 5, name: 'Ataque Adicional', text: 'Puedes atacar dos veces, en vez de una, siempre que realices la acción de Atacar en tu turno.' },
    { level: 6, name: 'Aura de Protección', text: 'Cuando tú o una criatura amistosa a 10 pies de ti tenéis que hacer una tirada de salvación, la criatura gana un bonificador igual a tu modificador de Carisma (mínimo +1). Debes estar consciente. A nivel 18 el radio sube a 30 pies.' },
    { level: 8, name: 'Mejora de Característica', text: 'Sube una característica en 2, o dos características en 1 cada una. No puedes pasar de 20. Alternativamente, puedes tomar una dote.' },
    { level: 10, name: 'Aura de Valor', text: 'Tú y las criaturas amistosas a 10 pies de ti no podéis ser asustados mientras estés consciente. A nivel 18 el radio sube a 30 pies.' },
    { level: 11, name: 'Castigo Divino Mejorado', text: 'Tus golpes cuerpo a cuerpo llevan poder divino: cada vez que aciertas con un arma cuerpo a cuerpo, infliges 1d8 de daño radiante adicional, sin gastar espacio de conjuro.' },
    { level: 12, name: 'Mejora de Característica', text: 'Sube una característica en 2, o dos características en 1 cada una. No puedes pasar de 20. Alternativamente, puedes tomar una dote.' },
    { level: 14, name: 'Toque Purificador', turno: 'accion', text: 'Como acción, terminas un conjuro sobre ti o sobre una criatura voluntaria que toques. Usos: tu modificador de Carisma (mínimo 1), por descanso largo.' },
    { level: 16, name: 'Mejora de Característica', text: 'Sube una característica en 2, o dos características en 1 cada una. No puedes pasar de 20. Alternativamente, puedes tomar una dote.' },
    { level: 18, name: 'Mejoras de Aura', text: 'El radio de tus auras aumenta de 10 a 30 pies.' },
    { level: 19, name: 'Mejora de Característica', text: 'Sube una característica en 2, o dos características en 1 cada una. No puedes pasar de 20. Alternativamente, puedes tomar una dote.' },
  ],
}
