import type { Subclass } from './types'

/** Mente Aberrante — Tasha's Cauldron of Everything. */
export const ABERRANT_MIND: Subclass = {
  id: 'aberrant-mind',
  name: 'Mente Aberrante',
  source: 'TCE',
  flavor: 'Algo del Reino Lejano te tocó, y desde entonces oyes un susurro que no es tuyo. La magia te sale en forma de pensamiento, no de palabra.',
  oathSpells: {
    1: ['mind-sliver', 'arms-of-hadar', 'dissonant-whispers'],
    3: ['calm-emotions', 'detect-thoughts'],
    5: ['hunger-of-hadar', 'sending'],
    7: ['evards-black-tentacles', 'summon-aberration'],
    9: ['rarys-telepathic-bond', 'telekinesis'],
  },
  resources: [
    { id: 'warping-implosion', name: 'Implosión Deformante', detail: 'Te teletransportas 120 pies y arrastras lo que quede cerca', recharge: 'long', kind: 'uses', level: 18, source: 'TCE', max: { type: 'fixed', n: 1 } },
  ],
  features: [
    { level: 1, subclass: 'aberrant-mind', source: 'TCE', name: 'Conjuros Psiónicos', text: 'Aprendes conjuros añadidos a tu lista de conocidos, sin contar contra tu límite. Al subir de nivel puedes cambiar uno de ellos por otro de adivinación o encantamiento del mismo nivel.' },
    { level: 1, subclass: 'aberrant-mind', source: 'TCE', name: 'Habla Telepática', text: 'Como acción adicional, abres un vínculo telepático con una criatura a 30 pies que puedas ver. Dura tu modificador de Carisma en minutos, funciona a 1 milla y se comunica en un idioma que ambos conozcáis.' },
    { level: 6, subclass: 'aberrant-mind', source: 'TCE', name: 'Hechicería Psiónica', text: 'Puedes lanzar cualquier Conjuro Psiónico de nivel 1 o superior gastando puntos de hechicería iguales a su nivel, en vez de un espacio. Lanzado así no necesita componentes verbales, somáticos ni materiales.' },
    { level: 6, subclass: 'aberrant-mind', source: 'TCE', name: 'Defensas Psíquicas', text: 'Tienes resistencia al daño psíquico y ventaja en las tiradas de salvación contra ser encantado o asustado.' },
    { level: 14, subclass: 'aberrant-mind', source: 'TCE', name: 'Revelación en la Carne', text: 'Como acción adicional, gastas 1 o más puntos de hechicería y durante 10 minutos ganas un beneficio por punto: visión en la oscuridad de 60 pies y ver lo invisible; velocidad de nado y respirar bajo el agua; velocidad de vuelo; o cuerpo maleable con velocidad de trepar y capacidad de colarse por un hueco de una pulgada.' },
    { level: 18, subclass: 'aberrant-mind', source: 'TCE', name: 'Implosión Deformante', text: 'Como acción, te teletransportas hasta 120 pies. Cada criatura a 30 pies del espacio que dejaste hace una salvación de Fuerza: 3d10 de daño de fuerza y la arrastras hacia ese punto si falla. Una vez por descanso largo, o gastando 5 puntos de hechicería.' },
  ],
}

/** Alma de Relojería — Tasha's Cauldron of Everything. */
export const CLOCKWORK_SOUL: Subclass = {
  id: 'clockwork-soul',
  name: 'Alma de Relojería',
  source: 'TCE',
  flavor: 'Tocaste el Plano de Mechanus, donde el orden lo es todo, y algo de esa regularidad se te quedó dentro. Tu magia corrige lo que el caos tuerce.',
  oathSpells: {
    1: ['alarm', 'protection-from-evil-and-good'],
    3: ['aid', 'lesser-restoration'],
    5: ['dispel-magic', 'protection-from-energy'],
    7: ['freedom-of-movement', 'summon-construct'],
    9: ['greater-restoration', 'wall-of-force'],
  },
  resources: [
    { id: 'restore-balance', name: 'Restaurar el Equilibrio', detail: 'Anulas la ventaja o la desventaja de una tirada a 60 pies', recharge: 'long', kind: 'uses', level: 1, source: 'TCE', max: { type: 'proficiency' } },
    { id: 'trance-of-order', name: 'Trance del Orden', detail: 'Un minuto en el que nada por debajo de 10 te sale mal', recharge: 'long', kind: 'uses', level: 14, source: 'TCE', max: { type: 'fixed', n: 1 } },
    { id: 'clockwork-cavalcade', name: 'Cabalgata de Relojería', detail: '100 puntos de curación repartidos, conjuros terminados y objetos reparados', recharge: 'long', kind: 'uses', level: 18, source: 'TCE', max: { type: 'fixed', n: 1 } },
  ],
  features: [
    { level: 1, subclass: 'clockwork-soul', source: 'TCE', name: 'Magia de Relojería', text: 'Aprendes conjuros de abjuración y transmutación añadidos a tu lista de conocidos, sin contar contra tu límite. Al subir de nivel puedes cambiar uno por otro de esas dos escuelas del mismo nivel.' },
    { level: 1, subclass: 'clockwork-soul', source: 'TCE', name: 'Restaurar el Equilibrio', text: 'Cuando una criatura a 60 pies vaya a tirar con ventaja o con desventaja, usas tu reacción para anularla: tira normal. Usos: tu bonificador de competencia, por descanso largo.' },
    { level: 6, subclass: 'clockwork-soul', source: 'TCE', name: 'Bastión de la Ley', text: 'Como acción, gastas de 1 a 5 puntos de hechicería para proteger a una criatura a 30 pies con una salvaguarda de tantos d8 como puntos gastaste. Cuando reciba daño, puede gastar dados de la reserva para reducirlo.' },
    { level: 14, subclass: 'clockwork-soul', source: 'TCE', name: 'Trance del Orden', text: 'Como acción adicional, durante 1 minuto los ataques contra ti no pueden tener ventaja, y tratas cualquier d20 de 9 o menos como un 10 en tiradas de ataque, pruebas y salvaciones. Una vez por descanso largo, o gastando 5 puntos de hechicería.' },
    { level: 18, subclass: 'clockwork-soul', source: 'TCE', name: 'Cabalgata de Relojería', text: 'Como acción, espíritus llenan un cubo de 30 pies: reparten 100 puntos de golpe entre las criaturas que elijas, terminan todos los conjuros de nivel 6 o inferior sobre ellas, y reparan los objetos dañados. Una vez por descanso largo, o gastando 7 puntos de hechicería.' },
  ],
}
