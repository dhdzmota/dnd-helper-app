import { useEffect, useRef, useState } from 'react'
import { ABILITIES, ABILITY_INFO, SKILLS, signed } from '../data/abilities'
import { ARMORS } from '../data/armor'
import { CLASSES } from '../data/classes'
import { RACES } from '../data/races'
import { FEATS } from '../data/feats'
import { Empty, Field, Plate } from '../components/ui'
import { useStore } from '../state/store'
import { requestPersistence, storageHealth, type StorageHealth } from '../state/db'
import { useJournal } from '../state/journal'
import { backupToText, buildBackup, fileNameFor, restoreBackup, saveBackup, ultimaCopia, versionAndroid } from '../state/transfer'
import type { Attack } from '../state/types'

export default function SheetTab() {
  const s = useStore()
  const { c, d } = s
  const fileRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [transferMsg, setTransferMsg] = useState<string | null>(null)
  const [transferOk, setTransferOk] = useState(true)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [salud, setSalud] = useState<StorageHealth | null>(null)
  const [copia, setCopia] = useState(ultimaCopia())
  const j = useJournal()

  useEffect(() => { storageHealth().then(setSalud) }, [])
  const [newClassId, setNewClassId] = useState<string | null>(null)

  const race = RACES.find((r) => r.id === c.raceId)
  const branches = race?.ancestries ?? race?.subraces ?? null
  const cls = d.cls

  const classSkills = SKILLS.filter((sk) => cls.skillList.includes(sk.key))
  const otherSkills = SKILLS.filter((sk) => !cls.skillList.includes(sk.key))

  const featsFull = d.featSlotsLeft <= 0
  const expertiseFull = c.expertise.length >= d.expertiseMax

  const readPortrait = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => s.set({ portrait: String(reader.result) })
    reader.readAsDataURL(file)
  }

  const guardarCopia = async (conImagenes: boolean) => {
    setTransferMsg(null)
    const backup = await buildBackup(c, j.exportData(), conImagenes)
    const result = await saveBackup(backup, fileNameFor(c, conImagenes))
    setTransferMsg(result.message)
    setTransferOk(result.ok)
    if (result.ok) setCopia(ultimaCopia())
    else if (!conImagenes) { setPasteOpen(true); setPasteText(backupToText(backup)) }
  }

  const applyText = async (text: string) => {
    const result = await restoreBackup(text)
    setTransferMsg(result.message)
    setTransferOk(result.ok)
    if (!result.ok) return
    if (result.character) s.replace(result.character)
    if (result.journal) j.replaceJournal(result.journal)
    setPasteOpen(false)
    setPasteText('')
  }

  const importSheet = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => applyText(String(reader.result))
    reader.onerror = () => { setTransferMsg('No se pudo leer el archivo.'); setTransferOk(false) }
    reader.readAsText(file)
  }

  const pedirPersistencia = async () => {
    const ok = await requestPersistence()
    setSalud(await storageHealth())
    setTransferMsg(ok
      ? 'Listo: el navegador ya no borrará estos datos para hacer sitio.'
      : 'El navegador no lo concedió ahora mismo. Suele darlo cuando añades la app a la pantalla de inicio y la usas unas cuantas veces. Mientras tanto, guarda copias.')
    setTransferOk(ok)
  }

  const updateAttack = (id: string, patch: Partial<Attack>) =>
    s.set({ attacks: c.attacks.map((a) => (a.id === id ? { ...a, ...patch } : a)) })

  return (
    <>
      <p className="field-hint" style={{ marginTop: 0, marginBottom: 14 }}>
        Aquí defines <em>lo que es</em> tu personaje. Lo que gasta y recupera se toca en las otras pestañas.
      </p>

      {/* ── Empezar de cero ─────────────────────────────────────────────── */}
      <Plate title="Personaje nuevo">
        <p className="field-hint" style={{ marginTop: 0, marginBottom: 10 }}>
          Elige una clase y la app te deja una hoja limpia de nivel 3, con el array estándar repartido
          según lo que esa clase necesita. Reemplaza lo que haya ahora, así que guarda una copia antes si te importa.
        </p>
        <div className="chips">
          {CLASSES.map((x) => (
            <button
              key={x.id}
              className={`chip ${newClassId === x.id ? 'on warn' : ''}`}
              onClick={() => {
                if (newClassId === x.id) { s.newCharacter(x.id); setNewClassId(null) } else setNewClassId(x.id)
              }}
            >
              {newClassId === x.id ? `Confirmar: ${x.name}` : x.name}
            </button>
          ))}
        </div>
      </Plate>

      {/* ── Fuentes en juego ────────────────────────────────────────────── */}
      <Plate title="Reglas en la mesa">
        <p className="field-hint" style={{ marginTop: 0, marginBottom: 10 }}>
          La app usa el Manual del Jugador. Los rasgos de <em>Tasha's Cauldron of Everything</em> son
          opcionales según el propio libro, así que los decide tu DM.
        </p>
        <div className="chips">
          <button
            className={`chip ${c.useTashas ? 'on' : ''}`}
            aria-pressed={c.useTashas}
            onClick={() => s.set({ useTashas: !c.useTashas })}
          >
            Rasgos opcionales de Tasha's
          </button>
        </div>
        <p className="field-hint">
          {c.useTashas
            ? 'Activados: verás Guerrero Bendecido, Canalizar Poder Divino, Puntería Firme, las opciones de ki y metamagia extra, y las dotes de Tasha\'s.'
            : 'Desactivados: solo Manual del Jugador. Lo que ya hubieras elegido de Tasha\'s deja de contar.'}
        </p>
      </Plate>

      {/* ── Identidad ───────────────────────────────────────────────────── */}
      <Plate title="Identidad">
        <Field label="Nombre">
          <input className="control" value={c.name} onChange={(e) => s.set({ name: e.target.value })} />
        </Field>
        <Field label="Lema o descripción" hint="Aparece bajo el retrato.">
          <textarea className="control" rows={2} value={c.notes} onChange={(e) => s.set({ notes: e.target.value })} />
        </Field>
        <Field label="Retrato">
          <div className="btn-row">
            <button className="btn" onClick={() => fileRef.current?.click()}>Cambiar imagen</button>
            <button className="btn" disabled={!c.portrait} onClick={() => s.set({ portrait: null })}>Quitar</button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) readPortrait(f); e.target.value = '' }}
          />
        </Field>
      </Plate>

      {/* ── Linaje: raza → rama ─────────────────────────────────────────── */}
      <Plate title="Linaje">
        <Field label="Raza">
          <select className="control" value={c.raceId} onChange={(e) => s.setRace(e.target.value)}>
            {RACES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>

        {branches && race?.branchLabel && (
          <Field
            label={race.branchLabel}
            hint={
              race.ancestries
                ? (() => {
                    const a = race.ancestries.find((x) => x.id === c.branchId)
                    return a ? `Aliento de ${a.damage.toLowerCase()} en ${a.shape.toLowerCase()}, y resistencia a ese mismo daño.` : null
                  })()
                : null
            }
          >
            <select className="control" value={c.branchId ?? ''} onChange={(e) => s.set({ branchId: e.target.value })}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
        )}

        <p className="field-hint">
          Bono de característica: {Object.entries(d.racialBonus).map(([k, v]) => `${ABILITY_INFO[k as keyof typeof ABILITY_INFO].short} +${v}`).join(', ') || 'ninguno'}.
        </p>
      </Plate>

      {/* ── Clase: clase → nivel → subclase → estilo ────────────────────── */}
      <Plate title="Clase">
        <Field label="Clase">
          <select className="control" value={c.classId} onChange={(e) => s.setClass(e.target.value)}>
            {CLASSES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </Field>

        <Field label="Nivel" hint={`Competencia ${signed(d.prof)} · dados de golpe ${c.level}d${d.hitDie} · ${d.maxHp} puntos de golpe máximos`}>
          <div className="level-picker">
            <button className="step" onClick={() => s.setLevel(c.level - 1)} disabled={c.level <= 1} aria-label="Bajar un nivel">−</button>
            <div className="level-value">
              {c.level}
              <small>de 20</small>
            </div>
            <button className="step" onClick={() => s.setLevel(c.level + 1)} disabled={c.level >= 20} aria-label="Subir un nivel">+</button>
          </div>
        </Field>

        {c.level >= cls.subclassLevel ? (
          <Field label={cls.subclassLabel} hint={d.subclasses.find((x) => x.id === c.subclassId)?.flavor}>
            <select className="control" value={c.subclassId ?? ''} onChange={(e) => s.set({ subclassId: e.target.value })}>
              {d.subclasses.map((x) => (
                <option key={x.id} value={x.id}>{x.name}{x.source === 'TCE' ? " (Tasha's)" : ''}</option>
              ))}
            </select>
          </Field>
        ) : (
          <p className="field-hint">
            Eliges tu {cls.subclassLabel.toLowerCase()} en el nivel {cls.subclassLevel}. Te faltan {cls.subclassLevel - c.level}.
          </p>
        )}

        {d.fightingStyles.length > 0 && cls.fightingStyleLevel != null && c.level >= cls.fightingStyleLevel && (
          <Field
            label="Estilo de combate"
            hint={d.fightingStyles.find((f) => f.id === c.fightingStyleId)?.text ?? 'Elige uno. Es permanente.'}
          >
            <select className="control" value={c.fightingStyleId ?? ''} onChange={(e) => s.set({ fightingStyleId: e.target.value || null })}>
              <option value="">— Sin elegir —</option>
              {d.fightingStyles.map((f) => (
                <option key={f.id} value={f.id}>{f.name}{f.source === 'TCE' ? ' (Tasha\'s)' : ''}</option>
              ))}
            </select>
          </Field>
        )}
      </Plate>

      {/* ── Características ─────────────────────────────────────────────── */}
      <Plate title="Características" count="Puntuación base">
        <div className="score-editor">
          {ABILITIES.map((a) => {
            const boost = d.racialBonus[a] ?? 0
            return (
              <div key={a} className="score-cell">
                <span className="score-cell-name">
                  {ABILITY_INFO[a].short}
                  <b>{d.scores[a]} → {signed(d.mods[a])}</b>
                  {boost > 0 && <i>+{boost} racial</i>}
                </span>
                <span className="score-steps">
                  <button className="step" aria-label={`Bajar ${ABILITY_INFO[a].name}`} disabled={c.scores[a] <= 3}
                    onClick={() => s.set({ scores: { ...c.scores, [a]: c.scores[a] - 1 } })}>−</button>
                  <span className="score-num">{c.scores[a]}</span>
                  <button className="step" aria-label={`Subir ${ABILITY_INFO[a].name}`} disabled={c.scores[a] >= 20}
                    onClick={() => s.set({ scores: { ...c.scores, [a]: c.scores[a] + 1 } })}>+</button>
                </span>
              </div>
            )
          })}
        </div>
        <p className="field-hint">Introduce la puntuación antes del bono racial; la app suma el resto.</p>
      </Plate>

      {/* ── Habilidades ─────────────────────────────────────────────────── */}
      <Plate title="Competencias" count={`${c.skillProfs.length} elegidas`}>
        <p className="field-hint" style={{ marginTop: 0, marginBottom: 10 }}>
          Tu clase concede {cls.skillChoices} de esta lista. El resto suele venir del trasfondo o del linaje.
        </p>
        <div className="chips" style={{ marginBottom: 14 }}>
          {classSkills.map((sk) => (
            <button key={sk.key} className={`chip ${c.skillProfs.includes(sk.key) ? 'on' : ''}`}
              aria-pressed={c.skillProfs.includes(sk.key)} onClick={() => s.toggleSkill(sk.key)}>
              {sk.name}
            </button>
          ))}
        </div>
        <p className="tiny" style={{ marginBottom: 8 }}>Fuera de la lista de clase</p>
        <div className="chips">
          {otherSkills.map((sk) => (
            <button key={sk.key} className={`chip ${c.skillProfs.includes(sk.key) ? 'on' : ''}`}
              aria-pressed={c.skillProfs.includes(sk.key)} onClick={() => s.toggleSkill(sk.key)}>
              {sk.name}
            </button>
          ))}
        </div>
      </Plate>

      {/* ── Dotes: solo si tienes espacios ──────────────────────────────── */}
      {d.asiSlots > 0 ? (
        <Plate title="Dotes" count={`${c.featIds.length} de ${d.asiSlots}`}>
          <p className="field-hint" style={{ marginTop: 0, marginBottom: 10 }}>
            Cada espacio de mejora de característica puede gastarse en una dote. Tienes {d.asiSlots} por haber llegado
            a los niveles {d.asiLevels.filter((l) => l <= c.level).join(', ')}.
            {featsFull && ' No queda ninguno libre: quita una para cambiarla.'}
          </p>
          <div className="chips">
            {FEATS.filter((f) => c.useTashas || f.source !== 'TCE').map((f) => {
              const on = c.featIds.includes(f.id)
              return (
                <button key={f.id} className={`chip ${on ? 'on' : ''}`} disabled={!on && featsFull}
                  aria-pressed={on} onClick={() => s.toggleFeat(f.id)}>
                  {f.name}{f.source === 'TCE' ? ' ·T' : ''}
                </button>
              )
            })}
          </div>
        </Plate>
      ) : (
        <Plate title="Dotes">
          <Empty title="Aún no">El primer espacio de mejora llega en el nivel {d.asiLevels[0]}. Estás en el {c.level}.</Empty>
        </Plate>
      )}

      {/* ── Pericia: solo si tu clase la concede ───────────────────────── */}
      {d.expertiseMax > 0 && (
        <Plate title="Pericia" count={`${c.expertise.length} de ${d.expertiseMax}`}>
          <p className="field-hint" style={{ marginTop: 0, marginBottom: 10 }}>
            Dobla tu bonificador de competencia en estas habilidades. Solo puedes elegir entre las que ya dominas.
            {expertiseFull && ' No queda ninguna libre: quita una para cambiarla.'}
          </p>
          {c.skillProfs.length === 0 ? (
            <Empty title="Primero elige competencias">La pericia se aplica sobre habilidades que ya domines.</Empty>
          ) : (
            <div className="chips">
              {c.skillProfs.map((key) => {
                const sk = SKILLS.find((x) => x.key === key)
                if (!sk) return null
                const on = c.expertise.includes(key)
                return (
                  <button key={key} className={`chip ${on ? 'on' : ''}`} disabled={!on && expertiseFull}
                    aria-pressed={on} onClick={() => s.toggleExpertise(key)}>
                    {sk.name}
                  </button>
                )
              })}
            </div>
          )}
        </Plate>
      )}

      {/* ── Elecciones de clase: metamagia, disciplinas… ─────────────────── */}
      {d.choices.map(({ group, max, chosen }) => {
        const full = chosen.length >= max
        return (
          <Plate key={group.id} title={group.label} count={`${chosen.length} de ${max}`}>
            <p className="field-hint" style={{ marginTop: 0, marginBottom: 10 }}>
              {group.hint}{full ? ' Ya no queda hueco: quita una para cambiarla.' : ''}
            </p>
            <div className="chips">
              {group.options.map((o) => {
                const on = chosen.includes(o.id)
                return (
                  <button key={o.id} className={`chip ${on ? 'on' : ''}`} disabled={!on && full}
                    aria-pressed={on} onClick={() => s.toggleChoice(group.id, o.id)}>
                    {o.name}
                  </button>
                )
              })}
            </div>
            {chosen.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {chosen.map((id) => {
                  const o = group.options.find((x) => x.id === id)
                  return o ? (
                    <p key={id} className="field-hint" style={{ marginTop: 6 }}>
                      <strong style={{ color: 'var(--gold-warm)', fontWeight: 400 }}>{o.name}.</strong> {o.text}
                    </p>
                  ) : null
                })}
              </div>
            )}
          </Plate>
        )
      })}

      {/* ── Defensa ─────────────────────────────────────────────────────── */}
      <Plate title="Defensa" count={`CA ${d.ac}`}>
        <Field label="Armadura">
          <select className="control" value={c.armorId} onChange={(e) => s.set({ armorId: e.target.value })}>
            {ARMORS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.category} ({a.base}{a.dex === 'full' ? ' + DES' : a.dex === 'max2' ? ' + DES máx. 2' : ''})
              </option>
            ))}
          </select>
        </Field>
        <div className="chips" style={{ marginBottom: 14 }}>
          <button className={`chip ${c.shield ? 'on' : ''}`} aria-pressed={c.shield} onClick={() => s.set({ shield: !c.shield })}>
            Escudo +2
          </button>
        </div>
        <Field label="Bono adicional" hint="Objetos mágicos, anillos de protección, lo que sea.">
          <div className="level-picker">
            <button className="step" onClick={() => s.set({ acBonus: c.acBonus - 1 })} aria-label="Bajar bono">−</button>
            <div className="level-value">{signed(c.acBonus)}<small>a la CA</small></div>
            <button className="step" onClick={() => s.set({ acBonus: c.acBonus + 1 })} aria-label="Subir bono">+</button>
          </div>
        </Field>
        <div className="chips">
          <button className={`chip ${c.acOverride != null ? 'on warn' : ''}`}
            onClick={() => s.set({ acOverride: c.acOverride == null ? d.ac : null })}>
            {c.acOverride != null ? `CA fijada en ${c.acOverride} — toca para volver al cálculo` : 'Fijar la CA a mano'}
          </button>
          <button className={`chip ${c.maxHpOverride != null ? 'on warn' : ''}`}
            onClick={() => s.set({ maxHpOverride: c.maxHpOverride == null ? d.maxHp : null })}>
            {c.maxHpOverride != null ? `PG máximos fijados en ${c.maxHpOverride}` : 'Fijar los PG máximos a mano'}
          </button>
        </div>
        {c.acOverride != null && (
          <div className="level-picker" style={{ marginTop: 12 }}>
            <button className="step" onClick={() => s.set({ acOverride: c.acOverride! - 1 })} aria-label="Bajar CA">−</button>
            <div className="level-value">{c.acOverride}<small>clase de armadura</small></div>
            <button className="step" onClick={() => s.set({ acOverride: c.acOverride! + 1 })} aria-label="Subir CA">+</button>
          </div>
        )}
        {c.maxHpOverride != null && (
          <div className="level-picker" style={{ marginTop: 12 }}>
            <button className="step" onClick={() => s.set({ maxHpOverride: Math.max(1, c.maxHpOverride! - 1) })} aria-label="Bajar PG">−</button>
            <div className="level-value">{c.maxHpOverride}<small>puntos de golpe máximos</small></div>
            <button className="step" onClick={() => s.set({ maxHpOverride: c.maxHpOverride! + 1 })} aria-label="Subir PG">+</button>
          </div>
        )}
      </Plate>

      {/* ── Ataques ─────────────────────────────────────────────────────── */}
      <Plate title="Ataques" count={`${c.attacks.length}`}>
        {c.attacks.map((a) => (
          <div key={a.id} className="resource">
            <input className="control" value={a.name} onChange={(e) => updateAttack(a.id, { name: e.target.value })}
              aria-label="Nombre del ataque" style={{ marginBottom: 8 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <input className="control" value={a.damage} onChange={(e) => updateAttack(a.id, { damage: e.target.value })}
                aria-label="Dados de daño" placeholder="1d8" />
              <input className="control" value={a.damageType} onChange={(e) => updateAttack(a.id, { damageType: e.target.value })}
                aria-label="Tipo de daño" placeholder="Cortante" />
              <select className="control" value={a.ability} onChange={(e) => updateAttack(a.id, { ability: e.target.value as Attack['ability'] })}
                aria-label="Característica del ataque">
                {ABILITIES.map((k) => <option key={k} value={k}>{ABILITY_INFO[k].name}</option>)}
              </select>
              <div className="level-picker">
                <button className="step" onClick={() => updateAttack(a.id, { damageBonus: a.damageBonus - 1 })} aria-label="Bajar bono de daño">−</button>
                <div className="level-value" style={{ fontSize: '1.125rem' }}>{signed(a.damageBonus)}<small>daño extra</small></div>
                <button className="step" onClick={() => updateAttack(a.id, { damageBonus: a.damageBonus + 1 })} aria-label="Subir bono de daño">+</button>
              </div>
            </div>
            <input className="control" value={a.notes} onChange={(e) => updateAttack(a.id, { notes: e.target.value })}
              aria-label="Notas" placeholder="Propiedades del arma" style={{ marginBottom: 8 }} />
            <div className="chips">
              <button className={`chip ${a.proficient ? 'on' : ''}`} aria-pressed={a.proficient}
                onClick={() => updateAttack(a.id, { proficient: !a.proficient })}>
                Competente {signed(d.prof)}
              </button>
              <button className="chip" onClick={() => s.set({ attacks: c.attacks.filter((x) => x.id !== a.id) })}>
                Quitar ataque
              </button>
            </div>
          </div>
        ))}
        <button
          className="btn wide gold"
          style={{ marginTop: 12 }}
          onClick={() => s.set({
            attacks: [...c.attacks, {
              id: `atk-${Date.now()}`, name: 'Arma nueva', ability: 'str', proficient: true,
              damage: '1d8', damageType: 'Cortante', damageBonus: 0, notes: '',
            }],
          })}
        >
          Añadir ataque
        </button>
      </Plate>

      {/* ── Datos ───────────────────────────────────────────────────────── */}
      <Plate title="Tus datos">
        <p className="field-hint" style={{ marginTop: 0, marginBottom: 12 }}>
          Todo se guarda solo, dentro de este dispositivo: la ficha, las notas, la bitácora y las imágenes.
          Nada sale de aquí, y por eso nadie más puede recuperarlo por ti.
        </p>

        {salud && (
          <div className="health">
            <div className="health-row">
              <span className={`health-dot ${salud.persistente ? 'ok' : 'warn'}`} aria-hidden="true" />
              <span>{salud.persistente ? 'Protegido contra borrado automático' : 'Sin protección contra borrado automático'}</span>
              {!salud.persistente && <button className="btn small" onClick={pedirPersistencia}>Pedirla</button>}
            </div>
            <div className="health-row">
              <span className={`health-dot ${salud.indexedDB ? 'ok' : 'warn'}`} aria-hidden="true" />
              <span>{salud.indexedDB ? 'Almacén de imágenes y diario disponible' : 'Sin almacén: la galería no funcionará'}</span>
            </div>
            <div className="health-row">
              <span className={`health-dot ${salud.localStorage ? 'ok' : 'warn'}`} aria-hidden="true" />
              <span>{salud.localStorage ? 'Copia de seguridad de la ficha activa' : 'La ficha no se está guardando'}</span>
              {salud.usadoMB != null && (
                <span className="health-value">
                  {salud.usadoMB < 1 ? `${(salud.usadoMB * 1024).toFixed(0)} KB` : `${salud.usadoMB.toFixed(1)} MB`} usados
                </span>
              )}
            </div>
            <div className="health-row">
              <span className={`health-dot ${copia.dias == null ? 'warn' : copia.dias > 14 ? 'warn' : 'ok'}`} aria-hidden="true" />
              <span>
                {copia.dias == null
                  ? 'Nunca has guardado una copia fuera del teléfono'
                  : copia.dias === 0 ? 'Última copia: hoy'
                  : `Última copia: hace ${copia.dias} día${copia.dias === 1 ? '' : 's'}`}
              </span>
            </div>
          </div>
        )}

        {salud?.iosSinInstalar && (
          <p className="field-hint" style={{ color: 'var(--blood)', marginBottom: 12 }}>
            <strong style={{ fontWeight: 400 }}>Estás en Safari, no en la app.</strong> iOS borra los datos de
            una web si pasan siete días sin abrirla. Toca el botón de compartir de Safari y elige
            <em> Añadir a pantalla de inicio</em>: las apps instaladas así no se borran solas.
          </p>
        )}

        {salud && !salud.persistente && !salud.iosSinInstalar && (
          <p className="field-hint" style={{ color: 'var(--gold-warm)', marginBottom: 12 }}>
            Sin esa protección, el sistema puede borrar los datos de la app si el teléfono se queda sin espacio.
            Pídela con el botón, y guarda una copia de vez en cuando de todos modos.
          </p>
        )}

        <p className="tiny" style={{ marginBottom: 8 }}>Guardar una copia</p>
        <div className="btn-row">
          <button className="btn gold" onClick={() => guardarCopia(false)}>Ficha y diario</button>
          <button
            className="btn"
            onClick={() => guardarCopia(true)}
            disabled={j.fotosCargadas && j.photos.length === 0}
          >
            {j.fotosCargadas
              ? `Todo, con ${j.photos.length} ${j.photos.length === 1 ? 'imagen' : 'imágenes'}`
              : 'Todo, con imágenes'}
          </button>
        </div>

        <p className="tiny" style={{ margin: '16px 0 8px' }}>Restaurar o mover a otro teléfono</p>
        <div className="btn-row">
          <button className="btn" onClick={() => importRef.current?.click()}>Cargar archivo</button>
          <button className="btn" onClick={async () => {
            if (pasteOpen) { setPasteOpen(false); return }
            setPasteText(backupToText(await buildBackup(c, j.exportData(), false)))
            setPasteOpen(true)
            setTransferMsg(null)
          }}>
            {pasteOpen ? 'Cerrar texto' : 'Copiar o pegar texto'}
          </button>
          <button className={`btn ${confirmReset ? 'danger' : ''}`} onClick={() => {
            if (confirmReset) { s.reset(); setConfirmReset(false) } else setConfirmReset(true)
          }}>
            {confirmReset ? 'Confirmar: borrar la ficha' : 'Restablecer ficha'}
          </button>
        </div>

        {transferMsg && (
          <p className="field-hint" style={{ color: transferOk ? 'var(--gold-warm)' : 'var(--blood)' }}>{transferMsg}</p>
        )}

        {pasteOpen && (
          <div style={{ marginTop: 12 }}>
            <textarea
              className="control"
              rows={6}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              aria-label="Copia en formato JSON"
              spellCheck={false}
              style={{ fontFamily: 'var(--data)', fontSize: '0.75rem', lineHeight: 1.45 }}
            />
            <p className="field-hint">
              Selecciona todo y cópialo para guardarlo donde quieras, o pega aquí una copia anterior.
              Por texto no viajan las imágenes: para esas, usa el archivo.
            </p>
            <button className="btn wide gold" onClick={() => applyText(pasteText)}>Restaurar desde este texto</button>
          </div>
        )}

        {confirmReset && (
          <p className="field-hint" style={{ color: 'var(--blood)' }}>
            Devuelve la ficha a Âreen Velthar nivel 3. Tus notas, bitácora e imágenes no se tocan.
            Toca otra vez para confirmar.
          </p>
        )}
        <input ref={importRef} type="file" accept="application/json,.json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importSheet(f); e.target.value = '' }} />

        <p className="note-data" style={{ marginTop: 16 }}>
          {versionAndroid()
            ? `App de Android · versión ${versionAndroid()}`
            : `Versión ${__APP_VERSION__} · en el navegador`}
        </p>
      </Plate>
    </>
  )
}
