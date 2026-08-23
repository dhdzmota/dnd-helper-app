import type { CharClass, ChoiceGroup, ClassFeature, ClassResource, Subclass } from './types'
import { ABERRANT_MIND, CLOCKWORK_SOUL } from './sorcerer-tashas'

const METAMAGIC: ChoiceGroup = {
  id: 'metamagic',
  label: 'Metamagia',
  hint: 'Retuerces tus conjuros gastando puntos de hechicería. Solo puedes aplicar una opción por conjuro, salvo que diga lo contrario.',
  level: 3,
  countByLevel: [0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4],
  options: [
    { id: 'careful', name: 'Conjuro Cuidadoso', text: '1 punto. Al lanzar un conjuro que obliga a otras criaturas a hacer una salvación, eliges hasta tu modificador de Carisma de ellas: superan la salvación automáticamente.' },
    { id: 'distant', name: 'Conjuro Distante', text: '1 punto. Doblas el alcance de un conjuro de 5 pies o más. Si es de toque, pasa a tener 30 pies de alcance.' },
    { id: 'empowered', name: 'Conjuro Potenciado', text: '1 punto. Vuelves a tirar hasta tu modificador de Carisma en dados de daño del conjuro y usas los nuevos resultados. Puedes combinarlo con otra metamagia.' },
    { id: 'extended', name: 'Conjuro Extendido', text: '1 punto. Doblas la duración de un conjuro de 1 minuto o más, hasta un máximo de 24 horas.' },
    { id: 'heightened', name: 'Conjuro Intensificado', text: '3 puntos. Un objetivo del conjuro tiene desventaja en su primera tirada de salvación contra él.' },
    { id: 'quickened', name: 'Conjuro Acelerado', text: '2 puntos. Un conjuro de 1 acción pasa a lanzarse como acción adicional.' },
    { id: 'subtle', name: 'Conjuro Sutil', text: '1 punto. Lanzas el conjuro sin componentes verbales ni somáticos: nadie nota que estás lanzando magia.' },
    { id: 'twinned', name: 'Conjuro Gemelo', text: 'Puntos iguales al nivel del conjuro (1 si es truco). Un conjuro que solo apunta a una criatura y no es de área apunta a una segunda.' },
    { id: 'seeking', name: 'Conjuro Buscador', source: 'TCE', text: '2 puntos. Si fallas una tirada de ataque de conjuro, gastas los puntos para repetirla, y debes quedarte con el nuevo resultado.' },
    { id: 'transmuted', name: 'Conjuro Transmutado', source: 'TCE', text: '1 punto. Cambias el tipo de daño de un conjuro por otro de esta lista: ácido, frío, fuego, relámpago, veneno o trueno.' },
  ],
}

const DRAGON_ANCESTOR: ChoiceGroup = {
  id: 'dragon-ancestor',
  label: 'Ancestro dracónico',
  hint: 'Elige el dragón de tu linaje. Determina el tipo de daño de tu Afinidad Elemental y el idioma que hablas.',
  level: 1,
  countByLevel: Array(20).fill(1),
  options: [
    { id: 'black', name: 'Negro', text: 'Daño de ácido.' },
    { id: 'blue', name: 'Azul', text: 'Daño de relámpago.' },
    { id: 'brass', name: 'Latón', text: 'Daño de fuego.' },
    { id: 'bronze', name: 'Bronce', text: 'Daño de relámpago.' },
    { id: 'copper', name: 'Cobre', text: 'Daño de ácido.' },
    { id: 'gold', name: 'Oro', text: 'Daño de fuego.' },
    { id: 'green', name: 'Verde', text: 'Daño de veneno.' },
    { id: 'red', name: 'Rojo', text: 'Daño de fuego.' },
    { id: 'silver', name: 'Plata', text: 'Daño de frío.' },
    { id: 'white', name: 'Blanco', text: 'Daño de frío.' },
  ],
}

const DRACONIC: Subclass = {
  id: 'draconic',
  name: 'Linaje Dracónico',
  flavor: 'Un dragón dejó su marca en tu sangre. La magia no la aprendiste: te vino de nacimiento, y la piel empieza a delatarlo.',
  choiceGroups: [DRAGON_ANCESTOR],
  unarmoredDefense: { name: 'Resiliencia Dracónica', base: 13, abilities: ['dex'], allowsShield: true },
  hpPerLevel: 1,
  features: [
    { level: 1, subclass: 'draconic', name: 'Ancestro Dracónico', text: 'Eliges un tipo de dragón. Hablas Dracónico, y cuando haces una prueba de Carisma al tratar con dragones, tu bonificador de competencia se dobla.' },
    { level: 1, subclass: 'draconic', name: 'Resiliencia Dracónica', text: 'Tu máximo de puntos de golpe sube en 1 y en 1 más por cada nivel de hechicero. Partes de tu piel están cubiertas de escamas: cuando no llevas armadura, tu Clase de Armadura es 13 + tu modificador de Destreza.' },
    { level: 6, subclass: 'draconic', name: 'Afinidad Elemental', text: 'Cuando lanzas un conjuro que inflige daño del tipo de tu ancestro, sumas tu modificador de Carisma a ese daño. También puedes gastar 1 punto de hechicería para ganar resistencia a ese daño durante 1 hora.' },
    { level: 14, subclass: 'draconic', name: 'Alas de Dragón', text: 'Como acción adicional, te brotan alas y ganas velocidad de vuelo igual a tu velocidad actual. Duran hasta que las disipes con otra acción adicional. No funcionan con armadura que no esté adaptada.' },
    { level: 18, subclass: 'draconic', name: 'Presencia Dracónica', text: 'Gastas 5 puntos de hechicería para emanar un aura temible o encantadora de 60 pies durante 1 minuto. Cada criatura que empiece su turno dentro hace una salvación de Sabiduría o queda encantada o asustada (tú eliges) mientras dure.' },
  ],
}

