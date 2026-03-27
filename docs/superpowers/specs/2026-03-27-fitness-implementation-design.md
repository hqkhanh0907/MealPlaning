# Fitness Module Implementation Design

> **Date:** 2026-03-27
> **Reference:** `docs/02-architecture/fitness-module-solutions-spec.md` (806 lines)
> **Scope:** Implement all 32 recommended solutions across 7 phases
> **Approach:** Phase-sequential, implement+test per fix, maintain 100% coverage

---

## 1. Overview

This design covers the systematic implementation of 32 fixes for the fitness module, derived from the deep analysis in `fitness-module-solutions-spec.md`. Each fix uses the recommended ("⭐") solution identified in that document.

**Architecture constraints:**
- Follow existing feature-based structure under `src/features/fitness/`
- New shared modules (`constants.ts`, `utils/dateUtils.ts`, `utils/timeFormat.ts`) are leaf modules — they import only from `types.ts` and standard library
- Zustand store changes follow existing patterns in `fitnessStore.ts`
- SQLite changes follow `databaseService.ts` patterns
- All changes require 100% test coverage and lint compliance (no eslint-disable)

---

## 2. Phase 0 — Trivial Fixes

### NAV-01: Store workoutMode in Zustand
- **File:** `src/store/fitnessStore.ts`
- **Change:** Add `workoutMode: 'tracking' | 'planning'` state + `setWorkoutMode` action
- **Consumer:** `FitnessTab.tsx` — replace local `useState` with store selector
- **Test:** Verify mode persists across tab switches

### GAMIF-01: Remove streak++ in grace blocks
- **File:** `src/features/fitness/utils/gamification.ts`
- **Change:** Remove `currentStreak++` at grace period blocks (2 lines)
- **Test:** Unit test: grace period day → streak stays same, not increment

### DASH-02: Exhaustive switch default
- **File:** `src/features/fitness/components/ProgressDashboard.tsx`
- **Change:** Add `default: { const _exhaustive: never = chartType; throw new Error(...); }`
- **Test:** Existing tests cover current chart types; TypeScript catches new ones at compile time

---

## 3. Phase 1 — Foundation Extraction

### OL-08: Type consolidation
- **File:** `src/features/fitness/types.ts`
- **Change:** Ensure `TrainingDay` and related types are ONLY defined here. Remove duplicate definitions from `useTrainingPlan.ts` and `ProgressDashboard.tsx`, replace with imports
- **Test:** TypeScript compilation + existing tests pass

### STRENGTH-04: Constants extraction
- **New file:** `src/features/fitness/constants.ts`
- **Change:** Extract `REST_TIMER_DEFAULTS`, `SET_LIMITS`, `RPE_SCALE`, `BODY_REGIONS`, `DAY_LABELS` from scattered files into this leaf module
- **Test:** Import tests, existing behavior unchanged

### GAMIF-02 + OL-09: Date utils extraction
- **New file:** `src/features/fitness/utils/dateUtils.ts`
- **Change:** Extract `getWeekBounds()`, `formatDate()`, `daysBetween()`, `isToday()` from `gamification.ts` and other files
- **Test:** Unit tests for each function, existing callers use shared import

### CARDIO-03: Time format extraction
- **New file:** `src/features/fitness/utils/timeFormat.ts`
- **Change:** Extract `formatElapsed()` from `CardioLogger.tsx` and `gamification.ts`, add hour support + NaN guard
- **Test:** Unit tests covering minutes, hours, edge cases (0, NaN, negative)

### PLAN-01: Rename calculateWeeklyVolume
- **File:** `src/features/fitness/utils/volumeCalculator.ts`
- **Change:** Rename `calculateWeeklyVolume()` → `calculateTargetWeeklySets()`, update all imports
- **Depends on:** OL-08 complete
- **Test:** Existing tests pass with new name

---

## 4. Phase 2 — Bug Fixes

### CARDIO-01: useTimer hook
- **New file:** `src/features/fitness/hooks/useTimer.ts`
- **Change:** Create hook with single `useRef(startTime)` + derived elapsed. Remove both `setInterval` calls from `CardioLogger.tsx`, use hook instead
- **Test:** Hook unit tests (start/stop/reset/elapsed accuracy)

### CARDIO-02: parseNumericInput guard
- **New file:** `src/features/fitness/utils/parseNumericInput.ts`
- **Change:** Create `parseNumericInput(value, fallback)` utility. Apply in `CardioLogger.tsx` input handlers + validate in `estimateCardioBurn()`
- **Test:** Unit tests for empty string, text, valid numbers, edge cases

