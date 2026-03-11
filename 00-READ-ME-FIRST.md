# MealPlaning - Complete Component Exploration

## 📋 Documentation Files Created

I've created three comprehensive documentation files to guide test writing. Start here:

### 1. **EXPLORATION_SUMMARY.md** ⭐ START HERE
**Quick executive summary of the exploration**
- Overview of all components
- Key features and critical logic
- Test coverage gaps
- Quick checklist for test writing
- File locations reference

### 2. **COMPONENT_EXPLORATION.md** 📖 DETAILED REFERENCE
**Complete in-depth documentation (41 KB)**
- Full component documentation
- All props, state, functions
- Validation rules with examples
- Business logic explanations
- Edge cases handled
- Existing test file analysis

### 3. **TEST_QUICK_REFERENCE.md** 🔍 TEST WRITING GUIDE
**Quick reference while writing tests (37 KB)**
- Validation rules summary (table format)
- Business logic at-a-glance
- Nutrition calculation explained
- Sort/filter/search implementation
- Data-testid lookup table
- Mock setup template
- Type definitions quick view

---

## 🎯 Components Explored

### Core Components
1. **DishManager.tsx** (291 L)
   - Main dish list/grid component
   - Search, filter by tags, sort by name/calories/protein/ingredient-count
   - Grid view (cards) and List view (desktop table + mobile)
   - Delete validation using `isUsed()` hook
   - Undo support on delete

2. **DishEditModal.tsx** (540 L)
   - Create/edit dishes with AI-powered ingredient suggestions
   - Bilingual name handling (vi/en)
   - Meal type tags selection
   - Ingredient picker with fuzzy search
   - Quick-add ingredient inline (with AI nutrition fill)
   - AI suggest dish ingredients (preview modal)
   - Unsaved changes dialog
   - Comprehensive validation

3. **AISuggestIngredientsPreview.tsx** (158 L)
   - Preview AI suggestions with fuzzy matching
   - Badges for existing vs new ingredients
   - Amount editing
   - Confirm with selection filtering

4. **UnsavedChangesDialog.tsx** (57 L)
   - Three-button confirmation (Save/Discard/Continue)
   - Used when closing DishEditModal with changes

### Utilities & Services
5. **nutrition.ts** (101 L)
   - Nutrition calculation with unit conversion
   - Weight/volume vs count-based units
   - Conversion factors (kg/l → 1000x, mg → 0.001x)

6. **foodDictionary.ts** (307 L)
   - Static bilingual ingredient dictionary (200+ entries)
   - Instant lookup fallback for translations

7. **translateQueueService.ts** (174 L)
   - Background translation job queue
   - Persistent to localStorage
   - Zustand store

8. **types.ts**
   - All TypeScript interfaces
   - LocalizedString, Ingredient, Dish, DayPlan, etc.

---

## 🧪 Existing Test Files

| File | Size | Tests | Coverage |
|------|------|-------|----------|
| dishEditModal.test.tsx | 1108 L | ~60 | Comprehensive validation, CRUD, AI flow |
| managers.test.tsx | 150+ L | 87 blocks | Search, sort, filter, delete, views |
| aiSuggestIngredientsPreview.test.tsx | ~100 tests | Badges, selection, empty state |
| saveAnalyzedDishModal.test.tsx | Save flow from AI analysis |
| nutrition.test.ts | Calculation and conversions |
| foodDictionary.test.ts | Dictionary lookup |
| translateQueueService.test.ts | Job queue management |
| +20 more test files | Various components |

---

## ✅ Key Findings Summary

### Validation Rules
```
DishEditModal (validate() function):
  ✗ Name: must not be empty/whitespace
  ✗ Tags: must select at least 1 (breakfast/lunch/dinner)
  ✗ Ingredients: must select at least 1
  ✗ Amount: must not be empty/NaN/negative (per ingredient)
```

### Delete Logic
```
Two-stage validation:
  1. Check isUsed(dishId) → blocks if in DayPlan (warning toast)
  2. If not used → show confirmation modal → onDelete
```

