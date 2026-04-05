# Nutrition Tracking Test Scenarios - Context Index

**Status**: ✅ Complete  
**Created**: 2026-03-11  
**Purpose**: Reference for writing SC03 test scenarios

---

## 📂 Documentation Files

### 1. Quick Reference (THIS DIRECTORY)

**File**: `NUTRITION_TESTING_SUMMARY.md`

- **Size**: ~350 lines
- **Time to Read**: 5-10 minutes
- **Best For**: Quick overview, next steps

**Contains**:

- Project overview & component structure
- Core calculation formulas & examples
- Dynamic tips thresholds
- Test distribution by priority
- Edge cases checklist
- Test IDs reference
- Quick next steps

### 2. Complete Technical Reference (docs/04-testing/)

**File**: `NUTRITION_TRACKING_CONTEXT.md`

- **Size**: ~900 lines
- **Time to Read**: 30-45 minutes (or reference as needed)
- **Best For**: In-depth implementation details, calculations

**Contains**:

- Test scenario format & conventions
- All 53 test case summaries
- Type definitions with code snippets
- Utility function signatures
- Component props & test IDs
- Calculation formulas with 6+ examples
- Tips logic algorithm & thresholds
- Edge case handling strategies
- Existing unit test details
- Business rules & constraints

### 3. Existing Scenario Documentation (docs/04-testing/)

**File**: `scenario-analysis-and-testcases.md`

- **Status**: Pre-existing project documentation
- **Scope**: Full 15 scenarios (799 test cases total)
- **SC03 Section**: Pages describing Nutrition Tracking

**Contains**:

- Test format & naming conventions
- Priority definitions (P0, P1, P2, P3)
- Test type classifications
- Component & service definitions
- Business rules
- Improvement suggestions

---

## 🎯 How to Use These Resources

### For Quick Lookup

```
Need to know: Use from NUTRITION_TESTING_SUMMARY.md
├─ What components are involved? → Section 2
├─ How is nutrition calculated? → Section 3
├─ What are the test cases? → Section 4
└─ What test IDs exist? → Section 8
```

### For Writing Test Scenarios

```
1. STRUCTURE: Follow format in scenario-analysis-and-testcases.md
2. CONTENT: Reference NUTRITION_TRACKING_CONTEXT.md sections:
   ├─ Test Cases (Section 6)
   ├─ Types (Section 3)
   ├─ Calculations (Section 5)
   ├─ Tips Logic (Section 7)
   ├─ Components (Section 4)
   └─ Edge Cases (Section 10)
3. EXAMPLES: Use calculation examples from both docs
4. VERIFY: Cross-reference with nutrition.test.ts
5. OUTPUT: Save to docs/04-testing/scenarios/SC03-nutrition-tracking.md
```

### For Understanding Calculations

```
Reference order:
1. NUTRITION_TESTING_SUMMARY.md → Understand formulas (5 min)
2. NUTRITION_TRACKING_CONTEXT.md → See examples (10 min)
3. src/utils/nutrition.ts → Study actual code (5 min)
4. src/__tests__/nutrition.test.ts → Review test fixtures (5 min)
```

### For Understanding Tips Logic

```
Reference order:
1. NUTRITION_TESTING_SUMMARY.md → See thresholds (2 min)
2. NUTRITION_TRACKING_CONTEXT.md → Full algorithm (5 min)
3. src/utils/tips.ts → Study implementation (5 min)
```

---

## 📊 Quick Reference Table

| Topic               | Summary Doc            | Context Doc                   | Source Code              |
| ------------------- | ---------------------- | ----------------------------- | ------------------------ |
| **Calculations**    | 📄 Formulas & examples | ✅ Detailed with 6+ examples  | `src/utils/nutrition.ts` |
| **Types**           | Brief listing          | ✅ Full definitions with code | `src/types.ts`           |
| **Components**      | Props overview         | ✅ Full props & styling       | `src/components/`        |
| **Test IDs**        | ✅ All 13+ IDs         | Full with context             | Components               |
| **Unit Conversion** | Summary table          | ✅ With code constants        | Code                     |
| **Tips Logic**      | Threshold list         | ✅ Full algorithm             | `src/utils/tips.ts`      |
| **Test Cases**      | Distribution           | ✅ All 53 detailed            | Scenario doc             |
| **Edge Cases**      | Checklist              | ✅ Handling strategies        | Both                     |

