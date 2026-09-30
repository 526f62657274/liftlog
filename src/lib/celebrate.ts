import confetti from 'canvas-confetti'
import { useSyncExternalStore } from 'react'

export interface Celebration {
  id: number
  title: string
  lines: string[]
}

const listeners = new Set<() => void>()
let current: Celebration | null = null
let timeout: ReturnType<typeof setTimeout> | undefined

function set(next: Celebration | null) {
  current = next
  listeners.forEach((l) => l())
}

export function celebrate(title: string, lines: string[]) {
  set({ id: Date.now(), title, lines })
  clearTimeout(timeout)
  timeout = setTimeout(() => set(null), 4500)
  const shot = { disableForReducedMotion: true, colors: ['#a3e635', '#fafafa', '#facc15'], zIndex: 100 }
  void confetti({ ...shot, particleCount: 90, spread: 75, origin: { y: 0.35 } })
  setTimeout(() => void confetti({ ...shot, particleCount: 50, spread: 110, origin: { y: 0.3 } }), 220)
}

export function dismissCelebration() {
  clearTimeout(timeout)
  set(null)
}

export function useCelebration(): Celebration | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
  )
}
