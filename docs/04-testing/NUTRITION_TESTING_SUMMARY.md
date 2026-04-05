# Nutrition Tracking Test Scenarios - Quick Summary

## 📊 Project Overview

**Goal**: Write comprehensive test scenarios for Nutrition Tracking feature (SC03)  
**Component**: NutritionSubTab + Summary + MiniNutritionBar  
**Test Cases**: 53 (existing documentation found)  
**Status**: ✅ Complete context gathered

---

## 🎯 Key Components

### 1. **NutritionSubTab** (`src/components/schedule/NutritionSubTab.tsx`)

- Main tab for nutrition display on mobile
- Contains: Summary + RecommendationPanel
- Props: dayNutrition, targetCalories, targetProtein, userWeight, onEditGoals

### 2. **Summary** (`src/components/Summary.tsx`)

- Displays 5 macros: Calories, Protein, Carbs, Fat, Fiber
- Progress bars for Calories & Protein
- Edit Goals button
- Test IDs: `btn-edit-goals`, `progress-calories`, `progress-protein`, `summary-total-calories`

### 3. **MiniNutritionBar** (`src/components/schedule/MiniNutritionBar.tsx`)

- Mobile compact view (hidden on desktop)
- Shows Calories & Protein with mini progress bars
- Test IDs: `mini-cal-bar`, `mini-pro-bar`

### 4. **GoalSettingsModal** (`src/components/modals/GoalSettingsModal.tsx`)

- Edit user goals: weight (kg), protein ratio (g/kg), target calories (kcal)
- Protein presets: 1, 2, 3, 4 g/kg
- Test IDs: `input-goal-weight`, `input-goal-protein`, `input-goal-calories`, `btn-preset-{1,2,3,4}`

---

## 📈 Core Calculations

### Nutrition Formula by Unit Type

**Weight/Volume Units** (g, kg, mg, ml, l):

```
factor = (amount × conversionFactor) / 100
nutrition = nutrientPer100 × factor
```

**Countable Units** (quả, miếng, lát):

```
factor = amount (direct)
nutrition = nutrientPer100 × factor
```

**Unit Conversion Factors**:

- 1 kg or 1 l = 1000
- 1 g or 1 ml = 1
- 1 mg = 0.001

### Calculation Examples

| Ingredient             | Amount | Formula          | Result     |
| ---------------------- | ------ | ---------------- | ---------- |
| Chicken (165 cal/100g) | 100g   | 165 × (100/100)  | 165 cal    |
| Chicken                | 200g   | 165 × (200/100)  | 330 cal    |
| Butter (717 cal/100g)  | 1.5 kg | 717 × (1500/100) | 10,755 cal |
| Eggs (155 cal/quả)     | 2 quả  | 155 × 2          | 310 cal    |
| Oil (884 cal/100g)     | 10 ml  | 884 × (10/100)   | 88.4 cal   |

---

## 💡 Dynamic Tips Logic

### Thresholds

- **Calories over**: > 115% of target → ⚠️ Warning
- **Calories under**: < 70% of target (if complete) → ⚠️ Warning
- **Protein met**: ≥ target → 💪 Success
- **Protein low**: < 80% of target (if complete) → 🥩 Warning
- **Fiber low**: < 15g (if complete) → 🥬 Info
- **Fat high**: > 40% of calories → 🫒 Info
- **Missing meals**: Not all 3 meals → 📝 Info
- **All good**: Complete & met targets → ✅ Success

### Max Tips Displayed: 2

---

## 📋 Test Case Summary (SC03)

### Distribution by Priority

| Priority | Count | Examples                           |
| -------- | ----- | ---------------------------------- |
| **P0**   | 5     | Core calculations, cascade updates |
| **P1**   | 30+   | Display, updates, unit conversion  |
| **P2**   | 10+   | Formatting, dark mode, latency     |
| **P3**   | 3+    | Accessibility, cosmetic            |

### Test Categories

1. **Basic Display** (TC_NUT_01-03): Show all 5 macros
2. **Progress Bars** (TC_NUT_04-08): Calories & Protein bars
3. **Per-Meal** (TC_NUT_09): Breakfast/Lunch/Dinner breakdown
4. **Updates** (TC_NUT_11, 16-17, 28): Auto-refresh on changes
5. **Calculations** (TC_NUT_12, 22, 27-28, 48-51): Formulas & conversions
6. **Edge Cases** (TC_NUT_10, 15, 19, 22-26, 29, 36-37): Boundaries & errors
7. **Formatting** (TC_NUT_34-35, 52): Display precision
8. **UI/UX** (TC_NUT_20-21, 40-42): Dark mode, responsive, mobile
9. **Tips & Goals** (TC_NUT_43-44): Dynamic recommendations
10. **Cascade** (TC_NUT_45-47): Plan operations effects

---

## 🔧 Utility Functions

### `src/utils/nutrition.ts`

```typescript
normalizeUnit(unit: string) → string
calculateIngredientNutrition(ingredient, amount) → NutritionInfo
calculateDishNutrition(dish, allIngredients) → NutritionInfo
calculateDishesNutrition(dishIds, allDishes, allIngredients) → NutritionInfo
toTempIngredient(analyzedIngredient) → Ingredient
```

