import { useState } from 'react'
import { go } from '../lib/router'
import { ExerciseBrowser } from './ExerciseBrowser'
import { Icon } from './Icon'

/** Full-screen "tick the ones you want" list. */
export function ExercisePicker({
  exclude,
  onAdd,
  onClose,
}: {
  exclude: string[]
  onAdd: (exerciseIds: string[]) => void
  onClose: () => void
}) {
  const [picked, setPicked] = useState<string[]>([])

  return (
    <div className="fixed inset-0 z-40 mx-auto flex max-w-md flex-col bg-zinc-950" role="dialog" aria-label="Add exercises">
      <div className="flex items-center gap-1 border-b border-zinc-800 px-3 pt-[env(safe-area-inset-top)]">
        <button className="-ml-2 grid h-12 w-12 place-items-center text-zinc-300" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
        <h2 className="flex-1 py-3 text-xl font-bold">Add exercises</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ExerciseBrowser
          exclude={exclude}
          onPick={(e) => setPicked((p) => (p.includes(e.id) ? p.filter((id) => id !== e.id) : [...p, e.id]))}
          trailing={(e) => (
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                picked.includes(e.id) ? 'bg-lime-400 text-zinc-950' : 'border-2 border-zinc-600 text-transparent'
              }`}
            >
              <Icon name="check" size={18} />
            </span>
          )}
          footer={
            <div className="p-3">
              <button
                className="btn btn-ghost w-full"
                onClick={() => {
                  onClose()
                  go('exercise/new')
                }}
              >
                <Icon name="plus" size={20} /> Create your own exercise
              </button>
            </div>
          }
        />
      </div>
      <div className="border-t border-zinc-800 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <button
          className={`btn w-full ${picked.length ? 'btn-primary' : 'bg-zinc-900 text-zinc-400'}`}
          disabled={!picked.length}
          onClick={() => onAdd(picked)}
        >
          {picked.length ? `Add ${picked.length} exercise${picked.length > 1 ? 's' : ''}` : 'Tap exercises to add them'}
        </button>
      </div>
    </div>
  )
}
