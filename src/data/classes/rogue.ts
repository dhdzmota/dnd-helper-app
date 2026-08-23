import type { CharClass, ClassFeature, Subclass } from './types'
import { PHANTOM, SOULKNIFE } from './rogue-tashas'

const sneakAttack = (level: number) => `${Math.ceil(level / 2)}d6`

const THIEF: Subclass = {
  id: 'thief',
  name: 'Ladrón',
  flavor: 'Manos rápidas y pies ligeros. Entras donde no deberías, sales antes de que nadie lo note, y te llevas lo que viniste a buscar.',
  features: [
    { level: 3, subclass: 'thief', name: 'Manos Rápidas', text: 'Puedes usar la acción adicional de Acción Astuta para hacer una prueba de Juego de Manos, usar tus herramientas de ladrón para desarmar una trampa o abrir una cerradura, o realizar la acción de Usar un Objeto.' },
    { level: 3, subclass: 'thief', name: 'Trabajo en Altura', text: 'Trepar ya no te cuesta movimiento extra, y cuando saltas en largo con carrerilla, la distancia aumenta en pies iguales a tu modificador de Destreza.' },
    { level: 9, subclass: 'thief', name: 'Sigilo Supremo', text: 'Tienes ventaja en las pruebas de Sigilo si te mueves como mucho a la mitad de tu velocidad en ese turno.' },
    { level: 13, subclass: 'thief', name: 'Usar Objeto Mágico', text: 'Ignoras todos los requisitos de clase, raza y nivel para usar objetos mágicos.' },
    { level: 17, subclass: 'thief', name: 'Reflejos de Ladrón', text: 'Puedes hacer dos turnos durante el primer asalto de cualquier combate: el tuyo normal y otro con tu iniciativa menos 10. No funciona si estás sorprendido.' },
  ],
}

const ASSASSIN: Subclass = {
  id: 'assassin',
  name: 'Asesino',
  flavor: 'Un golpe, en el momento exacto, antes de que el objetivo sepa que estás ahí. Lo demás es teatro.',
  features: [
    { level: 3, subclass: 'assassin', name: 'Competencias Adicionales', text: 'Ganas competencia con el kit de disfraz y con el kit de envenenador.' },
    { level: 3, subclass: 'assassin', name: 'Asesinar', text: 'Tienes ventaja en las tiradas de ataque contra cualquier criatura que no haya actuado todavía en el combate. Además, cualquier acierto contra una criatura sorprendida es un crítico.' },
    { level: 9, subclass: 'assassin', name: 'Experto en Infiltración', text: 'Puedes crear una identidad falsa con 25 días de trabajo y 25 po. Nadie sospecha del engaño salvo que le des motivos.' },
    { level: 13, subclass: 'assassin', name: 'Impostor', text: 'Puedes imitar el habla, la escritura y el comportamiento de otra persona sin fallo aparente, tras estudiarla al menos 3 horas.' },
    { level: 17, subclass: 'assassin', name: 'Golpe Mortal', text: 'Cuando aciertas a una criatura sorprendida, hace una salvación de Constitución con CD 8 + tu modificador de Destreza + tu bonificador de competencia. Si falla, doblas el daño de ese ataque.' },
  ],
}

