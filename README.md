# Compañero de campaña

Ficha viva para una mesa de D&D 5e. Nació para **Âreen Velthar**, paladín dracónico
(rojo) del Juramento de Devoción, y hoy sirve también a Hechicero, Pícaro y Monje.
No es un visor de hoja de personaje: es un **administrador de recursos**. Lo que se gasta
y se recupera —espacios de conjuro, dados de golpe, aliento, canalizar divinidad,
imposición de manos— se toca con el pulgar y se repone con un descanso.

Todo lo que ves está **filtrado por nivel**: si a tu nivel no puedes hacer algo, la
opción no aparece; si algo no se puede cambiar (los conjuros de juramento), no se ofrece
el botón de quitarlo.

## Poner en marcha

```bash
npm install
npm run dev          # desarrollo en http://localhost:5173
npm run build        # PWA lista para desplegar, en dist/
npm run preview      # ver la build de dist/
npm test             # la suite completa
```

Las suites por separado: `check` (reglas de 5e), `test:ui` (flujos), `test:classes`
(las cuatro clases), `test:hp` (los puntos de golpe al editar la ficha), `test:journal`
(notas, bitácora, galería y restauración en un dispositivo limpio), `test:responsive`,
`test:transfer`, `test:offline` (sin señal), `test:standalone` (el archivo suelto
abierto desde `file://`) y `test:artifact`. Las de navegador levantan
la preview solas, pero necesitan un `npm run build` previo. `npm run party` regenera las
capturas de los personajes de la mesa.

## Guía para la mesa

`npm run build:guide` graba una creación de personaje completa desde la interfaz real
(`tests/walkthrough.mjs`) y monta con esas capturas una página de instalación y primeros
pasos, lista para publicar y mandar a los demás jugadores.

## La app de Android

```bash
npm run apk        # dist-apk/ficha-dnd-<versión>.apk
```

Un WebView que sirve la app desde `assets/www` en `https://ficha.local/`. Ese origen
propio y seguro es lo que hace que `localStorage` e IndexedDB acaben en el almacenamiento
privado del paquete: solo esta app los lee, y no se van al borrar los datos del navegador.

No pide **ningún permiso**. Las imágenes entran por el selector del sistema y las copias
salen a Descargas vía `MediaStore`, ambas cosas sin permisos en Android moderno.
`android:allowBackup` está activado, así que la copia de seguridad de Google se lleva
la ficha, el diario y la galería si el usuario restaura el teléfono.

**La clave de firma vive en `android/ficha.keystore` y no se puede perder.** Android
solo instala una actualización encima si viene firmada con la misma clave; sin ella,
tus jugadores tendrían que desinstalar, y ahí sí perderían los datos. Por eso el archivo
se queda en el proyecto y no está en `.gitignore`.

**Actualizaciones.** `versionCode` sube solo en cada build, que es lo que Android exige
para aceptar una instalación encima. `versionName` lo pones tú en `android/version.json`.
El script comprueba que el número acabó de verdad dentro del APK antes de dar el build
por bueno: declarar la versión en el manifiesto haría que `aapt2` ignorase la inyección
y todas las builds saldrían iguales.

La compilación no usa Gradle: `aapt2`, `javac`, `d8` y `apksigner` directamente, sin
ninguna dependencia de terceros. Solo hace falta el SDK:

```bash
sdkmanager "platforms;android-34" "build-tools;34.0.0"
```

`npm run test:webview` prueba la app en las condiciones exactas del contenedor —otro
origen, sin service worker, con el puente de Android puesto— porque el APK en sí no se
puede ejecutar sin un dispositivo.

## Llevarla al celular

Hay dos caminos, y el primero no necesita ni servidor ni cuenta:

```bash
npm run build:single    # dist-single/ficha-dnd.html — un archivo, ~700 KB
```

Ese archivo lleva dentro el código, el retrato y los íconos. Pásalo al teléfono por
donde quieras y ábrelo con el navegador: la app arranca desde `file://`, guarda en
localStorage e IndexedDB, y funciona sin conexión desde el primer momento.
`npm run test:standalone` lo comprueba abriéndolo de verdad como archivo local.

