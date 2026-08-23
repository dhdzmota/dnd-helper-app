import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from 'react'

export function Plate({
  title, count, children, flat, className = '',
}: { title?: string; count?: ReactNode; children: ReactNode; flat?: boolean; className?: string }) {
  return (
    <section className={`plate ${flat ? 'flat' : ''} ${className}`}>
      {title && (
        <h2 className="eyebrow">
          {title}
          {count != null && <span className="count">{count}</span>}
        </h2>
      )}
      {children}
    </section>
  )
}

/**
 * A row of spend marks. Tapping a mark spends everything up to it; tapping an
 * already-spent mark gives it and everything after it back.
 */
export function Tally({
  max, spent, onChange, diamond, label, disabled,
}: {
  max: number
  spent: number
  onChange: (next: number) => void
  diamond?: boolean
  label?: string
  disabled?: boolean
}) {
  if (max <= 0) return null
  return (
    <div className="mark-group">
      {label && <span className="mark-label">{label}</span>}
      <div className="marks">
        {Array.from({ length: max }, (_, i) => {
          const isSpent = i < spent
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              className={`mark ${diamond ? 'diamond' : ''} ${isSpent ? 'spent' : ''}`}
              aria-label={`${label ?? 'Uso'} ${i + 1} de ${max}: ${isSpent ? 'gastado' : 'disponible'}`}
              aria-pressed={isSpent}
              onClick={() => onChange(isSpent ? i : i + 1)}
            />
          )
        })}
      </div>
    </div>
  )
}

/** One spendable resource: a tally of uses, or a numeric pool with spend buttons. */
export function Resource({
  name, detail, recharge, kind, max, spent, onSet, poolSteps = [1, 5, 10],
}: {
  name: string
  detail?: string
  recharge: 'short' | 'long'
  kind: 'uses' | 'pool'
  max: number
  spent: number
  onSet: (next: number) => void
  poolSteps?: number[]
}) {
  const left = max - spent
  return (
    <div className="resource">
      <div className="resource-head">
        <span className="resource-name">{name}</span>
        <span className="recharge">{recharge === 'short' ? 'Descanso corto' : 'Descanso largo'}</span>
      </div>
      {detail && <p className="resource-detail">{detail}</p>}

      {kind === 'pool' ? (
        <>
          <div className="pool-nums">
            <span className="pool-cur">{left}</span>
            <span className="pool-max">/ {max}</span>
            <span className="spacer" />
            <button className="btn small" disabled={spent === 0} onClick={() => onSet(spent - 1)}>Devolver 1</button>
          </div>
          <div className="pool-bar">
            <div className="pool-fill" style={{ width: `${max > 0 ? (left / max) * 100 : 0}%` }} />
          </div>
          <div className="btn-row">
            {poolSteps.filter((n) => n <= max).map((n) => (
              <button key={n} className="btn" disabled={left < n} onClick={() => onSet(spent + n)}>
                Gastar {n}
              </button>
            ))}
          </div>
        </>
      ) : (
        <Tally max={max} spent={spent} onChange={onSet} label={max > 1 ? `${left} de ${max}` : undefined} />
      )}
    </div>
  )
}

export function Collapse({
  head, children, defaultOpen = false,
}: { head: (open: boolean) => ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <>
      <button type="button" className="feature-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {head(open)}
      </button>
      {open && children}
    </>
  )
}

export function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`chev ${open ? 'open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children}
    </div>
  )
}

/**
 * Rótulo y control. Cuando el hijo es un único control, el rótulo queda
 * asociado a él para que los lectores de pantalla lo anuncien.
 */
export function Field({
  label, hint, children,
}: { label: string; hint?: ReactNode; children: ReactNode }) {
  const id = useId()
  const single = isValidElement(children)
  const control = single
    ? cloneElement(children as ReactElement<{ id?: string }>, { id })
    : children
  return (
    <div className="field">
      {single
        ? <label className="field-label" htmlFor={id}>{label}</label>
        : <span className="field-label">{label}</span>}
      {control}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const ICONS = {
  hero: (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...P}>
      <path d="M12 3l7 2.5v6c0 4.2-2.8 7.6-7 9.5-4.2-1.9-7-5.3-7-9.5v-6L12 3z" />
      <path d="M12 8v7M9.5 10.5h5" />
    </svg>
  ),
  combat: (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...P}>
      <path d="M6 3l9.5 12.5M18 3L8.5 15.5" />
      <path d="M4.5 18.5l3 3M19.5 18.5l-3 3" />
      <path d="M6 21l2-2M18 21l-2-2" />
    </svg>
  ),
  spells: (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...P}>
      <path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3L3.5 11l6.3-2.2L12 2.5z" />
      <path d="M18.5 17.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
    </svg>
  ),
  traits: (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...P}>
      <path d="M6 3h11a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
      <path d="M8 8h7M8 12h7M8 16h4" />
    </svg>
  ),
  journal: (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...P}>
      <path d="M4 4.5A1.5 1.5 0 015.5 3H18a1 1 0 011 1v15a1 1 0 01-1 1H5.5A1.5 1.5 0 014 18.5v-14z" />
      <path d="M4 17.5A1.5 1.5 0 015.5 16H19" />
      <path d="M8 7.5h7M8 11h5" />
    </svg>
  ),
  sheet: (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...P}>
      <path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h9M17 17h3" />
      <circle cx="16" cy="7" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="15" cy="17" r="2" />
    </svg>
  ),
}
