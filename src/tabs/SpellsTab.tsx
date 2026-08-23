import { useMemo, useState } from 'react'
import { SPELL_BY_ID, cantripDamage, type Spell } from '../data/spells'
import { Chevron, Empty, Plate, Tally } from '../components/ui'
import { useStore } from '../state/store'

const LEVEL_NAMES = ['Nivel 1', 'Nivel 2', 'Nivel 3', 'Nivel 4', 'Nivel 5', 'Nivel 6', 'Nivel 7', 'Nivel 8', 'Nivel 9']

export default function SpellsTab() {
  const s = useStore()
  const { c, d } = s
  const k = d.casting
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<number | null>(null)

  const cantripBudget = k.cantripLimit
  const granted = useMemo(() => new Set(k.grantedIds), [k.grantedIds])

  const known = mode(k.mode)
  const atLimit = k.chosenIds.length >= k.spellLimit

  const browsable = useMemo(() => {
    const q = query.trim().toLowerCase()
    return k.available
      .filter((sp) => sp.level > 0 && sp.level <= k.maxSpellLevel && !granted.has(sp.id))
      .filter((sp) => (levelFilter == null ? true : sp.level === levelFilter))
      .filter((sp) => !q || sp.name.toLowerCase().includes(q) || sp.en.toLowerCase().includes(q))
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
  }, [k.available, k.maxSpellLevel, granted, levelFilter, query])

  const cantripPool = k.cantripPool
  const chosenCantrips = c.cantripIds.filter((id) => !k.fixedCantripIds.includes(id))
  const cantripsUsed = k.fixedCantripIds.length + chosenCantrips.length
  const cantripsFull = cantripsUsed >= cantripBudget

  if (!k.active && cantripBudget === 0) {
    return (
      <Empty title="Sin magia">
        {d.cls.casterType === 'none'
          ? `${d.cls.name} no lanza conjuros por sí mismo. Un arquetipo como el Embaucador Arcano, o la dote Iniciado en la Magia, lo cambian: elígelos en Ficha.`
          : `${d.cls.name} empieza a lanzar conjuros en el nivel ${d.cls.spellcastingLevel}. Estás en el ${c.level}.`}
      </Empty>
    )
  }

  return (
    <>
      {k.active && (
        <>
          <div className="stat-row" style={{ marginBottom: 8 }}>
            <div className="stat">
              <div className="stat-value">{k.saveDC}</div>
              <div className="stat-label">CD de salvación</div>
            </div>
            <div className="stat">
              <div className="stat-value">{k.attack >= 0 ? `+${k.attack}` : k.attack}</div>
              <div className="stat-label">Ataque de conjuro</div>
            </div>
            <div className="stat">
              <div className="stat-value">{k.maxSpellLevel}</div>
              <div className="stat-label">Nivel máximo</div>
            </div>
          </div>
          <p className="note-data" style={{ marginBottom: 14 }}>{k.source}</p>

          <Plate title="Espacios de conjuro" count="Toca un rombo para gastarlo">
            {k.slotsMax.map((max, i) =>
              max > 0 ? (
                <div key={i} className="slot-level">
                  <span className="slot-name">{LEVEL_NAMES[i]}</span>
                  <Tally
                    diamond
                    max={max}
                    spent={Math.min(max, c.slotsUsed[i] ?? 0)}
                    onChange={(n) => {
                      const used = [...c.slotsUsed]
                      used[i] = n
                      s.set({ slotsUsed: used })
                    }}
                  />
                </div>
              ) : null,
            )}
          </Plate>
        </>
      )}

      {/* ── Trucos ──────────────────────────────────────────────────────── */}
      <Plate title="Trucos" count={cantripBudget > 0 ? `${cantripsUsed} de ${cantripBudget}` : undefined}>
        {cantripBudget === 0 ? (
          <Empty title={`${d.cls.name} no aprende trucos`}>
            {d.cls.fightingStyles?.some((f) => f.grantsCantrips)
              ? 'Llegan por otra vía: el estilo de combate Guerrero Bendecido de Tasha\'s, la dote Iniciado en la Magia, o un linaje como el alto elfo o el tiflin. Elígelos en Ficha.'
              : 'Llegan por otra vía: la dote Iniciado en la Magia, un linaje como el alto elfo o el tiflin, o un objeto. Añade esa fuente en Ficha.'}
          </Empty>
        ) : (
          <>
            <p className="field-hint" style={{ marginTop: 0, marginBottom: 12 }}>
              Se lanzan a voluntad, sin gastar espacios. Su daño sube solo con tu nivel de personaje.
            </p>
            {k.fixedCantripIds.map((id) => {
              const sp = SPELL_BY_ID[id]
              return sp ? <SpellCard key={id} spell={sp} locked lockNote="Tu arquetipo te obliga a conocerlo." /> : null
            })}
            {chosenCantrips.map((id) => {
              const sp = SPELL_BY_ID[id]
              return sp ? <SpellCard key={id} spell={sp} cantripChosen /> : null
            })}
            {cantripsUsed < cantripBudget && (
              <details style={{ marginTop: 10 }}>
                <summary className="btn wide gold">
                  Elegir {cantripBudget - cantripsUsed} truco{cantripBudget - cantripsUsed === 1 ? '' : 's'} más
                </summary>
                <div style={{ marginTop: 10 }}>
                  {cantripPool
                    .filter((sp) => !c.cantripIds.includes(sp.id) && !k.fixedCantripIds.includes(sp.id))
                    .map((sp) => <SpellCard key={sp.id} spell={sp} />)}
                </div>
              </details>
            )}
            {cantripsFull && <p className="field-hint">Ya tienes todos. Quita uno para cambiarlo.</p>}
          </>
        )}
      </Plate>

      {/* ── Conjuros concedidos ─────────────────────────────────────────── */}
      {k.grantedIds.length > 0 && (
        <Plate title={k.grantedLabel} count="Fijos">
          <p className="field-hint" style={{ marginTop: 0, marginBottom: 12 }}>
            {k.mode === 'prepared'
              ? 'Están siempre preparados, no ocupan sitio en tu límite y no puedes cambiarlos por otros.'
              : 'Los conoces siempre, se añaden a tu lista sin gastar tu límite, y no puedes cambiarlos por otros.'}
          </p>
          {k.grantedIds.map((id) => {
            const sp = SPELL_BY_ID[id]
            return sp ? <SpellCard key={id} spell={sp} locked /> : null
          })}
        </Plate>
      )}

      {/* ── Los que llevas ──────────────────────────────────────────────── */}
      {k.active && (
        <Plate
          title={known.title}
          count={
            <span className="prep-counter">
              <span className={`prep-cur ${atLimit ? 'full' : ''}`}>{k.chosenIds.length}</span>
              <span className="prep-max">/ {k.spellLimit}</span>
            </span>
          }
        >
          <p className="field-hint" style={{ marginTop: 0, marginBottom: 12 }}>{known.hint(d, c.level)}</p>
          {k.note && <p className="field-hint" style={{ marginTop: -6, marginBottom: 12, color: 'var(--gold-warm)' }}>{k.note}</p>}
          {k.chosenIds.length === 0 ? (
            <Empty title="Lista vacía">Elígelos abajo.</Empty>
          ) : (
            k.chosenIds
              .map((id) => SPELL_BY_ID[id])
              .filter(Boolean)
              .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
              .map((sp) => <SpellCard key={sp.id} spell={sp} chosen />)
          )}
        </Plate>
      )}

      {/* ── El repertorio completo ──────────────────────────────────────── */}
      {k.active && (
        <Plate title={known.browser(d)} count={`${browsable.length} disponibles`}>
          <input
            className="control"
            type="search"
            placeholder="Buscar por nombre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar conjuro"
            style={{ marginBottom: 10 }}
          />
          <div className="filters">
            <button className={`chip ${levelFilter == null ? 'on' : ''}`} onClick={() => setLevelFilter(null)}>Todos</button>
            {k.slotsMax.map((max, i) =>
              max > 0 ? (
                <button key={i} className={`chip ${levelFilter === i + 1 ? 'on' : ''}`} onClick={() => setLevelFilter(i + 1)}>
                  {LEVEL_NAMES[i]}
                </button>
              ) : null,
            )}
          </div>
          {atLimit && (
            <p className="field-hint" style={{ color: 'var(--gold-warm)', marginBottom: 10 }}>
              {known.full}
            </p>
          )}
          {browsable.length === 0 ? (
            <Empty title="Sin coincidencias">Prueba con otro nombre o quita el filtro de nivel.</Empty>
          ) : (
            browsable.map((sp) => <SpellCard key={sp.id} spell={sp} chosen={c.preparedSpellIds.includes(sp.id)} />)
          )}
        </Plate>
      )}
    </>
  )
}