### Critical Business Logic
1. **Bilingual names** - Current language only in UI, other language preserved on edit
2. **Extra ingredients** - Created inline, NOT flushed until successful save
3. **Amount handling** - Strings in UI for mobile friendliness, rounded on submit
4. **AI suggest flow** - Load → Preview → Confirm → Add to selected
5. **Quick-add** - 800ms debounce on AI nutrition fill

### Test Coverage Gaps ❌
- Bilingual name preservation
- Extra ingredients flush timing
- Debounce timing (AI fill 800ms)
- Request abort/cancellation
- Amount string↔number sync
- Picker duplicate filtering
- Unit conversion edge cases
- Mobile keyboard behavior
- Accessibility compliance

---

## 🚀 How to Use These Docs

### For Quick Understanding
1. Read **EXPLORATION_SUMMARY.md** (5 min)
2. Scan **Component Overview** section
3. Check **Test Coverage Status**

### For Writing Tests
1. Open **TEST_QUICK_REFERENCE.md**
2. Use **Validation Rules Summary** for what to test
3. Use **Data-testid Lookup** for element selection
4. Use **Mock Setup Template** for test scaffolding
5. Refer to **COMPONENT_EXPLORATION.md** for edge cases

### For Understanding Components
1. Start with **COMPONENT_EXPLORATION.md**
2. Find relevant component section
3. Review Props, State, Functions, Validation Rules
4. Check Business Logic and Edge Cases sections

---

## 📂 File Organization

```
/Users/khanhhuynh/person_project/MealPlaning/
├── 00-READ-ME-FIRST.md                    ← You are here
├── EXPLORATION_SUMMARY.md                 ← Executive summary
├── COMPONENT_EXPLORATION.md               ← Detailed reference
├── TEST_QUICK_REFERENCE.md                ← Test writing guide
│
├── src/
│   ├── components/
│   │   ├── DishManager.tsx
│   │   ├── modals/
│   │   │   ├── DishEditModal.tsx
│   │   │   ├── AISuggestIngredientsPreview.tsx
│   │   │   └── UnsavedChangesDialog.tsx
│   │   └── shared/
│   ├── utils/
│   │   └── nutrition.ts
│   ├── data/
│   │   └── foodDictionary.ts
│   ├── services/
│   │   └── translateQueueService.ts
│   ├── types.ts
│   └── __tests__/
│       ├── dishEditModal.test.tsx
│       ├── managers.test.tsx
│       ├── aiSuggestIngredientsPreview.test.tsx
│       └── [20+ other tests]
```

---

## 🎓 Key Insights for Test Writing

1. **Always mock** `useNotification` - needed for toast/warning messages
2. **Always mock** `geminiService` - provides AI suggestions
3. **Test bilingual** - Different behavior for vi vs en primary language
4. **Test validation order** - Name → Tags → Ingredients → Amounts
5. **Test request cleanup** - AbortController on unmount
6. **Test unsaved dialog** - Save validates, Discard doesn't
7. **Test ingredient flush** - Only on successful submit
8. **Test isUsed logic** - Checks all 3 DayPlan slots

---

## 📞 Questions?

Refer to the appropriate documentation:

- **"What does DishManager do?"** → EXPLORATION_SUMMARY.md → Component Overview
- **"What are validation rules?"** → TEST_QUICK_REFERENCE.md → Validation Rules
- **"How does bilingual name work?"** → COMPONENT_EXPLORATION.md → DishEditModal → Bilingual Name Handling
- **"What data-testid to use?"** → TEST_QUICK_REFERENCE.md → Data-testid Lookup
- **"How to mock services?"** → TEST_QUICK_REFERENCE.md → Mock Setup Template
- **"What edge cases exist?"** → COMPONENT_EXPLORATION.md → [Component] → Edge Cases Handled

---

**Last Updated:** Today
**Files Analyzed:** 8 components + 7 test files + types definitions
**Documentation Generated:** 3 complete guides (78 KB total)

Start with **EXPLORATION_SUMMARY.md** 👉
