# F-003 — Cardio cannot be logged; schema and UI have no duration/distance

**Severity:** P1
**Status:** OPEN — blueprint locked Turn 11. Implementation deferred to Phase P2 (sequenced with F-005/F-007 migrations).
**Discovered:** Turn 1, code-only
**Blueprint locked:** Turn 11

## Evidence (current behavior)

### Cardio is half-wired

- `fitness.types.ts:15` declares `ExerciseCategory = 'compound' | 'isolation' | 'cardio'` — cardio is a first-class category.
- `schema.ts:230` enforces it at the DB layer: `category TEXT NOT NULL CHECK (category IN ('compound', 'isolation', 'cardio'))`.
- `fitness-seed.ts:182-185` ships **4 cardio exercises**: `ex_treadmill_run`, `ex_stationary_bike`, `ex_rowing_machine`, `ex_burpee`.

### …but it dead-ends at the logger

- `WorkoutSet` (`fitness.types.ts:79`) has only `weight_kg, reps, rest_seconds, effort, notes`. **No `duration_seconds`. No `distance_m`. No `pace`.**
- `schema.ts:304-314` `workout_set` DDL matches the model — this is a schema gap, not just a UI gap.
- `active-workout.page.html:95-153` renders one input grid: kg + reps + rest. No branch on `selected.category`. A user who somehow selects "Chạy bộ máy" sees the same weight×reps form as a barbell squat.

### Discovery, Turn 11: cardio is also unreached by the preset plans

`grep` of `training-plan.repository.ts` and the preset-day definitions in `fitness-seed.ts` returns **zero references** to any of the 4 cardio exercise IDs. So today's reachability path for cardio is:

1. **Guided mode (presets):** unreachable. The three preset plans (`full_body`, `upper_lower`, `ppl`) schedule only strength exercises.
2. **Guided mode (AI custom plan):** technically reachable — the AI prompt could pick a cardio exercise — but the prompt template doesn't bias toward cardio inclusion, and even if it did, the user lands at the broken logger.
3. **Free mode (picker):** reachable. Pick "Chạy bộ máy" → start free session → land at the strength-only logger. **This is where the dead-end is observable today.** F-009 doesn't change the dead-end; it just moves the picker to a better location.

So this isn't a hypothetical issue — any free-mode user looking for "Cardio" in the muscle-group / search filter will find one of the 4 seeded exercises, will tap "Bắt đầu tự do," and will find no way to record what they actually did. They have three bad choices: type weight 0 reps 1 (pollutes volume), type a sensible-looking nonsense ("60 kg × 30"), or quit.

## Cause

MVP scoped strength training. The `'cardio'` enum value was reserved in the type and in the schema CHECK constraint to keep the option open, but neither the column shape, the logger, the validation, nor the progress aggregation were extended. The result is a clean type system over an incomplete feature — worse than not declaring cardio at all, because the system *invites* the path then closes the door.

## Proposed fix (blueprint)

### Modeling choice — discriminated set type

A `set_type TEXT` column on `workout_set` with `CHECK (set_type IN ('strength', 'cardio')) NOT NULL DEFAULT 'strength'`. Strength sets and cardio sets are both rows in `workout_set`, distinguished by this column. Columns relevant to only one type are nullable for the other.

**Rejected alternative:** separate `workout_cardio_set` table. Pros: cleaner per-row, every column meaningful. Cons: two write paths in repo + two read paths in queries + UI has to merge two ordered streams for the per-exercise tab. The fork cost exceeds the modeling clarity benefit. One table, one set_type column, validated per-type at the repo boundary.

### Schema — v7 migration (append-only; sequenced AFTER F-005 v5 + F-007 v6)

```sql
-- Make strength columns nullable for cardio rows
-- (SQLite cannot DROP NOT NULL via ALTER; recreate via copy-and-rename
--  ONLY in a single migration that already needs to recreate the table.
--  Alternative: leave NOT NULL, store 0 + 0 for cardio — see below.)

ALTER TABLE workout_set ADD COLUMN set_type TEXT
  CHECK (set_type IN ('strength', 'cardio')) NOT NULL DEFAULT 'strength';
ALTER TABLE workout_set ADD COLUMN duration_seconds INTEGER;
ALTER TABLE workout_set ADD COLUMN distance_m REAL;
ALTER TABLE workout_set ADD COLUMN avg_heart_rate INTEGER;
```

**Pragmatic call on NOT NULL:** SQLite ALTER cannot drop NOT NULL. Three options:

1. **Recreate workout_set via copy-and-rename.** Heavy, risky, breaks F-012's "ALTER-only path, never touch base v1 DDL" doctrine.
2. **Use sentinel zeros for cardio rows in weight_kg/reps**, validated away at the repo boundary. Acceptable but couples schema to convention.
3. **Repo-level validation enforces "strength → kg+reps required, cardio → duration_seconds required."** Schema NOT NULLs remain on weight_kg/reps; cardio rows pass `0` for both. `syncTotals` uses `CASE WHEN set_type='strength' THEN weight_kg*reps ELSE 0 END`. Cardio rows still satisfy the DDL.

Going with **option 3** for v7. It preserves the migration discipline, keeps the row count single-table, and pushes the type contract into the repo (which is where validation already lives).

### Repository

- `WorkoutSetInput` becomes a discriminated union (types layer):
  ```ts
  type StrengthSetInput = {
    setType: 'strength';
    weightKg: number; reps: number;
    restSeconds: number | null;
    effort: WorkoutEffort | null;
    notes: string | null;
  };
  type CardioSetInput = {
    setType: 'cardio';
    durationSeconds: number;   // required
    distanceM: number | null;
    avgHeartRate: number | null;
    effort: WorkoutEffort | null;
    notes: string | null;
  };
  type WorkoutSetInput = StrengthSetInput | CardioSetInput;
  ```
