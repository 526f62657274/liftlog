import { type ReactNode, useState } from 'react'
import type { Exercise, Muscle } from '../lib/types'

/** Body silhouette with the trained area lit up; shown when an exercise has no photo. */
function MuscleIcon({ muscle }: { muscle: Muscle }) {
  const lit = 'fill-lime-400'
  const highlight: Record<Muscle, ReactNode> = {
    Chest: <rect x="17" y="14" width="14" height="6.5" rx="2.5" className={lit} />,
    Back: <path d="M17 14h14l-2.5 14h-9z" className={lit} />,
    Core: <rect x="19.5" y="21" width="9" height="8" rx="2" className={lit} />,
    Shoulders: (
      <>
        <circle cx="15.2" cy="15.6" r="3.4" className={lit} />
        <circle cx="32.8" cy="15.6" r="3.4" className={lit} />
      </>
    ),
    Biceps: (
      <>
        <rect x="10.8" y="16" width="4.6" height="7" rx="2.3" className={lit} />
        <rect x="32.6" y="16" width="4.6" height="7" rx="2.3" className={lit} />
      </>
    ),
    Triceps: (
      <>
        <rect x="10.8" y="18" width="4.6" height="7" rx="2.3" className={lit} />
        <rect x="32.6" y="18" width="4.6" height="7" rx="2.3" className={lit} />
      </>
    ),
    Legs: (
      <>
        <rect x="17.4" y="30" width="6" height="15" rx="3" className={lit} />
        <rect x="24.6" y="30" width="6" height="15" rx="3" className={lit} />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full bg-zinc-800 fill-zinc-600" role="img" aria-label={muscle}>
      <circle cx="24" cy="7.5" r="4" />
      <rect x="17" y="13" width="14" height="16" rx="3.5" />
      <rect x="10.8" y="14" width="4.6" height="16" rx="2.3" />
      <rect x="32.6" y="14" width="4.6" height="16" rx="2.3" />
      <rect x="17.4" y="30" width="6" height="15" rx="3" />
      <rect x="24.6" y="30" width="6" height="15" rx="3" />
      {highlight[muscle]}
    </svg>
  )
}

export function ExerciseImage({
  exercise,
  className = 'h-14 w-14',
}: {
  exercise: Pick<Exercise, 'image' | 'muscle' | 'name'>
  className?: string
}) {
  const [failedSrc, setFailedSrc] = useState<string>()
  const src = exercise.image
    ? exercise.image.startsWith('data:')
      ? exercise.image
      : import.meta.env.BASE_URL + exercise.image
    : undefined

  return (
    <div className={`shrink-0 overflow-hidden rounded-xl bg-zinc-800 ${className}`}>
      {src && failedSrc !== src ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <MuscleIcon muscle={exercise.muscle} />
      )}
    </div>
  )
}
