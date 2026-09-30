import { type ReactNode, useRef, useState } from 'react'
import { Header } from '../components/Header'
import { ConfirmSheet } from '../components/Sheet'
import { eraseEverything, exportBackup, importBackup, loadSampleData } from '../lib/backup'
import { STEP_OPTIONS, updateSettings, useSettings, weightStep } from '../lib/settings'
import { fmtClock } from '../lib/units'

function Row({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="py-3">
      <div className="font-semibold">{title}</div>
      {hint && <div className="text-sm text-zinc-400">{hint}</div>}
      <div className="mt-2">{children}</div>
    </div>
  )
}

function Choices<T extends string | number>({
  options,
  value,
  onChange,
  label = String,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  label?: (v: T) => string
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          aria-pressed={o === value}
          className={`min-h-12 flex-1 rounded-xl font-semibold ${o === value ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300'}`}
        >
          {label(o)}
        </button>
      ))}
    </div>
  )
}

const ON_OFF = ['On', 'Off'] as const

export function Settings() {
  const s = useSettings()
  const fileInput = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<File>()
  const [erasing, setErasing] = useState(false)
  const [message, setMessage] = useState('')

  const toggle = (key: 'restEnabled' | 'sound' | 'vibrate') => (
    <Choices options={ON_OFF} value={s[key] ? 'On' : 'Off'} onChange={(v) => updateSettings({ [key]: v === 'On' })} />
  )

  return (
    <>
      <Header title="Settings" backTo="" />
      <div className="space-y-3 p-3">
        <section className="card divide-y divide-zinc-800 px-4">
          <Row title="Weight unit" hint="Your past lifts are converted automatically.">
            <Choices options={['kg', 'lb'] as const} value={s.unit} onChange={(unit) => updateSettings({ unit })} />
          </Row>
          <Row title="Weight step" hint="How much the + and − buttons change the weight.">
            <Choices
              options={STEP_OPTIONS[s.unit]}
              value={weightStep(s)}
              label={(v) => `${v} ${s.unit}`}
              onChange={(v) => updateSettings(s.unit === 'kg' ? { stepKg: v } : { stepLb: v })}
            />
          </Row>
        </section>

        <section className="card divide-y divide-zinc-800 px-4">
          <Row title="Rest timer" hint="Starts by itself when you tick a set.">
            {toggle('restEnabled')}
          </Row>
          <Row title="Rest length">
            <div className="flex items-center gap-2">
              <button
                className="btn btn-ghost w-16"
                onClick={() => updateSettings({ restSeconds: Math.max(15, s.restSeconds - 15) })}
                aria-label="15 seconds less"
              >
                −15s
              </button>
              <div className="flex-1 text-center text-3xl font-bold tabular-nums">{fmtClock(s.restSeconds * 1000)}</div>
              <button
                className="btn btn-ghost w-16"
                onClick={() => updateSettings({ restSeconds: Math.min(600, s.restSeconds + 15) })}
                aria-label="15 seconds more"
              >
                +15s
              </button>
            </div>
          </Row>
          <Row title="Sound when rest is over">{toggle('sound')}</Row>
          <Row title="Vibrate when rest is over" hint="Android phones only. iPhones don't allow it from a web app.">
            {toggle('vibrate')}
          </Row>
        </section>

        <section className="card divide-y divide-zinc-800 px-4">
          <Row title="Your data" hint="Everything is stored on this phone only. Save a backup file now and then.">
            <div className="flex flex-col gap-2">
              <button className="btn btn-ghost" onClick={exportBackup}>
                Save a backup file
              </button>
              <button className="btn btn-ghost" onClick={() => fileInput.current?.click()}>
                Restore from a backup file
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  setPendingImport(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>
          </Row>
          <Row title="Try it with sample data" hint="Adds ten weeks of made-up workouts so you can see the Progress screens.">
            <button
              className="btn btn-ghost w-full"
              onClick={async () => {
                await loadSampleData()
                setMessage('Sample workouts added. Have a look at Progress.')
              }}
            >
              Add sample workouts
            </button>
          </Row>
          <Row title="Start again">
            <button className="btn btn-danger w-full" onClick={() => setErasing(true)}>
              Erase everything
            </button>
          </Row>
        </section>
        {message && (
          <p className="rounded-xl bg-zinc-800 p-3 text-center font-semibold" role="status">
            {message}
          </p>
        )}

        <p className="px-2 pb-4 text-center text-sm text-zinc-500">
          Liftlog 0.1 · Exercise photos from free-exercise-db (public domain).
        </p>
      </div>

      {pendingImport && (
        <ConfirmSheet
          title="Restore this backup?"
          message="It replaces everything currently in the app."
          confirmLabel="Restore"
          onClose={() => setPendingImport(undefined)}
          onConfirm={async () => {
            try {
              await importBackup(pendingImport)
              setMessage('Backup restored.')
            } catch (e) {
              setMessage(e instanceof Error ? e.message : 'That file could not be read.')
            }
            setPendingImport(undefined)
          }}
        />
      )}
      {erasing && (
        <ConfirmSheet
          title="Erase everything?"
          message="All workouts, days and custom exercises are deleted from this phone. This can't be undone."
          confirmLabel="Erase everything"
          danger
          onClose={() => setErasing(false)}
          onConfirm={eraseEverything}
        />
      )}
    </>
  )
}
