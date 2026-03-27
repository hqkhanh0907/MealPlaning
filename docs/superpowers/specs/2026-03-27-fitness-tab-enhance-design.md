# Fitness Tab Enhancement Design Spec

**Date:** 2026-03-27
**Scope:** Bug fixes, logic corrections, UI consistency, and missing i18n for the Fitness Tab module
**Approach:** Fix critical bugs first, then logic gaps, then UI polish — all with tests

---

## Problem Statement

A comprehensive audit of the Fitness Tab (19 components, 4 hooks, 1 store, ~9,126 LOC) revealed:
- **7 critical bugs** affecting user-visible data and core functionality
- **5 logic gaps** where calculations produce incorrect results
- **6 UI inconsistencies** breaking the design system
- **4 missing i18n keys** showing raw translation keys on screen

The most severe: `targetCalories` stored as `1500100` (string concatenation), progressive overload suggesting wrong increments for lower body, PR detection never triggering, and a raw i18n key visible on the Progress tab.

---

## Phase 1: Critical Bug Fixes

### BUG-01: EnergyBalanceCard shows "1500100 kcal" — ✅ FIXED

**Root Cause:** `targetCalories` in localStorage is corrupted to `1500100`. The `useFeedbackLoop.ts` auto-adjust logic does `currentTarget + calorieAdjustment` (line 114). If `currentTarget` arrives as a string (from JSON deserialization without type coercion), JavaScript concatenates instead of adding: `"1500" + 100 = "1500100"`.

**Fix:**
1. Add `Number()` coercion in `evaluateAndSuggestAdjustment()` for `currentTarget` parameter
2. Add `Number()` coercion in `useNutritionTargets()` fallback path (line 60) for `userProfile.targetCalories`
3. Add migration in `userProfileStore` to ensure `targetCalories` is always a number on load

**Implementation:** `userProfileStore.ts` now includes `coerceNumericFields()` rehydration guard that runs on store init. It coerces `weight`, `proteinRatio`, and `targetCalories` to `Number()` and applies range clamping (500–10000 for calories).

**Files:** `useFeedbackLoop.ts`, `useNutritionTargets.ts`, `userProfileStore.ts`

### BUG-02: Lower body overload increment inverted

**Root Cause:** `useProgressiveOverload.ts` line ~53:
```tsx
getOverloadIncrement(experience, !isLower)
```
The `!isLower` negation means lower body exercises get upper body increments (smaller, e.g., 1.25kg) and vice versa.

**Fix:** Change `!isLower` to `isLower`.

**File:** `useProgressiveOverload.ts`

### BUG-03: PR detection always empty in WorkoutLogger

**Root Cause:** `WorkoutLogger.tsx` line ~304: `detectedPRs` array is initialized empty and never populated. The `detectPRs()` function exists in `gamification.ts` but is never imported or called.

**Fix:**
1. Import `detectPRs()` from gamification utils
2. Call it with completed sets before rendering `WorkoutSummaryCard`
3. Pass populated `personalRecords` array

**File:** `WorkoutLogger.tsx`

### BUG-04: "fitness.progress.weekOf" i18n parameter mismatch

**Root Cause:** `ProgressDashboard.tsx` line 495 calls:
```tsx
t('fitness.progress.weekOf', { current: cycleProgress.currentWeek, total: cycleProgress.totalWeeks })
```
But `vi.json` line 732 defines: `"weekOf": "Tuần từ {{date}}"` — parameter name mismatch.

**Fix:** Update the i18n key to use `current`/`total` params:
```json
"weekOf": "Tuần {{current}}/{{total}}"
```

**File:** `src/locales/vi.json`

### BUG-05: CardioLogger non-atomic save — ✅ FIXED

**Root Cause:** `CardioLogger.tsx` uses separate `addWorkout()` + `addWorkoutSet()` calls. If crash occurs between them, orphaned workouts remain in DB.

**Fix:** Use `saveWorkoutAtomic()` (already exists, used by WorkoutLogger) instead of two separate calls.

**Implementation:** `CardioLogger.tsx` now calls `saveWorkoutAtomic()` for transactional save, eliminating the risk of orphaned workout records.

**File:** `CardioLogger.tsx`

### BUG-06: Hardcoded age in plan auto-generation

**Root Cause:** `FitnessTab.tsx` line ~105 passes `{ age: 30, weightKg: userProfile.weight }` — age is always 30 regardless of user's actual age.

**Fix:** Read age from `healthProfileStore` if available, fallback to 30 only if not configured.

**File:** `FitnessTab.tsx`

### BUG-07: Nutrition bridge uses fake data — ✅ FIXED

**Root Cause:** `useFitnessNutritionBridge.ts` line ~105-110:
```tsx
const todayCaloriesConsumed = userProfile.targetCalories > 0 ? userProfile.targetCalories * 0.5 : 0;
const todayProteinConsumed = 0;  // ALWAYS ZERO
```
The bridge generates fake "50% of target" for calories and hardcoded 0 for protein. Smart insights are therefore not data-driven.

**Fix:** Import `useTodayNutrition()` hook (already exists) to get actual consumed calories/protein from the meal plan.