/** Wording differs between classes that prepare a list and classes that learn one. */
function mode(m: 'prepared' | 'known') {
  return m === 'prepared'
    ? {
        title: 'Preparados hoy',
        browser: (d: ReturnType<typeof useStore>['d']) => `Grimorio de ${d.cls.name.toLowerCase()}`,
        full: 'Lista llena. Quita uno de los preparados para hacer sitio.',
        hint: (d: ReturnType<typeof useStore>['d'], level: number) =>
          `${abilityName(d.casting.ability)} ${sign(d.mods[d.casting.ability])} + la mitad de tu nivel (${Math.floor(level / 2)}) = ${d.casting.spellLimit}. Puedes rehacer esta lista al terminar un descanso largo.`,
      }
    : {
        title: 'Conjuros conocidos',
        browser: (d: ReturnType<typeof useStore>['d']) => `Lista de ${d.cls.name.toLowerCase()}`,
        full: 'Ya conoces todos los que te corresponden. Quita uno para cambiarlo.',
        hint: (d: ReturnType<typeof useStore>['d']) =>
          `Conoces ${d.casting.spellLimit} conjuros a este nivel. No se preparan: los tienes siempre. Al subir de nivel puedes cambiar uno por otro.`,
      }
}

const abilityName = (a: string) =>
  ({ str: 'Fuerza', dex: 'Destreza', con: 'Constitución', int: 'Inteligencia', wis: 'Sabiduría', cha: 'Carisma' }[a] ?? a)
