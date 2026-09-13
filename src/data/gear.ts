/**
 * Monedas, equipo y paquetes del Manual del Jugador.
 *
 * La idea de este archivo es que la app sepa «lo que las cosas realmente son»:
 * al añadir una cuerda de cáñamo ya sabe que pesa 10 libras y cuesta 1 po, y al
 * añadir un paquete de explorador lo despliega en las catorce cosas que trae
 * dentro, en vez de dejar una línea suelta que no dice nada.
 *
 * Los pesos van en libras y los precios en piezas de cobre, que es la unidad más
 * pequeña: así todas las cuentas son con enteros y no aparecen 0.30000000000004
 * piezas de plata por culpa de los decimales.
 */

// ── Monedas ────────────────────────────────────────────────────────────────

export const COINS = ['pc', 'pp', 'pe', 'po', 'pt'] as const
export type CoinKey = (typeof COINS)[number]

export const COIN_INFO: Record<CoinKey, { name: string; en: string; cobre: number }> = {
  pc: { name: 'Cobre', en: 'Copper', cobre: 1 },
  pp: { name: 'Plata', en: 'Silver', cobre: 10 },
  pe: { name: 'Electro', en: 'Electrum', cobre: 50 },
  po: { name: 'Oro', en: 'Gold', cobre: 100 },
  pt: { name: 'Platino', en: 'Platinum', cobre: 1000 },
}

/** Monedas de mayor a menor, que es el orden en que se da el cambio. */
export const COINS_DESC: CoinKey[] = ['pt', 'po', 'pe', 'pp', 'pc']

/** 50 monedas pesan una libra, sin importar el metal (MdJ, «Peso de las monedas»). */
export const MONEDAS_POR_LIBRA = 50

export type Bolsa = Record<CoinKey, number>

export const SIN_MONEDAS: Bolsa = { pc: 0, pp: 0, pe: 0, po: 0, pt: 0 }

export const totalEnCobre = (b: Bolsa) =>
  COINS.reduce((n, k) => n + (b[k] || 0) * COIN_INFO[k].cobre, 0)

export const pesoMonedas = (b: Bolsa) =>
  COINS.reduce((n, k) => n + (b[k] || 0), 0) / MONEDAS_POR_LIBRA

/**
 * Las monedas en que se habla y se da el cambio en la mesa. El electro casi
 * nadie lo usa, y nadie dice «te doy un platino» cuando quiere decir diez de
 * oro: los precios y las vueltas salen siempre en estas tres.
 */
export const MONEDAS_DE_CAMBIO: CoinKey[] = ['po', 'pp', 'pc']

/** Reparte una cantidad en oro, plata y cobre. */
export function repartir(cobre: number): Bolsa {
  const out = { ...SIN_MONEDAS }
  let resto = Math.max(0, Math.round(cobre))
  for (const k of MONEDAS_DE_CAMBIO) {
    const v = COIN_INFO[k].cobre
    out[k] = Math.floor(resto / v)
    resto -= out[k] * v
  }
  return out
}

/** «12 po», «8 pp 4 pc», «—». Para enseñar precios y totales sin decimales feos. */
export function formatearCobre(cobre: number): string {
  if (cobre <= 0) return '—'
  const b = repartir(cobre)
  const partes = MONEDAS_DE_CAMBIO.filter((k) => b[k] > 0).map((k) => `${b[k]} ${k}`)
  return partes.join(' ') || '—'
}

/**
 * Reparte una cantidad entre las monedas que hay en la bolsa, de mayor a menor,
 * cambiando piezas grandes cuando las pequeñas no alcanzan. Devuelve null si no
 * hay dinero suficiente ni juntándolo todo.
 */
export function pagar(bolsa: Bolsa, cobre: number): Bolsa | null {
  if (cobre <= 0) return { ...bolsa }
  if (totalEnCobre(bolsa) < cobre) return null
  const out = { ...bolsa }
  let falta = cobre

  // Primero con lo que ya cuadra, de la moneda más pequeña hacia arriba: así se
  // sueltan los cobres antes que romper un platino.
  for (const k of [...COINS_DESC].reverse()) {
    const v = COIN_INFO[k].cobre
    if (v > falta) continue
    const usar = Math.min(out[k], Math.floor(falta / v))
    out[k] -= usar
    falta -= usar * v
  }
  // Lo que quede obliga a cambiar una moneda y recibir la vuelta, que llega en
  // oro, plata y cobre: el tendero no devuelve electro. Se rompe la moneda más
  // pequeña que dé de sí —una plata antes que un oro—, como haría cualquiera.
  const deMenorAMayor = [...COINS_DESC].reverse()
  while (falta > 0) {
    const k = deMenorAMayor.find((k) => out[k] > 0 && COIN_INFO[k].cobre > falta)
    if (!k) return null
    out[k] -= 1
    const vuelta = repartir(COIN_INFO[k].cobre - falta)
    for (const j of MONEDAS_DE_CAMBIO) out[j] += vuelta[j]
    falta = 0
  }
  return out
}

