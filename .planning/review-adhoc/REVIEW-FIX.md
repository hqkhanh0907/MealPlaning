---
phase: review-adhoc
fixed_at: 2026-04-09T12:42:04Z
review_path: .planning/review-adhoc/REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase adhoc: Code Review Fix Report

**Fixed at:** 2026-04-09T12:42:04Z
**Source review:** .planning/review-adhoc/REVIEW.md
**Iteration:** 1

**Summary:**

- Findings in scope: 6
- Fixed: 6
- Skipped: 0

## Fixed Issues

### WR-01: RPE Cannot Be Cleared Once Selected

**Files modified:** `src/features/fitness/components/ExerciseWorkoutCard.tsx`, `src/features/fitness/components/WorkoutLogger.tsx`
**Commit:** e8aae8b
**Applied fix:** Changed `onRpeSelect` prop type from `(rpe: number) => void` to `(rpe: number | undefined) => void`. Updated the `<select>` onChange handler to call `onRpeSelect(undefined)` when the empty "—" option is selected (previously the call was guarded by `if (val)` which prevented clearing). Updated `handleRpeSelect` in WorkoutLogger to accept `number | undefined` and clear RPE when `undefined` is passed.

### WR-02: Hardcoded English Text in Vietnamese-Only UI

**Files modified:** `src/features/fitness/components/ExerciseWorkoutCard.tsx`, `src/locales/vi.json`
**Commit:** 9efdd97
**Applied fix:** Added locale key `fitness.logger.plateauIndicator` with value `"(bế tắc {{weeks}} tuần)"` to `vi.json`. Replaced hardcoded English `(plateau ${overloadSuggestion.plateauWeeks}w)` with `t('fitness.logger.plateauIndicator', { weeks: overloadSuggestion.plateauWeeks })` in ExerciseWorkoutCard.

### WR-03: Side-Effect setValue() Called During Render

**Files modified:** `src/features/fitness/components/WorkoutLogger.tsx`, `src/__tests__/WorkoutLogger.test.tsx`
**Commit:** 6bfb2b6
**Applied fix:** Removed the `ensureInput()` call from the render-time IIFE in the `currentInput` prop. Instead: (1) added a mount-time `useEffect` that calls `ensureInput` for all initially loaded exercises, (2) added `ensureInput` calls into `handleSelectExercise`, `handleNavigateNext`, and `handleNavigatePrev` handlers so form fields are guaranteed to exist before the next render. Simplified `currentInput` prop to `watch(...) ?? setInputDefaults`. Updated test assertion for plateau text to match new Vietnamese i18n output.

### IN-01: Duplicate v8 Ignore Comments

**Files modified:** `src/features/fitness/components/WorkoutLogger.tsx`
**Commit:** a79fb88
**Applied fix:** Removed the duplicate `/* v8 ignore start */` and `/* v8 ignore stop */` comment pair in `handleEditSetSave`, leaving a single pair wrapping the early-return guard.

### IN-02: Reps Direct Input Allows Zero While Stepper Enforces MIN_REPS=1

**Files modified:** `src/features/fitness/components/WorkoutLogger.tsx`
**Commit:** a37cb3b
**Applied fix:** Changed `Math.max(0, Number(raw))` to `Math.max(1, Number(raw))` in the `onRepsInput` handler, aligning the direct input floor with the stepper's `MIN_REPS=1` constraint.

### IN-03: Input Fields Missing Accessible Labels

**Files modified:** `src/features/fitness/components/ExerciseWorkoutCard.tsx`
**Commit:** 6b166f4
**Applied fix:** Added `aria-label={t('fitness.logger.weight')}` to the weight `<input>` and `aria-label={t('fitness.logger.reps')}` to the reps `<input>`, associating the translated label text with each input for screen readers.

## Skipped Issues

None — all findings were fixed.

---

_Fixed: 2026-04-09T12:42:04Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 1_
