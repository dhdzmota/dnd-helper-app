/**
 * Qué puedes hacer en tu turno.
 *
 * Este archivo es el catálogo: la lista de todo lo que un personaje podría
 * hacer, con la explicación en una línea para quien nunca ha jugado. Quién ve
 * cada cosa y si le queda o no se decide en `src/state/turn.ts`, que cruza este
 * catálogo con la ficha y con lo que ya se ha gastado.
 *
 * El orden de los apartados es el orden real de un turno: te mueves, haces tu
 * acción, tu acción adicional, y dejas la reacción preparada para el turno de
 * los demás.
 */

export const TURN_SLOTS = ['movimiento', 'accion', 'adicional', 'reaccion', 'gratis'] as const
export type TurnSlot = (typeof TURN_SLOTS)[number]

export const SLOT_INFO: Record<TurnSlot, { name: string; en: string; hint: string }> = {
  movimiento: {
    name: 'Movimiento', en: 'Movement',
    hint: 'Puedes partirlo: unos pies, tu acción, y el resto. No hace falta gastarlo todo.',
  },
  accion: {
    name: 'Acción', en: 'Action',
    hint: 'Una por turno. Es lo gordo que haces.',
  },
  adicional: {
    name: 'Acción adicional', en: 'Bonus Action',
    hint: 'Una por turno, y solo si algo te la concede. No existe «gastar la acción adicional» porque sí.',
  },
  reaccion: {
    name: 'Reacción', en: 'Reaction',
    hint: 'Una entre turno y turno, fuera del tuyo. Se gasta cuando ocurre el disparador.',
  },
  gratis: {
    name: 'Gratis', en: 'Free',
    hint: 'No cuesta nada del turno.',
  },
}

/** De dónde sale una opción, para saber a quién enseñársela. */
export interface MoveGate {
  /** Ids de clase que la tienen. Ausente = todo el mundo. */
  classes?: string[]
  /** Nivel de clase mínimo. */
  level?: number
  /** Id de subclase que la concede. */
  subclass?: string
  /** Rasgo opcional de Tasha's: solo si la mesa los usa. */
  tashas?: boolean
  /** Solo si llevas encima un arma ligera: pelear con dos armas la necesita. */
  armaLigera?: boolean
}

/** Qué gasta una opción, para saber si todavía te queda. */
export type MoveCost =
  | { kind: 'ninguno' }
  /** Un recurso de clase por su id: ki, imposición de manos, canalizar divinidad… */
  | { kind: 'recurso'; id: string; n: number }
  /** Un espacio de conjuro de este nivel o más alto. */
  | { kind: 'espacio'; minLevel: number }
  /** Tu reacción, tu movimiento… no se marca en la ficha, solo se avisa. */
  | { kind: 'turno' }

export interface TurnMove {
  id: string
  name: string
  en: string
  slot: TurnSlot
  /** Una línea. Qué haces, en la mesa, dicho como se lo dirías a alguien nuevo. */
  text: string
  cost?: MoveCost
  gate?: MoveGate
  /** Se coloca arriba del apartado mientras el jugador no ordene a su gusto. */
  destacada?: boolean
}

// ── Lo que puede hacer cualquiera ──────────────────────────────────────────

