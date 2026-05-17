# Test gaps & tests to add — Fitness scope

> **Goal-prompt output #8.** Current test coverage map + what must be added, prioritized by Goal-Prompt direction (set-logging and workout session get the highest priority).

## Current coverage map (verified by file listing + line counts)

| File | Surface | `it()` count | Verdict |
|---|---|---|---|
| `src/app/core/stores/fitness.store.spec.ts` | FitnessStore | 13 | Light — covers happy paths; verify what's missing below |
| `src/app/core/repositories/fitness.repositories.spec.ts` | Plan repo + workout repo combined | 7 | Very light — likely no `updateSet` test (would have caught F-012!) |
| `src/app/core/services/database/schema.spec.ts` | DDL invariants | ~30 lines of assertions | Does NOT assert `workout_set.updated_at` (would have caught F-012!) |
| `e2e/specs/smoke-boot.e2e.ts` | App launches | unknown | Smoke only |
| `e2e/specs/onboarding-persist.e2e.ts` | Onboarding completion persists | unknown | Not fitness |
| `e2e/specs/b3-form-unify-visual.e2e.ts` | Visual form audit | unknown | Not fitness |

**Zero e2e for fitness flows.** Zero unit test for `WorkoutRepository.updateSet`. Zero schema-assertion for the columns `workout.repository.ts` writes.

## Why F-012 wasn't caught

The schema test pattern (per `schema.spec.ts`) asserts which tables exist, but does NOT assert columns referenced by repository queries. A simple guard would be: parse `*.repository.ts` for `UPDATE\|INSERT INTO ... SET` and `\b\w+\b` column tokens, then assert each appears in the DDL.

## Tests to add — priority order

### P0 — would have caught F-012 (write this FIRST as part of F-012 fix)

| # | File | Test | Rationale |
|---|---|---|---|
| T-01 | `workout.repository.spec.ts` (new) | `updateSet` round-trips weight, reps, and writes `updated_at` ISO | Direct regression test |
| T-02 | `schema.spec.ts` | `workout_set` DDL contains `updated_at` | Schema-level guard |
| T-03 | `scripts/check-repo-columns.mjs` (new guard) | All columns referenced in repository SQL exist in schema.ts DDL | Prevents future F-012-class bugs |

### P1 — set logging (Goal-prompt highest priority)

| # | File | Test | Notes |
|---|---|---|---|
| T-10 | `workout.repository.spec.ts` | `addSet` happy path → row persists; `set_number` increments | |
| T-11 | `workout.repository.spec.ts` | `addSet` two sets → second has `set_number=2` | |
| T-12 | `workout.repository.spec.ts` | `addSet` updates `workout_session.total_volume` and `workout_exercise.total_volume` via `syncTotals` | |
| T-13 | `workout.repository.spec.ts` | `deleteSet` re-numbers remaining sets to contiguous 1..N | |
| T-14 | `workout.repository.spec.ts` | `addSet` is atomic — if INSERT throws, totals unchanged (simulate with mock) | |
| T-15 | `fitness.store.spec.ts` | `parseDraft` rejects weight = -1, 501, NaN | bounds |
| T-16 | `fitness.store.spec.ts` | `parseDraft` rejects reps = 0, 0.5, 101 | bounds |
| T-17 | `fitness.store.spec.ts` | `parseDraft` rejects rest = -1, 601 | bounds |
| T-18 | `fitness.store.spec.ts` | `logSet` happy path → `lastLoggedSet` populated; `notes` cleared in draft; weight/reps preserved | |
| T-19 | `fitness.store.spec.ts` | `logSet` validation error → no DB write; `errorMessage` set | |
| T-20 | `fitness.store.spec.ts` | `logSet` repo error → state reverts; `errorMessage` set | |

### P2 — workout session lifecycle

| # | File | Test |
|---|---|---|
| T-30 | `workout.repository.spec.ts` | Only one active session at a time — `getActiveSession` returns last `WHERE completed_at IS NULL` |
| T-31 | `workout.repository.spec.ts` | `startGuidedSession` is idempotent if active exists |
| T-32 | `workout.repository.spec.ts` | `completeSession` sets `completed_at`, computes `duration_minutes ≥ 1` |
| T-33 | `workout.repository.spec.ts` | `completeSession` on already-completed session throws |
| T-34 | `workout.repository.spec.ts` | `cancelSession` hard-deletes (current) — DOCUMENT this until F-005 ships soft-cancel |
| T-35 | `fitness.store.spec.ts` | `completeWorkout` blocked when 0 sets logged |
| T-36 | `fitness.store.spec.ts` | After `completeWorkout` → `activeSession === null`; `progress` refreshed |

### P3 — history list (will be added with F-002)

| T-40 | `workout.repository.spec.ts` | `recentSessions(limit)` returns rows `completed_at DESC` |
| T-41 | `workout.repository.spec.ts` | `recentSessions` ignores in-progress sessions |
| T-42 | `history.page.spec.ts` (new) | Empty state when zero sessions |
| T-43 | `history.page.spec.ts` | Rows grouped by ISO week label |

### P4 — schema gaps (after F-003/F-007 land)

| T-50 | `schema.spec.ts` | `workout_set.set_type` defaults to `'strength'`, accepts `'cardio'` |
| T-51 | `schema.spec.ts` | `workout_set.duration_seconds` nullable; cardio inserts succeed |
| T-52 | `schema.spec.ts` | `workout_set.status` defaults `'completed'`; accepts `'skipped'` |
| T-53 | `workout.repository.spec.ts` | `addSet(cardio)` round-trip with duration but no weight/reps |

### E2E — fitness flows (NEW, since none exist)

| # | File (new) | Flow |
|---|---|---|
| E-01 | `e2e/specs/fitness-start-guided.e2e.ts` | Onboard → fitness tab → pick preset → start guided session → reaches `/active` page |
| E-02 | `e2e/specs/fitness-log-set.e2e.ts` | Continues E-01 → enters weight + reps → Log Set → past-set row appears with correct values |
| E-03 | `e2e/specs/fitness-edit-set.e2e.ts` | Continues E-02 → tap past set → Sửa → change weight → Lưu → no error banner → value updated. **THIS FAILS TODAY (F-012); will pass after fix.** |
| E-04 | `e2e/specs/fitness-delete-set.e2e.ts` | Continues E-02 → delete set → confirm alert → row removed |
| E-05 | `e2e/specs/fitness-complete-workout.e2e.ts` | Continues E-02 → tap Hoàn thành → confirm → returns to overview with success toast |
| E-06 | `e2e/specs/fitness-resume.e2e.ts` | Log 1 set → kill app → relaunch → Resume banner appears → tap → back in active workout with previous set |
| E-07 | `e2e/specs/fitness-history.e2e.ts` (after F-002 ships) | Complete session → navigate to History → row visible → tap → detail page renders sets |

E2E uses **existing** `app-driver.ts` helper + Appium UiAutomator2 (per `e2e/wdio.conf.ts`). No new frameworks. Uses text-based selectors since WebView CDP is intentionally disabled (per wdio.conf comment about WebView 147 SIGTRAP).

## Coverage target after this backlog

- Repo: ~25 tests covering all CRUD paths and error branches
- Store: ~15 tests covering all mutators + validation
- Schema: ~5 new assertions for workout_set columns
- E2E: 7 fitness flows
- Plus 1 new architecture guard (`check-repo-columns.mjs`)

This is the minimum to call set-logging and workout-session "trustworthy."
