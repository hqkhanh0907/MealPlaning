╔════════════════════════════════════════════════════════════════════════════╗
║              MealPlaning Test Writing - Quick Reference                    ║
╚════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. COMPONENT FILE PATHS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DishManager.tsx
  Path: /src/components/DishManager.tsx (291 lines)
  Props: dishes, ingredients, onAdd, onUpdate, onDelete, isUsed, onCreateIngredient?
  State: filterTag, searchQuery, sortBy, viewLayout, nutritionMap, deleteConfirmation
  Views: Grid, List, DetailModal

DishEditModal.tsx
  Path: /src/components/modals/DishEditModal.tsx (540 lines)
  Props: editingItem, ingredients, onSubmit, onClose, onCreateIngredient?
  State: namePrimary, selectedIngredients, tags, amountStrings, formErrors, showUnsavedDialog
        | aiSuggestLoading, aiSuggestions, extraIngredients, qaName, qaUnit, qaCal, qaProtein...
        | showQuickAdd, qaAiLoading, aiTimerRef, aiAbortRef, aiSuggestAbortRef

AISuggestIngredientsPreview.tsx
  Path: /src/components/modals/AISuggestIngredientsPreview.tsx (158 lines)
  Props: dishName, suggestions, existingIngredients, onConfirm, onClose
  State: keys, items (SelectedItem[]), selectedCount
  Logic: fuzzyMatch, handleToggle, handleAmountChange, handleConfirm

UnsavedChangesDialog.tsx
  Path: /src/components/shared/UnsavedChangesDialog.tsx (57 lines)
  Props: isOpen, onSave, onDiscard, onCancel
  Buttons: Save (green), Discard (rose), Continue Editing (slate)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. VALIDATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DishEditModal Validation (in validate() function):

┌─ NAME ─────────────────────────────────────────────────────────┐
│ ✗ Empty or whitespace                                           │
│ Error: t('dish.validationName')                               │
│ Key: formErrors.name                                           │
└─────────────────────────────────────────────────────────────────┘

┌─ TAGS ─────────────────────────────────────────────────────────┐
│ ✗ Length === 0 (no meal type selected)                         │
│ Error: t('dish.validationSelectMeal')                         │
│ Key: formErrors.tags                                           │
└─────────────────────────────────────────────────────────────────┘

┌─ INGREDIENTS ──────────────────────────────────────────────────┐
│ ✗ Length === 0 (none selected)                                 │
│ Error: t('dish.validationIngredients')                        │
│ Key: formErrors.ingredients                                    │
└─────────────────────────────────────────────────────────────────┘

┌─ AMOUNT (per ingredient) ──────────────────────────────────────┐
│ ✗ Empty string or whitespace                                   │
│   Error: t('dish.validationAmountRequired')                   │
│ ✗ NaN (Number.isNaN(Number.parseFloat(value)))               │
│   Error: t('dish.validationAmountRequired')                   │
│ ✗ Negative (Number.parseFloat(value) < 0)                    │
│   Error: "Số lượng không được âm"                             │
│ Key: formErrors.amounts?.[ingredientId]                       │
└─────────────────────────────────────────────────────────────────┘

Delete Dish Validation:
  ✗ If isUsed(dishId) === true → warning toast, NO confirmation modal
  ✓ If isUsed(dishId) === false → show confirmation modal

isUsed Check Implementation:
  const isDishUsed = (dishId: string) =>
    dayPlans.some(p =>
      p.breakfastDishIds.includes(dishId) ||
      p.lunchDishIds.includes(dishId) ||
      p.dinnerDishIds.includes(dishId)
    );

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. CRITICAL BUSINESS LOGIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BILINGUAL NAME HANDLING:
  namePrimary = current language only (vi if lang='vi', en if lang='en')
  On submit buildDish():
    if lang === 'vi':
      name = { vi: namePrimary.trim(), en: editingItem?.name.en ?? namePrimary.trim() }
    if lang === 'en':
      name = { vi: editingItem?.name.vi ?? namePrimary.trim(), en: namePrimary.trim() }
  
  ✓ Current language updated, other preserved
  ✓ For NEW dishes, both languages same (namePrimary)

AMOUNT HANDLING:
  amountStrings[ingredientId] = "150.7"  ← User input (string)
  selectedIngredients[i].amount = 150.7   ← Updated when valid
  On submit: Math.round(150.7) = 151      ← Rounded for storage

EXTRA INGREDIENTS:
  Created inline via quick-add
  NOT flushed to parent until successful onSubmit
  On successful save: extraIngredients.forEach(ing => onCreateIngredient?.(ing))

