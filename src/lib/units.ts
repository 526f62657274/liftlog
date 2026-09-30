import type { Unit } from './types'

const LB_PER_KG = 2.2046226218

export function round(n: number, dp = 2): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

/**
 * Stored kg -> number in the unit the user sees. kg keeps two decimals (1.25 kg plates);
 * lb keeps one, so a lift logged in kg doesn't show up as 132.28 lb.
 */
export function kgToUnit(kg: number, unit: Unit): number {
  return unit === 'kg' ? round(kg) : round(kg * LB_PER_KG, 1)
}

export function unitToKg(value: number, unit: Unit): number {
  return unit === 'kg' ? value : value / LB_PER_KG
}

export function fmtWeight(kg: number, unit: Unit, dp = 1): string {
  return `${round(unit === 'kg' ? kg : kg * LB_PER_KG, dp)} ${unit}`
}

/** Big totals such as session volume: no decimals, thousands separators. */
export function fmtVolume(kg: number, unit: Unit): string {
  return `${Math.round(unit === 'kg' ? kg : kg * LB_PER_KG).toLocaleString()} ${unit}`
}

export function fmtDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000))
  if (totalMin === 0) return 'under 1 min'
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h ? `${h}h ${m}m` : `${m} min`
}

export function fmtClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}

export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function fmtShortDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function daysAgo(ts: number, now = Date.now()): string {
  const start = (t: number) => new Date(t).setHours(0, 0, 0, 0)
  const d = Math.round((start(now) - start(ts)) / 86400000)
  if (d <= 0) return 'today'
  if (d === 1) return 'yesterday'
  return `${d} days ago`
}
