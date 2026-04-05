# QA Analysis: Fitness Module Test Coverage

> **Date**: 2025-07-17
> **Scope**: `src/store/fitnessStore.ts`, `src/features/fitness/**`, `src/features/dashboard/hooks/**`
> **Test Suite**: 183 files, 4527 tests — ALL PASSING
> **Overall Coverage**: 96.63% Stmts | 89.43% Branch | 96.31% Funcs | 97.4% Lines

---

## 1. Current Test Inventory

### 1.1 Core Store & Persistence Tests

| File                                   | Tests |  LOC | Coverage Area                                                                                          | Quality |
| -------------------------------------- | ----: | ---: | ------------------------------------------------------------------------------------------------------ | ------- |
| `fitnessStore.test.ts`                 |   ~80 | 2634 | Store mutations, SQLite write-through, error paths, changeSplitType, draft persistence, FK constraints | ★★★★☆   |
| `fitnessStore.scheduleActions.test.ts` |   ~31 |  491 | updateTrainingDays, reassignWorkoutToDay, autoAssignWorkouts, restoreOriginalSchedule                  | ★★★★☆   |
| `fitnessConstants.test.ts`             |     5 |   34 | DAY_LABELS, ALL_MUSCLES, RPE_OPTIONS, CARDIO_TYPES                                                     | ★★★★★   |
| `fitnessTypes.test.ts`                 |   ~21 |   73 | isBodyRegion, safeParseJsonArray, Exercise type                                                        | ★★★★☆   |

### 1.2 Hook Tests

| File                                |  Tests | Coverage Area                                                                                                            | Quality |
| ----------------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------ | ------- |
| `useProgressiveOverload.test.ts`    |    ~59 | suggestNextSet, detectPlateau, detectAcuteFatigue, detectChronicOvertraining, isWeightSimilar, large dataset performance | ★★★★★   |
| `useFitnessNutritionBridge.test.ts` |    ~18 | deriveInsight (deficit/protein-low/recovery-day), hook integration, budget calculation                                   | ★★★★☆   |
| `useDailyScore.test.ts`             |    ~30 | First-time user, greeting, calorie data, workout detection, rest day, weight log, streak                                 | ★★★★☆   |
| `useActivityMultiplier.test.ts`     |     ~7 | Hook integration, applySuggestion, dismissSuggestion                                                                     | ★★★☆☆   |
| `useTrainingPlan.test.ts`           | exists | Hook integration                                                                                                         | ★★★☆☆   |

### 1.3 Utility Function Tests

| File                                        | Tests | Coverage Area                                                                             | Quality |
| ------------------------------------------- | ----: | ----------------------------------------------------------------------------------------- | ------- |
| `exerciseSelector.test.ts`                  |   ~47 | seedToExercise, getDefaultExercises, generateExercisesForDay, applyRepScheme              | ★★★★★   |
| `exerciseSelectorParseMuscleGroups.test.ts` |   ~13 | parseMuscleGroups only                                                                    | ★★★☆☆   |
| `exerciseDatabase.test.ts`                  |   ~12 | Data integrity, unique IDs, required fields, muscle group coverage                        | ★★★★★   |
| `trainingMetrics.test.ts`                   |   ~12 | calculateExerciseVolume, weeklyVolume, estimate1RM, volumeByMuscleGroup, isPersonalRecord | ★★★★☆   |
| `activityMultiplier.test.ts`                |   ~22 | analyzeActivityLevel, mapToActivityLevel, confidence, needsAdjustment                     | ★★★★☆   |
| `gamification.test.ts`                      |   ~26 | calculateStreak, weekDots, grace period, longestStreak                                    | ★★★★★   |
| `splitRemapper.test.ts`                     |   ~43 | remapExercisesToNewSplit, all split types                                                 | ★★★★★   |
| `volumeCalculator.test.ts`                  |   ~53 | calculateTargetWeeklySets, cut/bulk/age modifiers, deload, MEV floor                      | ★★★★★   |
| `plateauAnalysis.test.ts`                   |   ~22 | detectPlateau, isWeightSimilar                                                            | ★★★★☆   |
| `periodization.test.ts`                     |   ~48 | All periodization strategies                                                              | ★★★★★   |
| `templateMatcher.test.ts`                   |   ~13 | matchTemplateToPlan                                                                       | ★★★★☆   |
| `cardioEstimator.test.ts`                   |   ~10 | estimateCardioCalories                                                                    | ★★★★☆   |
| `durationEstimator.test.ts`                 |   ~13 | estimateWorkoutDuration                                                                   | ★★★★☆   |