AI SUGGEST FLOW:
  1. User enters dish name
  2. Clicks sparkle → handleAiSuggest()
  3. Calls suggestDishIngredients(namePrimary, signal)
  4. Shows loading spinner
  5. Results → AISuggestIngredientsPreview modal opens
  6. User confirms → handleAiSuggestConfirm()
     - Matched: adds existing ingredient ID
     - New: creates Ingredient, adds to extraIngredients
  7. Modal closes, ingredients in selectedIngredients

QUICK-ADD INGREDIENT:
  1. Click + button → showQuickAdd = true
  2. Enter name → on blur: triggerAIFill(name, unit) [800ms debounce]
     - Calls suggestIngredientInfo(name, unit)
     - Fills qaCal, qaProtein, qaCarbs, qaFat, qaFiber
  3. Manually edit nutrition if needed
  4. Click submit → handleQuickCreate()
     - Validates qaName.trim() !== ""
     - Creates Ingredient, adds to extraIngredients
     - Adds to selectedIngredients with amount=100
     - Resets form

UNSAVED CHANGES FLOW:
  handleClose() → if hasChanges() → showUnsavedDialog = true
  Options:
    Save: handleSaveAndBack() → validate() → flush extras → onSubmit()
    Discard: onClose() → no save
    Continue: setShowUnsavedDialog(false) → stay in modal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. AI SUGGEST PREVIEW LOGIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FUZZY MATCHING:
  const fuzzyMatch = (aiName: string, ingredientName: string): boolean => {
    const a = aiName.toLowerCase().trim();
    const b = ingredientName.toLowerCase().trim();
    return a.includes(b) || b.includes(a);
  };
  
  Bidirectional substring match
  "Bánh phở" matches "phở" ✓
  "rice noodles" matches "noodles" ✓
  Both languages checked (vi and en)

BADGES:
  matched = existingIngredients.find(ing =>
    fuzzyMatch(s.name, getLocalizedField(ing.name, 'vi')) ||
    fuzzyMatch(s.name, getLocalizedField(ing.name, 'en'))
  )
  
  if matched: Green "Existing" badge
  if !matched: Amber "New" badge (will create)

ON CONFIRM:
  selected = items
    .filter(i => i.checked)
    .map(i => ({
      suggestion: i.suggestion,
      amount: Math.round(Number.parseFloat(i.amount) || i.suggestion.amount),
      matchedIngredient: i.matchedIngredient
    }))
  
  Disabled when selectedCount === 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. NUTRITION CALCULATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

calculateIngredientNutrition(ingredient: Ingredient, amount: number):

  if isWeightOrVolume(unit):
    factor = (amount * getConversionFactor(unit)) / 100
  else:
    factor = amount
  
  Conversion factors:
    kg, l → 1000x
    mg → 0.001x
    g, ml → 1x
    pieces, cups, etc → amount directly

Example:
  ingredient: { caloriesPer100: 165, proteinPer100: 31, ... }
  unit: "g"
  amount: 200
  
  factor = (200 * 1) / 100 = 2
  result = { calories: 165 * 2 = 330, protein: 31 * 2 = 62, ... }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. SORT/FILTER/SEARCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEARCH:
  searchFn = (dish: Dish, query: string) => {
    const ql = query.toLowerCase();
    return Object.values(dish.name).some(n => n.toLowerCase().includes(ql));
  };
  Case-insensitive, searches both vi/en names

FILTER:
  extraFilter = (dish: Dish) => !filterTag || (dish.tags?.includes(filterTag) ?? false);
  filterTag: 'breakfast' | 'lunch' | 'dinner' | null
  null = show all

SORT OPTIONS:
  'name-asc', 'name-desc' → localeCompare (locale-aware)
  'cal-asc', 'cal-desc' → by total dish calories
  'pro-asc', 'pro-desc' → by total protein
  'ing-asc', 'ing-desc' → by ingredient count
  
  Nutrition pre-computed in nutritionMap (Map<dishId, NutritionInfo>)
  Avoids O(N log N) recalculation in sort comparator

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. EXISTING TEST COVERAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ dishEditModal.test.tsx (1108 lines, ~60 tests)
  - Validation, CRUD, AI suggest, quick-add, unsaved changes

✓ managers.test.tsx (87 test blocks)
  - DishManager render, search, sort, filter, delete, view toggle

✓ aiSuggestIngredientsPreview.test.tsx (~100 tests)
  - Badges, checkbox, amount, confirm, empty state

✓ saveAnalyzedDishModal.test.tsx
  - Save from AI analysis, ingredient selection

