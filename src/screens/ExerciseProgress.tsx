import { useLiveQuery } from 'dexie-react-hooks'
import { type ReactNode, useState } from 'react'
import { ExerciseImage } from '../components/ExerciseImage'
import { Header } from '../components/Header'
import { Icon } from '../components/Icon'
import { TrendChart } from '../components/TrendChart'
import { E1RM_RELIABLE_MAX_REPS, frequency, records, scoreSets, type SessionStat, sessionStats } from '../lib/analytics'
import { db } from '../lib/db'
import { go } from '../lib/router'
import { useSettings } from '../lib/settings'
import type { Unit } from '../lib/types'
import { daysAgo, fmtDuration, fmtShortDate, fmtVolume, fmtWeight, kgToUnit, round } from '../lib/units'

function Tile({ label, value, children }: { label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div className="card p-3">
      <div className="label">{label}</div>
      <div className="mt-1 text-2xl leading-tight font-bold tabular-nums">{value}</div>
      {children && <div className="mt-0.5 text-sm text-zinc-400">{children}</div>}
    </div>
  )
}

interface Metric {
  key: string
  label: string
  value: (s: SessionStat) => number
  format: (v: number, unit: Unit) => string
  /** Weights are stored in kg and need converting for the chart axis. */
  isWeight?: boolean
  note?: string
}

const WEIGHTED: Metric[] = [
  { key: 'e1rm', label: 'Est. 1-rep max', value: (s) => s.bestE1rm, format: (v, u) => `${round(v, 1)} ${u}`, isWeight: true },
  { key: 'max', label: 'Max weight', value: (s) => s.maxWeight, format: (v, u) => `${round(v, 1)} ${u}`, isWeight: true },
  { key: 'volume', label: 'Volume', value: (s) => s.volume, format: (v, u) => `${Math.round(v).toLocaleString()} ${u}`, isWeight: true },
]
const BODYWEIGHT: Metric[] = [
  { key: 'bestReps', label: 'Best reps', value: (s) => s.bestReps, format: (v) => `${v} reps` },
  { key: 'reps', label: 'Total reps', value: (s) => s.reps, format: (v) => `${v} reps` },
]
const DIFFICULTY: Metric = {
  key: 'difficulty',
  label: 'Difficulty',
  value: (s) => s.difficulty,
  format: (v) => `${Math.round(v)} / 100`,
  note: '100 means as hard as your best ever at the time. Over 100 is a new best.',
}