### `src/utils/tips.ts`

```typescript
getDynamicTips(dayNutrition, targetCalories, targetProtein, t) → NutritionTip[]
```

---

## 📦 Type Definitions (src/types.ts)

```typescript
// Core
type Ingredient = { id, name, caloriesPer100, proteinPer100, ... }
type Dish = { id, name, ingredients[], tags[] }
type DayPlan = { date, breakfastDishIds[], lunchDishIds[], dinnerDishIds[] }
type UserProfile = { weight, proteinRatio, targetCalories }

// Nutrition
type NutritionInfo = { calories, protein, carbs, fat, fiber }
type SlotInfo = { dishIds[] } & NutritionInfo
type DayNutritionSummary = { breakfast: SlotInfo, lunch, dinner }

// AI
type AnalyzedIngredient = { name, amount, unit, nutritionPerStandardUnit }
```

---

## ⚠️ Edge Cases & Validation

### Must Test

- [ ] Zero/negative amounts → handled gracefully
- [ ] Missing ingredients/dishes in DB → skipped, no crash
- [ ] Target = 0 → no division error
- [ ] Floating point precision (0.1 + 0.2) → rounded correctly
- [ ] Very large values (>10,000 kcal) → formatted properly
- [ ] DST transitions → plan preserved
- [ ] Leap year dates → handled correctly
- [ ] Concurrent updates → state consistent
- [ ] Custom units (quả, lát) → multiplied, not divided
- [ ] 100+ ingredients → render < 500ms
- [ ] 1000+ dishes → virtual scroll performance

---

## 🧪 Existing Unit Tests

**File**: `src/__tests__/nutrition.test.ts`  
**Coverage**: 5 test suites, 28 tests total

- normalizeUnit: 8 tests
- calculateIngredientNutrition: 10 tests
- calculateDishNutrition: 4 tests
- calculateDishesNutrition: 4 tests
- toTempIngredient: 5 tests

**Key Fixtures**: Chicken, Rice, Egg, Oil, Butter, VitaminC

---

## 🎨 Test IDs Reference

### Main Components

- `nutrition-subtab` - Main NutritionSubTab
- `mini-nutrition-bar` - Compact mobile bar
- `btn-edit-goals` - Edit goals button
- `btn-switch-to-meals` - Switch to meals tab

### Progress Bars

- `progress-calories` - Calories progress
- `progress-protein` - Protein progress
- `mini-cal-bar` - Mini calories bar
- `mini-pro-bar` - Mini protein bar

### Input Fields

- `input-goal-weight` - Weight input
- `input-goal-protein` - Protein ratio input
- `input-goal-calories` - Calories input
- `btn-preset-1`, `btn-preset-2`, `btn-preset-3`, `btn-preset-4` - Protein presets

---

## 📖 Documentation Files

### Files Created/Referenced

1. **NUTRITION_TRACKING_CONTEXT.md** (this project)
   - Complete 800+ line reference guide
   - All interfaces, functions, calculations
   - All 53 test case details

2. **scenario-analysis-and-testcases.md** (existing)
   - Full SC03 section with 53 TCs
   - Business rules & components
   - Improvement suggestions

### File Paths

- Types: `src/types.ts` (lines 1-150)
- Nutrition utils: `src/utils/nutrition.ts` (101 lines)
- Tips logic: `src/utils/tips.ts` (140 lines)
- Components: `src/components/Summary.tsx` (116 lines)
- `src/components/schedule/NutritionSubTab.tsx` (125 lines)
- `src/components/schedule/MiniNutritionBar.tsx` (74 lines)
- Goals modal: `src/components/modals/GoalSettingsModal.tsx` (125 lines)
- Tests: `src/__tests__/nutrition.test.ts` (318 lines)

---

## ✅ What's Included in Context Guide

- [x] All 53 test case IDs (TC_NUT_01 through TC_NUT_53)
- [x] Priority & type classification
- [x] Component props & test IDs
- [x] Calculation formulas with examples
- [x] Edge case handling strategies
- [x] UI styling (colors, dark mode, responsive)
- [x] Type definitions (all 15+ types)
- [x] Utility function signatures
- [x] Tips logic thresholds & algorithm
- [x] Unit conversion factors & formulas
- [x] Existing unit test details
- [x] Test naming conventions & format

---

## 🚀 Next Steps for Writing Test Scenarios

1. **Reference**: Open `NUTRITION_TRACKING_CONTEXT.md` in editor
2. **Format**: Follow markdown structure from `scenario-analysis-and-testcases.md`
3. **Template**: Use TC_NUT format with Standard template
4. **Test IDs**: Use IDs listed in Reference section
5. **Calculations**: Verify against examples in context guide
6. **Edge Cases**: Test all items in edge case table
7. **Fixtures**: Reference ingredient fixtures in nutrition.test.ts
8. **Integration**: Cross-reference with other scenarios (Calendar, Meal Planner)

---

**Total Context Gathered**: ✅ 100%  
**Files Analyzed**: 11 source + 2 doc files  
**Test Cases Found**: 53 (documented)  
**Code Examples**: 40+  
**Formulas & Thresholds**: 15+

**Ready to write SC03 test scenarios!** 🎯
