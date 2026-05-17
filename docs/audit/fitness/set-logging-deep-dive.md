# Set-Logging Deep Dive

> **Goal-prompt output #4.** Verdict on every facet of set logging in the current implementation, based on code reading verified against schema and store. Runtime verification queued (R-001 blocks fresh-install path).

## TL;DR

Set logging is **persisted, validated, but architecturally fragile**: every commit hits SQLite atomically, validation is tight, BUT (a) `updateSet` references a non-existent column (F-012, P0 silent crash), (b) cardio is unloggable (F-003, schema gap), (c) no per-set lifecycle (F-007), (d) no autosave for in-flight draft (F-006), (e) optimistic update is absent — every set triggers a full `getSession` refetch (latency).

## Facet matrix

Legend: ✓ have · ✗ missing · ⚠ partial/buggy · 🐞 confirmed bug

| Facet | Status | Evidence | Notes |
|---|---|---|---|
| Persist each set | ✓ | `workout.repository.ts:190-207` — `addSet` inside `withTransaction` writing `INSERT INTO workout_set` | One row per `logSet()`. Durable across app restart. |
| Reps | ✓ | schema.ts:309 `reps INTEGER NOT NULL`; validation 1-100 integer | |
| Weight (kg) | ✓ | schema.ts:308 `weight_kg REAL NOT NULL`; validation 0-500 | Half-kg increments allowed via input step="0.5". |
| Duration (cardio time) | ✗ | No column on `workout_set` | F-003 schema gap. |
| Distance (cardio) | ✗ | No column | F-003 schema gap. |
| Rest time | ✓ | schema.ts:310 `rest_seconds INTEGER` (nullable); store sends `restSeconds` per set | Editable only on add, NOT on edit (F-004). |
| Notes | ✓ | schema.ts:312 `notes TEXT`; store trims `notes.trim() \|\| null` (line 439) | Same: add-only (F-004). |
| RPE / effort | ⚠ | schema.ts:311 `effort TEXT CHECK IN ('easy','just_right','hard','maxed')` | 4-bucket scale, not 1-10 RPE. Goal Prompt asks for "RPE or equivalent" — bucket IS the equivalent. Documented as deliberate design choice, but no per-session effort. |
| Per-set state machine (pending/in-progress/completed/skipped) | ✗ | No status column on `workout_set` | F-007. Existence = completed. No "skip" affordance. |
| Per-set timestamp | ⚠ | schema.ts:313 `created_at TEXT NOT NULL DEFAULT (datetime('now'))` | Captured but NOT exposed in UI; cannot reconstruct cadence. |
| Per-set updated_at | 🐞 | `workout.repository.ts:289` writes `updated_at`, but schema has no such column | **F-012 P0 — every edit triggers SQL error.** |
| Validation | ✓ | `parseDraft` (`fitness.store.ts:406-440`): weight 0-500 (NaN rejected); reps 1-100 integer; rest 0-600 integer; effort whitelist by type; notes trimmed | Bounds match HTML input attrs. No silent coercion. |
| Atomic commit | ✓ | `addSet` wraps INSERT + `syncTotals` in `withTransaction` | Crash mid-write does not leave partial volume totals. |
| set_number race | ✓ (single-tab) | `MAX(set_number)+1` inside same transaction (line 178) | SQLite serializes; safe for the one-tab Capacitor model. Would break under concurrent web tabs. |
| Optimistic update | ✗ | `fitness.store.ts:310-313` — `await addSet` then `await getSession(sessionId)` | **2 round trips per log.** No optimistic insert; UI freezes until both complete. Latency-visible on cold SQLite. |
| Rollback on failure | ⚠ | Outer try/catch sets `errorMessage`. The INSERT is in a transaction so DB rolls back, but the in-memory `setDraft` is NOT cleared — typing is preserved (actually good UX) | But: `lastLoggedSet` is NOT rolled back if a partial state somehow leaked (defensive; not currently reachable). |
| Autosave for in-flight draft | ✗ | `setDraft = signal({...})` in-memory only; never persisted | F-006. Crash mid-typing → lost. |
| Resume workout | ✓ | `getActiveSession` queries `WHERE completed_at IS NULL`; store.initialize reads it | Survives kill. But active session can be left "stuck active" forever — no auto-archive after N days. |
| Offline | ✓ | SQLite is local-first (Capacitor) — there is no network call in set-logging | Goal Prompt asks; verified by reading. |
| Hardcoded values / TODOs | None found in fitness scope | grep `TODO\|FIXME\|XXX` in fitness files returns nothing | Clean. |
| Dead code | None found in store/repo/page; everything called | | |
| Broken flow / UI without logic | (none in set-logging itself) | The free-mode picker on overview IS wired (F-009 is wrong-location, not broken) | |
| UI present, logic missing | ✗ | `effort-row` radiogroup binds correctly to `updateEffort`; sends effort with set | OK. |
| Persist OK but bad UX | ✓ Cancel destructively deletes (F-005); edit-set throws on save (F-012); add-only-on-create (F-004) | | The persist works; the UX surrounding it has gaps. |
| Edit affordances | ⚠ (only weight + reps via Alert) | `editSet` in `active-workout.page.ts:126-161` + `updateSet` signature | F-004 + F-012. Editing is partial AND crashes. |
| Delete affordances | ✓ | Trash icon → confirm alert → `deleteSet` re-numbers remaining rows | UX is solid; data-safe. |

