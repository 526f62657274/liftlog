import { useLiveQuery } from 'dexie-react-hooks'
import { CelebrationToast } from './components/CelebrationToast'
import { RestBar } from './components/RestBar'
import { TabBar } from './components/TabBar'
import { db } from './lib/db'
import { go, useRoute } from './lib/router'
import { DayEdit } from './screens/DayEdit'
import { ExerciseProgress } from './screens/ExerciseProgress'
import { ExerciseForm, Exercises } from './screens/Exercises'
import { History, HistoryDetail } from './screens/History'
import { Home } from './screens/Home'
import { Progress } from './screens/Progress'
import { Settings } from './screens/Settings'
import { WorkoutScreen } from './screens/WorkoutScreen'

function screenFor([a, b, c]: string[]) {
  switch (a) {
    case 'workout':
      return <WorkoutScreen />
    case 'day':
      return <DayEdit id={b} />
    case 'exercises':
      return <Exercises />
    case 'exercise':
      return <ExerciseForm id={b === 'edit' ? c : undefined} />
    case 'progress':
      return b ? <ExerciseProgress id={b} /> : <Progress />
    case 'history':
      return b ? <HistoryDetail id={b} /> : <History />
    case 'settings':
      return <Settings />
    default:
      return <Home />
  }
}

// Focused screens (logging, editing) hide the tabs so nothing competes with the task.
const NO_TABS = ['workout', 'day', 'exercise', 'settings']

export default function App() {
  const route = useRoute()
  const section = route[0] ?? ''
  const active = useLiveQuery(() => db.workouts.filter((w) => !w.endedAt).first(), [])

  return (
    <div className="mx-auto flex h-full max-w-md flex-col">
      {/* Keyed so each screen starts scrolled to the top. */}
      <main key={route.join('/')} className="flex-1 overflow-y-auto">
        {screenFor(route)}
      </main>
      <RestBar />
      {active && section !== 'workout' && section !== '' && (
        <button className="bg-lime-400 px-4 py-3 text-center font-bold text-zinc-950" onClick={() => go('workout')}>
          Workout in progress. Tap to continue
        </button>
      )}
      {!NO_TABS.includes(section) && <TabBar active={section} />}
      <CelebrationToast />
    </div>
  )
}
