# MealPlaning Project - Component Exploration Complete ✓

## Executive Summary

I have completed a comprehensive exploration of the MealPlaning project focusing on dish management components. All key files have been found, analyzed, and documented with detailed test writing guidance.

## Documents Created

1. **COMPONENT_EXPLORATION.md** - Full detailed exploration (41 KB)
   - Complete component documentation
   - Type definitions and interfaces
   - Business logic explanations
   - Edge cases and test gaps

2. **TEST_QUICK_REFERENCE.md** - Quick reference guide (37 KB)
   - Validation rules summary
   - Business logic at-a-glance
   - Data-testid lookup table
   - Mock setup template
   - Type interfaces quick view

## Key Files Located

### Components (8 files)

| File                            | Size  | Purpose                                               |
| ------------------------------- | ----- | ----------------------------------------------------- |
| DishManager.tsx                 | 291 L | Main dish list/grid component with search/filter/sort |
| DishEditModal.tsx               | 540 L | Create/edit dishes with AI suggest & quick-add        |
| AISuggestIngredientsPreview.tsx | 158 L | Preview and confirm AI suggestions                    |
| UnsavedChangesDialog.tsx        | 57 L  | Unsaved changes confirmation dialog                   |
| nutrition.ts                    | 101 L | Nutrition calculation utilities                       |
| foodDictionary.ts               | 307 L | Static bilingual ingredient dictionary                |
| translateQueueService.ts        | 174 L | Background translation job queue                      |
| types.ts                        | Full  | TypeScript type definitions                           |

### Test Files (8+ files)

- dishEditModal.test.tsx (1108 lines, ~60 tests)
- managers.test.tsx (87 test blocks)
- aiSuggestIngredientsPreview.test.tsx (~100 tests)
- saveAnalyzedDishModal.test.tsx
- nutrition.test.ts
- foodDictionary.test.ts
- translateQueueService.test.ts
- Plus 20+ additional test files

## Component Overview

### DishManager.tsx

**Main dish list component with grid/list views**

- ✓ Search (case-insensitive on vi/en names)
- ✓ Filter by meal type tags (breakfast/lunch/dinner)
- ✓ Sort by name, calories, protein, ingredient count
- ✓ Grid view (responsive cards)
- ✓ List view (desktop table + mobile rows)
- ✓ Detail modal (full nutrition + ingredients)
- ✓ Delete prevention (checks isUsed)
- ✓ Undo support

**Critical:** `isUsed(id)` checks if dish is in any DayPlan slot

### DishEditModal.tsx

**Create/edit dishes with AI-powered ingredients**

- ✓ Bilingual name handling (vi/en)
- ✓ Tag selection (meal types)
- ✓ Ingredient picker with search
- ✓ AI suggest ingredients (with fuzzy matching)
- ✓ Quick-add ingredient inline (with AI nutrition fill)
- ✓ Amount input with ± buttons
- ✓ Live nutrition preview
- ✓ Unsaved changes dialog
- ✓ Validation (name, tags, ingredients, amounts)

**Critical Logic:**

- Extra ingredients NOT flushed until successful save
- Amount handled as strings in UI, rounded on submit
- Bilingual names preserve other language on edit

### AISuggestIngredientsPreview.tsx

**Preview and confirm AI suggestions**

- ✓ Fuzzy matching (bidirectional substring)
- ✓ Badges (Existing/New ingredients)
- ✓ Amount editing
- ✓ Checkbox selection
- ✓ Disabled confirm when nothing selected

### Nutrition Calculation

**Smart nutrition calculation with unit conversion**

- Weight/volume units: (amount × conversionFactor) / 100
- Non-weight units: amount × 1 (treat as count)
- Conversion: kg/l → 1000x, mg → 0.001x, g/ml → 1x

### Delete Dish Logic

**Two-stage validation**

1. If `isUsed(dishId)` → warning toast, block delete
2. If not used → confirmation modal → calls onDelete

## Validation Rules Summary

### DishEditModal Validation

| Field           | Rule                        | Error                                                  |
| --------------- | --------------------------- | ------------------------------------------------------ |
| **Name**        | Not empty/whitespace        | dish.validationName                                    |
| **Tags**        | At least 1 selected         | dish.validationSelectMeal                              |
| **Ingredients** | At least 1 selected         | dish.validationIngredients                             |
| **Amount**      | Not empty, valid number, ≥0 | dish.validationAmountRequired / Số lượng không được âm |

### Delete Validation

| Condition                  | Behavior                    |
| -------------------------- | --------------------------- |
| `isUsed(dishId)` === true  | Warning toast, block delete |
| `isUsed(dishId)` === false | Show confirmation modal     |

## Business Logic Highlights

### 1. Bilingual Name Handling

- User sees only current language (namePrimary)
- On submit: current language updated, other language preserved
- Example: Edit vi="Cơm" en="Rice" with lang=vi → change to "Cơm tấm" → result {vi: "Cơm tấm", en: "Rice"}

### 2. AI Suggest Flow

