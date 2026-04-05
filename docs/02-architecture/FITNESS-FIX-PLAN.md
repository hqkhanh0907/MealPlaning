# Fitness Module Fix Plan

> **Created**: 2025-07-18
> **Scope**: 14 issues from Executive Summary — P0 through P3
> **Source Documents**:
>
> - `docs/TEAM-ANALYSIS-FITNESS-EXECUTIVE-SUMMARY.md` — 14 issues overview
> - `docs/dev-analysis-fitness-deep-dive.md` — Bug verification, persistence audit
> - `docs/tech-leader-fitness-architecture.md` — Architecture analysis, 15 CQ issues
> - `docs/QA_FITNESS_TEST_COVERAGE.md` — Test coverage gaps, missing test scenarios
>
> **Critic Review**: Completed. Key adjustments:
>
> 1. Split FIX-01 into simple (1a) vs constrained (1b) persistence writes
> 2. Moved FIX-04 (changeSplitType atomicity) to Wave 1 — no real dependency on FIX-01
> 3. Simplified FIX-02 (deleteWorkout) — leverage existing CASCADE on workout_sets.workout_id
> 4. Changed FIX-10 from CASCADE to SET NULL — deleting exercises should not erase workout history

---

## Architecture Context

```
Write Pattern Distribution (24 DB-writing actions):
┌─────────────────────────────────────────────────────────┐
│  NO DB AT ALL:  10 actions  (41%)  ← FIX-01            │
│  Fire-and-forget (.catch):  13 actions  (54%)  ← FIX-07/13 │
│  Transaction (atomic):       1 action   (4%)   ← model │
└─────────────────────────────────────────────────────────┘

Target after fixes:
┌─────────────────────────────────────────────────────────┐
│  Optimistic + fire-and-forget:  ~15 (low-risk single-row) │
│  Awaited + error-handling:       ~5 (constrained writes)   │
│  Transaction (atomic):           ~4 (multi-step critical)  │
└─────────────────────────────────────────────────────────┘
```

---

## Wave 1: Foundation (P0 Critical + Independent P1/P2)

All fixes in Wave 1 are **independent** — can be implemented and committed in any order.

---

### FIX-01a: Add SQLite persistence to 6 simple missing actions

- **Issue**: 6 store actions only update Zustand, never write to SQLite. Data lost on app restart when `initializeFromSQLite` overwrites Zustand from DB.
- **Severity**: 🔴 P0 — Data loss
- **Root Cause**: Developer pattern "Zustand set() first, persist second" — but the persist step was never implemented for these actions. Compare `addWorkoutSet` (line 375-406, has INSERT) vs `updateWorkoutSet` (line 492-495, Zustand only).

**Affected actions (simple single-row writes):**

| Action               | Line    | SQL Needed                                   | Strategy                     |
| -------------------- | ------- | -------------------------------------------- | ---------------------------- |
| `updateWorkout`      | 355-358 | `UPDATE workouts SET ... WHERE id = ?`       | Optimistic + fire-and-forget |
| `removeWorkoutSet`   | 497-500 | `DELETE FROM workout_sets WHERE id = ?`      | Optimistic + fire-and-forget |
| `addTrainingPlan`    | 182-187 | `INSERT INTO training_plans ...`             | Optimistic + fire-and-forget |
| `updateTrainingPlan` | 189-192 | `UPDATE training_plans SET ... WHERE id = ?` | Optimistic + fire-and-forget |
| `removeWeightEntry`  | 514-517 | `DELETE FROM weight_log WHERE id = ?`        | Optimistic + fire-and-forget |
| `addWeightEntry`     | 504-507 | `INSERT INTO weight_log ...`                 | Optimistic + fire-and-forget |

- **Solutions Considered**:
  - **Option A**: Zustand-first + fire-and-forget DB write (match existing pattern of `addWorkout`, `addWorkoutSet`) — Effort: S, Risk: Low (single-row, no constraints hit in practice)
  - **Option B**: DB-first + Zustand on success (like `saveWorkoutAtomic`) — Effort: M, Risk: Low but breaks sync call signatures, requires component updates
- **Chosen**: Option A — Maintains consistency with 13 existing actions. Single-row INSERT/UPDATE/DELETE on primary key have negligible failure risk. Converting to async would change call signatures of `addTrainingPlan`, `addWeightEntry` etc., breaking all consumer components.
- **Implementation**:
  - **File**: `src/store/fitnessStore.ts`
  - **Pattern for each action** (example for `updateWorkout`):
    ```typescript
    updateWorkout: (id, updates) => {
      set(state => ({
        workouts: state.workouts.map(w => (w.id === id ? { ...w, ...updates } : w)),
      }));
      if (_db) {
        const w = get().workouts.find(w => w.id === id);
        if (w) {
          _db.execute(
            'UPDATE workouts SET date = ?, name = ?, plan_day_id = ?, duration_min = ?, notes = ?, updated_at = ? WHERE id = ?',
            [w.date, w.name, w.planDayId ?? null, w.durationMin ?? null, w.notes ?? null, w.updatedAt, id],
          ).catch((error: unknown) => {
            logger.error({ component: 'fitnessStore', action: 'updateWorkout.persist' }, error);
          });
        }
      }
    },
    ```
  - **For `addTrainingPlan`**: INSERT all plan fields into `training_plans` table
  - **For `updateTrainingPlan`**: UPDATE modified fields by plan id
  - **For `addWeightEntry`**: INSERT INTO `weight_log` (date, weight_kg, notes, created_at, updated_at)
  - **For `removeWeightEntry`**: DELETE FROM `weight_log` WHERE id = ?
  - **For `removeWorkoutSet`**: DELETE FROM `workout_sets` WHERE id = ?
  - **Also fix `initializeFromSQLite`** (line 816-875): Add loading of `training_plans` and `training_plan_days` from SQLite on startup. Currently only loads workouts, workout_sets, and weight_log.
    ```typescript
    // Add after weight_log loading:
    const plans = await db.query<Record<string, unknown>>('SELECT * FROM training_plans');
    if (plans.length > 0) {
      set({
        trainingPlans: plans.map(p => ({
          /* map fields */
        })),
      });
    }
    const planDays = await db.query<Record<string, unknown>>('SELECT * FROM training_plan_days');
    if (planDays.length > 0) {
      set({
        trainingPlanDays: planDays.map(d => ({
          /* map fields */
        })),
      });
    }
    ```
