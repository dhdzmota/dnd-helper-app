import { imgAll, imgPut, type StoredImage } from './db'
import type { JournalData } from './journal'
import type { Character } from './types'

/** El visor de Artifacts expone capacidades tras claude.use(); en otros sitios no existe. */
interface ClaudeBridge {
  use?: (name: string) => Promise<{ save?: (r: { filename: string; data: string }) => Promise<unknown> } | null>
}
const bridge = () => (window as unknown as { claude?: ClaudeBridge }).claude

/** Dentro de la app de Android, guardar un archivo pasa por el sistema. */
interface AndroidBridge {
  guardarEnDescargas?: (nombre: string, contenidoBase64: string, mime: string) => boolean
  version?: () => string
}
const android = () => (window as unknown as { AndroidFicha?: AndroidBridge }).AndroidFicha

/** Nombre de la versión cuando la app corre dentro del contenedor de Android. */
export function versionAndroid(): string | null {
  try { return android()?.version?.() || null } catch { return null }
}

/** iPhone y iPad, incluido el iPad que se hace pasar por Mac. */
export const esIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** La app abierta desde el ícono de la pantalla de inicio, sin barra de navegador. */
export const enPantallaCompleta = () =>
  (navigator as unknown as { standalone?: boolean }).standalone === true ||
  window.matchMedia?.('(display-mode: standalone)').matches === true

/**
 * En iOS una descarga con `a.download` no hace absolutamente nada cuando la app
 * corre desde la pantalla de inicio. La vía que sí funciona es la hoja de
 * compartir del sistema: desde ahí se guarda en Archivos o se manda por correo.
 */
async function compartirArchivo(nombre: string, datos: string): Promise<SaveOutcome | null> {
  try {
    const archivo = new File([datos], nombre, { type: 'application/json' })
    if (!navigator.canShare?.({ files: [archivo] })) return null
    await navigator.share({ files: [archivo], title: nombre })
    marcarCopia()
    return { ok: true, message: `Copia compartida como ${nombre}. Guárdala en Archivos o mándatela por correo.` }
  } catch (err) {
    // Cancelar la hoja de compartir no es un error que haya que gritar.
    if ((err as { name?: string })?.name === 'AbortError') {
      return { ok: false, message: 'Cancelaste el compartir. No se guardó nada.' }
    }
    return null
  }
}

const textoABase64 = (texto: string) => {
  const bytes = new TextEncoder().encode(texto)
  let binario = ''
  for (const b of bytes) binario += String.fromCharCode(b)
  return btoa(binario)
}

const LAST_BACKUP = 'areen-last-backup'

export interface Backup {
  app: 'areen-companion'
  version: 1
  exportedAt: string
  character: Character
  journal: JournalData
  /** Presente solo en la copia completa. */
  images?: { id: string; caption: string; addedAt: string; width: number; height: number; dataUrl: string }[]
}

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '').toLowerCase() || 'ficha'

export const fileNameFor = (c: Character, conImagenes: boolean) =>
  `${slug(c.name)}-${new Date().toISOString().slice(0, 10)}${conImagenes ? '-completa' : ''}.json`

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = () => rej(r.error)
    r.readAsDataURL(b)
  })

async function dataUrlToBlob(url: string): Promise<Blob | null> {
  try { return await (await fetch(url)).blob() } catch { return null }
}

export async function buildBackup(character: Character, journal: JournalData, conImagenes: boolean): Promise<Backup> {
  const backup: Backup = {
    app: 'areen-companion',
    version: 1,
    exportedAt: new Date().toISOString(),
    character,
    journal,
  }
  if (conImagenes) {
    const imgs = await imgAll()
    backup.images = await Promise.all(imgs.map(async (i) => ({
      id: i.id, caption: i.caption, addedAt: i.addedAt,
      width: i.width, height: i.height,
      dataUrl: await blobToDataUrl(i.blob),
    })))
  }
  return backup
}

export type SaveOutcome = { ok: boolean; message: string }

const LIMITE_MB = 16

/**
 * Guarda la copia como archivo. Dentro del visor de Artifacts la descarga
 * directa está bloqueada, así que se pide al anfitrión; fuera, un enlace basta.
 */