/**
 * Junta el suelto hacia arriba: 100 pc pasan a ser 1 po y el electro se deshace.
 * El platino que ya tengas se queda como está —cambiarlo a oro sin pedirlo sería
 * desordenar la bolsa, no ordenarla—, así que solo se junta lo que hay debajo.
 */
export function consolidar(bolsa: Bolsa): Bolsa {
  const menudo = totalEnCobre({ ...bolsa, pt: 0 })
  return { ...repartir(menudo), pt: bolsa.pt }
}

// ── Catálogo de equipo ─────────────────────────────────────────────────────

export const GEAR_CATEGORIES = [
  'Armas', 'Armaduras', 'Equipo', 'Herramientas', 'Consumibles', 'Tesoro', 'Otros',
] as const
export type GearCategory = (typeof GEAR_CATEGORIES)[number]

export interface GearItem {
  id: string
  name: string
  en: string
  /** Libras por unidad. 0 cuando el manual dice «—». */
  weight: number
  /** Precio por unidad en piezas de cobre. */
  cost: number
  category: GearCategory
  /** Nota corta: propiedades del arma, qué hace el objeto. */
  note?: string
}

const W = (
  id: string, name: string, en: string, weight: number, cost: number,
  category: GearCategory, note?: string,
): GearItem => ({ id, name, en, weight, cost, category, note })

