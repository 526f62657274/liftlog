# Working on Liftlog

You don't need to install anything. Everything below happens in your web browser.

## Use the app

Open the app link at the top of the README on your phone. To keep it like a normal app:

- **Android (Chrome):** menu ⋮ → **Add to Home screen**
- **iPhone (Safari):** Share → **Add to Home Screen**

Your workouts are saved on your own phone only.

## Change the code

1. On the GitHub page for this project, click the green **Code** button.
2. Choose the **Codespaces** tab, then **Create codespace on main**.
3. Wait a minute or two. VS Code opens in your browser, installs everything, and the app appears
   in a panel on the right. If it doesn't, open the **Ports** tab at the bottom and click the
   globe icon next to port 5173.
4. Edit a file and save it. The app panel updates by itself.

Codespaces is free for about 60 hours a month. When you're done, close the tab. It stops on its own
after 30 minutes idle. Delete old ones at github.com/codespaces.

## Send your change

Don't commit straight to `main`: that goes live for everyone immediately.

1. Click the **Source Control** icon on the left (it looks like a branching line).
2. Click the branch name at the bottom-left of the window → **Create new branch** → give it a
   short name such as `bigger-buttons`.
3. Type a message saying what you changed, then click **Commit**, then **Publish Branch**.
4. Go back to the project on GitHub. A yellow bar offers **Compare & pull request**. Click it and
   then **Create pull request**.

GitHub then checks the change builds and passes the tests (a green tick). Once the other person has
had a look, click **Merge pull request**. A couple of minutes later the live app updates.

## If something goes wrong

- **The app panel is blank:** in the terminal at the bottom, press `Ctrl+C`, type `npm run dev` and
  press Enter.
- **A red cross on your pull request:** click **Details** to see what failed, or ask for help in
  the pull request comments.
- **Lost in a mess of changes:** delete the codespace and create a new one. Anything you didn't
  commit is thrown away, and `main` is untouched.

## Where things are

- `src/screens/`: one file per screen (Home, Workout, Progress, History, Settings…)
- `src/lib/analytics.ts`: the maths (1-rep max, Difficulty Score, records)
- `src/lib/seed.ts`: the built-in exercise list and starter workout days
- `DECISIONS.md`: why things work the way they do
