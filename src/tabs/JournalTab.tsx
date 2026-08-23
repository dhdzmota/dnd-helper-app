import { useMemo, useRef, useState } from 'react'
import { Empty, Plate } from '../components/ui'
import { fechaLarga, hoy, useJournal, type LogEntry, type Note } from '../state/journal'

type Vista = 'notas' | 'bitacora' | 'galeria'

const VISTAS: { id: Vista; label: string }[] = [
  { id: 'notas', label: 'Notas' },
  { id: 'bitacora', label: 'Bitácora' },
  { id: 'galeria', label: 'Galería' },
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
            {v.id === 'galeria' && j.photos.length > 0 && ` · ${j.photos.length}`}
          </button>
        ))}
      </div>

      {vista === 'notas' && <Notas />}
      {vista === 'bitacora' && <Bitacora />}
      {vista === 'galeria' && <Galeria />}
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

/* ── Galería ───────────────────────────────────────────────────────────── */

function Galeria() {
  const j = useJournal()
  const fileRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(0)
  const [aviso, setAviso] = useState<string | null>(null)
  const [abierta, setAbierta] = useState<string | null>(null)

  const subir = async (files: FileList) => {
    setAviso(null)
    // Sin filtrar por tipo: algunos selectores de Android entregan el archivo sin
    // tipo MIME, y descartarlo aquí dejaría fuera fotos perfectamente válidas.
    const elegidas = [...files]
    if (elegidas.length === 0) return

    setSubiendo(elegidas.length)
    const fallos: string[] = []
    try {
      for (const f of elegidas) {
        const r = await j.addPhoto(f)
        if (!r.ok) fallos.push(`${f.name || 'una imagen'}: ${r.motivo}`)
        setSubiendo((n) => n - 1)
      }
    } finally {
      // Pase lo que pase, el botón vuelve a estar disponible.
      setSubiendo(0)
    }

    if (fallos.length) {
      setAviso(fallos.length === elegidas.length
        ? `No se pudo guardar ninguna. ${fallos[0]}`
        : `Se guardaron ${elegidas.length - fallos.length} de ${elegidas.length}. ${fallos[0]}`)
    }
  }

  const totalMB = j.photos.reduce((n, p) => n + p.size, 0) / 1024 / 1024

  if (j.galeriaDisponible === false) {
    return (
      <Plate title="Galería">
        <Empty title="Aquí no se pueden guardar imágenes">
          Este navegador no deja usar su almacén de datos, normalmente por estar en modo privado.
          Ábrela en una ventana normal y la galería funcionará.
        </Empty>
      </Plate>
    )
  }

  return (
    <Plate
      title="Galería"
      count={j.photos.length ? `${j.photos.length} · ${totalMB.toFixed(1)} MB` : undefined}
    >
      <p className="field-hint" style={{ marginTop: 0, marginBottom: 12 }}>
        Mapas, retratos, la foto de la mesa. Se guardan en el teléfono y se reducen a 1600 píxeles
        para que no ocupen de más.
      </p>

      <button className="btn wide gold" onClick={() => fileRef.current?.click()} disabled={subiendo > 0}>
        {subiendo > 0 ? `Guardando ${subiendo}…` : 'Añadir imágenes'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => { if (e.target.files?.length) subir(e.target.files); e.target.value = '' }}
      />

      {aviso && <p className="field-hint" style={{ color: 'var(--blood)' }}>{aviso}</p>}

      {j.photos.length === 0 ? (
        <Empty title="Galería vacía">
          Añade el mapa que os dio el DM, o esa carta que nadie supo leer.
        </Empty>
      ) : (
        <div className="gallery">
          {j.photos.map((p) => (
            <figure key={p.id} className={`shot ${abierta === p.id ? 'abierta' : ''}`}>
              <button className="shot-img" onClick={() => setAbierta(abierta === p.id ? null : p.id)} aria-expanded={abierta === p.id}>
                <img src={p.url} alt={p.caption || 'Imagen de la campaña'} loading="lazy" />
              </button>
              {abierta === p.id && (
                <figcaption className="shot-edit">
                  <input
                    className="control"
                    value={p.caption}
                    placeholder="Descripción"
                    aria-label="Descripción de la imagen"
                    onChange={(e) => j.updatePhoto(p.id, e.target.value)}
                  />
                  <div className="btn-row" style={{ marginTop: 8 }}>
                    <span className="tiny" style={{ flex: 1, alignSelf: 'center' }}>
                      {p.width}×{p.height} · {(p.size / 1024).toFixed(0)} KB
                    </span>
                    <button className="btn small danger" onClick={() => j.deletePhoto(p.id)}>Borrar</button>
                  </div>
                </figcaption>
              )}
              {abierta !== p.id && p.caption && <figcaption className="shot-caption">{p.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </Plate>
  )
}
