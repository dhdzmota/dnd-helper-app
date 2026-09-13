import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { kvGet, kvSet } from './db'

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
  notes: Note[]
  log: LogEntry[]
  addNote: () => string
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void
  addEntry: (date?: string) => string
  updateEntry: (id: string, patch: Partial<LogEntry>) => void
  deleteEntry: (id: string) => void
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

export function JournalProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<JournalData>(EMPTY)
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    let vivo = true
    loadJournal().then((d) => { if (vivo) { setData(d); setCargado(true) } })
    return () => { vivo = false }
  }, [])

  // Guardar en los dos sitios: IndexedDB manda, localStorage es la red de seguridad.
  useEffect(() => {
    if (!cargado) return
    const t = setTimeout(() => {
      void kvSet(KEY, data)
      try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* sin sitio: queda IndexedDB */ }
    }, 200)
    return () => clearTimeout(t)
  }, [data, cargado])

  // Lo mismo que en la ficha: si el teléfono cierra la app dentro del rebote de
  // 200 ms, la última nota escrita se perdería. IndexedDB no da tiempo aquí, así
  // que se vuelca a localStorage, que es de donde se rescata al abrir.
  useEffect(() => {
    if (!cargado) return
    const volcar = () => {
      try { localStorage.setItem(KEY, JSON.stringify(data)) } catch { /* sin sitio */ }
    }
    const alOcultarse = () => { if (document.visibilityState === 'hidden') volcar() }
    document.addEventListener('visibilitychange', alOcultarse)
    window.addEventListener('pagehide', volcar)
    return () => {
      document.removeEventListener('visibilitychange', alOcultarse)
      window.removeEventListener('pagehide', volcar)
    }
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

  const replaceJournal = useCallback((next: JournalData) => {
    setData({ version: 1, notes: next.notes ?? [], log: next.log ?? [] })
  }, [])

  const exportData = useCallback(() => data, [data])

  const value = useMemo<JournalStore>(() => ({
    cargado, notes: data.notes, log: data.log,
    addNote, updateNote, deleteNote,
    addEntry, updateEntry, deleteEntry,
    replaceJournal, exportData,
  }), [cargado, data, addNote, updateNote, deleteNote,
    addEntry, updateEntry, deleteEntry, replaceJournal, exportData])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useJournal(): JournalStore {
  const v = useContext(Ctx)
  if (!v) throw new Error('useJournal debe usarse dentro de JournalProvider')
  return v
}