- **Tests Required**:
  - Unit: For each action, verify `_db.execute()` is called with correct SQL after Zustand `set()`
  - Unit: `initializeFromSQLite` loads training_plans and training_plan_days
  - Integration: Round-trip test — add → initializeFromSQLite → verify data survives
- **Dependencies**: None
- **Effort**: M (1-2h — 6 actions + initializeFromSQLite update + tests)
- **Acceptance Criteria**:
  - All 6 actions call `_db.execute()` after `set()`
  - `initializeFromSQLite` loads training_plans + training_plan_days
  - Existing tests pass + new persistence tests pass
  - `npm run test` — 0 failures

---

### FIX-01b: Add SQLite persistence to 4 constrained/multi-row actions

- **Issue**: Same root cause as FIX-01a, but these actions have unique constraints or multi-row invariants that require special handling.
- **Severity**: 🔴 P0 — Data loss + potential constraint violations

**Affected actions:**

| Action              | Line    | Constraint                                    | Strategy              |
| ------------------- | ------- | --------------------------------------------- | --------------------- |
| `updateWorkoutSet`  | 492-495 | `UNIQUE(workout_id, exercise_id, set_number)` | Awaited + try/catch   |
| `setActivePlan`     | 194-201 | Multi-row invariant (exactly 1 active)        | Awaited + transaction |
| `updateWeightEntry` | 509-512 | `weight_log.date` is UNIQUE                   | Awaited + try/catch   |

- **Solutions Considered**:
  - **Option A**: Fire-and-forget like FIX-01a — Risk: UNIQUE constraint failures silently swallowed, DB diverges from Zustand
  - **Option B**: Awaited writes with try/catch + Zustand rollback on failure — Effort: M, Risk: Low
  - **Option C**: Transaction-wrapped + DB-first — Effort: M-L, Risk: Low but changes call signatures
- **Chosen**: Option B — Awaited writes keep Zustand-first for responsiveness but add error handling. For `setActivePlan`, use transaction to ensure atomicity of the multi-row update (deactivate old → activate new).
- **Implementation**:
  - **File**: `src/store/fitnessStore.ts`
  - **`updateWorkoutSet`** — Change from sync to async, add awaited UPDATE:
    ```typescript
    updateWorkoutSet: async (id, updates) => {
      const prev = get().workoutSets.find(s => s.id === id);
      set(state => ({
        workoutSets: state.workoutSets.map(s => (s.id === id ? { ...s, ...updates } : s)),
      }));
      if (_db) {
        try {
          const s = get().workoutSets.find(s => s.id === id);
          if (s) {
            await _db.execute(
              `UPDATE workout_sets SET reps = ?, weight_kg = ?, rpe = ?, rest_seconds = ?,
               duration_min = ?, distance_km = ?, avg_heart_rate = ?, intensity = ?,
               estimated_calories = ?, updated_at = ? WHERE id = ?`,
              [s.reps ?? null, s.weightKg, s.rpe ?? null, s.restSeconds ?? null,
               s.durationMin ?? null, s.distanceKm ?? null, s.avgHeartRate ?? null,
               s.intensity ?? null, s.estimatedCalories ?? null, s.updatedAt, id],
            );
          }
        } catch (error: unknown) {
          logger.error({ component: 'fitnessStore', action: 'updateWorkoutSet.persist' }, error);
          // Rollback Zustand on DB failure
          if (prev) {
            set(state => ({
              workoutSets: state.workoutSets.map(s => (s.id === id ? prev : s)),
            }));
          }
        }
      }
    },
    ```
  - **`setActivePlan`** — Wrap in transaction to maintain single-active invariant:
    ```typescript
    setActivePlan: async planId => {
      const prevPlans = get().trainingPlans;
      set(state => ({
        trainingPlans: state.trainingPlans.map(p => {
          if (p.id === planId) return { ...p, status: 'active' as const };
          if (p.status === 'active') return { ...p, status: 'paused' as const };
          return p;
        }),
      }));
      if (_db) {
        try {
          await _db.transaction(async () => {
            await _db!.execute("UPDATE training_plans SET status = 'paused' WHERE status = 'active'");
            await _db!.execute("UPDATE training_plans SET status = 'active' WHERE id = ?", [planId]);
          });
        } catch (error: unknown) {
          logger.error({ component: 'fitnessStore', action: 'setActivePlan.persist' }, error);
          set({ trainingPlans: prevPlans }); // Rollback
        }
      }
    },
    ```
  - **`updateWeightEntry`** — Awaited with UNIQUE constraint awareness:
    ```typescript
    updateWeightEntry: async (id, updates) => {
      const prev = get().weightEntries.find(e => e.id === id);
      set(state => ({
        weightEntries: state.weightEntries.map(e => (e.id === id ? { ...e, ...updates } : e)),
      }));
      if (_db) {
        try {
          const e = get().weightEntries.find(e => e.id === id);
          if (e) {
            await _db.execute(
              'UPDATE weight_log SET date = ?, weight_kg = ?, notes = ?, updated_at = ? WHERE id = ?',
              [e.date, e.weightKg, e.notes ?? null, e.updatedAt, id],
            );
          }
        } catch (error: unknown) {
          logger.error({ component: 'fitnessStore', action: 'updateWeightEntry.persist' }, error);
          if (prev) {
            set(state => ({
              weightEntries: state.weightEntries.map(e => (e.id === id ? prev : e)),
            }));
          }
        }
      }
    },
    ```
- **Tests Required**:
  - Unit: Verify DB execute called with correct SQL for each action
  - Unit: Verify Zustand rollback when `_db.execute()` throws
  - Unit: `setActivePlan` — verify transaction ensures exactly 1 active plan
  - Integration: updateWorkoutSet round-trip after initializeFromSQLite
- **Dependencies**: None (but coordinate with FIX-01a for PR coherence)
- **Effort**: M (2-3h — 3 actions with rollback logic + tests)
- **Acceptance Criteria**:
  - All 3 actions await DB writes
  - Zustand rolls back on DB failure
  - `setActivePlan` uses transaction
  - Existing + new tests pass, 0 failures

---

### FIX-02: Wrap deleteWorkout in transaction

- **Issue**: `deleteWorkout` (line 360-372) uses 2 sequential DELETEs without transaction. If 2nd fails, data inconsistent.
- **Severity**: 🔴 P0 — Data corruption risk
- **Root Cause**: Sequential `await _db.execute()` calls not wrapped in `_db.transaction()`. Only `saveWorkoutAtomic` uses transactions.

