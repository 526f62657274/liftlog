import type { SetEntry, Workout } from './types'

/** Above this many reps the Epley estimate drifts, so the UI marks it as a rough estimate. */
export const E1RM_RELIABLE_MAX_REPS = 12

/** Estimated 1-rep max (Epley). A single rep is its own 1RM. */
export function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

export type PRKind = 'weight' | 'e1rm' | 'reps'

export interface ScoredSet {
  id: string
  workoutId: string
  exerciseId: string
  weight: number
  reps: number
  doneAt: number
  e1rm: number
  /** 100 = as hard as the best ever before this set; above 100 = new best. */
  difficulty: number
  prs: PRKind[]
}

const weightKey = (w: number) => Math.round(w * 100)

/**
 * Replays every completed set of ONE exercise in time order and scores each against
 * what had been achieved before it.
 *
 * Difficulty = set e1RM / best e1RM before the set x 100. Bodyweight sets (weight 0) have
 * no e1RM, so they are scored on reps against the best bodyweight reps instead.
 * The first session only sets the baseline: nothing in it counts as a PR.
 */
export function scoreSets(sets: SetEntry[]): ScoredSet[] {
  const done = sets
    .filter((s) => s.done && (s.reps ?? 0) > 0)
    .sort((a, b) => (a.doneAt ?? 0) - (b.doneAt ?? 0) || a.order - b.order)

  let bestE1rm = 0
  let bestWeight = 0
  let bestBodyweightReps = 0
  const repsAtWeight = new Map<number, number>()
  const firstWorkoutId = done[0]?.workoutId

  return done.map((s) => {
    const weight = s.weight ?? 0
    const reps = s.reps ?? 0
    const est = e1rm(weight, reps)
    const key = weightKey(weight)
    const prevRepsHere = repsAtWeight.get(key)

    let difficulty = 100
    if (weight > 0 && bestE1rm > 0) difficulty = (est / bestE1rm) * 100
    else if (weight === 0 && bestBodyweightReps > 0) difficulty = (reps / bestBodyweightReps) * 100

    const prs: PRKind[] = []
    if (s.workoutId !== firstWorkoutId) {
      if (bestWeight > 0 && weight > bestWeight) prs.push('weight')
      if (bestE1rm > 0 && est > bestE1rm) prs.push('e1rm')
      if (prevRepsHere !== undefined && reps > prevRepsHere) prs.push('reps')
    }

    bestE1rm = Math.max(bestE1rm, est)
    bestWeight = Math.max(bestWeight, weight)
    if (weight === 0) bestBodyweightReps = Math.max(bestBodyweightReps, reps)
    repsAtWeight.set(key, Math.max(prevRepsHere ?? 0, reps))

    return {
      id: s.id,
      workoutId: s.workoutId,
      exerciseId: s.exerciseId,
      weight,
      reps,
      doneAt: s.doneAt ?? 0,
      e1rm: est,
      difficulty,
      prs,
    }
  })
}

export interface SessionStat {
  workoutId: string
  date: number
  maxWeight: number
  bestE1rm: number
  bestReps: number
  volume: number
  sets: number
  reps: number
  /** Average difficulty of the session's sets. */
  difficulty: number
  topDifficulty: number
  /** First set ticked to last set ticked. */
  durationMs: number
}

/** One row per workout in which the exercise was trained, oldest first. */
export function sessionStats(scored: ScoredSet[]): SessionStat[] {
  const byWorkout = new Map<string, ScoredSet[]>()
  for (const s of scored) {
    const list = byWorkout.get(s.workoutId)
    if (list) list.push(s)
    else byWorkout.set(s.workoutId, [s])
  }
  return [...byWorkout.entries()]
    .map(([workoutId, list]) => {
      const times = list.map((s) => s.doneAt)
      return {
        workoutId,
        date: Math.min(...times),
        maxWeight: Math.max(...list.map((s) => s.weight)),
        bestE1rm: Math.max(...list.map((s) => s.e1rm)),
        bestReps: Math.max(...list.map((s) => s.reps)),
        volume: list.reduce((sum, s) => sum + s.weight * s.reps, 0),
        sets: list.length,
        reps: list.reduce((sum, s) => sum + s.reps, 0),
        difficulty: list.reduce((sum, s) => sum + s.difficulty, 0) / list.length,
        topDifficulty: Math.max(...list.map((s) => s.difficulty)),
        durationMs: Math.max(...times) - Math.min(...times),
      }
    })
    .sort((a, b) => a.date - b.date)
}

