# MealPlaning Goal Settings - Comprehensive Test Guide

## Quick Navigation

This document provides complete test specifications for:

1. **GoalSettingsModal.tsx** - Goal editing interface
2. **NutritionSubTab & Summary** - Goal display & progress bars
3. **UserProfile type** - Data structure and defaults
4. **Nutrition calculations** - Formula: targetProtein = weight × proteinRatio
5. **Progress bars** - HTML5 and custom implementations
6. **Tips system** - Dynamic recommendations based on nutrition
7. **Goal persistence** - localStorage handling via usePersistedState
8. **Modal behavior** - Keyboard/backdrop handling
9. **Number input handling** - Validation and decimal precision
10. **Data import/export** - Goal validation rules

---

## Component Locations & Files

| Component         | Path                                         | Key File               |
| ----------------- | -------------------------------------------- | ---------------------- |
| GoalSettingsModal | src/components/modals/GoalSettingsModal.tsx  | ✓ Complete (123 lines) |
| UserProfile Type  | src/types.ts                                 | Lines 36-40            |
| Summary Bars      | src/components/Summary.tsx                   | Lines 58-84 (progress) |
| NutritionSubTab   | src/components/schedule/NutritionSubTab.tsx  | ✓ Complete             |
| MiniNutritionBar  | src/components/schedule/MiniNutritionBar.tsx | Lines 45-66            |
| Tips Generator    | src/utils/tips.ts                            | ✓ Complete (141 lines) |
| Persistence Hook  | src/hooks/usePersistedState.ts               | ✓ Complete (40 lines)  |
| Modal Backdrop    | src/components/shared/ModalBackdrop.tsx      | ✓ Complete (123 lines) |
| Modal Handler     | src/hooks/useModalBackHandler.ts             | ✓ Complete (79 lines)  |
| Default Values    | src/App.tsx                                  | Line 58                |

---

## GoalSettingsModal.tsx - Input Fields

### 1. Weight Field

- **ID**: `input-goal-weight`
- **Type**: number input, min=1, max=500
- **Validation**: ≥1 kg, rounds to integer
- **Unit**: kg
- **Blur behavior**: Reverts to profile value if empty/NaN

### 2. Protein Ratio Field

- **ID**: `input-goal-protein`
- **Type**: decimal input, min=1, max=5, step=0.1
- **Validation**: ≥0.1, rounds to 1 decimal place (0.1 precision)
- **Unit**: g/kg
- **Computed display**: `Math.round(weight × proteinRatio)` g/day
- **Presets**: [1g, 2g, 3g, 4g] buttons (test IDs: `btn-preset-1` etc)
- **Blur behavior**: Reverts to profile value if empty/NaN

### 3. Calories Field

- **ID**: `input-goal-calories`
- **Type**: number input, min=100, max=10000
- **Validation**: ≥100 kcal, rounds to integer
- **Unit**: kcal
- **Blur behavior**: Reverts to profile value if empty/NaN

### Modal Controls

- **Done button**: `btn-goal-done` - closes modal
- **Backdrop click**: Closes modal
- **X button** (top-right): Closes modal
- **Escape key**: Closes modal (via ModalBackdrop)

---

## Default & Stored Values

```typescript
// App.tsx line 58
const DEFAULT_USER_PROFILE: UserProfile = {
  weight: 83, // kg
  proteinRatio: 2, // g/kg (→ 166g protein/day)
  targetCalories: 1500, // kcal/day
};

// localStorage key: 'mp-user-profile'
// Format: JSON string with above structure
```

---

## Calculation Formula

```typescript
// App.tsx line 177
const targetProtein = Math.round(userProfile.weight * userProfile.proteinRatio);

// Example: weight=83, proteinRatio=2 → targetProtein=166
// Example: weight=70, proteinRatio=2.5 → targetProtein=175 (Math.round)
```

---

## Progress Bars

### Summary.tsx (HTML5 `<progress>`)

**Calories:**

- ID: `progress-calories`
- Value: `Math.round(totalCalories)`
- Max: `targetCalories`
- Color: Orange (normal), Rose (>115% of target)

**Protein:**

- ID: `progress-protein`
- Value: `Math.round(totalProtein)`
- Max: `targetProtein`
- Color: Blue (always)

### MiniNutritionBar.tsx (Custom div-based)

Uses percentage fill instead of `<progress>`:

