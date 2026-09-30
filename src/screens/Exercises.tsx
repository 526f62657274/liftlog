import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { ExerciseBrowser } from '../components/ExerciseBrowser'
import { ExerciseImage } from '../components/ExerciseImage'
import { Header } from '../components/Header'
import { Icon } from '../components/Icon'
import { ConfirmSheet } from '../components/Sheet'
import { deleteExercise } from '../lib/actions'
import { db, uid } from '../lib/db'
import { back, go } from '../lib/router'
import { type Exercise, MUSCLES, type Muscle } from '../lib/types'

export function Exercises() {
  return (
    <>
      <Header
        title="Exercises"
        scrolls
        right={
          <button className="btn btn-primary" onClick={() => go('exercise/new')}>
            <Icon name="plus" size={20} /> New
          </button>
        }
      />
      <ExerciseBrowser
        onPick={(e) => go(`progress/${e.id}`)}
        trailing={() => <Icon name="right" className="shrink-0 text-zinc-600" />}
      />
    </>
  )
}

/** Shrinks a camera photo to a small square-ish JPEG so it is cheap to store on the device. */
async function photoToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 480 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

/** Create a custom exercise, or edit one when `id` is given. */
export function ExerciseForm({ id }: { id?: string }) {
  const existing = useLiveQuery(async () => (id ? ((await db.exercises.get(id)) ?? null) : null), [id])
  if (existing === undefined) return null
  return <ExerciseFormFields key={existing?.id ?? 'new'} existing={existing} />
}

function ExerciseFormFields({ existing }: { existing: Exercise | null }) {
  const [name, setName] = useState(existing?.name ?? '')
  const [muscle, setMuscle] = useState<Muscle>(existing?.muscle ?? 'Chest')
  const [image, setImage] = useState(existing?.image)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const save = async () => {
    if (!name.trim()) return setError('Give it a name first.')
    await db.exercises.put({
      id: existing?.id ?? uid(),
      name: name.trim(),
      muscle,
      equipment: existing?.equipment ?? 'Custom',
      image,
      custom: true,
    })
    back('exercises')
  }

  return (
    <>
      <Header title={existing ? 'Edit exercise' : 'New exercise'} backTo="exercises" />
      <div className="space-y-5 p-3">
        <label className="block">
          <span className="label">Name</span>
          <input
            className="field mt-1"
            value={name}
            placeholder="e.g. Landmine Press"
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
          />
          {error && <span className="mt-1 block text-sm font-semibold text-amber-300">{error}</span>}
        </label>

        <div>
          <span className="label">Muscle group</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {MUSCLES.map((m) => (
              <button
                key={m}
                onClick={() => setMuscle(m)}
                aria-pressed={muscle === m}
                className={`min-h-12 rounded-full px-4 font-semibold ${
                  muscle === m ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">Photo (optional)</span>
          <div className="mt-1 flex items-center gap-3">
            <ExerciseImage exercise={{ name, muscle, image }} className="h-24 w-24" />
            <div className="flex flex-1 flex-col gap-2">
              <button className="btn btn-ghost" onClick={() => fileInput.current?.click()}>
                <Icon name="camera" size={20} /> {image ? 'Change photo' : 'Add photo'}
              </button>
              {image && (
                <button className="btn btn-ghost text-zinc-400" onClick={() => setImage(undefined)}>
                  Remove photo
                </button>
              )}
            </div>
          </div>
          {/* No `capture` attribute, so the phone offers both the camera and the gallery. */}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              try {
                setImage(await photoToDataUrl(file))
              } catch {
                setError("That photo couldn't be read. Try a different one.")
              }
            }}
          />
        </div>

        <button className="btn btn-primary w-full" onClick={save}>
          {existing ? 'Save changes' : 'Add exercise'}
        </button>
        {existing && (
          <button className="btn btn-danger w-full" onClick={() => setDeleting(true)}>
            <Icon name="trash" size={20} /> Delete exercise
          </button>
        )}
      </div>

      {deleting && existing && (
        <ConfirmSheet
          title={`Delete ${existing.name}?`}
          message="Every set you logged for it is deleted too. This can't be undone."
          confirmLabel="Delete exercise"
          danger
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await deleteExercise(existing.id)
            go('exercises')
          }}
        />
      )}
    </>
  )
}
