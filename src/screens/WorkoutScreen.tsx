import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { ExerciseImage } from '../components/ExerciseImage'
import { ExercisePicker } from '../components/ExercisePicker'
import { Header } from '../components/Header'
import { Icon } from '../components/Icon'
import { SetRow } from '../components/SetRow'
import { ConfirmSheet, Sheet } from '../components/Sheet'
import {
  addExercisesToWorkout,
  addSet,
  deleteWorkout,
  finishWorkout,
  removeExerciseFromWorkout,
  removeSet,
  toggleSet,
  updateSet,
} from '../lib/actions'
import { e1rm, type PRKind, type ScoredSet, scoreSets } from '../lib/analytics'
import { celebrate } from '../lib/celebrate'
import { db } from '../lib/db'
import { stopRest } from '../lib/restTimer'
import { replace } from '../lib/router'
import { useSettings, weightStep } from '../lib/settings'
import type { Exercise, SetEntry, Unit } from '../lib/types'
import { daysAgo, fmtClock, fmtWeight, kgToUnit } from '../lib/units'
import { useNow } from '../lib/useNow'

function Elapsed({ since }: { since: number }) {
  const now = useNow()
  return <span className="tabular-nums">{fmtClock(now - since)}</span>
}

/** "60 kg × 8, 8, 7" when the weight was constant, otherwise "60×8, 62.5×6". */
function summarise(sets: SetEntry[], unit: Unit): string {
  const weights = new Set(sets.map((s) => s.weight ?? 0))
  if (weights.size === 1) {
    const w = sets[0].weight ?? 0
    const reps = sets.map((s) => s.reps).join(', ')
    return w > 0 ? `${fmtWeight(w, unit)} × ${reps}` : `${reps} reps`
  }
  return sets.map((s) => `${kgToUnit(s.weight ?? 0, unit)}×${s.reps}`).join(', ')
}

function prLines(kinds: PRKind[], set: SetEntry, unit: Unit): string[] {
  const weight = set.weight ?? 0
  const reps = set.reps ?? 0
  return kinds.map((k) => {
    if (k === 'weight') return `Heaviest ever: ${fmtWeight(weight, unit)}`
    if (k === 'e1rm') return `Best estimated 1-rep max: ${fmtWeight(e1rm(weight, reps), unit)}`
    return weight > 0 ? `Most reps at ${fmtWeight(weight, unit)}: ${reps}` : `Most reps ever: ${reps}`
  })
}

function ExerciseCard({
  exercise,
  sets,
  history,
  workoutId,
}: {
  exercise: Exercise
  sets: SetEntry[]
  /** Every ticked set of this exercise, from all workouts. */
  history: SetEntry[]
  workoutId: string
}) {
  const settings = useSettings()
  const unit = settings.unit
  const [needReps, setNeedReps] = useState(false)
  const [confirmSkip, setConfirmSkip] = useState(false)

  const scored = new Map<string, ScoredSet>(scoreSets(history).map((s) => [s.id, s]))
  const earlier = history.filter((s) => s.workoutId !== workoutId)
  const latest = earlier.reduce<SetEntry | null>((a, b) => (!a || (b.doneAt ?? 0) > (a.doneAt ?? 0) ? b : a), null)
  const lastSets = latest ? earlier.filter((s) => s.workoutId === latest.workoutId).sort((a, b) => a.order - b.order) : []

  const toggle = async (set: SetEntry) => {
    const prs = await toggleSet(set)
    setNeedReps(prs === null)
    if (prs?.length) celebrate(exercise.name, prLines(prs, set, unit))
  }
  const skip = () => removeExerciseFromWorkout(workoutId, exercise.id)

  return (
    <section className="card p-2">
      <div className="flex items-center gap-3 pb-2">
        <ExerciseImage exercise={exercise} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg leading-tight font-bold">{exercise.name}</h2>
          <p className="line-clamp-2 text-sm text-zinc-400">
            {lastSets.length
              ? `Last time (${daysAgo(latest?.doneAt ?? 0)}): ${summarise(lastSets, unit)}`
              : 'First time doing this one'}
          </p>
        </div>
        <button
          className="min-h-12 shrink-0 rounded-xl px-3 font-semibold text-zinc-400 active:bg-zinc-800"
          onClick={() => (sets.some((s) => s.done) ? setConfirmSkip(true) : skip())}
        >
          Skip
        </button>
      </div>

      <div className="flex gap-1 pb-1 text-center">
        <span className="w-4 shrink-0" />
        <span className="label flex-[1.15]">Weight ({unit})</span>
        <span className="label flex-1">Reps</span>
        <span className="label w-12 shrink-0">Done</span>
      </div>
      {sets.map((s, i) => (
        <SetRow
          key={s.id}
          set={s}
          index={i}
          unit={unit}
          step={weightStep(settings)}
          scored={s.done ? scored.get(s.id) : undefined}
          onChange={(patch) => {
            setNeedReps(false)
            void updateSet(s.id, patch)
          }}
          onToggle={() => toggle(s)}
          onRemove={() => removeSet(s.id)}
        />
      ))}
      {needReps && <p className="px-5 pt-1 text-sm font-semibold text-amber-300">Enter your reps first, then tap the tick.</p>}

      <div className="mt-2 flex gap-2">
        <button className="btn btn-ghost flex-1" onClick={() => addSet(workoutId, exercise.id)}>
          <Icon name="plus" size={20} /> Add set
        </button>
        {sets.length > 1 && (
          <button className="btn btn-ghost text-zinc-400" onClick={() => removeSet(sets[sets.length - 1].id)}>
            <Icon name="minus" size={20} /> Remove set
          </button>
        )}
      </div>

      {confirmSkip && (
        <ConfirmSheet
          title={`Remove ${exercise.name}?`}
          message="The sets you ticked for it in this workout will be deleted."
          confirmLabel="Remove from this workout"
          danger
          onClose={() => setConfirmSkip(false)}
          onConfirm={skip}
        />
      )}
    </section>
  )
}