Lo que no da ese camino es el ícono en la pantalla de inicio ni el arranque a pantalla
completa: para eso hace falta servirlo por HTTP, que es el camino de abajo.

## Instalarla en el celular

La build de `dist/` es una PWA completa: manifiesto, íconos, service worker y modo
offline de verdad. `scripts/build-sw.mjs` inyecta en el service worker la lista de
archivos construidos y también precarga las tipografías, así que la app funciona sin
señal desde la primera visita, no desde la segunda. Súbela a cualquier hosting estático (Netlify, Vercel, GitHub Pages, tu propio
servidor) y en el móvil abre la URL y elige **«Añadir a la pantalla de inicio»**. A
partir de ahí arranca a pantalla completa, con su ícono, y funciona sin señal.

`base` es `'./'`, así que sirve igual desde la raíz del dominio o desde un subdirectorio.

También hay una versión empaquetada en un solo archivo HTML:

```bash
npm run build:single     # dist-single/index.html — autónomo, ábrelo con doble clic
npm run build:artifact   # artifact/areen-velthar.html — fragmento para publicar
```

## Las cinco pestañas

| Pestaña | Para qué | Qué hay dentro |
|---|---|---|
| **Héroe** | Quién eres | Retrato, identidad, las seis características con sus modificadores, salvaciones, las 18 habilidades |
| **Combate** | La pelea | Puntos de golpe y temporales, CA, iniciativa, dados de golpe, Castigo Divino, ataques, estados, concentración. Las salvaciones de muerte **solo aparecen a 0 PG** |
| **Conjuros** | La magia del día | Espacios por nivel, trucos con su daño actual, conjuros fijos de subclase, tu lista preparada o conocida, y el repertorio para cambiarla |
| **Rasgos** | Qué puedes hacer | Lo que escala con el nivel, todos los recursos gastables, elecciones de clase, rasgos de linaje y de clase, y dotes |
| **Diario** | Vuestra campaña | Notas sueltas con buscador, bitácora por sesión con fecha, y galería de imágenes guardadas en el teléfono |
| **Ficha** | Qué eres | Personaje nuevo, desplegables encadenados, características, competencias, pericia, elecciones de clase, defensa, ataques y tus datos |

La regla de reparto: **Ficha define lo que eres; las otras gastan lo que tienes.**

## Cómo se gasta

Cada recurso se dibuja como una talla: **rombo dorado hueco** = espacio libre,
**cuadro oxblood tachado** = gastado. Tocar una marca la gasta; tocar una ya gastada la
devuelve. En la cabecera, **Corto** y **Largo** reponen exactamente lo que corresponde
según las reglas.

## Los desplegables encadenados

Elegir arriba cambia lo que aparece abajo:

- **Raza → linaje.** Dracónido abre «Linaje dracónico» (los diez colores); cada uno fija
  el daño del aliento, su forma y la resistencia. Humano no abre nada. Elfo y enano abren
  sus propias sublistas.
- **Clase → nivel → juramento.** Por debajo del nivel 3 no hay desplegable de juramento:
  hay una línea que dice cuánto falta. Igual con el estilo de combate (nivel 2).
- **Nivel → dotes.** Sin espacios de mejora no hay lista de dotes. Con todos ocupados,
  las no elegidas se deshabilitan hasta que quites una.
- **Dotes → trucos.** Un paladín no aprende trucos. La sección solo deja elegir si algo
  te los concede (Iniciado en la Magia), y explica por qué si no.

## Fuentes

Solo dos libros: el **Manual del Jugador** y ***Tasha's Cauldron of Everything***. Nada
de Xanathar, Fizban ni otros suplementos entra en el catálogo.

Tasha's llama "opcionales" a sus rasgos de clase, y el libro deja la decisión al DM. Por
eso son un interruptor en **Ficha → Reglas en la mesa**, activado por defecto. Al apagarlo
desaparecen del desplegable de estilos, de la lista de metamagias, de las dotes y de los
recursos, y lo que ya hubieras elegido de ahí deja de contar.

Lo que aporta Tasha's, por clase:

| Clase | Rasgos opcionales |
|---|---|
| **Paladín** | Guerrero Bendecido, Lucha a Ciegas e Intercepción como estilos; Canalizar Poder Divino; Versatilidad Marcial |
| **Hechicero** | Conjuro Buscador y Conjuro Transmutado; Versatilidad Hechicera; Guía Mágica |
| **Pícaro** | Puntería Firme |
| **Monje** | Arma Predilecta, Ataque Alimentado por Ki, Curación Acelerada, Puntería Concentrada |

Más siete subclases y once dotes, estas últimas marcadas con `·T` en la lista.

**Guerrero Bendecido** es el que responde a la pregunta de siempre: un paladín no aprende
trucos por su clase, pero con ese estilo de combate se lleva dos de la lista de clérigo,
lanzados con Carisma. La app solo te deja elegir entre esos siete.

## Las clases

Cuatro clases completas hasta nivel 20, cada una con sus subclases del manual básico:

| Clase | Magia | Subclases | Lo propio |
|---|---|---|---|
| **Paladín** | Media, preparada | Devoción, Ancestros, Venganza · **Gloria** | Castigo Divino, Imposición de Manos, Canalizar Divinidad, conjuros de juramento fijos |
| **Hechicero** | Completa, conocida | Linaje Dracónico, Magia Salvaje · **Mente Aberrante, Alma de Relojería** | Puntos de hechicería, metamagia, Resiliencia Dracónica |
| **Pícaro** | Ninguna, salvo un arquetipo | Ladrón, Asesino, Embaucador Arcano · **Fantasma, Cuchilla del Alma** | Ataque Furtivo, Pericia, magia de un tercio o dados psiónicos según el arquetipo |
| **Monje** | Ninguna | Mano Abierta, Sombra, Cuatro Elementos · **Misericordia, Yo Astral** | Puntos de ki, Artes Marciales, Defensa y Movimiento sin Armadura |

Las **en negrita** son de Tasha's y desaparecen del desplegable si apagas el interruptor.
Las subclases que conceden conjuros —los juramentos, los Conjuros Psiónicos de Mente
Aberrante, la Magia de Relojería— los añaden fuera de tu límite y sin poder cambiarlos,
igual que los conjuros de juramento del paladín.

Cada clase declara sus datos y el motor hace el resto: las tres tablas de espacios
(completo, medio, un tercio), conjuros preparados frente a conocidos, características de
lanzamiento distintas, defensa sin armadura, pericia, elecciones de "elige N de estas"
(metamagia, disciplinas elementales) y sus propios niveles de mejora — el pícaro tiene
uno extra en el 10.

**169 conjuros** con texto completo: listas de paladín, hechicero y embaucador arcano,
más 22 trucos cuyo daño escala solo con tu nivel. Seis razas, con los diez linajes
dracónicos y el aliento escalando por nivel. 28 dotes, 13 armaduras.

Los cálculos —CA, PG máximos, CD de conjuros, límites de preparados y conocidos, CD del
aliento, dados de Ataque Furtivo y Artes Marciales— se derivan; nada se teclea a mano
salvo que lo fuerces con las opciones de valor manual.

`npm run check` comprueba 183 de esas reglas contra las tablas de los dos libros,
incluido que nada de fuera se haya colado.

## Una app, varios personajes

En **Ficha → Personaje nuevo** eliges una clase y la app deja una hoja limpia de nivel 3,
con el array estándar (15, 14, 13, 12, 10, 8) repartido según lo que esa clase necesita.
Pide confirmación porque reemplaza lo que haya.

La app guarda un personaje a la vez. Para llevar varios, exporta cada uno desde
**Ficha → Tus datos** y vuelve a cargarlo cuando lo necesites.

## Dónde tocar para extender