### 1.4 Component Tests

| File                              | Tests | Coverage Area                                                                    | Quality |
| --------------------------------- | ----: | -------------------------------------------------------------------------------- | ------- |
| `planningModal.test.tsx`          |   ~40 | Meal tabs, dish filtering, sorting, calorie budget, multi-tab changes            | ★★★★★   |
| `trainingProfileForm.test.tsx`    |  ~120 | Form rendering, field visibility by level, validation, save flows, embedded mode | ★★★★★   |
| `trainingProfileSection.test.tsx` |   ~24 | Display by experience level, conditional fields, Vietnamese labels               | ★★★★☆   |

---

## 2. Coverage by Source File

### 2.1 Store Layer

| File              |    Stmts% |   Branch% |    Funcs% |    Lines% | Notes                                                              |
| ----------------- | --------: | --------: | --------: | --------: | ------------------------------------------------------------------ |
| `fitnessStore.ts` | **82.69** | **69.37** | **84.23** | **82.97** | ⚠️ Lines 1102-1253 uncovered (schedule actions, large code blocks) |

### 2.2 Hooks Layer

| File                           | Stmts% | Branch% | Funcs% | Lines% | Notes         |
| ------------------------------ | -----: | ------: | -----: | -----: | ------------- |
| `useProgressiveOverload.ts`    |  98.64 |   93.24 |  97.82 |  99.12 | ✅ Excellent  |
| `useFitnessNutritionBridge.ts` |    100 |   94.44 |    100 |    100 | ✅ Excellent  |
| `useActivityMultiplier.ts`     |  94.73 |      90 |    100 |    100 | ✅ Good       |
| `useTrainingPlan.ts`           |  97.95 |   92.85 |    100 |   99.4 | ✅ Good       |
| `useTimer.ts`                  |    100 |     100 |    100 |    100 | ✅ Perfect    |
| `useCurrentDate.ts`            |    100 |      50 |    100 |    100 | ⚠️ Low branch |
| `useDailyScore.ts`             |  98.43 |   96.29 |    100 |    100 | ✅ Excellent  |

### 2.3 Utils Layer

| File                    | Stmts% | Branch% | Funcs% | Lines% | Notes         |
| ----------------------- | -----: | ------: | -----: | -----: | ------------- |
| `activityMultiplier.ts` |    100 |     100 |    100 |    100 | ✅ Perfect    |
| `cardioEstimator.ts`    |    100 |     100 |    100 |    100 | ✅ Perfect    |
| `exerciseSelector.ts`   |    100 |   96.66 |    100 |    100 | ✅ Excellent  |
| `gamification.ts`       |    100 |     100 |    100 |    100 | ✅ Perfect    |
| `periodization.ts`      |    100 |     100 |    100 |    100 | ✅ Perfect    |
| `plateauAnalysis.ts`    |    100 |     100 |    100 |    100 | ✅ Perfect    |
| `splitRemapper.ts`      |    100 |     100 |    100 |    100 | ✅ Perfect    |
| `templateMatcher.ts`    |  95.55 |    92.3 |    100 |    100 | ✅ Good       |
| `trainingMetrics.ts`    |    100 |    87.5 |    100 |    100 | ⚠️ Branch gap |
| `volumeCalculator.ts`   |    100 |     100 |    100 |    100 | ✅ Perfect    |

