# MealPlaning Project - Goal Settings Test Exploration Index

## 📚 Documentation Overview

This index catalogs all findings from the comprehensive exploration of goal settings, nutrition tracking, and progress bar components in the MealPlaning project.

### Main Documentation
- **TEST_GUIDE_SUMMARY.md** (383 lines) - Quick reference guide with test IDs, field specs, validation rules

### Analysis Scope
All 10 requested components have been fully analyzed and documented:
1. GoalSettingsModal.tsx
2. NutritionSubTab
3. UserProfile type
4. Nutrition calculation
5. Progress bar components
6. Tips/recommendations
7. Default values
8. Modal behavior
9. Number input handling
10. Goal persistence

---

## 🔍 Component Deep Dives

### GoalSettingsModal.tsx
**Location**: `src/components/modals/GoalSettingsModal.tsx` (123 lines)

**Key Findings**:
- Auto-save form (no submit button) - updates via `onUpdateProfile` callback
- Three input fields: weight (kg), proteinRatio (g/kg), targetCalories (kcal)
- String state pattern prevents snap-back on mobile when clearing inputs
- Computed protein target displayed: `Math.round(weight × proteinRatio)` g/day
- 4 protein preset buttons [1g, 2g, 3g, 4g]
- Validation: NaN inputs rejected, values below minimum not propagated, blur resets empty fields

**Validation Rules**:
| Field | Min | Max | Type | Precision | Unit |
|-------|-----|-----|------|-----------|------|
| Weight | 1 | 500 | number | integer | kg |
| Protein | 0.1 | 5 | decimal | 1 place | g/kg |
| Calories | 100 | 10000 | number | integer | kcal |

**Test Coverage**: 23 unit tests in `smallModals.test.tsx`
**Test Gaps**: Decimal edge cases, max boundaries, accessibility, mobile soft keyboard

### NutritionSubTab Component
**Location**: `src/components/schedule/NutritionSubTab.tsx`

**Structure**:
- Contains Summary component (progress bars)
- Contains RecommendationPanel component (tips)
- Memoized to prevent unnecessary rerenders

**Props**:
- `dayNutrition: DayNutritionSummary` - Daily nutrition data
- `targetCalories: number` - Goal from profile
- `targetProtein: number` - Calculated (weight × ratio)
- `userWeight: number` - User's weight in kg
- `onEditGoals: () => void` - Opens GoalSettingsModal
- `onSwitchToMeals?: () => void` - Mobile view switching

**Test Coverage**: 8 tests in `scheduleComponents.test.tsx`
**Key Tests**: Plan completion, missing meals, switch button visibility

### Summary Component (Progress Bars)
**Location**: `src/components/Summary.tsx` (lines 58-84)

**Progress Bars**:
- **Calories**: HTML5 `<progress>`, orange color, rose when >115%
- **Protein**: HTML5 `<progress>`, blue color

**Values**:
- Calculated from breakfast + lunch + dinner totals
- Test IDs: `progress-calories`, `progress-protein`
- Can display values > 100% (no capping)

**Test Coverage**: 6 tests - color handling, aria attributes, edit button

### MiniNutritionBar Component
**Location**: `src/components/schedule/MiniNutritionBar.tsx` (lines 45-66)

**Implementation**:
- Custom div-based progress (NOT HTML5 `<progress>`)
- Percentage-based width calculation: `Math.min(100, Math.round(value/target * 100))%`
- Capped at 100% (no overflow display)
- Colors: Orange (calories), Blue (protein)

**Differences from Summary**:
| Aspect | Summary | MiniNutritionBar |
|--------|---------|------------------|
| Element | `<progress>` | `<div>` |
| Overflow | Can exceed 100% | Capped at 100% |
| Color on Excess | Rose-red (cal) | N/A |
| Purpose | Desktop detail | Mobile quick view |

**Test Coverage**: 8 tests covering values, percentages, updates

### UserProfile Type
**Location**: `src/types.ts` (lines 36-40)

```typescript
export type UserProfile = {
  weight: number;           // kg
  proteinRatio: number;     // g/kg body weight
  targetCalories: number;   // kcal/day
};
```

**Default Values** (App.tsx line 58):
```typescript
const DEFAULT_USER_PROFILE: UserProfile = {
  weight: 83,           // kg
  proteinRatio: 2,      // g/kg (→ 166g/day)
  targetCalories: 1500  // kcal/day
};
```

### Nutrition Calculation
**Location**: `src/App.tsx` (line 177)

```typescript
const targetProtein = Math.round(userProfile.weight * userProfile.proteinRatio);
```

**Flow**:
1. User updates weight or proteinRatio in modal
2. `onUpdateProfile` callback updates userProfile state
3. `targetProtein` recalculates automatically
4. Passed to Summary, NutritionSubTab, MiniNutritionBar
5. Progress bars update with new max value

### Tips/Recommendations System
**Location**: `src/utils/tips.ts` (141 lines)

**Function**: `getDynamicTips(dayNutrition, targetCalories, targetProtein, t)`
**Returns**: Array of up to 2 NutritionTip objects

