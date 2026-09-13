import type { Subclass } from './types'

/** Juramento de Gloria — Tasha's Cauldron of Everything. */
export const GLORY: Subclass = {
  id: 'glory',
  name: 'Juramento de Gloria',
  source: 'TCE',
  flavor: 'La grandeza no se hereda: se gana. Crees que tú y los tuyos estáis destinados a hazañas dignas de canción, y entrenas cada día para merecerlo.',
  oathSpells: {
    3: ['guiding-bolt', 'heroism'],
    5: ['enhance-ability', 'magic-weapon'],
    9: ['haste', 'protection-from-energy'],
    13: ['compulsion', 'freedom-of-movement'],
    17: ['commune', 'flame-strike'],
  },
  resources: [
    { id: 'glorious-defense', name: 'Defensa Gloriosa', detail: 'Sumas tu Carisma a la CA de un aliado a 10 pies, y si el ataque falla puedes contraatacar', recharge: 'long', kind: 'uses', level: 15, source: 'TCE', max: { type: 'ability', ability: 'cha', min: 1 } },
    { id: 'living-legend', name: 'Leyenda Viviente', detail: 'Un minuto de gloria: aciertos garantizados y salvaciones repetidas', recharge: 'long', kind: 'uses', level: 20, source: 'TCE', max: { type: 'fixed', n: 1 } },
  ],
  features: [
    { level: 3, subclass: 'glory', source: 'TCE', name: 'Canalizar Divinidad: Atleta sin Par', turno: 'adicional', text: 'Como acción adicional, durante 10 minutos tienes ventaja en las pruebas de Atletismo y Acrobacias, tu capacidad de carga se dobla y la distancia que saltas aumenta en 10 pies.' },
    { level: 3, subclass: 'glory', source: 'TCE', name: 'Canalizar Divinidad: Castigo Inspirador', turno: 'adicional', text: 'Justo después de usar Castigo Divino, como acción adicional repartes puntos de golpe temporales entre las criaturas que elijas a 30 pies, incluido tú. El total es 2d8 + tu nivel de paladín.' },
    { level: 7, subclass: 'glory', source: 'TCE', name: 'Aura de Presteza', text: 'Tu velocidad aumenta en 10 pies. Además, cuando una criatura amistosa empieza su turno a 5 pies de ti o entra en ese radio por primera vez en un turno, su velocidad sube 10 pies hasta el final de su siguiente turno. A nivel 18 el radio pasa a 10 pies.' },
    { level: 15, subclass: 'glory', source: 'TCE', name: 'Defensa Gloriosa', turno: 'reaccion', text: 'Cuando tú o una criatura que puedas ver a 10 pies recibís un acierto, usas tu reacción para sumar tu modificador de Carisma a la CA contra ese ataque (mínimo +1). Si eso lo convierte en fallo, puedes hacer un ataque con arma contra el atacante si está a tu alcance. Usos: tu modificador de Carisma, por descanso largo.' },
    { level: 20, subclass: 'glory', source: 'TCE', name: 'Leyenda Viviente', turno: 'adicional', text: 'Como acción adicional, durante 1 minuto: tienes ventaja en todas las pruebas de Carisma; una vez por turno, un ataque con arma que falle se convierte en acierto; y una vez por turno puedes repetir una salvación fallida. Una vez por descanso largo, o gastando un espacio de conjuro de nivel 5.' },
  ],
}