### PLAN-02: Add catch block
- **File:** `src/features/fitness/hooks/useTrainingPlan.ts`
- **Change:** Add `catch(e) { setError(e.message); }` to try-finally blocks. Add `error` state + UI display
- **Test:** Test error state set on plan generation failure

### PLAN-03: BodyRegion type guard
- **File:** `src/features/fitness/hooks/useTrainingPlan.ts`
- **Change:** Create `isBodyRegion()` type guard. Replace unsafe `as BodyRegion` casts with validated guards + fallback
- **Test:** Test valid regions pass, invalid regions fallback to 'full_body'

### DASH-01: useCurrentDate hook
- **New file:** `src/features/fitness/hooks/useCurrentDate.ts`
- **Change:** Create hook with `visibilitychange` listener that refreshes date. Use in `ProgressDashboard.tsx` for week bounds
- **Test:** Test date refresh on visibility change

### ONBOARD-02: 1RM key validation
- **File:** `src/features/fitness/components/FitnessOnboarding.tsx`
- **Change:** Define `ORM_LIFTS` as `const` tuple, derive type from it, runtime filter against exercise DB
- **Test:** Test with valid/invalid exercise IDs

### STRENGTH-03: safeJsonParse utility
- **New file:** `src/features/fitness/utils/safeJsonParse.ts`
- **Change:** Create `safeJsonParse<T>(raw, fallback)` with try-catch. Replace bare `JSON.parse()` calls in `WorkoutLogger.tsx`
- **Test:** Test valid JSON, corrupted JSON, empty string

---

## 5. Phase 3 — Algorithm Improvements

### OVERLOAD-03: useMemo index optimization
- **File:** `src/features/fitness/hooks/useProgressiveOverload.ts`
- **Change:** Convert `exercises` array → `Map` via `useMemo`, convert `includes()` → `Set.has()`
- **Test:** Performance benchmark + existing tests pass

### OVERLOAD-02: Split overtraining detection
- **File:** `src/features/fitness/hooks/useProgressiveOverload.ts`
- **Change:** Split `detectOvertraining()` → `detectAcuteFatigue()` (short-term) + `detectChronicOvertraining()` (long-term). Cache results in `useMemo`
- **Depends on:** OVERLOAD-03
- **Test:** Test each detection function independently with different data patterns

### OVERLOAD-01: PlateauAnalysis service
- **New file:** `src/features/fitness/utils/plateauAnalysis.ts`
- **Change:** Create canonical service with `analyzeStrengthPlateau()` and `analyzeVolumePlateau()`. Wire into both `useProgressiveOverload` and `ProgressDashboard`
- **Depends on:** OVERLOAD-02
- **Test:** Test both plateau types, no contradictory results for same data

### STRENGTH-01 (interim): Persist draft to Zustand
- **File:** `src/store/fitnessStore.ts` + `src/features/fitness/components/WorkoutLogger.tsx`
- **Change:** Add `workoutDraft` state in fitnessStore. WorkoutLogger saves draft on every change, restores on mount
- **Test:** Navigate away and back — draft preserved

### STRENGTH-02 (interim): Batch save
- **File:** `src/features/fitness/components/WorkoutLogger.tsx`
- **Change:** Collect all set data into single object, dispatch single Zustand action for save
- **Depends on:** STRENGTH-01 interim
- **Test:** Save workout → all sets saved atomically (mock store verify)

---

## 6. Phase 4 — Keystone SQLite Migration

### G-01: fitnessStore → SQLite dual-layer
- **Files:** `src/store/fitnessStore.ts`, `src/services/schema.ts`, `src/services/migrationService.ts`
- **Change:**
  1. Add tables `fitness_profiles`, `fitness_preferences` to schema
  2. Add migration: read localStorage → INSERT SQLite
  3. Update fitnessStore: load from SQLite on init, write-through to both SQLite + Zustand
  4. Keep localStorage fallback for 30-day migration window
- **Test:** Migration from localStorage → SQLite, read-after-write consistency, fallback works

### STRENGTH-01 upgrade: SQLite draft persistence
- **File:** `src/store/fitnessStore.ts`, `WorkoutLogger.tsx`
- **Change:** Add `workout_drafts` SQLite table. Replace Zustand-only draft with SQLite persistence
- **Depends on:** G-01
- **Test:** App refresh → draft survives (was only tab-switch before)