**Tip Types**:
| Condition | Emoji | Type | Threshold |
|-----------|-------|------|-----------|
| Calories over | ⚠️ | warning | >115% |
| Calories low | 📉 | warning | <70% (complete) |
| Protein met | 💪 | success | ≥target |
| Protein low | 🥩 | warning | <80% (complete) |
| Fiber low | 🥬 | info | <15g (complete) |
| Fat high | 🫒 | info | >40% of calories |
| Missing meals | 📝 | info | partial plan |
| No plan | 📋 | info | no meals |
| Balanced | ✅ | success | complete + balanced |

**Constants**:
- `CALORIE_OVER_THRESHOLD = 1.15` (115%)
- `CALORIE_UNDER_THRESHOLD = 0.7` (70%)
- `PROTEIN_LOW_THRESHOLD = 0.8` (80%)
- `MIN_FIBER_GRAMS = 15`
- `FAT_CALORIE_PERCENT_LIMIT = 40`
- `MAX_TIPS_DISPLAYED = 2`

**Test Coverage**: ~12 tests covering each tip type and thresholds

### Goal Persistence
**Location**: `src/hooks/usePersistedState.ts` (40 lines)

**Hook Signature**:
```typescript
function usePersistedState<T>(key: string, initialValue: T)
  return [value, setValue, resetValue] as const
```

**Behavior**:
1. **Mount**: Hydrates synchronously from localStorage
2. **Change**: Writes to localStorage via useEffect (watches `[key, value]`)
3. **Fallback**: Uses initialValue if empty/corrupted
4. **Error**: Silent failure with warning log

**Usage in App**:
```typescript
const [userProfile, setUserProfile] = usePersistedState(
  'mp-user-profile',
  DEFAULT_USER_PROFILE
);
```

**Storage Details**:
- Key: `'mp-user-profile'`
- Format: JSON string
- No explicit save needed
- Handles quota exceeded gracefully

**Test Coverage**: 6 tests for hydration, updates, errors

### Modal Behavior & Keyboard Handling
**Components**: ModalBackdrop, useModalBackHandler

**Escape Key Handling**:
- Stack-based implementation: only topmost modal responds
- Global listener registered on first mount
- Removed when all modals closed
- Prevents event bubbling in nested modals

**Back Button (Mobile)**:
- Android: Via Capacitor App listener
- iOS: Via browser popstate event
- Uses `programmaticBackCount` to skip handler on code-driven back()

**Backdrop Click**:
- Full-screen button behind content
- Calls `onClose()` when clicked
- Does NOT propagate to child inputs

**Scroll Lock**:
- Reference-counted via `_scrollLockDepth` global
- Locks on first modal, unlocks on last close
- Saves/restores `scrollY` position
- iOS-safe: uses `position: fixed` + top offset

**Test Coverage**: 5 tests for history, back button, popstate

### Number Input Handling
**Pattern**: String state prevents snap-back

```typescript
// State: separate string for display, numeric in profile
const [weightStr, setWeightStr] = useState(() => String(userProfile.weight));

// onChange: update display AND profile if valid
onChange={(e) => {
  const v = e.target.value;
  setWeightStr(v);  // Always update display
  const n = Math.round(Number.parseFloat(v));
  if (!Number.isNaN(n) && n >= 1) {  // Only update profile if valid
    onUpdateProfile({ ...userProfile, weight: n });
  }
}}

// onBlur: revert if empty or NaN
onBlur={() => {
  if (weightStr.trim() === '' || Number.isNaN(Number.parseFloat(weightStr))) {
    setWeightStr(String(userProfile.weight));
  }
}}
```

**Decimal Precision**:
- Weight: `Math.round(value)` → integer
- Protein: `Math.round(Math.max(1, raw) * 10) / 10` → 1 decimal
- Calories: `Math.round(value)` → integer

**Validation Flow**:
1. User types → update string state display
2. onChange fires → parse, validate, maybe update profile
3. User tabs away → blur fires → reset if invalid

---

## 📊 Test Coverage Summary

### Existing Tests by Component
- **GoalSettingsModal**: 23 tests (smallModals.test.tsx)
- **NutritionSubTab**: 8 tests (scheduleComponents.test.tsx)
- **Summary**: 6 tests (summaryAndManagement.test.tsx)
- **MiniNutritionBar**: 8 tests (scheduleComponents.test.tsx)
- **usePersistedState**: 6 tests (usePersistedState.test.ts)
- **useModalBackHandler**: 5 tests (useModalBackHandler.test.ts)
- **Nutrition calculations**: 28 tests (nutrition.test.ts)
- **Tips generation**: ~12 tests (tips.test.ts)
- **E2E Goal settings**: 7 tests (e2e/specs/10-goal-settings.spec.ts)

**Total**: ~103 tests

### Test Files Locations
```
src/__tests__/
├── smallModals.test.tsx              (Goal + Clear modals)
├── summaryAndManagement.test.tsx     (Summary + Management UI)
├── scheduleComponents.test.tsx       (Meals, Nutrition, Mini bars)
├── usePersistedState.test.ts         (localStorage persistence)
├── useModalBackHandler.test.ts       (Back button handling)
├── nutrition.test.ts                 (Ingredient/dish calculations)
├── tips.test.ts                      (Tip generation logic)
└── ... (other components)

e2e/specs/
└── 10-goal-settings.spec.ts          (E2E goal workflow)
```

