import type { ReactNode } from 'react'
import { back } from '../lib/router'
import { Icon } from './Icon'

export function Header({
  title,
  subtitle,
  backTo,
  right,
  scrolls,
}: {
  title: ReactNode
  subtitle?: ReactNode
  /** Show a back arrow; the value is where to go if there is no history to go back through. */
  backTo?: string
  right?: ReactNode
  /** Scroll away with the page instead of sticking (for screens with their own sticky bar). */
  scrolls?: boolean
}) {
  return (
    <header
      className={`${scrolls ? '' : 'sticky top-0 z-30'} flex items-center gap-1 border-b border-zinc-800 bg-zinc-950/95 px-3 pt-[env(safe-area-inset-top)] backdrop-blur`}
    >
      {backTo !== undefined && (
        <button
          className="-ml-2 grid h-12 w-12 shrink-0 place-items-center rounded-xl text-zinc-300 active:bg-zinc-800"
          onClick={() => back(backTo)}
          aria-label="Back"
        >
          <Icon name="left" />
        </button>
      )}
      <div className="min-w-0 flex-1 py-3">
        <h1 className="truncate text-xl leading-tight font-bold">{title}</h1>
        {subtitle && <div className="truncate text-sm text-zinc-400">{subtitle}</div>}
      </div>
      {right}
    </header>
  )
}