export const MOVES_BASE: TurnMove[] = [
  {
    id: 'mover', name: 'Moverte', en: 'Move', slot: 'movimiento', destacada: true,
    text: 'Hasta tu velocidad, y puedes partirla antes y después de tu acción.',
  },
  {
    id: 'levantarse', name: 'Levantarte', en: 'Stand Up', slot: 'movimiento',
    text: 'Salir de derribado te cuesta la mitad de tu velocidad. Si no te queda tanta, te quedas en el suelo.',
  },
  {
    id: 'trepar', name: 'Trepar, nadar o arrastrarte', en: 'Climb, Swim, Crawl', slot: 'movimiento',
    text: 'Cada pie te cuesta dos. Terreno difícil igual: avanzas la mitad.',
  },
  {
    id: 'saltar', name: 'Saltar', en: 'Jump', slot: 'movimiento',
    text: 'Con diez pies de carrerilla saltas tu Fuerza en pies a lo largo, o 3 + tu modificador de Fuerza a lo alto. Sale de tu movimiento.',
  },

  {
    id: 'atacar', name: 'Atacar', en: 'Attack', slot: 'accion', destacada: true,
    text: 'Un ataque con el arma que empuñes. Tira 1d20 + tu bono contra su Clase de Armadura.',
  },
  {
    id: 'lanzar', name: 'Lanzar un conjuro', en: 'Cast a Spell', slot: 'accion',
    text: 'Los que tienes preparados y se lanzan con una acción. Salen abajo uno a uno.',
    gate: { level: 1 },
  },
  {
    id: 'agarrar', name: 'Agarrar o empujar', en: 'Grapple / Shove', slot: 'accion',
    text: 'En vez de uno de tus ataques: tu Atletismo contra su Atletismo o Acrobacias. Si ganas, lo agarras o lo tiras al suelo.',
  },
  {
    id: 'correr', name: 'Correr', en: 'Dash', slot: 'accion',
    text: 'Doblas tu movimiento este turno. Para llegar, no para pegar.',
  },
  {
    id: 'destrabarse', name: 'Destrabarte', en: 'Disengage', slot: 'accion',
    text: 'Te alejas sin que nadie te ataque por irte. La salida limpia cuando estás rodeado.',
  },
  {
    id: 'esquivar', name: 'Esquivar', en: 'Dodge', slot: 'accion',
    text: 'Hasta tu siguiente turno, quien te ataque lo hace con desventaja y tú salvas Destreza con ventaja. Lo mejor que puedes hacer cuando no tienes nada mejor.',
  },
  {
    id: 'ayudar', name: 'Ayudar', en: 'Help', slot: 'accion',
    text: 'Das ventaja a un aliado: en su siguiente prueba, o en su próximo ataque contra alguien a 5 pies de ti.',
  },
  {
    id: 'esconderse', name: 'Esconderte', en: 'Hide', slot: 'accion',
    text: 'Tira Sigilo. Si nadie te ve, tu siguiente ataque va con ventaja.',
  },
  {
    id: 'preparar', name: 'Preparar', en: 'Ready', slot: 'accion',
    text: 'Dices en voz alta el disparador y qué harás. Cuando pase, gastas tu reacción y lo haces.',
  },
  {
    id: 'buscar', name: 'Buscar', en: 'Search', slot: 'accion',
    text: 'Miras de verdad: Percepción para ver u oír, Investigación para deducir.',
  },
  {
    id: 'usar-objeto', name: 'Usar un objeto', en: 'Use an Object', slot: 'accion',
    text: 'La segunda interacción del turno con un objeto ya cuesta tu acción. La primera es gratis.',
  },

  {
    id: 'dos-armas', name: 'Pelear con dos armas', en: 'Two-Weapon Fighting', slot: 'adicional',
    text: 'Si atacaste con un arma ligera en una mano, golpeas con la ligera de la otra. Al daño no le sumas tu modificador.',
    gate: { armaLigera: true },
  },

  {
    id: 'oportunidad', name: 'Ataque de oportunidad', en: 'Opportunity Attack', slot: 'reaccion', destacada: true,
    text: 'Cuando alguien a tu alcance se va andando, le sueltas un ataque. Si se destraba o se teletransporta, no.',
  },

  {
    id: 'interaccion', name: 'Interactuar con un objeto', en: 'Object Interaction', slot: 'gratis', destacada: true,
    text: 'Una gratis por turno: desenvainar, abrir una puerta, sacar una poción de la mochila.',
  },
  {
    id: 'hablar', name: 'Hablar', en: 'Talk', slot: 'gratis',
    text: 'Unas frases sueltas son gratis. Un discurso ya es una acción.',
  },
]

// ── Lo que da tu clase ─────────────────────────────────────────────────────

/**
 * Aquí SOLO va lo que no se puede sacar de los datos de clase: cosas que no son
 * un rasgo con su texto («Castigo Divino» es un uso del espacio de conjuro) o
 * que viven dentro del detalle de una reserva («Ráfaga de Golpes» está en el
 * texto del ki). Todo lo demás —rasgos raciales, dotes, rasgos de clase y de
 * subclase, estilos de combate y reservas— sale anotado con `turno` en su
 * propio archivo de datos, que es la única forma de que no se quede nada fuera.
 */
export const MOVES_CLASE: TurnMove[] = [
  {
    id: 'divine-smite', name: 'Castigo Divino', en: 'Divine Smite', slot: 'gratis', destacada: true,
    text: 'Después de acertar un ataque cuerpo a cuerpo, gastas un espacio de conjuro y añades 2d8 radiante, +1d8 por cada nivel de espacio por encima del primero, y +1d8 más contra no-muertos y fiends.',
    cost: { kind: 'espacio', minLevel: 1 },
    gate: { classes: ['paladin'], level: 2 },
  },
  {
    id: 'sneak-attack', name: 'Ataque Furtivo', en: 'Sneak Attack', slot: 'gratis', destacada: true,
    text: 'Una vez por turno, con arma sutil o a distancia: si atacas con ventaja, o si un aliado está pegado a tu objetivo y tú no tienes desventaja, sumas los dados extra.',
    gate: { classes: ['rogue'], level: 1 },
  },
  {
    id: 'flurry-of-blows', name: 'Ráfaga de Golpes', en: 'Flurry of Blows', slot: 'adicional', destacada: true,
    text: 'Justo después de la acción de Atacar: dos golpes sin armas en vez de uno.',
    cost: { kind: 'recurso', id: 'ki', n: 1 },
    gate: { classes: ['monk'], level: 2 },
  },
  {
    id: 'patient-defense', name: 'Defensa Paciente', en: 'Patient Defense', slot: 'adicional',
    text: 'Esquivar como acción adicional, así que te queda la acción para otra cosa.',
    cost: { kind: 'recurso', id: 'ki', n: 1 },
    gate: { classes: ['monk'], level: 2 },
  },
  {
    id: 'step-of-the-wind', name: 'Paso del Viento', en: 'Step of the Wind', slot: 'adicional',
    text: 'Destrabarte o Correr como acción adicional, y este turno saltas el doble de lejos.',
    cost: { kind: 'recurso', id: 'ki', n: 1 },
    gate: { classes: ['monk'], level: 2 },
  },
  {
    id: 'stunning-strike', name: 'Golpe Aturdidor', en: 'Stunning Strike', slot: 'gratis',
    text: 'Tras acertar un ataque cuerpo a cuerpo: salvación de Constitución o queda aturdido hasta el final de tu siguiente turno.',
    cost: { kind: 'recurso', id: 'ki', n: 1 },
    gate: { classes: ['monk'], level: 5 },
  },
]

export const MOVES = [...MOVES_BASE, ...MOVES_CLASE]