### 2.4 Components Layer

| File                      |    Stmts% |   Branch% |    Funcs% |   Lines% | Notes                |
| ------------------------- | --------: | --------: | --------: | -------: | -------------------- |
| `PlanDayEditor.tsx`       |     97.14 |     82.69 |       100 |      100 | ⚠️ Some branch gaps  |
| `PlanScheduleEditor.tsx`  |     95.78 |     90.62 |     93.75 |    97.53 | ✅ Good              |
| `PlanTemplateGallery.tsx` | **76.34** | **70.58** | **78.26** | **78.4** | ❌ Weakest component |
| `WorkoutLogger.tsx`       |     97.22 |     85.29 |      97.4 |    98.94 | ✅ Good              |
| `SplitChanger.tsx`        |     93.87 |     91.66 |     86.66 |    93.47 | ⚠️ Some gaps         |
| `TrainingPlanView.tsx`    |     98.47 |     98.52 |     95.83 |    98.26 | ✅ Excellent         |

---

## 3. Bug-to-Test Mapping

| #          | Bug Description                          | Has Test?           | Test Quality        | Gap Analysis                                                                                                                                                                                                                                                                                |
| ---------- | ---------------------------------------- | ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BUG-01** | `updateWorkoutSet` no SQLite persist     | ⚠️ Partial          | In-memory test only | **CRITICAL**: Store impl has NO `_db.execute()` call at all. Test verifies Zustand state change but there's literally no DB code to test. The bug is in the SOURCE, not just missing tests.                                                                                                 |
| **BUG-02** | `removeWorkoutSet` no SQLite persist     | ⚠️ Partial          | In-memory test only | Same as BUG-01 — no `_db.execute()` in source code. Zustand-only operation.                                                                                                                                                                                                                 |
| **BUG-03** | `deleteWorkout` non-transactional        | ✅ Yes              | Adequate            | Test `deleteWorkout deletes from SQLite` verifies both DELETEs execute. **BUT**: no test for partial failure (sets deleted, workout remains). Two sequential `await _db.execute()` without transaction wrapper.                                                                             |
| **BUG-04** | Split change not atomic                  | ✅ Yes (19 TCs)     | Comprehensive       | TC_SPLIT_01→TC_SPLIT_19 cover data format, regenerate, remap, profile-based exercises. **BUT**: no atomicity test — if one `_db.execute()` in the chain fails, partial state can persist.                                                                                                   |
| **BUG-05** | Nutrition bridge ignores burned calories | ✅ Yes              | Good                | `useFitnessNutritionBridge.test.ts` tests deficit/protein-low/recovery. **BUT**: `deriveInsight` receives `todayCaloriesConsumed` (eaten only), not `eaten - burned`. The bridge doesn't subtract exercise calories from consumed — may be by design (budget approach).                     |
| **BUG-06** | Activity level only suggests UP          | ❌ No specific test | Missing             | `analyzeActivityLevel` source has NO directional constraint — it CAN suggest down (e.g., `active` → `moderate`). If "only suggest UP" is a requirement, it's UNIMPLEMENTED and UNTESTED.                                                                                                    |
| **BUG-07** | Daily score penalizes planless users     | ⚠️ Partial          | Surface-level       | `useDailyScore.test.ts` tests first-time user detection and rest day detection. **BUT**: `scoreCalculator.ts` doesn't appear to have "planless penalty" concept. Score components (calorie, workout, weight, streak) treat planless users neutrally — may need spec clarification.          |
| **BUG-08** | Progressive overload performance         | ✅ Yes              | Good                | `useProgressiveOverload.test.ts` includes "index-based lookup optimization" test with large datasets (Map/Set lookups). Tests exist but benchmark threshold validation is absent.                                                                                                           |
| **BUG-09** | Fire-and-forget writes (40+)             | ✅ Partial          | Error paths tested  | `fitnessStore – SQLite error paths` describe block tests 10+ error scenarios. **BUT**: only verifies error is caught — doesn't test recovery, retry, or user notification. Also: `updateWorkoutSet`, `removeWorkoutSet`, `updateWeightEntry`, `removeWeightEntry` have ZERO DB code at all. |

