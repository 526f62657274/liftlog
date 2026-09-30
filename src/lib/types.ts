export const MUSCLES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core'] as const
export type Muscle = (typeof MUSCLES)[number]

export interface Exercise {
  id: string
  name: string
  muscle: Muscle
  equipment: string
  /** Bundled library photo (path relative to the app root) or a data URL for custom exercises. */
  image?: string
  custom?: boolean
}

/** A "workout day" template, e.g. Chest Day. */
export interface Routine {
  id: string
  name: string
  exerciseIds: string[]
  order: number
}

export interface Workout {
  id: string
  name: string
  routineId?: string
  startedAt: number
  /** Missing while the workout is still in progress. */
  endedAt?: number
  exerciseIds: string[]
}

export interface SetEntry {
  id: string
  workoutId: string
  exerciseId: string
  order: number
  /** Always stored in kg, whatever unit is shown. 0 = bodyweight. */
  weight: number | null
  reps: number | null
  done: boolean
  doneAt?: number
}

export type Unit = 'kg' | 'lb'
