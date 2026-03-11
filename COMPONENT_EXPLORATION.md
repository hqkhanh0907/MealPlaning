# MealPlaning Project - Detailed Component Exploration Summary

## QUICK REFERENCE

### Files Found
✓ DishManager.tsx (291 lines) - Main dish list/grid component
✓ DishEditModal.tsx (540 lines) - Dish creation/edit with AI suggest
✓ AISuggestIngredientsPreview.tsx (158 lines) - Preview and confirm AI suggestions
✓ UnsavedChangesDialog.tsx (57 lines) - Unsaved changes confirmation
✓ nutrition.ts (101 lines) - Nutrition calculation utilities
✓ foodDictionary.ts (307 lines) - Static bilingual ingredient dictionary
✓ translateQueueService.ts (174 lines) - Background translation job queue
✓ types.ts - All TypeScript types/interfaces

### Test Files
✓ dishEditModal.test.tsx (1108 lines, ~60 tests)
✓ managers.test.tsx (~150 lines, 87 test blocks)
✓ aiSuggestIngredientsPreview.test.tsx (~100 tests)
✓ saveAnalyzedDishModal.test.tsx
✓ nutrition.test.ts
✓ foodDictionary.test.ts
✓ translateQueueService.test.ts

---

## COMPONENT DETAILS

### 1. DishManager.tsx
**Location:** /Users/khanhhuynh/person_project/MealPlaning/src/components/DishManager.tsx

**Props Interface:**
- dishes: Dish[] - list of dishes
- ingredients: Ingredient[] - for nutrition calc
- onAdd(dish) - create new dish
- onUpdate(dish) - update existing
- onDelete(id) - delete (calls after isUsed check passes)
- isUsed(id: string): boolean - **CRITICAL**: checks if dish is in any DayPlan slot
- onCreateIngredient?(ing) - optional: propagate newly created ingredients

**Key State:**
- searchQuery, sortBy, viewLayout (from useListManager hook)
- filterTag: MealType | null (breakfast/lunch/dinner filters)
- deleteConfirmation: {isOpen, dishId, dishName}
- nutritionMap: Map<dishId, NutritionInfo> - pre-computed, memoized

**Functions:**
- searchFn(dish, query): boolean - case-insensitive search on vi/en name
- sortFn(a, b, sortOption): number
  - name-asc/desc: localeCompare on localized names
  - cal-asc/desc: by dish total calories
  - pro-asc/desc: by dish total protein
  - ing-asc/desc: by ingredient count
- handleDelete(id, displayName)
  - LOGIC: if isUsed(id) → warning notification, return (EARLY EXIT)
  - Otherwise → open deleteConfirmation modal
- confirmDelete()
  - Calls onDelete(dishId)
  - Shows undo toast with onAdd callback for 5 seconds

**Views (2 Modes):**
1. GRID VIEW (default)
   - Cards: ChefHat icon, dish name, ingredient count, tags (badges), cal/protein in boxes
   - Edit + Delete buttons (Delete disabled/opacity-40 if isUsed)
   
2. LIST VIEW
   - Desktop: table with Name | Tags | Calories | Protein | Actions
   - Mobile: custom row layout with card structure
   - Same disabled/opacity state for Delete

3. DETAIL MODAL (opened on card click)
   - Full nutrition breakdown (cal, protein, carbs, fat)
   - Ingredient list with amounts
   - Edit button opens DishEditModal

**Validation Rules:**
- Delete only allowed if isUsed(dishId) === false
- If true → toast warning "Không thể xóa - Được sử dụng trong kế hoạch"

**Edge Cases:**
- Empty dishes → EmptyState with add action
- Search finds nothing → shows empty state
- Tag filter reduces count
- Sort by nutrition pre-computes to avoid O(N log N) sort comparator


### 2. DishEditModal.tsx
**Location:** /Users/khanhhuynh/person_project/MealPlaning/src/components/modals/DishEditModal.tsx

**Props:**
- editingItem: Dish | null (null=create, Dish=edit mode)
- ingredients: Ingredient[] (available ingredients)
- onSubmit(dish): void - called on successful save
- onClose(): void - called on discard/unsaved cancel
- onCreateIngredient?(ing): void - optional: propagate new ingredients

**State Variables (Critical for Testing):**

FORM STATE:
- namePrimary: string - primary language name (vi if lang=vi, en if lang=en)
- selectedIngredients: DishIngredient[] - list of added ingredients
- tags: MealType[] - selected meal types (breakfast/lunch/dinner)
- amountStrings: Record<ingredientId, string> - string representation of amounts
  (allows mobile users to clear and retype without snap-back)