- Calories: `Math.min(100, Math.round((totalCal/targetCalories)*100))%`
- Protein: `Math.min(100, Math.round((totalPro/targetProtein)*100))%`
- Capped at 100% (no overflow display)

---

## Validation Rules

### Weight

- ✓ Minimum: 1 kg
- ✓ Maximum: 500 kg
- ✓ Type: integer
- ✗ Does not propagate if < 1

### Protein Ratio

- ✓ Minimum: 0.1 g/kg
- ✓ Maximum: 5 g/kg
- ✓ Precision: 1 decimal (0.1 precision)
- ✗ Does not propagate if < 0.1 or > 5

### Calories

- ✓ Minimum: 100 kcal
- ✓ Maximum: 10000 kcal
- ✓ Type: integer
- ✗ Does not propagate if < 100

---

## Tips System (utils/tips.ts)

Max 2 tips displayed. Rules:

| Condition                 | Emoji | Text                  | Type    |
| ------------------------- | ----- | --------------------- | ------- |
| Calories > 115%           | ⚠️    | "Vượt X kcal"         | warning |
| Calories < 70% (complete) | 📉    | "Chỉ X kcal"          | warning |
| Protein ≥ target          | 💪    | "Đạt X/Y g"           | success |
| Protein < 80% (complete)  | 🥩    | "Chỉ X/Y g"           | warning |
| Fiber < 15g (complete)    | 🥬    | "Chất xơ chưa đủ"     | info    |
| Fat > 40% of calories     | 🫒    | "Béo X% calo"         | info    |
| Missing meals (partial)   | 📝    | "Thiếu {meals}"       | info    |
| No meals                  | 📋    | "Chưa có kế hoạch"    | info    |
| Complete & balanced       | ✅    | "Dinh dưỡng cân bằng" | success |

---

## Persistence (usePersistedState)

```typescript
// Hook signature
function usePersistedState<T>(key: string, initialValue: T)
  return [value, setValue, resetValue] as const

// Usage in App.tsx
const [userProfile, setUserProfile] = usePersistedState(
  'mp-user-profile',
  DEFAULT_USER_PROFILE
);

// Behavior
- Hydrates synchronously on mount from localStorage
- Writes to localStorage on every state change (useEffect)
- Fallback to initialValue if localStorage empty/corrupted
- Silent error handling (logs warnings, doesn't crash)
```

---

## Modal Keyboard Handling

### Escape Key

- Stack-based: only topmost modal responds
- Global listener registered on first modal mount
- Removed when all modals closed

### Back Button

- Android: Via Capacitor App listener
- iOS: Via popstate event (swipe-back)
- Behavior: Pushes history on open, pops on close
- Uses `programmaticBackCount` to distinguish user vs code-driven

### Backdrop Click

- Full-screen button element
- Calls `onClose()` when clicked
- Does NOT propagate to child inputs

### Scroll Lock

- Reference-counted: `_scrollLockDepth` global
- Locks on first modal, unlocks on last close
- Saves/restores scrollY position
- iOS-safe: uses `position: fixed` + top offset

---

## Number Input Handling

### String State Pattern

```typescript
// Prevents snap-back when clearing input on mobile
const [weightStr, setWeightStr] = useState(() => String(userProfile.weight));

// On change: update string AND update profile if valid
onChange={(e) => {
  const v = e.target.value;
  setWeightStr(v);  // Update display
  const n = Math.round(Number.parseFloat(v));
  if (!Number.isNaN(n) && n >= 1) {
    onUpdateProfile({ ...userProfile, weight: n });  // Update data
  }
}}

// On blur: revert to last valid if empty/NaN
onBlur={() => {
  if (weightStr.trim() === '' || Number.isNaN(Number.parseFloat(weightStr))) {
    setWeightStr(String(userProfile.weight));
  }
}}
```

### Decimal Precision

- Weight: `Math.round(value)` → integers
- Protein: `Math.round(Math.max(1, raw) * 10) / 10` → 1 decimal
- Calories: `Math.round(value)` → integers

---

## Existing Tests Coverage

### GoalSettingsModal (23 tests in smallModals.test.tsx)

✓ Renders all fields
✓ Shows computed protein (weight × ratio)
✓ Updates on each input change
✓ Validates minimums (weight≥1, protein≥0.1, calories≥100)
✓ Rejects NaN inputs (weight, protein, calories)
✓ Resets on blur when empty
✓ Renders 4 preset buttons
✓ Highlights active preset
✓ Updates computed on weight/ratio change

