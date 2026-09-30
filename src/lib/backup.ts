import { db, uid } from './db'
import { SEED_ROUTINES } from './seed'
import type { SetEntry, Workout } from './types'

const TABLES = ['exercises', 'routines', 'workouts', 'sets'] as const

export async function exportBackup() {
  const data = {
    app: 'liftlog',
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises: await db.exercises.toArray(),
    routines: await db.routines.toArray(),
    workouts: await db.workouts.toArray(),
    sets: await db.sets.toArray(),
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `liftlog-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Replaces everything on the device with the contents of a backup file. */
export async function importBackup(file: File) {
  const data = JSON.parse(await file.text())
  if (data?.app !== 'liftlog' || !TABLES.every((t) => Array.isArray(data[t]))) {
    throw new Error('That file is not a Liftlog backup.')
  }
  await db.transaction('rw', db.exercises, db.routines, db.workouts, db.sets, async () => {
    for (const t of TABLES) {
      await db.table(t).clear()
      await db.table(t).bulkAdd(data[t])
    }
  })
}

export async function eraseEverything() {
  localStorage.removeItem('liftlog.rest')
  await db.delete()
  window.location.reload()
}

const START_KG: Record<string, number> = {
  'Barbell_Bench_Press_-_Medium_Grip': 60,
  Incline_Dumbbell_Press: 20,
  Cable_Crossover: 15,
  Triceps_Pushdown: 25,
  'EZ-Bar_Skullcrusher': 20,
  'Wide-Grip_Lat_Pulldown': 50,
  Bent_Over_Barbell_Row: 50,
  Seated_Cable_Rows: 45,
  Barbell_Curl: 25,
  Hammer_Curls: 12.5,
  Barbell_Squat: 80,
  Leg_Press: 120,
  Leg_Extensions: 40,
  Lying_Leg_Curls: 35,
  Standing_Calf_Raises: 60,
}

/** Ten weeks of made-up training so the Progress screens have something to show. */
export async function loadSampleData() {
  // Small seeded generator: the same sample every time.
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

  const workouts: Workout[] = []
  const sets: SetEntry[] = []
  const now = Date.now()
  const today = new Date()
  today.setHours(18, 0, 0, 0)

  for (let daysBack = 70; daysBack >= 1; daysBack--) {
    const day = new Date(today)
    day.setDate(day.getDate() - daysBack)
    const slot = [1, 3, 5].indexOf(day.getDay())
    if (slot < 0 || rand() < 0.12) continue

    const routine = SEED_ROUTINES[slot]
    const week = Math.floor((70 - daysBack) / 7)
    const workoutId = uid()
    let t = day.getTime() + Math.round(rand() * 40) * 60000
    const startedAt = t

    for (const exerciseId of routine.exerciseIds) {
      const start = START_KG[exerciseId] ?? 30
      const weight = Math.round((start * (1 + 0.025 * Math.floor(week / 2))) / 2.5) * 2.5
      const topReps = 8 + (week % 2) * 2 - (rand() < 0.2 ? 1 : 0)
      for (let i = 0; i < 3; i++) {
        t += (120 + Math.round(rand() * 60)) * 1000
        sets.push({
          id: uid(),
          workoutId,
          exerciseId,
          order: i,
          weight,
          reps: Math.max(4, topReps - i - (rand() < 0.3 ? 1 : 0)),
          done: true,
          doneAt: t,
        })
      }
      t += 90000
    }
    if (t < now) {
      workouts.push({
        id: workoutId,
        name: routine.name,
        routineId: routine.id,
        startedAt,
        endedAt: t,
        exerciseIds: routine.exerciseIds,
      })
    }
  }

  const kept = new Set(workouts.map((w) => w.id))
  await db.transaction('rw', db.workouts, db.sets, async () => {
    await db.workouts.bulkAdd(workouts)
    await db.sets.bulkAdd(sets.filter((s) => kept.has(s.workoutId)))
  })
}
