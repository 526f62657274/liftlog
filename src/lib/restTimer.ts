import { useSyncExternalStore } from 'react'
import { getSettings } from './settings'

export interface RestState {
  /** Timestamp the rest ends; null when no timer is running. */
  endsAt: number | null
  totalMs: number
  /** Set briefly after the timer hits zero so the UI can show "Rest over". */
  finishedAt: number | null
}

const KEY = 'liftlog.rest'
const listeners = new Set<() => void>()
let state: RestState = { endsAt: null, totalMs: 0, finishedAt: null }
let timeout: ReturnType<typeof setTimeout> | undefined
let audio: AudioContext | undefined

function set(next: RestState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Not critical: the timer just won't survive a reload.
  }
  listeners.forEach((l) => l())
}

function schedule() {
  clearTimeout(timeout)
  if (state.endsAt) timeout = setTimeout(finish, Math.max(0, state.endsAt - Date.now()))
}

function beep() {
  if (!audio) return
  const t0 = audio.currentTime
  for (let i = 0; i < 3; i++) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.25, t0 + i * 0.28)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.28 + 0.2)
    osc.connect(gain).connect(audio.destination)
    osc.start(t0 + i * 0.28)
    osc.stop(t0 + i * 0.28 + 0.22)
  }
}

function finish() {
  if (!state.endsAt) return
  const s = getSettings()
  if (s.vibrate) navigator.vibrate?.([300, 120, 300])
  if (s.sound) beep()
  set({ endsAt: null, totalMs: 0, finishedAt: Date.now() })
  timeout = setTimeout(() => {
    if (state.finishedAt) set({ ...state, finishedAt: null })
  }, 4000)
}

/** Call from a tap handler: browsers only allow sound once the user has interacted. */
export function startRest(seconds = getSettings().restSeconds) {
  if (getSettings().sound) {
    try {
      audio ??= new AudioContext()
      void audio.resume()
    } catch {
      // No Web Audio: vibration and the on-screen timer still work.
    }
  }
  set({ endsAt: Date.now() + seconds * 1000, totalMs: seconds * 1000, finishedAt: null })
  schedule()
}

export function addRest(seconds: number) {
  if (!state.endsAt) return
  set({ ...state, endsAt: state.endsAt + seconds * 1000, totalMs: state.totalMs + seconds * 1000 })
  schedule()
}

export function stopRest() {
  clearTimeout(timeout)
  set({ endsAt: null, totalMs: 0, finishedAt: null })
}

export function useRest(): RestState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}

// Pick a running timer back up after a reload or after the phone was locked.
try {
  const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as RestState | null
  if (saved?.endsAt && saved.endsAt > Date.now()) {
    state = { ...saved, finishedAt: null }
    schedule()
  }
} catch {
  // Ignore a corrupt saved timer.
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.endsAt) schedule()
})
