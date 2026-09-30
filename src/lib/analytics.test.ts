import { describe, expect, it } from 'vitest'
import { e1rm, frequency, heatmap, recentPRs, records, scoreSets, sessionStats, startOfWeek } from './analytics'
import type { SetEntry } from './types'

let n = 0
function set(workoutId: string, weight: number, reps: number, doneAt: number, exerciseId = 'bench'): SetEntry {
  return { id: `s${n++}`, workoutId, exerciseId, order: n, weight, reps, done: true, doneAt }
}

describe('e1rm', () => {
  it('uses Epley', () => {
    expect(e1rm(100, 10)).toBeCloseTo(133.33, 2)
    expect(e1rm(60, 30)).toBe(120)
  })
  it('treats a single as its own max and ignores empty sets', () => {
    expect(e1rm(100, 1)).toBe(100)
    expect(e1rm(0, 10)).toBe(0)
    expect(e1rm(100, 0)).toBe(0)
  })
})

describe('scoreSets', () => {
  it('scores difficulty against the best e1RM before the set', () => {
    const scored = scoreSets([set('a', 100, 5, 1), set('a', 100, 5, 2), set('b', 50, 5, 3), set('b', 110, 5, 4)])
    expect(scored.map((s) => Math.round(s.difficulty))).toEqual([100, 100, 50, 110])
  })

  it('is fair between heavy/low-rep and light/high-rep work', () => {
    // 100x6 and 80x15 have the same e1RM (120), so both are as hard as the best.
    const scored = scoreSets([set('a', 100, 6, 1), set('b', 80, 15, 2)])
    expect(scored[1].difficulty).toBeCloseTo(100, 5)
  })

  it('does not award PRs in the first session', () => {
    const scored = scoreSets([set('a', 60, 8, 1), set('a', 70, 8, 2)])
    expect(scored.flatMap((s) => s.prs)).toEqual([])
    expect(scored[1].difficulty).toBeGreaterThan(100)
  })

  it('detects weight, e1RM and rep PRs afterwards', () => {
    const scored = scoreSets([set('a', 60, 8, 1), set('b', 60, 9, 2), set('b', 65, 8, 3), set('b', 40, 8, 4)])
    expect(scored[1].prs).toEqual(['e1rm', 'reps'])
    expect(scored[2].prs).toEqual(['weight', 'e1rm'])
    // A weight never lifted before is not a "rep PR at that weight".
    expect(scored[3].prs).toEqual([])
  })

  it('scores bodyweight sets on reps', () => {
    const scored = scoreSets([set('a', 0, 10, 1), set('b', 0, 12, 2), set('b', 0, 6, 3)])
    expect(scored.map((s) => Math.round(s.difficulty))).toEqual([100, 120, 50])
    expect(scored[1].prs).toEqual(['reps'])
  })

  it('ignores unticked and empty sets and sorts by time', () => {
    const undone: SetEntry = { ...set('a', 200, 5, 9), done: false }
    const scored = scoreSets([set('b', 60, 5, 5), undone, set('a', 50, 5, 1), { ...set('a', 50, 0, 2) }])
    expect(scored.map((s) => s.weight)).toEqual([50, 60])
  })
})

describe('sessionStats and records', () => {
  const scored = scoreSets([
    set('a', 60, 10, 1000),
    set('a', 60, 8, 61000),
    set('b', 70, 5, 100000),
    set('b', 60, 12, 160000),
  ])

  it('totals each session', () => {
    const [a, b] = sessionStats(scored)
    expect(a).toMatchObject({ workoutId: 'a', sets: 2, reps: 18, volume: 1080, maxWeight: 60, durationMs: 60000 })
    expect(b).toMatchObject({ workoutId: 'b', sets: 2, reps: 17, volume: 1070, maxWeight: 70 })
    expect(a.difficulty).toBeCloseTo((100 + (e1rm(60, 8) / e1rm(60, 10)) * 100) / 2, 5)
  })

  it('finds records and rep PRs by weight', () => {
    const r = records(scored)
    expect(r.maxWeight?.weight).toBe(70)
    expect(r.bestE1rm?.reps).toBe(12)
    expect(r.bestReps?.reps).toBe(12)
    expect(r.repPRs.map((s) => [s.weight, s.reps])).toEqual([
      [70, 5],
      [60, 12],
    ])
  })

  it('has no weight records for bodyweight-only exercises', () => {
    const r = records(scoreSets([set('a', 0, 10, 1)]))
    expect(r.maxWeight).toBeNull()
    expect(r.bestE1rm).toBeNull()
    expect(r.bestReps?.reps).toBe(10)
  })
})

describe('time helpers', () => {
  const DAY = 86400000
  const wed = new Date(2026, 8, 30, 15).getTime() // Wed 30 Sep 2026

  it('starts the week on Monday', () => {
    expect(new Date(startOfWeek(wed)).getDate()).toBe(28)
    expect(new Date(startOfWeek(new Date(2026, 8, 27, 9).getTime())).getDate()).toBe(21) // Sunday
  })

  it('counts frequency', () => {
    const stats = sessionStats(
      scoreSets([set('a', 50, 5, wed - 40 * DAY), set('b', 50, 5, wed - 10 * DAY), set('c', 50, 5, wed - DAY)]),
    )
    expect(frequency(stats, wed)).toMatchObject({ sessions: 3, last30Days: 2, perWeek: 3 / 8 })
  })

  it('builds a heatmap ending this week', () => {
    const cols = heatmap([set('a', 50, 5, wed), set('a', 50, 5, wed)], 4, wed)
    expect(cols).toHaveLength(4)
    expect(cols[3][2]).toMatchObject({ sets: 2, future: false })
    expect(cols[3][3].future).toBe(true)
  })

  it('lists recent PRs newest first across exercises', () => {
    const prs = recentPRs(
      [set('a', 50, 5, 1), set('b', 55, 5, 2), set('a', 20, 5, 3, 'curl'), set('c', 25, 5, 4, 'curl')],
      5,
    )
    expect(prs.map((p) => p.exerciseId)).toEqual(['curl', 'bench'])
  })
})
