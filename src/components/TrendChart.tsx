import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmtDate, fmtShortDate } from '../lib/units'

export interface TrendPoint {
  date: number
  value: number
}

/** Round-numbered, evenly spaced axis ticks that cover every value. */
function niceTicks(values: number[]): number[] {
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min -= 1
    max += 1
  }
  const rough = (max - min) / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough
  const ticks: number[] = []
  for (let t = Math.floor(min / step) * step; t < max + step; t += step) ticks.push(Math.round(t * 1000) / 1000)
  return ticks
}

const INK_MUTED = '#a1a1aa'
const GRID = '#27272a'
const SERIES = '#a3e635'
const SURFACE = '#18181b'

/** One measure over time. Each measure gets its own chart, so there is never a second y-axis. */
export function TrendChart({
  data,
  format,
  name,
  referenceAt,
  referenceLabel,
}: {
  data: TrendPoint[]
  /** Formats a value for the tooltip. */
  format: (value: number) => string
  name: string
  referenceAt?: number
  referenceLabel?: string
}) {
  const rows = data.map((d, i) => ({ ...d, i }))
  // Keep the reference line inside the axis even when every session sits below it.
  const ticks = niceTicks([...data.map((d) => d.value), ...(referenceAt === undefined ? [] : [referenceAt])])
  return (
    <div className="h-56 w-full" role="img" aria-label={`${name} over time, ${data.length} sessions`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="i"
            type="number"
            domain={[0, Math.max(1, rows.length - 1)]}
            allowDecimals={false}
            tickCount={Math.min(5, Math.max(2, rows.length))}
            tickFormatter={(i: number) => (rows[i] ? fmtShortDate(rows[i].date) : '')}
            tick={{ fill: INK_MUTED, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            padding={{ left: 12, right: 12 }}
          />
          <YAxis
            width={44}
            domain={[ticks[0], ticks[ticks.length - 1]]}
            ticks={ticks}
            tickFormatter={(v: number) => (v >= 10000 ? `${v / 1000}k` : String(v))}
            tick={{ fill: INK_MUTED, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          {referenceAt !== undefined && (
            <ReferenceLine
              y={referenceAt}
              stroke={INK_MUTED}
              strokeDasharray="4 4"
              label={{ value: referenceLabel, position: 'insideTopRight', fill: INK_MUTED, fontSize: 12 }}
            />
          )}
          <Tooltip
            cursor={{ stroke: INK_MUTED, strokeWidth: 1 }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as (TrendPoint & { i: number }) | undefined
              if (!active || !row) return null
              return (
                <div className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm shadow-lg">
                  <div className="text-zinc-400">{fmtDate(row.date)}</div>
                  <div className="font-bold text-zinc-50">{format(row.value)}</div>
                </div>
              )
            }}
          />
          <Line
            dataKey="value"
            name={name}
            stroke={SERIES}
            strokeWidth={2}
            dot={{ r: 4, fill: SERIES, stroke: SURFACE, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: SERIES, stroke: SURFACE, strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
