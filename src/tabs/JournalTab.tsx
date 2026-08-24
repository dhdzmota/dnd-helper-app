import { useMemo, useState } from 'react'
import { Empty, Plate } from '../components/ui'
import { fechaLarga, hoy, useJournal, type LogEntry, type Note } from '../state/journal'

type Vista = 'notas' | 'bitacora'

const VISTAS: { id: Vista; label: string }[] = [
  { id: 'notas', label: 'Notas' },
  { id: 'bitacora', label: 'Bitácora' },
]

export default function JournalTab() {
  const j = useJournal()
  const [vista, setVista] = useState<Vista>('notas')

  if (!j.cargado) return <Empty title="Abriendo el diario">Un momento.</Empty>

  return (
    <>
      <div className="filters" style={{ marginBottom: 14 }}>
        {VISTAS.map((v) => (
          <button
            key={v.id}
            className={`chip ${vista === v.id ? 'on' : ''}`}
            aria-pressed={vista === v.id}
            onClick={() => setVista(v.id)}
          >
            {v.label}
            {v.id === 'notas' && j.notes.length > 0 && ` · ${j.notes.length}`}
            {v.id === 'bitacora' && j.log.length > 0 && ` · ${j.log.length}`}
          </button>
        ))}
      </div>

      {vista === 'notas' && <Notas />}
      {vista === 'bitacora' && <Bitacora />}
    </>
  )
}

/* ── Notas ─────────────────────────────────────────────────────────────── */

function Notas() {
  const j = useJournal()
  const [busca, setBusca] = useState('')
  const [abierta, setAbierta] = useState<string | null>(null)

  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return j.notes
    return j.notes.filter((n) => `${n.title} ${n.body}`.toLowerCase().includes(q))
  }, [j.notes, busca])

  return (
    <Plate title="Notas" count={j.notes.length ? `${j.notes.length}` : undefined}>
      <p className="field-hint" style={{ marginTop: 0, marginBottom: 12 }}>
        Lo que te encuentras y no quieres olvidar: nombres, pistas, objetos, quién os debe un favor.
      </p>

      <button
        className="btn wide gold"
        onClick={() => setAbierta(j.addNote())}
        style={{ marginBottom: 12 }}
      >
        Nueva nota
      </button>

      {j.notes.length > 3 && (
        <input
          className="control"
          type="search"
          placeholder="Buscar en tus notas…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label="Buscar en las notas"
          style={{ marginBottom: 12 }}
        />
      )}

      {j.notes.length === 0 ? (
        <Empty title="Todavía nada">
          Toca <b>Nueva nota</b> y escribe lo primero que quieras recordar de esta partida.
        </Empty>
      ) : visibles.length === 0 ? (
        <Empty title="Sin coincidencias">Prueba con otra palabra.</Empty>
      ) : (
        visibles.map((n) => (
          <NotaCard key={n.id} nota={n} abierta={abierta === n.id} onToggle={() => setAbierta(abierta === n.id ? null : n.id)} />
        ))
      )}
    </Plate>
  )
}

function NotaCard({ nota, abierta, onToggle }: { nota: Note; abierta: boolean; onToggle: () => void }) {
  const j = useJournal()
  const [confirmar, setConfirmar] = useState(false)
  const titulo = nota.title.trim() || 'Nota sin título'
  const resumen = nota.body.trim().split('\n')[0].slice(0, 70)

  return (
    <article className="entry">
      <button className="entry-head" aria-expanded={abierta} onClick={onToggle}>
        <span className="entry-title">
          {titulo}
          {!abierta && resumen && <span className="entry-preview">{resumen}</span>}
        </span>
        <span className="entry-date">{nota.updatedAt.slice(0, 10)}</span>
      </button>

      {abierta && (
        <div className="entry-body">
          <input
            className="control"
            value={nota.title}
            placeholder="Título"
            aria-label="Título de la nota"
            onChange={(e) => j.updateNote(nota.id, { title: e.target.value })}
            style={{ marginBottom: 8 }}
          />
          <textarea
            className="control"
            rows={7}
            value={nota.body}
            placeholder="Lo que encontrasteis, quién lo dijo, dónde estaba…"
            aria-label="Contenido de la nota"
            onChange={(e) => j.updateNote(nota.id, { body: e.target.value })}
          />
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button
              className={`btn ${confirmar ? 'danger' : ''}`}
              onClick={() => (confirmar ? j.deleteNote(nota.id) : setConfirmar(true))}
            >
              {confirmar ? 'Confirmar: borrar nota' : 'Borrar'}
            </button>
            {confirmar && <button className="btn" onClick={() => setConfirmar(false)}>Cancelar</button>}
          </div>
        </div>
      )}
    </article>
  )
}