VALIDATION STATE:
- formErrors: {
    name?: string (message key)
    tags?: string
    ingredients?: string
    amounts?: Record<ingredientId, string> (per-ingredient errors)
  }

UI STATE:
- showUnsavedDialog: boolean
- ingredientSearch: string - search input for ingredient picker

AI SUGGEST STATE:
- aiSuggestLoading: boolean
- aiSuggestions: SuggestedDishIngredient[] | null
- aiSuggestError: string
- aiSuggestAbortRef: AbortController | null

QUICK-ADD INGREDIENT STATE:
- showQuickAdd: boolean
- qaName: string
- qaUnit: {vi: string, en: string}
- qaCal, qaProtein, qaCarbs, qaFat, qaFiber: string (nutrition values)
- qaAiLoading: boolean (AI filling nutrition)
- qaError: string
- aiTimerRef: timeout ID (800ms debounce)
- aiAbortRef: AbortController | null

EXTRA INGREDIENTS:
- extraIngredients: Ingredient[] - created inline, NOT persisted until submit

**Validation Rules (Critical):**

```
1. NAME VALIDATION:
   - Error: "dish.validationName" (Vui lòng nhập tên món ăn)
   - Condition: namePrimary.trim() === ""

2. TAGS VALIDATION:
   - Error: "dish.validationSelectMeal" (Vui lòng chọn ít nhất một bữa ăn phù hợp)
   - Condition: tags.length === 0

3. INGREDIENTS VALIDATION:
   - Error: "dish.validationIngredients" (Vui lòng chọn ít nhất một nguyên liệu)
   - Condition: selectedIngredients.length === 0

4. AMOUNT VALIDATION (per ingredient):
   - Error: "dish.validationAmountRequired" (Vui lòng nhập số lượng)
   - Condition: amountStrings[ingId].trim() === ""
   - Error: "Số lượng không được âm"
   - Condition: Number.parseFloat(amountStrings[ingId]) < 0
```

**Key Functions:**

- validate(): boolean
  - Checks all rules above
  - Sets formErrors and returns false if any fail
  - Clears formErrors if validation passes

- buildDish(): Dish
  - Constructs {id, name: {vi, en}, ingredients, tags}
  - NAME LOGIC: if lang=vi, set vi=namePrimary, preserve en from editingItem
                if lang=en, set en=namePrimary, preserve vi from editingItem
  - AMOUNTS: rounds Number.parseFloat(amountStrings[ingId])

- hasChanges(): boolean
  - Compares current state to editingItem
  - Returns true if:
    - editingItem null && (namePrimary !== "" OR ingredientIds OR tags)
    - OR name changed
    - OR tags changed
    - OR selectedIngredients differ in count/values

- handleSubmit()
  - Validation check
  - Prevents double submission (hasSubmittedRef)
  - Flushes extraIngredients to parent via onCreateIngredient
  - Calls onSubmit(buildDish())

- handleClose()
  - Aborts ongoing requests (aiSuggestAbortRef.abort())
  - If hasChanges() → opens UnsavedChangesDialog
  - Otherwise → calls onClose()

- handleAiSuggest()
  - Validates namePrimary.trim() !== ""
  - Calls suggestDishIngredients(namePrimary, signal)
  - Shows loading spinner
  - Opens AISuggestIngredientsPreview modal with results

- handleAiSuggestConfirm(selected: ConfirmedSuggestion[])
  - For each item in selected:
    - If matchedIngredient exists → add to selectedIngredients (existing ingredient)
    - If no match → create new Ingredient, add to extraIngredients
  - Clears aiSuggestions
  - Clears ingredients validation error

- triggerAIFill(name, unit): debounced 800ms
  - Calls suggestIngredientInfo(name, unit, signal)
  - Fills qaCal, qaProtein, qaCarbs, qaFat, qaFiber

- handleQuickCreate()
  - Validates qaName.trim() !== ""
  - Creates Ingredient with id=generateId('ing')
  - Adds to extraIngredients
  - Adds to selectedIngredients
  - Resets showQuickAdd and form fields

- handleAddIngredient(ingId): void
  - Pushes {ingredientId: ingId, amount: 100} to selectedIngredients
  - Sets amountStrings[ingId] = "100"

- handleRemoveIngredient(ingId): void
  - Filters out ingredient from selectedIngredients
  - Deletes amountStrings[ingId]

- handleTagToggle(type, isActive): void
  - If isActive: remove from tags
  - If not active: add to tags

**Business Logic (CRITICAL FOR TESTS):**

