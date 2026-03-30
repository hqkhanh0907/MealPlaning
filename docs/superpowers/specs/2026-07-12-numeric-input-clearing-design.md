# Numeric Input Clearing Bug — Design Spec

**Date:** 2026-07-12  
**Status:** Draft  
**Related audit:** EC-V08, EC-V09 from onboarding-audit-design.md

## Problem

Multiple numeric inputs in fitness/workout/cardio features auto-reset to `0` (or `1`) when the user clears them, instead of allowing the field to appear empty during typing. The user must manually delete the `0` before typing a new value, causing friction on mobile.

**Root cause patterns:**
1. `Number('') === 0` combined with `Math.max(0, Number(e.target.value))` — clearing instantly shows 0
2. Explicit `setInputValue(0)` on empty string detection
3. `parseNumericInput('') → 0` due to fallback=0 default
4. `StringNumberController.handleBlur` forces `field.onChange(0)` when field is NaN

## Desired Behavior

**Pattern: "Allow empty while typing, restore on blur"**

| Phase | Behavior |
|-------|----------|
| **Typing** | User can clear the field; it appears empty (no forced 0) |
| **Valid number typed** | Immediately propagated (clamped to min/max) |
| **Blur with empty** | Restore to last valid value (initial or previous) |
| **Save/submit** | NaN values are clamped to minimum (0 for weight, 1 for reps) |

## Affected Files (6 files, ~11 inputs)

| File | Inputs | State Mgmt | Fix Strategy |
|------|--------|------------|-------------|
| `StringNumberController.tsx` | Generic (shared) | RHF useController | Fix handleBlur: restore `prevFieldValue` not 0 |
| `WorkoutLogger.tsx` | weight, reps | RHF setValue | NaN pattern: `raw==='' ? NaN : Math.max(0, N)` |
| `DailyWeightInput.tsx` | weight | local useState | Convert to string display state |
| `CardioLogger.tsx` | manualDuration | RHF Controller | Allow `undefined` on empty (match distance/HR pattern) |
| `SetEditor.tsx` | weight, reps | local useState | NaN pattern: allow empty during typing |

## Technical Design

### 1. StringNumberController (core shared fix)

**Current (buggy):**
```ts
// handleBlur lines 92-100
const fallback = (fieldVal !== null && !Number.isNaN(fieldVal)) ? fieldVal : 0;
// ^^^ Always falls to 0 when field is NaN (which it is after clearing)
```

**Fixed:**
```ts
const handleBlur = () => {
  const parsed = parseNumericInput(localValue, NaN);
  if (localValue === '' || Number.isNaN(parsed)) {
    // Restore to last valid value, not 0
    const lastValid = !Number.isNaN(prevFieldValue) ? prevFieldValue : (min ?? 0);
    setLocalValue(String(lastValid));
    setPrevFieldValue(lastValid);
    field.onChange(lastValid as unknown as typeof field.value);
  } else {
    const clamped = clampValue(parsed);
    setPrevFieldValue(clamped);
    field.onChange(clamped);
    setLocalValue(String(clamped));
  }
  field.onBlur();
};
```

**Key change:** When empty on blur → restore `prevFieldValue` (the last valid number the user typed), not hardcoded `0`. Falls back to `min` prop (or 0) only if no prior valid value exists.

### 2. WorkoutLogger (weight & reps)

**Current:** `value={input.weight}` with `Math.max(0, Number(e.target.value))`  
**Problem:** `Number('') = 0` → user can't clear

**Fix — NaN-as-empty pattern:**
```tsx
<Input
  type="number"
  value={Number.isNaN(input.weight) ? '' : input.weight}
  onChange={(e) => {
    const raw = e.target.value;
    const key = `setInputs.${exercise.id}`;
    const cur = getValues(key) ?? { ...setInputDefaults };
    setValue(key, {
      ...cur,
      weight: raw === '' ? NaN : Math.max(0, Number(raw)),
    });
  }}
/>
```

Same pattern for reps input.

**Save boundary guard:** In `handleAddSet` and `handleSave`, sanitize NaN:
```ts
weight: Number.isNaN(input.weight) ? 0 : input.weight,
reps: Number.isNaN(input.reps) ? 1 : Math.max(1, input.reps),
```

### 3. DailyWeightInput (weight)

**Current:** `const [inputValue, setInputValue] = useState<number>(initialWeight)` with `if (raw === '') setInputValue(0)`

**Fix — String display buffer:**
```ts
const [displayValue, setDisplayValue] = useState<string>(
  initialWeight > 0 ? String(initialWeight) : ''
);
const [numericValue, setNumericValue] = useState<number>(initialWeight);

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const raw = e.target.value;
  setDisplayValue(raw);
  if (raw !== '') {
    const num = parseFloat(raw);
    if (!Number.isNaN(num)) setNumericValue(num);
  }
  setIsSaved(false);
};

const handleBlur = () => {
  if (displayValue === '' || Number.isNaN(parseFloat(displayValue))) {
    // Restore last valid
    setDisplayValue(numericValue > 0 ? String(numericValue) : String(initialWeight));
  }
};
```

Validation and save use `numericValue`, display uses `displayValue`.

### 4. CardioLogger (manualDuration)

**Current:** `field.onChange(parseNumericInput(e.target.value))` — empty → 0

**Fix:** Match the pattern already used for distance and heartRate:
```tsx
onChange={(e) => {
  const val = e.target.value;
  field.onChange(val === '' ? undefined : parseNumericInput(val));
}}
```

### 5. SetEditor (weight & reps)

**Current:** `setWeight(Math.max(MIN_WEIGHT_KG, Number(e.target.value)))` — empty → 0

**Fix — String display buffer:**
```ts
const [weightStr, setWeightStr] = useState(String(initialWeight));
const [repsStr, setRepsStr] = useState(String(initialReps));

const handleWeightInput = (e) => {
  const raw = e.target.value;
  setWeightStr(raw);
  if (raw !== '') {
    const v = Number(raw);
    if (!Number.isNaN(v)) setWeight(Math.max(MIN_WEIGHT_KG, v));
  }
};

const handleWeightBlur = () => {
  if (weightStr === '') setWeightStr(String(weight));
};
```

Same pattern for reps.

## Test Updates Required

| Test File | Changes |
|-----------|---------|
| `StringNumberController.test.tsx` | Update: "resets to 0" → "restores previous value"; add: "restores min when no prior value" |
| `WorkoutLogger.test.tsx` | Add: empty weight shows empty not 0; Add: empty reps shows empty not 0; Update: clear behavior tests |
| `DailyWeightInput.test.tsx` | Update: "handles empty string input gracefully" → restore on blur; Update: validation tests |
| `CardioLogger.test.tsx` | Update: "manual duration does not go below 0" → allows empty; Add: empty then blur restores |
| `SetEditor.test.tsx` | Update: "direct weight input clamps negative to 0" → allows empty; Update: reps behavior |

## Non-goals

- **parseNumericInput default is NOT changed** — it's used in calculation contexts where 0 fallback is correct
- **No new components created** — fixes are inline to minimize risk
- **No type="number" → type="text" migration** — that's a larger UX decision for a separate spec
