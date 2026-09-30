import { type PRKind, scoreSets } from './analytics'
import { db, uid } from './db'
import { startRest } from './restTimer'
import { getSettings } from './settings'
import type { Routine, SetEntry } from './types'

const DEFAULT_SETS = 3

export async function getActiveWorkout() {
  return db.workouts.filter((w) => !w.endedAt).first()
}

/** The ticked sets from the most recent other workout that included this exercise. */
async function lastSessionSets(exerciseId: string, excludeWorkoutId: string): Promise<SetEntry[]> {
  const past = await db.sets
    .where('exerciseId')
    .equals(exerciseId)
    .filter((s) => s.done && s.workoutId !== excludeWorkoutId)
    .toArray()
  if (!past.length) return []
  const latest = past.reduce((a, b) => ((b.doneAt ?? 0) > (a.doneAt ?? 0) ? b : a))
  return past.filter((s) => s.workoutId === latest.workoutId).sort((a, b) => a.order - b.order)
}

/** Builds the set rows for an exercise, pre-filled with what was lifted last time. */
async function prefilledSets(workoutId: string, exerciseId: string): Promise<SetEntry[]> {
  const last = await lastSessionSets(exerciseId, workoutId)
  const count = Math.max(DEFAULT_SETS, last.length)
  return Array.from({ length: count }, (_, i) => {
    const from = last[Math.min(i, last.length - 1)]
    return {
      id: uid(),
      workoutId,
      exerciseId,
      order: i,
      weight: from?.weight ?? null,
      reps: from?.reps ?? null,
      done: false,
    }
  })
}

export async function startWorkout(routine?: Routine): Promise<string> {
  const active = await getActiveWorkout()
  if (active) return active.id

  const id = uid()
  const known = new Set(await db.exercises.toCollection().primaryKeys())
  const exerciseIds = (routine?.exerciseIds ?? []).filter((e) => known.has(e))
  const sets = (await Promise.all(exerciseIds.map((e) => prefilledSets(id, e)))).flat()
  await db.transaction('rw', db.workouts, db.sets, async () => {
    await db.workouts.add({
      id,
      name: routine?.name ?? 'Quick workout',
      routineId: routine?.id,
      startedAt: Date.now(),
      exerciseIds,
    })
    await db.sets.bulkAdd(sets)
  })
  return id
}

export async function addExercisesToWorkout(workoutId: string, exerciseIds: string[]) {
  const workout = await db.workouts.get(workoutId)
  if (!workout) return
  const fresh = exerciseIds.filter((e) => !workout.exerciseIds.includes(e))
  const sets = (await Promise.all(fresh.map((e) => prefilledSets(workoutId, e)))).flat()
  await db.transaction('rw', db.workouts, db.sets, async () => {
    await db.workouts.update(workoutId, { exerciseIds: [...workout.exerciseIds, ...fresh] })
    await db.sets.bulkAdd(sets)
  })
}

/** Skip an exercise for this workout only; the day template is untouched. */
export async function removeExerciseFromWorkout(workoutId: string, exerciseId: string) {
  await db.transaction('rw', db.workouts, db.sets, async () => {
    const workout = await db.workouts.get(workoutId)
    if (!workout) return
    await db.workouts.update(workoutId, { exerciseIds: workout.exerciseIds.filter((e) => e !== exerciseId) })
    await db.sets
      .where('workoutId')
      .equals(workoutId)
      .filter((s) => s.exerciseId === exerciseId)
      .delete()
  })
}

export async function addSet(workoutId: string, exerciseId: string) {
  const existing = (await db.sets.where('workoutId').equals(workoutId).toArray())
    .filter((s) => s.exerciseId === exerciseId)
    .sort((a, b) => a.order - b.order)
  const prev = existing[existing.length - 1]
  await db.sets.add({
    id: uid(),
    workoutId,
    exerciseId,
    order: (prev?.order ?? -1) + 1,
    weight: prev?.weight ?? null,
    reps: prev?.reps ?? null,
    done: false,
  })
}

export function removeSet(id: string) {
  return db.sets.delete(id)
}

export function updateSet(id: string, patch: Partial<Pick<SetEntry, 'weight' | 'reps'>>) {
  return db.sets.update(id, patch)
}

/**
 * Tick or untick a set. Ticking starts the rest timer and returns any records the set broke.
 * Returns null when the set can't be ticked yet (no reps entered).
 */
export async function toggleSet(set: SetEntry): Promise<PRKind[] | null> {
  if (set.done) {
    await db.sets.update(set.id, { done: false, doneAt: undefined })
    return []
  }
  if (!set.reps || set.reps <= 0) return null

  // Sound can only start from a tap, so kick the timer off before any awaiting.
  if (getSettings().restEnabled) startRest()

  const weight = set.weight ?? 0
  await db.sets.update(set.id, { done: true, doneAt: Date.now(), weight })

  const all = await db.sets.where('exerciseId').equals(set.exerciseId).toArray()

  // Carry the numbers down to the next empty row so it is also one tap.
  const next = all
    .filter((s) => s.workoutId === set.workoutId && !s.done && s.order > set.order)
    .sort((a, b) => a.order - b.order)[0]
  if (next) {
    const reps = set.reps
    // Re-checked inside the write, in case he has already started typing in that row.
    await db.sets.where('id').equals(next.id).modify((n) => {
      if (n.weight == null && n.reps == null) Object.assign(n, { weight, reps })
    })
  }

  return scoreSets(all).find((s) => s.id === set.id)?.prs ?? []
}

/** Ends the workout. Unticked rows are dropped; a workout with nothing ticked is discarded. */
export async function finishWorkout(workoutId: string): Promise<boolean> {
  return db.transaction('rw', db.workouts, db.sets, async () => {
    const sets = await db.sets.where('workoutId').equals(workoutId).toArray()
    const done = sets.filter((s) => s.done)
    await db.sets.bulkDelete(sets.filter((s) => !s.done).map((s) => s.id))
    if (!done.length) {
      await db.workouts.delete(workoutId)
      return false
    }
    const workout = await db.workouts.get(workoutId)
    const trained = new Set(done.map((s) => s.exerciseId))
    await db.workouts.update(workoutId, {
      endedAt: Date.now(),
      exerciseIds: (workout?.exerciseIds ?? []).filter((e) => trained.has(e)),
    })
    return true
  })
}

export async function deleteWorkout(workoutId: string) {
  await db.transaction('rw', db.workouts, db.sets, async () => {
    await db.sets.where('workoutId').equals(workoutId).delete()
    await db.workouts.delete(workoutId)
  })
}

export async function createRoutine(): Promise<string> {
  const id = uid()
  const count = await db.routines.count()
  await db.routines.add({ id, name: 'New day', exerciseIds: [], order: count })
  return id
}

export async function deleteExercise(exerciseId: string) {
  await db.transaction('rw', db.exercises, db.routines, db.sets, db.workouts, async () => {
    await db.exercises.delete(exerciseId)
    await db.sets.where('exerciseId').equals(exerciseId).delete()
    await db.routines.toCollection().modify((r) => {
      r.exerciseIds = r.exerciseIds.filter((e) => e !== exerciseId)
    })
    await db.workouts.toCollection().modify((w) => {
      w.exerciseIds = w.exerciseIds.filter((e) => e !== exerciseId)
    })
  })
}
