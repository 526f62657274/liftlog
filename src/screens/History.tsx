import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { ExerciseImage } from '../components/ExerciseImage'
import { Header } from '../components/Header'
import { Icon } from '../components/Icon'
import { ConfirmSheet } from '../components/Sheet'
import { deleteWorkout } from '../lib/actions'
import { scoreSets } from '../lib/analytics'
import { db } from '../lib/db'
import { go } from '../lib/router'
import { useSettings } from '../lib/settings'
import { fmtDate, fmtDuration, fmtTime, fmtVolume, fmtWeight } from '../lib/units'

export function History() {
  const { unit } = useSettings()
  const workouts = useLiveQuery(() => db.workouts.orderBy('startedAt').reverse().toArray(), [])
  const sets = useLiveQuery(() => db.sets.filter((s) => s.done).toArray(), [])
  if (!workouts || !sets) return <Header title="History" />

  const finished = workouts.filter((w) => w.endedAt)
  return (
    <>
      <Header title="History" />
      <div className="space-y-3 p-3">
        {!finished.length && <div className="card p-4 text-zinc-400">Your finished workouts will be listed here.</div>}
        {finished.map((w) => {
          const mine = sets.filter((s) => s.workoutId === w.id)
          const volume = mine.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0)
          return (
            <button key={w.id} className="card block w-full p-4 text-left" onClick={() => go(`history/${w.id}`)}>
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-lg font-bold">{w.name}</div>
                <Icon name="right" className="shrink-0 text-zinc-600" />
              </div>
              <div className="text-sm text-zinc-300">
                {fmtDate(w.startedAt)} · {fmtTime(w.startedAt)}
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                {fmtDuration((w.endedAt ?? w.startedAt) - w.startedAt)} · {w.exerciseIds.length} exercise
                {w.exerciseIds.length === 1 ? '' : 's'} · {mine.length} sets{volume > 0 ? ` · ${fmtVolume(volume, unit)}` : ''}
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

export function HistoryDetail({ id }: { id: string }) {
  const { unit } = useSettings()
  const workout = useLiveQuery(async () => (await db.workouts.get(id)) ?? null, [id])
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  // Scores compare against everything lifted before, so load the full history of these exercises.
  const allSets = useLiveQuery(
    () => (workout ? db.sets.where('exerciseId').anyOf(workout.exerciseIds).toArray() : []),
    [workout?.id],
  )
  const [deleting, setDeleting] = useState(false)

  if (workout === undefined || !exercises || !allSets) return <Header title="Workout" backTo="history" />
  if (workout === null) return <Header title="Workout not found" backTo="history" />

  const byId = new Map(exercises.map((e) => [e.id, e]))
  const perExercise = workout.exerciseIds.map((eid) => ({
    exercise: byId.get(eid),
    sets: scoreSets(allSets.filter((s) => s.exerciseId === eid)).filter((s) => s.workoutId === id),
  }))
  const mine = perExercise.flatMap((p) => p.sets)
  const volume = mine.reduce((sum, s) => sum + s.weight * s.reps, 0)
  const recordCount = mine.filter((s) => s.prs.length).length
  const end = workout.endedAt ?? workout.startedAt

  return (
    <>
      <Header title={workout.name} subtitle={fmtDate(workout.startedAt)} backTo="history" />
      <div className="space-y-3 p-3">
        <div className="card grid grid-cols-2 gap-x-3 gap-y-4 p-4">
          <div>
            <div className="label">Started</div>
            <div className="text-xl font-bold tabular-nums">{fmtTime(workout.startedAt)}</div>
          </div>
          <div>
            <div className="label">Finished</div>
            <div className="text-xl font-bold tabular-nums">{fmtTime(end)}</div>
          </div>
          <div>
            <div className="label">Duration</div>
            <div className="text-xl font-bold">{fmtDuration(end - workout.startedAt)}</div>
          </div>
          <div>
            <div className="label">Sets</div>
            <div className="text-xl font-bold tabular-nums">{mine.length}</div>
          </div>
          {volume > 0 && (
            <div>
              <div className="label">Volume</div>
              <div className="text-xl font-bold tabular-nums">{fmtVolume(volume, unit)}</div>
            </div>
          )}
          <div>
            <div className="label">Records</div>
            <div className="flex items-center gap-1 text-xl font-bold tabular-nums">
              {recordCount > 0 && <Icon name="trophy" size={20} className="text-lime-400" />}
              {recordCount}
            </div>
          </div>
        </div>

        {perExercise.map(({ exercise, sets }) => {
          if (!exercise || !sets.length) return null
          const times = sets.map((s) => s.doneAt)
          return (
            <section key={exercise.id} className="card p-3">
              <button className="flex w-full items-center gap-3 text-left" onClick={() => go(`progress/${exercise.id}`)}>
                <ExerciseImage exercise={exercise} className="h-12 w-12" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{exercise.name}</span>
                  <span className="block text-sm text-zinc-400">
                    {sets.length > 1 ? `${fmtDuration(Math.max(...times) - Math.min(...times))} on this exercise` : '1 set'}
                  </span>
                </span>
                <Icon name="right" className="shrink-0 text-zinc-600" />
              </button>
              <table className="mt-2 w-full tabular-nums">
                <thead className="text-left text-xs text-zinc-400">
                  <tr>
                    <th className="w-8 py-1 font-medium">Set</th>
                    <th className="py-1 font-medium">Lifted</th>
                    <th className="py-1 text-right font-medium">Difficulty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {sets.map((s, i) => (
                    <tr key={s.id}>
                      <td className="py-2 text-zinc-500">{i + 1}</td>
                      <td className="py-2 font-semibold">
                        {s.weight > 0 ? `${fmtWeight(s.weight, unit)} × ${s.reps}` : `${s.reps} reps`}
                        {s.prs.length > 0 && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-lime-400 px-2 py-0.5 align-middle text-xs font-bold text-zinc-950">
                            <Icon name="trophy" size={12} /> Record
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">{Math.round(s.difficulty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )
        })}

        <button className="btn btn-danger w-full" onClick={() => setDeleting(true)}>
          <Icon name="trash" size={20} /> Delete this workout
        </button>
      </div>

      {deleting && (
        <ConfirmSheet
          title="Delete this workout?"
          message="Its sets are removed from your progress too. This can't be undone."
          confirmLabel="Delete workout"
          danger
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await deleteWorkout(id)
            go('history')
          }}
        />
      )}
    </>
  )
}
