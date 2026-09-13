import { useMemo, useState } from 'react'
import { reordenar, turnOptions, type TurnOption } from '../state/turn'
import { useStore } from '../state/store'
import { Chevron, Plate } from './ui'

/**
 * La ayuda de combate: el turno entero, apartado por apartado, con solo lo que
 * este personaje puede hacer y marcando lo que ya se le acabó.
 *
 * Pensada para alguien que nunca ha jugado: se abre, se lee de arriba abajo en
 * el orden real del turno, y cada línea dice qué hacer sin tener que abrir el
 * manual. El que ya sabe la cierra y no la vuelve a ver.
 */
export default function Turno() {
  const s = useStore()
  const { c, d } = s
  const [abierto, setAbierto] = useState(false)
  const [detalle, setDetalle] = useState<string | null>(null)
  const [ordenando, setOrdenando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const secciones = useMemo(() => turnOptions(c, d), [c, d])
  const listas = secciones.reduce((n, sec) => n + sec.options.filter((o) => o.disponible).length, 0)

  const mover = (id: string, dir: -1 | 1) =>
    s.set({ turnOrder: reordenar(secciones, id, dir) })

  /** Gastar desde aquí: lo que se marque queda marcado en el resto de la app. */
  const gastar = (o: TurnOption) => {
    if (!o.gasto) return
    if (o.gasto.kind === 'espacio') {
      s.spendSlot(o.gasto.level)
      setAviso(`Gastado un espacio de nivel ${o.gasto.level} en ${o.name}.`)
    } else {
      s.spendUse(o.gasto.id, o.gasto.n)
      setAviso(`Marcado el uso de ${o.name}.`)
    }
  }

  return (
    <Plate flat className="turno-plate">
      <button className="turno-abrir" aria-expanded={abierto} onClick={() => setAbierto((x) => !x)}>
        <span className="turno-abrir-txt">
          <span className="turno-abrir-t">Tu turno</span>
          <span className="turno-abrir-s">
            {abierto ? 'Movimiento, acción, adicional y reacción' : `${listas} cosas que puedes hacer ahora mismo`}
          </span>
        </span>
        <Chevron open={abierto} />
      </button>

      {abierto && (
        <div className="turno-cuerpo">
          <p className="field-hint" style={{ marginTop: 0 }}>
            En tu turno tienes <em>un movimiento</em> y <em>una acción</em>. La acción adicional y la
            reacción solo existen si algo te las da. Aquí sale lo que tú tienes, y lo que ya gastaste
            aparece tachado con el motivo.
          </p>

          <div className="btn-row" style={{ marginBottom: 12 }}>
            <button className={`btn small ${ordenando ? 'gold' : ''}`} onClick={() => setOrdenando((x) => !x)}>
              {ordenando ? 'Listo' : 'Ordenar a mi gusto'}
            </button>
            {c.turnOrder.length > 0 && (
              <button className="btn small" onClick={() => s.set({ turnOrder: [] })}>Orden de fábrica</button>
            )}
          </div>
          {ordenando && (
            <p className="field-hint" style={{ marginTop: -4 }}>
              Sube lo que más usas para tenerlo de primero. El orden es tuyo: se guarda con esta ficha
              y no cambia el de nadie más.
            </p>
          )}
          {aviso && <p className="pago-msg" role="status">{aviso}</p>}

          {secciones.map((sec) => (
            <section key={sec.slot} className="turno-sec" data-slot={sec.slot}>
              <p className="skill-group-title">
                {sec.name}
                <span>{sec.en}</span>
              </p>
              <p className="turno-hint">{sec.hint}</p>

              {sec.options.map((o, i) => {
                const open = detalle === o.id
                return (
                  <div key={o.id} className={`turno-op ${o.disponible ? '' : 'agotada'}`} data-op={o.id}>
                    <div className="turno-op-head">
                      {ordenando ? (
                        <span className="turno-mover">
                          <button className="turno-flecha" disabled={i === 0}
                            aria-label={`Subir ${o.name}`} onClick={() => mover(o.id, -1)}>↑</button>
                          <button className="turno-flecha" disabled={i === sec.options.length - 1}
                            aria-label={`Bajar ${o.name}`} onClick={() => mover(o.id, 1)}>↓</button>
                        </span>
                      ) : (
                        <button
                          className="turno-op-btn"
                          aria-expanded={open}
                          onClick={() => setDetalle(open ? null : o.id)}
                        >
                          <span className="turno-op-nombre">
                            <span className="turno-op-es">{o.name}</span>
                            <span className="turno-op-en">{o.en}</span>
                          </span>
                          {o.datos && <span className="turno-op-datos">{o.datos}</span>}
                          {o.restante && <span className="turno-op-queda">{o.restante}</span>}
                          <Chevron open={open} />
                        </button>
                      )}
                      {ordenando && (
                        <span className="turno-op-nombre orden">
                          <span className="turno-op-es">{o.name}</span>
                          <span className="turno-op-en">{o.en}</span>
                        </span>
                      )}
                    </div>

                    {!o.disponible && <p className="turno-motivo">{o.motivo}</p>}

                    {open && !ordenando && (
                      <div className="turno-detalle">
                        <p>{o.text}</p>
                        {o.opciones.length > 0 && (
                          <ul className="res-opciones">
                            {o.opciones.map((x) => (
                              <li key={x.name}>
                                <span className="res-opcion-nombre">{x.name}</span>
                                <span className="res-opcion-texto">{x.text}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {o.gasto && (
                          <button className="btn small gold" onClick={() => gastar(o)}>
                            {o.gasto.kind === 'espacio'
                              ? `Gastar un espacio de nivel ${o.gasto.level}`
                              : 'Marcar que lo usé'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      )}
    </Plate>
  )
}
