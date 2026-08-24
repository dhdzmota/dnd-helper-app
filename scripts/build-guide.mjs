/**
 * Arma artifact/guia.html con las capturas reales que produce tests/walkthrough.mjs.
 * Las imágenes van incrustadas, así que la página se publica sola.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SHOTS = 'tests/screenshots/guia/web'
const img = (f) => `data:image/jpeg;base64,${readFileSync(join(SHOTS, f)).toString('base64')}`

const instalar = [
  {
    t: 'Pásate el archivo al teléfono',
    d: 'Es un único archivo, <b>ficha-dnd.html</b>. Mándatelo por WhatsApp, por correo, súbelo a Drive o pásalo por cable: da igual, mientras acabe en el teléfono. Pesa menos de 1 MB.',
  },
  {
    t: 'Ábrelo con el navegador',
    d: 'Desde la app de Archivos, toca el archivo. Si el teléfono lo abre con un visor raro en vez de con el navegador, mantén pulsado y elige <em>Abrir con → Chrome</em>. La app arranca ahí mismo, sin instalar nada.',
  },
  {
    t: 'Guárdalo en marcadores para volver',
    d: 'La primera vez que lo abras, añade la página a marcadores: es la forma más rápida de volver sin tener que buscar el archivo. No necesita internet en ningún momento, ni ahora ni después.',
  },
  {
    t: 'Deja el archivo donde está',
    d: 'Tus datos no viven dentro del archivo, sino en el navegador. Si borras el archivo puedes volver a copiarlo y todo seguirá ahí; pero si borras los datos de navegación de Chrome, se van. Por eso el paso siguiente importa.',
  },
  {
    t: 'Haz una copia de vez en cuando',
    d: 'En <b>Ficha → Tus datos</b>, toca <em>Ficha y diario</em> para bajarte un archivo con todo lo escrito. Guárdalo en Drive o mándatelo por correo. Esa copia es la única forma de recuperar la campaña si el teléfono se pierde.',
  },
]

const pasos = [
  { f: '01-app-recien-abierta.jpg', t: 'Lo primero que ves es un ejemplo', d: 'La app trae a Âreen Velthar cargado para que se vea cómo queda todo lleno. No es tu personaje: en un momento lo reemplazas.' },
  { f: '02-ficha-personaje-nuevo.jpg', t: 'Ve a la pestaña Ficha', d: 'Es la última de la barra de abajo. Ahí se define <em>lo que eres</em>; en las otras cuatro solo se gasta y se recupera lo que tienes. Arriba del todo está <b>Personaje nuevo</b>.' },
  { f: '03-elegir-clase.jpg', t: 'Toca tu clase', d: 'Paladín, Hechicero, Pícaro o Monje. No pasa nada todavía: te pide confirmar, porque va a reemplazar la ficha que haya cargada.' },
  { f: '04-hoja-en-blanco.jpg', t: 'Confirma y tienes hoja limpia', d: 'Nivel 3, con el array estándar (15, 14, 13, 12, 10, 8) ya repartido según lo que tu clase necesita. Un monje recibe la Destreza alta; un hechicero, el Carisma.' },
  { f: '05-poner-nombre.jpg', t: 'Nombre y lema', d: 'El lema sale bajo el retrato en la pestaña Héroe. Si quieres tu propia imagen, en <b>Retrato</b> puedes subir una desde la galería del teléfono.' },
  { f: '06-elegir-raza.jpg', t: 'Elige tu raza', d: 'Si tu raza tiene linaje —dracónido, elfo, enano— aparece un segundo desplegable debajo. El tiflin no tiene, así que no sale nada. Abajo te dice qué bono de característica te da.' },
  { f: '07-elegir-tradicion.jpg', t: 'Elige tu subclase', d: 'El desplegable solo aparece si tu nivel te la permite; por debajo te dice cuánto falta. Las de Tasha\'s van marcadas para que sepas de dónde salen.' },
  { f: '08-caracteristicas.jpg', t: 'Ajusta las características', d: 'Escribe la puntuación <em>antes</em> del bono racial: la app le suma el resto y te muestra el modificador. Los puntos de golpe máximos se recalculan solos, y los actuales suben con ellos.' },
  { f: '09-competencias.jpg', t: 'Marca tus competencias', d: 'Arriba, las que tu clase te deja elegir y cuántas te tocan. Abajo, el resto, que normalmente vienen del trasfondo. Si eres pícaro, después aparece la sección de Pericia.' },
  { f: '10-defensa.jpg', t: 'Di cómo te proteges', d: 'Elige armadura y escudo, y la CA se calcula sola. Un monje o un hechicero dracónico se quedan <em>sin armadura</em> y la app usa su fórmula de clase. Si tu DM te dio algo raro, puedes fijar la CA a mano.' },
  { f: '11-ataques.jpg', t: 'Añade tus ataques', d: 'Nombre, dados, tipo de daño y con qué característica atacas. La app suma tu modificador y tu competencia, así que en Combate ves el número final y no tienes que recordarlo.' },
  { f: '12-resultado-heroe.jpg', tall: true, t: 'Héroe: quién eres', d: 'Retrato, identidad, las seis características —el número grande es el modificador, que es lo que sumas al dado—, salvaciones y las dieciocho habilidades.' },
  { f: '13-resultado-combate.jpg', tall: true, t: 'Combate: tu turno', d: 'Puntos de golpe con botones grandes, CA, iniciativa, dados de golpe, tus ataques ya calculados y lo que escala con el nivel. Las salvaciones de muerte solo aparecen si caes a 0.' },
  { f: '14-resultado-rasgos.jpg', tall: true, t: 'Rasgos: lo que puedes gastar', d: 'Ki, aliento, imposición de manos, puntos de hechicería. Cada marca se toca para gastarla y se vuelve a tocar para devolverla. Los botones <b>Corto</b> y <b>Largo</b> de arriba reponen exactamente lo que toca.' },
]

const paso = (n, { f, t, d, tall }) => `
      <article class="step${tall ? ' tall' : ''}">
        <div class="step-body">
          <span class="step-n">${String(n).padStart(2, '0')}</span>
          <h3>${t}</h3>
          <p>${d}</p>
        </div>
        ${f ? `<figure class="phone"><img src="${img(f)}" alt="Paso ${n}: ${t}" loading="lazy"></figure>` : ''}
      </article>`

const html = `<title>Tu ficha en el celular</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;1,400&family=Oswald:wght@200;300;400&display=swap" rel="stylesheet">
<style>
:root {
  --ink: #08090A; --plate: #0E0F11; --raise: #16171A; --edge: #24252A;
  --scale: #3A0F0F; --cloth: #5A1B1B; --gold: #C9A46A; --gold-dim: rgba(201,164,106,.34);
  --gold-warm: #E0C08C; --parchment: #E9E2D4; --ash: #8C8377; --ash-dim: #5E5951;
  --display: 'Cinzel', 'Times New Roman', serif;
  --body: 'EB Garamond', Georgia, serif;
  --data: 'Oswald', 'Helvetica Neue', sans-serif;
  color-scheme: dark;
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--ink); color: var(--parchment);
  font-family: var(--body); font-size: 1.0625rem; line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
body::after {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 100; opacity: .05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
}
.wrap { max-width: 940px; margin-inline: auto; padding: 0 20px 80px; }
header { padding: 72px 0 40px; border-bottom: 1px solid var(--edge); position: relative; }
header::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px;
  background: linear-gradient(90deg, var(--gold-dim), transparent 60%);
}
h1 {
  font-family: var(--display); font-weight: 700; letter-spacing: .04em;
  font-size: clamp(2rem, 6vw, 3rem); line-height: 1.1; margin: 0 0 14px; text-wrap: balance;
}
.lede { font-size: 1.1875rem; color: #CFC7B8; max-width: 62ch; margin: 0; }
.eyebrow {
  display: flex; align-items: center; gap: 12px; margin: 64px 0 8px;
  font-family: var(--data); font-size: .6875rem; font-weight: 400;
  letter-spacing: .18em; text-transform: uppercase; color: var(--gold);
}
.eyebrow::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--gold-dim), transparent); }
h2 { font-family: var(--display); font-weight: 600; letter-spacing: .03em; font-size: 1.75rem; margin: 0 0 8px; }
.section-note { color: var(--ash); max-width: 62ch; margin: 0 0 8px; }
.step {
  display: grid; grid-template-columns: 1fr; gap: 22px;
  padding: 30px 0; border-bottom: 1px solid rgba(36,37,42,.7);
}
.step:last-child { border-bottom: none; }
.step-body { min-width: 0; }
.step-n {
  display: inline-block; font-family: var(--data); font-weight: 200; font-size: 1.75rem;
  color: var(--gold); line-height: 1; margin-bottom: 6px; font-variant-numeric: tabular-nums;
}
.step h3 { font-family: var(--display); font-weight: 600; letter-spacing: .02em; font-size: 1.25rem; margin: 0 0 8px; text-wrap: balance; }
.step p { margin: 0; color: #CFC7B8; max-width: 56ch; }
.step em { color: var(--gold-warm); font-style: italic; }
.step b { color: var(--parchment); font-weight: 400; border-bottom: 1px solid var(--gold-dim); }
.phone { margin: 0; }
.phone img {
  display: block; width: 100%; max-width: 300px; height: auto;
  border: 1px solid var(--edge); background: var(--plate);
  box-shadow: 0 18px 44px rgba(0,0,0,.6);
}
.link-card {
  display: block; margin: 26px 0 8px; padding: 18px 20px;
  border: 1px solid var(--gold-dim); border-left: 3px solid var(--gold);
  background: var(--raise); color: var(--gold-warm); text-decoration: none;
  font-family: var(--data); font-weight: 300; letter-spacing: .02em; word-break: break-all;
  transition: background .15s;
}
.link-card:hover, .link-card:focus-visible { background: rgba(201,164,106,.08); }
.link-card span {
  display: block; font-size: .625rem; letter-spacing: .16em; text-transform: uppercase;
  color: var(--ash); margin-bottom: 6px; word-break: normal;
}
.note {
  border: 1px dashed var(--edge); border-left: 2px solid var(--gold-dim);
  padding: 16px 18px; margin: 28px 0 0; color: var(--ash); font-size: .9375rem;
}
.note strong {
  display: block; font-family: var(--data); font-size: .6875rem; font-weight: 400;
  letter-spacing: .13em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px;
}
.note p { margin: 0 0 8px; }
.note p:last-child { margin-bottom: 0; }
footer { margin-top: 72px; padding-top: 24px; border-top: 1px solid var(--edge); color: var(--ash-dim); font-size: .875rem; }
a:focus-visible, .link-card:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }
@media (min-width: 760px) {
  .step { grid-template-columns: 1fr 290px; gap: 44px; align-items: center; }
  .phone { justify-self: end; }
  /* Las tres últimas enseñan la pantalla entera: alinéalas arriba. */
  .step.tall { align-items: start; }
}
@media (prefers-reduced-motion: reduce) { * { transition-duration: .01ms !important; } }
</style>