export const GEAR: GearItem[] = [
  // Armas sencillas
  W('club', 'Garrote', 'Club', 2, 10, 'Armas', 'Ligera · 1d4 contundente'),
  W('dagger', 'Daga', 'Dagger', 1, 200, 'Armas', 'Sutil, ligera, arrojadiza 20/60 · 1d4 perforante'),
  W('greatclub', 'Garrote grande', 'Greatclub', 10, 20, 'Armas', 'A dos manos · 1d8 contundente'),
  W('handaxe', 'Hacha de mano', 'Handaxe', 2, 500, 'Armas', 'Ligera, arrojadiza 20/60 · 1d6 cortante'),
  W('javelin', 'Jabalina', 'Javelin', 2, 50, 'Armas', 'Arrojadiza 30/120 · 1d6 perforante'),
  W('light-hammer', 'Martillo ligero', 'Light Hammer', 2, 200, 'Armas', 'Ligera, arrojadiza 20/60 · 1d4 contundente'),
  W('mace', 'Maza', 'Mace', 4, 500, 'Armas', '1d6 contundente'),
  W('quarterstaff', 'Bastón', 'Quarterstaff', 4, 20, 'Armas', 'Versátil (1d8) · 1d6 contundente'),
  W('sickle', 'Hoz', 'Sickle', 2, 100, 'Armas', 'Ligera · 1d4 cortante'),
  W('spear', 'Lanza', 'Spear', 3, 100, 'Armas', 'Arrojadiza 20/60, versátil (1d8) · 1d6 perforante'),
  W('light-crossbow', 'Ballesta ligera', 'Light Crossbow', 5, 2500, 'Armas', 'Munición 80/320, carga, a dos manos · 1d8 perforante'),
  W('dart', 'Dardo', 'Dart', 0.25, 5, 'Armas', 'Sutil, arrojadiza 20/60 · 1d4 perforante'),
  W('shortbow', 'Arco corto', 'Shortbow', 2, 2500, 'Armas', 'Munición 80/320, a dos manos · 1d6 perforante'),
  W('sling', 'Honda', 'Sling', 0, 10, 'Armas', 'Munición 30/120 · 1d4 contundente'),
  // Armas marciales
  W('battleaxe', 'Hacha de batalla', 'Battleaxe', 4, 1000, 'Armas', 'Versátil (1d10) · 1d8 cortante'),
  W('flail', 'Mangual', 'Flail', 2, 1000, 'Armas', '1d8 contundente'),
  W('glaive', 'Guja', 'Glaive', 6, 2000, 'Armas', 'Pesada, alcance, a dos manos · 1d10 cortante'),
  W('greataxe', 'Hacha a dos manos', 'Greataxe', 7, 3000, 'Armas', 'Pesada, a dos manos · 1d12 cortante'),
  W('greatsword', 'Espadón', 'Greatsword', 6, 5000, 'Armas', 'Pesada, a dos manos · 2d6 cortante'),
  W('halberd', 'Alabarda', 'Halberd', 6, 2000, 'Armas', 'Pesada, alcance, a dos manos · 1d10 cortante'),
  W('lance', 'Lanza de caballería', 'Lance', 6, 1000, 'Armas', 'Alcance, torpe · 1d12 perforante'),
  W('longsword', 'Espada larga', 'Longsword', 3, 1500, 'Armas', 'Versátil (1d10) · 1d8 cortante'),
  W('maul', 'Mazo', 'Maul', 10, 1000, 'Armas', 'Pesada, a dos manos · 2d6 contundente'),
  W('morningstar', 'Lucero del alba', 'Morningstar', 4, 1500, 'Armas', '1d8 perforante'),
  W('pike', 'Pica', 'Pike', 18, 500, 'Armas', 'Pesada, alcance, a dos manos · 1d10 perforante'),
  W('rapier', 'Estoque', 'Rapier', 2, 2500, 'Armas', 'Sutil · 1d8 perforante'),
  W('scimitar', 'Cimitarra', 'Scimitar', 3, 2500, 'Armas', 'Sutil, ligera · 1d6 cortante'),
  W('shortsword', 'Espada corta', 'Shortsword', 2, 1000, 'Armas', 'Sutil, ligera · 1d6 perforante'),
  W('trident', 'Tridente', 'Trident', 4, 500, 'Armas', 'Arrojadiza 20/60, versátil (1d8) · 1d6 perforante'),
  W('war-pick', 'Pico de guerra', 'War Pick', 2, 500, 'Armas', '1d8 perforante'),
  W('warhammer', 'Martillo de guerra', 'Warhammer', 2, 1500, 'Armas', 'Versátil (1d10) · 1d8 contundente'),
  W('whip', 'Látigo', 'Whip', 3, 200, 'Armas', 'Sutil, alcance · 1d4 cortante'),
  W('hand-crossbow', 'Ballesta de mano', 'Hand Crossbow', 3, 7500, 'Armas', 'Munición 30/120, ligera, carga · 1d6 perforante'),
  W('heavy-crossbow', 'Ballesta pesada', 'Heavy Crossbow', 18, 5000, 'Armas', 'Munición 100/400, pesada, carga, a dos manos · 1d10 perforante'),
  W('longbow', 'Arco largo', 'Longbow', 2, 5000, 'Armas', 'Munición 150/600, pesada, a dos manos · 1d8 perforante'),
  // Munición
  W('arrows', 'Flechas (20)', 'Arrows (20)', 1, 100, 'Consumibles', 'Con carcaj'),
  W('bolts', 'Virotes (20)', 'Crossbow Bolts (20)', 1.5, 100, 'Consumibles', 'Con caja'),
  W('sling-bullets', 'Balas de honda (20)', 'Sling Bullets (20)', 1.5, 4, 'Consumibles'),
  W('blowgun-needles', 'Agujas de cerbatana (50)', 'Blowgun Needles (50)', 1, 100, 'Consumibles'),
  // Escudo y demás protección
  W('shield', 'Escudo', 'Shield', 6, 1000, 'Armaduras', '+2 a la CA'),
  // Equipo de aventurero
  W('backpack', 'Mochila', 'Backpack', 5, 200, 'Equipo'),
  W('bedroll', 'Saco de dormir', 'Bedroll', 7, 100, 'Equipo'),
  W('blanket', 'Manta', 'Blanket', 3, 50, 'Equipo'),
  W('mess-kit', 'Kit de mesa', 'Mess Kit', 1, 20, 'Equipo'),
  W('tinderbox', 'Yesquero', 'Tinderbox', 1, 50, 'Equipo'),
  W('torch', 'Antorcha', 'Torch', 1, 1, 'Consumibles', 'Luz brillante 20 pies, 1 hora'),
  W('rations', 'Raciones (1 día)', 'Rations (1 day)', 2, 50, 'Consumibles'),
  W('waterskin', 'Odre', 'Waterskin', 5, 20, 'Equipo', 'Pesa 5 libras lleno'),
  W('rope-hemp', 'Cuerda de cáñamo (50 pies)', 'Hempen Rope (50 ft)', 10, 100, 'Equipo'),
  W('rope-silk', 'Cuerda de seda (50 pies)', 'Silk Rope (50 ft)', 5, 1000, 'Equipo'),
  W('candle', 'Vela', 'Candle', 0, 1, 'Consumibles', 'Luz tenue 5 pies, 1 hora'),
  W('lamp', 'Lámpara', 'Lamp', 1, 50, 'Equipo', 'Luz brillante 15 pies'),
  W('lantern-hooded', 'Linterna sorda', 'Hooded Lantern', 2, 500, 'Equipo', 'Luz brillante 30 pies'),
  W('oil', 'Frasco de aceite', 'Flask of Oil', 1, 10, 'Consumibles'),
  W('crowbar', 'Palanca', 'Crowbar', 5, 200, 'Equipo', 'Ventaja en la Fuerza cuando hace palanca'),
  W('hammer', 'Martillo', 'Hammer', 3, 100, 'Equipo'),
  W('piton', 'Pitón', 'Piton', 0.25, 5, 'Equipo'),
  W('grappling-hook', 'Garfio', 'Grappling Hook', 4, 200, 'Equipo'),
  W('holy-symbol', 'Símbolo sagrado', 'Holy Symbol', 1, 500, 'Equipo', 'Foco de lanzamiento divino'),
  W('component-pouch', 'Bolsa de componentes', 'Component Pouch', 2, 2500, 'Equipo', 'Foco de lanzamiento arcano'),
  W('arcane-focus', 'Foco arcano', 'Arcane Focus', 2, 1000, 'Equipo', 'Vara, orbe o cristal'),
  W('spellbook', 'Libro de conjuros', 'Spellbook', 3, 5000, 'Equipo'),
  W('healers-kit', 'Kit de sanador', 'Healer’s Kit', 3, 500, 'Consumibles', '10 usos: estabiliza sin tirada'),
  W('potion-healing', 'Poción de curación', 'Potion of Healing', 0.5, 5000, 'Consumibles', 'Recupera 2d4+2 PG'),
  W('pouch', 'Bolsa', 'Pouch', 1, 50, 'Equipo', 'Cabe 1/5 de pie cúbico o 6 libras'),
  W('sack', 'Saco', 'Sack', 0.5, 1, 'Equipo'),
  W('chest', 'Cofre', 'Chest', 25, 500, 'Equipo'),
  W('case-map', 'Estuche para mapas', 'Map or Scroll Case', 1, 100, 'Equipo'),
  W('robes', 'Vestiduras', 'Robes', 4, 100, 'Equipo'),
  W('clothes-common', 'Ropa común', 'Common Clothes', 3, 50, 'Equipo'),
  W('clothes-fine', 'Ropa fina', 'Fine Clothes', 6, 1500, 'Equipo'),
  W('clothes-travelers', 'Ropa de viaje', 'Traveler’s Clothes', 4, 200, 'Equipo'),
  W('mirror', 'Espejo de acero', 'Steel Mirror', 0.5, 500, 'Equipo'),
  W('ink', 'Botella de tinta', 'Ink (1 oz bottle)', 0, 1000, 'Equipo'),
  W('ink-pen', 'Pluma', 'Ink Pen', 0, 2, 'Equipo'),
  W('parchment', 'Hoja de pergamino', 'Parchment (one sheet)', 0, 10, 'Equipo'),
  W('book', 'Libro de conocimientos', 'Book', 5, 2500, 'Equipo'),
  W('incense', 'Bloque de incienso', 'Block of Incense', 0, 1, 'Consumibles'),
  W('censer', 'Incensario', 'Censer', 1, 500, 'Equipo'),
  W('alms-box', 'Caja de limosnas', 'Alms Box', 1, 0, 'Equipo'),
  W('vestments', 'Vestiduras sacerdotales', 'Vestments', 4, 0, 'Equipo'),
  W('string', 'Cordel (10 pies)', 'String (10 ft)', 0, 0, 'Equipo'),
  W('bell', 'Campana', 'Bell', 0, 100, 'Equipo'),
  W('ball-bearings', 'Bolas de metal (bolsa de 1000)', 'Ball Bearings (bag of 1,000)', 2, 100, 'Equipo'),
  W('caltrops', 'Abrojos (bolsa de 20)', 'Caltrops (bag of 20)', 2, 100, 'Equipo'),
  W('sand-pouch', 'Bolsita de arena', 'Little Bag of Sand', 0, 0, 'Equipo'),
  W('knife-small', 'Cuchillo pequeño', 'Small Knife', 0.25, 0, 'Equipo'),
  W('letter', 'Carta de un colega muerto', 'Letter from a Dead Colleague', 0, 0, 'Otros', 'Con una pregunta sin responder'),
  // Herramientas
  W('thieves-tools', 'Herramientas de ladrón', 'Thieves’ Tools', 1, 2500, 'Herramientas'),
  W('herbalism-kit', 'Kit de herboristería', 'Herbalism Kit', 3, 500, 'Herramientas'),
  W('disguise-kit', 'Kit de disfraz', 'Disguise Kit', 3, 2500, 'Herramientas'),
  W('forgery-kit', 'Kit de falsificación', 'Forgery Kit', 5, 1500, 'Herramientas'),
  W('poisoners-kit', 'Kit de envenenador', 'Poisoner’s Kit', 2, 5000, 'Herramientas'),
  W('smiths-tools', 'Herramientas de herrero', 'Smith’s Tools', 8, 2000, 'Herramientas'),
  W('dice-set', 'Juego de dados', 'Dice Set', 0, 10, 'Herramientas'),
  W('playing-cards', 'Baraja de cartas', 'Playing Card Set', 0, 50, 'Herramientas'),
  W('lute', 'Laúd', 'Lute', 2, 3500, 'Herramientas'),
  W('flute', 'Flauta', 'Flute', 1, 200, 'Herramientas'),
  W('drum', 'Tambor', 'Drum', 3, 600, 'Herramientas'),
]