---

## 🔍 Finding Specific Information

### "How do I calculate nutrition for ingredients?"

→ NUTRITION_TESTING_SUMMARY.md, Section 3 (1 min)
→ NUTRITION_TRACKING_CONTEXT.md, Section 5 (5 min)
→ src/utils/nutrition.ts, function `calculateIngredientNutrition()`

### "What are all the test IDs?"

→ NUTRITION_TESTING_SUMMARY.md, Section 8 (2 min)
→ NUTRITION_TRACKING_CONTEXT.md, Section 9 (2 min)

### "What thresholds trigger nutrition tips?"

→ NUTRITION_TESTING_SUMMARY.md, Section "Dynamic Tips Logic" (1 min)
→ NUTRITION_TRACKING_CONTEXT.md, Section 7 (3 min)
→ src/utils/tips.ts, constants section

### "What are the 53 test cases?"

→ NUTRITION_TRACKING_CONTEXT.md, Section 6 (10 min)
→ scenario-analysis-and-testcases.md, "Scenario 3" section

### "What types/interfaces are used?"

→ NUTRITION_TESTING_SUMMARY.md, Section "Type Definitions" (2 min)
→ NUTRITION_TRACKING_CONTEXT.md, Section 3 (5 min)
→ src/types.ts, lines 1-150

### "What components display nutrition?"

→ NUTRITION_TESTING_SUMMARY.md, Section 1 (2 min)
→ NUTRITION_TRACKING_CONTEXT.md, Section 4 (5 min)

### "What edge cases should I test?"

→ NUTRITION_TESTING_SUMMARY.md, Section "Edge Cases" (3 min)
→ NUTRITION_TRACKING_CONTEXT.md, Section 10 (5 min)

### "How do unit conversions work?"

→ NUTRITION_TESTING_SUMMARY.md, Section 3 (2 min)
→ NUTRITION_TRACKING_CONTEXT.md, Section 5 (5 min)
→ src/utils/nutrition.ts, function `getConversionFactor()`

---

## 📋 Test Case Quick Index

### By TC_NUT ID

- **TC_NUT_01-03**: Basic display (3 tests)
- **TC_NUT_04-08**: Progress bars (5 tests)
- **TC_NUT_09**: Per-meal breakdown (1 test)
- **TC_NUT_10-15**: Edge cases & empty states (6 tests)
- **TC_NUT_16-17**: Updates on changes (2 tests)
- **TC_NUT_18-26**: Edge cases & formatting (9 tests)
- **TC_NUT_27-29**: Calculations & cascades (3 tests)
- **TC_NUT_30-35**: Macros & formatting (6 tests)
- **TC_NUT_36-39**: Boundary conditions (4 tests)
- **TC_NUT_40-42**: UI/UX styling (3 tests)
- **TC_NUT_43-44**: Dynamic tips (2 tests)
- **TC_NUT_45-47**: Plan operations (3 tests)
- **TC_NUT_48-53**: Unit conversions & accessibility (6 tests)

### By Priority

- **P0** (5): TC_NUT_01, 02, 11, 28, (+ 1 more)
- **P1** (30+): Most core functionality tests
- **P2** (10+): Formatting, dark mode, performance
- **P3** (3+): Accessibility, cosmetic

---

## 🛠️ Key Functions & Utilities

### Calculation Functions (src/utils/nutrition.ts)

```
normalizeUnit(unit) → string
calculateIngredientNutrition(ingredient, amount) → NutritionInfo
calculateDishNutrition(dish, allIngredients) → NutritionInfo
calculateDishesNutrition(dishIds, allDishes, allIngredients) → NutritionInfo
toTempIngredient(analyzedIngredient) → Ingredient
```

### Tips Function (src/utils/tips.ts)

```
getDynamicTips(dayNutrition, targetCalories, targetProtein, t) → NutritionTip[]
```

### Components

```
NutritionSubTab (main tab)
Summary (progress display)
MiniNutritionBar (mobile compact)
GoalSettingsModal (user goals)
RecommendationPanel (tips display)
```

---

## 📐 Key Constants & Thresholds

### Unit Conversion Factors

- 1 kg/l = 1000
- 1 g/ml = 1
- 1 mg = 0.001

### Tips Thresholds

