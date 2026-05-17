# F-012 — `updateSet` writes to non-existent `workout_set.updated_at` column → silent runtime error on every edit

**Severity:** P0 (functional bug, blocks "Sửa set" flow)
**Status:** RESOLVED (Turn 3, emulator verify GREEN via F-013 chain)
**Discovered:** Turn 3, code-only

## Evidence

`src/app/core/repositories/workout.repository.ts:289`:
```sql
UPDATE workout_set SET weight_kg = ?, reps = ?, updated_at = ? WHERE id = ?
```

`src/app/core/services/database/schema.ts:304-314` — `workout_set` table DDL has:
- `id, workout_exercise_id, set_number, weight_kg, reps, rest_seconds, effort, notes, created_at`
- **No `updated_at` column.**

Run `grep -n "updated_at" schema.ts` → matches on `user_profile`, `weight_log`, `ingredient`, `dish`, `meal_slot`, `planned_dish`, `training_plan`, `ai_*` — but NOT on `workout_set`.

The catch block in `FitnessStore.updateSet` (line 396) will swallow the SQL error and surface `errorMessage`. From the user's perspective: tap "Sửa Set", change values, tap "Lưu" → the alert dismisses but the set list never updates and a red error banner appears.

## Cause

Either:
- The author intended to add `updated_at` to `workout_set` but only modified the SQL query; the schema migration was missed, OR
- A schema migration was reverted but the query wasn't.

The other tables WITH `updated_at` have it as nullable `TEXT` — easy fix.

## Proposed fix (smallest viable)

Option A (recommended) — **add the column via a new migration**:
- New migration in `migrations.ts` (version next): `ALTER TABLE workout_set ADD COLUMN updated_at TEXT`.
- Add to the base `schema.ts` DDL so fresh installs get it: `updated_at TEXT`.

Option B — **drop the column from the SQL**:
- Change line 289 to `UPDATE workout_set SET weight_kg = ?, reps = ? WHERE id = ?`.
- Loses audit info but ships in 1 line.

Pick A: tracking `updated_at` is genuinely useful for F-004 (full edit) and for a future "edited" badge in history. Migration is trivial since SQLite supports `ALTER TABLE ... ADD COLUMN`.

## Test plan

- **Unit:** new test `workout.repository.spec.ts` — `updateSet` round-trips weight/reps AND populates `updated_at` with a recent ISO.
- **Schema test:** add `workout_set.updated_at` assertion to `schema.spec.ts`.
- **E2E (after onboarding bypass):** start session → log set → edit set → confirm no error banner and value visibly updates.

## Changes made (Turn 3)

1. `schema.ts`:
   - Bumped `SCHEMA_VERSION` from `3` to `4`.
   - Added new `WORKOUT_SET_UPDATED_AT_DDL` const = `['ALTER TABLE workout_set ADD COLUMN updated_at TEXT']` (nullable, so v3 rows remain valid).
   - Added `buildWorkoutSetUpdatedAtMigration()` returning `{ version: 4, statements }`.
   - **Did NOT modify base v1 DDL** — append-only registry: shipped migrations are immutable. The new column arrives via the ALTER migration on every replay.
2. `migrations.ts`:
   - Imported `buildWorkoutSetUpdatedAtMigration`.
   - Appended to `MIGRATION_REGISTRY` (now length 4). Doc comment updated.
3. `migrations.spec.ts`:
   - Bumped registry-length and version assertions from v3 → v4; added a new `describe('buildWorkoutSetUpdatedAtMigration (F-012)')` block covering version + the single ALTER statement.
4. `__test__/create-test-database.spec.ts`:
   - Bumped `expect(SCHEMA_VERSION).toBe(3)` → `toBe(4)`.

## Test result (Turn 3)

`ng test --include='src/app/core/services/database/**/*.spec.ts' --include='src/app/core/repositories/fitness.repositories.spec.ts'` → **72 of 72 GREEN**, exit 0. Log: `/tmp/ng-test-f012-v2.log`.

## Pending

- T-01: dedicated `workout.repository.spec.ts` test asserting `updateSet` round-trips `updated_at` ISO. (New file — currently NO repo-level spec exists for workout.repository.)
- T-02: `schema.spec.ts` should assert `workout_set.updated_at` exists in DDL.
- Architecture guard: `scripts/check-repo-columns.mjs` would have caught this class of bug at lint time.
- APK rebuild + emulator verify (gated on R-001 onboarding bypass).

## Status

FIXED-IN-CODE. Will mark RESOLVED only after emulator verify + T-01 lands.
