# F-007-no-set-state-machine — workout_set has no lifecycle; existence-as-completion

**Severity:** P2
**Status:** OPEN — blueprint locked Turn 10. Schema migration + UX deferred to Phase P2.
**Discovered:** Turn 1, code-only

## Evidence (current behavior)

`schema.ts:304-314` — `workout_set` columns: `id, workout_exercise_id, set_number, weight_kg, reps, rest_seconds, effort, notes, created_at, updated_at` (the last added Turn 3, F-012). **No `status` column.** No `completed_at`. The data model says: *a set is a row*, and *a row is a completed set*. There is no representation for:

- **Skipped** set — "I planned 4×8, did 3, decided to skip the last one." Today the user either logs nothing (silent gap, indistinguishable from "not yet attempted") or logs `0×0` (visually wrong, distorts total_volume).
- **In-progress** set — currently encoded only in the UI's `setDraft` signal, lost on app kill (cross-ref F-006).
- **Pending / planned** set — for guided mode, planned_exercise.sets defines a target, but the active-workout view doesn't show "Set 3 of 4 pending"; the user just sees "you've logged 2 set" (F-011).

`active-workout.page.html:54-66` exposes the gap directly: the exercise tab footer is `<small>{{ exercise.sets.length }} set</small>` — a raw count with no denominator and no skip awareness. Apple Activity rings work because they encode a goal AND completion; a count without a target is a count without meaning.

Three Apple-spirit failures:

1. **Existence overloaded.** A single physical fact ("did this set happen?") is encoding three logical states (planned / completed / skipped), and two of them are unrepresentable. Whenever one symbol carries too many meanings, the UI can't help but be ambiguous.
2. **Silent absence ≠ skip.** If I planned 4 sets, did 3, and put the bar down, the program has no way to know whether I skipped or whether I'm about to come back. The next session's progressive-overload logic (future feature) will treat my 3 sets as my plan, lowering volume targets — punishing me for an honest skip.
3. **No celebration of completion.** Without a goal-vs-actual model, there's no moment where the UI says "you finished the plan." Apple Activity's ring closing IS the dopamine; we don't have a ring because we don't have a goal yet.

## Cause

MVP scope: `workout_set` was modeled as a journal entry, not a state machine. The thinking was "the row IS the completion." That works for free-mode but breaks immediately when guided mode introduces a target.

## Proposed fix (blueprint)

### Schema — v6 migration (append-only; sequenced AFTER F-005's v5)

```sql
ALTER TABLE workout_set ADD COLUMN status TEXT
  CHECK (status IN ('completed', 'skipped')) NOT NULL DEFAULT 'completed';
ALTER TABLE workout_set ADD COLUMN completed_at TEXT;
```

Backfill: `UPDATE workout_set SET completed_at = created_at WHERE status = 'completed'` (all pre-v6 rows treated as completed at their creation moment).

Bump `SCHEMA_VERSION` 5→6. Append to `MIGRATION_REGISTRY`. Pin v5 spec test files.

**Note on planned sets.** Pending/planned sets are NOT rows in `workout_set` — they're rows in `planned_exercise` (which already exists) with `sets`, `reps_min`, `reps_max`. The view-model computes "Set 2 of 4 pending" by joining the count of logged `workout_set` rows for this `workout_exercise` against the `planned_exercise.sets` value. No new schema column needed for "pending"; it's derived.

### Repository

- `addSet(workoutExerciseId, input)` — unchanged semantics, defaults `status='completed'`, `completed_at=now()`.
- New `skipSet(workoutExerciseId, setNumber)` → `INSERT … (status='skipped', weight_kg=0, reps=0, completed_at=null, …)`. Skipped rows do NOT contribute to `syncTotals` — exclude `WHERE status='completed'` in the SUM.
- `updateSet(id, input)` — when transitioning skipped → completed, set `completed_at=now()`; when completed → skipped, null it. Drive from `status` field added to `WorkoutSetInput`.
- `getSession` — return both completed and skipped sets, with `status` exposed; UI decides rendering.
- `syncTotals` — `SUM(weight_kg * reps) WHERE status = 'completed'` (the fix that makes skip honest).

