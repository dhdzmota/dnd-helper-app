import { useState } from 'react'
import { ABILITY_INFO, signed } from '../data/abilities'
import { SPELL_BY_ID } from '../data/spells'
import { CONDITIONS } from '../state/defaults'
import { Empty, Plate, Resource, Tally } from '../components/ui'
import { useStore } from '../state/store'

export default function CombatTab() {
  const s = useStore()
  const { c, d } = s
  const [amount, setAmount] = useState(1)

  const pct = d.maxHp > 0 ? (c.hpCurrent / d.maxHp) * 100 : 0
  const tempPct = d.maxHp > 0 ? Math.min(100, (c.hpTemp / d.maxHp) * 100) : 0
  const hpTone = c.hpCurrent === 0 ? 'down' : pct <= 25 ? 'bloodied' : pct <= 50 ? 'hurt' : ''
  const down = c.hpCurrent === 0
  const conc = c.concentratingOn ? SPELL_BY_ID[c.concentratingOn] : null

  // Lo que de verdad tocas dentro de una pelea: lo que vuelve con descanso corto,
  // más las reservas de curación y de puntos de clase.
  const combatResources = d.resources.filter(
    (r) => r.recharge === 'short' || r.kind === 'pool' || r.id === 'feat-lucky',
  )

  return (
    <>
      {/* ── Puntos de golpe ─────────────────────────────────────────────── */}
      <Plate title="Puntos de golpe">
        <div className="hp-head">
          <div className="hp-nums">
            <span className={`hp-cur ${hpTone}`}>{c.hpCurrent}</span>
            <span className="hp-max">/ {d.maxHp}</span>
          </div>
          {c.hpTemp > 0 && <span className="hp-temp">+{c.hpTemp} temporales</span>}
        </div>

        <div className="hp-bar">
          <div className="hp-fill" style={{ width: `${pct}%` }} />
          {c.hpTemp > 0 && (
            <div className="hp-temp-fill" style={{ left: `${pct}%`, width: `${Math.min(100 - pct, tempPct)}%` }} />
          )}
        </div>

        <div className="hp-controls">
          <button className="step" onClick={() => setAmount((a) => Math.max(1, a - 1))} aria-label="Restar uno a la cantidad">−</button>
          <input
            className="hp-input"
            type="number"
            inputMode="numeric"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
            aria-label="Cantidad de puntos de golpe"
          />
          <button className="step" onClick={() => setAmount((a) => a + 1)} aria-label="Sumar uno a la cantidad">+</button>
        </div>

        <div className="btn-row" style={{ marginTop: 8 }}>
          <button className="btn hp-act dmg" style={{ flex: 1 }} onClick={() => s.applyHp(-amount)}>Recibir daño</button>
          <button className="btn hp-act heal" style={{ flex: 1 }} onClick={() => s.applyHp(amount)} disabled={c.hpCurrent >= d.maxHp}>Curar</button>
        </div>

        <div className="hp-controls" style={{ marginTop: 10 }}>
          <span className="tiny" style={{ flex: 1 }}>Puntos de golpe temporales</span>
          <button className="step" onClick={() => s.setTempHp(c.hpTemp - 1)} disabled={c.hpTemp === 0} aria-label="Restar un punto temporal">−</button>
          <span className="score-num" style={{ fontSize: '1.125rem' }}>{c.hpTemp}</span>
          <button className="step" onClick={() => s.setTempHp(c.hpTemp + 1)} aria-label="Sumar un punto temporal">+</button>
        </div>
        {c.hpTemp > 0 && <p className="field-hint">Los temporales absorben el daño primero y no se acumulan con otra fuente: te quedas con el valor más alto.</p>}
      </Plate>

      {/* ── Salvaciones de muerte: solo cuando estás a 0 ─────────────────── */}
      {down && (
        <Plate title="Salvaciones de muerte">
          <div className="death">
            <div className="death-line">
              <span className="tiny" style={{ color: 'var(--gold)' }}>Éxitos</span>
              <div className="marks">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    className={`death-mark success ${i < c.deathSuccesses ? 'on' : ''}`}
                    aria-label={`Éxito ${i + 1}`}
                    aria-pressed={i < c.deathSuccesses}
                    onClick={() => s.setDeathSave('success', i < c.deathSuccesses ? i : i + 1)}
                  />
                ))}
              </div>
            </div>
            <div className="death-line">
              <span className="tiny" style={{ color: 'var(--blood)' }}>Fallos</span>
              <div className="marks">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    className={`death-mark failure ${i < c.deathFailures ? 'on' : ''}`}
                    aria-label={`Fallo ${i + 1}`}
                    aria-pressed={i < c.deathFailures}
                    onClick={() => s.setDeathSave('failure', i < c.deathFailures ? i : i + 1)}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="death-note">
            {c.deathFailures >= 3
              ? 'Tres fallos: tu personaje ha muerto.'
              : c.deathSuccesses >= 3
                ? 'Tres éxitos: quedas estable a 0 puntos de golpe. Recuperas 1 punto tras 1d4 horas.'
                : 'Tira 1d20 al inicio de tu turno. 10 o más es un éxito, 9 o menos un fallo. Un 1 natural cuenta como dos fallos, un 20 natural te devuelve a 1 punto de golpe.'}
          </p>
          {(c.deathSuccesses > 0 || c.deathFailures > 0) && (
            <button className="btn wide" style={{ marginTop: 10 }} onClick={() => { s.setDeathSave('success', 0); s.setDeathSave('failure', 0) }}>
              Borrar las marcas
            </button>
          )}
        </Plate>
      )}

      {/* ── Defensa ─────────────────────────────────────────────────────── */}
      <div className="stat-row" style={{ marginBottom: 12 }}>
        <div className="stat">
          <div className="stat-value">{d.ac}</div>
          <div className="stat-label">Clase de armadura</div>
        </div>
        <div className="stat">
          <div className="stat-value">{signed(d.initiative)}</div>
          <div className="stat-label">Iniciativa</div>
        </div>
        <div className="stat">
          <div className="stat-value">{d.speed}</div>
          <div className="stat-label">Velocidad (pies)</div>
        </div>
      </div>
      <p className="note-data" style={{ marginTop: -4, marginBottom: 14 }}>{d.acSource}</p>

      {/* ── Concentración ───────────────────────────────────────────────── */}
      {conc && (
        <Plate title="Concentración">
          <div className="resource-head">
            <span className="resource-name">{conc.name}</span>
            <span className="recharge">{conc.duration.replace('Concentración, hasta ', '')}</span>
          </div>
          <p className="resource-detail">
            Cada vez que recibas daño, haz una salvación de Constitución con CD 10 o la mitad del daño recibido, lo que sea más alto.
          </p>
          <button className="btn wide" onClick={() => s.set({ concentratingOn: null })}>Romper concentración</button>
        </Plate>
      )}

      {/* ── Dados de golpe ──────────────────────────────────────────────── */}
      <Plate title="Dados de golpe" count={`${d.hitDiceMax - c.hitDiceSpent} de ${d.hitDiceMax} · d${d.hitDie}`}>
        <Tally max={d.hitDiceMax} spent={c.hitDiceSpent} onChange={(n) => s.set({ hitDiceSpent: n })} />
        <p className="field-hint" style={{ marginTop: 10 }}>
          En un descanso corto puedes gastar dados de golpe: tira 1d{d.hitDie} {signed(d.mods.con)} y recupera ese tanto.
          Un descanso largo te devuelve la mitad de tus dados, redondeando hacia abajo.
        </p>
      </Plate>

      {/* ── Castigo Divino ──────────────────────────────────────────────── */}
      {d.smiteOptions.length > 0 && (
        <Plate title="Castigo Divino" count="Toca para gastar el espacio">
          <div className="smite-strip">
            {d.smiteOptions.map((o) => (
              <button
                key={o.slotLevel}
                className="smite-opt"
                disabled={o.remaining === 0}
                onClick={() => s.spendSlot(o.slotLevel)}
              >
                <span className="smite-slot">Nivel {o.slotLevel}</span>
                <span className="smite-text">
                  <span className="smite-dice">{o.dice}</span> <span className="smite-unit">radiante</span>
                  <span className="smite-vs">{o.vsFiend} contra no-muertos y fiends</span>
                </span>
                <span className="smite-left">{o.remaining} libre{o.remaining === 1 ? '' : 's'}</span>
              </button>
            ))}
          </div>
          <p className="field-hint" style={{ marginTop: 10 }}>
            Se declara <em>después</em> de que el ataque cuerpo a cuerpo acierte, así que no gastas el espacio en vano.
            {d.improvedSmite && ' Castigo Divino Mejorado ya te da 1d8 radiante gratis en cada golpe cuerpo a cuerpo, sin gastar nada.'}
          </p>
        </Plate>
      )}

      {/* ── Números que escalan con el nivel ────────────────────────────── */}
      {d.scalings.length > 0 && (
        <Plate title="En cada golpe">
          <div className="stat-row" style={{ gridTemplateColumns: `repeat(${Math.min(3, d.scalings.length)}, 1fr)` }}>
            {d.scalings.map((sc) => (
              <div key={sc.id} className="stat">
                <div className="stat-value" style={{ fontSize: '1.25rem' }}>{sc.value}</div>
                <div className="stat-label">{sc.name}</div>
              </div>
            ))}
          </div>
        </Plate>
      )}

      {/* ── Ataques ─────────────────────────────────────────────────────── */}
      <Plate title="Ataques" count={c.attacks.length ? undefined : 'Se editan en Ficha'}>
        {c.attacks.length === 0 ? (
          <Empty title="Sin ataques">Añade tus armas desde la pestaña Ficha.</Empty>
        ) : (
          <div className="rows">
            {c.attacks.map((a) => {
              const hit = d.mods[a.ability] + (a.proficient ? d.prof : 0)
              const dmgMod = d.mods[a.ability] + a.damageBonus
              return (
                <div key={a.id} className="row is-prof" style={{ gridTemplateColumns: '1fr auto auto', gap: 12 }}>
                  <span>
                    <span className="row-name">{a.name}</span>
                    <br />
                    <span className="row-ability">{ABILITY_INFO[a.ability].short} · {a.damageType}{a.notes ? ` · ${a.notes}` : ''}</span>
                  </span>
                  <span className="row-mod" style={{ color: 'var(--gold)' }}>{signed(hit)}</span>
                  <span className="row-mod" style={{ minWidth: 62 }}>{a.damage}{dmgMod !== 0 ? signed(dmgMod) : ''}</span>
                </div>
              )
            })}
          </div>
        )}
      </Plate>

      {combatResources.length > 0 && (
        <Plate title="A mano en combate" count="También en Rasgos">
          {combatResources.map((r) => (
            <Resource
              key={r.id}
              name={r.name}
              detail={r.detail}
              recharge={r.recharge}
              kind={r.kind}
              max={r.max}
              spent={r.spent}
              onSet={(n) => s.setUse(r.id, n)}
            />
          ))}
        </Plate>
      )}

      {/* ── Estados ─────────────────────────────────────────────────────── */}
      <Plate title="Estados" count={c.conditions.length ? `${c.conditions.length} activo${c.conditions.length === 1 ? '' : 's'}` : undefined}>
        <div className="chips">
          {CONDITIONS.map((name) => (
            <button
              key={name}
              className={`chip ${c.conditions.includes(name) ? 'on warn' : ''}`}
              aria-pressed={c.conditions.includes(name)}
              onClick={() => s.toggleCondition(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </Plate>
    </>
  )
}