export const GEAR_BY_ID = Object.fromEntries(GEAR.map((g) => [g.id, g])) as Record<string, GearItem>

// ── Paquetes de equipo ─────────────────────────────────────────────────────

export interface Pack {
  id: string
  name: string
  en: string
  contents: { id: string; qty: number }[]
}

export const PACKS: Pack[] = [
  {
    id: 'explorer', name: 'Paquete de explorador', en: 'Explorer’s Pack',
    contents: [
      { id: 'backpack', qty: 1 }, { id: 'bedroll', qty: 1 }, { id: 'mess-kit', qty: 1 },
      { id: 'tinderbox', qty: 1 }, { id: 'torch', qty: 10 }, { id: 'rations', qty: 10 },
      { id: 'waterskin', qty: 1 }, { id: 'rope-hemp', qty: 1 },
    ],
  },
  {
    id: 'priest', name: 'Paquete de sacerdote', en: 'Priest’s Pack',
    contents: [
      { id: 'backpack', qty: 1 }, { id: 'blanket', qty: 1 }, { id: 'candle', qty: 10 },
      { id: 'tinderbox', qty: 1 }, { id: 'alms-box', qty: 1 }, { id: 'incense', qty: 2 },
      { id: 'censer', qty: 1 }, { id: 'vestments', qty: 1 }, { id: 'rations', qty: 2 },
      { id: 'waterskin', qty: 1 },
    ],
  },
  {
    id: 'scholar', name: 'Paquete de erudito', en: 'Scholar’s Pack',
    contents: [
      { id: 'backpack', qty: 1 }, { id: 'book', qty: 1 }, { id: 'ink', qty: 1 },
      { id: 'ink-pen', qty: 1 }, { id: 'knife-small', qty: 1 }, { id: 'letter', qty: 1 },
      { id: 'parchment', qty: 10 }, { id: 'sand-pouch', qty: 1 },
    ],
  },
  {
    id: 'burglar', name: 'Paquete de ladrón', en: 'Burglar’s Pack',
    contents: [
      { id: 'backpack', qty: 1 }, { id: 'ball-bearings', qty: 1 }, { id: 'string', qty: 1 },
      { id: 'bell', qty: 1 }, { id: 'candle', qty: 5 }, { id: 'crowbar', qty: 1 },
      { id: 'hammer', qty: 1 }, { id: 'piton', qty: 10 }, { id: 'lantern-hooded', qty: 1 },
      { id: 'oil', qty: 2 }, { id: 'rations', qty: 5 }, { id: 'tinderbox', qty: 1 },
      { id: 'waterskin', qty: 1 }, { id: 'rope-hemp', qty: 1 },
    ],
  },
  {
    id: 'dungeoneer', name: 'Paquete de mazmorreo', en: 'Dungeoneer’s Pack',
    contents: [
      { id: 'backpack', qty: 1 }, { id: 'crowbar', qty: 1 }, { id: 'hammer', qty: 1 },
      { id: 'piton', qty: 10 }, { id: 'torch', qty: 10 }, { id: 'tinderbox', qty: 1 },
      { id: 'rations', qty: 10 }, { id: 'waterskin', qty: 1 }, { id: 'rope-hemp', qty: 1 },
    ],
  },
]