export interface Records {
  maxWeight: ScoredSet | null
  bestE1rm: ScoredSet | null
  bestReps: ScoredSet | null
  /** Most reps ever done at each weight, heaviest first. */
  repPRs: ScoredSet[]
}

export function records(scored: ScoredSet[]): Records {
  const best = (better: (a: ScoredSet, b: ScoredSet) => boolean) =>
    scored.reduce<ScoredSet | null>((top, s) => (!top || better(s, top) ? s : top), null)

  const byWeight = new Map<number, ScoredSet>()
  for (const s of scored) {
    const cur = byWeight.get(weightKey(s.weight))
    if (!cur || s.reps > cur.reps) byWeight.set(weightKey(s.weight), s)
  }
  const weighted = scored.some((s) => s.weight > 0)

  return {
    maxWeight: weighted ? best((a, b) => a.weight > b.weight || (a.weight === b.weight && a.reps > b.reps)) : null,
    bestE1rm: weighted ? best((a, b) => a.e1rm > b.e1rm) : null,
    bestReps: best((a, b) => a.reps > b.reps || (a.reps === b.reps && a.weight > b.weight)),
    repPRs: [...byWeight.values()].sort((a, b) => b.weight - a.weight),
  }
}

export interface Frequency {
  sessions: number
  last30Days: number
  /** Average sessions per week over the last 8 weeks. */
  perWeek: number
  lastDate: number | null
}

const DAY = 86400000

export function frequency(stats: SessionStat[], now = Date.now()): Frequency {
  const within = (days: number) => stats.filter((s) => now - s.date <= days * DAY).length
  return {
    sessions: stats.length,
    last30Days: within(30),
    perWeek: within(56) / 8,
    lastDate: stats.length ? stats[stats.length - 1].date : null,
  }
}

/** Monday 00:00 of the week containing `ts`. */
export function startOfWeek(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

export function workoutsThisWeek(workouts: Workout[], now = Date.now()): number {
  const from = startOfWeek(now)
  return workouts.filter((w) => w.endedAt && w.startedAt >= from).length
}

export interface HeatDay {
  date: number
  sets: number
  future: boolean
}

/** Columns of Mon..Sun for the last `weeks` weeks, ending with the current week. */
export function heatmap(sets: SetEntry[], weeks: number, now = Date.now()): HeatDay[][] {
  const perDay = new Map<number, number>()
  for (const s of sets) {
    if (!s.done || !s.doneAt) continue
    const day = new Date(s.doneAt).setHours(0, 0, 0, 0)
    perDay.set(day, (perDay.get(day) ?? 0) + 1)
  }
  const monday = new Date(startOfWeek(now))
  const cols: HeatDay[][] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const col: HeatDay[] = []
    for (let d = 0; d < 7; d++) {
      // Date arithmetic rather than adding milliseconds, so daylight-saving shifts don't skew days.
      const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - w * 7 + d).getTime()
      col.push({ date, sets: perDay.get(date) ?? 0, future: date > now })
    }
    cols.push(col)
  }
  return cols
}

/** Every PR ever set across all exercises, newest first. */
export function recentPRs(sets: SetEntry[], limit: number): ScoredSet[] {
  const byExercise = new Map<string, SetEntry[]>()
  for (const s of sets) {
    const list = byExercise.get(s.exerciseId)
    if (list) list.push(s)
    else byExercise.set(s.exerciseId, [s])
  }
  return [...byExercise.values()]
    .flatMap((list) => scoreSets(list).filter((s) => s.prs.length))
    .sort((a, b) => b.doneAt - a.doneAt)
    .slice(0, limit)
}