BILINGUAL NAME HANDLING:
- namePrimary = current language preference only
- editingItem.name has both {vi, en}
- buildDish preserves OTHER language from editingItem
- Example: User has lang=vi, edits dish with {vi: "Cơm", en: "Rice"}
  - User sees namePrimary = "Cơm"
  - User changes to "Cơm tấm"
  - On submit: {vi: "Cơm tấm", en: "Rice"} (vi updated, en preserved)

AI SUGGEST FLOW:
1. User types dish name
2. Clicks sparkle button → calls suggestDishIngredients(namePrimary)
3. LOADING spinner appears
4. Results come back → AISuggestIngredientsPreview modal opens
5. User checks/unchecks items, edits amounts
6. Clicks CONFIRM → handleAiSuggestConfirm processes:
   - For matched ingredients (existing): add existing ingredient ID
   - For new ingredients: create temp Ingredient, add to extraIngredients
7. Modal closes, ingredients appear in selectedIngredients

QUICK-ADD INGREDIENT:
1. User clicks + button next to ingredient search
2. showQuickAdd = true → overlay appears
3. User enters NAME, selects UNIT
4. On blur of name → triggerAIFill called (800ms debounce)
   - Calls suggestIngredientInfo(name, unit)
   - Fills nutrition fields automatically
5. User can manually edit nutrition or submit
6. Clicks SUBMIT (Plus icon + "Thêm"):
   - Validates name not empty
   - Creates Ingredient
   - Adds to selectedIngredients
   - Clears form (resetQuickAdd)
7. On main form SUBMIT:
   - NEW INGREDIENT is included in selectedIngredients
   - On successful onSubmit, extraIngredients flushed to parent

UNSAVED CHANGES FLOW:
1. If user tries to close (handleClose called)
2. If hasChanges() === true:
   - showUnsavedDialog = true
   - Dialog shows 3 buttons:
     a) Save and Back (handleSaveAndBack) → validate, flush extras, submit
     b) Discard (onClose) → no save, clears extraIngredients
     c) Continue Editing (setShowUnsavedDialog=false) → stays in modal

**Edge Cases:**

1. AMOUNT ROUNDING:
   - Input: amountStrings[ingId] = "150.7"
   - On submit: Math.round(Number.parseFloat("150.7")) = 151

2. ZERO & NEGATIVE AMOUNTS:
   - UI allows entering -5 or 0
   - Validation catches on submit
   - Shows per-ingredient error

3. DUPLICATE INGREDIENTS:
   - Picker filters using Set of selected IDs
   - Cannot add same ingredient twice

4. REQUEST CANCELLATION:
   - AI suggest abortable via AbortController
   - Timer cleanup on resetQuickAdd
   - Prevents stale state updates

5. AMOUNT STRINGS SYNC:
   - selectedIngredients has .amount (number)
   - amountStrings has [ingId] (string for UI)
   - Input onChange updates amountStrings
   - On amount change also updates selectedIngredients if valid number

6. FORM ERROR CLEARING:
   - Adding ingredient clears ingredients error
   - Selecting tag clears tags error
   - Changing name clears name error + aiSuggestError


### 3. AISuggestIngredientsPreview.tsx
**Location:** /Users/khanhhuynh/person_project/MealPlaning/src/components/modals/AISuggestIngredientsPreview.tsx

**Props:**
- dishName: string
- suggestions: SuggestedDishIngredient[]
- existingIngredients: Ingredient[]
- onConfirm(selected: ConfirmedSuggestion[]): void
- onClose(): void

**Key Logic:**

FUZZY MATCHING:
```typescript
const fuzzyMatch = (aiName: string, ingredientName: string): boolean => {
  const a = aiName.toLowerCase().trim();
  const b = ingredientName.toLowerCase().trim();
  return a.includes(b) || b.includes(a);
};
```
- Case-insensitive bidirectional substring match
- "Bánh phở" matches "phở", "rice noodles" matches "noodles"

MATCHING ON INIT:
```
For each suggestion:
  matched = existingIngredients.find(ing =>
    fuzzyMatch(s.name, getLocalizedField(ing.name, 'vi')) ||
    fuzzyMatch(s.name, getLocalizedField(ing.name, 'en'))
  )
  item = {
    suggestion: s,
    checked: true,  // ALL selected by default
    amount: String(s.amount),
    matchedIngredient: matched || null
  }
```

BADGES:
- If matchedIngredient !== null: Green "Existing" badge (dish.aiSuggestExisting)
- If matchedIngredient === null: Amber "New" badge (dish.aiSuggestNew)

