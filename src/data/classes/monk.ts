import type { CharClass, ChoiceGroup, ClassFeature, ClassResource, Subclass } from './types'
import { ASTRAL_SELF, MERCY } from './monk-tashas'

const martialArtsDie = (level: number) =>
  level >= 17 ? '1d10' : level >= 11 ? '1d8' : level >= 5 ? '1d6' : '1d4'

const unarmoredMovement = (level: number) =>
  level >= 18 ? '+30' : level >= 14 ? '+25' : level >= 10 ? '+20' : level >= 6 ? '+15' : level >= 2 ? '+10' : '—'

const OPEN_HAND: Subclass = {
  id: 'open-hand',
  name: 'Camino de la Mano Abierta',
  flavor: 'El arte marcial puro. Cada golpe puede desequilibrar, derribar o apartar; el cuerpo entero es el arma.',
  resources: [
    { id: 'wholeness-of-body', name: 'Plenitud Corporal', detail: 'Te curas a ti mismo el triple de tu nivel de monje', recharge: 'long', kind: 'uses', level: 6, max: { type: 'fixed', n: 1 } },
    { id: 'quivering-palm', name: 'Palma Temblorosa', detail: 'Vibraciones letales que puedes detonar hasta pasados tus días de nivel', recharge: 'long', kind: 'uses', level: 17, max: { type: 'fixed', n: 1 } },
  ],
  features: [
    { level: 3, subclass: 'open-hand', name: 'Técnica de la Mano Abierta', text: 'Cuando aciertas con un ataque de Ráfaga de Golpes, puedes imponer un efecto: la criatura no puede reaccionar hasta el final de tu siguiente turno; hace una salvación de Destreza o queda derribada; o hace una salvación de Fuerza o la empujas 15 pies.' },
    { level: 6, subclass: 'open-hand', name: 'Plenitud Corporal', turno: 'accion', text: 'Como acción, recuperas puntos de golpe iguales al triple de tu nivel de monje. Una vez por descanso largo.' },
    { level: 11, subclass: 'open-hand', name: 'Tranquilidad', text: 'Al terminar un descanso largo, ganas el efecto de un conjuro de santuario que dura hasta el inicio de tu siguiente descanso largo. La CD de la salvación es 8 + tu modificador de Sabiduría + tu bonificador de competencia.' },
    { level: 17, subclass: 'open-hand', name: 'Palma Temblorosa', turno: 'accion', text: 'Cuando aciertas con un ataque sin armas, gastas 3 puntos de ki para poner vibraciones letales en el cuerpo del objetivo. Duran tus días de nivel de monje. Con una acción puedes acabarlas: si falla una salvación de Constitución, cae a 0 puntos de golpe; si la supera, recibe 10d10 de daño necrótico.' },
  ],
}

const SHADOW: Subclass = {
  id: 'shadow',
  name: 'Camino de la Sombra',
  flavor: 'Monjes que siguen el sigilo y la oscuridad. Estabas ahí hace un momento; ahora estás detrás.',
  features: [
    { level: 3, subclass: 'shadow', name: 'Artes de la Sombra', text: 'Puedes gastar 2 puntos de ki para lanzar oscuridad, oscurovisión, paso sin rastro o silencio sin componentes materiales. Además conoces el truco ilusión menor.' },
    { level: 6, subclass: 'shadow', name: 'Paso de Sombra', turno: 'adicional', text: 'Cuando estás en luz tenue u oscuridad, como acción adicional te teletransportas hasta 60 pies a otro espacio en luz tenue u oscuridad. Ganas ventaja en el primer ataque cuerpo a cuerpo antes del final del turno.' },
    { level: 11, subclass: 'shadow', name: 'Manto de Sombras', turno: 'accion', text: 'En luz tenue u oscuridad, con una acción te vuelves invisible. Dura hasta que ataques, lances un conjuro o entres en luz brillante.' },
    { level: 17, subclass: 'shadow', name: 'Oportunista', turno: 'reaccion', text: 'Cuando una criatura a 5 pies de ti recibe daño de otra criatura, puedes usar tu reacción para hacerle un ataque cuerpo a cuerpo.' },
  ],
}