/* ── Bitácora ──────────────────────────────────────────────────────────── */

function Bitacora() {
  const j = useJournal()
  const [abierta, setAbierta] = useState<string | null>(null)

  const ordenadas = useMemo(
    () => [...j.log].sort((a, b) => b.date.localeCompare(a.date)),
    [j.log],
  )

  return (
    <Plate title="Bitácora" count={j.log.length ? `${j.log.length} sesion${j.log.length === 1 ? '' : 'es'}` : undefined}>
      <p className="field-hint" style={{ marginTop: 0, marginBottom: 12 }}>
        Un diario de la campaña: qué pasó en cada sesión, con su fecha. Se ordena solo, de lo más reciente a lo más antiguo.
      </p>

      <button className="btn wide gold" onClick={() => setAbierta(j.addEntry())} style={{ marginBottom: 12 }}>
        Anotar la sesión de hoy
      </button>

      {ordenadas.length === 0 ? (
        <Empty title="La campaña empieza aquí">
          Al terminar una partida, toca el botón y cuenta lo que pasó. Dentro de un año lo agradecerás.
        </Empty>
      ) : (
        ordenadas.map((e) => (
          <EntradaCard key={e.id} entrada={e} abierta={abierta === e.id} onToggle={() => setAbierta(abierta === e.id ? null : e.id)} />
        ))
      )}
    </Plate>
  )
}

function EntradaCard({ entrada, abierta, onToggle }: { entrada: LogEntry; abierta: boolean; onToggle: () => void }) {
  const j = useJournal()
  const [confirmar, setConfirmar] = useState(false)
  const titulo = entrada.title.trim() || 'Sesión sin título'

  return (
    <article className="entry">
      <button className="entry-head" aria-expanded={abierta} onClick={onToggle}>
        <span className="entry-title">
          {titulo}
          <span className="entry-preview">{fechaLarga(entrada.date)}</span>
        </span>
        {!abierta && entrada.body.trim() && <span className="entry-date">{entrada.body.trim().length} car.</span>}
      </button>

      {abierta && (
        <div className="entry-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input
              className="control"
              type="date"
              value={entrada.date}
              max={hoy()}
              aria-label="Fecha de la sesión"
              onChange={(e) => j.updateEntry(entrada.id, { date: e.target.value || hoy() })}
            />
            <input
              className="control"
              value={entrada.title}
              placeholder="Título"
              aria-label="Título de la sesión"
              onChange={(e) => j.updateEntry(entrada.id, { title: e.target.value })}
            />
          </div>
          <textarea
            className="control"
            rows={10}
            value={entrada.body}
            placeholder="Qué pasó, a quién conocisteis, qué salió mal…"
            aria-label="Relato de la sesión"
            onChange={(e) => j.updateEntry(entrada.id, { body: e.target.value })}
          />
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button
              className={`btn ${confirmar ? 'danger' : ''}`}
              onClick={() => (confirmar ? j.deleteEntry(entrada.id) : setConfirmar(true))}
            >
              {confirmar ? 'Confirmar: borrar sesión' : 'Borrar'}
            </button>
            {confirmar && <button className="btn" onClick={() => setConfirmar(false)}>Cancelar</button>}
          </div>
        </div>
      )}
    </article>
  )
}