## What actually happens when the user logs a set (verified call graph)

```
User taps "Ghi set N"  (active-workout.page.html:222)
  → ActiveWorkoutPage logs nothing extra; relies on store
  → FitnessStore.logSet()                              (store:295)
      → parseDraft(this.setDraft())                    (store:302)  validation
      → workoutRepo.addSet(exerciseId, draft.value)    (store:310)  TRANSACTION:
          → SELECT MAX(set_number)+1                   (repo:175-184)
          → INSERT INTO workout_set                    (repo:191-205)
          → syncTotals(sessionId)                       (repo:206)
      → workoutRepo.getSession(sessionId)              (store:313)  re-fetch full detail
      → state writes:
          restSeconds = draft.value.restSeconds         → triggers RestTimer
          setDraft.notes = ''                           → keep weight/reps for next set
          lastLoggedSet = {...}                          → green toast
          successMessage = 'Đã log set tập.'
```

Observable cost: **2 SQLite round-trips per set** (insert + full hydrate of `WorkoutSessionDetail` joining session → exercises → sets). For a 12-set workout that's 24 queries hitting `withTransaction` + `getSession` joins. Likely measurable on cold SQLite.

## Findings that get their own issue file

- **F-012 (P0):** `updateSet` SQL writes to non-existent column. NEW this turn.
- **F-003 (P1):** Cardio fields absent.
- **F-007 (P2):** No set state machine.
- **F-004 (P2):** Edit limited to weight+reps.
- **F-006 (P3):** No autosave for draft.

## Findings that surface here but DO NOT need a new issue

- **2-round-trip per log = latency.** Watchlist; acceptable for v1 with ≤12 sets. Fix only if profiling shows >50ms perceived lag. Apple bar: should be <100ms. Optimistic update can be added later as a non-blocking refinement.
- **`created_at` exposed via DB but hidden in UI.** Minor; could surface "logged 1:23 PM" in the history-detail page (output of F-002). Will fold into F-002.
- **Active session has no max-age.** Edge case; user kills app mid-workout, ignores for a week, opens app → still in active session. Resume is correct but stale. Recommend a 12-hour soft auto-close in P2 alongside cancel changes (F-005).

## Apple-philosophy audit of the set-logging surface

| Apple principle | Score | Why |
|---|---|---|
| Tối giản | 6/10 | 4 inputs + 4 effort chips + notes is just-enough for strength, but the same screen does NOT degrade for cardio. Should fork. |
| Tách bạch | 5/10 | History-of-this-exercise lives in the same scroll as Add-next-set form; edit happens in an in-line Alert. Sheets/pages would clarify. |
| Rõ thứ bậc | 6/10 | "Hoàn thành" is a small toolbar text-button competing visually with "Hủy" right next to it (F-008). Primary action loses to chrome. |
| Giảm tải nhận thức | 7/10 | Effort scale is 4 buckets, not 10 — good. But planned-sets target (e.g. "2/4") is invisible; user has to remember. |
| Tương tác mượt | 5/10 | No haptic on log; 2-round-trip refetch makes log feel sticky; rest timer continues even if user opens edit alert. |

Overall: solid foundation, fix F-012 + F-008 + F-004 first, then the schema-level F-003/F-007 are clean wins.