**Important discovery from critic**: `workout_sets.workout_id` already has `ON DELETE CASCADE`. So deleting the workout row automatically cascades to delete its sets.

- **Solutions Considered**:
  - **Option A**: Wrap both DELETEs in `_db.transaction()` — Effort: S, Risk: None
  - **Option B**: Delete only from `workouts` table, let CASCADE handle sets — Effort: S, Risk: None (CASCADE is already defined in schema)
  - **Option C**: Reverse order (delete workout first, rely on CASCADE) + wrap in transaction for safety — Effort: S, Risk: None
- **Chosen**: Option C — Delete workout first (CASCADE handles sets), wrap in transaction for belt-and-suspenders safety. This is the most correct approach since CASCADE is explicitly defined in the schema (`workout_sets.workout_id REFERENCES workouts(id) ON DELETE CASCADE`).
- **Implementation**:
  - **File**: `src/store/fitnessStore.ts` lines 360-372
  - **Before**:
    ```typescript
    deleteWorkout: async id => {
      set(state => ({ ... }));
      if (_db) {
        try {
          await _db.execute('DELETE FROM workout_sets WHERE workout_id = ?', [id]);
          await _db.execute('DELETE FROM workouts WHERE id = ?', [id]);
        } catch { ... }
      }
    },
    ```
  - **After**:
    ```typescript
    deleteWorkout: async id => {
      const prevWorkouts = get().workouts;
      const prevSets = get().workoutSets;
      set(state => ({
        workouts: state.workouts.filter(w => w.id !== id),
        workoutSets: state.workoutSets.filter(s => s.workoutId !== id),
      }));
      if (_db) {
        try {
          await _db.transaction(async () => {
            // CASCADE on workout_sets.workout_id handles set deletion
            await _db!.execute('DELETE FROM workouts WHERE id = ?', [id]);
          });
        } catch (error: unknown) {
          logger.error({ component: 'fitnessStore', action: 'deleteWorkout' }, error);
          set({ workouts: prevWorkouts, workoutSets: prevSets }); // Rollback
        }
      }
    },
    ```
- **Tests Required**:
  - Unit: Verify transaction is used (mock `_db.transaction`)
  - Unit: Verify Zustand rollback on DB failure
  - Unit: Verify only 1 DELETE (workouts), CASCADE handles sets
- **Dependencies**: None
- **Effort**: S (<1h)
- **Acceptance Criteria**:
  - `deleteWorkout` uses `_db.transaction()`
  - Zustand rolls back on failure
  - Existing deleteWorkout tests pass + new atomicity test

---

### FIX-03: Fix Sunday day-of-week mismatch in useDailyScore

- **Issue**: `useDailyScore` uses `getDay()` which returns Sunday=0, but training plan days use ISO weekday where Sunday=7. On Sundays, scheduled workouts are NEVER recognized.
- **Severity**: 🔴 P0 — Sunday workouts always miscategorized
- **Root Cause**: `useDailyScore.ts:102` uses raw `now.getDay()` without ISO conversion. The rest of the codebase uses `getDayOfWeek()` from `dateUtils.ts` which converts 0→7.

  ```typescript
  // Line 102 — BUG
  const todayDayOfWeek = now.getDay(); // Sun=0, Mon=1...Sat=6

  // Line 106-107 — compares with ISO days (Sun=7)
  isRestDay = !scheduledDays.includes(todayDayOfWeek); // Sunday: includes(0) → always false
  ```

- **Solutions Considered**:
  - **Option A**: Inline conversion `const raw = now.getDay(); const todayDayOfWeek = raw === 0 ? 7 : raw;` — Effort: S
  - **Option B**: Import and use `getDayOfWeek()` from dateUtils — Effort: S, cleaner
- **Chosen**: Option A — Inline conversion is the simplest, avoids adding a dependency. The `getDayOfWeek()` utility expects a date string param, not a Date object, so it's not directly usable without formatting first.
- **Implementation**:
  - **File**: `src/features/dashboard/hooks/useDailyScore.ts` line 102
  - **Before**: `const todayDayOfWeek = now.getDay();`
  - **After**: `const todayDayOfWeek = now.getDay() || 7;`
    - Note: `0 || 7` → `7` (Sunday). Non-zero values pass through unchanged. This is the idiomatic JS pattern for this conversion.
- **Tests Required**:
  - Unit: Test useDailyScore on a Sunday — verify scheduled Sunday workout is recognized as training day (not rest day)
  - Unit: Test useDailyScore on Monday-Saturday — verify no regression
  - Unit: Test with Sunday=7 in plan days + getDay()=0 → should match
- **Dependencies**: None
- **Effort**: S (<30 min)
- **Acceptance Criteria**:
  - Sunday workouts correctly identified as training days in score calculation
  - All existing useDailyScore tests pass
  - New Sunday-specific test passes

---

### FIX-04: Wrap changeSplitType in transaction + rollback

- **Issue**: `changeSplitType` (lines 877-1056) performs 3+ concurrent fire-and-forget DB operations: UPDATE plan, DELETE old days, INSERT new days ×N. No transaction, no ordering guarantee, no rollback.
- **Severity**: 🟡 P1 — Data corruption (partial split state)
- **Root Cause**: Regenerate mode (lines 927-963) and remap/adaptive mode (lines 1017-1054) both use fire-and-forget pattern for critical multi-step operations.

- **Solutions Considered**:
  - **Option A**: Wrap all DB ops in `_db.transaction()` — keep Zustand-first — Effort: M, Risk: State diverges if transaction fails
  - **Option B**: DB-first transaction, then Zustand update on success (like `saveWorkoutAtomic`) — Effort: M, Risk: None, aligns with proven pattern
  - **Option C**: Sequential awaited writes without transaction — Effort: S, Risk: Partial writes if error mid-sequence
