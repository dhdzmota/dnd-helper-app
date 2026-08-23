import type { Raw } from './types'

/**
 * Conjuros que solo llegan concedidos por una subclase de Tasha's.
 * No entran en las listas generales: los tienes o no según tu subclase.
 */
export const EXPANDED_SPELLS: Raw[] = [
  // ── Nivel 1 ──────────────────────────────────────────────────────────────
  ['guiding-bolt', 'Proyectil de Guía', 'Guiding Bolt', 1, 'Evocación', '1 acción', '120 pies', 'V, S', '1 asalto',
    'Un destello de luz golpea a una criatura. Ataque de conjuro a distancia: 4d6 de daño radiante, y el siguiente ataque contra ella antes del final de tu próximo turno tiene ventaja. A niveles superiores: +1d6 por nivel.'],
  ['arms-of-hadar', 'Brazos de Hadar', 'Arms of Hadar', 1, 'Conjuración', '1 acción', 'Personal (10 pies)', 'V, S', 'Instantáneo',
    'Zarcillos oscuros brotan de ti. Cada criatura a 10 pies hace una salvación de Fuerza: 2d6 de daño necrótico y no puede reaccionar hasta su siguiente turno; mitad de daño si la supera. A niveles superiores: +1d6 por nivel.'],
  ['dissonant-whispers', 'Susurros Disonantes', 'Dissonant Whispers', 1, 'Encantamiento', '1 acción', '60 pies', 'V', 'Instantáneo',
    'Susurras una melodía terrible que solo oye una criatura. Hace una salvación de Sabiduría: 3d6 de daño psíquico y debe usar su reacción para alejarse de ti; mitad de daño y sin huir si la supera. A niveles superiores: +1d6 por nivel.'],
  ['alarm', 'Alarma', 'Alarm', 1, 'Abjuración', '1 minuto', '30 pies', 'V, S, M', '8 horas',
    'Ritual. Pones una alarma en un área de 20 pies de lado. Te avisa —mental o audiblemente— cuando una criatura de tamaño Diminuto o mayor entra, salvo que la hayas designado.'],

  // ── Nivel 2 ──────────────────────────────────────────────────────────────
  ['calm-emotions', 'Calmar Emociones', 'Calm Emotions', 2, 'Encantamiento', '1 acción', '60 pies', 'V, S', 'Concentración, hasta 1 minuto',
    'Cada humanoide en una esfera de 20 pies de radio hace una salvación de Carisma. En quien falle, suprimes el miedo y el encantamiento, o le vuelves indiferente hacia criaturas que le provocaran hostilidad.'],

  // ── Nivel 3 ──────────────────────────────────────────────────────────────
  ['hunger-of-hadar', 'Hambre de Hadar', 'Hunger of Hadar', 3, 'Conjuración', '1 acción', '150 pies', 'V, S, M', 'Concentración, hasta 1 minuto',
    'Abres una esfera de vacío frío de 20 pies de radio: área fuertemente oscurecida y terreno difícil. Quien empiece su turno dentro recibe 2d6 de frío; quien lo termine dentro hace una salvación de Destreza o recibe 2d6 perforante de tentáculos invisibles.'],
  ['sending', 'Enviar Mensaje', 'Sending', 3, 'Evocación', '1 acción', 'Ilimitado', 'V, S, M', '1 asalto',
    'Mandas un mensaje de 25 palabras a una criatura que conozcas, en cualquier parte del mismo plano, y puede responderte igual. Desde otro plano, hay un 5 % de que el mensaje no llegue.'],

  // ── Nivel 4 ──────────────────────────────────────────────────────────────
  ['compulsion', 'Compulsión', 'Compulsion', 4, 'Encantamiento', '1 acción', '30 pies', 'V, S', 'Concentración, hasta 1 minuto',
    'Las criaturas que elijas hacen una salvación de Sabiduría. En cada uno de sus turnos, las que fallen deben usar todo su movimiento en la dirección horizontal que tú marques como acción adicional.'],
  ['evards-black-tentacles', 'Tentáculos Negros de Evard', "Evard's Black Tentacles", 4, 'Conjuración', '1 acción', '90 pies', 'V, S, M', 'Concentración, hasta 1 minuto',
    'Tentáculos llenan un cuadrado de 20 pies: terreno difícil. Quien entre o empiece su turno dentro hace una salvación de Destreza o recibe 3d6 contundente y queda apresado. Los apresados repiten la salvación al final de cada turno.'],
  ['summon-aberration', 'Invocar Aberración', 'Summon Aberration', 4, 'Conjuración', '1 acción', '90 pies', 'V, S, M', 'Concentración, hasta 1 hora',
    'Invocas un espíritu aberrante: de garras, de tentáculos o de espadañas. Actúa en tu iniciativa, obedece tus órdenes verbales y su ataque usa tu bonificador de ataque de conjuro. A niveles superiores mejora su tamaño y su daño.'],
  ['summon-construct', 'Invocar Constructo', 'Summon Construct', 4, 'Conjuración', '1 acción', '90 pies', 'V, S, M', 'Concentración, hasta 1 hora',
    'Invocas un espíritu constructo de arcilla, metal o piedra. Actúa en tu iniciativa, obedece tus órdenes verbales, es inmune al veneno y al agotamiento, y su ataque usa tu bonificador de ataque de conjuro.'],

  // ── Nivel 5 ──────────────────────────────────────────────────────────────
  ['telekinesis', 'Telequinesis', 'Telekinesis', 5, 'Transmutación', '1 acción', '60 pies', 'V, S', 'Concentración, hasta 10 minutos',
    'Con tu acción cada turno, mueves con la mente a una criatura —salvación de Fuerza— hasta 30 pies en cualquier dirección, o manipulas un objeto de hasta 1000 libras.'],
  ['greater-restoration', 'Restauración Mayor', 'Greater Restoration', 5, 'Abjuración', '1 acción', 'Toque', 'V, S, M', 'Instantáneo',
    'Quitas un efecto que aflija a la criatura: un nivel de agotamiento, un encantamiento o petrificación, una maldición, una reducción de puntuación de característica, o una reducción de su máximo de puntos de golpe. Consume 100 po de polvo de diamante.'],
  ['wall-of-force', 'Muro de Fuerza', 'Wall of Force', 5, 'Evocación', '1 acción', '120 pies', 'V, S, M', 'Concentración, hasta 10 minutos',
    'Creas un muro invisible de fuerza: una cúpula, una esfera o hasta diez paneles de 10 pies. Nada físico lo atraviesa, es inmune al daño y no puede disiparse salvo con disipar magia. Desintegrar lo destruye al instante.'],
  ['rarys-telepathic-bond', 'Vínculo Telepático de Rary', "Rary's Telepathic Bond", 5, 'Adivinación', '1 acción', '30 pies', 'V, S, M', '1 hora',
    'Ritual. Hasta ocho criaturas voluntarias quedan unidas telepáticamente durante 1 hora: se comunican sin importar el idioma ni la distancia, mientras estén en el mismo plano.'],
]
