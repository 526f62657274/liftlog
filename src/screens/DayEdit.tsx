import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { ExerciseImage } from '../components/ExerciseImage'
import { ExercisePicker } from '../components/ExercisePicker'
import { Header } from '../components/Header'
import { Icon } from '../components/Icon'
import { ConfirmSheet } from '../components/Sheet'
import { db } from '../lib/db'
import { back } from '../lib/router'
import type { Exercise } from '../lib/types'

function SortableRow({ exercise, onRemove }: { exercise: Exercise; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: exercise.id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`card flex items-center gap-2 p-2 ${isDragging ? 'relative z-10 border-lime-400 shadow-xl shadow-black' : ''}`}
    >
      <button
        className="grid h-12 w-10 shrink-0 touch-none place-items-center text-zinc-500"
        aria-label={`Drag to reorder ${exercise.name}`}
        {...attributes}
        {...listeners}
      >
        <Icon name="grip" />
      </button>
      <ExerciseImage exercise={exercise} className="h-12 w-12" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{exercise.name}</div>
        <div className="truncate text-sm text-zinc-400">{exercise.muscle}</div>
      </div>
      <button
        className="grid h-12 w-12 shrink-0 place-items-center text-zinc-400"
        onClick={onRemove}
        aria-label={`Remove ${exercise.name}`}
      >
        <Icon name="x" />
      </button>
    </li>
  )
}

/** Typing is held locally and written through: a database-driven value would lag behind the keyboard. */
function NameField({ initial, onSave }: { initial: string; onSave: (name: string) => void }) {
  const [name, setName] = useState(initial)
  return (
    <input
      className="field mt-1 text-lg font-bold"
      value={name}
      placeholder="e.g. Chest Day"
      onChange={(e) => {
        setName(e.target.value)
        onSave(e.target.value.trim() || 'My day')
      }}
    />
  )
}

export function DayEdit({ id }: { id: string }) {
  const routine = useLiveQuery(() => db.routines.get(id), [id])
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
  const [picking, setPicking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (!routine || !exercises) return <Header title="Edit day" backTo="" />

  const byId = new Map(exercises.map((e) => [e.id, e]))
  const rows = routine.exerciseIds.flatMap((eid) => byId.get(eid) ?? [])
  const save = (exerciseIds: string[]) => db.routines.update(id, { exerciseIds })

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const ids = rows.map((e) => e.id)
    void save(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))))
  }

  return (
    <>
      <Header title="Edit day" subtitle="Changes save automatically" backTo="" />
      <div className="space-y-4 p-3">
        <label className="block">
          <span className="label">Name</span>
          <NameField key={id} initial={routine.name} onSave={(name) => db.routines.update(id, { name })} />
        </label>

        <div>
          <div className="label mb-2">Exercises{rows.length > 1 ? ' · drag to reorder' : ''}</div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={rows.map((e) => e.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {rows.map((e) => (
                  <SortableRow key={e.id} exercise={e} onRemove={() => save(rows.filter((r) => r.id !== e.id).map((r) => r.id))} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          {!rows.length && <p className="py-4 text-center text-zinc-400">Nothing here yet.</p>}
          <button className="btn btn-primary mt-3 w-full" onClick={() => setPicking(true)}>
            <Icon name="plus" size={20} /> Add exercises
          </button>
        </div>

        <button className="btn btn-danger w-full" onClick={() => setDeleting(true)}>
          <Icon name="trash" size={20} /> Delete this day
        </button>
      </div>

      {picking && (
        <ExercisePicker
          exclude={rows.map((e) => e.id)}
          onClose={() => setPicking(false)}
          onAdd={(ids) => {
            void save([...rows.map((e) => e.id), ...ids])
            setPicking(false)
          }}
        />
      )}
      {deleting && (
        <ConfirmSheet
          title={`Delete "${routine.name}"?`}
          message="Your past workouts stay in History."
          confirmLabel="Delete day"
          danger
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await db.routines.delete(id)
            back()
          }}
        />
      )}
    </>
  )
}