const WILD_MAGIC: Subclass = {
  id: 'wild-magic',
  name: 'Magia Salvaje',
  flavor: 'Tu magia viene de una grieta en el tejido del multiverso. A veces obedece; a veces pasa algo que nadie pidió.',
  resources: [
    { id: 'tides-of-chaos', name: 'Mareas del Caos', detail: 'Ventaja en una tirada de ataque, prueba o salvación', recharge: 'long', kind: 'uses', level: 1, max: { type: 'fixed', n: 1 } },
  ],
  features: [
    { level: 1, subclass: 'wild-magic', name: 'Oleada de Magia Salvaje', text: 'Justo después de lanzar un conjuro de nivel 1 o superior, el DM puede pedirte que tires 1d20. Si sacas un 1, tiras en la tabla de Oleada de Magia Salvaje y ocurre el efecto que salga.' },
    { level: 1, subclass: 'wild-magic', name: 'Mareas del Caos', text: 'Ganas ventaja en una tirada de ataque, prueba de característica o salvación. Antes de recuperarlo, el DM puede hacerte tirar en la tabla de Oleada de Magia Salvaje tras un conjuro, y eso te devuelve el uso.' },
    { level: 6, subclass: 'wild-magic', name: 'Torcer la Suerte', text: 'Cuando otra criatura que puedas ver hace una tirada de ataque, prueba o salvación, gastas 2 puntos de hechicería como reacción para sumar o restar 1d4 al resultado.' },
    { level: 14, subclass: 'wild-magic', name: 'Caos Controlado', text: 'Cuando tiras en la tabla de Oleada de Magia Salvaje, puedes tirar dos veces y quedarte con el resultado que prefieras.' },
    { level: 18, subclass: 'wild-magic', name: 'Bombardeo Mágico', text: 'Cuando saques el máximo en un dado de daño de un conjuro, tira ese dado otra vez y suma el nuevo resultado al daño.' },
  ],
}

const SORCERER_RESOURCES: ClassResource[] = [
  {
    id: 'sorcery-points',
    name: 'Puntos de hechicería',
    detail: 'Alimentan la metamagia, y se cambian por espacios de conjuro (2 puntos = nivel 1, 3 = nivel 2, 5 = nivel 3, 6 = nivel 4, 7 = nivel 5)',
    recharge: 'long', kind: 'pool', level: 2,
    max: { type: 'level' },
  },
]

export const SORCERER: CharClass = {
  id: 'sorcerer',
  name: 'Hechicero',
  hitDie: 6,
  primary: ['cha'],
  savingThrows: ['con', 'cha'],
  skillChoices: 2,
  skillList: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
  casterType: 'full',
  spellPrep: 'known',
  spellcastingAbility: 'cha',
  spellcastingLevel: 1,
  spellListId: 'sorcerer',
  spellsKnownByLevel: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  cantripsKnownByLevel: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  subclassLabel: 'Origen de hechicería',
  subclassLevel: 1,
  subclasses: [DRACONIC, WILD_MAGIC, ABERRANT_MIND, CLOCKWORK_SOUL],
  choiceGroups: [METAMAGIC],
  resources: SORCERER_RESOURCES,
  features: ([
    { level: 1, name: 'Lanzamiento de Conjuros', text: 'Un acontecimiento en tu pasado dejó magia en ti. Carisma es tu característica de lanzamiento. Conoces un número fijo de conjuros: no los preparas, los tienes. Al subir de nivel puedes cambiar uno conocido por otro de un nivel que puedas lanzar.' },
    { level: 1, name: 'Origen de Hechicería', text: 'Eliges la fuente de tu poder innato. Te da rasgos ahora y más adelante en los niveles 6, 14 y 18.' },
    { level: 2, name: 'Fuente de Magia', text: 'Tienes puntos de hechicería iguales a tu nivel de hechicero, que se reponen en cada descanso largo. Como acción adicional puedes cambiar puntos por un espacio de conjuro, o gastar un espacio para recuperar puntos iguales a su nivel.' },
    { level: 3, name: 'Metamagia', text: 'Aprendes a retorcer tus conjuros. Ganas dos opciones de metamagia, una tercera a nivel 10 y una cuarta a nivel 17. Solo puedes usar una por conjuro, salvo que la opción diga otra cosa.' },
    { level: 4, name: 'Versatilidad Hechicera', source: 'TCE', text: 'Cada vez que ganes una mejora de característica, puedes cambiar un truco que conozcas por otro de la lista de hechicero, o cambiar una opción de metamagia por otra.' },
    { level: 5, name: 'Guía Mágica', source: 'TCE', text: 'Cuando fallas una prueba de característica, gastas 1 punto de hechicería para volver a tirar el d20, y debes quedarte con el nuevo resultado.' },
    { level: 20, name: 'Restauración Hechicera', text: 'Recuperas 4 puntos de hechicería al terminar un descanso corto.' },
  ] as ClassFeature[]).concat(
    [4, 8, 12, 16, 19].map((level) => ({
      level,
      name: 'Mejora de Característica',
      text: 'Sube una característica en 2, o dos características en 1 cada una. No puedes pasar de 20. Alternativamente, puedes tomar una dote.',
    })),
  ).sort((a, b) => a.level - b.level),
}
