# Wave 3: Form UX — Architecture Update

## Change Summary

No architectural changes. Wave 3 introduces a single shared utility and applies consistent patterns across existing components.

## New Module

### `src/utils/numericInputHandlers.ts`

```
Purpose: Shared keyboard event handler for numeric inputs
Exports: blockNegativeKeys(e: React.KeyboardEvent<HTMLInputElement>)
Used by: 6+ components (StringNumberController, IngredientEditModal,
         TrainingProfileForm, CardioLogger, SetEditor, DailyWeightInput,
         HealthBasicStep, NutritionGoalStep)
```

**Data Flow:**

```
User keypress → blockNegativeKeys handler
  ├─ key is '-', 'e', 'E' → e.preventDefault() (blocked)
  └─ key is anything else → pass through (allowed)
```

## Architecture Decisions

### AD-W3-01: Centralized vs Inline Handler

**Decision:** Create a shared `blockNegativeKeys` function in `src/utils/` instead of inline handlers.

**Rationale:** 8+ consumers need the same behavior. A shared utility ensures consistency and single-point maintenance.

### AD-W3-02: StringNumberController as Central Point

**Decision:** Add `onKeyDown` and `min` to `StringNumberController` to automatically protect all its consumers.

**Rationale:** StringNumberController wraps most numeric inputs in the app. Adding the handler here covers HealthProfileForm, DishEditModal, QuickAddIngredientForm, SaveAnalyzedDishModal without individual edits to each.

### AD-W3-03: onTouched vs onChange vs onBlur

**Decision:** Use `mode: 'onTouched'` (validate on first blur, then real-time) instead of `onChange` (validate every keystroke from start).

**Rationale:**

- `onBlur` (previous): Too late — user has to leave field to see errors
- `onChange`: Too aggressive — shows errors on first keystroke before user finishes typing
- `onTouched`: Best balance — waits for first interaction, then provides real-time feedback

## Component Dependency Graph (Form Validation)

```
StringNumberController (onKeyDown, min)
  ├── HealthProfileForm (mode:onTouched, char counter)
  ├── DishEditModal (mode:onTouched)
  ├── QuickAddIngredientForm (mode:onTouched)
  └── SaveAnalyzedDishModal (mode:onTouched)

Independent numeric inputs (direct blockNegativeKeys):
  ├── IngredientEditModal (noValidate, mode:onTouched)
  ├── TrainingProfileForm (mode:onTouched)
  ├── CardioLogger (mode:onTouched)
  ├── SetEditor (inputMode+onKeyDown)
  ├── DailyWeightInput (inputMode+onKeyDown)
  ├── HealthBasicStep (onKeyDown+min, maxLength, char counter)
  └── NutritionGoalStep (onKeyDown+min)
```
