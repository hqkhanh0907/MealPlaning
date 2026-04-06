# Wave 3: Form UX — Requirements Update (PRD/Use Cases)

## Change Summary

No business logic changes. Wave 3 is a pure UX improvement wave that enhances form input behavior.

## Updated Requirements

### REQ-FORM-01: Numeric Input Behavior

**Before:** Numeric inputs accepted `-`, `e`, `E` characters. Mobile keyboard type was inconsistent.

**After:**

- All numeric inputs block `-`, `e`, `E` keys at the input level
- `inputMode="decimal"` for fields accepting decimals (weight, height, distance, sleep hours)
- `inputMode="numeric"` for integer-only fields (reps, duration, heart rate, calories)
- `min={0}` attribute on all applicable inputs

### REQ-FORM-02: Validation Feedback Timing

**Before:** Forms used `mode: 'onBlur'` — validation only triggered on blur, no real-time feedback.

**After:** Forms use `mode: 'onTouched'` — validation triggers on first blur, then re-validates on every keystroke. Provides immediate feedback after user interacts with a field.

**Affected forms (11):** IngredientEditModal, DishEditModal, QuickAddIngredientForm, SaveAnalyzedDishModal, SaveTemplateModal, HealthProfileForm, TrainingProfileForm, CardioLogger, CustomExerciseModal, UnifiedOnboarding, WorkoutLogger.

**Exception:** GoalPhaseSelector retains `mode: 'onChange'` (intentional for real-time goal type feedback).

### REQ-FORM-03: Character Counters

**Before:** Name fields had `maxLength` in Zod schema but no visual indicator.

**After:**

- HealthProfileForm name: `X/50` counter below input
- HealthBasicStep (onboarding) name: `X/50` counter below input + `maxLength={50}` HTML attribute
- SaveTemplateModal name: `X/100` counter (already existed)

### REQ-FORM-04: Native Validation Suppression

**Before:** `<form>` elements could trigger native browser validation popups.

**After:** `noValidate` attribute on all `<form>` elements (IngredientEditModal, CustomExerciseModal). All validation handled exclusively by Zod + React Hook Form.