---

## ⚠️ Critical Test Gaps

### High Priority (Blocking Features)
- [ ] Decimal precision edge cases (1.99 → 2.0, 1.94 → 1.9)
- [ ] Maximum value boundaries (weight=500, protein=5, calories=10000)
- [ ] Progress bar colors at threshold (>115% for calories)
- [ ] Zero/extreme nutrition edge cases
- [ ] Accessibility: aria-labels, keyboard Tab order

### Medium Priority (Quality)
- [ ] Tips threshold edge cases (exactly 115%, 70%, 80%)
- [ ] localStorage quota exceeded handling
- [ ] Private browsing mode (quota=0)
- [ ] Escape key in nested modals
- [ ] Rapid input sequences (race conditions)
- [ ] Mobile soft keyboard interaction

### Low Priority (Nice-to-have)
- [ ] Localization text interpolation
- [ ] Performance: large meal plans (100+ days)
- [ ] Multi-tab localStorage synchronization
- [ ] String state sync after programmatic updates

---

## 🎯 Key Test IDs & Selectors

### Input Fields
```javascript
'input-goal-weight'      // Weight input
'input-goal-protein'     // Protein ratio input
'input-goal-calories'    // Calories input
```

### Buttons
```javascript
'btn-goal-done'          // Done/close button
'btn-preset-1'           // Protein preset: 1g
'btn-preset-2'           // Protein preset: 2g
'btn-preset-3'           // Protein preset: 3g
'btn-preset-4'           // Protein preset: 4g
'btn-edit-goals'         // Edit goals button
'btn-switch-to-meals'    // Switch to meals button
```

### Progress Bars
```javascript
'progress-calories'      // Summary calories bar
'progress-protein'       // Summary protein bar
'mini-cal-bar'           // MiniNutritionBar calories fill
'mini-pro-bar'           // MiniNutritionBar protein fill
```

### Containers
```javascript
'nutrition-subtab'       // NutritionSubTab wrapper
'summary-total-calories' // Display total calories value
```

---

## 💾 localStorage Schema

```typescript
// Key: 'mp-user-profile'
// Value: JSON string
{
  "weight": 83,              // number, kg
  "proteinRatio": 2,         // number, g/kg
  "targetCalories": 1500     // number, kcal
}

// Example values:
// {"weight":83,"proteinRatio":2,"targetCalories":1500}
```

---

## 📝 Test Writing Tips

### 1. Mock useModalBackHandler
```typescript
vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));
```

### 2. Test Auto-Save Pattern
```typescript
it('updates profile on input change', () => {
  render(<GoalSettingsModal userProfile={profile} onUpdateProfile={onUpdate} onClose={onClose} />);
  fireEvent.change(screen.getByLabelText('Weight'), { target: { value: '90' } });
  expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ weight: 90 }));
});
```

### 3. Test String State Reset on Blur
```typescript
it('resets weight on blur when empty', () => {
  render(<GoalSettingsModal userProfile={profile} onUpdateProfile={onUpdate} onClose={onClose} />);
  const input = screen.getByLabelText('Weight');
  fireEvent.change(input, { target: { value: '' } });
  fireEvent.blur(input);
  expect((input as HTMLInputElement).value).toBe(String(profile.weight));
});
```

### 4. Test Computed Protein Display
```typescript
it('shows computed protein target', () => {
  // profile: weight=70, proteinRatio=2 → 140g
  render(<GoalSettingsModal userProfile={profile} ... />);
  expect(screen.getByText('140g / ngày')).toBeInTheDocument();
});
```

### 5. Test Progress Bar Colors
```typescript
it('shows rose color when calories exceed target', () => {
  render(<Summary dayNutrition={{ ...nutrition }} targetCalories={1000} ... />);
  const bar = screen.getByTestId('progress-calories');
  expect(bar.className).toContain('bg-rose-500');  // or check computed styles
});
```

---

## 🔗 Related Documentation

- Main guide: TEST_GUIDE_SUMMARY.md (383 lines)
- E2E spec: e2e/specs/10-goal-settings.spec.ts (TC_GOAL_01-07)
- Component tests: src/__tests__/ (multiple files)
- TypeScript definitions: src/types.ts

---

## ✅ Exploration Status

**Completion**: 100% - All 10 requested components analyzed and documented

**Files Generated**:
1. TEST_GUIDE_SUMMARY.md (11 KB, 383 lines) - Main reference guide
2. EXPLORATION_INDEX.md (this file) - Navigation and deep dives

**Next Steps for User**:
1. Review TEST_GUIDE_SUMMARY.md for quick reference
2. Use EXPLORATION_INDEX.md for component deep dives
3. Reference test IDs and validation rules when writing tests
4. Check test gaps section for coverage areas
5. Use test writing tips section for common patterns

---

