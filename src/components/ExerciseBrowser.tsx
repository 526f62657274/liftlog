import { useLiveQuery } from 'dexie-react-hooks'
import { type ReactNode, useState } from 'react'
import { db } from '../lib/db'
import { type Exercise, MUSCLES, type Muscle } from '../lib/types'
import { ExerciseImage } from './ExerciseImage'
import { Icon } from './Icon'

/** Search box + muscle chips + the matching exercises. Shared by the library tab and the picker. */
export function ExerciseBrowser({
  onPick,
  exclude = [],
  trailing,
  footer,
}: {
  onPick: (exercise: Exercise) => void
  exclude?: string[]
  /** What to show at the right-hand end of each row. */
  trailing: (exercise: Exercise) => ReactNode
  footer?: ReactNode
}) {
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<Muscle | 'All'>('All')
  const all = useLiveQuery(() => db.exercises.toArray(), [])

  const q = query.trim().toLowerCase()
  const shown = (all ?? [])
    .filter((e) => !exclude.includes(e.id))
    .filter((e) => muscle === 'All' || e.muscle === muscle)
    .filter((e) => !q || `${e.name} ${e.equipment} ${e.muscle}`.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <div className="sticky top-0 z-10 space-y-2 bg-zinc-950 px-3 pt-3 pb-2">
        <label className="relative block">
          <Icon name="search" size={20} className="absolute top-3.5 left-3 text-zinc-500" />
          <input
            className="field pl-10"
            type="search"
            placeholder="Search exercises"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
          {(['All', ...MUSCLES] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMuscle(m)}
              aria-pressed={muscle === m}
              className={`min-h-12 shrink-0 rounded-full px-4 font-semibold ${
                muscle === m ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <ul className="px-3">
        {shown.map((e) => (
          <li key={e.id}>
            <button
              className="flex min-h-16 w-full items-center gap-3 border-b border-zinc-800/70 py-2 text-left active:bg-zinc-900"
              onClick={() => onPick(e)}
            >
              <ExerciseImage exercise={e} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{e.name}</span>
                <span className="block truncate text-sm text-zinc-400">
                  {e.muscle} · {e.equipment}
                </span>
              </span>
              {trailing(e)}
            </button>
          </li>
        ))}
      </ul>
      {all && shown.length === 0 && <p className="px-3 py-8 text-center text-zinc-400">No exercises match.</p>}
      {footer}
    </>
  )
}
