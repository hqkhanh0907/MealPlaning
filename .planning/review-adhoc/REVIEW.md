---
phase: review-adhoc
reviewed: 2025-01-27T10:30:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/features/fitness/components/ExerciseWorkoutCard.tsx
  - src/features/fitness/components/WorkoutLogger.tsx
  - src/__tests__/ExerciseWorkoutCard.test.tsx
  - src/__tests__/WorkoutLogger.test.tsx
  - src/locales/vi.json
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Code Review Report: ExerciseWorkoutCard & WorkoutLogger

**Reviewed:** 2025-01-27T10:30:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the ExerciseWorkoutCard redesign (single-exercise view with stepper inputs, RPE select, progressive overload chip) and its orchestrating parent WorkoutLogger. Both components are well-structured with comprehensive test suites (212 lines for ExerciseWorkoutCard, 1688 lines for WorkoutLogger covering edge cases, draft persistence, multi-exercise navigation, swap, save errors, and input edge cases). Locale keys are complete and consistent with the Vietnamese-only UI.

**Key strengths:** Thorough NaN handling for cleared inputs, robust draft restore/match logic with planDayId, proper error handling on save with notification and no draft-clear on failure, solid set renumbering on delete.

**Concerns:** RPE cannot be deselected once chosen (UI suggests it can), hardcoded English text in a Vietnamese-only UI, and a side-effect during render pattern.

## Warnings

### WR-01: RPE Cannot Be Cleared Once Selected

**File:** `src/features/fitness/components/ExerciseWorkoutCard.tsx:264-267`
**Issue:** The RPE `<select>` has a "—" option with empty value, implying the user can deselect RPE. However, when "—" is selected, `e.target.value` is `""` (falsy), so `onRpeSelect` is never called. The form state retains the previous RPE value, and since `<select value={currentInput.rpe ?? ''}>` reflects that retained value, the dropdown snaps back to the previously selected RPE. The user sees a deselect option but it does nothing.

In the parent `WorkoutLogger` (line 370), `handleRpeSelect` has toggle logic (`current.rpe === rpe ? undefined : rpe`) that would support clearing if the same value were passed, but this code path is unreachable from the "—" option.

**Fix:** Handle the empty-value case explicitly to clear RPE:

```tsx
onChange={e => {
  const val = e.target.value;
  if (val) {
    onRpeSelect(Number(val));
  } else {
    // Clear RPE — need a new callback or extend onRpeSelect to accept undefined
    onRpeSelect(0); // sentinel, or add onRpeClear callback
  }
}}
```

Alternatively, add an `onRpeClear?: () => void` prop to `ExerciseWorkoutCardProps` and call it when the empty option is selected. Then in `WorkoutLogger`, set `rpe` to `undefined` in the form state.

### WR-02: Hardcoded English Text in Vietnamese-Only UI

**File:** `src/features/fitness/components/ExerciseWorkoutCard.tsx:111`
**Issue:** The plateau indicator renders hardcoded English text `"plateau"` and `"w"` (for weeks) directly in JSX:

```tsx
{
  isPlateaued && overloadSuggestion.plateauWeeks != null && ` (plateau ${overloadSuggestion.plateauWeeks}w)`;
}
```

This is inconsistent with the rest of the app which uses `react-i18next` for all user-facing strings. Vietnamese users see mixed-language text.

**Fix:** Add locale keys and use `t()`:

```json
// vi.json
"fitness.logger.plateauIndicator": "(bế tắc {{weeks}} tuần)"
```

```tsx
{
  isPlateaued &&
    overloadSuggestion.plateauWeeks != null &&
    ` ${t('fitness.logger.plateauIndicator', { weeks: overloadSuggestion.plateauWeeks })}`;
}
```

### WR-03: Side-Effect (`setValue`) Called During Render

**File:** `src/features/fitness/components/WorkoutLogger.tsx:579-583`
**Issue:** The `currentInput` prop computation uses an IIFE that calls `ensureInput()` during render:

```tsx
currentInput={(() => {
  ensureInput(currentMeta.exercise.id);  // calls setValue() if field missing
  const formInput = watch(`setInputs.${currentMeta.exercise.id}` as const);
  return formInput ?? setInputDefaults;
})()}
```

`ensureInput` internally calls `setValue()` (line 232), which is a state mutation during the render phase. While it's guarded by a check (`if (!current)`) preventing infinite loops, calling `setValue` during render violates React's render-should-be-pure principle. In React 19 Strict Mode, this may trigger double-invocation warnings or unexpected behavior.

**Fix:** Move the `ensureInput` call into an effect or into the exercise navigation handlers (`handleNavigateNext`, `handleNavigatePrev`, `handleSelectExercise`) so the field is guaranteed to exist before render needs it:

```tsx
// In handleSelectExercise (already has access to exercise.id)
const handleSelectExercise = useCallback(
  (exercise: Exercise) => {
    // ...existing code...
    ensureInput(exercise.id); // ensure input exists when exercise is added
  },
  [timerRunning, ensureInput],
);

// In handleNavigateNext / handleNavigatePrev
const handleNavigateNext = useCallback(() => {
  const nextIdx = Math.min(currentExerciseIndex + 1, currentExercises.length - 1);
  const nextEx = currentExercises[nextIdx];
  if (nextEx) ensureInput(nextEx.exercise.id);
  setCurrentExerciseIndex(nextIdx);
}, [currentExercises, currentExerciseIndex, ensureInput]);
```

Then simplify the prop:

```tsx
currentInput={watch(`setInputs.${currentMeta.exercise.id}` as const) ?? setInputDefaults}
```

## Info

### IN-01: Duplicate v8 Ignore Comments

**File:** `src/features/fitness/components/WorkoutLogger.tsx:310-314`
**Issue:** The `handleEditSetSave` callback has doubled `/* v8 ignore start */` and `/* v8 ignore stop */` comments:

```tsx
/* v8 ignore start */
/* v8 ignore start */
if (!editingSet) return;
/* v8 ignore stop */
/* v8 ignore stop */
```

This is harmless (v8/vitest ignore blocks nest fine) but is clearly a copy-paste artifact.

**Fix:** Remove the duplicate pair:

```tsx
/* v8 ignore start */
if (!editingSet) return;
/* v8 ignore stop */
```

### IN-02: Reps Direct Input Allows Zero While Stepper Enforces MIN_REPS=1

**File:** `src/features/fitness/components/WorkoutLogger.tsx:610`
**Issue:** The reps direct input handler uses `Math.max(0, Number(raw))` allowing reps=0 to display, while the stepper buttons enforce `Math.max(MIN_REPS, ...)` (MIN_REPS=1). This inconsistency is mostly cosmetic because `handleLogSet` (line 259) applies `Math.max(1, input.reps)` when actually logging. Still, user can see "0 reps" in the active set card.

**Fix:** Use `MIN_REPS` in the input handler as well, or at minimum use 1 as floor:

```tsx
reps: raw === '' ? Number.NaN : Math.max(1, Number(raw));
```

### IN-03: Input Fields Missing Accessible Labels

**File:** `src/features/fitness/components/ExerciseWorkoutCard.tsx:198-204, 235-241`
**Issue:** The weight and reps `<input>` elements have visible label text in `<p>` elements above them (lines 184-186, 221-222), but these labels are not programmatically associated via `htmlFor`/`id` or `aria-label`/`aria-labelledby`. Screen readers won't associate the descriptive text with the inputs.

**Fix:** Add `id` to inputs and `htmlFor` to labels, or add `aria-label`:

```tsx
<input
  type="text"
  inputMode="decimal"
  aria-label={t('fitness.logger.weight')}
  // ...rest
/>
```

```tsx
<input
  type="text"
  inputMode="numeric"
  aria-label={t('fitness.logger.reps')}
  // ...rest
/>
```

---

_Reviewed: 2025-01-27T10:30:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