- `validateSetInput` switches on `setType`:
  - Strength: weight 0..500, reps int 1..100, rest 0..600 (unchanged).
  - Cardio: duration int 30..14400 (30 sec to 4 hr), distance 0..200000 m or null, heart rate 30..230 or null.
- `addSet(workoutExerciseId, input)` — same call site; internal SQL fills `set_type` + null-out the other dimension's fields (or 0 for the strength NOT NULLs in cardio's case).
- `syncTotals` — strength rows only, status filter from F-007 still applies.
- New aggregate at repo: `cardioSummary(sessionId)` → `{ totalDurationSeconds, totalDistanceM, totalSets }` for the finish-summary page (F-005's downstream).

### View-model

- `selected.category === 'cardio'` drives the logger fork. The store's `setDraft` becomes a discriminated union with the same shape as the input.
- `progressSummary` extended: weekly cardio minutes alongside weekly volume. Two metrics, two trend lines.

### UI — `active-workout.page` cardio fork

Single conditional in the template:

```html
@if (selected.category === 'cardio') {
  <!-- cardio grid -->
} @else {
  <!-- existing strength grid -->
}
```

Cardio grid (Apple-style minimal):

```
┌──────────────────────────────────┐
│  Đẩy mạnh: Chạy bộ máy           │
│  Tổng: 25:00 · 4.2 km           │ <- session running totals
├──────────────────────────────────┤
│  Thời lượng (mm:ss) [ 15:00 ]   │
│  Quãng đường (km)   [ 2.5    ]  │ optional
│  Nhịp tim TB         [ 145   ]  │ optional
├──────────────────────────────────┤
│  Effort chips (Dễ/Vừa/Nặng/Tối đa) │ -- reused from strength
│  Ghi chú: [_________________]    │
├──────────────────────────────────┤
│  [  + Ghi đoạn  ]                │
└──────────────────────────────────┘
```

Per-exercise card title and history rows render `15:00 · 2.5 km` instead of `60 kg × 8`. Same `set-history` component, different `summary()` getter.

### Files to change (when implemented)

- `src/app/core/services/database/schema.ts`, `migrations.ts`, migration specs (v6 → v7)
- `src/app/core/models/fitness.types.ts` — discriminated `WorkoutSetInput`, `WorkoutSet` view extended with cardio fields
- `src/app/core/repositories/workout.repository.ts` — typed validation + cardio paths
- `src/app/core/repositories/fitness.repositories.spec.ts` — cardio round-trip
- `src/app/core/stores/fitness.store.ts` — `setDraft` union + `logCardioSet` action OR unified `logSet` reading from union
- `src/app/features/fitness/active-workout/active-workout.page.{ts,html,scss}` — category-based fork
- Optional: bias one preset plan to include a cardio finisher, OR leave presets pure-strength and rely on F-009's free-mode picker to reach cardio. Recommend: leave presets pure, ship a separate "Cardio finisher" optional cell in the today's-workout card later (out of scope for F-003).

## Apple-spirit re-audit (against blueprint)

- **Honest typing.** The category enum was a promise; the schema and logger now keep it. No more "type declared, behavior missing."
- **One screen, one job (still).** Cardio gets its own form, but it lives on the same active-workout page using a conditional render — not a new route. The user's mental model "I'm logging this exercise" doesn't fragment based on category.
- **Strength of weakness.** For users who don't care about cardio, nothing changes — same logger, same flow. For users who do, the form *looks like cardio* the moment they pick a cardio exercise.
- **Effort + notes reused.** Subjective dimensions (effort chip, notes) are common to both. Reusing them encodes that the *outcome* (how hard it was, what to remember) is universal, only the *measurement* differs.
- **Honest aggregation.** Cardio minutes alongside strength volume. The "Tiến trình tuần này" card stops lying by omission.

## Test plan

- ⏳ Migration test: v6 → v7 ALTER applies cleanly, existing rows get `set_type='strength'`, new columns default to NULL.
- ⏳ Repo unit: `addSet({ setType: 'cardio', durationSeconds: 1800 })` round-trips; `validateSetInput` rejects strength fields on a cardio input and vice versa; `syncTotals` ignores cardio rows.
- ⏳ Store unit: switching `selectedWorkoutExercise` from a strength row to a cardio row resets `setDraft` to the cardio shape.
- ⏳ Component: cardio exercise renders cardio grid, strength renders strength grid; history row format switches per category.
- ⏳ E2E: free-mode → pick "Chạy bộ máy" → log 15:00 + 2.5 km → complete session → history shows duration + distance, not weight×reps.

## Status

**OPEN — blueprint locked Turn 11.** Schema v7 + discriminated SetInput + category-fork logger designed. Sequenced after v5 (cancel) + v6 (skip lifecycle) so Phase P2 migrations stack cleanly: v5 → v6 → v7 in one APK.

## Follow-up

- Optional preset-plan extension: ship a v2 preset that intersperses cardio finishers. Out of scope for F-003; tracked as future enhancement once finish-summary lands.
- Cardio interval support (multi-segment within one cardio "set," e.g. HIIT 8×30s): not in this scope. Would require a `cardio_interval` sub-table later. v7 row models a single bout.
- Heart-rate sensor integration via Capacitor health plugin: future, out of scope.