✓ nutrition.test.ts
  - Calculation, conversion factors, edge cases

✓ foodDictionary.test.ts
  - Dictionary lookup, translations

❌ GAPS:
  - Bilingual name behavior
  - Extra ingredients flush
  - Debounce timing (AI fill)
  - Request abort/cancellation
  - Amount sync (string ↔ number)
  - Picker duplicate filtering
  - Unit conversion edge cases
  - Mobile interactions
  - Accessibility compliance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. TYPES & INTERFACES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Ingredient = {
  id: string;
  name: { vi: string; en: string };
  unit: { vi: string; en: string };
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  fiberPer100: number;
};

type DishIngredient = {
  ingredientId: string;
  amount: number;  // in 'unit'
};

type Dish = {
  id: string;
  name: { vi: string; en: string };
  ingredients: DishIngredient[];
  tags: ('breakfast' | 'lunch' | 'dinner')[];
};

type DayPlan = {
  date: string;  // YYYY-MM-DD
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

type SuggestedDishIngredient = {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

type ConfirmedSuggestion = {
  suggestion: SuggestedDishIngredient;
  amount: number;
  matchedIngredient: Ingredient | null;
};

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. MOCK SETUP TEMPLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DishManager } from '../components/DishManager';

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('../services/geminiService', () => ({
  suggestIngredientInfo: vi.fn().mockResolvedValue({
    calories: 200, protein: 25, carbs: 0, fat: 8, fiber: 0,
  }),
  suggestDishIngredients: vi.fn().mockResolvedValue([
    { name: 'Bánh phở', amount: 250, unit: 'g', calories: 356, ... },
  ]),
}));

const ingredients: Ingredient[] = [
  { 
    id: 'i1', 
    name: { vi: 'Ức gà', en: 'Chicken breast' }, 
    caloriesPer100: 165, 
    proteinPer100: 31, 
    carbsPer100: 0, 
    fatPer100: 3.6, 
    fiberPer100: 0, 
    unit: { vi: 'g', en: 'g' } 
  },
];

const dishes: Dish[] = [
  { 
    id: 'd1', 
    name: { vi: 'Gà nướng', en: 'Grilled chicken' }, 
    ingredients: [{ ingredientId: 'i1', amount: 200 }], 
    tags: ['lunch', 'dinner'] 
  },
];

const defaultProps = {
  dishes,
  ingredients,
  onAdd: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  isUsed: vi.fn().mockReturnValue(false),
};

describe('DishManager', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders dishes', () => {
    render(<DishManager {...defaultProps} />);
    expect(screen.getByText('Gà nướng')).toBeInTheDocument();
  });
});

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. DATA-TESTID QUICK LOOKUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DISHMANGER:
  "dish-manager" - main container
  "input-search-dish" - search input
  "select-sort-dish" - sort dropdown
  "btn-add-dish" - add new button
  "btn-filter-all-dishes" - all dishes filter
  "btn-filter-breakfast", "-lunch", "-dinner" - tag filters
  "btn-edit-dish-{dishId}" - edit button
  "btn-delete-dish-{dishId}" - delete button

DISHEDITMODAL:
  "input-dish-name" - dish name input
  "btn-ai-suggest" - AI suggest button
  "ai-suggest-loading" - loading spinner
  "tag-breakfast", "-lunch", "-dinner" - tag buttons
  "input-dish-ingredient-search" - ingredient search
  "btn-quick-add-ingredient" - quick-add toggle
  "btn-add-ing-{ingredientId}" - add ingredient button
  "input-dish-amount-{ingredientId}" - amount input
  "btn-save-dish" - save button
  "btn-close-dish" - close button
  "error-dish-name", "-tags", "-ingredients" - validation errors
  "error-dish-amount-{ingId}" - amount error

AISUGGESTIONS:
  "ai-suggest-item-{index}" - suggestion item
  "ai-suggest-checkbox-{index}" - checkbox
  "ai-suggest-badge-existing-{index}" - existing ingredient badge
  "ai-suggest-badge-new-{index}" - new ingredient badge
  "ai-suggest-amount-{index}" - amount input
  "btn-ai-suggest-confirm" - confirm button
  "btn-ai-suggest-cancel" - cancel button
  "ai-suggest-empty" - empty state message

QUICKADD:
  "input-qa-name" - quick-add name
  "qa-unit" - unit selector
  "btn-qa-ai-fill" - AI fill button
  "btn-qa-submit" - submit button
  "btn-qa-cancel" - cancel button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full documentation: See COMPONENT_EXPLORATION.md in project root