### Summary Progress Bars (6 tests in summaryAndManagement.test.tsx)

✓ Renders bars with correct aria attributes
✓ Shows total calories and protein
✓ Handles over-target (>100%)
✓ Has edit goals button

### NutritionSubTab (8 tests in scheduleComponents.test.tsx)

✓ Renders Summary + RecommendationPanel
✓ Shows plan complete message
✓ Shows missing meals text
✓ Shows switch-to-meals button (when empty)

### MiniNutritionBar (8 tests in scheduleComponents.test.tsx)

✓ Renders with correct values
✓ Shows percentages correctly
✓ Updates on value change
✓ Capped at 100%

### Persistence (6 tests in usePersistedState.test.ts)

✓ Hydrates from localStorage
✓ Saves on state change
✓ Fallback to initial value

### Modal Handler (5 tests in useModalBackHandler.test.ts)

✓ Pushes/pops history
✓ Calls onClose on back

---

## Test Gaps to Address

### Critical

- [ ] Decimal edge cases: 1.99 → 2.0, 1.94 → 1.9
- [ ] Maximum boundaries: weight=500, protein=5, calories=10000
- [ ] Zero nutrition edge case
- [ ] Rapid input sequences

### High Priority

- [ ] Accessibility: aria-labels, Tab order, screen reader
- [ ] Mobile: soft keyboard, touch presets
- [ ] Progress bar overflow (200%, 300% of target)
- [ ] Tips threshold edge cases (exactly 115%, exactly 70%)

### Medium Priority

- [ ] Storage quota exceeded
- [ ] Private browsing mode (quota=0)
- [ ] Corrupted localStorage recovery
- [ ] Multi-tab synchronization
- [ ] Escape key in nested modals

### Low Priority

- [ ] Localization edge cases
- [ ] Performance: large meal plans
- [ ] String state sync after rerender

---

## Key Test IDs & Selectors

```javascript
// Inputs
'input-goal-weight'; // Weight field
'input-goal-protein'; // Protein ratio field
'input-goal-calories'; // Calories field

// Buttons
'btn-goal-done'; // Done/Close button
'btn-preset-1'; // Protein preset: 1g
'btn-preset-2'; // Protein preset: 2g
'btn-preset-3'; // Protein preset: 3g
'btn-preset-4'; // Protein preset: 4g
'btn-edit-goals'; // Edit Goals button (in Summary)

// Progress bars
'progress-calories'; // Calories progress bar
'progress-protein'; // Protein progress bar
'mini-cal-bar'; // MiniNutritionBar calories
'mini-pro-bar'; // MiniNutritionBar protein

// Panels
'nutrition-subtab'; // NutritionSubTab container
'btn-switch-to-meals'; // Switch to meals button

// Computed values
'summary-total-calories'; // Display total calories
```

---

## Quick Reference: Field Ranges

| Field    | Min | Max   | Step | Precision | Unit |
| -------- | --- | ----- | ---- | --------- | ---- |
| Weight   | 1   | 500   | 1    | integer   | kg   |
| Protein  | 0.1 | 5     | 0.1  | 1 decimal | g/kg |
| Calories | 100 | 10000 | 1    | integer   | kcal |

---

## Constants

```typescript
// App.tsx
const DEFAULT_USER_PROFILE = { weight: 83, proteinRatio: 2, targetCalories: 1500 };

// GoalSettingsModal.tsx
const PROTEIN_PRESETS = [1, 2, 3, 4];

// tips.ts
const CALORIE_OVER_THRESHOLD = 1.15; // 115%
const CALORIE_UNDER_THRESHOLD = 0.7; // 70%
const PROTEIN_LOW_THRESHOLD = 0.8; // 80%
const MIN_FIBER_GRAMS = 15;
const FAT_CALORIE_PERCENT_LIMIT = 40;
const MAX_TIPS_DISPLAYED = 2;

// ModalBackdrop.tsx
let _scrollLockDepth = 0;
const _escapeStack: Array<{ id: number; handler: () => void }> = [];
let _nextEscapeId = 0;
```

---

## Related Files

- E2E tests: `e2e/specs/10-goal-settings.spec.ts` (TC_GOAL_01-07)
- Nutrition tests: `src/__tests__/nutrition.test.ts` (ingredient/dish calcs)
- Tips tests: `src/__tests__/tips.test.ts` (tip generation logic)
- Data service tests: `src/__tests__/dataService.test.ts` (import validation)
