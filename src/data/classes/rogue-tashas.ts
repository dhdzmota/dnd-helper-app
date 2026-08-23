import type { Subclass } from './types'

const psionicDie = (level: number) =>
  level >= 17 ? 'd12' : level >= 11 ? 'd10' : level >= 5 ? 'd8' : 'd6'

/** Fantasma — Tasha's Cauldron of Everything. */
export const PHANTOM: Subclass = {
  id: 'phantom',
  name: 'Fantasma',
  source: 'TCE',
  flavor: 'Caminas con un pie en el mundo de los muertos. Recoges lo que dejan al irse: destrezas, secretos, y a veces un pedazo de alma.',
  resources: [
    { id: 'wails-from-the-grave', name: 'Lamentos desde la Tumba', detail: 'Tras un Ataque Furtivo, la mitad de sus dados en daño necrótico a un segundo objetivo a 30 pies', recharge: 'long', kind: 'uses', level: 3, source: 'TCE', max: { type: 'proficiency' } },
    { id: 'soul-trinkets', name: 'Fetiches de alma', detail: 'Los consigues cuando alguien muere a 30 pies. Marca los que gastes', recharge: 'long', kind: 'uses', level: 9, source: 'TCE', max: { type: 'proficiency' } },
    { id: 'ghost-walk', name: 'Paso Fantasmal', detail: 'Forma espectral: vuelas 10 pies y atraviesas criaturas y objetos', recharge: 'long', kind: 'uses', level: 13, source: 'TCE', max: { type: 'fixed', n: 1 } },
  ],
  features: [
    { level: 3, subclass: 'phantom', source: 'TCE', name: 'Susurros de los Muertos', text: 'Cada vez que terminas un descanso corto o largo, ganas competencia con una habilidad o unas herramientas a tu elección, y pierdes la que hubieras ganado así antes.' },
    { level: 3, subclass: 'phantom', source: 'TCE', name: 'Lamentos desde la Tumba', text: 'Justo después de infligir Ataque Furtivo, una segunda criatura a 30 pies de la primera recibe daño necrótico igual a la mitad de tus dados de Ataque Furtivo. Usos: tu bonificador de competencia, por descanso largo.' },
    { level: 9, subclass: 'phantom', source: 'TCE', name: 'Prendas de los Difuntos', text: 'Cuando una criatura muere a 30 pies de ti, ganas un fetiche de alma (máximo: tu bonificador de competencia). Mientras tengas uno, tienes ventaja en salvaciones de muerte y de Constitución. Puedes consumir uno para recuperar un uso de Lamentos, o para hacerle una pregunta a la criatura muerta.' },
    { level: 13, subclass: 'phantom', source: 'TCE', name: 'Paso Fantasmal', text: 'Como acción adicional, adoptas forma espectral 10 minutos: velocidad de vuelo de 10 pies, atraviesas criaturas y objetos como terreno difícil, y tienes resistencia al daño contundente, perforante y cortante no mágico. Una vez por descanso largo, o consumiendo un fetiche de alma.' },
    { level: 17, subclass: 'phantom', source: 'TCE', name: 'Amigo de la Muerte', text: 'Lamentos desde la Tumba ya no gasta usos: pasa a activarse cada vez que infliges Ataque Furtivo. Y si terminas un descanso largo sin ningún fetiche de alma, ganas uno.' },
  ],
}

/** Cuchilla del Alma — Tasha's Cauldron of Everything. */
export const SOULKNIFE: Subclass = {
  id: 'soulknife',
  name: 'Cuchilla del Alma',
  source: 'TCE',
  flavor: 'No necesitas acero: tu mente corta. Manifiestas hojas de energía psiónica y hablas sin que nadie oiga una palabra.',
  scalings: [
    {
      id: 'psionic-die',
      name: 'Dado psiónico',
      detail: 'Los gastas en tus rasgos de Poder Psiónico. Tienes el doble de tu bonificador de competencia, y recuperas uno como acción adicional una vez por descanso.',
      byLevel: Array.from({ length: 20 }, (_, i) => psionicDie(i + 1)),
    },
    {
      id: 'psychic-blades',
      name: 'Cuchillas Psíquicas',
      detail: 'Sutiles y arrojadizas a 60 pies, cuentan para Ataque Furtivo y no dejan rastro al desvanecerse.',
      byLevel: Array.from({ length: 20 }, (_, i) => (i + 1 >= 3 ? '1d6 / 1d4' : '—')),
    },
  ],
  resources: [
    { id: 'psionic-energy', name: 'Dados de Energía Psiónica', detail: 'Alimentan tus rasgos psiónicos; el tamaño del dado sube con el nivel', recharge: 'long', kind: 'pool', level: 3, source: 'TCE', max: { type: 'proficiency', times: 2 } },
    { id: 'psychic-veil', name: 'Velo Psíquico', detail: 'Invisible durante 1 hora, hasta que ataques o fuerces una salvación', recharge: 'long', kind: 'uses', level: 13, source: 'TCE', max: { type: 'fixed', n: 1 } },
    { id: 'rend-mind', name: 'Desgarrar la Mente', detail: 'Ataque Furtivo con las cuchillas: salvación de Sabiduría o aturdido 1 minuto', recharge: 'long', kind: 'uses', level: 17, source: 'TCE', max: { type: 'fixed', n: 1 } },
  ],
  features: [
    { level: 3, subclass: 'soulknife', source: 'TCE', name: 'Poder Psiónico', text: 'Tienes dados de Energía Psiónica: el doble de tu bonificador de competencia. Se reponen en un descanso largo, y como acción adicional puedes recuperar uno, una vez por descanso. Nudillo Psiónico: si fallas una prueba con una competencia tuya, tiras un dado y lo sumas. Susurros Psíquicos: gastas un dado para hablar telepáticamente con criaturas que hayas tocado.' },
    { level: 3, subclass: 'soulknife', source: 'TCE', name: 'Cuchillas Psíquicas', text: 'Como acción, ataque o acción adicional, manifiestas una hoja de energía psíquica: sutil y arrojadiza con alcance 60/120. Inflige 1d6 de daño psíquico, o 1d4 si es la segunda del turno como acción adicional. Cuenta como arma sutil para el Ataque Furtivo y se desvanece tras el ataque.' },
    { level: 9, subclass: 'soulknife', source: 'TCE', name: 'Hojas del Alma', text: 'Golpes Guiados: si fallas con una cuchilla psíquica, gastas un dado psiónico y lo sumas al ataque. Teletransporte Psíquico: como acción adicional, lanzas una cuchilla, gastas un dado y te teletransportas a diez veces su resultado en pies.' },
    { level: 13, subclass: 'soulknife', source: 'TCE', name: 'Velo Psíquico', text: 'Como acción, te vuelves invisible 1 hora, junto con lo que lleves. Termina si atacas, fuerzas una salvación o lo disipas. Una vez por descanso largo, o gastando un dado psiónico.' },
    { level: 17, subclass: 'soulknife', source: 'TCE', name: 'Desgarrar la Mente', text: 'Cuando infliges Ataque Furtivo con tus cuchillas psíquicas, la criatura hace una salvación de Sabiduría con CD 8 + tu competencia + tu modificador de Destreza, o queda aturdida 1 minuto, repitiendo al final de cada turno. Una vez por descanso largo, o gastando tres dados psiónicos.' },
  ],
}
