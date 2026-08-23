import { useEffect, useRef, useState } from 'react'
import sigil from './assets/sigil.png'
import { ICONS } from './components/ui'
import { requestPersistence } from './state/db'
import { JournalProvider } from './state/journal'
import { StoreProvider, useStore } from './state/store'
import HeroTab from './tabs/HeroTab'
import CombatTab from './tabs/CombatTab'
import SpellsTab from './tabs/SpellsTab'
import FeaturesTab from './tabs/FeaturesTab'
import JournalTab from './tabs/JournalTab'
import SheetTab from './tabs/SheetTab'

const TABS = [
  { id: 'hero', label: 'Héroe', icon: ICONS.hero, Panel: HeroTab },
  { id: 'combat', label: 'Combate', icon: ICONS.combat, Panel: CombatTab },
  { id: 'spells', label: 'Conjuros', icon: ICONS.spells, Panel: SpellsTab },
  { id: 'traits', label: 'Rasgos', icon: ICONS.traits, Panel: FeaturesTab },
  { id: 'journal', label: 'Diario', icon: ICONS.journal, Panel: JournalTab },
  { id: 'sheet', label: 'Ficha', icon: ICONS.sheet, Panel: SheetTab },
] as const

type TabId = (typeof TABS)[number]['id']

const tabFromHash = (): TabId => {
  const id = window.location.hash.replace('#', '') as TabId
  return TABS.some((t) => t.id === id) ? id : 'hero'
}

function Shell() {
  const { c, d, shortRest, longRest, lastRest } = useStore()
  const [tab, setTab] = useState<TabId>(tabFromHash)
  const scrollRef = useRef<HTMLDivElement>(null)

  // La pestaña vive en el hash, así el botón de atrás del móvil retrocede
  // entre secciones en vez de cerrar la app.
  useEffect(() => {
    const sync = () => setTab(tabFromHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const go = (id: TabId) => { window.location.hash = id }

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }) }, [tab])

  // Pedir al navegador que no borre estos datos para hacer sitio. Algunos
  // navegadores solo lo conceden tras un gesto del usuario; en Ficha hay un botón.
  useEffect(() => { void requestPersistence() }, [])

  const Panel = TABS.find((t) => t.id === tab)!.Panel

  return (
    <div className="app">
      <header className="topbar">
        <img className="sigil" src={sigil} alt="" />
        <div className="topbar-id">
          <div className="topbar-name">{c.name}</div>
          <div className="topbar-sub">
            {d.cls.name} {c.level} · {c.hpCurrent}/{d.maxHp} PG · CA {d.ac}
          </div>
        </div>
        <div className="rests">
          <button className="rest-btn" onClick={shortRest} title="Recupera los usos de descanso corto">Corto</button>
          <button className="rest-btn long" onClick={longRest} title="Recupera puntos de golpe, espacios y usos">Largo</button>
        </div>
      </header>

      <main className="scroll" ref={scrollRef} id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <Panel />
      </main>

      {lastRest && <div className="toast" role="status">{lastRest}</div>}

      <nav className="nav" role="tablist" aria-label="Secciones de la ficha">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            className="nav-btn"
            aria-current={tab === t.id}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => go(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <JournalProvider>
        <Shell />
      </JournalProvider>
    </StoreProvider>
  )
}