const ELEMENTAL_DISCIPLINES: ChoiceGroup = {
  id: 'elemental-disciplines',
    resourceId: 'ki',
  label: 'Disciplinas elementales',
  hint: 'Cada disciplina cuesta puntos de ki al usarla. Solo puedes aprender las que tu nivel permita.',
  level: 3,
  countByLevel: [0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4],
  options: [
    { id: 'elemental-attunement', name: 'Sintonía Elemental', turno: 'accion', text: 'Sin coste. Con una acción creas un efecto elemental inofensivo: una llama en la palma, una brisa, un puñado de agua o de tierra.' },
    { id: 'shape-flowing-river', name: 'Moldear el Río Fluyente', turno: 'accion', text: 'Sin coste. Con una acción, congelas o descongelas agua o hielo en un área de 30 pies de lado a 120 pies.' },
    { id: 'fangs-fire-snake', name: 'Colmillos de la Serpiente de Fuego', text: '1 punto de ki. Al usar la acción de Atacar, tus ataques ganan 10 pies de alcance y añaden 1d10 de daño de fuego.' },
    { id: 'water-whip', name: 'Látigo de Agua', turno: 'adicional', text: '2 puntos de ki. Como acción adicional, una criatura a 30 pies hace una salvación de Destreza: 3d10 contundente y la derribas o la atraes 25 pies. Mitad de daño si la supera.' },
    { id: 'fist-four-thunders', name: 'Puño de los Cuatro Truenos', text: '2 puntos de ki. Lanzas onda atronadora.' },
    { id: 'fist-unbroken-air', name: 'Puño del Aire Inquebrantable', text: '2 puntos de ki. Una criatura a 30 pies hace una salvación de Fuerza: 3d10 contundente, la empujas 20 pies y queda derribada.' },
    { id: 'rush-gale-spirits', name: 'Ímpetu de los Espíritus del Vendaval', text: '2 puntos de ki. Lanzas ráfaga de viento.' },
    { id: 'sweeping-cinder-strike', name: 'Golpe de Ceniza Barredora', text: '2 puntos de ki. Lanzas manos ardientes.' },
    { id: 'clench-north-wind', name: 'Garra del Viento del Norte', text: '3 puntos de ki. Lanzas inmovilizar persona. Requiere nivel 6.' },
    { id: 'gong-summit', name: 'Gong de la Cumbre', text: '3 puntos de ki. Lanzas estrépito. Requiere nivel 6.' },
    { id: 'flames-phoenix', name: 'Llamas del Fénix', text: '4 puntos de ki. Lanzas bola de fuego. Requiere nivel 11.' },
    { id: 'mist-stance', name: 'Postura de la Niebla', text: '4 puntos de ki. Lanzas forma gaseosa sobre ti. Requiere nivel 11.' },
    { id: 'ride-wind', name: 'Cabalgar el Viento', text: '4 puntos de ki. Lanzas volar sobre ti. Requiere nivel 11.' },
    { id: 'eternal-mountain', name: 'Defensa de la Montaña Eterna', text: '5 puntos de ki. Lanzas piel pétrea sobre ti. Requiere nivel 17.' },
    { id: 'river-hungry-flame', name: 'Río de Llama Hambrienta', text: '5 puntos de ki. Lanzas muro de fuego. Requiere nivel 17.' },
    { id: 'breath-winter', name: 'Aliento del Invierno', text: '6 puntos de ki. Lanzas cono de frío. Requiere nivel 17.' },
    { id: 'wave-rolling-earth', name: 'Ola de Tierra Rodante', text: '6 puntos de ki. Lanzas muro de piedra. Requiere nivel 17.' },
  ],
}

