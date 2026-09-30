import { go } from '../lib/router'
import { Icon, type IconName } from './Icon'

const TABS: { path: string; label: string; icon: IconName }[] = [
  { path: '', label: 'Train', icon: 'dumbbell' },
  { path: 'exercises', label: 'Exercises', icon: 'list' },
  { path: 'progress', label: 'Progress', icon: 'chart' },
  { path: 'history', label: 'History', icon: 'clock' },
]

export function TabBar({ active }: { active: string }) {
  return (
    <nav className="grid grid-cols-4 border-t border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom)]">
      {TABS.map((t) => {
        const on = t.path === active
        return (
          <button
            key={t.path}
            onClick={() => go(t.path)}
            aria-current={on ? 'page' : undefined}
            className={`flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${on ? 'text-lime-400' : 'text-zinc-400'}`}
          >
            <Icon name={t.icon} />
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
