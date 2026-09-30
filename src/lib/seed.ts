import type { Exercise, Muscle, Routine } from './types'

// Photos come from free-exercise-db (public domain / Unlicense). The id is the dataset's id,
// and the matching photo is bundled at public/exercises/<id>.jpg.
const LIBRARY: [id: string, name: string, muscle: Muscle, equipment: string][] = [
  ['Barbell_Bench_Press_-_Medium_Grip', 'Bench Press', 'Chest', 'Barbell'],
  ['Barbell_Incline_Bench_Press_-_Medium_Grip', 'Incline Bench Press', 'Chest', 'Barbell'],
  ['Dumbbell_Bench_Press', 'Dumbbell Bench Press', 'Chest', 'Dumbbells'],
  ['Incline_Dumbbell_Press', 'Incline Dumbbell Press', 'Chest', 'Dumbbells'],
  ['Dumbbell_Flyes', 'Dumbbell Fly', 'Chest', 'Dumbbells'],
  ['Butterfly', 'Pec Deck', 'Chest', 'Machine'],
  ['Cable_Crossover', 'Cable Crossover', 'Chest', 'Cable'],
  ['Pushups', 'Push-Up', 'Chest', 'Bodyweight'],

  ['Barbell_Deadlift', 'Deadlift', 'Back', 'Barbell'],
  ['Pullups', 'Pull-Up', 'Back', 'Bodyweight'],
  ['Wide-Grip_Lat_Pulldown', 'Lat Pulldown', 'Back', 'Cable'],
  ['Bent_Over_Barbell_Row', 'Bent-Over Row', 'Back', 'Barbell'],
  ['One-Arm_Dumbbell_Row', 'One-Arm Dumbbell Row', 'Back', 'Dumbbells'],
  ['Seated_Cable_Rows', 'Seated Cable Row', 'Back', 'Cable'],

  ['Barbell_Squat', 'Squat', 'Legs', 'Barbell'],
  ['Leg_Press', 'Leg Press', 'Legs', 'Machine'],
  ['Leg_Extensions', 'Leg Extension', 'Legs', 'Machine'],
  ['Lying_Leg_Curls', 'Leg Curl', 'Legs', 'Machine'],
  ['Romanian_Deadlift', 'Romanian Deadlift', 'Legs', 'Barbell'],
  ['Dumbbell_Lunges', 'Dumbbell Lunge', 'Legs', 'Dumbbells'],
  ['Standing_Calf_Raises', 'Standing Calf Raise', 'Legs', 'Machine'],
  ['Barbell_Hip_Thrust', 'Hip Thrust', 'Legs', 'Barbell'],

  ['Standing_Military_Press', 'Overhead Press', 'Shoulders', 'Barbell'],
  ['Dumbbell_Shoulder_Press', 'Dumbbell Shoulder Press', 'Shoulders', 'Dumbbells'],
  ['Side_Lateral_Raise', 'Lateral Raise', 'Shoulders', 'Dumbbells'],
  ['Face_Pull', 'Face Pull', 'Shoulders', 'Cable'],
  ['Reverse_Flyes', 'Reverse Fly', 'Shoulders', 'Dumbbells'],
  ['Barbell_Shrug', 'Barbell Shrug', 'Shoulders', 'Barbell'],

  ['Barbell_Curl', 'Barbell Curl', 'Biceps', 'Barbell'],
  ['Dumbbell_Bicep_Curl', 'Dumbbell Curl', 'Biceps', 'Dumbbells'],
  ['Hammer_Curls', 'Hammer Curl', 'Biceps', 'Dumbbells'],
  ['Preacher_Curl', 'Preacher Curl', 'Biceps', 'Barbell'],
  ['Incline_Dumbbell_Curl', 'Incline Dumbbell Curl', 'Biceps', 'Dumbbells'],

  ['Triceps_Pushdown', 'Triceps Pushdown', 'Triceps', 'Cable'],
  ['EZ-Bar_Skullcrusher', 'Skullcrusher', 'Triceps', 'EZ bar'],
  ['Dips_-_Triceps_Version', 'Dip', 'Triceps', 'Bodyweight'],
  ['Close-Grip_Barbell_Bench_Press', 'Close-Grip Bench Press', 'Triceps', 'Barbell'],
  ['Cable_Rope_Overhead_Triceps_Extension', 'Overhead Triceps Extension', 'Triceps', 'Cable'],

  ['Crunches', 'Crunch', 'Core', 'Bodyweight'],
  ['Hanging_Leg_Raise', 'Hanging Leg Raise', 'Core', 'Bodyweight'],
  ['Cable_Crunch', 'Cable Crunch', 'Core', 'Cable'],
  ['Russian_Twist', 'Russian Twist', 'Core', 'Bodyweight'],
  ['Ab_Crunch_Machine', 'Ab Crunch Machine', 'Core', 'Machine'],
]

export const SEED_EXERCISES: Exercise[] = LIBRARY.map(([id, name, muscle, equipment]) => ({
  id,
  name,
  muscle,
  equipment,
  image: `exercises/${id}.jpg`,
}))

export const SEED_ROUTINES: Routine[] = [
  {
    id: 'seed-chest-triceps',
    name: 'Chest & Triceps',
    order: 0,
    exerciseIds: [
      'Barbell_Bench_Press_-_Medium_Grip',
      'Incline_Dumbbell_Press',
      'Cable_Crossover',
      'Triceps_Pushdown',
      'EZ-Bar_Skullcrusher',
    ],
  },
  {
    id: 'seed-back-biceps',
    name: 'Back & Biceps',
    order: 1,
    exerciseIds: [
      'Wide-Grip_Lat_Pulldown',
      'Bent_Over_Barbell_Row',
      'Seated_Cable_Rows',
      'Barbell_Curl',
      'Hammer_Curls',
    ],
  },
  {
    id: 'seed-legs',
    name: 'Legs',
    order: 2,
    exerciseIds: ['Barbell_Squat', 'Leg_Press', 'Leg_Extensions', 'Lying_Leg_Curls', 'Standing_Calf_Raises'],
  },
]
