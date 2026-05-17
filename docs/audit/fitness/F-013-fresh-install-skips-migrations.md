# F-013 — Fresh-install fast-path skips ALL post-v1 migrations on native Android

**Severity:** P0 (silent schema divergence on every clean install / first launch)
**Status:** RESOLVED (Turn 3, emulator verify GREEN)
**Discovered:** Turn 3 — emulator verify of F-012 surfaced this.

## Evidence

`src/app/core/services/database/native-database.ts:64-69` (pre-fix):

```ts
const currentVersion = await this.readUserVersion();
if (currentVersion === 0 && (await this.isDatabaseEmpty())) {
  await this.applySchema();              // applies SCHEMA_DDL (= v1 only)
  await this.setUserVersion(SCHEMA_VERSION);  // jumps to 4
  return;
}
```

On a clean Android install the fast-path runs:
1. `applySchema()` — `SCHEMA_DDL` is the v1 canonical DDL (per the "shipped migrations are immutable" convention enforced by `migrations.ts`).
2. `setUserVersion(SCHEMA_VERSION)` — bumps `user_version` straight to 4.
3. `return` — **MigrationRunner.run() never executes**, so v2/v3/v4 ALTERs never apply.

Result: DB lies about its version. Every consumer that assumes "user_version=4 ⇒ updated_at column exists" silently fails on fresh install. Inspected on emulator-5554 after `npx ng build && cap sync && gradle assembleDebug && adb install`:

```
$ sqlite3 healthmate_devSQLite.db
sqlite> PRAGMA user_version;
4
sqlite> PRAGMA table_info(workout_set);
0|id|TEXT|0||1
1|workout_exercise_id|TEXT|1||0
2|set_number|INTEGER|1||0
3|weight_kg|REAL|1||0
4|reps|INTEGER|1||0
5|rest_seconds|INTEGER|0||0
6|effort|TEXT|0||0
7|notes|TEXT|0||0
8|created_at|TEXT|1|datetime('now')|0
-- no updated_at column!
```

(WebDatabase init at `web-database.ts:35` does NOT have this fast-path — it always calls `new MigrationRunner(this, MIGRATION_REGISTRY).run()`. That's why unit tests on sql.js never caught this.)

## Cause

`SCHEMA_DDL` was originally the only schema source. When v2/v3 migrations were added, the convention "base DDL = v1, append-only registry" was adopted to prevent duplicate-column errors during test replay. But the fresh-install branch was never updated to *replay* the registry after applying the v1 base — it kept the old "applied = done" assumption.

## Fix (smallest viable, applied Turn 3)

`native-database.ts:64-75`:

```ts
const currentVersion = await this.readUserVersion();
if (currentVersion === 0 && (await this.isDatabaseEmpty())) {
  // F-013: applySchema installs v1 base DDL only. Set user_version to 1 here,
  // then fall through so MigrationRunner replays v2..vN.
  await this.applySchema();
  await this.setUserVersion(1);
}

await this.resetLegacyManagementSchemaIfNeeded(await this.readUserVersion());
await new MigrationRunner(this, MIGRATION_REGISTRY).run();
```

Two-line change: drop the `return`, set version to 1 instead of SCHEMA_VERSION, then let the existing runner replay everything past v1.

## Test plan

- **Existing tests still pass** — they exercise WebDatabase which already replays. No regression.
- **NEW test (T-04, pending):** spec asserting NativeDatabase init on an empty DB lands at `user_version = SCHEMA_VERSION` AND the workout_set DDL contains `updated_at`. Currently no NativeDatabase spec exists (it's hidden behind Capacitor mocks). Mock-level test: assert `applySchema()` is followed by `MigrationRunner.run()` call with the full registry.
- **Emulator verify:** `adb shell pm clear com.healthmate.ai` → relaunch → pull DB → assert `PRAGMA table_info(workout_set)` includes `updated_at`.

## Status

RESOLVED. Confirmed on emulator-5554 (Turn 3) after `pm clear com.healthmate.ai` + relaunch + DB pull:

```
$ sqlite3 /tmp/dev3.db "PRAGMA user_version; SELECT sql FROM sqlite_master WHERE name='workout_set';"
4
CREATE TABLE workout_set (
  id …, weight_kg REAL NOT NULL, reps INTEGER NOT NULL, …, created_at TEXT NOT NULL DEFAULT (datetime('now'))
, updated_at TEXT)
```

DB now actually matches the version it claims.

## Apple-philosophy re-audit

N/A — this is a data integrity bug, not a UX issue. But: **trust** is an Apple principle. A DB that lies about its `user_version` violates user trust transitively — features built on the assumed schema will silently misbehave with no error UI. Fixing this restores the contract: "user_version N ⇒ DB matches schema vN."