ON CONFIRM:
```
selected = items
  .filter(item => item.checked)
  .map(item => ({
    suggestion: item.suggestion,
    amount: Math.round(Number.parseFloat(item.amount) || item.suggestion.amount),
    matchedIngredient: item.matchedIngredient
  }))
```
- If amount empty/invalid: uses item.suggestion.amount (AI-provided amount)
- All amounts rounded

BUTTON STATES:
- Confirm button DISABLED if selectedCount === 0
- Confirm button shows count: "Thêm ({selectedCount} mục)"

EMPTY STATE:
- If suggestions.length === 0: minimal modal with just Close button
- Message: "dish.aiSuggestEmpty"


### 4. UnsavedChangesDialog.tsx
**Location:** /Users/khanhhuynh/person_project/MealPlaning/src/components/shared/UnsavedChangesDialog.tsx

**Props:**
- isOpen: boolean
- onSave: () => void
- onDiscard: () => void
- onCancel: () => void

**Usage in DishEditModal:**
```typescript
<UnsavedChangesDialog
  isOpen={showUnsavedDialog}
  onSave={handleSaveAndBack}      // Validates, saves, submits
  onDiscard={onClose}              // Closes without saving
  onCancel={() => setShowUnsavedDialog(false)}  // Stays editing
/>
```

**Buttons:**
1. "Lưu và quay lại" (Green emerald-500) → calls onSave()
2. "Bỏ qua" (Rose text) data-testid="btn-discard-unsaved" → calls onDiscard()
3. "Tiếp tục chỉnh sửa" (Slate) → calls onCancel()

**Features:**
- Amber Save icon in circle
- useModalBackHandler for Android back button
- Dark mode support


### 5. Nutrition Calculation (nutrition.ts)

**Key Functions:**

calculateIngredientNutrition(ingredient: Ingredient, amount: number): NutritionInfo
```typescript
if isWeightOrVolume(unit):
  factor = (amount * getConversionFactor(unit)) / 100
else:
  factor = amount

return {
  calories: ingredient.caloriesPer100 * factor,
  protein: ingredient.proteinPer100 * factor,
  carbs: ingredient.carbsPer100 * factor,
  fat: ingredient.fatPer100 * factor,
  fiber: ingredient.fiberPer100 * factor
}
```

Conversion Factors:
- kg, l → 1000x (1000g = 1kg)
- mg → 0.001x
- g, ml → 1x
- Non-weight/volume (pieces, cups, etc) → amount directly

calculateDishNutrition(dish: Dish, allIngredients: Ingredient[]): NutritionInfo
- Sum nutrition for all dish.ingredients
- Skip if ingredient not found in allIngredients

calculateDishesNutrition(dishIds: string[], allDishes: Dish[], allIngredients: Ingredient[]): NutritionInfo
- Sum nutrition across multiple dishes

toTempIngredient(AnalyzedIngredient): Ingredient
- Convert AI analysis result to Ingredient
- Bridges AnalyzedDishResult.ingredients to Ingredient model


### 6. Delete Dish Logic (isUsed Check)

**Implementation in App.tsx:**
```typescript
const isDishUsed = useCallback((dishId: string) =>
  dayPlans.some(p =>
    p.breakfastDishIds.includes(dishId) ||
    p.lunchDishIds.includes(dishId) ||
    p.dinnerDishIds.includes(dishId)
  ), [dayPlans]
);
```

**Usage in DishManager.tsx:**
```typescript
const handleDelete = (id: string, dname: string) => {
  if (isUsed(id)) {
    notify.warning(t('dish.cannotDelete'), t('dish.usedInPlan'));
    return;  // ← EARLY EXIT, no confirmation modal
  }
  setDeleteConfirmation({ isOpen: true, dishId: id, dishName: dname });
};
```

**Delete Button State:**
```jsx
<button
  aria-disabled={isUsed(dish.id)}
  className={isUsed(dish.id) ? 'text-slate-400 opacity-40' : 'text-slate-500 hover:text-rose-600'}
/>
```

**UX Flow:**
1. Click delete → handleDelete(id, name)
2. If in DayPlan → warning toast "Không thể xóa - Được sử dụng trong kế hoạch", return
3. If not used → confirmation modal "Xóa món ăn? ..."
4. On confirm → onDelete(id)
5. Shows undo toast for 5 seconds with UNDO button


### 7. Dictionary & Translation

**foodDictionary.ts (307 lines):**
- 200+ Vietnamese ↔ English ingredient entries
- Static lookup: O(1) instant translation
- Falls back to ML model (opus-mt) if not found
- Covers: proteins, dairy, grains, vegetables, fruits, seasonings