---

## 4. Critical Findings

### 4.1 🔴 CONFIRMED SOURCE BUGS (not just test gaps)

**BUG-01/02 are SOURCE BUGS, not testing gaps:**

```typescript
// fitnessStore.ts lines 492-501 — CONFIRMED: memory-only operations
updateWorkoutSet: (id, updates) =>
  set(state => ({
    workoutSets: state.workoutSets.map(s => (s.id === id ? { ...s, ...updates } : s)),
  })),
// ^^^ NO _db.execute() — changes LOST on app restart

removeWorkoutSet: id =>
  set(state => ({
    workoutSets: state.workoutSets.filter(s => s.id !== id),
  })),
// ^^^ NO _db.execute() — deletions LOST on app restart
```

Similarly, `updateWeightEntry` and `removeWeightEntry` (lines 510-518) are also memory-only.

**Impact**: User edits a set (changes weight/reps), closes app → data reverted. User deletes a set → reappears on restart.

### 4.2 🔴 Non-Transactional Deletes

```typescript
// fitnessStore.ts lines 365-369
deleteWorkout: async id => {
  // Zustand update first (optimistic)
  set(state => ({...}));
  // Sequential DB ops — NOT wrapped in transaction
  await _db.execute('DELETE FROM workout_sets WHERE workout_id = ?', [id]);
  await _db.execute('DELETE FROM workouts WHERE id = ?', [id]);
}
```

Only `saveWorkoutAtomic` (line 413) uses `_db.transaction()`. All other multi-step DB operations are sequential.

### 4.3 🟡 Fire-and-Forget DB Writes

**Pattern count**: 5 non-awaited `.execute().catch()` calls:

- Line 315: `removePlanDaySession` delete
- Line 549: `clearWorkoutDraft` delete
- Line 940: `changeSplitType` (regenerate) delete old days
- Line 1030: `changeSplitType` (remap) delete old days
- Line 1168: schedule-related delete

**27 total `.catch()` handlers** in fitnessStore.ts — all log-only, no recovery.

### 4.4 🟡 Store Coverage Gap

`fitnessStore.ts` at **82.69% Stmts / 69.37% Branch** is the WEAKEST store file. All other stores are 100%. Uncovered: lines 1102-1253 (schedule action edge cases).

---

## 5. Missing Test Scenarios

### 5.1 Critical (P0) — Data Integrity

| TC ID         | Scenario                                                                          | Why Critical                     |
| ------------- | --------------------------------------------------------------------------------- | -------------------------------- |
| TC_PERSIST_01 | `updateWorkoutSet` should persist changes to SQLite                               | Data loss on restart             |
| TC_PERSIST_02 | `removeWorkoutSet` should persist deletion to SQLite                              | Ghost data on restart            |
| TC_PERSIST_03 | `updateWeightEntry` should persist to SQLite                                      | Weight log edits lost            |
| TC_PERSIST_04 | `removeWeightEntry` should persist to SQLite                                      | Weight deletions lost            |
| TC_ATOMIC_01  | `deleteWorkout` should use transaction (sets + workout)                           | Orphaned data on partial failure |
| TC_ATOMIC_02  | `deleteWorkout` rolls back Zustand on DB failure                                  | State/DB desync                  |
| TC_ATOMIC_03  | `changeSplitType` should be transactional (plan update + delete old + insert new) | Partial split corruption         |

### 5.2 High (P1) — Business Logic

