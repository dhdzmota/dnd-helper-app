import type { TurnSlot } from './turn'
export interface Feat {
  id: string
  name: string
  en: string
  /** Apartado del turno en que se usa, si se usa en combate. */
  turno?: TurnSlot
  /** Absent = Manual del Jugador. 'TCE' = Tasha's. */
  source?: 'TCE'
  /** Shown as a gate in the picker; purely informational, the app does not block on it. */
  prereq?: string
  text: string
  /** Number of cantrips the feat grants, if any. */
  cantrips?: number
}

export const FEATS: Feat[] = [
  { id: 'great-weapon-master', name: 'Maestro de Armas Grandes', turno: 'adicional', en: 'Great Weapon Master',
    text: 'Al sacar un crítico o reducir a una criatura a 0 puntos de golpe con un arma cuerpo a cuerpo, puedes hacer un ataque extra como acción adicional. Antes de atacar con un arma pesada con la que seas competente, puedes aceptar −5 al ataque a cambio de +10 al daño.' },
  { id: 'polearm-master', name: 'Maestro de Armas de Asta', turno: 'adicional', en: 'Polearm Master',
    text: 'Al atacar con una alabarda, glaive, lanza corta o bastón, puedes usar tu acción adicional para golpear con el extremo trasero (1d4 contundente). Además, las criaturas provocan ataques de oportunidad al entrar en tu alcance.' },
  { id: 'sentinel', name: 'Centinela', turno: 'reaccion', en: 'Sentinel',
    text: 'Cuando aciertas un ataque de oportunidad, la velocidad del objetivo baja a 0. Las criaturas provocan ataques de oportunidad aunque Desengánchense. Si una criatura a 5 pies ataca a otro que no seas tú, puedes atacarla con tu reacción.' },
  { id: 'war-caster', name: 'Lanzador de Guerra', en: 'War Caster', prereq: 'Capacidad de lanzar al menos un conjuro',
    text: 'Ventaja en salvaciones de Constitución para mantener concentración. Puedes lanzar conjuros con las manos ocupadas por armas o escudo. Puedes lanzar un conjuro de 1 acción como ataque de oportunidad.' },
  { id: 'resilient', name: 'Resistente', en: 'Resilient',
    text: 'Sube en 1 una característica a tu elección, hasta un máximo de 20, y ganas competencia en las tiradas de salvación de esa característica.' },
  { id: 'shield-master', name: 'Maestro del Escudo', turno: 'adicional', en: 'Shield Master', prereq: 'Empuñar un escudo',
    text: 'Si haces la acción de Atacar, puedes empujar con el escudo como acción adicional. Sumas el bonificador del escudo a salvaciones de Destreza contra efectos que solo te apunten a ti, y puedes anular por completo el daño de esas salvaciones superadas.' },
  { id: 'tough', name: 'Duro', en: 'Tough',
    text: 'Tu máximo de puntos de golpe aumenta en 2 por cada nivel que tengas, y en 2 más cada vez que subas de nivel.' },
  { id: 'lucky', name: 'Afortunado', en: 'Lucky',
    text: 'Tienes 3 puntos de suerte por descanso largo. Puedes gastar uno para tirar un d20 adicional en una tirada de ataque, prueba o salvación, o para forzar la retirada de un ataque contra ti.' },
  { id: 'heavy-armor-master', name: 'Maestro de Armadura Pesada', en: 'Heavy Armor Master', prereq: 'Competencia con armadura pesada',
    text: 'Sube tu Fuerza en 1, hasta 20. Mientras lleves armadura pesada, el daño contundente, perforante y cortante no mágico que recibas se reduce en 3.' },
  { id: 'inspiring-leader', name: 'Líder Inspirador', en: 'Inspiring Leader', prereq: 'Carisma 13 o más',
    text: 'Tras 10 minutos de arenga, hasta seis criaturas que puedan verte y oírte ganan puntos de golpe temporales iguales a tu nivel + tu modificador de Carisma.' },
  { id: 'mobile', name: 'Móvil', en: 'Mobile',
    text: 'Tu velocidad aumenta en 10 pies. Al Correr, el terreno difícil no te cuesta movimiento extra ese turno. Si atacas cuerpo a cuerpo a una criatura, no provocas su ataque de oportunidad ese turno.' },
  { id: 'alert', name: 'Alerta', en: 'Alert',
    text: 'Ganas +5 a la iniciativa, no puedes ser sorprendido mientras estés consciente, y las criaturas ocultas no ganan ventaja en sus ataques contra ti.' },
  { id: 'magic-initiate', name: 'Iniciado en la Magia', en: 'Magic Initiate', cantrips: 2,
    text: 'Elige una clase: bardo, clérigo, druida, brujo, mago o hechicero. Aprendes dos trucos de su lista y un conjuro de nivel 1, que puedes lanzar una vez por descanso largo sin gastar espacio. Usas la característica de lanzamiento de esa clase.' },
  { id: 'fey-touched', name: 'Tocado por lo Feérico', en: 'Fey Touched', source: 'TCE',
    text: 'Sube en 1 tu Inteligencia, Sabiduría o Carisma, hasta 20. Aprendes Paso Brumoso y un conjuro de nivel 1 de adivinación o encantamiento. Puedes lanzar cada uno una vez por descanso largo sin gastar espacio, o gastando espacios normalmente.' },
  { id: 'savage-attacker', name: 'Atacante Salvaje', en: 'Savage Attacker',
    text: 'Una vez por turno, cuando tiras el daño de un ataque cuerpo a cuerpo con arma, puedes volver a tirar los dados y usar cualquiera de los dos resultados.' },
  { id: 'defensive-duelist', name: 'Duelista Defensivo', turno: 'reaccion', en: 'Defensive Duelist', prereq: 'Destreza 13 o más',
    text: 'Cuando empuñas un arma de finura con la que eres competente y otra criatura te acierta cuerpo a cuerpo, puedes usar tu reacción para sumar tu bonificador de competencia a la CA contra ese ataque, posiblemente fallándolo.' },
  { id: 'elemental-adept', name: 'Adepto Elemental', en: 'Elemental Adept', prereq: 'Capacidad de lanzar al menos un conjuro',
    text: 'Elige ácido, frío, fuego, relámpago o trueno. Tus conjuros ignoran la resistencia a ese tipo de daño, y cada 1 que saques en los dados de daño de ese tipo cuenta como 2.' },

  // ── Tasha's Cauldron of Everything ───────────────────────────────────────
  { id: 'shadow-touched', name: 'Tocado por la Sombra', en: 'Shadow Touched', source: 'TCE',
    text: 'Sube en 1 tu Inteligencia, Sabiduría o Carisma, hasta 20. Aprendes Invisibilidad y un conjuro de nivel 1 de ilusión o nigromancia. Puedes lanzar cada uno una vez por descanso largo sin gastar espacio, o gastando espacios normalmente.' },
  { id: 'skill-expert', name: 'Experto en Habilidades', en: 'Skill Expert', source: 'TCE',
    text: 'Sube en 1 una característica, hasta 20. Ganas competencia en una habilidad a tu elección, y eliges una habilidad en la que ya seas competente para ganar pericia: tu bonificador de competencia se dobla en ella.' },
  { id: 'metamagic-adept', name: 'Adepto de la Metamagia', en: 'Metamagic Adept', source: 'TCE', prereq: 'Capacidad de lanzar al menos un conjuro',
    text: 'Aprendes dos opciones de metamagia de la lista de hechicero. Ganas 2 puntos de hechicería, que se reponen en cada descanso largo y solo sirven para la metamagia.' },
  { id: 'fighting-initiate', name: 'Iniciado en el Combate', en: 'Fighting Initiate', source: 'TCE', prereq: 'Competencia con un estilo de combate marcial',
    text: 'Aprendes un estilo de combate a tu elección. Cada vez que ganes una mejora de característica puedes cambiarlo por otro.' },
  { id: 'telekinetic', name: 'Telequinético', turno: 'adicional', en: 'Telekinetic', source: 'TCE',
    text: 'Sube en 1 tu Inteligencia, Sabiduría o Carisma, hasta 20. Aprendes Mano de Mago y puedes lanzarlo sin componentes ni mano visible. Como acción adicional, empujas o atraes 5 pies a una criatura a 30 pies que falle una salvación de Fuerza.' },
  { id: 'telepathic', name: 'Telepático', en: 'Telepathic', source: 'TCE',
    text: 'Sube en 1 tu Inteligencia, Sabiduría o Carisma, hasta 20. Puedes hablar telepáticamente con cualquier criatura a 60 pies que entienda un idioma. Además lanzas Detectar Pensamientos una vez por descanso largo sin gastar espacio.' },
  { id: 'crusher', name: 'Aplastador', en: 'Crusher', source: 'TCE',
    text: 'Sube en 1 tu Fuerza o Constitución, hasta 20. Una vez por turno, al infligir daño contundente, mueves al objetivo 5 pies. Cuando le sacas un crítico, los ataques contra él tienen ventaja hasta el inicio de tu siguiente turno.' },
  { id: 'piercer', name: 'Perforador', en: 'Piercer', source: 'TCE',
    text: 'Sube en 1 tu Fuerza o Destreza, hasta 20. Una vez por turno, al infligir daño perforante, vuelves a tirar un dado de daño y usas el nuevo resultado. Con un crítico, tiras un dado de daño más.' },
  { id: 'slasher', name: 'Tajador', en: 'Slasher', source: 'TCE',
    text: 'Sube en 1 tu Fuerza o Destreza, hasta 20. Una vez por turno, al infligir daño cortante, reduces la velocidad del objetivo en 10 pies. Con un crítico, queda con desventaja en sus ataques hasta el inicio de tu siguiente turno.' },
  { id: 'chef', name: 'Cocinero', en: 'Chef', source: 'TCE',
    text: 'Sube en 1 tu Constitución o Sabiduría, hasta 20. Ganas competencia con utensilios de cocina. En un descanso corto puedes cocinar para 4 + tu bonificador de competencia: cada uno recupera 1d8 extra al gastar dados de golpe. En una hora haces dulces que dan 1 punto temporal.' },
  { id: 'poisoner', name: 'Envenenador', turno: 'adicional', en: 'Poisoner', source: 'TCE',
    text: 'Ganas competencia con el kit de envenenador y ignoras la resistencia al daño de veneno. Como acción adicional untas un arma: quien la reciba hace una salvación de Constitución CD 14 o recibe 2d8 de veneno y queda envenenado 1 minuto.' },
]

export const FEAT_BY_ID = Object.fromEntries(FEATS.map((f) => [f.id, f])) as Record<string, Feat>

/** Fallback when a class does not declare its own. */
export const ASI_LEVELS = [4, 8, 12, 16, 19]
