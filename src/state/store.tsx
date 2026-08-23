import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { SkillKey } from '../data/abilities'
import { CLASS_BY_ID, asiLevelsFor } from '../data/classes'
import { RACE_BY_ID } from '../data/races'
import { AREEN, blankCharacter } from './defaults'
import { derive, type Derived } from './derived'
import type { Character } from './types'

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
  shortRest: () => void
  longRest: () => void
  reset: () => void
  newCharacter: (classId: string) => void
  replace: (c: Character) => void
  lastRest: string | null
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [c, setC] = useState<Character>(load)
  const [lastRest, setLastRest] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(c)), 150)
    return () => clearTimeout(t)
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
  const replace = useCallback((next: Character) => setC({ ...AREEN, ...next }), [])

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
    shortRest, longRest, reset, newCharacter, replace, lastRest,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore debe usarse dentro de StoreProvider')
  return v
}