### View-model — per-exercise progress

For each `workout_exercise` in the active session, compute (in the store, not in the repo):

```ts
loggedSets   = sets.filter(s => s.status === 'completed').length
skippedSets  = sets.filter(s => s.status === 'skipped').length
plannedSets  = plannedExercise?.sets ?? sets.length // free-mode fallback
remaining    = max(0, plannedSets - loggedSets - skippedSets)
isComplete   = loggedSets + skippedSets >= plannedSets
```

Surface as a single concise label: `"2/4"` or `"3/4 · 1 bỏ qua"`. (Implements F-011 by side effect — see follow-up cross-ref.)

### UI — active-workout page

- Exercise tab footer: replace `{{ sets.length }} set` with progress fraction + small Apple-Activity-style ring (CSS-only `conic-gradient`).
- Set history: skipped rows render with 50% opacity + strikethrough + small "Bỏ qua" pill. Tap a skipped row → opens the same edit alert (F-004) prefilled with default values, lets user "uncross" it by saving with `status='completed'`.
- Below the "Ghi set N" primary button, add a secondary **"Bỏ qua set"** text-button (`fill="clear"`, no destructive color, slightly smaller). One tap → confirms with a 3s undo toast (same pattern as F-005 cancel). No modal.
- When `isComplete`, the per-exercise card shows a subtle "Đã đủ set kế hoạch" caption, ring closes. This is the Activity-ring moment.

### Files to change (when implemented)

- `src/app/core/services/database/schema.ts`, `migrations.ts`, migration spec pins
- `src/app/core/repositories/workout.repository.ts` — skipSet + status-aware syncTotals
- `src/app/core/models/fitness.types.ts` — add `status` to `WorkoutSet` view, `WorkoutSetInput`
- `src/app/core/stores/fitness.store.ts` — computed `setProgress` per exercise
- `src/app/features/fitness/active-workout/active-workout.page.{ts,html,scss}` — ring, skip button, opacity rule, undo toast
- New shared component candidate: `app-set-progress-ring` (used in F-011 too)

## Apple-spirit re-audit (against blueprint)

- **One symbol, one meaning.** Status column promotes lifecycle to a first-class concept. A row is no longer ambiguously "the completion"; the column tells the truth.
- **Skip is honest, not silent.** The set still exists in history; volume math correctly excludes it; the next session's adaptation logic (future) can see that I skipped intentionally rather than skipped attendance.
- **Goal + actual = ring.** Progress fraction with a ring gives the user a real completion target. Closing the ring is the Apple Activity feedback loop, scaled to a workout.
- **Reversibility.** Skip uses the same 3s-undo toast pattern as cancel; mis-tap is immediately recoverable. Skipped sets can also be re-completed via edit.
- **No new modal.** Skip is a secondary button next to log, not a dropdown; rendering changes are CSS-only; no new screens. Adds capability without adding cognitive load.

## Test plan

- ⏳ Unit: migration v5→v6; round-trip status update; syncTotals excludes skipped; addSet defaults to 'completed'.
- ⏳ Unit: store computed `setProgress` returns correct fractions across mixed completed/skipped/empty.
- ⏳ Component: skipped row renders with `.set--skipped` class, opacity rule applied; tapping reopens edit; saving as completed updates totals.
- ⏳ E2E: log 2/4 → skip 1 → log 1 → ring closes at 4/4 (3 complete + 1 skipped), total_volume reflects 3 only; tap skipped row → edit → save as completed → totals update to 4-row sum.

## Follow-up

- F-011 ("Exercise tabs show set count but no progress vs plan") is implemented as a SIDE EFFECT of this fix. When F-007 ships, F-011 should be closed without separate work. The progress-ring + fraction is the F-011 deliverable.
- F-006 (set-draft autosave) becomes more valuable once the state machine exists — the draft is the "in-progress" state we explicitly don't model in the schema yet.

## Status

**OPEN — blueprint locked Turn 10.** Schema v6 migration + skip lifecycle + progress fraction designed. Implementation queued behind F-005 (Phase P2) so migrations stack cleanly: v5 (cancel) → v6 (skip).
