# Liftlog

A dead-simple gym tracker: pick a day, tick your sets, watch the numbers go up.
Everything is stored on the phone. There is no account and no server.

**Open the app:** https://526f62657274.github.io/liftlog/

**Want to change something?** See [CONTRIBUTING.md](CONTRIBUTING.md). You can do it all in the browser.

## Run it

Needs Node 20 or newer.

```sh
npm install
npm run dev        # http://localhost:5173, and a Network address for your phone
```

To try it on a phone, connect the phone to the same Wi-Fi and open the Network address the
command prints. Want charts straight away? Settings → **Add sample workouts**.

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Type-checks and builds the app into `dist/` |
| `npm run preview` | Serves the built app (this is the version that works offline) |
| `npm test` | Runs the unit tests for the scoring and records logic |
| `npm run lint` | Lints the code |

## Install it on a phone (no app store)

Host the `dist/` folder on any HTTPS static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages).
Open the address on the phone, then choose **Add to Home screen** (Chrome on Android) or
**Share → Add to Home Screen** (Safari on iPhone). It then opens full screen and works offline.

Installing needs HTTPS. Over plain Wi-Fi (`http://192.168…`) the app runs, but it can't be
installed and won't work offline.

## Build an Android APK

The Capacitor config is already in place (`capacitor.config.ts`). You need
[Android Studio](https://developer.android.com/studio) installed for this part only.

```sh
npm run android:add     # once: creates the android/ project
npm run android:sync    # builds the web app and copies it into android/
npm run android:open    # opens Android Studio
```

In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**. The debug APK lands in
`android/app/build/outputs/apk/debug/` and can be copied to a phone and installed.

Run `npm run android:sync` again after every change to the web code.

Before giving the APK to real users:

- To let custom-exercise photos use the camera, add
  `<uses-permission android:name="android.permission.CAMERA" />` to
  `android/app/src/main/AndroidManifest.xml`. Without it, the gallery still works.
- "Save a backup file" uses a browser download, which an Android WebView ignores. Swap it for
  `@capacitor/filesystem` + `@capacitor/share` (the one function to change is `exportBackup` in
  `src/lib/backup.ts`).
- The rest timer only beeps and vibrates while the app is on screen. For an alert with the phone
  locked, add `@capacitor/local-notifications` and schedule one in `startRest` (`src/lib/restTimer.ts`).
- Change the app id `app.liftlog` in `capacitor.config.ts` to one you own, and set up a signing key
  for a release build.

## Where things are

```
src/lib/analytics.ts   e1RM, Difficulty Score, records, session stats (pure, unit-tested)
src/lib/actions.ts     start/finish a workout, tick a set, prefill from last time
src/lib/db.ts          Dexie (IndexedDB) tables and first-launch seeding
src/lib/seed.ts        the exercise library and the three starter days
src/lib/settings.ts    units, weight step, rest timer (localStorage)
src/screens/           one file per screen
src/components/        set row, number field, picker, chart, sheets
public/exercises/      bundled exercise photos
DECISIONS.md           product and design decisions, and what is not built yet
```

## Credits

Exercise photos are from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), released
into the public domain under the Unlicense (copy in `public/exercises/LICENSE.md`).
