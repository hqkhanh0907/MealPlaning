# Nutrition Tracking Test Scenarios - Comprehensive Context Guide
**MealPlaning Project**  
**Date**: 2026-03-11  
**Status**: Complete Context Gathered

---

## Table of Contents
1. [Existing Test Scenario Structure](#existing-test-scenario-structure)
2. [Nutrition Tracking Scenario (SC03)](#nutrition-tracking-scenario-sc03)
3. [Core Nutrition Types & Interfaces](#core-nutrition-types--interfaces)
4. [Nutrition Utilities](#nutrition-utilities)
5. [UI Components for Nutrition Tracking](#ui-components-for-nutrition-tracking)
6. [User Profile & Goals](#user-profile--goals)
7. [Nutrition Tips Logic](#nutrition-tips-logic)
8. [Existing Unit Tests](#existing-unit-tests)
9. [Test Conventions & Format](#test-conventions--format)
10. [Key Calculations & Edge Cases](#key-calculations--edge-cases)

---

## Existing Test Scenario Structure

### Location
- **Directory**: `/Users/khanhhuynh/person_project/MealPlaning/docs/04-testing/`
- **Main File**: `scenario-analysis-and-testcases.md` (comprehensive Vietnamese documentation)
- **Scenarios Directory**: `/docs/04-testing/scenarios/` (currently empty - awaiting SC03 documentation)

### Format & Conventions

#### Test Case ID Convention
- Format: `TC_{SCENARIO}_{NUMBER}`
- Example: `TC_CAL_01`, `TC_NUT_01`, `TC_MPM_01`

#### Priority Levels
| Priority | Meaning | Impact |
|----------|---------|--------|
| **P0** | Critical | Causes crash or data loss |
| **P1** | High | Core functionality broken |
| **P2** | Medium | Secondary feature broken |
| **P3** | Low | Cosmetic/Minor issue |

#### Test Case Types
- **Positive**: Happy path scenarios
- **Negative**: Error handling, edge cases
- **Edge**: Boundary conditions, special cases
- **Boundary**: Limit testing

#### Test Case Structure
```markdown
##### TC_XXX_NN: Test Title
- **Pre-conditions**: Initial state required
- **Steps**: Numbered action sequence
- **Expected Result**: Desired outcome
- **Priority**: P0-P3 | **Type**: Positive/Negative/Edge/Boundary
```

---

## Nutrition Tracking Scenario (SC03)

### Overview
Displays total daily nutrition (calories, protein, carbs, fat, fiber) compared to personal targets. Progress bars show percentage achievement. Per-meal breakdown supported. Calculations based on: `ingredientPer100/100 × amount` for each ingredient, aggregated by meal and day.

### Components & Services
| Component | File | Role |
|-----------|------|------|
| **NutritionSubTab** | `src/components/schedule/NutritionSubTab.tsx` | Daily nutrition totals display |
| **MiniNutritionBar** | `src/components/schedule/MiniNutritionBar.tsx` | Compact progress bar mini-display |
| **Summary** | `src/components/Summary.tsx` | Detailed nutrition summary with progress bars |
| **RecommendationPanel** | `src/components/schedule/NutritionSubTab.tsx` | Dynamic tips & recommendations |

### Business Rules
1. Calculations use normalized units (g, kg, mg, ml, l, or custom countable units)
2. Weight/volume conversion factor: 1 kg/l = 1000g, 1 mg = 0.001g
3. Countable units (quả, miếng): amount used directly as multiplier
4. Progress bars cap visually at 100% (values beyond still counted)
5. Target protein = weight × proteinRatio (e.g., 70kg × 2.0 = 140g)
6. Dynamic tips generated based on totals vs targets (max 2 tips displayed)
7. Floating point precision handled with Math.round() or toFixed()

### Existing Test Cases (53 TCs)

| TC ID | Title | Type | Priority |
|-------|-------|------|----------|
| TC_NUT_01 | Display daily total calories | Positive | P0 |
| TC_NUT_02 | Display daily total protein | Positive | P0 |
| TC_NUT_03 | Display carbs/fat/fiber | Positive | P1 |
| TC_NUT_04 | Progress bar - calories below target | Positive | P1 |
| TC_NUT_05 | Progress bar - calories meet target | Positive | P1 |
| TC_NUT_06 | Progress bar - calories exceed target | Positive | P1 |
| TC_NUT_07 | Progress bar - protein below target | Positive | P1 |
| TC_NUT_08 | Progress bar - protein meet target | Positive | P1 |
| TC_NUT_09 | Per-meal breakdown (breakfast/lunch/dinner) | Positive | P1 |
| TC_NUT_10 | Total nutrition = 0 when no plan exists | Edge | P1 |
| TC_NUT_11 | Auto-update nutrition when plan changes | Positive | P1 |
| TC_NUT_12 | Target protein calculation: weight × ratio | Positive | P1 |
| TC_NUT_13 | Edit Goals button opens GoalSettingsModal | Positive | P1 |
| TC_NUT_14 | Progress bar maxes at 100% visually | Boundary | P2 |
| TC_NUT_15 | Display correct with only 1 meal | Edge | P2 |
| TC_NUT_16 | Update nutrition when ingredient edited | Positive | P1 |
| TC_NUT_17 | Update nutrition when dish amount edited | Positive | P1 |
| TC_NUT_18 | Very large calorie values (>10,000) | Boundary | P3 |
| TC_NUT_19 | All macros = 0 (dish with no ingredients) | Edge | P2 |
| TC_NUT_20 | Dark mode styling correct | Positive | P3 |
| TC_NUT_21 | Switch to Meals tab button (mobile) | Positive | P2 |
| TC_NUT_22 | Floating point precision: 0.1+0.2 handled | Edge | P1 |
| TC_NUT_23 | Negative calories → clamp to 0 | Negative | P2 |
| TC_NUT_24 | Ingredient with amount=0 → not summed | Edge | P2 |
| TC_NUT_25 | Progress bar exactly 100% → "Goal met" display | Boundary | P2 |
| TC_NUT_26 | Progress bar 200% → cap visual, show "Exceeds 100%" | Boundary | P2 |
| TC_NUT_27 | Complex calculation: 5 ingredients × 3 meals | Positive | P1 |
| TC_NUT_28 | Cascade update: edit ingredient → dish → plan | Positive | P0 |
| TC_NUT_29 | Nutrition with deleted dish (orphan ID in plan) | Edge | P1 |
| TC_NUT_30 | Display all 5 macros: cal, pro, carb, fat, fiber | Positive | P1 |
| TC_NUT_31 | Fiber tracking - correct unit (g) | Positive | P2 |
| TC_NUT_32 | Carbs + Fat + Protein total matches calorie estimate | Edge | P3 |
| TC_NUT_33 | Dish with no ingredients → nutrition = 0 | Edge | P2 |
| TC_NUT_34 | Format: 1 decimal place (e.g., 156.3 kcal) | Positive | P2 |
| TC_NUT_35 | Format: thousand separator (1,234 kcal) | Boundary | P3 |
| TC_NUT_36 | Target calories = 0 → progress graceful handling | Boundary | P2 |
| TC_NUT_37 | Target protein = 0 → no division error | Boundary | P2 |
| TC_NUT_38 | Weight=200kg, ratio=5.0 → target protein=1000g | Boundary | P3 |
| TC_NUT_39 | Nutrition update latency < 100ms | Positive | P2 |
| TC_NUT_40 | Dark mode: bars, labels, numbers readable | Positive | P2 |
| TC_NUT_41 | Mobile layout: full width, stacked vertically | Positive | P2 |
| TC_NUT_42 | Desktop layout: panel right, compact | Positive | P2 |
| TC_NUT_43 | Dynamic tips based on intake vs goals | Positive | P2 |
| TC_NUT_44 | Tips update when nutrition changes | Positive | P2 |
| TC_NUT_45 | Nutrition after clear plan → all = 0 | Positive | P1 |
| TC_NUT_46 | Nutrition after copy plan → matches source | Positive | P1 |
| TC_NUT_47 | Nutrition after template apply → calculated correct | Positive | P1 |
| TC_NUT_48 | Unit conversion: kg → nutrition calculated | Positive | P1 |
| TC_NUT_49 | Unit conversion: ml → nutrition per 100ml | Positive | P1 |
| TC_NUT_50 | Custom unit (quả, lát) → per-100 nutrition | Positive | P2 |
| TC_NUT_51 | Multiple dishes same ingredient → nutrition sums | Positive | P1 |
| TC_NUT_52 | Rounding: 1/3×100=33.33... → displays 33.3 | Edge | P3 |
| TC_NUT_53 | Nutrition panel accessible: aria-labels | Positive | P3 |

---

## Core Nutrition Types & Interfaces

### File: `src/types.ts`

```typescript
// Basic ingredient definition
export type Ingredient = {
  id: string;
  name: LocalizedString;  // { vi: '...', en: '...' }
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  fiberPer100: number;
  unit: LocalizedString;  // e.g., { vi: 'g', en: 'g' }
};

// Ingredient in a dish (with amount)
export type DishIngredient = {
  ingredientId: string;
  amount: number;  // in 'unit'
};

// Dish definition
export type Dish = {
  id: string;
  name: LocalizedString;
  ingredients: DishIngredient[];
  tags: MealType[];  // ['breakfast', 'lunch', 'dinner']
};

// Daily meal plan
export type DayPlan = {
  date: string;  // YYYY-MM-DD
  breakfastDishIds: string[];
  lunchDishIds: string[];
  dinnerDishIds: string[];
};

// User profile with nutrition targets
export type UserProfile = {
  weight: number;        // in kg
  proteinRatio: number;  // grams per kg (e.g., 2.0)
  targetCalories: number; // daily target in kcal
};

// Nutrition values
export type NutritionInfo = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

// Per-meal nutrition with dish IDs
export type SlotInfo = {
  dishIds: string[];
} & NutritionInfo;

// Daily summary: breakfast, lunch, dinner
export type DayNutritionSummary = {
  breakfast: SlotInfo;
  lunch: SlotInfo;
  dinner: SlotInfo;
};

// AI analysis types
export type AnalyzedNutritionPerUnit = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type AnalyzedIngredient = {
  name: string;
  amount: number;
  unit: string;
  nutritionPerStandardUnit: AnalyzedNutritionPerUnit;
};

export type AnalyzedDishResult = {
  isFood: boolean;
  notFoodReason?: string;
  name: string;
  description: string;
  totalNutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  ingredients: AnalyzedIngredient[];
};

export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type LocalizedString = Record<'vi' | 'en', string>;
export type SupportedLang = 'vi' | 'en';
```

---

## Nutrition Utilities

### File: `src/utils/nutrition.ts`

#### Key Constants
```typescript
const ZERO_NUTRITION: NutritionInfo = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

const UNIT_ALIASES: Record<string, string> = {
  g: 'g', gram: 'g', grams: 'g', gam: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  mg: 'mg', milligram: 'mg', milligrams: 'mg',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml',
  l: 'l', liter: 'l', liters: 'l',
};
```

#### Key Functions

##### 1. normalizeUnit(rawUnit: string): string
- Converts unit aliases to canonical forms
- Case-insensitive
- Trims whitespace
- Returns unknown units as lowercase
- **Examples**: "gram" → "g", "ML" → "ml", "quả" → "quả"

##### 2. calculateIngredientNutrition(ingredient: Ingredient, amount: number): NutritionInfo
- Calculates nutrition for given amount of ingredient
- **Formula for weight/volume units** (g, kg, mg, ml, l):
  ```
  factor = (amount × conversionFactor(unit)) / 100
  nutrition = ingredientPer100 × factor
  ```
- **Formula for countable units** (quả, miếng, lát):
  ```
  factor = amount
  nutrition = ingredientPer100 × factor
  ```
- **Conversion factors**:
  - 1 kg or 1 l = 1000
  - 1 g or 1 ml = 1
  - 1 mg = 0.001
- **Returns**: NutritionInfo object with all 5 macros

##### 3. calculateDishNutrition(dish: Dish, allIngredients: Ingredient[]): NutritionInfo
- Sums nutrition across all ingredients in dish
- Skips ingredients not found in allIngredients
- **Returns**: NutritionInfo object

##### 4. calculateDishesNutrition(dishIds: string[], allDishes: Dish[], allIngredients: Ingredient[]): NutritionInfo
- Aggregates nutrition for multiple dishes
- Handles duplicate dish IDs (counts multiple times)
- Skips unknown dishIds
- **Returns**: NutritionInfo object

##### 5. toTempIngredient(ing: AnalyzedIngredient): Ingredient
- Bridges AI analysis output to Ingredient model
- Normalizes unit via `normalizeUnit()`
- Creates localized name (copies to both vi/en)
- Empty ID placeholder
- Used for temporary AI-provided ingredients before saving

---

## UI Components for Nutrition Tracking

### 1. Summary Component
**File**: `src/components/Summary.tsx`

**Props Interface**:
```typescript
interface SummaryProps {
  dayNutrition: DayNutritionSummary;
  targetCalories: number;
  targetProtein: number;
  onEditGoals?: () => void;
}
```

**Display Elements**:
- Header with Activity icon, title, goal label
- 2 large progress bars (Calories & Protein)
- 3 info cards (Carbs, Fat, Fiber)
- Edit Goals button (optional)

**Styling**:
- Mobile: `sm:` breakpoints for responsive sizing
- Dark mode: `dark:` variants for all elements
- Progress bars: Orange for under-target, Red for over-target
- Colors:
  - Calories: Orange-500 / Orange-50 (dark: Orange-900/20)
  - Protein: Blue-500 / Blue-50 (dark: Blue-900/20)
  - Carbs: Amber-50/Amber-900/20 (dark)
  - Fat: Rose-50/Rose-900/20 (dark)
  - Fiber: Emerald-50/Emerald-900/20 (dark)

**Key Test IDs**:
- `btn-edit-goals`: Edit goals button
- `summary-total-calories`: Total calories display
- `progress-calories`: Calories progress element
- `progress-protein`: Protein progress element

---

### 2. NutritionSubTab Component
**File**: `src/components/schedule/NutritionSubTab.tsx`

**Props Interface**:
```typescript
interface NutritionSubTabProps {
  dayNutrition: DayNutritionSummary;
  targetCalories: number;
  targetProtein: number;
  userWeight: number;
  onEditGoals: () => void;
  onSwitchToMeals?: () => void;
}
```

**Children Components**:
- `Summary`: Shows progress bars & macro cards
- `RecommendationPanel`: Shows dynamic tips & quick actions

**Key Test ID**: `nutrition-subtab`

---

### 3. MiniNutritionBar Component
**File**: `src/components/schedule/MiniNutritionBar.tsx`

**Props Interface**:
```typescript
export interface MiniNutritionBarProps {
  dayNutrition: DayNutritionSummary;
  targetCalories: number;
  targetProtein: number;
  onSwitchToNutrition: () => void;
}
```

**Display**:
- 2-column grid: Calories (left) | Protein (right)
- Each shows: icon, current/target, progress bar
- Responsive: Hidden on desktop (lg:hidden)
- Colors:
  - Calories: Orange-400 bar, Flame icon
  - Protein: Blue-400 bar, Beef icon

**Calculations**:
```typescript
totalCal = Math.round(breakfast.cal + lunch.cal + dinner.cal)
totalPro = Math.round(breakfast.pro + lunch.pro + dinner.pro)
calPct = Math.min(100, Math.round((totalCal / targetCal) * 100))
proPct = Math.min(100, Math.round((totalPro / targetPro) * 100))
```

**Key Test IDs**:
- `mini-nutrition-bar`: Main button
- `mini-cal-bar`: Calories progress bar
- `mini-pro-bar`: Protein progress bar

---

### 4. RecommendationPanel (Inside NutritionSubTab)
**Displays**:
- Current goals (weight, calories, target protein)
- Dynamic tips (up to 2, from `getDynamicTips`)
- Status indicators (✅ Complete, ⚠️ Missing meals)
- "Switch to Meals" button (if no plan exists)

**Tip Styling by Type**:
- `success`: Emerald background, CheckCircle2 icon (if tips complete)
- `warning`: Amber background, AlertCircle icon
- `info`: Blue background, Info icon

---

## User Profile & Goals

### GoalSettingsModal Component
**File**: `src/components/modals/GoalSettingsModal.tsx`

**Props Interface**:
```typescript
interface GoalSettingsModalProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onClose: () => void;
}
```

**Input Fields**:
1. **Weight** (kg)
   - Range: 1-500
   - Step: 1
   - Min/Max validation
   - Test ID: `input-goal-weight`

2. **Protein Ratio** (g/kg)
   - Range: 1.0-5.0
   - Step: 0.1
   - Decimal input
   - Preset buttons: 1g, 2g, 3g, 4g
   - Test IDs: `input-goal-protein`, `btn-preset-{1,2,3,4}`

3. **Target Calories** (kcal)
   - Range: 100-10,000
   - Step: 1
   - Integer input
   - Test ID: `input-goal-calories`

**Display Badge**:
- Shows calculated daily protein: `weight × proteinRatio`
- Example: 70kg × 2.0 = 140g

**Features**:
- String state for inputs (allows clearing without snap-back)
- onBlur validation (reverts invalid input)
- Auto-save on valid change
- Done button to close

---

## Nutrition Tips Logic

### File: `src/utils/tips.ts`

#### Constants
```typescript
const CALORIE_OVER_THRESHOLD = 1.15;        // 115% of target
const CALORIE_UNDER_THRESHOLD = 0.7;         // 70% of target
const PROTEIN_LOW_THRESHOLD = 0.8;           // 80% of target
const MIN_FIBER_GRAMS = 15;                  // Minimum fiber (g)
const FAT_CALORIE_PERCENT_LIMIT = 40;        // % of calories from fat
const MAX_TIPS_DISPLAYED = 2;
```

#### Types
```typescript
export interface NutritionTip {
  emoji: string;        // Visual indicator
  text: string;         // i18n translated message
  type: 'success' | 'warning' | 'info';
}

interface NutritionTotals {
  calories: number;
  protein: number;
  fiber: number;
  fat: number;
}

interface MealStatus {
  hasBreakfast: boolean;
  hasLunch: boolean;
  hasDinner: boolean;
  isComplete: boolean;  // Has all 3 meals
  hasAnyPlan: boolean;
}
```

#### Main Function: getDynamicTips()
```typescript
export const getDynamicTips = (
  dayNutrition: DayNutritionSummary,
  targetCalories: number,
  targetProtein: number,
  t: TFunction,
): NutritionTip[]
```

**Logic Flow**:
1. If no plan: return `[{ emoji: '📋', text: 'noPlan', type: 'info' }]`
2. Check 4 tip generators:
   - **getCalorieTip**: Over 115% or (Complete & Under 70%) → warning
   - **getProteinTip**: Met (≥target) → success; Complete & Under 80% → warning
   - **getFiberTip**: Complete & Under 15g → info
   - **getFatTip**: Fat calories > 40% of total → info
3. Check missing meals (breakfast/lunch/dinner)
4. If Complete & no other tips: add success "✅ Balanced"
5. Limit to 2 tips max

---

## Existing Unit Tests

### File: `src/__tests__/nutrition.test.ts`

**Test Fixtures** (Sample Ingredients):
```typescript
const chicken = {
  id: 'ing-1', name: { vi: 'Ức gà', en: 'Ức gà' }, unit: { vi: 'g', en: 'g' },
  caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, fiberPer100: 0,
};

const rice = {
  id: 'ing-2', name: { vi: 'Cơm trắng', en: 'Cơm trắng' }, unit: { vi: 'g', en: 'g' },
  caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, fiberPer100: 0.4,
};

const egg = {
  id: 'ing-3', name: { vi: 'Trứng gà', en: 'Trứng gà' }, unit: { vi: 'quả', en: 'quả' },
  caloriesPer100: 155, proteinPer100: 13, carbsPer100: 1.1, fatPer100: 11, fiberPer100: 0,
};

const oil = {
  id: 'ing-4', name: { vi: 'Dầu ăn', en: 'Dầu ăn' }, unit: { vi: 'ml', en: 'ml' },
  caloriesPer100: 884, proteinPer100: 0, carbsPer100: 0, fatPer100: 100, fiberPer100: 0,
};

const butter = {
  id: 'ing-5', name: { vi: 'Bơ', en: 'Bơ' }, unit: { vi: 'kg', en: 'kg' },
  caloriesPer100: 717, proteinPer100: 0.85, carbsPer100: 0.06, fatPer100: 81, fiberPer100: 0,
};

const vitaminC = {
  id: 'ing-6', name: { vi: 'Vitamin C', en: 'Vitamin C' }, unit: { vi: 'mg', en: 'mg' },
  caloriesPer100: 0, proteinPer100: 0, carbsPer100: 0, fatPer100: 0, fiberPer100: 0,
};
```

**Test Suites**:

1. **normalizeUnit** (8 tests)
   - Common weight units (g, gram, grams, gam)
   - kg, mg volume (ml, l)
   - Unknown units (quả, miếng, muỗng)
   - Whitespace trimming
   - Case insensitivity

2. **calculateIngredientNutrition** (10 tests)
   - Weight-based: 100g, 200g, 50g, 0g
   - ml unit (oil)
   - kg unit (butter: 0.1 kg = 100g)
   - mg unit (vitaminC: 500mg)
   - Countable unit (egg: 2 quả, 1 quả)
   - Backward compatibility (plain string unit)

3. **calculateDishNutrition** (4 tests)
   - Multi-ingredient sum (chicken 150g + rice 200g)
   - Empty ingredients
   - Unknown ingredients (skipped)
   - Mixed known/unknown

4. **calculateDishesNutrition** (4 tests)
   - Multiple dishes (dish1 + dish2)
   - Empty dish IDs
   - Unknown dish IDs (skipped)
   - Duplicate dish IDs (counted twice)

5. **toTempIngredient** (5 tests)
   - AnalyzedIngredient → Ingredient mapping
   - Unit normalization in conversion
   - Nutrition field mapping
   - Non-standard units (quả)
   - Integration with calculateIngredientNutrition

---

## Test Conventions & Format

### File Naming
- Scenario docs: `SC03-nutrition-tracking.md` (if following existing pattern)
- Test files: `**/__tests__/*.test.ts` or `**/*.spec.ts`

### Test Case ID Format for SC03
```
TC_NUT_{NUMBER}
TC_NUT_01 - TC_NUT_53
```

### Markdown Structure
```markdown
### Test Cases (N TCs)

#### Summary Table
| TC ID | Title | Type | Priority |
|-------|-------|------|----------|
| TC_NUT_01 | ... | Positive | P0 |

#### Detailed Test Cases

##### TC_NUT_01: Test Title
- **Pre-conditions**: ...
- **Steps**: 1. 2. 3.
- **Expected Result**: ...
- **Priority**: P0 | **Type**: Positive
```

### Component Test IDs (from existing code)
- `nutrition-subtab`: Main NutritionSubTab component
- `btn-edit-goals`: Edit goals button in Summary
- `summary-total-calories`: Total calories display
- `progress-calories`: Calories progress bar
- `progress-protein`: Protein progress bar
- `mini-nutrition-bar`: MiniNutritionBar button
- `mini-cal-bar`: Mini calories bar
- `mini-pro-bar`: Mini protein bar
- `btn-switch-to-meals`: Switch to Meals button (in NutritionSubTab)

---

## Key Calculations & Edge Cases

### Calculation Examples

#### Example 1: Simple Ingredient (100g chicken)
```
Chicken: 165 cal/100g, 31g protein/100g, amount = 100g
Factor = (100 × 1) / 100 = 1
Result: 165 cal, 31g protein
```

#### Example 2: Scaled Weight (200g chicken)
```
Amount = 200g
Factor = (200 × 1) / 100 = 2
Result: 330 cal, 62g protein
```

#### Example 3: Unit Conversion (1.5 kg butter)
```
Butter: 717 cal/100g, amount = 1.5, unit = kg
ConversionFactor(kg) = 1000
Factor = (1.5 × 1000) / 100 = 15
Result: 10,755 cal, 12.75g protein
```

#### Example 4: Countable Unit (2 eggs)
```
Egg: 155 cal/quả, 13g protein/quả, amount = 2, unit = quả
Factor = 2 (direct use, not weight-based)
Result: 310 cal, 26g protein
```

#### Example 5: Complex Dish (Cơm gà)
```
Dish: Chicken 150g + Rice 200g
Chicken: 165 cal/100g, 31g protein/100g
Rice: 130 cal/100g, 2.7g protein/100g

Chicken nutrition: (150/100) × 165 = 247.5 cal, (150/100) × 31 = 46.5g protein
Rice nutrition: (200/100) × 130 = 260 cal, (200/100) × 2.7 = 5.4g protein
Total: 507.5 cal, 51.9g protein
```

#### Example 6: Floating Point Precision
```
Ingredient A: 0.1 cal/100g, amount 100g = 0.1 cal
Ingredient B: 0.2 cal/100g, amount 100g = 0.2 cal
Sum: 0.1 + 0.2 = 0.30000000000000004 (JavaScript quirk)
Solution: Use Math.round() or toFixed() for display
```

### Edge Cases to Test

| Edge Case | Handling |
|-----------|----------|
| **Zero amount** | Result is 0, not included in sum |
| **Negative calories** | Clamp to 0 or validate at input |
| **Target calories = 0** | Avoid Infinity %, display "Not set" |
| **Target protein = 0** | Avoid division by zero |
| **Missing ingredient in DB** | Skip in calculation, don't crash |
| **Orphan dish ID in plan** | Skip dish, no error |
| **100+ ingredients in dish** | Render performance < 500ms |
| **1000+ dishes in library** | Virtual scroll, no lag |
| **Very large values (>10,000 kcal)** | Handle display formatting |
| **Floating point math (0.1+0.2)** | Round to 1 decimal for display |
| **DST transitions** | Date handling, plan not lost |
| **Leap year (Feb 29)** | Date parsing works correctly |
| **Custom units (quả, lát, miếng)** | Direct multiplication, not division |
| **Mixed language ingredients** | Display localizedName correctly |

---

## Document Index

### Primary Files
1. **`src/types.ts`** - All type definitions
2. **`src/utils/nutrition.ts`** - Core calculation logic
3. **`src/utils/tips.ts`** - Dynamic nutrition tips
4. **`src/components/Summary.tsx`** - Main display component
5. **`src/components/schedule/NutritionSubTab.tsx`** - Tab container
6. **`src/components/schedule/MiniNutritionBar.tsx`** - Compact display
7. **`src/components/modals/GoalSettingsModal.tsx`** - User goals
8. **`src/__tests__/nutrition.test.ts`** - Unit tests
9. **`docs/04-testing/scenario-analysis-and-testcases.md`** - Scenario docs

### Test IDs Reference
- Main components: `nutrition-subtab`, `mini-nutrition-bar`
- Buttons: `btn-edit-goals`, `btn-switch-to-meals`
- Progress: `progress-calories`, `progress-protein`
- Inputs: `input-goal-weight`, `input-goal-protein`, `input-goal-calories`
- Presets: `btn-preset-1`, `btn-preset-2`, `btn-preset-3`, `btn-preset-4`

---

## Quick Reference: SC03 Test Scenario Checklist

- [ ] 53 total test cases
- [ ] Test ID format: `TC_NUT_NN` (01-53)
- [ ] 5 P0 tests (critical)
- [ ] 30+ P1 tests (high priority)
- [ ] 10+ P2 tests (medium)
- [ ] 3+ P3 tests (low/cosmetic)
- [ ] Cover all 5 macros: calories, protein, carbs, fat, fiber
- [ ] Cover unit conversions: g, kg, mg, ml, l, custom
- [ ] Cover edge cases: zero, negative, overflow, precision
- [ ] Cover calculations: single ingredient, multi-ingredient, multi-dish, multi-meal
- [ ] Cover UI: progress bars, formatting, dark mode, responsive
- [ ] Cover tips logic: thresholds, missing meals, completion
- [ ] Cover cascade updates: ingredient → dish → plan → display
- [ ] Cover error handling: invalid input, missing data, calculation errors