- **Chosen**: Option B — DB-first with transaction, Zustand on success. This is the `saveWorkoutAtomic` pattern already proven in the codebase. For a complex multi-step operation like split change, data integrity > UI responsiveness.
- **Implementation**:
  - **File**: `src/store/fitnessStore.ts` lines 877-1056
  - **Pattern (regenerate mode)**:

    ```typescript
    changeSplitType: async (planId, newSplit, mode) => {
      const plan = get().trainingPlans.find(p => p.id === planId);
      if (!plan) return;
      const now = new Date().toISOString();

      if (mode === 'regenerate') {
        // ... compute newDays (pure logic, no side effects) ...

        if (_db) {
          try {
            await _db.transaction(async () => {
              await _db!.execute('UPDATE training_plans SET split_type = ?, updated_at = ? WHERE id = ?',
                [newSplit, now, planId]);
              await _db!.execute('DELETE FROM training_plan_days WHERE plan_id = ?', [planId]);
              for (const day of newDays) {
                await _db!.execute(
                  `INSERT INTO training_plan_days (...) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [day.id, day.planId, day.dayOfWeek, day.sessionOrder, day.workoutType,
                   day.muscleGroups ?? null, day.exercises ?? null, day.originalExercises ?? null, day.notes ?? null],
                );
              }
            });
          } catch (error: unknown) {
            logger.error({ component: 'fitnessStore', action: 'changeSplitType.transaction' }, error);
            return; // Transaction rolled back — don't update Zustand
          }
        }

        // Only update Zustand AFTER successful DB transaction
        set(state => ({
          trainingPlans: state.trainingPlans.map(p =>
            p.id === planId ? { ...p, splitType: newSplit, updatedAt: now } : p),
          trainingPlanDays: [...state.trainingPlanDays.filter(d => d.planId !== planId), ...newDays],
        }));
      } else {
        // ... same pattern for adaptive/remap mode ...
      }
    },
    ```

  - Apply same pattern to remap/adaptive mode (lines 966-1056)

- **Tests Required**:
  - Unit: Verify `_db.transaction()` is called
  - Unit: Verify Zustand NOT updated when transaction fails (mock \_db.transaction to throw)
  - Unit: Verify plan + days are consistent after successful split change
  - Integration: changeSplitType round-trip through initializeFromSQLite
- **Dependencies**: None
- **Effort**: M (2-3h — two code paths + tests)
- **Acceptance Criteria**:
  - Both regenerate and remap modes use `_db.transaction()`
  - Zustand only updates after successful transaction
  - No partial plan state possible
  - All existing changeSplitType tests pass (19 TCs)

---

### FIX-05: Fix getTemplates() async-in-sync bug

- **Issue**: `getTemplates()` (line 1066-1103) calls `_db.query().then()` inside a synchronous function. The `.then()` resolves AFTER `rows.map()` executes, so `rows` is always empty. User-saved templates are never returned.
- **Severity**: 🟡 P1 — Feature broken (user templates invisible)
- **Root Cause**: Promise `.then()` is async microtask, but the function returns synchronously before `.then()` executes.

  ```typescript
  getTemplates: () => {
    const rows: Record<string, unknown>[] = [];
    _db.query(...).then(result => { rows.push(...result); }); // ← executes LATER
    const userTemplates = rows.map(...); // ← rows is EMPTY here
    return [...builtins, ...userTemplates]; // ← always only builtins
  },
  ```

- **Solutions Considered**:
  - **Option A**: Convert to `async getTemplates()` — Effort: S, Risk: Breaks all sync callers
  - **Option B**: Cache user templates on initialization, return from cache synchronously — Effort: S, Risk: Stale cache if template saved in same session
  - **Option C**: Load user templates in `initializeFromSQLite`, store in Zustand state — Effort: S, Risk: None, consistent with other data
- **Chosen**: Option C — Load user templates during `initializeFromSQLite` into a new `userTemplates: PlanTemplate[]` state field. `getTemplates()` merges builtins + state synchronously. This is consistent with how workouts, sets, and weights are loaded.
- **Implementation**:
  - **File**: `src/store/fitnessStore.ts`
  - Add `userTemplates: PlanTemplate[]` to state (default `[]`)
  - In `initializeFromSQLite`, add:
    ```typescript
    const templateRows = await db.query<Record<string, unknown>>('SELECT * FROM plan_templates WHERE is_builtin = 0');
    if (templateRows.length > 0) {
      set({
        userTemplates: templateRows.map(row => ({
          /* map fields */
        })),
      });
    }
    ```
  - Fix `getTemplates()`:
    ```typescript
    getTemplates: () => [...BUILTIN_TEMPLATES, ...get().userTemplates],
    ```
  - Update `saveCurrentAsTemplate` to also append to `userTemplates` state
- **Tests Required**:
  - Unit: `getTemplates()` returns builtin + user templates
  - Unit: `saveCurrentAsTemplate` adds to both DB and `userTemplates` state
  - Unit: `initializeFromSQLite` loads user templates
- **Dependencies**: None
- **Effort**: S (<1h)
- **Acceptance Criteria**:
  - User-saved templates visible in template gallery
  - Round-trip: save template → restart (initializeFromSQLite) → template still visible

---

### FIX-06: Nutrition bridge includes burned calories

- **Issue**: `useFitnessNutritionBridge` (line 85-118) compares `eaten vs target` but completely ignores calories burned from exercise. Users who train hard get false "deficit-on-training" warnings.
- **Severity**: 🟡 P1 — Incorrect fitness insight
- **Root Cause**: Hook only uses `targetCalories` (from health profile TDEE) and `eaten` (from food). Does not import or calculate burned calories from workout sets.

  ```typescript
  const todayCalorieBudget = targetCalories; // No burn adjustment
  const todayCaloriesConsumed = eaten; // No burn offset
  ```

  `calculateExerciseAdjustment()` exists in `activityMultiplier.ts:106-129` but is NOT called by this hook.

- **Solutions Considered**:
  - **Option A**: Add burned calories to budget: `budget = target + burned` — deficit threshold adjusts for exercise — Effort: S
  - **Option B**: Subtract burned from consumed: `consumed = eaten - burned` — Makes no semantic sense (eaten is fixed)
  - **Option C**: Pass burned as separate context to `deriveInsight` — most flexible — Effort: S
- **Chosen**: Option A — Add burned to budget. Semantically: "if you burn 500 kcal, your effective budget increases by 500 kcal before we warn about deficit." This is the standard CICO approach.
- **Implementation**:
  - **File**: `src/features/fitness/hooks/useFitnessNutritionBridge.ts`
  - Import workout sets and calculate today's burned calories:

    ```typescript
    const workoutSets = useFitnessStore(s => s.workoutSets);

    // Inside useMemo:
    const todayBurned = workoutSets
      .filter(s => {
        const w = workouts.find(w => w.id === s.workoutId);
        return w?.date === today;
      })
      .reduce((sum, s) => sum + (s.estimatedCalories ?? 0), 0);

    const todayCalorieBudget = targetCalories + Math.round(todayBurned);
    ```

  - Update `deriveInsight` to receive and use the adjusted budget (no signature change needed — it already accepts `todayCalorieBudget`)
  - Return `todayBurned` in the result for UI display
- **Tests Required**:
  - Unit: Bridge with 500 burned calories → budget increases by 500
  - Unit: deficit-on-training only triggers when `eaten < (target + burned) * 0.75`
  - Unit: No burned calories → behavior unchanged (regression)
- **Dependencies**: None
- **Effort**: S (<1h)
- **Acceptance Criteria**:
  - Burned calories factored into deficit calculation
  - User training 500kcal + eating 80% target → no deficit warning
  - Existing bridge tests pass + new burned-calorie tests pass

---

### FIX-09: Fix daily score for planless users

- **Issue**: Users without a training plan get `isRestDay = false` (default), so the system treats every day as a training day. After 20h, workout score = 0 ("missed workout") even though user has no plan to follow.
- **Severity**: 🟠 P2 — Unfair UX penalty
- **Root Cause**: `useDailyScore.ts:103-108`:

  ```typescript
  let isRestDay = false; // DEFAULT = training day!
  if (activePlan) {
    // Only enters here if user HAS a plan
    isRestDay = !scheduledDays.includes(todayDayOfWeek);
  }
  // No activePlan → isRestDay stays false → penalized
  ```

- **Solutions Considered**:
  - **Option A**: When no active plan, set `isRestDay = true` — score = 100 for workout factor — Effort: S
  - **Option B**: When no active plan, skip workout factor entirely from weighted average — Effort: S, most fair
  - **Option C**: When no active plan, set workout score = 50 ("neutral") — Effort: S
- **Chosen**: Option B — Skip workout factor entirely. A planless user shouldn't be scored on workout adherence at all. The weighted average will use remaining factors (calorie, weight log, streak). This requires making the workout factor optional in `calculateDailyScore`.
- **Implementation**:
  - **File**: `src/features/dashboard/hooks/useDailyScore.ts` line 103-108
  - **Change**: Mark workout factor as skipped when no active plan:
    ```typescript
    let isRestDay = false;
    let skipWorkoutFactor = false;
    if (activePlan) {
      const scheduledDays = trainingPlanDays.filter(d => d.planId === activePlan.id).map(d => d.dayOfWeek);
      isRestDay = !scheduledDays.includes(todayDayOfWeek);
    } else {
      skipWorkoutFactor = true;
    }
    ```
  - **File**: `src/features/dashboard/utils/scoreCalculator.ts`
  - Add `skipWorkoutFactor?: boolean` to score calculation input
  - When skipped, exclude workout weight from the weighted average (redistribute weight proportionally to other factors)
- **Tests Required**:
  - Unit: User with no active plan → workout factor excluded → score based on other factors
  - Unit: User with active plan → existing behavior unchanged (regression)
  - Unit: Planless user score > 0 when other factors are positive
- **Dependencies**: None
- **Effort**: S (<1h)
- **Acceptance Criteria**:
  - Planless users never penalized for "missed workout"
  - Score reflects calorie, weight log, streak factors only when no plan
  - Existing tests updated to reflect new behavior

---

## Wave 2: Integrity & Error Handling (depends on Wave 1 patterns)

---

### FIX-07: Implement write-queue for fire-and-forget DB writes

- **Issue**: 13+ fire-and-forget `.catch()` writes can interleave, fail silently, and leave Zustand/DB desynchronized. No retry, no ordering guarantee.
- **Severity**: 🟡 P1 — Silent data loss
- **Root Cause**: Pattern `_db.execute(...).catch(err => logger.error(...))` used throughout fitnessStore.ts (27 `.catch()` blocks total). Errors are logged but never propagated, never retried, never shown to user.

- **Solutions Considered**:
  - **Option A**: Convert all fire-and-forget to awaited — Effort: L, Risk: Changes all action signatures to async
  - **Option B**: Create `persistToDb()` helper with sequential queue + logging — Effort: M, Risk: Low
  - **Option C**: Just improve error logging in .catch() blocks — Effort: S, Risk: Doesn't fix interleaving
- **Chosen**: Option B — A `persistToDb(sql, params, context)` helper that:
  1. Enqueues writes sequentially (prevents interleaving)
  2. Logs with full context (action name, SQL, params)
  3. Retries transient errors only (`SQLITE_BUSY`, lock-type) — max 2 retries
  4. Does NOT retry constraint violations (those indicate real bugs)
- **Implementation**:
  - **New file**: `src/store/helpers/dbWriteQueue.ts`

    ```typescript
    type WriteOp = { sql: string; params: unknown[]; context: string };
    const queue: WriteOp[] = [];
    let processing = false;

    export function persistToDb(db: DatabaseService, sql: string, params: unknown[], context: string): void {
      queue.push({ sql, params, context });
      if (!processing) processQueue(db);
    }

    async function processQueue(db: DatabaseService): Promise<void> {
      processing = true;
      while (queue.length > 0) {
        const op = queue.shift()!;
        try {
          await db.execute(op.sql, op.params);
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          if (isTransientError(msg)) {
            queue.unshift(op); // Retry once
            await delay(50);
          } else {
            logger.error({ component: 'fitnessStore', action: op.context, sql: op.sql }, error);
          }
        }
      }
      processing = false;
    }

    function isTransientError(msg: string): boolean {
      return msg.includes('SQLITE_BUSY') || msg.includes('database is locked');
    }
    ```

  - **File**: `src/store/fitnessStore.ts` — Replace `_db.execute(...).catch(...)` with `persistToDb(_db, sql, params, context)` in all fire-and-forget actions

- **Tests Required**:
  - Unit: Queue processes writes sequentially
  - Unit: Transient errors are retried once
  - Unit: Constraint violations are logged, not retried
  - Unit: Multiple rapid writes are serialized
- **Dependencies**: FIX-12 (refactor) can leverage this helper; FIX-13 (.catch cleanup) naturally follows
- **Effort**: M (2-3h — helper + migrate 13 call sites + tests)
- **Acceptance Criteria**:
  - All fire-and-forget writes use `persistToDb()` helper
  - Transient errors retried once
  - Non-transient errors logged with full context
  - `npm run test` passes

---

### FIX-10: Add FK SET NULL on workout_sets.exercise_id

- **Issue**: `workout_sets.exercise_id REFERENCES exercises(id)` has no CASCADE or SET NULL. If an exercise is deleted (custom exercise removed), orphan workout_sets remain with invalid FK.
- **Severity**: 🟠 P2 — Orphan data risk
- **Root Cause**: Schema `workout_sets` table (schema.ts line 227): `exercise_id TEXT NOT NULL REFERENCES exercises(id)` — no ON DELETE clause.

**Critic feedback**: CASCADE is wrong here — deleting an exercise should NOT erase workout history. SET NULL is the correct semantic.

- **Solutions Considered**:
  - **Option A**: `ON DELETE CASCADE` — Effort: M, Risk: ⚠️ Silently destroys workout history
  - **Option B**: `ON DELETE SET NULL` — Effort: M, Risk: Low, preserves history with null reference
  - **Option C**: `ON DELETE RESTRICT` — Effort: S, Risk: Blocks exercise deletion until all referencing sets are cleaned
  - **Option D**: Postpone — add soft-delete for exercises instead — Effort: L
- **Chosen**: Option B — SET NULL preserves workout history. Requires changing `exercise_id` from `NOT NULL` to nullable. SQLite doesn't support `ALTER TABLE ... ALTER COLUMN`, so this requires table recreation in a migration.
- **Implementation**:
  - **File**: `src/services/schema.ts` — Add migration v5→v6:
    ```typescript
    if (currentVersion < 6) {
      await db.transaction(async () => {
        await db.execute('CREATE TABLE workout_sets_new (...)'); // with exercise_id nullable + ON DELETE SET NULL
        await db.execute('INSERT INTO workout_sets_new SELECT * FROM workout_sets');
        await db.execute('DROP TABLE workout_sets');
        await db.execute('ALTER TABLE workout_sets_new RENAME TO workout_sets');
        await db.execute('PRAGMA user_version = 6');
      });
    }
    ```
  - **File**: `src/features/fitness/types.ts` — Change `exerciseId: string` to `exerciseId: string | null` in `WorkoutSet` type
  - **File**: All components rendering workout sets — add null-check for exerciseId
- **Tests Required**:
  - Unit: Migration v5→v6 creates new table with correct FK
  - Unit: Existing data preserved after migration
  - Unit: Deleting exercise sets workout_sets.exercise_id to null
  - Unit: Components handle null exerciseId gracefully
- **Dependencies**: Requires careful coordination — type change propagates to 10+ files
- **Effort**: M (2-3h — migration + type changes + component updates)
- **Acceptance Criteria**:
  - Migration v5→v6 executes cleanly
  - Deleting a custom exercise doesn't lose workout history
  - Components display "Unknown exercise" for null exerciseId
  - All tests pass

---

### FIX-13: Clean up 27 silent .catch() blocks

- **Issue**: 27 `.catch()` handlers in fitnessStore.ts only call `logger.error()` with minimal context. No user notification, no recovery action.
- **Severity**: 🔵 P3 — Maintenance debt
- **Root Cause**: Copy-paste pattern where every DB write gets `catch((error: unknown) => { logger.error({...}, error) })`.

- **Solutions Considered**:
  - **Option A**: Migrate all to `persistToDb()` helper from FIX-07 — Effort: M, naturally provides better logging
  - **Option B**: Manually add context to each `.catch()` — Effort: M, doesn't fix structural issue
- **Chosen**: Option A — This fix is a natural follow-up to FIX-07. Once `persistToDb()` exists, migrate remaining `.catch()` blocks to use it.
- **Implementation**:
  - **File**: `src/store/fitnessStore.ts`
  - Replace all `_db.execute(...).catch(...)` patterns with `persistToDb(_db, sql, params, 'actionName')`
  - For awaited writes (FIX-01b, FIX-02, FIX-04), keep explicit try/catch with rollback
- **Tests Required**:
  - Unit: Verify no remaining bare `.catch()` blocks (code review)
  - Unit: Error logging includes action name, SQL statement
- **Dependencies**: FIX-07 (write queue helper must exist first)
- **Effort**: M (1-2h — mechanical replacement)
- **Acceptance Criteria**:
  - 0 bare `.catch(logger.error)` patterns remaining
  - All DB errors logged with context (action name + SQL)

---

## Wave 3: Enhancement & Quality (depends on Wave 1+2 patterns)

---

### FIX-08: Memoize useProgressiveOverload O(n) rebuild

- **Issue**: `workoutSetsByWorkoutId` Map (line 178-186) is rebuilt on every `workoutSets` array change. With 1000+ sets, this creates O(n) work per render during workout logging.
- **Severity**: 🟠 P2 — Performance
- **Root Cause**: `useMemo([workoutSets])` — any set addition/update/removal triggers full Map rebuild.

- **Solutions Considered**:
  - **Option A**: Move Map to store as derived state (computed on set changes) — Effort: M, couples store to derived data
  - **Option B**: Extract `getExerciseHistory(exerciseId)` helper to eliminate 3 duplicate filter/Set/sort chains — Effort: S, addresses root duplication
  - **Option C**: Use `useShallow` on workoutSets selector to avoid triggering when sets haven't actually changed — Effort: S, but doesn't fix the O(n) Map
- **Chosen**: Option B — Extract `getExerciseHistory()` helper. The Map itself is acceptable O(n) with memoization, but the 3× duplicate `filter→Set→filter→sort` pattern in `getLastSets`, `checkPlateauFn`, and `suggestNextSetFn` should be consolidated. This addresses performance P1-P4 from tech-leader analysis.
- **Implementation**:
  - **File**: `src/features/fitness/hooks/useProgressiveOverload.ts`
  - Extract helper:
    ```typescript
    function getExerciseHistory(
      exerciseId: string,
      workoutSets: WorkoutSet[],
      workouts: Workout[],
      workoutSetsByWorkoutId: Map<string, WorkoutSet[]>,
    ): WorkoutSet[] {
      const exerciseSets = workoutSets.filter(s => s.exerciseId === exerciseId);
      if (exerciseSets.length === 0) return [];
      const workoutIdSet = new Set(exerciseSets.map(s => s.workoutId));
      const latestWorkout = workouts
        .filter(w => workoutIdSet.has(w.id))
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      if (!latestWorkout) return [];
      return (workoutSetsByWorkoutId.get(latestWorkout.id) ?? [])
        .filter(s => s.exerciseId === exerciseId)
        .sort((a, b) => a.setNumber - b.setNumber);
    }
    ```
  - Replace duplicated logic in `getLastSets`, `checkPlateauFn`, and `suggestNextSetFn`
- **Tests Required**:
  - Unit: `getExerciseHistory` returns correct sets for a given exercise
  - Unit: Performance test with 1000+ sets completes in <50ms
  - Regression: All existing useProgressiveOverload tests pass
- **Dependencies**: None (can be done in parallel with anything)
- **Effort**: S (<1h)
- **Acceptance Criteria**:
  - Zero duplicated filter/Set/sort logic
  - Existing 59 progressive overload tests pass
  - Performance benchmark: 1000 sets → <50ms

---

### FIX-11: Raise fitnessStore coverage 82% → 100%

- **Issue**: `fitnessStore.ts` at 82.69% statements / 69.37% branch coverage — weakest store file. Lines 1102-1253 (schedule actions) are uncovered.
- **Severity**: 🔵 P3 — Test gap
- **Root Cause**: Complex schedule actions (`updateTrainingDays`, `autoAssignWorkouts`, `restoreOriginalSchedule`) added without corresponding tests.

- **Solutions Considered**:
  - **Option A**: Write tests incrementally as we fix bugs (FIX-01, FIX-04, etc.) — Effort: spread across fixes
  - **Option B**: Dedicated test-writing effort targeting uncovered lines — Effort: L
- **Chosen**: Combined A + B — Each fix includes its own tests (covers new persistence code), then a dedicated pass for remaining uncovered lines.
- **Implementation**:
  - **File**: `src/__tests__/fitnessStore.test.ts`
  - Target uncovered areas:
    - Lines 1102-1253: `updateTrainingDays`, `autoAssignWorkouts`, `restoreOriginalSchedule`
    - Branch coverage gaps in `changeSplitType` error paths
    - `initializeFromSQLite` with corrupted data
    - New persistence code from FIX-01a, FIX-01b
- **Tests Required**:
  - `updateTrainingDays` with various day configurations
  - `autoAssignWorkouts` with scoring algorithm edge cases
  - `restoreOriginalSchedule` with modified and unmodified days
  - Error paths for all new persistence code
- **Dependencies**: FIX-01a, FIX-01b, FIX-02, FIX-04 (adds new code that needs coverage)
- **Effort**: L (3-5h — many test scenarios)
- **Acceptance Criteria**:
  - fitnessStore.ts: ≥98% statements, ≥95% branch coverage
  - All tests pass
  - No `eslint-disable` in tests

---

### FIX-12: Refactor duplicate DB write patterns

- **Issue**: 17 instances of `if (_db) { _db.execute(...).catch(...) }` pattern. 3 instances of DELETE + loop INSERT. 10+ instances of `.map(x => x.id === id ? {...x, ...updates} : x)`.
- **Severity**: 🔵 P3 — DRY violation
- **Root Cause**: Organic growth without extracting shared patterns.

- **Solutions Considered**:
  - **Option A**: Extract `persistToDb()` only (from FIX-07) — covers fire-and-forget writes
  - **Option B**: Additionally extract `replaceAllPlanDays()` helper for DELETE+INSERT×N pattern
  - **Option C**: Full refactor with generic `updateById<T>()` helper
- **Chosen**: Option B — `persistToDb()` (from FIX-07) + `replaceAllPlanDays()` cover the most impactful duplications. Generic `updateById<T>()` is nice-to-have but adds type complexity without proportional value.
- **Implementation**:
  - **New helper**: `replaceAllPlanDays(db, planId, newDays)` — used by `changeSplitType` (2 modes) and `applyTemplate`
    ```typescript
    async function replaceAllPlanDays(db: DatabaseService, planId: string, newDays: TrainingPlanDay[]): Promise<void> {
      await db.execute('DELETE FROM training_plan_days WHERE plan_id = ?', [planId]);
      for (const day of newDays) {
        await db.execute('INSERT INTO training_plan_days (...) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
          day.id,
          day.planId,
          day.dayOfWeek,
          day.sessionOrder,
          day.workoutType,
          day.muscleGroups ?? null,
          day.exercises ?? null,
          day.originalExercises ?? null,
          day.notes ?? null,
        ]);
      }
    }
    ```
  - Apply to `changeSplitType` (regenerate + remap), `applyTemplate`
- **Tests Required**:
  - Unit: `replaceAllPlanDays` deletes old and inserts new
  - Unit: Existing behavior unchanged after refactor (regression)
- **Dependencies**: FIX-04 (changeSplitType must be transactional first), FIX-07 (persistToDb helper)
- **Effort**: M (1-2h)
- **Acceptance Criteria**:
  - DELETE+INSERT×N pattern extracted to shared helper
  - Used in 3 locations (changeSplitType ×2, applyTemplate)
  - All tests pass

---

### FIX-14: Add atomicity tests for changeSplitType

- **Issue**: 19 data format tests exist for changeSplitType but ZERO failure-mode tests. No test verifies what happens when DB operations fail mid-transaction.
- **Severity**: 🔵 P3 — Test gap
- **Root Cause**: Tests were written for happy-path data correctness, not error/atomicity scenarios.

- **Solutions Considered**:
  - **Option A**: Add failure-mode tests after FIX-04 makes changeSplitType transactional — Effort: S
  - **Option B**: Write tests now against current (broken) behavior, then update after FIX-04 — Effort: M
- **Chosen**: Option A — Write after FIX-04 since tests should validate the fixed behavior (transaction rollback), not document the broken behavior.
- **Implementation**:
  - **File**: `src/__tests__/fitnessStore.test.ts`
  - New test scenarios:

    ```typescript
    describe('changeSplitType atomicity', () => {
      it('should not update Zustand when DB transaction fails', async () => {
        // Mock _db.transaction to throw
        // Verify Zustand state unchanged
      });

      it('should rollback all DB changes on partial failure', async () => {
        // Mock _db to throw on 3rd INSERT
        // Verify no plan_days in DB (transaction rolled back)
      });

      it('should handle concurrent changeSplitType calls gracefully', async () => {
        // Call changeSplitType twice rapidly
        // Verify final state is consistent
      });
    });
    ```

- **Tests Required**: The tests ARE the deliverable
- **Dependencies**: FIX-04 (changeSplitType must be transactional first)
- **Effort**: S (<1h)
- **Acceptance Criteria**:
  - 3+ atomicity tests for changeSplitType
  - Tests verify Zustand NOT updated on DB failure
  - Tests verify consistent state after concurrent calls

---

## Dependency Graph

```
Wave 1 (all independent):
  FIX-01a ─────┐
  FIX-01b ─────┤
  FIX-02  ─────┤
  FIX-03  ─────┤── (all can run in parallel)
  FIX-04  ─────┤
  FIX-05  ─────┤
  FIX-06  ─────┤
  FIX-09  ─────┘

