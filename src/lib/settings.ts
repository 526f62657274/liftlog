import { useSyncExternalStore } from 'react'
import type { Unit } from './types'

export interface Settings {
  unit: Unit
  stepKg: number
  stepLb: number
  restEnabled: boolean
  restSeconds: number
  sound: boolean
  vibrate: boolean
}

const DEFAULTS: Settings = {
  unit: 'kg',
  stepKg: 2.5,
  stepLb: 5,
  restEnabled: true,
  restSeconds: 90,
  sound: true,
  vibrate: true,
}

const KEY = 'liftlog.settings'
const listeners = new Set<() => void>()

function load(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return DEFAULTS
  }
}

let current = load()

export function getSettings(): Settings {
  return current
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // Storage unavailable (private mode): settings still apply for this session.
  }
  listeners.forEach((l) => l())
}

export function useSettings(): Settings {
  return useSyncExternalStore((cb) => {
    listeners.add(cb)
    return () => listeners.delete(cb)
  }, getSettings)
}

export const STEP_OPTIONS: Record<Unit, number[]> = { kg: [1, 1.25, 2.5, 5], lb: [2.5, 5, 10] }

export function weightStep(s: Settings): number {
  return s.unit === 'kg' ? s.stepKg : s.stepLb
}