### STRENGTH-02 upgrade: DB transactions
- **File:** `WorkoutLogger.tsx`
- **Change:** Wrap save in `databaseService.transaction()` (BEGIN/COMMIT/ROLLBACK)
- **Depends on:** G-01
- **Test:** Simulate failure mid-save → rollback, no partial data

### STRENGTH-03 upgrade: Relational data
- **File:** `WorkoutLogger.tsx`, schema
- **Change:** Store workout sets as relational rows instead of JSON blob, eliminate `JSON.parse()` entirely
- **Depends on:** G-01
- **Test:** Data read without JSON parse, backward compatibility with existing data

---

## 7. Phase 5 — UX Improvements

### ONBOARD-03: Back/Next button wizard
- **File:** `src/features/fitness/components/FitnessOnboarding.tsx`
- **Change:** Add back button, step indicator, allow navigation between steps while preserving entered data
- **Test:** Navigate back → data preserved, forward → validation still runs

### ONBOARD-01: 1RM toggle for all levels
- **File:** `src/features/fitness/components/FitnessOnboarding.tsx`
- **Change:** Add "I know my 1RM" toggle visible for Beginner/Intermediate, not just Advanced
- **Test:** Toggle on → show 1RM fields regardless of experience level

### PLAN-04: Deload auto-trigger
- **Files:** `src/features/fitness/utils/periodization.ts`, `src/features/fitness/hooks/useTrainingPlan.ts`
- **Change:** After 4 consecutive high-intensity weeks, auto-reduce volume by 40%. Show modal explaining deload with override option
- **Test:** 4+ high weeks → deload triggered, override → normal plan, < 4 weeks → no deload

### G-03: WorkoutSummaryCard
- **New file:** `src/features/fitness/components/WorkoutSummaryCard.tsx`
- **Change:** Post-workout summary showing total volume, duration, PRs with gold gradient celebration. Display after workout save in WorkoutLogger
- **Test:** Render with PR data → gold badge, render without PR → standard summary

---

## 8. Phase 6 — Feature Gaps

### G-02: Quick Confirm Card
- **New file:** `src/features/fitness/components/QuickConfirmCard.tsx`
- **Change:** Show suggested workout based on training plan + last session. "Start" button pre-fills WorkoutLogger, "Edit" opens blank logger
- **Test:** Suggestion accuracy, pre-fill data matches plan

### G-04/G-05: Exercise DB + Custom Exercise
- **Files:** `src/features/fitness/data/exerciseDatabase.ts`, new modal component
- **Change:** Fill ~20 missing exercises (bodyweight, mobility). Add `CustomExerciseModal` in `ExerciseSelector` for user-created exercises
- **Test:** New exercises searchable, custom exercise persists to SQLite

### G-06: Wire progressive overload suggestions
- **File:** `src/features/fitness/components/WorkoutLogger.tsx`
- **Change:** Import `useProgressiveOverload`, show inline suggestions ("+2.5kg from last session") next to each exercise
- **Test:** Suggestion shows when previous data exists, hidden when no history

### G-07: Nutrition integration bridge
- **New file:** `src/features/fitness/hooks/useFitnessNutritionBridge.ts`
- **Change:** Hook that reads nutrition state (calorie surplus/deficit) and adjusts workout intensity suggestions. Show `SmartInsightBanner` with nutrition-aware tips
- **Depends on:** G-06
- **Test:** Deficit state → suggest lower volume, surplus → suggest progressive overload

---

## 9. Testing Strategy

**Per-task flow:**
1. Implement fix
2. Write/update unit tests (100% statement+branch coverage for changed files)
3. Run `npm run lint` (no eslint-disable allowed)
4. Run `npm test` (all tests pass)
5. Verify no coverage regression

**New test files needed:**
- `useTimer.test.ts`
- `parseNumericInput.test.ts`
- `dateUtils.test.ts`
- `timeFormat.test.ts`
- `safeJsonParse.test.ts`
- `plateauAnalysis.test.ts`
- `useCurrentDate.test.ts`
- `WorkoutSummaryCard.test.tsx`
- `QuickConfirmCard.test.tsx`
- `CustomExerciseModal.test.tsx`
- `useFitnessNutritionBridge.test.ts`

---

## 10. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| G-01 migration breaks existing data | 30-day localStorage fallback + migration validation tests |
| Phase 1 extraction breaks imports | IDE rename refactoring + TypeScript compilation check |
| Parallel fixes in same file conflict | Compatibility matrix enforced (§9 of solutions spec) |
| Coverage drops during refactor | Run coverage after every single task, block if <100% on changed files |
| Timer hook breaks CardioLogger UX | Manual smoke test after CARDIO-01 |
