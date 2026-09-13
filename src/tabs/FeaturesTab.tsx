import { FEAT_BY_ID } from '../data/feats'
import { breathWeaponDice } from '../data/races'
import { Chevron, Collapse, Empty, Plate, Resource } from '../components/ui'
import { useStore } from '../state/store'

export default function FeaturesTab() {
  const s = useStore()
  const { c, d } = s
  const style = d.fightingStyles.find((f) => f.id === c.fightingStyleId)
  const feats = c.featIds
    .map((id) => FEAT_BY_ID[id])
    .filter((f) => f && (c.useTashas || f.source !== 'TCE'))

  return (
    <>
      {/* ── Lo que escala con el nivel ──────────────────────────────────── */}
      {d.scalings.length > 0 && (
        <Plate title={`${d.cls.name} de nivel ${c.level}`}>
          <div className="stat-row" style={{ gridTemplateColumns: `repeat(${Math.min(3, d.scalings.length)}, 1fr)` }}>
            {d.scalings.map((sc) => (
              <div key={sc.id} className="stat">
                <div className="stat-value" style={{ fontSize: '1.25rem' }}>{sc.value}</div>
                <div className="stat-label">{sc.name}</div>
              </div>
            ))}
          </div>
          {d.scalings.map((sc) => sc.detail && (
            <p key={sc.id} className="field-hint" style={{ marginTop: 10 }}>
              <strong style={{ color: 'var(--gold-warm)', fontWeight: 400 }}>{sc.name}.</strong> {sc.detail}
            </p>
          ))}
        </Plate>
      )}

      {/* ── Recursos ────────────────────────────────────────────────────── */}
      <Plate title="Recursos" count={d.resources.length ? 'Toca una marca para gastarla' : undefined}>
        {d.resources.length === 0 ? (
          <Empty title="Nada que gastar todavía">Los recursos aparecen aquí conforme subes de nivel.</Empty>
        ) : (
          d.resources.map((r) => (
            <Resource
              key={r.id}
              name={r.name}
              detail={r.detail}
              recharge={r.recharge}
              kind={r.kind}
              max={r.max}
              spent={r.spent}
              onSet={(n) => s.setUse(r.id, n)}
              opciones={r.opciones}
            />
          ))
        )}
      </Plate>

      {/* ── Elecciones de clase ─────────────────────────────────────────── */}
      {/* Las que se pagan con una reserva ya salen colgando de ella, arriba:
          repetirlas aquí solo alargaría la pantalla. */}
      {d.choices
        .filter(({ group }) => !d.resources.some((r) => r.id === group.resourceId))
        .map(({ group, max, chosen }) => (
        <Plate key={group.id} title={group.label} count={`${chosen.length} de ${max}`}>
          <p className="field-hint" style={{ marginTop: 0, marginBottom: 12 }}>{group.hint}</p>
          {chosen.length === 0 ? (
            <Empty title="Sin elegir">Elige {max} en la pestaña Ficha.</Empty>
          ) : (
            chosen.map((id) => {
              const opt = group.options.find((o) => o.id === id)
              return opt ? (
                <div key={id} className="resource">
                  <div className="resource-head">
                    <span className="resource-name">{opt.name}</span>
                  </div>
                  <p className="resource-detail" style={{ marginBottom: 0 }}>{opt.text}</p>
                </div>
              ) : null
            })
          )}
        </Plate>
        ))}

      {/* ── Linaje ──────────────────────────────────────────────────────── */}
      <Plate title={`Rasgos de ${d.race.name.toLowerCase()}`} count={d.ancestry?.name ?? d.subrace?.name}>
        {d.ancestry && (
          <div className="stat-row" style={{ marginBottom: 14 }}>
            <div className="stat">
              <div className="stat-value" style={{ fontSize: '1.125rem' }}>{breathWeaponDice(c.level)}</div>
              <div className="stat-label">Aliento</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ fontSize: '1.125rem' }}>{8 + d.mods.con + d.prof}</div>
              <div className="stat-label">CD del aliento</div>
            </div>
            <div className="stat">
              <div className="stat-value" style={{ fontSize: '1.125rem', color: 'var(--gold-warm)' }}>{d.ancestry.damage}</div>
              <div className="stat-label">Resistencia</div>
            </div>
          </div>
        )}
        {d.traits.map((t) => (
          <div key={t.name} className="feature">
            <Collapse
              head={(open) => (
                <>
                  <span className="feature-lvl">{d.race.name.slice(0, 3).toUpperCase()}</span>
                  <span className="feature-name">{t.name}</span>
                  <Chevron open={open} />
                </>
              )}
            >
              <div className="feature-body">
                <p className="prose">
                  {t.name === 'Arma de aliento' && d.ancestry
                    ? `${t.text} Para ti: ${breathWeaponDice(c.level)} de daño de ${d.ancestry.damage.toLowerCase()} en ${d.ancestry.shape.toLowerCase()}, salvación de ${d.ancestry.save === 'dex' ? 'Destreza' : 'Constitución'} CD ${8 + d.mods.con + d.prof}.`
                    : t.name === 'Resistencia al daño' && d.ancestry
                      ? `${t.text} La tuya es al daño de ${d.ancestry.damage.toLowerCase()}.`
                      : t.text}
                </p>
              </div>
            </Collapse>
          </div>
        ))}
      </Plate>

      {/* ── Estilo de combate ───────────────────────────────────────────── */}
      {d.cls.fightingStyleLevel != null && c.level >= d.cls.fightingStyleLevel && (
        <Plate title="Estilo de combate">
          {style ? (
            <>
              <div className="resource-head">
                <span className="resource-name">{style.name}</span>
                <span className="recharge">Siempre activo</span>
              </div>
              <p className="resource-detail" style={{ marginBottom: 0 }}>{style.text}</p>
            </>
          ) : (
            <Empty title="Sin estilo elegido">Elige uno en la pestaña Ficha. Es permanente.</Empty>
          )}
        </Plate>
      )}

      {/* ── Rasgos de clase ─────────────────────────────────────────────── */}
      <Plate title={`Rasgos de ${d.cls.name.toLowerCase()}`} count={`${d.features.length} hasta nivel ${c.level}`}>
        {d.features.map((f) => (
          <div key={`${f.level}-${f.name}`} className="feature">
            <Collapse
              head={(open) => (
                <>
                  <span className="feature-lvl">N{f.level}</span>
                  <span className="feature-name">
                    {f.name}
                    {f.subclass && <span className="spell-en" style={{ display: 'block' }}>{d.subclass?.name}</span>}
                  </span>
                  <Chevron open={open} />
                </>
              )}
            >
              <div className="feature-body">
                <p className="prose">{f.text}</p>
              </div>
            </Collapse>
          </div>
        ))}
      </Plate>

      {/* ── Dotes ───────────────────────────────────────────────────────── */}
      <Plate title="Dotes" count={`${feats.length} de ${d.asiSlots} espacio${d.asiSlots === 1 ? '' : 's'}`}>
        {feats.length === 0 ? (
          <Empty title="Sin dotes">
            {d.asiSlots === 0
              ? `El primer espacio llega en el nivel ${d.asiLevels[0]}. Estás en el ${c.level}.`
              : `Tienes ${d.asiSlots} espacio${d.asiSlots === 1 ? '' : 's'} sin usar. Elige dotes en Ficha, o quédate con la subida de características.`}
          </Empty>
        ) : (
          feats.map((f) => (
            <div key={f.id} className="feature">
              <Collapse
                head={(open) => (
                  <>
                    <span className="feature-lvl">{f.source === 'TCE' ? "Tasha's" : 'Dote'}</span>
                    <span className="feature-name">{f.name}</span>
                    <Chevron open={open} />
                  </>
                )}
              >
                <div className="feature-body">
                  {f.prereq && <p className="tiny" style={{ marginBottom: 6 }}>Requisito: {f.prereq}</p>}
                  <p className="prose">{f.text}</p>
                </div>
              </Collapse>
            </div>
          ))
        )}
      </Plate>
    </>
  )
}