<div class="wrap">
  <header>
    <h1>Tu ficha en el celular</h1>
    <p class="lede">
      Cómo instalar el compañero de campaña en el teléfono y armar tu personaje desde cero,
      paso a paso. Las capturas son de la app de verdad, hechas sobre un Monje tiflin de nivel 3.
    </p>
  </header>

  <h2 class="eyebrow">Parte uno</h2>
  <h2>Ponerla en el celular</h2>
  <p class="section-note">
    Un archivo, cinco pasos. Sin cuentas, sin tiendas de aplicaciones y sin conexión.
  </p>

  ${instalar.map((s, i) => paso(i + 1, s)).join('')}

  ${paso(6, { f: '17-datos.jpg', t: 'Comprueba el estado de tus datos', d: 'En <b>Ficha → Tus datos</b>, cuatro luces te dicen si todo va bien. Si la primera está en rojo, toca <em>Pedirla</em>: le pide al navegador que no borre la app para hacer sitio.' })}

  <div class="note">
    <strong>Sobre tus datos</strong>
    <p>Cada teléfono guarda lo suyo, dentro del aparato: la ficha, las notas y la bitácora. Nadie más lo ve, y no se sincroniza solo entre dispositivos.</p>
    <p>En <b>Ficha → Tus datos</b> verás cuatro luces: si el navegador ha prometido no borrar tus datos, si el almacén de imágenes funciona, si la ficha se está guardando, y cuánto hace que no haces copia. Si la primera está en rojo, toca <em>Pedirla</em>.</p>
    <p><b>Guardar copia</b> baja un archivo con la ficha y el diario enteros. Para pasar la campaña a otro teléfono, guárdala y cárgala allí con <em>Cargar archivo</em>.</p>
  </div>

  <h2 class="eyebrow">Parte dos</h2>
  <h2>Crear tu personaje</h2>
  <p class="section-note">
    Del ejemplo que viene cargado a tu propia ficha funcionando. Catorce toques, más o menos cinco minutos.
  </p>

  ${pasos.map((s, i) => paso(i + 1, s)).join('')}

  <h2 class="eyebrow">Parte tres</h2>
  <h2>El diario de la campaña</h2>
  <p class="section-note">
    La quinta pestaña no es de reglas: es vuestra. Tres apartados que se guardan igual que la ficha.
  </p>

  ${[
    { f: '15-notas.jpg', t: 'Notas', d: 'Lo que os encontráis y no queréis olvidar: nombres, pistas, objetos, quién os debe un favor. Cada nota tiene su título y su texto, y cuando pasan de tres aparece un buscador.' },
    { f: '16-bitacora.jpg', t: 'Bitácora', d: 'Un diario por sesión, con su fecha. Toca <b>Anotar la sesión de hoy</b>, cuenta qué pasó, y se ordena solo de lo más reciente a lo más antiguo. Puedes cambiar la fecha si escribes tarde.' },
  ].map((s, i) => paso(i + 1, s)).join('')}

  <div class="note">
    <strong>Lo único que hay que recordar</strong>
    <p><b>Ficha</b> define lo que eres. Las otras cuatro pestañas gastan lo que tienes.</p>
    <p>Toca una marca para gastarla; tócala otra vez para devolverla. <b>Corto</b> y <b>Largo</b>, arriba a la derecha, reponen exactamente lo que las reglas dicen que se repone.</p>
    <p>Si a tu nivel no puedes hacer algo, la opción no aparece. Si algo no se puede cambiar —los conjuros que te da tu subclase—, no hay botón para quitarlo.</p>
  </div>

  <footer>
    Reglas del Manual del Jugador y de Tasha's Cauldron of Everything.
    Los rasgos opcionales de Tasha's se apagan en <b>Ficha → Reglas en la mesa</b> si tu DM no los usa.
  </footer>
</div>
`

mkdirSync('artifact', { recursive: true })
writeFileSync('artifact/guia.html', html)
console.log(`artifact/guia.html — ${Math.round(html.length / 1024)} KB, ${pasos.length + instalar.length} pasos`)
