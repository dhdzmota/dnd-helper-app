import { ABILITIES, ABILITY_INFO, signed } from '../data/abilities'
import { Plate } from '../components/ui'
import { useStore } from '../state/store'

export default function HeroTab() {
  const { c, d } = useStore()
  const branch = d.ancestry?.name ?? d.subrace?.name ?? null

  return (
    <>
      <Plate flat className="portrait-plate">
        <div className="portrait-wrap">
          {c.portrait ? (
            <img src={c.portrait} alt={`Retrato de ${c.name}`} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'var(--raise)' }} />
          )}
          <div className="portrait-veil" />
          <div className="portrait-caption">
            <h1 className="portrait-name">{c.name}</h1>
            <div className="portrait-line">
              {d.cls.name} {c.level} · {d.subclass?.name ?? 'Sin juramento'}
            </div>
            <div className="portrait-line" style={{ color: 'var(--ash)' }}>
              {d.race.name}{branch ? ` (${branch})` : ''}
            </div>
          </div>
        </div>
        {c.notes && <p className="portrait-quote">{c.notes}</p>}
      </Plate>

      <div className="stat-row" style={{ marginBottom: 12 }}>
        <div className="stat">
          <div className="stat-value">{c.level}</div>
          <div className="stat-label">Nivel</div>
        </div>
        <div className="stat">
          <div className="stat-value">{signed(d.prof)}</div>
          <div className="stat-label">Competencia</div>
        </div>
        <div className="stat">
          <div className="stat-value">{d.passivePerception}</div>
          <div className="stat-label">Percepción pasiva</div>
        </div>
      </div>

      <Plate title="Características">
        <div className="ability-grid">
          {ABILITIES.map((a) => {
            const boost = d.racialBonus[a] ?? 0
            return (
              <div key={a} className="ability">
                {boost > 0 && <span className="ability-boost">+{boost}</span>}
                <div className="ability-key">{ABILITY_INFO[a].short}</div>
                <div className="ability-mod">{signed(d.mods[a])}</div>
                <div className="ability-score">{d.scores[a]}</div>
              </div>
            )
          })}
        </div>
        <p className="field-hint" style={{ marginTop: 10 }}>
          El número grande es el modificador: eso es lo que sumas al dado. El pequeño es la puntuación.
          {Object.keys(d.racialBonus).length > 0 && ` Las marcas rojas son el bono de ${d.race.name.toLowerCase()}.`}
        </p>
      </Plate>

      <Plate title="Tiradas de salvación">
        <div className="rows">
          {d.saves.map((s) => (
            <div key={s.key} className={`row ${s.proficient ? 'is-prof' : ''}`}>
              <span className={`pip-prof ${s.proficient ? 'on' : ''}`} aria-hidden="true" />
              <span className="row-name">{ABILITY_INFO[s.key].name}</span>
              <span className="row-ability">{s.proficient ? 'COMP' : ''}</span>
              <span className="row-mod">{signed(s.mod)}</span>
            </div>
          ))}
        </div>
        {d.cls.id === 'paladin' && c.level >= 6 && (
          <p className="field-hint" style={{ marginTop: 10 }}>
            Aura de Protección: tú y tus aliados a {c.level >= 18 ? 30 : 10} pies sumáis {signed(Math.max(1, d.mods.cha))} extra a
            todas las salvaciones. Ya está incluido en tus propios números de arriba solo si lo añades a mano — el aura se aplica
            a la tirada, no a la ficha.
          </p>
        )}
      </Plate>

      <Plate title="Habilidades" count={`${d.skills.filter((s) => s.proficient).length} competencias`}>
        <div className="rows">
          {d.skills.map((s) => (
            <div key={s.key} className={`row ${s.proficient ? 'is-prof' : ''}`}>
              <span className={`pip-prof ${s.expertise ? 'expert' : s.proficient ? 'on' : ''}`} aria-hidden="true" />
              <span className="row-name">{s.name}</span>
              <span className="row-ability">{ABILITY_INFO[s.ability].short}</span>
              <span className="row-mod">{signed(s.mod)}</span>
            </div>
          ))}
        </div>
      </Plate>
    </>
  )
}
