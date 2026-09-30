import { useRef, useState } from 'react'
import type { ScoredSet } from '../lib/analytics'
import type { SetEntry, Unit } from '../lib/types'
import { kgToUnit, unitToKg } from '../lib/units'
import { Icon } from './Icon'
import { NumField } from './NumField'

const SWIPE_TO_REMOVE = 90

export function SetRow({
  set,
  index,
  unit,
  step,
  scored,
  onChange,
  onToggle,
  onRemove,
}: {
  set: SetEntry
  index: number
  unit: Unit
  step: number
  /** Present once the set is ticked. */
  scored?: ScoredSet
  onChange: (patch: { weight?: number | null; reps?: number | null }) => void
  onToggle: () => void
  onRemove: () => void
}) {
  const [dx, setDx] = useState(0)
  const touch = useRef<{ x: number; y: number; swiping: boolean } | null>(null)

  return (
    <div className="relative overflow-hidden rounded-xl">
      {dx < 0 && (
        <div className="absolute inset-0 flex items-center justify-end bg-red-500/20 pr-4 font-semibold text-red-300">
          Remove
        </div>
      )}
      <div
        className="relative bg-zinc-900 py-1"
        style={{ transform: `translateX(${dx}px)`, transition: dx ? 'none' : 'transform 0.15s' }}
        onTouchStart={(e) => {
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, swiping: false }
        }}
        onTouchMove={(e) => {
          const t = touch.current
          if (!t) return
          const mx = e.touches[0].clientX - t.x
          const my = e.touches[0].clientY - t.y
          // Only treat it as a swipe once it is clearly sideways, so scrolling the page still works.
          if (!t.swiping && Math.abs(mx) > 12 && Math.abs(mx) > Math.abs(my) * 1.5) t.swiping = true
          if (t.swiping) setDx(Math.min(0, mx))
        }}
        onTouchEnd={() => {
          touch.current = null
          if (dx < -SWIPE_TO_REMOVE) onRemove()
          setDx(0)
        }}
      >
        <div className="flex items-center gap-1">
          <span className="w-4 shrink-0 text-center text-sm font-semibold text-zinc-500">{index + 1}</span>
          <NumField
            className="flex-[1.15]"
            label={`weight in ${unit}, set ${index + 1}`}
            decimal
            step={step}
            confirmed={set.done}
            value={set.weight == null ? null : kgToUnit(set.weight, unit)}
            onChange={(v) => onChange({ weight: v == null ? null : unitToKg(v, unit) })}
          />
          <NumField
            className="flex-1"
            label={`reps, set ${index + 1}`}
            step={1}
            confirmed={set.done}
            value={set.reps}
            onChange={(v) => onChange({ reps: v })}
          />
          <button
            onClick={onToggle}
            aria-label={set.done ? `Set ${index + 1} done. Tap to undo` : `Mark set ${index + 1} done`}
            aria-pressed={set.done}
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition active:scale-90 ${
              set.done ? 'bg-lime-400 text-zinc-950' : 'border-2 border-zinc-600 text-zinc-500'
            }`}
          >
            <Icon name="check" size={26} />
          </button>
        </div>
        {scored && (
          <div className="flex items-center gap-2 pt-1 pl-5 text-xs text-zinc-400">
            <span>
              Difficulty <b className="text-sm text-zinc-100 tabular-nums">{Math.round(scored.difficulty)}</b>
            </span>
            <span className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800">
              <span
                className="block h-full rounded-full bg-lime-400"
                style={{ width: `${Math.min(100, scored.difficulty)}%` }}
              />
            </span>
            {scored.prs.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-lime-400 px-2 py-0.5 font-bold text-zinc-950">
                <Icon name="trophy" size={12} /> Record
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
