/**
 * Almacenamiento en el propio dispositivo.
 *
 * La ficha vive en localStorage (pequeña, síncrona, fácil de recuperar) y además
 * se copia a IndexedDB. El diario y las imágenes viven solo en IndexedDB, porque
 * localStorage se queda corto en cuanto entra una foto.
 *
 * Todo degrada: si IndexedDB no está disponible, el diario cae a localStorage y
 * la galería se desactiva con un aviso, en vez de romperse en silencio.
 */

const DB_NAME = 'areen-companion'
const DB_VERSION = 1
const KV = 'kv'
const IMAGES = 'images'

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') { resolve(null); return }
    let settled = false
    const done = (v: IDBDatabase | null) => { if (!settled) { settled = true; resolve(v) } }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV)
        if (!db.objectStoreNames.contains(IMAGES)) db.createObjectStore(IMAGES, { keyPath: 'id' })
      }
      req.onsuccess = () => done(req.result)
      req.onerror = () => done(null)
      req.onblocked = () => done(null)
      // En modo privado o con el almacenamiento bloqueado, open() puede no responder.
      setTimeout(() => done(null), 4000)
    } catch {
      done(null)
    }
  })
  return dbPromise
}

function tx<T>(store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T | null> {
  return openDB().then((db) => {
    if (!db) return null
    return new Promise<T | null>((resolve) => {
      try {
        const t = db.transaction(store, mode)
        const req = run(t.objectStore(store))
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => resolve(null)
        t.onabort = () => resolve(null)
      } catch {
        resolve(null)
      }
    })
  })
}

export const dbAvailable = () => openDB().then((db) => !!db)

export const kvGet = <T,>(key: string) => tx<T>(KV, 'readonly', (s) => s.get(key))
export const kvSet = (key: string, value: unknown) => tx(KV, 'readwrite', (s) => s.put(value, key))

export interface StoredImage {
  id: string
  blob: Blob
  caption: string
  addedAt: string
  width: number
  height: number
  size: number
}

export const imgPut = (image: StoredImage) => tx(IMAGES, 'readwrite', (s) => s.put(image))
export const imgDelete = (id: string) => tx(IMAGES, 'readwrite', (s) => s.delete(id))
export const imgAll = () => tx<StoredImage[]>(IMAGES, 'readonly', (s) => s.getAll()).then((r) => r ?? [])

/**
 * Pide al navegador que no borre estos datos para hacer sitio.
 * Sin esto, el sistema puede tirar la ficha cuando ande justo de espacio.
 */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted?.()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export interface StorageHealth {
  /** El navegador promete no borrar estos datos por falta de espacio. */
  persistente: boolean
  indexedDB: boolean
  localStorage: boolean
  usadoMB: number | null
  disponibleMB: number | null
  /**
   * iPhone o iPad usándose desde Safari, sin añadir a la pantalla de inicio.
   * Safari borra el almacenamiento de una web tras siete días sin abrirla;
   * las apps de la pantalla de inicio están exentas de esa regla.
   */
  iosSinInstalar: boolean
}

export async function storageHealth(): Promise<StorageHealth> {
  let ls = false
  try {
    localStorage.setItem('__probe', '1')
    ls = localStorage.getItem('__probe') === '1'
    localStorage.removeItem('__probe')
  } catch { ls = false }

  let usadoMB: number | null = null
  let disponibleMB: number | null = null
  try {
    const est = await navigator.storage?.estimate?.()
    if (est?.usage != null) usadoMB = est.usage / 1024 / 1024
    if (est?.quota != null) disponibleMB = est.quota / 1024 / 1024
  } catch { /* el navegador no lo expone */ }

  const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const instalada = (navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true

  return {
    persistente: (await navigator.storage?.persisted?.().catch(() => false)) ?? false,
    indexedDB: await dbAvailable(),
    localStorage: ls,
    usadoMB,
    disponibleMB,
    iosSinInstalar: esIOS && !instalada,
  }
}