Wave 2 (depends on Wave 1):
  FIX-07  ←── benefits from FIX-12 pattern (but not blocked)
  FIX-10  ←── independent but needs data audit first
  FIX-13  ←── FIX-07 (persistToDb helper must exist)

Wave 3 (depends on Wave 1+2):
  FIX-08  ←── independent (can parallelize)
  FIX-11  ←── FIX-01a, FIX-01b, FIX-02, FIX-04 (covers new code)
  FIX-12  ←── FIX-04, FIX-07 (uses their patterns)
  FIX-14  ←── FIX-04 (tests transactional changeSplitType)
```

---

## Execution Order (optimal serial sequence)

| Order | Fix                                  | Effort | Rationale                                |
| ----- | ------------------------------------ | ------ | ---------------------------------------- |
| 1     | **FIX-03** Sunday bug                | S      | Simplest, 1 line, instant win            |
| 2     | **FIX-05** getTemplates async        | S      | Simple, unblocks user templates          |
| 3     | **FIX-09** Planless score            | S      | Simple, isolated logic change            |
| 4     | **FIX-06** Nutrition bridge          | S      | Simple, isolated hook change             |
| 5     | **FIX-02** deleteWorkout txn         | S      | Simple transaction wrap + rollback       |
| 6     | **FIX-01a** Simple persistence       | M      | 6 actions + initializeFromSQLite         |
| 7     | **FIX-01b** Constrained persistence  | M      | 3 actions with rollback logic            |
| 8     | **FIX-04** changeSplitType txn       | M      | Complex but critical — DB-first pattern  |
| 9     | **FIX-14** Atomicity tests           | S      | Tests for FIX-04, quick follow-up        |
| 10    | **FIX-08** Progressive overload perf | S      | Extract helper, eliminate duplication    |
| 11    | **FIX-07** Write queue               | M      | Infrastructure for all fire-and-forget   |
| 12    | **FIX-13** .catch() cleanup          | M      | Leverage FIX-07 helper                   |
| 13    | **FIX-12** Refactor duplication      | M      | Leverage FIX-04 + FIX-07 patterns        |
| 14    | **FIX-10** FK SET NULL migration     | M      | Requires schema migration + type changes |
| 15    | **FIX-11** Coverage to 100%          | L      | Final pass covering all new code         |

---

## Effort Summary

| Wave      | Fixes                                | Estimated Effort |
| --------- | ------------------------------------ | ---------------- |
| Wave 1    | FIX-01a, 01b, 02, 03, 04, 05, 06, 09 | ~10h             |
| Wave 2    | FIX-07, 10, 13                       | ~6h              |
| Wave 3    | FIX-08, 11, 12, 14                   | ~7h              |
| **Total** | **14 fixes**                         | **~23h**         |

---

## Quality Gates Per Fix

Every fix commit MUST pass:

```bash
1. npm run lint          → 0 errors, NO eslint-disable
2. npm run test          → 0 failures, coverage ≥100% for new code
3. npm run build         → clean build
4. Verify affected test suites run green
```

---

## Risk Assessment

| Risk                                       | Probability | Impact                             | Mitigation                                                                      |
| ------------------------------------------ | ----------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| FIX-01b changes action signatures to async | Medium      | Component call sites break         | Keep Zustand-first, only await DB internally                                    |
| FIX-04 transaction slows UI                | Low         | User sees delay on split change    | Split change already takes seconds (plan generation); DB transaction adds <50ms |
| FIX-10 migration corrupts data             | Low         | Loss of workout_sets               | Wrap migration in transaction + backup table before drop                        |
| FIX-07 queue creates memory leak           | Low         | Growing queue on repeated failures | Max queue size + drain on failure threshold                                     |
| Tests for new persistence reveal more bugs | High        | More fixes needed                  | Expected and welcome — better to find them now                                  |

---

## Appendix: Files Modified Per Fix

| Fix     | Primary Files                                 | Test Files                                         |
| ------- | --------------------------------------------- | -------------------------------------------------- |
| FIX-01a | `fitnessStore.ts`                             | `fitnessStore.test.ts`                             |
| FIX-01b | `fitnessStore.ts`                             | `fitnessStore.test.ts`                             |
| FIX-02  | `fitnessStore.ts`                             | `fitnessStore.test.ts`                             |
| FIX-03  | `useDailyScore.ts`                            | `useDailyScore.test.ts`                            |
| FIX-04  | `fitnessStore.ts`                             | `fitnessStore.test.ts`                             |
| FIX-05  | `fitnessStore.ts`                             | `fitnessStore.test.ts`                             |
| FIX-06  | `useFitnessNutritionBridge.ts`                | `useFitnessNutritionBridge.test.ts`                |
| FIX-07  | `fitnessStore.ts`, `dbWriteQueue.ts` (new)    | `dbWriteQueue.test.ts` (new)                       |
| FIX-08  | `useProgressiveOverload.ts`                   | `useProgressiveOverload.test.ts`                   |
| FIX-09  | `useDailyScore.ts`, `scoreCalculator.ts`      | `useDailyScore.test.ts`, `scoreCalculator.test.ts` |
| FIX-10  | `schema.ts`, `fitnessTypes.ts`, 5+ components | `schema.test.ts`, `fitnessStore.test.ts`           |
| FIX-11  | —                                             | `fitnessStore.test.ts` (add tests)                 |
| FIX-12  | `fitnessStore.ts`                             | `fitnessStore.test.ts`                             |
| FIX-13  | `fitnessStore.ts`                             | `fitnessStore.test.ts`                             |
| FIX-14  | —                                             | `fitnessStore.test.ts` (add tests)                 |