export async function saveBackup(backup: Backup, filename: string): Promise<SaveOutcome> {
  const data = JSON.stringify(backup)
  const mb = new Blob([data]).size / 1024 / 1024

  if (mb > LIMITE_MB) {
    return {
      ok: false,
      message: `La copia pesa ${mb.toFixed(1)} MB y el máximo son ${LIMITE_MB} MB. Guarda la copia sin imágenes, o borra alguna de la galería.`,
    }
  }

  // En la app de Android, una descarga por blob no llega a ninguna parte:
  // hay que pedirle al sistema que escriba el archivo.
  const puente = android()
  if (puente?.guardarEnDescargas) {
    try {
      const ok = puente.guardarEnDescargas(filename, textoABase64(data), 'application/json')
      if (ok) {
        marcarCopia()
        return { ok: true, message: `Guardado en Descargas: ${filename} (${mb.toFixed(1)} MB).` }
      }
      return { ok: false, message: 'Android no dejó escribir en Descargas. Copia el texto de abajo y guárdalo tú.' }
    } catch {
      return { ok: false, message: 'No se pudo guardar el archivo. Copia el texto de abajo y guárdalo tú.' }
    }
  }

  try {
    const downloads = await bridge()?.use?.('downloads')
    if (downloads?.save) {
      await downloads.save({ filename, data })
      marcarCopia()
      return { ok: true, message: `Copia guardada como ${filename} (${mb.toFixed(1)} MB).` }
    }
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (code === 'declined') return { ok: false, message: 'Cancelaste la descarga. No se guardó nada.' }
    if (code === 'rate_limited') return { ok: false, message: 'Ya hay una descarga esperando respuesta. Inténtalo en un momento.' }
    if (code === 'too_large') return { ok: false, message: `La copia pesa ${mb.toFixed(1)} MB y no cabe. Guárdala sin imágenes.` }
    return { ok: false, message: 'No se pudo guardar el archivo. Copia el texto de abajo y guárdalo tú.' }
  }

  // En iPhone la hoja de compartir va antes que la descarga, porque la descarga
  // desde la pantalla de inicio no llega a ninguna parte.
  if (esIOS()) {
    const compartido = await compartirArchivo(filename, data)
    if (compartido) return compartido
  }

  try {
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
    marcarCopia()
    return { ok: true, message: `Copia descargada como ${filename} (${mb.toFixed(1)} MB).` }
  } catch {
    const compartido = await compartirArchivo(filename, data)
    if (compartido) return compartido
    return { ok: false, message: 'Este navegador no deja descargar. Copia el texto de abajo y guárdalo tú.' }
  }
}

export interface RestoreResult {
  ok: boolean
  message: string
  character?: Character
  journal?: JournalData
}

/** Acepta una copia nueva, y también las fichas sueltas de versiones anteriores. */
export async function restoreBackup(text: string): Promise<RestoreResult> {
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch {
    return { ok: false, message: 'Ese texto no es una copia válida. Pega el contenido completo del archivo.' }
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, message: 'Ese archivo no contiene una ficha.' }
  }

  const b = parsed as Partial<Backup> & Partial<Character>

  // Copia completa
  if (b.app === 'areen-companion' && b.character) {
    let restauradas = 0
    if (b.images?.length) {
      for (const i of b.images) {
        const blob = await dataUrlToBlob(i.dataUrl)
        if (!blob) continue
        const rec: StoredImage = {
          id: i.id, blob, caption: i.caption, addedAt: i.addedAt,
          width: i.width, height: i.height, size: blob.size,
        }
        if ((await imgPut(rec)) !== null) restauradas++
      }
    }
    const partes = ['ficha']
    if (b.journal?.notes?.length) partes.push(`${b.journal.notes.length} notas`)
    if (b.journal?.log?.length) partes.push(`${b.journal.log.length} sesiones`)
    if (restauradas) partes.push(`${restauradas} imágenes`)
    return {
      ok: true,
      message: `Restaurado: ${partes.join(', ')}.${b.images?.length && restauradas < b.images.length ? ' Algunas imágenes no cupieron.' : ''}`,
      character: b.character,
      journal: b.journal,
    }
  }

  // Ficha suelta, del formato anterior
  if (typeof b.name === 'string' && typeof b.classId === 'string') {
    return { ok: true, message: 'Ficha cargada.', character: parsed as Character }
  }

  return { ok: false, message: 'Ese archivo no contiene una ficha reconocible.' }
}

export const marcarCopia = () => {
  try { localStorage.setItem(LAST_BACKUP, new Date().toISOString()) } catch { /* sin sitio */ }
}

export function ultimaCopia(): { fecha: Date | null; dias: number | null } {
  try {
    const raw = localStorage.getItem(LAST_BACKUP)
    if (!raw) return { fecha: null, dias: null }
    const fecha = new Date(raw)
    return { fecha, dias: Math.floor((Date.now() - fecha.getTime()) / 86_400_000) }
  } catch {
    return { fecha: null, dias: null }
  }
}

export const backupToText = (b: Backup) => JSON.stringify(b, null, 2)
