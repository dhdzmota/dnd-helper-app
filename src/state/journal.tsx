import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { imgAll, imgDelete, imgPut, kvGet, kvSet, type StoredImage } from './db'

export interface Note {
  id: string
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

export interface LogEntry {
  id: string
  /** Fecha de la sesión, en formato AAAA-MM-DD. */
  date: string
  title: string
  body: string
}

export interface Photo {
  id: string
  caption: string
  addedAt: string
  width: number
  height: number
  size: number
  /** URL temporal creada a partir del blob guardado. */
  url: string
}

/** Guardar una foto sale bien, o sale mal por un motivo que se puede contar. */
export type ResultadoFoto = { ok: true; id: string } | { ok: false; motivo: string }

export interface JournalData {
  version: 1
  notes: Note[]
  log: LogEntry[]
}

const KEY = 'areen-journal'
const EMPTY: JournalData = { version: 1, notes: [], log: [] }

export const hoy = () => new Date().toISOString().slice(0, 10)
const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/** Fecha legible: "12 de marzo de 2026". */
export function fechaLarga(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${d} de ${meses[m - 1]} de ${y}`
}

export interface JournalStore {
  cargado: boolean
  /** Las fotos llegan de IndexedDB, más tarde que el resto. */
  fotosCargadas: boolean
  notes: Note[]
  log: LogEntry[]
  photos: Photo[]
  /** Null mientras se comprueba; false si la galería no puede guardar nada. */
  galeriaDisponible: boolean | null
  addNote: () => string
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void
  addEntry: (date?: string) => string
  updateEntry: (id: string, patch: Partial<LogEntry>) => void
  deleteEntry: (id: string) => void
  addPhoto: (file: File) => Promise<ResultadoFoto>
  updatePhoto: (id: string, caption: string) => void
  deletePhoto: (id: string) => void
  replaceJournal: (data: JournalData) => void
  exportData: () => JournalData
}

const Ctx = createContext<JournalStore | null>(null)

/** Lee de IndexedDB y, si ahí no hay nada, del respaldo en localStorage. */
async function loadJournal(): Promise<JournalData> {
  const fromDb = await kvGet<JournalData>(KEY)
  if (fromDb?.version === 1) return fromDb
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as JournalData
      if (parsed?.version === 1) return parsed
    }
  } catch { /* respaldo ilegible */ }
  return EMPTY
}

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
async function lienzoAJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  try {
    const blob = await conLimite(new Promise<Blob | null>((res, rej) => {
      try { canvas.toBlob(res, 'image/jpeg', 0.82) } catch (e) { rej(e) }
    }), 8000, 'en comprimir la imagen')
    if (blob && blob.size > 0) return blob
  } catch {
    // Sigue por el camino alternativo.
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
  if (!dataUrl.startsWith('data:image/jpeg')) throw new Error('El teléfono no pudo comprimir la imagen')
  const coma = dataUrl.indexOf(',')
  const binario = atob(dataUrl.slice(coma + 1))
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return new Blob([bytes], { type: 'image/jpeg' })
}

/** Reduce la foto antes de guardarla: una de cámara pesa demasiado tal cual. */
async function prepararImagen(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const MAX = 1600
  const img = await abrirImagen(file)
  try {
    const escala = Math.min(1, MAX / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * escala))
    const h = Math.max(1, Math.round(img.height * escala))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const pincel = canvas.getContext('2d')
    if (!pincel) throw new Error('Este navegador no deja procesar imágenes')
    pincel.drawImage(img.fuente, 0, 0, w, h)
    const blob = await lienzoAJpeg(canvas)
    // Soltar el lienzo cuanto antes: en un móvil la memoria va justa.
    canvas.width = 0
    canvas.height = 0
    return { blob, width: w, height: h }
  } finally {
    img.soltar()
  }
}

export function JournalProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<JournalData>(EMPTY)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [cargado, setCargado] = useState(false)
  const [galeriaDisponible, setGaleriaDisponible] = useState<boolean | null>(null)
  const [fotosCargadas, setFotosCargadas] = useState(false)
  const urls = useRef<string[]>([])

  useEffect(() => {
    let vivo = true
    loadJournal().then((d) => { if (vivo) { setData(d); setCargado(true) } })
    imgAll()
      .then((imgs) => {
        if (!vivo) return
        setGaleriaDisponible(true)
        setPhotos(ordenarFotos(imgs, urls))
      })
      .catch(() => vivo && setGaleriaDisponible(false))
      .finally(() => vivo && setFotosCargadas(true))
    return () => {
      vivo = false
      urls.current.forEach((u) => URL.revokeObjectURL(u))
      urls.current = []
    }
  }, [])

  // Guardar en los dos sitios: IndexedDB manda, localStorage es la red de seguridad.
  useEffect(() => {
    if (!cargado) return
    const t = setTimeout(() => {
      kvSet(KEY, data)
      try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* sin sitio: queda IndexedDB */ }
    }, 200)
    return () => clearTimeout(t)
  }, [data, cargado])

  const addNote = useCallback(() => {
    const nuevo: Note = { id: id(), title: '', body: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setData((d) => ({ ...d, notes: [nuevo, ...d.notes] }))
    return nuevo.id
  }, [])

  const updateNote = useCallback((noteId: string, patch: Partial<Note>) => {
    setData((d) => ({
      ...d,
      notes: d.notes.map((n) => (n.id === noteId ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)),
    }))
  }, [])

  const deleteNote = useCallback((noteId: string) => {
    setData((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== noteId) }))
  }, [])

  const addEntry = useCallback((date = hoy()) => {
    const nueva: LogEntry = { id: id(), date, title: '', body: '' }
    setData((d) => ({ ...d, log: [nueva, ...d.log] }))
    return nueva.id
  }, [])

  const updateEntry = useCallback((entryId: string, patch: Partial<LogEntry>) => {
    setData((d) => ({ ...d, log: d.log.map((e) => (e.id === entryId ? { ...e, ...patch } : e)) }))
  }, [])

  const deleteEntry = useCallback((entryId: string) => {
    setData((d) => ({ ...d, log: d.log.filter((e) => e.id !== entryId) }))
  }, [])

  const addPhoto = useCallback(async (file: File): Promise<ResultadoFoto> => {
    let prep: { blob: Blob; width: number; height: number }
    try {
      prep = await prepararImagen(file)
    } catch (e) {
      return { ok: false, motivo: (e as Error)?.message ?? 'No se pudo leer la imagen' }
    }

    const registro: StoredImage = {
      id: id(),
      blob: prep.blob,
      caption: '',
      addedAt: new Date().toISOString(),
      width: prep.width,
      height: prep.height,
      size: prep.blob.size,
    }

    let guardado: unknown
    try {
      guardado = await conLimite(imgPut(registro), 10000, 'en guardar la imagen')
    } catch (e) {
      return { ok: false, motivo: (e as Error)?.message ?? 'No se pudo guardar la imagen' }
    }
    if (guardado === null) {
      setGaleriaDisponible(false)
      return { ok: false, motivo: 'Este navegador no deja guardar imágenes' }
    }

    const url = URL.createObjectURL(registro.blob)
    urls.current.push(url)
    setPhotos((p) => [{ ...registro, url }, ...p])
    return { ok: true, id: registro.id }
  }, [])

  const updatePhoto = useCallback((photoId: string, caption: string) => {
    setPhotos((p) => p.map((f) => (f.id === photoId ? { ...f, caption } : f)))
    imgAll().then((todas) => {
      const actual = todas.find((i) => i.id === photoId)
      if (actual) imgPut({ ...actual, caption })
    })
  }, [])

  const deletePhoto = useCallback((photoId: string) => {
    imgDelete(photoId)
    setPhotos((p) => p.filter((f) => f.id !== photoId))
  }, [])

  const replaceJournal = useCallback((next: JournalData) => {
    setData({ version: 1, notes: next.notes ?? [], log: next.log ?? [] })
  }, [])

  const exportData = useCallback(() => data, [data])

  const value = useMemo<JournalStore>(() => ({
    cargado, fotosCargadas, notes: data.notes, log: data.log, photos, galeriaDisponible,
    addNote, updateNote, deleteNote,
    addEntry, updateEntry, deleteEntry,
    addPhoto, updatePhoto, deletePhoto,
    replaceJournal, exportData,
  }), [cargado, fotosCargadas, data, photos, galeriaDisponible, addNote, updateNote, deleteNote,
    addEntry, updateEntry, deleteEntry, addPhoto, updatePhoto, deletePhoto, replaceJournal, exportData])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

function ordenarFotos(imgs: StoredImage[], urls: React.MutableRefObject<string[]>): Photo[] {
  return [...imgs]
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .map((i) => {
      const url = URL.createObjectURL(i.blob)
      urls.current.push(url)
      return { id: i.id, caption: i.caption, addedAt: i.addedAt, width: i.width, height: i.height, size: i.size, url }
    })
}

export function useJournal(): JournalStore {
  const v = useContext(Ctx)
  if (!v) throw new Error('useJournal debe usarse dentro de JournalProvider')
  return v
}
