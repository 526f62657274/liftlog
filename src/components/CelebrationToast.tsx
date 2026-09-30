import { dismissCelebration, useCelebration } from '../lib/celebrate'
import { Icon } from './Icon'

export function CelebrationToast() {
  const c = useCelebration()
  if (!c) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[110] flex justify-center px-4">
      <button
        key={c.id}
        onClick={dismissCelebration}
        className="pop-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-lime-400 bg-zinc-900 p-4 text-left shadow-2xl shadow-black"
        role="status"
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-lime-400 text-zinc-950">
          <Icon name="trophy" size={28} />
        </div>
        <div className="min-w-0">
          <div className="text-lg leading-tight font-bold">New record!</div>
          <div className="truncate text-sm text-zinc-300">{c.title}</div>
          {c.lines.map((l) => (
            <div key={l} className="text-sm font-semibold text-zinc-50">
              {l}
            </div>
          ))}
        </div>
      </button>
    </div>
  )
}
