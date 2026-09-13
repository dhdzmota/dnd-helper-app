import type { Subclass } from './types'

/** Camino de la Misericordia — Tasha's Cauldron of Everything. */
export const MERCY: Subclass = {
  id: 'mercy',
  name: 'Camino de la Misericordia',
  source: 'TCE',
  flavor: 'Médico y verdugo con las mismas manos. Llevas la máscara del monasterio y decides, en cada encuentro, cuál de las dos toca.',
  resources: [
    { id: 'hand-of-ultimate-mercy', name: 'Mano de la Misericordia Última', detail: 'Devuelves a la vida a quien murió hace menos de 24 horas, con 4d10 + Sabiduría', recharge: 'long', kind: 'uses', level: 17, source: 'TCE', max: { type: 'fixed', n: 1 } },
  ],
  features: [
    { level: 3, subclass: 'mercy', source: 'TCE', name: 'Instrumentos de Misericordia', text: 'Ganas competencia en Perspicacia y Medicina, y con el kit de herboristería. También recibes una máscara especial, como las que llevan los monjes de tu tradición.' },
    { level: 3, subclass: 'mercy', source: 'TCE', name: 'Mano de Curación', turno: 'accion', text: 'Como acción, gastas 1 punto de ki y tocas a una criatura: recupera puntos de golpe iguales a una tirada de tu dado de artes marciales más tu modificador de Sabiduría. Al usar Ráfaga de Golpes puedes sustituir uno de los ataques por esto.' },
    { level: 3, subclass: 'mercy', source: 'TCE', name: 'Mano de Daño', text: 'Una vez por turno, cuando aciertas con un ataque sin armas, gastas 1 punto de ki para infligir daño necrótico adicional igual a una tirada de tu dado de artes marciales más tu modificador de Sabiduría.' },
    { level: 6, subclass: 'mercy', source: 'TCE', name: 'Toque del Médico', text: 'Tu Mano de Curación también termina una enfermedad o una de estas condiciones: cegado, ensordecido, paralizado, envenenado o aturdido. Tu Mano de Daño además deja envenenado al objetivo hasta el final de tu siguiente turno.' },
    { level: 11, subclass: 'mercy', source: 'TCE', name: 'Ráfaga de Curación y Daño', text: 'Cuando usas Ráfaga de Golpes, puedes cambiar cada ataque por Mano de Curación sin gastar ki. Y puedes usar Mano de Daño una vez por turno sin gastar ki como parte de la ráfaga.' },
    { level: 17, subclass: 'mercy', source: 'TCE', name: 'Mano de la Misericordia Última', turno: 'accion', text: 'Como acción, gastas 5 puntos de ki y tocas a una criatura que lleve muerta menos de 24 horas: vuelve a la vida con 4d10 + tu modificador de Sabiduría en puntos de golpe, libre de enfermedades y condiciones. Una vez por descanso largo.' },
  ],
}

/** Camino del Yo Astral — Tasha's Cauldron of Everything. */
export const ASTRAL_SELF: Subclass = {
  id: 'astral-self',
  name: 'Camino del Yo Astral',
  source: 'TCE',
  flavor: 'Tu ki tiene forma, y esa forma no eres tú del todo. Cuando la dejas salir, brazos y rostro espectrales se te superponen: el ser que serías si el cuerpo no estorbara.',
  scalings: [
    {
      id: 'astral-arms',
      name: 'Brazos Astrales',
      detail: 'Daño de fuerza de tus golpes con los brazos, o tu dado de artes marciales si es mayor. Alcance +5 pies y usas Sabiduría para atacar y dañar.',
      byLevel: Array.from({ length: 20 }, (_, i) => (i + 1 >= 3 ? '1d10' : '—')),
    },
  ],
  features: [
    { level: 3, subclass: 'astral-self', source: 'TCE', name: 'Brazos del Yo Astral', turno: 'adicional', text: 'Como acción adicional, gastas 1 punto de ki y durante 10 minutos manifiestas brazos espectrales. Usas Sabiduría en vez de Fuerza para pruebas y salvaciones de Fuerza. Como acción puedes hacer un ataque sin armas con ellos: alcance 5 pies más, usas Sabiduría para el ataque y el daño, e infliges 1d10 de daño de fuerza o tu dado de artes marciales, lo que sea mayor.' },
    { level: 6, subclass: 'astral-self', source: 'TCE', name: 'Rostro del Yo Astral', turno: 'adicional', text: 'Como acción adicional, gastas 1 punto de ki (o lo invocas junto con los brazos) y durante 10 minutos ganas: Vista Astral, que te deja ver a través de la oscuridad, incluso mágica, hasta 120 pies; Sabiduría del Espíritu, ventaja en Perspicacia e Intimidación; y Palabra del Espíritu, para susurrar a una criatura a 600 pies o tronar para que todos te oigan.' },
    { level: 11, subclass: 'astral-self', source: 'TCE', name: 'Cuerpo del Yo Astral', turno: 'reaccion', text: 'Mientras tengas brazos y rostro invocados, ganas dos cosas. Desviar Energía: como reacción reduces el daño de ácido, frío, fuego, fuerza, necrótico, psíquico, radiante, relámpago o trueno en 1d10 + tu modificador de Sabiduría + tu nivel de monje. Brazos Potenciados: una vez por turno, tu ataque con los brazos inflige daño adicional igual a tu dado de artes marciales.' },
    { level: 17, subclass: 'astral-self', source: 'TCE', name: 'Yo Astral Despierto', turno: 'adicional', text: 'Como acción adicional, gastas 5 puntos de ki para invocar brazos, rostro y cuerpo a la vez durante 10 minutos. Ganas +2 a la Clase de Armadura, y cuando usas la acción de Atacar con los brazos haces tres ataques en vez de dos.' },
  ],
}