const FOUR_ELEMENTS: Subclass = {
  id: 'four-elements',
  name: 'Camino de los Cuatro Elementos',
  flavor: 'Has aprendido a mover el ki más allá del cuerpo: fuego, viento, tierra y agua responden a tu forma.',
  choiceGroups: [ELEMENTAL_DISCIPLINES],
  features: [
    { level: 3, subclass: 'four-elements', name: 'Discípulo de los Elementos', text: 'Aprendes disciplinas mágicas que canalizan tu ki. Conoces una a nivel 3 y otra a niveles 6, 11 y 17. Cuando una disciplina lanza un conjuro, tu característica de lanzamiento es Sabiduría. Puedes gastar puntos de ki extra para subir el nivel del conjuro, hasta un máximo de 5 puntos por turno.' },
  ],
}

const MONK_RESOURCES: ClassResource[] = [
  {
    id: 'ki',
    name: 'Puntos de ki',
    detail: 'Ráfaga de Golpes (1), Defensa Paciente (1), Paso del Viento (1), Desviar Proyectiles para devolverlos (1)',
    recharge: 'short', kind: 'pool', level: 2,
    max: { type: 'level' },
  },
]

export const MONK: CharClass = {
  id: 'monk',
  name: 'Monje',
  hitDie: 8,
  primary: ['dex', 'wis'],
  savingThrows: ['str', 'dex'],
  skillChoices: 2,
  skillList: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
  casterType: 'none',
  spellPrep: 'none',
  spellcastingLevel: 99,
  subclassLabel: 'Tradición monástica',
  subclassLevel: 3,
  subclasses: [OPEN_HAND, SHADOW, FOUR_ELEMENTS, MERCY, ASTRAL_SELF],
  unarmoredDefense: { name: 'Defensa sin Armadura', base: 10, abilities: ['dex', 'wis'], allowsShield: false },
  unarmoredMovement: [0, 10, 10, 10, 10, 15, 15, 15, 15, 20, 20, 20, 20, 25, 25, 25, 25, 30, 30, 30],
  resources: MONK_RESOURCES,
  scalings: [
    {
      id: 'martial-arts',
      name: 'Artes Marciales',
      detail: 'Dado de daño de tus ataques sin armas y con armas de monje. Puedes usar Destreza en vez de Fuerza, y golpear una vez más como acción adicional.',
      byLevel: Array.from({ length: 20 }, (_, i) => martialArtsDie(i + 1)),
    },
    {
      id: 'unarmored-movement',
      name: 'Movimiento sin Armadura',
      detail: 'Velocidad extra mientras no lleves armadura ni escudo. Ya está sumada a tu velocidad.',
      byLevel: Array.from({ length: 20 }, (_, i) => `${unarmoredMovement(i + 1)} pies`),
    },
  ],
  features: ([
    { level: 1, name: 'Defensa sin Armadura', text: 'Mientras no lleves armadura ni escudo, tu Clase de Armadura es 10 + tu modificador de Destreza + tu modificador de Sabiduría.' },
    { level: 1, name: 'Artes Marciales', turno: 'adicional', text: 'Con ataques sin armas y armas de monje puedes usar Destreza en vez de Fuerza, tiras el dado de artes marciales en vez del daño normal, y cuando atacas con una de ellas puedes hacer un ataque sin armas como acción adicional.' },
    { level: 2, name: 'Ki', text: 'Tienes puntos de ki iguales a tu nivel de monje, que se reponen en un descanso corto o largo. La CD de tus efectos de ki es 8 + tu bonificador de competencia + tu modificador de Sabiduría. Ráfaga de Golpes: 1 punto, dos ataques sin armas como acción adicional. Defensa Paciente: 1 punto, Esquivar como acción adicional. Paso del Viento: 1 punto, Correr o Desengancharse como acción adicional y salto doblado.' },
    { level: 2, name: 'Movimiento sin Armadura', text: 'Tu velocidad aumenta mientras no lleves armadura ni escudo: +10 pies a nivel 2, y más a niveles 6, 10, 14 y 18.' },
    { level: 2, name: 'Arma Predilecta', source: 'TCE', text: 'Al terminar un descanso corto o largo, puedes tocar un arma cuerpo a cuerpo sencilla o marcial con la que seas competente. Hasta tu siguiente descanso cuenta como arma de monje, siempre que no sea pesada ni especial.' },
    { level: 3, name: 'Ataque Alimentado por Ki', turno: 'adicional', source: 'TCE', text: 'Si gastas 1 punto de ki o más como parte de tu acción en tu turno, puedes hacer un ataque sin armas como acción adicional.' },
    { level: 4, name: 'Curación Acelerada', turno: 'adicional', source: 'TCE', text: 'Como acción adicional, gastas 2 puntos de ki y recuperas puntos de golpe iguales a una tirada de tu dado de artes marciales más tu bonificador de competencia.' },
    { level: 5, name: 'Puntería Concentrada', source: 'TCE', text: 'Cuando fallas una tirada de ataque, gastas 1, 2 o 3 puntos de ki para sumar 2 al ataque por cada punto, y quizá convertir el fallo en acierto.' },
    { level: 3, name: 'Tradición Monástica', text: 'Eliges la tradición que sigues. Te da rasgos ahora y en los niveles 6, 11 y 17.' },
    { level: 3, name: 'Desviar Proyectiles', turno: 'reaccion', text: 'Cuando te acierta un ataque a distancia con arma, usas tu reacción para reducir el daño en 1d10 + tu modificador de Destreza + tu nivel de monje. Si lo reduces a 0, puedes atrapar el proyectil y gastar 1 punto de ki para lanzarlo de vuelta con alcance 20/60.' },
    { level: 4, name: 'Caída Lenta', turno: 'reaccion', text: 'Cuando caes, usas tu reacción para reducir el daño de la caída en cinco veces tu nivel de monje.' },
    { level: 5, name: 'Ataque Adicional', text: 'Puedes atacar dos veces, en vez de una, siempre que realices la acción de Atacar en tu turno.' },
    { level: 5, name: 'Golpe Aturdidor', text: 'Cuando aciertas un ataque cuerpo a cuerpo con arma, gastas 1 punto de ki: el objetivo hace una salvación de Constitución o queda aturdido hasta el final de tu siguiente turno.' },
    { level: 6, name: 'Golpes Potenciados por Ki', text: 'Tus ataques sin armas cuentan como mágicos para superar resistencia e inmunidad al daño no mágico.' },
    { level: 7, name: 'Evasión', text: 'Cuando un efecto te permite una salvación de Destreza para recibir la mitad del daño, no recibes ninguno si la superas, y solo la mitad si fallas.' },
    { level: 7, name: 'Quietud de la Mente', turno: 'accion', text: 'Con una acción puedes terminar un efecto que te tenga encantado o asustado.' },
    { level: 10, name: 'Pureza del Cuerpo', text: 'Eres inmune a las enfermedades y al veneno.' },
    { level: 13, name: 'Lengua del Sol y la Luna', text: 'Entiendes cualquier idioma hablado, y cualquier criatura que entienda un idioma te entiende a ti.' },
    { level: 14, name: 'Alma de Diamante', text: 'Ganas competencia en todas las tiradas de salvación. Además, si fallas una, gastas 1 punto de ki para repetirla y quedarte con el nuevo resultado.' },
    { level: 15, name: 'Cuerpo Atemporal', text: 'Tu ki te sostiene: no envejeces y no puedes ser envejecido mágicamente. Ya no necesitas comida ni agua.' },
    { level: 18, name: 'Cuerpo Vacío', text: 'Gastas 4 puntos de ki para volverte invisible 1 minuto, con resistencia a todo el daño salvo el de fuerza. Con 8 puntos, lanzas proyección astral sobre ti mismo, sin llevar a nadie más.' },
    { level: 20, name: 'Yo Perfecto', text: 'Cuando tiras iniciativa y no te quedan puntos de ki, recuperas 4.' },
  ] as ClassFeature[]).concat(
    [4, 8, 12, 16, 19].map((level) => ({
      level,
      name: 'Mejora de Característica',
      text: 'Sube una característica en 2, o dos características en 1 cada una. No puedes pasar de 20. Alternativamente, puedes tomar una dote.',
    })),
  ).sort((a, b) => a.level - b.level),
}
