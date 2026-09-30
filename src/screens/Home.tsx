import { useLiveQuery } from 'dexie-react-hooks'
import { Header } from '../components/Header'
import { Icon } from '../components/Icon'
import { createRoutine, startWorkout } from '../lib/actions'
import { db } from '../lib/db'
import { go } from '../lib/router'
import type { Routine, Workout } from '../lib/types'
import { fmtClock } from '../lib/units'
import { useNow } from '../lib/useNow'

function ResumeCard({ workout }: { workout: Workout }) {
  const now = useNow()
  return (
    <button className="card w-full border-lime-400 p-4 text-left" onClick={() => go('workout')}>
      <div className="label text-lime-400">Workout in progress</div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-xl font-bold">{workout.name}</div>
          <div className="text-zinc-400 tabular-nums">{fmtClock(now - workout.startedAt)}</div>
        </div>
        <span className="btn btn-primary shrink-0">Continue</span>
      </div>
    </button>
  )
}

export function Home() {
  const routines = useLiveQuery(() => db.routines.orderBy('order').toArray(), [])
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  const active = useLiveQuery(() => db.workouts.filter((w) => !w.endedAt).first(), [])
  const names = new Map(exercises?.map((e) => [e.id, e.name]))

  const start = async (routine?: Routine) => {
    await startWorkout(routine)
    go('workout')
  }

  return (
    <>
      <Header
        title="Liftlog"
        subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        right={
          <button
            className="grid h-12 w-12 place-items-center rounded-xl text-zinc-300 active:bg-zinc-800"
            onClick={() => go('settings')}
            aria-label="Settings"
          >
            <Icon name="settings" />
          </button>
        }
      />
      <div className="space-y-3 p-3">
        {active && <ResumeCard workout={active} />}

        <h2 className="label pt-2">{active ? 'Your days' : 'Start a workout'}</h2>
        {routines?.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-xl font-bold">{r.name}</div>
                <div className="line-clamp-2 text-sm text-zinc-400">
                  {r.exerciseIds.length
                    ? r.exerciseIds.map((id) => names.get(id) ?? '…').join(' · ')
                    : 'No exercises yet. Tap Edit to add some.'}
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {!active && (
                <button
                  className={`btn flex-1 ${r.exerciseIds.length ? 'btn-primary' : 'bg-zinc-800 text-zinc-500'}`}
                  onClick={() => start(r)}
                  disabled={!r.exerciseIds.length}
                >
                  <Icon name="play" size={18} /> Start
                </button>
              )}
              <button className={`btn btn-ghost ${active ? 'flex-1' : ''}`} onClick={() => go(`day/${r.id}`)}>
                <Icon name="edit" size={18} /> Edit
              </button>
            </div>
          </div>
        ))}

        <button className="btn btn-ghost w-full" onClick={async () => go(`day/${await createRoutine()}`)}>
          <Icon name="plus" size={20} /> New day
        </button>

        {!active && (
          <button className="card flex w-full items-center gap-3 p-4 text-left" onClick={() => start()}>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold">Quick workout</div>
              <div className="text-sm text-zinc-400">No plan. Just pick exercises as you go.</div>
            </div>
            <Icon name="right" className="text-zinc-500" />
          </button>
        )}
      </div>
    </>
  )
}