1. User enters dish name
2. Clicks sparkle button → suggestDishIngredients(name)
3. Shows loading spinner
4. Preview modal opens → user selects items
5. Confirm → matched ingredients (existing ID) + new ingredients (temp Ingredient)
6. Added to selectedIngredients

### 3. Quick-Add Ingredient

1. Click + button → overlay appears
2. Enter name → 800ms debounce → suggestIngredientInfo(name, unit)
3. AI fills nutrition (or manual entry)
4. Submit → creates Ingredient, added to selectedIngredients
5. On dish submit → flushed to parent via onCreateIngredient

### 4. Unsaved Changes

- handleClose checks hasChanges()
- If changed → dialog with Save/Discard/Continue options
- Save → validates, flushes extras, submits
- Discard → closes without saving
- Continue → stays in edit modal

## Test Coverage Status

### Well Covered ✓

- Validation logic (all error paths)
- State transitions (add/edit/delete)
- Form interactions (input, checkbox, amount ±)
- Modal flows (open/close/confirm/cancel)
- Undo functionality
- Sorting/filtering/search
- AI suggest basic flow (~60 tests in dishEditModal.test.tsx)

### Gaps ❌

- Bilingual name behavior (vi vs en preservation)
- Extra ingredients flush on save
- Debounce timing (AI fill 800ms)
- Request abort/cancellation scenarios
- Amount string ↔ number sync
- Picker duplicate filtering
- Unit conversion edge cases
- Large ingredient lists (1000+)
- Mobile keyboard interactions
- Accessibility compliance

## Quick Test Writing Checklist

### DishManager Tests

- [ ] Delete blocked when isUsed=true (warning, no modal)
- [ ] Delete allowed when isUsed=false (confirmation modal)
- [ ] Undo button reverts with onAdd
- [ ] Sort/filter combinations
- [ ] Nutrition pre-computed (no recalc per sort)
- [ ] Grid/List view persists
- [ ] Edit opens with populated data

### DishEditModal Tests

- [ ] Bilingual name handling (current lang only)
- [ ] Validation errors clear on field change
- [ ] Unsaved dialog branches (save/discard/cancel)
- [ ] Extra ingredients NOT sent until save
- [ ] AI suggest flow (load → preview → confirm)
- [ ] Quick-add with AI fill debounce
- [ ] Amount string/number sync
- [ ] Picker filters duplicates
- [ ] Request abort on unmount

### AISuggestions Tests

- [ ] Fuzzy matching (bidirectional)
- [ ] Badges correct (matched/new)
- [ ] Amount rounding on confirm
- [ ] Confirm disabled when nothing selected
- [ ] Empty state handled

## Type Definitions Reference

```typescript
type LocalizedString = { vi: string; en: string };
type MealType = 'breakfast' | 'lunch' | 'dinner';

type Ingredient = {
  id: string;
  name: LocalizedString;
  unit: LocalizedString;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  fiberPer100: number;
};

type DishIngredient = { ingredientId: string; amount: number };

type Dish = {
  id: string;
  name: LocalizedString;
  ingredients: DishIngredient[];
  tags: MealType[];
};

type DayPlan = {
  date: string; // YYYY-MM-DD
  breakfastDishIds: string[];
  lunchDishIds: string[];
  dinnerDishIds: string[];
};

type NutritionInfo = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};
```

## File Locations

```
/src/components/
├── DishManager.tsx
├── modals/
│   ├── DishEditModal.tsx
│   ├── AISuggestIngredientsPreview.tsx
│   └── UnsavedChangesDialog.tsx
├── shared/
│   └── [Other shared components]

/src/utils/
├── nutrition.ts

/src/data/
├── foodDictionary.ts

/src/services/
├── translateQueueService.ts

/src/__tests__/
├── dishEditModal.test.tsx
├── managers.test.tsx
├── aiSuggestIngredientsPreview.test.tsx
├── nutrition.test.ts
└── [20+ other test files]
```

## Next Steps

1. **Read** COMPONENT_EXPLORATION.md for detailed documentation
2. **Reference** TEST_QUICK_REFERENCE.md while writing tests
3. **Use** data-testid lookup for element selection
4. **Follow** mock setup template for consistency
5. **Check** validation rules for edge cases
6. **Test** the gaps identified in "Test Coverage Status"

## Key Insights for Test Writing

1. **Always mock useNotification** - Shows warnings/toasts
2. **Always mock geminiService** - suggestIngredientInfo, suggestDishIngredients
3. **Test bilingual behavior** - Different behavior for vi vs en primary language
4. **Test validation order** - Name → Tags → Ingredients → Amounts
5. **Test request cancellation** - AbortController cleanup on unmount
6. **Test unsaved dialog branches** - Save validates, Discard doesn't
7. **Test extra ingredients flush** - Only on successful submit
8. **Test isUsed logic** - Checks all 3 DayPlan slots

---

**Exploration completed:** All major components documented with test-writing guidance.
**Documentation files:** COMPONENT_EXPLORATION.md, TEST_QUICK_REFERENCE.md (in project root)