// ── Equipo inicial por clase ───────────────────────────────────────────────

/**
 * Lo que el Manual del Jugador te da al empezar. Donde el manual ofrece una
 * elección se toma la opción más habitual —queda anotada en `nota`— y luego se
 * edita a mano, que es más rápido que un asistente de seis preguntas.
 *
 * La armadura y el escudo no van aquí: se eligen en Ficha y la carga los suma
 * desde ahí, para que un mismo objeto no cuente dos veces.
 */
export interface StartingGear {
  nota: string
  items: { id: string; qty: number }[]
  packId: string
}

export const STARTING_GEAR: Record<string, StartingGear> = {
  paladin: {
    nota: 'Arma marcial y escudo, cinco jabalinas y el paquete de sacerdote. La cota de malla y el escudo se marcan en Ficha.',
    items: [{ id: 'longsword', qty: 1 }, { id: 'javelin', qty: 5 }, { id: 'holy-symbol', qty: 1 }],
    packId: 'priest',
  },
  sorcerer: {
    nota: 'Ballesta ligera con virotes, foco arcano, dos dagas y el paquete de explorador.',
    items: [
      { id: 'light-crossbow', qty: 1 }, { id: 'bolts', qty: 1 },
      { id: 'arcane-focus', qty: 1 }, { id: 'dagger', qty: 2 },
    ],
    packId: 'explorer',
  },
  rogue: {
    nota: 'Estoque, arco corto con flechas, dos dagas, herramientas de ladrón y el paquete de ladrón. La armadura de cuero se marca en Ficha.',
    items: [
      { id: 'rapier', qty: 1 }, { id: 'shortbow', qty: 1 }, { id: 'arrows', qty: 1 },
      { id: 'dagger', qty: 2 }, { id: 'thieves-tools', qty: 1 },
    ],
    packId: 'burglar',
  },
  monk: {
    nota: 'Espada corta, diez dardos y el paquete de explorador. El monje pelea sin armadura.',
    items: [{ id: 'shortsword', qty: 1 }, { id: 'dart', qty: 10 }],
    packId: 'explorer',
  },
}

