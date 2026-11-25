# MealPlaning backend

PocketBase 0.40.6 owns credentials and workspace revisions. Its username identity supports self-registration with no email. Better Auth's standard username registration still requires email and needs a separate database service.

## Data ownership

| Flow | Before | Online v1 |
|---|---|---|
| Open and set up | One local profile | Session selects the SQLite file. Setup writes the active profile. |
| Settings and overview | Global local storage | Both query the active SQLite file. Logout resets the page and reminders. |
| Ingredients, recipes and meal plans | Repositories write local tables | The workspace syncs edited rows and meal snapshots. |
| Training plans and workouts | Repositories write local tables | The workspace syncs plans, sessions, exercises and sets. |
| Workout history and totals | Repositories read logged sets | Both use the active workspace. The server also recalculates volumes. |
| Unsaved set and timer | Local draft and store state | Draft keys include the account ID. A page restart resets timers. |

Each database change increments a counter inside its SQLite transaction. The sync client stores a frozen workspace with an operation ID before its first send. Each account keeps its own pending operation across logout.

    Android UI → domain and repositories → account SQLite
                                              │
                       account outbox ────────┘
                                │
                                ▼
                       HTTPS read and write
                                │
                       authenticated owner
                                │
                  PocketBase workspace + receipt

The server identifies the workspace from authentication and performs revision checks in one transaction. It commits the new workspace and operation receipt together. A retry with identical content returns the same revision. Competing writes against the same revision produce one success and one conflict.

The app uses whole-workspace revisions for v1. A conflicting device can use the server workspace or intentionally replace it with the local workspace. The application retains existing meal and workout rules. The server verifies parent references and derives workout totals.

AI logs, device settings and unsaved input drafts stay on the device. The public proxy accepts only named app endpoints. The private admin uses the same validation and revision checks when editing records.

## Local verification

Install the pinned PocketBase binary for your OS. Run these commands from the repo root.

```sh
POCKETBASE_BIN=/absolute/path/to/pocketbase node --test server/workspace.test.mjs
npm run check:guards
npm run lint
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

On Android, use test accounts. An should record 40 kg × 6 and 40 kg × 5 offline. Confirm 440 kg before sync. After a lost response and retry, the server should store one session and two sets.

Binh should see an empty history and no draft from An. In the private admin, sort by reps and edit An's second set to seven reps. Sync An and confirm 520 kg. Check a meal snapshot after editing its recipe.

## CachyOS operations

Install the pinned Linux binary at `/opt/mealplaning/pocketbase`. Store each release under `/opt/mealplaning/releases/<commit>`. Include `server/` and a `release.env` file with `MEALPLAN_RELEASE=<commit>`.

Point `/opt/mealplaning/current` at the release. Start both units from `server/deploy/` as the dedicated user `mealplan`. The service state lives in `/var/lib/mealplaning`.

Create the first PocketBase superuser over SSH before starting the service. Store the credentials outside Git with root-only access. Use an SSH tunnel for the private admin.

```sh
ssh -o BatchMode=yes -N -L 18091:127.0.0.1:18089 cachyos-root
```

Open `http://127.0.0.1:18091/mealplan-admin.html`. The source database and admin listener stay on loopback. Funnel forwards public HTTPS to the allowlisted gateway on port 18090.

Save the current Funnel JSON before changing routes. For rollback, restore the previous release symlink and restart the services. Restore the saved Funnel routes if the public change needs reversal. Keep a copy of the database before changing versions.

Take an online SQLite backup with the backup command. Check its integrity and restore it to a separate directory for verification. Keep the production database in place during the restore check.
