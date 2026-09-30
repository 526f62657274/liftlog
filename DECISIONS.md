# Decisions

Choices made where the brief was open, newest concerns first. Each is cheap to change; the file
to edit is named where it helps.

## Open question: the brief was cut off

The brief ends mid-way through the Difficulty Score section, straight after the per-set formula.
Anything it went on to say (a per-session score, colour bands, labels) is not built from the brief
but from the decisions below. **Please check the "Difficulty Score" section against the full brief.**

## Difficulty Score

- **Per set:** `set e1RM ÷ best e1RM before that set × 100`, as specified. "Best" means the best
  *up to that moment*, not the best as of today. That is what makes "over 100 = new PR" true, and
  it stops old scores from shrinking every time he gets stronger.
- **His first ever set of an exercise scores 100.** There is nothing to compare it to, so it
  becomes the baseline.
- **Per session:** the average of the session's set scores. This is the number on the trend chart
  and the tile. The top set's score is shown beside it. (Guess: the brief was cut off here.)
- **Bodyweight sets (weight 0)** have no e1RM, so they are scored on reps against his best
  bodyweight reps. Same 0–100+ meaning.
- The score is shown under every ticked set while logging, because it is the selling point.

## e1RM and records

- Epley: `weight × (1 + reps ÷ 30)`. One rep counts as the weight itself.
- Above 12 reps the estimate is still calculated and still counts, but the "Est. 1-rep max" tile
  is labelled "Rough guess: over 12 reps". Excluding those sets would have made the Difficulty
  Score unfair to light/high-rep work, which is the opposite of its purpose.
- Three kinds of record trigger the celebration: heaviest weight, best e1RM, and most reps at a
  weight he has lifted before.
- **No celebrations in the first session of an exercise.** Otherwise every set on day one is a
  "record" and the moment means nothing by week two.
- Records are never stored. They are recalculated from the sets, so editing or deleting a workout
  can't leave a stale record behind.

## Logging

- **Pre-filled, not placeholder.** Last session's numbers are real values shown in grey; one tap
  on the tick confirms them and turns them white. Placeholders would have needed typing.
- Row N is pre-filled from row N of last time. If he did more than 3 sets last time, he gets that
  many rows.
- With no history the rows are empty. Ticking set 1 copies its numbers into the next empty row.
- A set with no reps can't be ticked; a one-line hint says why.
- Tapping a tick again unticks it (fixing mistakes needs no menu).
- Removing a set: swipe left, or the "Remove set" button (removes the last row). Swipe alone is
  not discoverable enough.
- All exercises of the workout are on one scrolling screen, rather than one exercise per screen.
  Fewer taps, and he can see what is coming.
- "Skip" removes an exercise from this workout only. It asks first if sets are already ticked.
- Finishing drops unticked rows. A workout with nothing ticked is discarded rather than saved empty.
- Leaving the workout screen does not end the workout. A banner on every other screen leads back.
- Only one workout can be in progress. While one is, the Start buttons are hidden.
- An exercise can appear once per day and once per workout.

## Units

- Weights are stored in kg. The kg/lb switch only changes what is shown, so switching never
  corrupts history.
- kg shows up to 2 decimals (for 1.25 kg plates); lb shows 1.
- Weight step: 2.5 kg by default (choices 1 / 1.25 / 2.5 / 5), and 5 lb (choices 2.5 / 5 / 10).

## Timing

- Rest timer: 90 s default, adjustable in 15 s steps, with +15s and Skip while running. It keeps
  counting on every screen and survives a reload.
- Sound and vibration fire when it ends. **iPhones do not support vibration from web apps**, and
  no phone will beep from a web app while the screen is locked. The APK can fix both (see README).
- Time per exercise is first tick to last tick. With one set there is no span, so it shows "–".

## Progress

- The eight trackers are tiles and tables on each exercise's page. The four charts are one chart
  with a selector, not four stacked charts, so nothing needs scrolling past.
- One measure per chart; never two scales on one chart.
- The week starts on Monday.
- The heatmap covers 16 weeks and is shaded by sets done that day.
- Bodyweight-only exercises swap the weight charts for "Best reps" and "Total reps".

## Exercise library

- 43 exercises, photos from free-exercise-db. Licence checked: the Unlicense (public domain), for
  data and images alike. Only the 43 photos in use are bundled, resized to 480 px (1.4 MB in
  total). Nothing is hotlinked.
- Exercises without a photo show a body outline with the muscle group lit up.
- Custom exercise photos are shrunk to 480 px and stored on the device with the exercise.
- Library exercises can't be edited or deleted; custom ones can. Deleting one deletes its sets.
- No plank or other timed holds: they are measured in seconds, which a weight × reps row can't
  express without extra explaining.

## App structure

- Four tabs: Train, Exercises, Progress, History. Settings is behind the icon on the Train tab.
- No router library: a few lines of hash routing (`src/lib/router.ts`). It needs no server
  rewrites, works inside Capacitor, and makes the Android back button work.
- Settings live in localStorage; workouts live in IndexedDB via Dexie.
- Extras added because the data is only on the device: backup to a file, restore from a file,
  erase everything, and "Add sample workouts" for trying the Progress screens.

## Not built yet

- Cloud sync, accounts, and sharing.
- Notes on sets or workouts, supersets, warm-up sets, RPE.
- Editing a finished workout (it can only be deleted).
- Timed exercises and cardio.
- Rest alerts while the phone is locked (needs the APK and a notifications plugin).