const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

function SpellCard({
  spell, chosen, locked, cantripChosen, lockNote,
}: { spell: Spell; chosen?: boolean; locked?: boolean; cantripChosen?: boolean; lockNote?: string }) {
  const s = useStore()
  const { c, d } = s
  const k = d.casting
  const [open, setOpen] = useState(false)

  const isCantrip = spell.level === 0
  const damage = isCantrip ? cantripDamage(spell, c.level) : null

  const cantripBudget = k.cantripLimit
  const cantripsUsed = k.fixedCantripIds.length + c.cantripIds.filter((id) => !k.fixedCantripIds.includes(id)).length
  const cantripsFull = cantripsUsed >= cantripBudget

  const atLimit = k.chosenIds.length >= k.spellLimit

  const castLevels = k.slotsMax
    .map((max, i) => ({ level: i + 1, remaining: Math.max(0, max - (c.slotsUsed[i] ?? 0)) }))
    .filter((x) => x.level >= spell.level && x.remaining > 0)

  const cast = (level: number) => {
    s.spendSlot(level)
    if (spell.concentration) s.set({ concentratingOn: spell.id })
  }

  return (
    <article className="spell">
      <button className="spell-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="spell-lvl">{isCantrip ? 'T' : spell.level}</span>
        <span className="spell-title">
          <span className="spell-name">{spell.name}</span>
          <br />
          <span className="spell-en">{spell.en} · {spell.school}</span>
          {(locked || spell.smite || spell.concentration || spell.ritual || damage) && (
            <span className="spell-flags">
              {locked && <span className="flag oath">Fijo</span>}
              {damage && <span className="flag smite">{damage}</span>}
              {spell.smite && <span className="flag smite">Castigo</span>}
              {spell.ritual && <span className="flag">Ritual</span>}
              {spell.concentration && <span className="flag conc">Concentración</span>}
            </span>
          )}
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <div className="spell-body">
          <dl className="spell-meta">
            <div><dt>Tiempo</dt><dd>{spell.time}</dd></div>
            <div><dt>Alcance</dt><dd>{spell.range}</dd></div>
            <div><dt>Componentes</dt><dd>{spell.components}</dd></div>
            <div><dt>Duración</dt><dd>{spell.duration}</dd></div>
          </dl>
          <p className="prose">{spell.text}</p>
          {damage && <p className="note-data" style={{ marginTop: 8 }}>A tu nivel: {damage} de daño.</p>}

          {!isCantrip && (
            <div className="spell-actions">
              {castLevels.length === 0 ? (
                <span className="tiny" style={{ color: 'var(--blood)' }}>Sin espacios libres</span>
              ) : (
                castLevels.map((x) => (
                  <button key={x.level} className="btn gold" onClick={() => cast(x.level)}>
                    Lanzar · nivel {x.level}
                  </button>
                ))
              )}
            </div>
          )}

          {locked ? (
            <p className="field-hint">{lockNote ?? 'Te lo concede tu subclase: lo tienes siempre y no ocupa sitio en tu límite.'}</p>
          ) : isCantrip ? (
            <div className="spell-actions">
              <button
                className={`btn ${cantripChosen || c.cantripIds.includes(spell.id) ? 'danger' : ''}`}
                disabled={!c.cantripIds.includes(spell.id) && cantripsFull}
                onClick={() => s.toggleCantrip(spell.id)}
              >
                {c.cantripIds.includes(spell.id) ? 'Quitar truco' : cantripsFull ? 'Ya los tienes todos' : 'Aprender truco'}
              </button>
            </div>
          ) : (
            <div className="spell-actions">
              <button
                className={`btn ${chosen ? 'danger' : ''}`}
                disabled={!chosen && atLimit}
                onClick={() => s.togglePrepared(spell.id)}
              >
                {chosen
                  ? k.mode === 'prepared' ? 'Quitar de preparados' : 'Olvidar'
                  : atLimit ? 'Lista llena' : k.mode === 'prepared' ? 'Preparar' : 'Aprender'}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

