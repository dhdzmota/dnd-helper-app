import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { SkillKey } from '../data/abilities'
import { CLASS_BY_ID, asiLevelsFor } from '../data/classes'
import { RACE_BY_ID } from '../data/races'
import { SIN_MONEDAS, contenidoDePaquete, equipoInicial, lineaDeCatalogo, type Bolsa } from '../data/gear'
import { kvGet, kvSet } from './db'
import { AREEN, blankCharacter } from './defaults'
import { derive, type Derived } from './derived'
import type { Character, InvItem } from './types'

const STORAGE_KEY = 'areen-velthar-companion:v1'

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

function load(): Character {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return AREEN
    const parsed = JSON.parse(raw) as Partial<Character> & { layOnHandsUsed?: number }
    if (parsed.version !== 1) return AREEN
    // Merge so fields added in later builds get their defaults.
    const merged: Character = {
      ...AREEN, ...parsed,
      scores: { ...AREEN.scores, ...parsed.scores },
      choices: parsed.choices ?? {},
      usesSpent: { ...parsed.usesSpent },
      // Una ficha guardada antes de que existiera el inventario empieza con la
      // mochila vacía y sin dinero. Heredar el equipo de Âreen le pondría una
      // cota de malla al monje de la mesa; para llenarla de golpe hay un botón
      // de «equipo inicial» en la pestaña.
      coins: { ...SIN_MONEDAS, ...parsed.coins },
      items: parsed.items ?? [],
      turnOrder: parsed.turnOrder ?? [],
    }
    // La reserva de Imposición de Manos pasó a ser un recurso genérico.
    if (parsed.layOnHandsUsed) {
      merged.usesSpent['lay-on-hands'] = merged.usesSpent['lay-on-hands'] ?? parsed.layOnHandsUsed
      delete (merged as Partial<Character> & { layOnHandsUsed?: number }).layOnHandsUsed
    }
    // Una ficha guardada con otra clase o nivel puede traer los puntos de golpe
    // por encima del nuevo máximo.
    merged.hpCurrent = clamp(merged.hpCurrent, 0, derive(merged).maxHp)
    return merged
  } catch {
    return AREEN
  }
}


export interface Store {
  c: Character
  d: Derived
  set: (patch: Partial<Character>) => void
  setRace: (raceId: string) => void
  setClass: (classId: string) => void
  setLevel: (level: number) => void
  applyHp: (delta: number) => void
  setTempHp: (n: number) => void
  spendSlot: (level: number) => void
  restoreSlot: (level: number) => void
  spendUse: (id: string, n?: number) => void
  restoreUse: (id: string, n?: number) => void
  setUse: (id: string, n: number) => void
  toggleHitDie: (index: number) => void
  setDeathSave: (kind: 'success' | 'failure', n: number) => void
  togglePrepared: (id: string) => void
  toggleSkill: (key: string) => void
  toggleFeat: (id: string) => void
  toggleCantrip: (id: string) => void
  toggleExpertise: (key: string) => void
  toggleChoice: (groupId: string, optionId: string) => void
  toggleCondition: (name: string) => void
  addItem: (item: InvItem) => void
  addFromCatalog: (gearId: string, qty?: number) => void
  addPack: (packId: string) => void
  addStartingGear: () => void
  updateItem: (id: string, patch: Partial<InvItem>) => void
  removeItem: (id: string) => void
  setCoins: (patch: Partial<Bolsa>) => void
  shortRest: () => void
  longRest: () => void
  /** True si el navegador se quedó sin sitio y la ficha no se está guardando. */
  sinSitio: boolean
  reset: () => void
  newCharacter: (classId: string) => void
  replace: (c: Character) => void
  lastRest: string | null
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [c, setC] = useState<Character>(load)

  // Si localStorage estaba vacío pero IndexedDB guarda una ficha, se rescata.
  useEffect(() => {
    let vivo = true
    if (localStorage.getItem(STORAGE_KEY)) return
    kvGet<Character>(STORAGE_KEY).then((guardada) => {
      if (vivo && guardada?.version === 1) setC({
        ...AREEN, ...guardada,
        coins: { ...SIN_MONEDAS, ...guardada.coins },
        items: guardada.items ?? [],
        turnOrder: guardada.turnOrder ?? [],
      })
    })
    return () => { vivo = false }
  }, [])
  const [lastRest, setLastRest] = useState<string | null>(null)