| TC ID          | Scenario                                                                           | Why Important                     |
| -------------- | ---------------------------------------------------------------------------------- | --------------------------------- |
| TC_ACTIVITY_01 | `analyzeActivityLevel` should NOT suggest downgrade (if requirement)               | User gets lower TDEE unexpectedly |
| TC_ACTIVITY_02 | Activity suggestion with low confidence should not trigger adjustment              | Premature recommendation          |
| TC_SCORE_01    | Daily score for user with no training plan — workout component                     | Unfair penalty                    |
| TC_SCORE_02    | Daily score on rest day vs planless day distinction                                | Rest ≠ lazy                       |
| TC_BRIDGE_01   | Nutrition bridge with burned calories > 0 — does budget adjust?                    | Calorie math accuracy             |
| TC_BRIDGE_02   | Nutrition bridge `surplus-on-rest` insight type (exists in interface but untested) | Missing insight path              |
| TC_OVERLOAD_01 | Progressive overload with >1000 workout sets (performance benchmark)               | O(n²) risk                        |

### 5.3 Medium (P2) — Edge Cases

| TC ID      | Scenario                                                                  |
| ---------- | ------------------------------------------------------------------------- |
| TC_EDGE_01 | `changeSplitType` with plan that has active workouts referencing old days |
| TC_EDGE_02 | `deleteWorkout` when workout has 0 sets                                   |
| TC_EDGE_03 | `saveWorkoutAtomic` when planDayId references deleted plan day            |
| TC_EDGE_04 | Concurrent `updateWorkoutSet` calls on same set                           |
| TC_EDGE_05 | `addPlanDaySession` exactly at limit (3rd session) then remove+add        |
| TC_EDGE_06 | `calculateStreak` across daylight saving time boundary                    |
| TC_EDGE_07 | `analyzeActivityLevel` with exactly 0 weeks analyzed                      |
| TC_EDGE_08 | `PlanTemplateGallery` missing coverage paths (76.34% — weakest component) |

---

## 6. Test Quality Assessment

### 6.1 Mock Quality

| Aspect                | Rating | Notes                                                    |
| --------------------- | ------ | -------------------------------------------------------- |
| SQLite mock (sql.js)  | ★★★★☆  | Uses real in-memory SQL — validates queries correctly    |
| Zustand store mocking | ★★★★★  | setState() pattern is correct and realistic              |
| DB error paths        | ★★★☆☆  | Tests `.catch()` exists, but not recovery behavior       |
| Transaction mock      | ★★☆☆☆  | `db.transaction()` mocked but doesn't validate atomicity |
| Component mocks       | ★★★★☆  | Zustand stores properly mocked, RTL best practices       |

### 6.2 Integration Coverage

| Integration Path                       | Tested? | Notes                                                                |
| -------------------------------------- | ------- | -------------------------------------------------------------------- |
| Store → SQLite round-trip              | ✅      | `read-after-write` test exists                                       |
| Hook → Store → Component               | ✅      | Component tests mock stores correctly                                |
| Cross-store (fitness ↔ nutrition)      | ✅      | `useFitnessNutritionBridge` tests both stores                        |
| Cross-store (fitness ↔ health-profile) | ✅      | `useActivityMultiplier` tests profile updates                        |
| Store → DB → restart → reload          | ❌      | No persistence round-trip test for updateWorkoutSet/removeWorkoutSet |
| Concurrent writes                      | ❌      | No race condition tests                                              |

---

## 7. Test Plan for Bug Fixes

### 7.1 Unit Tests to Add (P0 — Before Bug Fixes)

```
TC_PERSIST_01: updateWorkoutSet → verify _db.execute(UPDATE) called with correct SQL
TC_PERSIST_02: removeWorkoutSet → verify _db.execute(DELETE) called
TC_PERSIST_03: updateWeightEntry → verify _db.execute(UPDATE) called
TC_PERSIST_04: removeWeightEntry → verify _db.execute(DELETE) called
TC_ATOMIC_01: deleteWorkout with mock that throws on 2nd execute → verify rollback
TC_ATOMIC_03: changeSplitType with mock that throws mid-operation → verify no partial state
```