export function ExerciseProgress({ id }: { id: string }) {
  const { unit } = useSettings()
  const exercise = useLiveQuery(async () => (await db.exercises.get(id)) ?? null, [id])
  const sets = useLiveQuery(() => db.sets.where('exerciseId').equals(id).toArray(), [id])
  const [metricKey, setMetricKey] = useState<string>()

  if (exercise === undefined || !sets) return <Header title="" backTo="progress" />
  if (exercise === null) return <Header title="Exercise not found" backTo="progress" />

  const scored = scoreSets(sets)
  const stats = sessionStats(scored)
  const rec = records(scored)
  const freq = frequency(stats)
  const last = stats[stats.length - 1]
  const weighted = rec.maxWeight !== null

  const metrics = [...(weighted ? WEIGHTED : BODYWEIGHT), DIFFICULTY]
  const metric = metrics.find((m) => m.key === metricKey) ?? metrics[0]
  const toUnit = (v: number) => (metric.isWeight ? kgToUnit(v, unit) : v)

  return (
    <>
      <Header
        title={exercise.name}
        subtitle={`${exercise.muscle} · ${exercise.equipment}`}
        backTo="progress"
        right={
          exercise.custom && (
            <button className="btn btn-ghost" onClick={() => go(`exercise/edit/${id}`)}>
              <Icon name="edit" size={18} /> Edit
            </button>
          )
        }
      />
      <div className="space-y-3 p-3">
        <ExerciseImage exercise={exercise} className="aspect-[3/2] max-h-52 w-full" />

        {!last ? (
          <div className="card p-4 text-zinc-400">No sets logged yet. Do this exercise in a workout and your numbers show up here.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Tile label="Max weight" value={rec.maxWeight ? fmtWeight(rec.maxWeight.weight, unit) : '–'}>
                {rec.maxWeight ? `× ${rec.maxWeight.reps} · ${fmtShortDate(rec.maxWeight.doneAt)}` : 'Bodyweight exercise'}
              </Tile>
              <Tile label="Est. 1-rep max" value={rec.bestE1rm ? fmtWeight(rec.bestE1rm.e1rm, unit) : '–'}>
                {rec.bestE1rm ? (
                  <>
                    from {fmtWeight(rec.bestE1rm.weight, unit)} × {rec.bestE1rm.reps}
                    {rec.bestE1rm.reps > E1RM_RELIABLE_MAX_REPS && (
                      <span className="block text-amber-300">Rough guess: over {E1RM_RELIABLE_MAX_REPS} reps</span>
                    )}
                  </>
                ) : (
                  'Needs a weight'
                )}
              </Tile>
              <Tile label="Best reps" value={rec.bestReps?.reps ?? '–'}>
                {rec.bestReps && rec.bestReps.weight > 0 ? `at ${fmtWeight(rec.bestReps.weight, unit)}` : 'bodyweight'}
              </Tile>
              <Tile label="Difficulty score" value={Math.round(last.difficulty)}>
                last session · top set {Math.round(last.topDifficulty)}
              </Tile>
              <Tile label="Volume" value={weighted ? fmtVolume(last.volume, unit) : '–'}>
                last session{weighted ? ` · best ${fmtVolume(Math.max(...stats.map((s) => s.volume)), unit)}` : ''}
              </Tile>
              <Tile label="Sets and reps" value={`${last.sets} × ${round(last.reps / last.sets, 1)}`}>
                last session · {last.reps} reps in total
              </Tile>
              <div className="col-span-2">
                <Tile label="How often" value={`${round(freq.perWeek, 1)}× a week`}>
                  {freq.sessions} session{freq.sessions > 1 ? 's' : ''} · {freq.last30Days} in the last 30 days · last trained{' '}
                  {daysAgo(last.date)}
                </Tile>
              </div>
            </div>

            <div className="card p-3">
              <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-3 [scrollbar-width:none]">
                {metrics.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMetricKey(m.key)}
                    aria-pressed={metric.key === m.key}
                    className={`min-h-12 shrink-0 rounded-full px-4 font-semibold ${
                      metric.key === m.key ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <h3 className="px-1 pb-1 font-semibold">
                {metric.label} per session{metric.isWeight ? ` (${unit})` : ''}
              </h3>
              <TrendChart
                name={metric.label}
                data={stats.map((s) => ({ date: s.date, value: round(toUnit(metric.value(s)), 1) }))}
                format={(v) => metric.format(v, unit)}
                referenceAt={metric.key === 'difficulty' ? 100 : undefined}
                referenceLabel="Your best"
              />
              {metric.note && <p className="px-1 pt-2 text-sm text-zinc-400">{metric.note}</p>}
              {stats.length < 2 && <p className="px-1 pt-2 text-sm text-zinc-400">The line appears after your second session.</p>}
            </div>

            <div className="card p-3">
              <h3 className="label mb-1">Most reps at each weight</h3>
              <table className="w-full tabular-nums">
                <tbody className="divide-y divide-zinc-800">
                  {rec.repPRs.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 font-semibold">{s.weight > 0 ? fmtWeight(s.weight, unit) : 'Bodyweight'}</td>
                      <td className="py-2">{s.reps} reps</td>
                      <td className="py-2 text-right text-sm text-zinc-400">{fmtShortDate(s.doneAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card p-3">
              <h3 className="label mb-1">Every session</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap tabular-nums">
                  <thead className="text-left text-zinc-400">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Date</th>
                      <th className="py-2 pr-3 font-medium">Sets</th>
                      <th className="py-2 pr-3 font-medium">Reps</th>
                      {weighted && <th className="py-2 pr-3 font-medium">Volume</th>}
                      <th className="py-2 pr-3 font-medium">Difficulty</th>
                      <th className="py-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {[...stats].reverse().map((s) => (
                      <tr key={s.workoutId} onClick={() => go(`history/${s.workoutId}`)}>
                        <td className="py-2 pr-3 font-semibold">{fmtShortDate(s.date)}</td>
                        <td className="py-2 pr-3">{s.sets}</td>
                        <td className="py-2 pr-3">{s.reps}</td>
                        {weighted && <td className="py-2 pr-3">{fmtVolume(s.volume, unit)}</td>}
                        <td className="py-2 pr-3">{Math.round(s.difficulty)}</td>
                        <td className="py-2">{s.sets > 1 ? fmtDuration(s.durationMs) : '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
