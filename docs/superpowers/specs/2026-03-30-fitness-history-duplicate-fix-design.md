# Fitness History Duplicate Fix Design

**Date:** 2026-03-30
**Status:** Approved
**Bug:** Workout entries appear twice in Fitness History tab after completion

## Problem

When a user completes a workout (via WorkoutLogger or CardioLogger), the entry appears **twice** in the History tab. Root cause is a double-add:

1. `saveWorkoutAtomic(workout, sets)` in the logger component saves to SQLite **and** appends to Zustand state (correctly).
2. The `onComplete(workout)` callback fires up to `App.tsx` → `handleWorkoutComplete()` → calls `addWorkout(workout)` again, appending the same workout a second time.

**Affected files:**
- `src/App.tsx` lines 80-84 (`PageStackOverlay`)
- `src/features/fitness/components/WorkoutLogger.tsx` (onComplete call)
- `src/features/fitness/components/CardioLogger.tsx` (onComplete call)

## Design

### Approach: Remove redundant `addWorkout()` from App.tsx

`saveWorkoutAtomic()` already handles both persistence (SQLite transaction) and state update (Zustand). The `onComplete` callback should only signal "done" for navigation — it should not re-save data.

### Changes

#### 1. `src/App.tsx` — `PageStackOverlay`

**Before:**
```typescript
const addWorkout = useFitnessStore((s) => s.addWorkout);
const handleWorkoutComplete = useCallback((workout: Workout) => {
  addWorkout(workout);
  onBack();
}, [addWorkout, onBack]);
```

**After:**
```typescript
const handleWorkoutComplete = useCallback(() => {
  onBack();
}, [onBack]);
```

- Remove `addWorkout` selector import
- Remove `Workout` type import if no longer used in this scope
- `handleWorkoutComplete` becomes a simple navigation callback

#### 2. `src/features/fitness/components/WorkoutLogger.tsx`

- Change `onComplete` prop type: `(workout: Workout) => void` → `() => void`
- Change call site: `onComplete(workout)` → `onComplete()`

#### 3. `src/features/fitness/components/CardioLogger.tsx`

- Same changes as WorkoutLogger

#### 4. Tests

- Update any tests that mock `onComplete` with argument expectations
- Ensure 100% coverage maintained

### Expected Result

After fix: completing a workout (strength or cardio) shows exactly **1 entry** in the History tab. SQLite contains exactly 1 row per workout. Zustand state has no duplicates.

## Quality Gates

1. `npm run lint` — 0 errors
2. `npm run test` — all pass, coverage ≥ 100%
3. `npm run build` — clean production build
4. Build APK and verify on emulator (port 5556)