### 7.2 Integration Tests to Add (P1)

```
TC_ROUNDTRIP_01: addWorkoutSet → updateWorkoutSet → initializeFromSQLite → verify updated data
TC_ROUNDTRIP_02: addWorkoutSet → removeWorkoutSet → initializeFromSQLite → verify deletion
TC_ROUNDTRIP_03: addWeightEntry → updateWeightEntry → initializeFromSQLite → verify
TC_BRIDGE_FULL: Full nutrition bridge with profile + workouts + meals → verify all insights
TC_SCORE_FULL: Daily score with complete data vs empty data → verify fairness
```

### 7.3 Edge Case Tests to Add (P2)

```
TC_SPLIT_ATOMIC: changeSplitType during active workout session
TC_DELETE_EMPTY: deleteWorkout with no associated sets
TC_CONCURRENT: Two rapid updateWorkoutSet calls on same set
TC_GALLERY_COVER: PlanTemplateGallery missing branches (raise from 76% to 95%+)
TC_OVERLOAD_PERF: suggestNextSet with 5000+ sets (verify O(n) via Map index)
```

---

## 8. Recommendations

### 8.1 Immediate Actions (Block release)

1. **Fix BUG-01/02 first** — Add `_db.execute()` calls to `updateWorkoutSet`, `removeWorkoutSet`, `updateWeightEntry`, `removeWeightEntry`. These are SOURCE BUGS, not test gaps.

2. **Write tests BEFORE fixes** (TDD) — Create failing tests for TC_PERSIST_01-04, then implement the DB calls.

3. **Wrap `deleteWorkout` in transaction** — Use `_db.transaction()` like `saveWorkoutAtomic` already does.

### 8.2 Short-term (Next sprint)

4. **Raise `fitnessStore.ts` coverage** from 82.69% to ≥95%. Uncovered lines 1102-1253 contain schedule logic with potential bugs.

5. **Add atomicity tests for `changeSplitType`** — 19 data format tests exist but zero failure-mode tests.

6. **Clarify activity level direction** — Either implement "only suggest UP" or document that bidirectional is by design.

### 8.3 Medium-term

7. **Eliminate fire-and-forget pattern** — Convert 5 non-awaited writes to awaited + error recovery. At minimum, log a user-visible warning.

8. **Raise `PlanTemplateGallery` coverage** from 76.34% — weakest fitness component.

9. **Add performance benchmark tests** for progressive overload with realistic dataset sizes (1000+ sets).

---

## 9. Summary Scorecard

| Metric                      | Score            | Target | Status                      |
| --------------------------- | ---------------- | ------ | --------------------------- |
| Test file count (fitness)   | 27               | —      | ✅ Comprehensive            |
| Total fitness-related tests | ~600+            | —      | ✅ Substantial              |
| All tests passing           | 4527/4527        | 100%   | ✅                          |
| fitnessStore.ts coverage    | 82.69%           | 100%   | ❌ Gap                      |
| Fitness hooks coverage      | 94-100%          | 100%   | ✅ Good                     |
| Fitness utils coverage      | 93-100%          | 100%   | ✅ Good                     |
| Fitness components coverage | 76-100%          | 100%   | ⚠️ PlanTemplateGallery weak |
| P0 bugs with test coverage  | 2/4              | 4/4    | ❌ Persistence untested     |
| Integration test coverage   | 4/6 paths        | 6/6    | ⚠️ Gaps                     |
| Atomicity test coverage     | 0/3 critical ops | 3/3    | ❌ None                     |

**Overall Test Health: 7/10** — Good utility and hook coverage, but critical persistence and atomicity gaps exist in the store layer. The 4 memory-only operations (update/remove WorkoutSet/WeightEntry) are confirmed SOURCE BUGS that need both code fixes AND test additions.
