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
  addPhoto: (file: File) => Promise<string | null>
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

/** Reduce la foto antes de guardarla: una de cámara pesa demasiado tal cual. */
async function prepararImagen(file: File): Promise<{ blob: Blob; width: number; height: number } | null> {
  const MAX = 1600
  try {
    const bitmap = await createImageBitmap(file)
    const escala = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * escala)
    const h = Math.round(bitmap.height * escala)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctxCanvas = canvas.getContext('2d')
    if (!ctxCanvas) return null
    ctxCanvas.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.82))
    return blob ? { blob, width: w, height: h } : null
  } catch {
    return null
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

  const addPhoto = useCallback(async (file: File) => {
    const prep = await prepararImagen(file)
    if (!prep) return null
    const registro: StoredImage = {
      id: id(),
      blob: prep.blob,
      caption: '',
      addedAt: new Date().toISOString(),
      width: prep.width,
      height: prep.height,
      size: prep.blob.size,
    }
    const guardado = await imgPut(registro)
    if (guardado === null) { setGaleriaDisponible(false); return null }
    const url = URL.createObjectURL(registro.blob)
    urls.current.push(url)
    setPhotos((p) => [{ ...registro, url }, ...p])
    return registro.id
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
