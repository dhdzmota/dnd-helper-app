/**
 * Procesado de imágenes para el retrato del personaje.
 *
 * Una foto de cámara son doce megapíxeles y varios megas: guardarla tal cual
 * revienta la cuota del navegador y se lleva por delante la ficha entera. Aquí
 * se reduce antes de tocar el almacenamiento.
 *
 * Todo lleva límite de tiempo y camino alternativo: en los WebView de móvil,
 * `canvas.toBlob` puede no llamar nunca a su callback y dejar la app colgada.
 */

/** Nunca dejar que una promesa del navegador cuelgue la interfaz para siempre. */
function conLimite<T>(promesa: Promise<T>, ms: number, queHacia: string): Promise<T> {
  return new Promise((res, rej) => {
    const reloj = setTimeout(() => rej(new Error(`El teléfono tardó demasiado ${queHacia}`)), ms)
    promesa.then((v) => { clearTimeout(reloj); res(v) }, (e) => { clearTimeout(reloj); rej(e) })
  })
}

interface Dibujable {
  fuente: CanvasImageSource
  width: number
  height: number
  soltar: () => void
}

/**
 * Abre la imagen. createImageBitmap es lo rápido, pero no todos los WebView lo
 * traen ni saben con todos los formatos; el elemento <img> llega donde aquél no.
 */
async function abrirImagen(file: File): Promise<Dibujable> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await conLimite(
        // 'from-image' respeta la orientación EXIF: si no, las fotos verticales
        // del teléfono se guardarían tumbadas.
        createImageBitmap(file, { imageOrientation: 'from-image' }),
        15000, 'en abrir la imagen',
      )
      return { fuente: bitmap, width: bitmap.width, height: bitmap.height, soltar: () => bitmap.close?.() }
    } catch {
      // Formato que no entiende, o memoria justa: se prueba con <img>.
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await conLimite(new Promise<HTMLImageElement>((res, rej) => {
      const el = new Image()
      el.onload = () => res(el)
      el.onerror = () => rej(new Error('El teléfono no supo abrir esa imagen'))
      el.src = url
    }), 15000, 'en abrir la imagen')
    if (!img.naturalWidth) throw new Error('El teléfono no supo abrir esa imagen')
    return { fuente: img, width: img.naturalWidth, height: img.naturalHeight, soltar: () => URL.revokeObjectURL(url) }
  } catch (e) {
    URL.revokeObjectURL(url)
    throw e
  }
}

/**
 * Pasa el lienzo a JPEG. toBlob es lo correcto, pero en algunos WebView de móvil
 * no llama nunca de vuelta y deja la app colgada; por eso lleva límite de tiempo
 * y un camino alternativo por toDataURL, que es síncrono.
 */
async function lienzoAJpeg(canvas: HTMLCanvasElement, calidad = 0.82): Promise<Blob> {
  try {
    const blob = await conLimite(new Promise<Blob | null>((res, rej) => {
      try { canvas.toBlob(res, 'image/jpeg', calidad) } catch (e) { rej(e) }
    }), 8000, 'en comprimir la imagen')
    if (blob && blob.size > 0) return blob
  } catch {
    // Sigue por el camino alternativo.
  }

  const dataUrl = canvas.toDataURL('image/jpeg', calidad)
  if (!dataUrl.startsWith('data:image/jpeg')) throw new Error('El teléfono no pudo comprimir la imagen')
  const coma = dataUrl.indexOf(',')
  const binario = atob(dataUrl.slice(coma + 1))
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return new Blob([bytes], { type: 'image/jpeg' })
}

/** Dibuja la imagen ya abierta a `MAX` píxeles por el lado mayor y la comprime. */
async function escalarYComprimir(
  img: Dibujable, MAX: number, calidad: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const escala = Math.min(1, MAX / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * escala))
  const h = Math.max(1, Math.round(img.height * escala))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const pincel = canvas.getContext('2d')
  if (!pincel) throw new Error('Este navegador no deja procesar imágenes')
  pincel.drawImage(img.fuente, 0, 0, w, h)
  const blob = await lienzoAJpeg(canvas, calidad)
  // Soltar el lienzo cuanto antes: en un móvil la memoria va justa.
  canvas.width = 0
  canvas.height = 0
  return { blob, width: w, height: h }
}

/** Reduce la imagen a `MAX` píxeles por el lado mayor y la devuelve en JPEG. */
export async function prepararImagen(
  file: File, MAX = 1600, calidad = 0.82,
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await abrirImagen(file)
  try {
    return await escalarYComprimir(img, MAX, calidad)
  } finally {
    img.soltar()
  }
}

const aDataUrl = (blob: Blob) =>
  new Promise<string>((res, rej) => {
    const lector = new FileReader()
    lector.onload = () => res(String(lector.result))
    lector.onerror = () => rej(new Error('No se pudo leer la imagen reducida'))
    lector.readAsDataURL(blob)
  })

/**
 * El retrato va dentro de la ficha, en localStorage, que ronda los 5 MB en total.
 * Se reduce hasta que quepa con holgura, bajando primero la calidad y luego el
 * tamaño: más vale un retrato algo más blando que una ficha que no se guarda.
 */
export async function prepararRetrato(file: File): Promise<string> {
  const TOPE_KB = 250
  const intentos: { lado: number; calidad: number }[] = [
    { lado: 900, calidad: 0.82 },
    { lado: 900, calidad: 0.68 },
    { lado: 700, calidad: 0.62 },
    { lado: 500, calidad: 0.55 },
  ]

  // La foto se abre una sola vez: decodificar doce megapíxeles cuatro veces
  // seguidas tarda demasiado en un teléfono.
  const img = await abrirImagen(file)
  try {
    let ultimo = ''
    for (const { lado, calidad } of intentos) {
      const { blob } = await escalarYComprimir(img, lado, calidad)
      ultimo = await aDataUrl(blob)
      if (ultimo.length / 1024 <= TOPE_KB) return ultimo
    }
    return ultimo
  } finally {
    img.soltar()
  }
}
