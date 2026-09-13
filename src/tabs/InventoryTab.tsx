import { useMemo, useState } from 'react'
import {
  COINS_DESC, COIN_INFO, GEAR, GEAR_CATEGORIES, MONEDAS_DE_CAMBIO, PACKS, STARTING_GEAR,
  consolidar, formatearCobre, pagar, repartir, totalEnCobre,
  type CoinKey, type GearCategory,
} from '../data/gear'
import { Collapse, Chevron, Empty, Plate } from '../components/ui'
import { useStore } from '../state/store'
import type { InvItem } from '../state/types'

/** Sin decimales cuando es redondo: «10 lb», no «10.0 lb». */
const lb = (n: number) => `${Math.round(n * 10) / 10} lb`

const sinAcentos = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function InventoryTab() {
  const s = useStore()
  const { c, d } = s
  const [busqueda, setBusqueda] = useState('')
  const [pago, setPago] = useState('')
  const [pagoMsg, setPagoMsg] = useState<string | null>(null)
  const [porVender, setPorVender] = useState<string | null>(null)

  const inicial = STARTING_GEAR[c.classId]

  const resultados = useMemo(() => {
    const q = sinAcentos(busqueda.trim())
    if (q.length < 2) return []
    return GEAR
      .filter((g) => sinAcentos(g.name).includes(q) || sinAcentos(g.en).includes(q))
      .slice(0, 12)
  }, [busqueda])

  /** Las líneas de la mochila, en el orden en que uno busca las cosas. */
  const porCategoria = useMemo(() => {
    const out: { cat: GearCategory; items: InvItem[] }[] = []
    for (const cat of GEAR_CATEGORIES) {
      const items = c.items
        .filter((i) => i.category === cat)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      if (items.length) out.push({ cat, items })
    }
    return out
  }, [c.items])

  /**
   * «Pagar» acepta lo que uno diría en la mesa: «12», «12 po», «3 pp 5 pc».
   * Sin unidad se entiende en oro, que es como se habla de dinero en la mesa.
   */
  const aCobre = (texto: string): number | null => {
    const t = texto.trim().toLowerCase().replace(',', '.')
    if (!t) return null
    const conUnidad = [...t.matchAll(/(\d+(?:\.\d+)?)\s*(pt|po|pe|pp|pc)/g)]
    if (conUnidad.length) {
      return Math.round(conUnidad.reduce(
        (n, m) => n + Number(m[1]) * COIN_INFO[m[2] as CoinKey].cobre, 0))
    }
    const suelto = Number(t)
    return Number.isFinite(suelto) && suelto > 0 ? Math.round(suelto * 100) : null
  }

  const cobrar = () => {
    const cobre = aCobre(pago)
    if (cobre == null) { setPagoMsg('Escribe una cantidad, por ejemplo «12» o «3 pp 5 pc».'); return }
    const resto = pagar(c.coins, cobre)
    if (!resto) { setPagoMsg(`No te alcanza: tienes ${formatearCobre(d.carga.dinero)} y pides ${formatearCobre(cobre)}.`); return }
    s.setCoins(resto)
    setPago('')
    setPagoMsg(`Pagado ${formatearCobre(cobre)}. Te quedan ${formatearCobre(totalEnCobre(resto))}.`)
  }

  /** El botín entra en oro, plata y cobre; el platino que ya tengas no se toca. */
  const ingresar = (cobre: number) => {
    const entra = repartir(cobre)
    const next = { ...c.coins }
    for (const k of MONEDAS_DE_CAMBIO) next[k] += entra[k]
    s.setCoins(next)
    return next
  }

  const cobrarIngreso = () => {
    const cobre = aCobre(pago)
    if (cobre == null) { setPagoMsg('Escribe una cantidad, por ejemplo «12» o «3 pp 5 pc».'); return }
    const next = ingresar(cobre)
    setPago('')
    setPagoMsg(`Cobrado ${formatearCobre(cobre)}. Ahora llevas ${formatearCobre(totalEnCobre(next))}.`)
  }

  /** Vender una línea: entra su valor completo. El regateo es cosa del DM. */
  const vender = (i: InvItem) => {
    const cobre = i.cost * i.qty
    ingresar(cobre)
    s.removeItem(i.id)
    setPorVender(null)
    setPagoMsg(`Vendida ${i.name} por ${formatearCobre(cobre)}.`)
  }

  const barra = Math.min(100, (d.carga.peso / Math.max(1, d.carga.capacidad)) * 100)

  return (
    <>
      <p className="field-hint" style={{ marginTop: 0, marginBottom: 14 }}>
        Lo que llevas encima y lo que cuesta. La app ya sabe cuánto pesa y cuánto vale cada
        cosa del manual, así que basta con buscarla por su nombre.
      </p>

      {/* ── Dinero ──────────────────────────────────────────────────────── */}
      <Plate title="Dinero" count={formatearCobre(d.carga.dinero)}>
        <div className="coin-grid">
          {COINS_DESC.map((k) => (
            <div key={k} className={`coin coin-${k}`}>
              <div className="coin-abbr">{k}</div>
              <div className="coin-name">{COIN_INFO[k].name}</div>
              <div className="coin-en">{COIN_INFO[k].en}</div>
              <input
                className="coin-input"
                type="number"
                min={0}
                inputMode="numeric"
                value={c.coins[k]}
                aria-label={`Piezas de ${COIN_INFO[k].name.toLowerCase()}`}
                onChange={(e) => s.setCoins({ [k]: Number(e.target.value) })}
              />
              <div className="coin-steps">
                <button className="coin-step" aria-label={`Quitar una pieza de ${COIN_INFO[k].name.toLowerCase()}`}
                  disabled={c.coins[k] <= 0} onClick={() => s.setCoins({ [k]: c.coins[k] - 1 })}>−</button>
                <button className="coin-step" aria-label={`Añadir una pieza de ${COIN_INFO[k].name.toLowerCase()}`}
                  onClick={() => s.setCoins({ [k]: c.coins[k] + 1 })}>+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="pago">
          <input
            className="control"
            value={pago}
            placeholder="12, o 3 pp 5 pc"
            aria-label="Cantidad"
            onChange={(e) => { setPago(e.target.value); setPagoMsg(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') cobrar() }}
          />
          <button className="btn" onClick={cobrar}>Pagar</button>
          <button className="btn gold" onClick={cobrarIngreso}>Cobrar</button>
        </div>
        <p className="field-hint" style={{ marginTop: 6 }}>
          Sin unidad se entiende en oro. Al pagar, la app rompe monedas grandes y te devuelve
          el cambio sola, igual que haría el tendero.
        </p>
        {pagoMsg && <p className="pago-msg" role="status">{pagoMsg}</p>}

        <div className="btn-row" style={{ marginTop: 10 }}>
          <button className="btn small" onClick={() => s.setCoins(consolidar(c.coins))}>
            Juntar el suelto
          </button>
        </div>
        <p className="field-hint">
          Cambia 100 pc por 1 po y deshace el electro, sin que el total cambie.
          Las monedas pesan: {lb(d.carga.pesoMonedas)} las que llevas.
        </p>
      </Plate>

      {/* ── Carga ───────────────────────────────────────────────────────── */}
      <Plate title="Carga" count={`${lb(d.carga.peso)} de ${d.carga.capacidad}`}>
        <div className="pool-bar carga">
          <div className={`pool-fill carga-${d.carga.estado}`} style={{ width: `${barra}%` }} />
          {d.carga.sobrecargaLeve < d.carga.capacidad && (
            <span className="carga-tope" style={{ left: `${(d.carga.sobrecargaLeve / d.carga.capacidad) * 100}%` }} />
          )}
          {d.carga.sobrecargaFuerte < d.carga.capacidad && (
            <span className="carga-tope" style={{ left: `${(d.carga.sobrecargaFuerte / d.carga.capacidad) * 100}%` }} />
          )}
        </div>
        <div className="carga-desglose">
          <span>Mochila {lb(d.carga.pesoMochila)}</span>
          <span>Armadura {lb(d.carga.pesoArmadura)}</span>
          <span>Monedas {lb(d.carga.pesoMonedas)}</span>
        </div>
        {d.carga.aviso
          ? <p className={`carga-aviso ${d.carga.estado}`} role="status">{d.carga.aviso}</p>
          : (
            <p className="field-hint">
              Vas holgado. El tope duro está en {d.carga.capacidad} libras (Fuerza × 15) y los
              avisos de la regla opcional de sobrecarga empiezan a las {d.carga.sobrecargaLeve}.
            </p>
          )}
      </Plate>

      {/* ── Añadir ──────────────────────────────────────────────────────── */}
      <Plate title="Añadir equipo">
        <input
          className="control"
          value={busqueda}
          placeholder="Buscar: cuerda, rope, antorcha…"
          aria-label="Buscar equipo"
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda.trim().length >= 2 && (
          resultados.length === 0 ? (
            <p className="field-hint">
              Nada con ese nombre en el manual. Puedes añadirlo igual como objeto suelto.
            </p>
          ) : (
            <div className="hallazgos">
              {resultados.map((g) => (
                <button key={g.id} className="hallazgo" onClick={() => { s.addFromCatalog(g.id); setBusqueda('') }}>
                  <span className="hallazgo-nombre">
                    {g.name}
                    <span className="hallazgo-en">{g.en}</span>
                  </span>
                  <span className="hallazgo-datos">{lb(g.weight)} · {formatearCobre(g.cost)}</span>
                </button>
              ))}
            </div>
          )
        )}

        <button
          className="btn wide"
          style={{ marginTop: 10 }}
          onClick={() => s.addItem({
            id: `item-${Date.now()}`, name: 'Objeto nuevo', qty: 1, weight: 0, cost: 0,
            category: 'Otros', notes: '', equipped: false,
          })}
        >
          Objeto suelto
        </button>

        <div style={{ marginTop: 14 }}>
          <Collapse head={(open) => (
            <>
              <span className="feature-name">Paquetes de equipo</span>
              <Chevron open={open} />
            </>
          )}>
            <p className="field-hint" style={{ marginTop: 8 }}>
              Un paquete no es una línea suelta: se despliega en todo lo que trae dentro,
              con su peso, para que la carga salga bien.
            </p>
            <div className="chips" style={{ marginTop: 8 }}>
              {PACKS.map((p) => (
                <button key={p.id} className="chip chip-skill" onClick={() => s.addPack(p.id)}>
                  {p.name}
                  <span className="chip-en">{p.en}</span>
                </button>
              ))}
            </div>
          </Collapse>
        </div>

        {inicial && (
          <>
            <button className="btn wide gold" style={{ marginTop: 12 }} onClick={s.addStartingGear}>
              Equipo inicial de {d.cls.name.toLowerCase()}
            </button>
            <p className="field-hint">{inicial.nota}</p>
          </>
        )}
      </Plate>

      {/* ── Mochila ─────────────────────────────────────────────────────── */}
      <Plate title="Mochila" count={`${c.items.reduce((n, i) => n + i.qty, 0)} objetos`}>
        {c.items.length === 0 ? (
          <Empty title="Vacía">
            Busca lo que lleves ahí arriba, o pulsa el equipo inicial de tu clase para
            llenarla de una vez con lo que el manual te da al empezar.
          </Empty>
        ) : (
          porCategoria.map(({ cat, items }) => (
            <div key={cat} className="inv-group">
              <p className="skill-group-title">
                {cat}
                <span>{lb(items.reduce((n, i) => n + i.weight * i.qty, 0))}</span>
              </p>
              {items.map((i) => (
                <div key={i.id} className="inv-item">
                  <Collapse head={(open) => (
                    <>
                      <span className={`inv-qty ${i.equipped ? 'eq' : ''}`}>{i.qty}</span>
                      <span className="inv-nombre">
                        {i.name}
                        {i.notes && <span className="inv-nota">{i.notes}</span>}
                      </span>
                      <span className="inv-peso">{lb(i.weight * i.qty)}</span>
                      <Chevron open={open} />
                    </>
                  )}>
                    <div className="inv-edit">
                      <div className="inv-cantidad">
                        <button className="step" aria-label={`Quitar uno de ${i.name}`}
                          onClick={() => (i.qty <= 1 ? s.removeItem(i.id) : s.updateItem(i.id, { qty: i.qty - 1 }))}>−</button>
                        <div className="level-value">{i.qty}<small>cantidad</small></div>
                        <button className="step" aria-label={`Añadir uno de ${i.name}`}
                          onClick={() => s.updateItem(i.id, { qty: i.qty + 1 })}>+</button>
                      </div>
                      <input className="control" value={i.name} aria-label="Nombre del objeto"
                        onChange={(e) => s.updateItem(i.id, { name: e.target.value })} />
                      <input className="control" value={i.notes} placeholder="Para qué sirve, propiedades…"
                        aria-label="Nota del objeto"
                        onChange={(e) => s.updateItem(i.id, { notes: e.target.value })} />
                      <div className="inv-nums">
                        <label className="inv-num">
                          <span>Peso por unidad</span>
                          <input className="control" type="number" min={0} step={0.25} value={i.weight}
                            onChange={(e) => s.updateItem(i.id, { weight: Math.max(0, Number(e.target.value) || 0) })} />
                        </label>
                        <label className="inv-num">
                          <span>Valor en po</span>
                          <input className="control" type="number" min={0} step={0.1}
                            value={Math.round(i.cost) / 100}
                            onChange={(e) => s.updateItem(i.id, { cost: Math.max(0, Math.round((Number(e.target.value) || 0) * 100)) })} />
                        </label>
                      </div>
                      <select className="control" value={i.category} aria-label="Categoría"
                        onChange={(e) => s.updateItem(i.id, { category: e.target.value as GearCategory })}>
                        {GEAR_CATEGORIES.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <div className="chips">
                        <button className={`chip ${i.equipped ? 'on' : ''}`} aria-pressed={i.equipped}
                          onClick={() => s.updateItem(i.id, { equipped: !i.equipped })}>
                          A mano
                        </button>
                        {i.cost > 0 && (
                          <button className="chip" onClick={() => (porVender === i.id ? vender(i) : setPorVender(i.id))}>
                            {porVender === i.id ? `Confirmar: ${formatearCobre(i.cost * i.qty)}` : 'Vender'}
                          </button>
                        )}
                        <button className="chip" onClick={() => s.removeItem(i.id)}>Tirar</button>
                      </div>
                    </div>
                  </Collapse>
                </div>
              ))}
            </div>
          ))
        )}
        {c.items.length > 0 && (
          <p className="field-hint" style={{ marginTop: 12 }}>
            La mochila vale {formatearCobre(d.carga.valorMochila)} si lo vendieras todo.
            La armadura y el escudo no salen aquí: se eligen en Ficha y su peso ya cuenta en la carga.
          </p>
        )}
      </Plate>
    </>
  )
}