**translateQueueService.ts:**
- Zustand store managing async translation jobs
- Jobs persisted to localStorage
- Lifecycle: pending → running → done/error
- scanMissing(): enqueues translations for new language
- Prevents duplicate jobs (same itemId + direction + pending/running)


### 8. Search/Filter/Sort

**Search Function:**
```typescript
searchFn = (dish: Dish, query: string) => {
  const ql = query.toLowerCase();
  return Object.values(dish.name).some(n => n.toLowerCase().includes(ql));
};
```
- Case-insensitive substring on both vi/en names

**Filter by Tag:**
```typescript
extraFilter = (dish: Dish) => !filterTag || (dish.tags?.includes(filterTag) ?? false);
```
- filterTag = 'breakfast' | 'lunch' | 'dinner' | null
- null = all dishes

**Sort Options:**
- name-asc/desc: localeCompare (locale-aware string sort)
- cal-asc/desc: by total dish calories
- pro-asc/desc: by total dish protein
- ing-asc/desc: by ingredient count
- Nutrition pre-computed in Map to avoid O(N log N) comparator overhead

---

## TYPES & INTERFACES

```typescript
type LocalizedString = { vi: string; en: string };
type SupportedLang = 'vi' | 'en';
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

type DishIngredient = {
  ingredientId: string;
  amount: number;
};

type Dish = {
  id: string;
  name: LocalizedString;
  ingredients: DishIngredient[];
  tags: MealType[];
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
```

---

## EXISTING TEST COVERAGE

**dishEditModal.test.tsx (1108 lines)** - ~60 test cases
✓ Render tests (create/edit, title, pre-population)
✓ Tag toggle (active/inactive, existing selections)
✓ Validation (name, tags, ingredients, amounts)
✓ Ingredient CRUD (add, remove, update, ± buttons)
✓ Amount edge cases (NaN, negative, empty, zero)
✓ Quick-add ingredient (inline creation, AI fill)
✓ AI suggest flow (button, loading, preview, confirm, error)
✓ Unsaved changes dialog
✓ Double submission prevention

**managers.test.tsx** - 87 total describe+it blocks
✓ DishManager render, search, sort, filter
✓ Delete flow (prevent if used, confirmation, undo)
✓ Detail modal, edit modal
✓ Grid/List view toggle
✓ Empty state

**aiSuggestIngredientsPreview.test.tsx** - ~100 tests
✓ Render with badges (existing/new)
✓ Empty state
✓ Checkbox toggle
✓ Amount editing
✓ Confirm with filtering
✓ Disabled confirm button

---

## CRITICAL TEST GAPS

❌ Bilingual name handling (vi vs en preservation)
❌ Extra ingredients flush on successful save
❌ AI suggest debounce timing (triggerAIFill)
❌ Request abort scenarios (network interruption)
❌ Amount string ↔ number sync
❌ Error clearing on field changes
❌ Picker duplicate filtering
❌ Unit conversion edge cases
❌ Large ingredient lists (1000+ items) performance
❌ Mobile keyboard interactions

---

## TEST WRITING CHECKLIST

When writing tests, verify these aspects:

DISHMANGER:
□ Delete blocked when isUsed=true (warning toast, no modal)
□ Delete allowed when isUsed=false (shows confirmation modal)
□ Undo button works (calls onAdd with deleted dish)
□ Sort/filter combinations work
□ Nutrition pre-calculated (doesn't recalculate per sort)
□ Grid/List view state persists
□ Edit opens modal with populated data

DISHEDITMODAL:
□ Bilingual name handling (current lang only, other preserved)
□ Validation errors appear only when needed
□ Error clearing on field change
□ Unsaved dialog branches (save/discard/cancel)
□ Extra ingredients NOT sent until successful save
□ AI suggest flow (load → preview → confirm)
□ Quick-add ingredient with AI fill debounce
□ Amount strings sync with selectedIngredients
□ Picker filters duplicates
□ Aborts on component unmount

AISUGGESTIONS:
□ Fuzzy matching works (bidirectional)
□ Matched vs New badges correct
□ Amount rounding on confirm
□ Confirm button disabled when nothing selected
□ Empty state handled

NUTRITION:
□ Weight/volume units convert (kg→g, ml→l)
□ Non-weight units use amount directly
□ Missing ingredients skipped (not error)
□ Rounding applied consistently

USAGE CHECK:
□ isUsed checks all 3 DayPlan slots
□ Delete prevents for used dishes
□ Warning shows "usedInPlan" message