export const PACK_BY_ID = Object.fromEntries(PACKS.map((p) => [p.id, p])) as Record<string, Pack>

/** Una línea de mochila hecha a partir del catálogo, con su peso y su precio. */
export function lineaDeCatalogo(gearId: string, qty = 1) {
  const g = GEAR_BY_ID[gearId]
  if (!g) return null
  return {
    id: `${gearId}-${Math.random().toString(36).slice(2, 8)}`,
    name: g.name,
    qty,
    weight: g.weight,
    cost: g.cost,
    category: g.category,
    notes: g.note ?? '',
    equipped: false,
  }
}

/** Despliega un paquete en las cosas que trae dentro. */
export const contenidoDePaquete = (packId: string) =>
  (PACK_BY_ID[packId]?.contents ?? [])
    .map((c) => lineaDeCatalogo(c.id, c.qty))
    .filter((x): x is NonNullable<typeof x> => x !== null)

/** El equipo inicial de una clase, con el paquete ya desplegado. */
export function equipoInicial(classId: string) {
  const g = STARTING_GEAR[classId]
  if (!g) return []
  const sueltos = g.items
    .map((i) => lineaDeCatalogo(i.id, i.qty))
    .filter((x): x is NonNullable<typeof x> => x !== null)
  return [...sueltos, ...contenidoDePaquete(g.packId)]
}