export function WorkoutScreen() {
  const workout = useLiveQuery(async () => (await db.workouts.filter((w) => !w.endedAt).first()) ?? null, [])
  const workoutId = workout?.id
  const sets = useLiveQuery(
    () => (workoutId ? db.sets.where('workoutId').equals(workoutId).sortBy('order') : []),
    [workoutId],
  )
  const exerciseKey = workout?.exerciseIds.join('|') ?? ''
  const history = useLiveQuery(
    () =>
      workout
        ? db.sets
            .where('exerciseId')
            .anyOf(workout.exerciseIds)
            .filter((s) => s.done)
            .toArray()
        : [],
    [exerciseKey],
  )
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  const [picking, setPicking] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [discarding, setDiscarding] = useState(false)

  // Nothing in progress (e.g. opened from an old link): go home.
  useEffect(() => {
    if (workout === null) replace('')
  }, [workout])

  if (!workout || !sets || !history || !exercises) return null

  const byId = new Map(exercises.map((e) => [e.id, e]))
  const doneCount = sets.filter((s) => s.done).length

  const finish = async () => {
    stopRest()
    const saved = await finishWorkout(workout.id)
    replace(saved ? `history/${workout.id}` : '')
  }

  return (
    <>
      <Header
        title={workout.name}
        subtitle={<Elapsed since={workout.startedAt} />}
        backTo=""
        right={
          <button className="btn btn-primary" onClick={() => setFinishing(true)}>
            Finish
          </button>
        }
      />
      <div className="space-y-3 p-2">
        {workout.exerciseIds.map((eid) => {
          const exercise = byId.get(eid)
          if (!exercise) return null
          return (
            <ExerciseCard
              key={eid}
              exercise={exercise}
              workoutId={workout.id}
              sets={sets.filter((s) => s.exerciseId === eid)}
              history={history.filter((s) => s.exerciseId === eid)}
            />
          )
        })}
        {!workout.exerciseIds.length && (
          <p className="px-4 py-8 text-center text-zinc-400">Pick your first exercise to get going.</p>
        )}
        <button className="btn btn-ghost w-full" onClick={() => setPicking(true)}>
          <Icon name="plus" size={20} /> Add exercise
        </button>
        <p className="px-4 pb-2 text-center text-sm text-zinc-500">
          Everything saves as you go. Swipe a set left to remove it.
        </p>
      </div>

      {picking && (
        <ExercisePicker
          exclude={workout.exerciseIds}
          onClose={() => setPicking(false)}
          onAdd={(ids) => {
            void addExercisesToWorkout(workout.id, ids)
            setPicking(false)
          }}
        />
      )}
      {finishing && (
        <Sheet title="Finish workout?" onClose={() => setFinishing(false)}>
          <p className="mb-4 text-zinc-300">
            {doneCount
              ? `${doneCount} set${doneCount > 1 ? 's' : ''} ticked in ${fmtClock(Date.now() - workout.startedAt)}. Sets you didn't tick won't be saved.`
              : "You haven't ticked any sets, so there is nothing to save."}
          </p>
          <div className="flex flex-col gap-2">
            {doneCount > 0 && (
              <button className="btn btn-primary" onClick={finish}>
                Finish and save
              </button>
            )}
            <button className="btn btn-ghost" onClick={() => setFinishing(false)}>
              Keep going
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                setFinishing(false)
                setDiscarding(true)
              }}
            >
              Discard workout
            </button>
          </div>
        </Sheet>
      )}
      {discarding && (
        <ConfirmSheet
          title="Discard this workout?"
          message="Everything logged in it will be deleted."
          confirmLabel="Discard"
          danger
          onClose={() => setDiscarding(false)}
          onConfirm={async () => {
            stopRest()
            await deleteWorkout(workout.id)
            replace('')
          }}
        />
      )}
    </>
  )
}