const ARCANE_TRICKSTER: Subclass = {
  id: 'arcane-trickster',
  name: 'Embaucador Arcano',
  flavor: 'Robar es más fácil cuando la cerradura se abre sola y nadie recuerda tu cara. Magia justa, aplicada donde importa.',
  casting: {
    casterType: 'third',
    ability: 'int',
    spellListId: 'arcane-trickster',
    spellsKnownByLevel: [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13],
    cantripsKnownByLevel: [0, 0, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    fixedCantrips: ['mage-hand'],
    note: 'Inteligencia es tu característica de lanzamiento. Casi todo lo que aprendes tiene que ser de encantamiento o ilusión: solo tres de tus conjuros conocidos pueden salirse de esas dos escuelas.',
  },
  features: [
    { level: 3, subclass: 'arcane-trickster', name: 'Lanzamiento de Conjuros', text: 'Aprendes magia del grimorio de mago, sobre todo de ilusión y encantamiento. Inteligencia es tu característica de lanzamiento. A nivel 3 conoces tres trucos —uno debe ser Mano de Mago— y tres conjuros de nivel 1.' },
    { level: 3, subclass: 'arcane-trickster', name: 'Prestidigitación con Mano de Mago', text: 'Tu Mano de Mago se vuelve invisible y puede meter y sacar objetos de contenedores ajenos, usar herramientas de ladrón a distancia y hacer pruebas de Juego de Manos con tu bonificador.' },
    { level: 9, subclass: 'arcane-trickster', name: 'Emboscada Mágica', text: 'Si estás escondido cuando lanzas un conjuro sobre una criatura, esta tiene desventaja en la salvación contra él durante ese turno.' },
    { level: 13, subclass: 'arcane-trickster', name: 'Embaucador Versátil', text: 'Como acción adicional, tu Mano de Mago distrae a una criatura a 5 pies de ella: ganas ventaja en tus tiradas de ataque contra esa criatura hasta el final del turno.' },
    { level: 17, subclass: 'arcane-trickster', name: 'Ladrón de Conjuros', text: 'Cuando una criatura lanza un conjuro que te apunta, usas tu reacción para intentar robarlo. Si falla una salvación con tu CD, el conjuro falla, tú lo aprendes durante 8 horas y ella no puede lanzarlo en ese tiempo. Una vez por descanso largo.' },
  ],
  resources: [
    { id: 'spell-thief', name: 'Ladrón de Conjuros', detail: 'Roba un conjuro que te apunte durante 8 horas', recharge: 'long', kind: 'uses', level: 17, max: { type: 'fixed', n: 1 } },
  ],
}

export const ROGUE: CharClass = {
  id: 'rogue',
  name: 'Pícaro',
  hitDie: 8,
  primary: ['dex'],
  savingThrows: ['dex', 'int'],
  skillChoices: 4,
  skillList: [
    'acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation',
    'perception', 'performance', 'persuasion', 'sleightOfHand', 'stealth',
  ],
  casterType: 'none',
  spellPrep: 'none',
  spellcastingLevel: 99,
  subclassLabel: 'Arquetipo de pícaro',
  subclassLevel: 3,
  subclasses: [THIEF, ASSASSIN, ARCANE_TRICKSTER, PHANTOM, SOULKNIFE],
  expertiseByLevel: [2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  resources: [
    { id: 'stroke-of-luck', name: 'Golpe de Suerte', detail: 'Convierte un fallo en acierto, o una prueba fallida en un 20', recharge: 'short', kind: 'uses', level: 20, max: { type: 'fixed', n: 1 } },
  ],
  scalings: [
    {
      id: 'sneak-attack',
      name: 'Ataque Furtivo',
      detail: 'Daño extra una vez por turno, con ventaja o con un aliado adyacente al objetivo. El arma debe ser sutil o a distancia.',
      byLevel: Array.from({ length: 20 }, (_, i) => sneakAttack(i + 1)),
    },
  ],
  features: ([
    { level: 1, name: 'Pericia', text: 'Eliges dos de tus competencias en habilidades (o una y las herramientas de ladrón): tu bonificador de competencia se dobla en cualquier prueba que las use. A nivel 6 eliges otras dos.' },
    { level: 1, name: 'Ataque Furtivo', text: 'Una vez por turno, infliges daño extra a una criatura a la que aciertes si tienes ventaja en la tirada, o si un aliado suyo está a 5 pies de ella y tú no tienes desventaja. El arma tiene que ser sutil o a distancia.' },
    { level: 1, name: 'Jerga de Ladrones', text: 'Conoces la jerga secreta de los pícaros: un dialecto cifrado de frases, signos y símbolos con el que puedes ocultar un mensaje dentro de una conversación normal.' },
    { level: 2, name: 'Acción Astuta', text: 'Tu agilidad mental te deja realizar la acción de Correr, Desengancharse o Esconderse como acción adicional en cada uno de tus turnos.' },
    { level: 3, name: 'Arquetipo de Pícaro', text: 'Eliges el arquetipo que refleja cómo practicas tu oficio. Te da rasgos ahora y en los niveles 9, 13 y 17.' },
    { level: 3, name: 'Puntería Firme', source: 'TCE', text: 'Como acción adicional, ganas ventaja en tu siguiente tirada de ataque de este turno. Solo puedes usarlo si no te has movido, y tu velocidad pasa a 0 hasta el final del turno.' },
    { level: 5, name: 'Esquiva Asombrosa', text: 'Cuando un atacante que puedes ver te acierta, usas tu reacción para reducir a la mitad el daño de ese ataque.' },
    { level: 7, name: 'Evasión', text: 'Cuando un efecto te permite una salvación de Destreza para recibir la mitad del daño, no recibes ninguno si la superas, y solo la mitad si fallas.' },
    { level: 11, name: 'Talento Fiable', text: 'En cualquier prueba de característica que use una competencia tuya, tratas cualquier tirada del d20 de 9 o menos como un 10.' },
    { level: 14, name: 'Percepción Ciega', text: 'Eres consciente de la ubicación de cualquier criatura oculta o invisible a 10 pies de ti, siempre que puedas oír y no estés ensordecido.' },
    { level: 15, name: 'Mente Escurridiza', text: 'Ganas competencia en las tiradas de salvación de Sabiduría.' },
    { level: 18, name: 'Elusivo', text: 'Ningún atacante tiene ventaja contra ti mientras no estés incapacitado.' },
    { level: 20, name: 'Golpe de Suerte', text: 'Cuando fallas una tirada de ataque, la conviertes en acierto. Cuando fallas una prueba de característica, tratas el d20 como un 20. Recuperas el uso al terminar un descanso corto o largo.' },
  ] as ClassFeature[]).concat(
    [4, 8, 10, 12, 16, 19].map((level) => ({
      level,
      name: 'Mejora de Característica',
      text: 'Sube una característica en 2, o dos características en 1 cada una. No puedes pasar de 20. Alternativamente, puedes tomar una dote.',
    })),
  ).sort((a, b) => a.level - b.level),
}