```
src/data/         Las reglas como datos, sin lógica
  abilities.ts      Características y las 18 habilidades
  races.ts          Razas, sublinajes, linajes dracónicos
  armor.ts          Armaduras
  feats.ts          Dotes
  classes/
    types.ts          La forma de una clase, un recurso, una elección
    tables.ts         Espacios de conjuro: completo, medio y un tercio
    paladin.ts  sorcerer.ts  rogue.ts  monk.ts
    paladin-glory.ts  sorcerer-tashas.ts  rogue-tashas.ts  monk-tashas.ts
    index.ts          El listado y los niveles de mejora por clase
  spells/
    types.ts          La forma de un conjuro
    cantrips.ts       Trucos y su escalado de daño
    divine.ts         Lista de paladín y de juramento
    arcane.ts         Niveles 1 a 3 arcanos
    expanded.ts       Los que solo llegan por una subclase
    index.ts          Ensamblado y listas por clase
src/state/
  types.ts          La forma de un personaje
  defaults.ts       Âreen a nivel 3
  derived.ts        El motor de reglas: todo lo calculado sale de aquí
  store.ts          Estado, persistencia y descansos
  transfer.ts       Guardar y cargar la ficha
src/tabs/         Una pestaña por archivo
src/components/   Placa, talla, desplegable, iconos
```

**Añadir una clase**: un archivo nuevo en `src/data/classes/`, exportando un `CharClass`,
y añádelo al array `CLASSES` de `index.ts`. Aparece en los desplegables sola. Declara sus
recursos, lo que escala por nivel y sus elecciones como datos: el motor no necesita saber
de ella. Si tiene lista de conjuros propia, añádela a `SPELL_LISTS`.

**Añadir un conjuro**: una fila en `divine.ts` o `arcane.ts`, y su id en la lista de las
clases que puedan aprenderlo, dentro de `spells/index.ts`.

**Añadir una raza**: un objeto en `RACES`. Con `branchLabel` + `subraces` sale el segundo
desplegable; sin ellos, no aparece.

## Tus datos, y cómo no perderlos

Nada sale del dispositivo, y por eso la app se toma en serio no perder lo que hay dentro.

**Dónde vive cada cosa.** La ficha va en `localStorage` —pequeña, síncrona, fácil de
recuperar— y además se copia a IndexedDB. El diario y las imágenes van solo en IndexedDB,
porque `localStorage` se queda corto en cuanto entra una foto. Si IndexedDB no está
disponible (modo privado, por ejemplo), el diario cae a `localStorage` y la galería se
desactiva **con un aviso**, en vez de fallar en silencio.

**Contra el borrado automático.** Al arrancar, la app pide `navigator.storage.persist()`
para que el sistema no tire sus datos cuando el teléfono ande justo de espacio. Algunos
navegadores solo lo conceden tras un gesto, así que hay un botón en Ficha.

**Cuatro luces** en **Ficha → Tus datos** dicen el estado real: protección contra
borrado, almacén de imágenes, guardado de la ficha, y cuánto hace que no haces copia.
La última se pone en rojo a los catorce días.

**En Android**, la copia no sale por descarga del navegador —que en un WebView no llega
a ninguna parte— sino que la escribe el propio sistema en la carpeta Descargas.

**Copias.** *Ficha y diario* baja un JSON ligero con todo lo escrito. *Todo, con imágenes*
incluye la galería en base64, avisando si pasa de 16 MB. Al restaurar, la app dice
exactamente qué recuperó —«ficha, 3 notas, 2 sesiones, 4 imágenes»— y acepta también las
fichas sueltas del formato anterior.

Las imágenes se reducen a 1600 píxeles y se guardan en JPEG al subirlas, para que una foto
de cámara no se coma el espacio del teléfono.

## Navegadores antiguos

El WebView de Android puede ir muy por detrás. La build apunta a `chrome90`, y si aun
así falta algo esencial, `index.html` detecta qué falta y muestra una explicación con la
solución —actualizar Android System WebView desde la Play Store— en vez de una pantalla
negra. `main.tsx` no monta encima de ese mensaje.

## Reconocimiento

Reglas de D&D 5e: Manual del Jugador y Tasha's Cauldron of Everything. Arte y paleta —`#3A0F0F` escamas, `#5A1B1B` tela, `#111214`
armadura, `#2B2B2B` metal, `#C9A46A` acento— tomados de la hoja de referencia del
personaje en `references/`.