**Implementation:** `useFitnessNutritionBridge.ts` now imports and uses `useTodayNutrition()` to fetch real consumed calories and protein from the meal plan. Smart insights are now data-driven.

**File:** `useFitnessNutritionBridge.ts`

---

## Phase 2: Logic Corrections

### LOGIC-01: Periodization always uses Week 1 rep scheme — ✅ FIXED

**Root Cause:** `useTrainingPlan.ts` plan generation uses a hardcoded week number approach. When auto-generating after onboarding, it always produces Week 1 rep scheme regardless of plan duration.

**Fix:** Store `currentWeek` in the TrainingPlan object and increment weekly. The plan generation already supports week-based periodization — just needs to track which week the user is on.

**Implementation:** `TrainingPlan` type now includes `currentWeek: number` field. `useTrainingPlan.ts` adds `computeCurrentWeek()` helper that derives the current week from `planStartDate`. The hook accepts a `planStartDate` input to compute the week offset.

**Files:** `useTrainingPlan.ts`, `fitnessStore.ts` (add `currentWeek` field to TrainingPlan type)

### LOGIC-02: Plateau detection too strict — ✅ FIXED

**Root Cause:** `useProgressiveOverload.ts` requires exact same max weight for 3+ weeks. Real-world variance (e.g., 100kg → 99kg → 100kg) is missed.

**Fix:** Add ±2% tolerance to weight comparison in plateau detection:
```tsx
const isWithinTolerance = Math.abs(weekMax - referenceMax) / referenceMax <= 0.02;
```

**Implementation:** `useProgressiveOverload.ts` now includes `isWeightSimilar()` helper with ±2% tolerance for plateau detection, preventing false negatives from minor weight fluctuations.

**File:** `useProgressiveOverload.ts`

### LOGIC-03: Duration estimation too simplistic

**Root Cause:** `TrainingPlanView.tsx` `estimateDuration()` only counts `sets × (30s + restSeconds)` + 5 min buffer. Missing exercise setup time, transitions, and warm-up.

**Fix:** Add 2 min per exercise for setup/transitions and 5 min for warm-up:
```tsx
const totalSeconds = exercises.reduce(
  (sum, ex) => sum + ex.sets * (30 + ex.restSeconds) + 120, // +120s per exercise
  0
);
return Math.round(totalSeconds / 60) + 10; // +10 min warm-up + cooldown
```

**File:** `TrainingPlanView.tsx`

---

## Phase 3: UI Consistency

### UI-01: DailyScoreHero custom pixel rounding

**Issue:** Uses `rounded-[14px]` (custom pixel value) instead of design token.
**Fix:** Replace with `rounded-2xl` (standard card container tier).
**File:** `DailyScoreHero.tsx`

### UI-02: SetEditor modal rounding mismatch

**Issue:** Uses `rounded-t-2xl` while all other modals use `rounded-t-3xl`.
**Fix:** Change to `rounded-t-3xl sm:rounded-3xl`.
**File:** `SetEditor.tsx`

### UI-03: Mini-card containers use wrong tier

**Issue:** `WeightMini.tsx`, `StreakMini.tsx`, and ProgressDashboard metric cards use `rounded-xl` instead of `rounded-2xl`.
**Fix:** Standardize to `rounded-2xl` for all card containers.
**Files:** `WeightMini.tsx`, `StreakMini.tsx`, `ProgressDashboard.tsx`

### UI-04: Missing i18n keys in ProgressDashboard

**Issue:** Several keys show raw translation strings (e.g., `fitness.progress.weekOf` parameter mismatch, already covered in BUG-04). Audit for any other missing keys.
**File:** `vi.json`

---

## Phase 4: Dead Code Cleanup

### DEAD-01: DeloadModal never called
- `DeloadModal.tsx` exists but is never rendered from any parent component.
- **Decision:** Keep the component but wire it to trigger when `useProgressiveOverload` detects chronic overtraining (4+ weeks declining volume).

### DEAD-02: PRToast never triggered
- `PRToast.tsx` exists and is functional but WorkoutLogger never passes PR data to it.
- **Covered by:** BUG-03 fix (PR detection).

---

## Design System Standard (Enforced)

```
MODAL/DIALOG:    rounded-t-3xl (mobile) / rounded-3xl (desktop)
CARD CONTAINER:  rounded-2xl
BUTTON PRIMARY:  rounded-xl
BUTTON SECONDARY: rounded-lg
BADGE/PILL:      rounded-full
INPUT FIELD:     rounded-lg
```

---

## Testing Strategy

Each fix must:
1. Have a unit test verifying the fix
2. Pass existing test suite (51+ fitness tests)
3. Pass ESLint with zero violations
4. Build successfully via Vite

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Type coercion fix (BUG-01) changes stored data | Add migration that runs on store init |
| PR detection (BUG-03) may show false PRs | Use same detection threshold as existing `gamification.ts` |
| Nutrition bridge (BUG-07) data change | Verify with actual meal plan data on localhost |
| UI radius changes affect layout | Visual regression check via screenshots |
