import Dexie, { type EntityTable } from 'dexie'
import { SEED_EXERCISES, SEED_ROUTINES } from './seed'
import type { Exercise, Routine, SetEntry, Workout } from './types'

export const db = new Dexie('liftlog') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>
  routines: EntityTable<Routine, 'id'>
  workouts: EntityTable<Workout, 'id'>
  sets: EntityTable<SetEntry, 'id'>
}

db.version(1).stores({
  exercises: 'id, muscle',
  routines: 'id, order',
  workouts: 'id, startedAt',
  sets: 'id, workoutId, exerciseId',
})

// First launch only: the library and the three starter days.
db.on('populate', (tx) => {
  tx.table('exercises').bulkAdd(SEED_EXERCISES)
  tx.table('routines').bulkAdd(SEED_ROUTINES)
})

/** Adds library exercises introduced by a newer app version, without touching existing rows. */
export async function syncLibrary() {
  const have = new Set(await db.exercises.toCollection().primaryKeys())
  const missing = SEED_EXERCISES.filter((e) => !have.has(e.id))
  if (missing.length) await db.exercises.bulkAdd(missing)
}

/** Works on plain http too (phone testing over Wi-Fi), where crypto.randomUUID is unavailable. */
export function uid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