- CALORIE_OVER_THRESHOLD = 1.15 (115%)
- CALORIE_UNDER_THRESHOLD = 0.7 (70%)
- PROTEIN_LOW_THRESHOLD = 0.8 (80%)
- MIN_FIBER_GRAMS = 15
- FAT_CALORIE_PERCENT_LIMIT = 40%
- MAX_TIPS_DISPLAYED = 2

### Input Ranges (GoalSettingsModal)

- Weight: 1-500 kg
- Protein Ratio: 1.0-5.0 g/kg (presets: 1, 2, 3, 4)
- Target Calories: 100-10,000 kcal

---

## ✅ Pre-Writing Checklist

Before writing test scenarios for SC03:

- [ ] Read NUTRITION_TESTING_SUMMARY.md (10 min)
- [ ] Skim NUTRITION_TRACKING_CONTEXT.md (5 min)
- [ ] Review scenario-analysis-and-testcases.md format (5 min)
- [ ] List all 53 test case IDs (TC_NUT_01-53)
- [ ] Note component test IDs
- [ ] Study calculation formulas
- [ ] Understand tips thresholds
- [ ] Review edge cases list
- [ ] Cross-reference with nutrition.test.ts

---

## 🎓 Learning Path

### For New Team Members

1. Read: NUTRITION_TESTING_SUMMARY.md (Quick start)
2. Review: Component screenshots/demos
3. Study: Key calculations section
4. Reference: NUTRITION_TRACKING_CONTEXT.md as needed
5. Code review: src/utils/nutrition.ts

### For Test Writers

1. Reference: NUTRITION_TESTING_SUMMARY.md (formats/IDs)
2. Deep dive: NUTRITION_TRACKING_CONTEXT.md (details)
3. Check: scenario-analysis-and-testcases.md (format)
4. Verify: src/**tests**/nutrition.test.ts (examples)
5. Write: docs/04-testing/scenarios/SC03-nutrition-tracking.md

### For Developers

1. Code: src/utils/nutrition.ts (calculations)
2. Code: src/utils/tips.ts (logic)
3. Reference: NUTRITION_TRACKING_CONTEXT.md (types)
4. Code: src/**tests**/nutrition.test.ts (validation)
5. Tests: nutrition.test.ts (coverage)

---

## 📖 File Locations (Absolute Paths)

### Documentation

- `/Users/khanhhuynh/person_project/MealPlaning/NUTRITION_TESTING_SUMMARY.md`
- `/Users/khanhhuynh/person_project/MealPlaning/docs/04-testing/NUTRITION_TRACKING_CONTEXT.md`
- `/Users/khanhhuynh/person_project/MealPlaning/docs/04-testing/scenario-analysis-and-testcases.md`

### Source Code

- `/Users/khanhhuynh/person_project/MealPlaning/src/types.ts`
- `/Users/khanhhuynh/person_project/MealPlaning/src/utils/nutrition.ts`
- `/Users/khanhhuynh/person_project/MealPlaning/src/utils/tips.ts`
- `/Users/khanhhuynh/person_project/MealPlaning/src/components/Summary.tsx`
- `/Users/khanhhuynh/person_project/MealPlaning/src/components/schedule/NutritionSubTab.tsx`
- `/Users/khanhhuynh/person_project/MealPlaning/src/components/schedule/MiniNutritionBar.tsx`
- `/Users/khanhhuynh/person_project/MealPlaning/src/components/modals/GoalSettingsModal.tsx`
- `/Users/khanhhuynh/person_project/MealPlaning/src/__tests__/nutrition.test.ts`

---

## 🚀 Ready to Start?

You have everything needed to write comprehensive SC03 test scenarios!

**Next action**:

1. Open `NUTRITION_TESTING_SUMMARY.md` in your editor
2. Review the component structure (2 min)
3. Review calculation examples (3 min)
4. Open `NUTRITION_TRACKING_CONTEXT.md` for reference
5. Start writing test scenarios in markdown
6. Save to: `docs/04-testing/scenarios/SC03-nutrition-tracking.md`

**Questions?** Reference the "Finding Specific Information" section above!

---

**Context Gathered**: ✅ 100%  
**Documentation Created**: ✅ 2 comprehensive guides  
**Ready to Write Tests**: ✅ YES

Good luck! 🎯
