import { useLiveQuery } from 'dexie-react-hooks'
import { ExerciseImage } from '../components/ExerciseImage'
import { Header } from '../components/Header'
import { Icon } from '../components/Icon'
import { e1rm, heatmap, type PRKind, recentPRs, type ScoredSet, workoutsThisWeek } from '../lib/analytics'
import { db } from '../lib/db'
import { go } from '../lib/router'
import { useSettings } from '../lib/settings'
import type { Unit } from '../lib/types'
import { daysAgo, fmtDate, fmtWeight } from '../lib/units'

const HEAT_WEEKS = 16

/** One hue, darker = fewer sets, so the busiest days stand out on the dark background. */
function heatClass(sets: number): string {
  if (sets === 0) return 'bg-zinc-800'
  if (sets < 8) return 'bg-lime-800'
  if (sets < 16) return 'bg-lime-600'
  return 'bg-lime-400'
}

function prText(kind: PRKind, s: ScoredSet, unit: Unit): string {
  if (kind === 'weight') return `Heaviest: ${fmtWeight(s.weight, unit)} × ${s.reps}`
  if (kind === 'e1rm') return `Best est. 1-rep max: ${fmtWeight(e1rm(s.weight, s.reps), unit)}`
  return s.weight > 0 ? `Most reps at ${fmtWeight(s.weight, unit)}: ${s.reps}` : `Most reps: ${s.reps}`
}

export function Progress() {
  const { unit } = useSettings()
  const workouts = useLiveQuery(() => db.workouts.toArray(), [])
  const sets = useLiveQuery(() => db.sets.filter((s) => s.done).toArray(), [])
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  if (!workouts || !sets || !exercises) return <Header title="Progress" />

  const finished = workouts.filter((w) => w.endedAt)
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const cols = heatmap(sets, HEAT_WEEKS)
  const prs = recentPRs(sets, 6)

  const lastTrained = new Map<string, number>()
  for (const s of sets) lastTrained.set(s.exerciseId, Math.max(lastTrained.get(s.exerciseId) ?? 0, s.doneAt ?? 0))
  const trained = [...lastTrained.entries()].sort((a, b) => b[1] - a[1])

  return (
    <>
      <Header title="Progress" />
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="label">This week</div>
            <div className="text-4xl font-bold tabular-nums">{workoutsThisWeek(workouts)}</div>
            <div className="text-sm text-zinc-400">workouts</div>
          </div>
          <div className="card p-4">
            <div className="label">All time</div>
            <div className="text-4xl font-bold tabular-nums">{finished.length}</div>
            <div className="text-sm text-zinc-400">workouts</div>
          </div>
        </div>

        <div className="card p-4">
          <div className="label mb-3">Last {HEAT_WEEKS} weeks</div>
          <div className="flex gap-1" role="img" aria-label={`Training days over the last ${HEAT_WEEKS} weeks`}>
            <div className="flex flex-col justify-between py-0.5 pr-1 text-[10px] leading-none text-zinc-500">
              <span>Mon</span>
              <span>Thu</span>
              <span>Sun</span>
            </div>
            {cols.map((col) => (
              <div key={col[0].date} className="flex flex-1 flex-col gap-1">
                {col.map((d) => (
                  <div
                    key={d.date}
                    title={`${fmtDate(d.date)}: ${d.sets} sets`}
                    className={`aspect-square w-full rounded-[3px] ${d.future ? 'bg-transparent' : heatClass(d.sets)}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1 text-xs text-zinc-400">
            <span className="mr-1">Rest day</span>
            {[0, 1, 8, 16].map((n) => (
              <span key={n} className={`h-3 w-3 rounded-[3px] ${heatClass(n)}`} />
            ))}
            <span className="ml-1">Big day</span>
          </div>
        </div>

        <div className="card p-4">
          <div className="label mb-2">Recent records</div>
          {prs.length ? (
            <ul className="divide-y divide-zinc-800">
              {prs.map((p) => (
                <li key={p.id}>
                  <button
                    className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
                    onClick={() => go(`progress/${p.exerciseId}`)}
                  >
                    <Icon name="trophy" className="shrink-0 text-lime-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{byId.get(p.exerciseId)?.name ?? 'Exercise'}</span>
                      <span className="block truncate text-sm text-zinc-300">{prText(p.prs[0], p, unit)}</span>
                    </span>
                    <span className="shrink-0 text-sm text-zinc-400">{daysAgo(p.doneAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-400">Beat a previous best and it shows up here.</p>
          )}
        </div>

        <h2 className="label pt-2">Your exercises</h2>
        {trained.length ? (
          <ul className="card divide-y divide-zinc-800 px-3">
            {trained.map(([id, when]) => {
              const e = byId.get(id)
              if (!e) return null
              return (
                <li key={id}>
                  <button className="flex min-h-16 w-full items-center gap-3 py-2 text-left" onClick={() => go(`progress/${id}`)}>
                    <ExerciseImage exercise={e} className="h-12 w-12" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{e.name}</span>
                      <span className="block text-sm text-zinc-400">Last trained {daysAgo(when)}</span>
                    </span>
                    <Icon name="right" className="shrink-0 text-zinc-600" />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="card p-4 text-zinc-400">
            Finish a workout and your numbers appear here. Want a preview first? Load sample data in{' '}
            <button className="font-semibold text-lime-400 underline" onClick={() => go('settings')}>
              Settings
            </button>
            .
          </div>
        )}
      </div>
    </>
  )
}
