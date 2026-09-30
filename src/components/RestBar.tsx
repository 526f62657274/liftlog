import { addRest, stopRest, useRest } from '../lib/restTimer'
import { fmtClock } from '../lib/units'
import { useNow } from '../lib/useNow'

/** Countdown that appears after a set is ticked. */
export function RestBar() {
  const rest = useRest()
  const now = useNow(250)

  if (rest.finishedAt) {
    return (
      <div className="bg-lime-400 px-4 py-3 text-center text-lg font-bold text-zinc-950" role="status">
        Rest over. Next set!
      </div>
    )
  }
  if (!rest.endsAt) return null

  const left = Math.max(0, rest.endsAt - now)
  return (
    <div className="border-t border-zinc-800 bg-zinc-900" role="timer" aria-label="Rest timer">
      <div className="h-1 bg-zinc-800">
        <div className="h-full bg-lime-400" style={{ width: `${(left / rest.totalMs) * 100}%` }} />
      </div>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex-1">
          <div className="label">Rest</div>
          <div className="text-3xl leading-none font-bold tabular-nums">{fmtClock(left + 999)}</div>
        </div>
        <button className="btn btn-ghost" onClick={() => addRest(15)}>
          +15s
        </button>
        <button className="btn btn-ghost" onClick={stopRest}>
          Skip
        </button>
      </div>
    </div>
  )
}