  const [sinSitio, setSinSitio] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
        setSinSitio(false)
      } catch {
        // Quedarse sin cuota lanzaba una excepción sin capturar y la ficha
        // dejaba de guardarse en silencio. Ahora se avisa y se sigue en pie.
        setSinSitio(true)
      }
      // Segunda copia en IndexedDB, que aguanta mucho más que localStorage.
      void kvSet(STORAGE_KEY, c)
    }, 150)
    return () => clearTimeout(t)
  }, [c])

  /**
   * Guardar tiene 150 ms de rebote para no escribir en cada pulsación. Si el
   * teléfono se lleva la app por delante dentro de esa ventana —Android mata
   * apps en segundo plano sin avisar— ese último cambio se perdería. Al ocultarse
   * la página se vuelca lo pendiente a mano, que es la única escritura que el
   * navegador garantiza en ese momento.
   */
  useEffect(() => {
    const volcar = () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)) } catch { /* sin sitio */ }
    }
    const alOcultarse = () => { if (document.visibilityState === 'hidden') volcar() }
    document.addEventListener('visibilitychange', alOcultarse)
    window.addEventListener('pagehide', volcar)
    return () => {
      document.removeEventListener('visibilitychange', alOcultarse)
      window.removeEventListener('pagehide', volcar)
    }
  }, [c])

  const d = useMemo(() => derive(c), [c])

  /**
   * Toda edición pasa por aquí. Si el cambio sube el máximo de puntos de golpe
   * —subir de nivel, subir Constitución, tomar la dote Duro—, los actuales suben
   * igual, que es como funciona en la mesa. Si lo baja, se recortan.
   */
  const commit = useCallback((updater: (p: Character) => Character) => {
    setC((prev) => {
      const next = updater(prev)
      const antes = derive(prev).maxHp
      const ahora = derive(next).maxHp
      if (ahora === antes) return next
      const ganado = Math.max(0, ahora - antes)
      return { ...next, hpCurrent: clamp(next.hpCurrent + ganado, 0, ahora) }
    })
  }, [])

  const set = useCallback((patch: Partial<Character>) => commit((p) => ({ ...p, ...patch })), [commit])

  const setRace = useCallback((raceId: string) => {
    const race = RACE_BY_ID[raceId]
    const first = race?.ancestries?.[0]?.id ?? race?.subraces?.[0]?.id ?? null
    commit((p) => ({ ...p, raceId, branchId: first }))
  }, [commit])

  const setClass = useCallback((classId: string) => {
    const cls = CLASS_BY_ID[classId]
    setC((p) => ({
      ...p,
      classId,
      subclassId: cls?.subclasses[0]?.id ?? null,
      fightingStyleId: null,
      preparedSpellIds: [],
      cantripIds: [],
      skillProfs: [],
      expertise: [],
      choices: {},
      usesSpent: {},
      slotsUsed: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      hitDiceSpent: 0,
    }))
  }, [])

  const setLevel = useCallback((level: number) => {
    commit((p) => {
      const lvl = clamp(level, 1, 20)
      return {
        ...p,
        level: lvl,
        hitDiceSpent: Math.min(p.hitDiceSpent, lvl),
        featIds: p.featIds.slice(0, asiLevelsFor(p.classId).filter((l) => l <= lvl).length),
      }
    })
  }, [commit])

  const applyHp = useCallback((delta: number) => {
    setC((p) => {
      const max = derive(p).maxHp
      if (delta < 0) {
        // Damage eats temporary hit points first.
        const absorbed = Math.min(p.hpTemp, -delta)
        const next = { ...p, hpTemp: p.hpTemp - absorbed, hpCurrent: clamp(p.hpCurrent + delta + absorbed, 0, max) }
        // Any healing later cancels dying; taking damage at 0 does not reset the tally.
        return next
      }
      const hpCurrent = clamp(p.hpCurrent + delta, 0, max)
      const revived = p.hpCurrent === 0 && hpCurrent > 0
      return revived ? { ...p, hpCurrent, deathSuccesses: 0, deathFailures: 0 } : { ...p, hpCurrent }
    })
  }, [])

  const setTempHp = useCallback((n: number) => setC((p) => ({ ...p, hpTemp: Math.max(0, n) })), [])

  const spendSlot = useCallback((level: number) => {
    setC((p) => {
      const max = derive(p).casting.slotsMax[level - 1] ?? 0
      const used = [...p.slotsUsed]
      used[level - 1] = Math.min(max, (used[level - 1] ?? 0) + 1)
      return { ...p, slotsUsed: used }
    })
  }, [])

  const restoreSlot = useCallback((level: number) => {
    setC((p) => {
      const used = [...p.slotsUsed]
      used[level - 1] = Math.max(0, (used[level - 1] ?? 0) - 1)
      return { ...p, slotsUsed: used }
    })
  }, [])

  const setUse = useCallback((id: string, n: number) => {
    setC((p) => {
      const max = derive(p).resources.find((r) => r.id === id)?.max ?? 0
      return { ...p, usesSpent: { ...p.usesSpent, [id]: clamp(n, 0, max) } }
    })
  }, [])

  const spendUse = useCallback((id: string, n = 1) => {
    setC((p) => {
      const max = derive(p).resources.find((r) => r.id === id)?.max ?? 0
      return { ...p, usesSpent: { ...p.usesSpent, [id]: clamp((p.usesSpent[id] ?? 0) + n, 0, max) } }
    })
  }, [])

  const restoreUse = useCallback((id: string, n = 1) => {
    setC((p) => ({ ...p, usesSpent: { ...p.usesSpent, [id]: Math.max(0, (p.usesSpent[id] ?? 0) - n) } }))
  }, [])

  /** Tapping a die toggles it: clicking an unspent die spends it, a spent one gives it back. */
  const toggleHitDie = useCallback((index: number) => {
    setC((p) => ({ ...p, hitDiceSpent: index < p.hitDiceSpent ? index : index + 1 }))
  }, [])

  const setDeathSave = useCallback((kind: 'success' | 'failure', n: number) => {
    setC((p) => (kind === 'success'
      ? { ...p, deathSuccesses: clamp(n, 0, 3) }
      : { ...p, deathFailures: clamp(n, 0, 3) }))
  }, [])

  const togglePrepared = useCallback((id: string) => {
    setC((p) => ({
      ...p,
      preparedSpellIds: p.preparedSpellIds.includes(id)
        ? p.preparedSpellIds.filter((s) => s !== id)
        : [...p.preparedSpellIds, id],
    }))
  }, [])

  const toggleList = (key: 'skillProfs' | 'featIds' | 'cantripIds' | 'conditions' | 'expertise') => (id: string) =>
    commit((p) => {
      const list = p[key] as string[]
      return { ...p, [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] } as Character
    })

  const toggleSkill = useCallback((key: string) => {
    commit((p) => {
      const k = key as SkillKey
      const on = p.skillProfs.includes(k)
      return {
        ...p,
        skillProfs: on ? p.skillProfs.filter((x) => x !== k) : [...p.skillProfs, k],
        // Sin competencia no puede haber pericia.
        expertise: on ? p.expertise.filter((x) => x !== k) : p.expertise,
      }
    })
  }, [commit])
  const toggleFeat = useCallback(toggleList('featIds'), [])
  const toggleCantrip = useCallback(toggleList('cantripIds'), [])
  const toggleCondition = useCallback(toggleList('conditions'), [])
  const toggleExpertise = useCallback(toggleList('expertise'), [])

  const toggleChoice = useCallback((groupId: string, optionId: string) => {
    commit((p) => {
      const cur = p.choices[groupId] ?? []
      const next = cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId]
      return { ...p, choices: { ...p.choices, [groupId]: next } }
    })
  }, [commit])

  const shortRest = useCallback(() => {
    setC((p) => {
      const dd = derive(p)
      const usesSpent = { ...p.usesSpent }
      for (const r of dd.resources) if (r.recharge === 'short') usesSpent[r.id] = 0
      return { ...p, usesSpent }
    })
    setLastRest('Descanso corto — recuperaste los usos que vuelven con descanso corto. Gasta dados de golpe abajo para curarte.')
  }, [])

  // ── Inventario ───────────────────────────────────────────────────────────

  const addItem = useCallback((item: InvItem) =>
    setC((p) => ({ ...p, items: [...p.items, item] })), [])

  /**
   * Añadir del catálogo apila sobre la línea que ya exista igual, en vez de
   * dejar tres renglones de «Antorcha» sueltos.
   */
  const addFromCatalog = useCallback((gearId: string, qty = 1) => setC((p) => {
    const linea = lineaDeCatalogo(gearId, qty)
    if (!linea) return p
    const ya = p.items.find((i) => i.name === linea.name && i.notes === linea.notes)
    if (ya) return { ...p, items: p.items.map((i) => (i === ya ? { ...i, qty: i.qty + qty } : i)) }
    return { ...p, items: [...p.items, linea] }
  }), [])

  const apilar = (items: InvItem[], nuevos: InvItem[]) => {
    const out = [...items]
    for (const n of nuevos) {
      const i = out.findIndex((x) => x.name === n.name && x.notes === n.notes)
      if (i >= 0) out[i] = { ...out[i], qty: out[i].qty + n.qty }
      else out.push(n)
    }
    return out
  }

  const addPack = useCallback((packId: string) =>
    setC((p) => ({ ...p, items: apilar(p.items, contenidoDePaquete(packId)) })), [])

  const addStartingGear = useCallback(() =>
    setC((p) => ({ ...p, items: apilar(p.items, equipoInicial(p.classId)) })), [])

  const updateItem = useCallback((id: string, patch: Partial<InvItem>) =>
    setC((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })), [])

  const removeItem = useCallback((id: string) =>
    setC((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) })), [])

  const setCoins = useCallback((patch: Partial<Bolsa>) => setC((p) => {
    const next = { ...p.coins, ...patch }
    for (const k of Object.keys(next) as (keyof Bolsa)[]) {
      next[k] = Math.max(0, Math.floor(Number(next[k]) || 0))
    }
    return { ...p, coins: next }
  }), [])

  const longRest = useCallback(() => {
    setC((p) => {
      const dd = derive(p)
      const regained = Math.max(1, Math.floor(dd.hitDiceMax / 2))
      return {
        ...p,
        hpCurrent: dd.maxHp,
        hpTemp: 0,
        hitDiceSpent: Math.max(0, p.hitDiceSpent - regained),
        deathSuccesses: 0,
        deathFailures: 0,
        slotsUsed: [0, 0, 0, 0, 0],
        usesSpent: {},
        concentratingOn: null,
      }
    })
    setLastRest('Descanso largo — puntos de golpe al máximo, todos los espacios y usos recuperados, y puedes cambiar los conjuros preparados.')
  }, [])

  const reset = useCallback(() => { setC(AREEN); setLastRest(null) }, [])

  const newCharacter = useCallback((classId: string) => {
    const fresh = blankCharacter(classId)
    // Empieza con los puntos de golpe al máximo que le tocan.
    setC({ ...fresh, hpCurrent: derive(fresh).maxHp })
    setLastRest(null)
  }, [])
  const replace = useCallback((next: Character) => setC({
    ...AREEN, ...next,
    coins: { ...SIN_MONEDAS, ...next.coins },
    items: next.items ?? [],
    turnOrder: next.turnOrder ?? [],
  }), [])

  useEffect(() => {
    if (!lastRest) return
    const t = setTimeout(() => setLastRest(null), 6000)
    return () => clearTimeout(t)
  }, [lastRest])

  const value: Store = {
    c, d, set, setRace, setClass, setLevel, applyHp, setTempHp,
    spendSlot, restoreSlot, spendUse, restoreUse, setUse,
    toggleHitDie, setDeathSave, togglePrepared, toggleSkill, toggleFeat, toggleCantrip,
    toggleCondition, toggleExpertise, toggleChoice,
    addItem, addFromCatalog, addPack, addStartingGear, updateItem, removeItem, setCoins,
    shortRest, longRest, reset, newCharacter, replace, lastRest, sinSitio,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore debe usarse dentro de StoreProvider')
  return v
}
