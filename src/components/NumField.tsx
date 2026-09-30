import { useState } from 'react'
import { round } from '../lib/units'
import { Icon } from './Icon'

/** Big number box with − / + buttons either side. Typing and stepping both save straight away. */
export function NumField({
  value,
  onChange,
  step,
  label,
  decimal,
  confirmed,
  className = '',
}: {
  value: number | null
  onChange: (value: number | null) => void
  step: number
  label: string
  decimal?: boolean
  /** Unconfirmed numbers are shown greyed, like a suggestion. */
  confirmed?: boolean
  className?: string
}) {
  // While focused the field shows exactly what was typed (so "62." isn't reformatted mid-entry).
  const [draft, setDraft] = useState<string | null>(null)

  const type = (text: string) => {
    const clean = text.replace(',', '.').replace(decimal ? /[^0-9.]/g : /[^0-9]/g, '')
    setDraft(clean)
    const n = parseFloat(clean)
    onChange(clean === '' || !Number.isFinite(n) ? null : n)
  }
  const bump = (dir: 1 | -1) => {
    setDraft(null)
    onChange(Math.max(0, round((value ?? 0) + dir * step)))
  }

  const stepBtn = 'grid w-10 shrink-0 place-items-center text-zinc-300 active:bg-zinc-700'
  return (
    <div className={`flex h-12 min-w-0 items-stretch overflow-hidden rounded-xl bg-zinc-800 ${className}`}>
      <button type="button" className={stepBtn} onClick={() => bump(-1)} aria-label={`Less ${label}`}>
        <Icon name="minus" size={20} />
      </button>
      <input
        className={`w-full min-w-0 bg-transparent text-center text-lg font-bold tabular-nums outline-none placeholder:text-zinc-600 focus:bg-zinc-700 ${confirmed ? 'text-zinc-50' : 'text-zinc-400'}`}
        inputMode={decimal ? 'decimal' : 'numeric'}
        enterKeyHint="done"
        aria-label={label}
        placeholder="0"
        value={draft ?? (value == null ? '' : String(value))}
        onFocus={(e) => {
          setDraft(value == null ? '' : String(value))
          e.currentTarget.select()
        }}
        onBlur={() => setDraft(null)}
        onChange={(e) => type(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      <button type="button" className={stepBtn} onClick={() => bump(1)} aria-label={`More ${label}`}>
        <Icon name="plus" size={20} />
      </button>
    </div>
  )
}
