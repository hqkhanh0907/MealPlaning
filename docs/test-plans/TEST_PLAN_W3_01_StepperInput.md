# TEST PLAN — W3-01: StepperInput Component

> **QA Agent**: Senior QA | **Date**: 2025-07-17 | **Status**: TEST_PLAN_READY
> **Component**: `src/features/fitness/components/StepperInput.tsx`
> **Test file**: `src/__tests__/StepperInput.test.tsx`

---

## 1. SCOPE & APPROACH

### 1.1 Component Under Test

StepperInput — a reusable ± stepper with numeric input, long-press rapid increment, warning state, and compact variant. Used for weight (step=0.5) and reps (step=1) in workout logging.

### 1.2 Test Strategy

- **100% Unit Test (Vitest + RTL)** — all scenarios testable in jsdom
- **Fake timers** for long-press timing verification (`vi.useFakeTimers`)
- **fireEvent.pointerDown/pointerUp** for long-press simulation (established pattern from WeightQuickLog.test.tsx)
- **@testing-library/user-event** for click, type, tab (blur)
- **No manual emulator tests needed** — component is pure UI, no Capacitor/native dependency

### 1.3 Props Interface (from spec)

```typescript
interface StepperInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number; // default: 0
  max?: number; // optional upper bound
  step: number; // e.g., 0.5 for weight, 1 for reps
  warningThreshold?: number; // show warning above this
  unit?: string; // display unit (e.g., "kg", "lần")
  label?: string; // accessible label
  compact?: boolean; // smaller variant
  disabled?: boolean; // all interaction blocked
  testId?: string; // data-testid prefix
}
```

### 1.4 Expected data-testid Map

| Element      | testid pattern       |
| ------------ | -------------------- |
| Container    | `{testId}` (root)    |
| Minus button | `{testId}-decrement` |
| Plus button  | `{testId}-increment` |
| Input field  | `{testId}-input`     |
| Warning text | `{testId}-warning`   |
| Unit label   | `{testId}-unit`      |

### 1.5 i18n Keys (existing in vi.json)

- `common.decrease` → "Giảm"
- `common.increase` → "Tăng"
- `fitness.planDayEditor.decreaseField` → "Giảm {{label}}"
- `fitness.planDayEditor.increaseField` → "Tăng {{label}}"

Dev may need to add stepper-specific warning key (e.g., `fitness.stepper.warningHigh`).

---

## 2. TEST SCENARIOS

### SC_W301_01: Basic Rendering

Verify component renders all required elements with correct structure and styling.

### SC_W301_02: Single Tap Increment/Decrement

Verify ± buttons change value by exactly `step` amount per tap.

### SC_W301_03: Long-Press Rapid Increment

Verify holding ± button ≥500ms triggers rapid value changes at 150ms intervals.

### SC_W301_04: Manual Input

Verify center input field allows direct numeric editing with blur validation.

### SC_W301_05: Boundary Conditions (min/max)

Verify buttons disable at min/max and value is clamped.

### SC_W301_06: Warning State

Verify visual warning appears when value exceeds `warningThreshold`.

### SC_W301_07: Disabled State

Verify all interaction is blocked when `disabled=true`.

### SC_W301_08: Compact Variant

Verify compact mode renders smaller sizing.

### SC_W301_09: NaN Prevention

Verify non-numeric and edge-case input is handled safely.

### SC_W301_10: Accessibility

Verify aria-labels, roles, and keyboard accessibility.

---

## 3. TEST CASES

### SC_W301_01: Basic Rendering

#### TC_W301_01: Renders with default testId

```
Pre-condition: value=50, step=1, testId="stepper-weight"
Steps: render(<StepperInput value={50} step={1} testId="stepper-weight" onChange={fn} />)
Expected:
  - screen.getByTestId("stepper-weight") exists
  - screen.getByTestId("stepper-weight-decrement") exists (Minus button)
  - screen.getByTestId("stepper-weight-increment") exists (Plus button)
  - screen.getByTestId("stepper-weight-input") exists, value="50"
Classification: Unit
```

#### TC_W301_02: Renders unit label when provided

```
Pre-condition: unit="kg"
Steps: render with unit="kg"
Expected:
  - Text "kg" visible in DOM
Classification: Unit
```

#### TC_W301_03: Renders label as accessible name

```
Pre-condition: label="Cân nặng"
Steps: render with label="Cân nặng"
Expected:
  - Input has accessible label containing "Cân nặng"
  - Decrement button aria-label contains "Giảm" (from i18n)
  - Increment button aria-label contains "Tăng" (from i18n)
Classification: Unit
```

#### TC_W301_04: Button minimum touch target (BR-37)

```
Pre-condition: default render
Steps: Check button className
Expected:
  - Both ± buttons have classes: min-h-12 min-w-12 (48px = 48dp touch target)
  - Buttons have rounded-xl class
Classification: Unit
```

#### TC_W301_05: Input field styling matches spec (AC-8)

```
Pre-condition: default render
Steps: Check input className
Expected:
  - Input has classes: h-12 w-20 rounded-lg bg-muted text-center text-lg font-semibold tabular-nums
Classification: Unit
```

#### TC_W301_06: Active scale animation class present (BR-42, AC-9)

```
Pre-condition: default render
Steps: Check button className
Expected:
  - Both buttons have active:scale-[0.95]
  - Both buttons have motion-reduce:transform-none
Classification: Unit
```

---

### SC_W301_02: Single Tap Increment/Decrement

#### TC_W301_07: Tap + increments by step=1 (reps)

```
Pre-condition: value=5, step=1, onChange=mockFn
Steps: click increment button
Expected: onChange called with 6
Classification: Unit
```

#### TC_W301_08: Tap − decrements by step=1 (reps)

```
Pre-condition: value=5, step=1, onChange=mockFn
Steps: click decrement button
Expected: onChange called with 4
Classification: Unit
```

#### TC_W301_09: Tap + increments by step=0.5 (weight)

```
Pre-condition: value=75.0, step=0.5, onChange=mockFn
Steps: click increment button
Expected: onChange called with 75.5
Classification: Unit
```

#### TC_W301_10: Tap − decrements by step=0.5 (weight)

```
Pre-condition: value=75.0, step=0.5, onChange=mockFn
Steps: click decrement button
Expected: onChange called with 74.5
Classification: Unit
```

#### TC_W301_11: Multiple taps accumulate correctly

```
Pre-condition: value starts at 10, step=1
Steps: click increment 3 times (re-render with new value between clicks)
Expected: onChange called 3 times: (11), (12), (13)
Note: Component is controlled — parent must update value prop each time.
Classification: Unit
```

---

### SC_W301_03: Long-Press Rapid Increment

#### TC_W301_12: Hold ≥500ms triggers first rapid tick

```
Pre-condition: value=50, step=1, vi.useFakeTimers
Steps:
  1. fireEvent.pointerDown(incrementBtn)
  2. act(() => vi.advanceTimersByTime(500))  // hold threshold
  3. fireEvent.pointerUp(incrementBtn)
Expected:
  - onChange called at least once during hold (first tick at 500ms)
  - Value should be 51 (one tick after threshold)
Classification: Unit
```

#### TC_W301_13: Continued hold triggers repeated ticks at 150ms intervals

```
Pre-condition: value=50, step=1, vi.useFakeTimers
Steps:
  1. fireEvent.pointerDown(incrementBtn)
  2. act(() => vi.advanceTimersByTime(500))  // threshold — first tick
  3. act(() => vi.advanceTimersByTime(450))  // 3 more intervals (150ms each)
  4. fireEvent.pointerUp(incrementBtn)
Expected:
  - onChange called 4 times total (1 at 500ms + 3 at 650/800/950ms)
  - Final value = 54
Classification: Unit
```

#### TC_W301_14: Long-press on decrement works identically

```
Pre-condition: value=50, step=0.5, vi.useFakeTimers
Steps:
  1. fireEvent.pointerDown(decrementBtn)
  2. act(() => vi.advanceTimersByTime(500))  // first tick → 49.5
  3. act(() => vi.advanceTimersByTime(300))  // 2 more ticks → 49.0, 48.5
  4. fireEvent.pointerUp(decrementBtn)
Expected:
  - onChange called 3 times: (49.5), (49.0), (48.5)
Classification: Unit
```

#### TC_W301_15: pointerUp stops long-press immediately

```
Pre-condition: value=50, step=1, vi.useFakeTimers
Steps:
  1. fireEvent.pointerDown(incrementBtn)
  2. act(() => vi.advanceTimersByTime(500))  // first tick → 51
  3. fireEvent.pointerUp(incrementBtn)       // stop
  4. act(() => vi.advanceTimersByTime(1000)) // wait more
Expected:
  - onChange call count stays at 1 (no more ticks after pointerUp)
Classification: Unit
```

#### TC_W301_16: pointerLeave stops long-press (finger drag off)

```
Pre-condition: value=50, step=1, vi.useFakeTimers
Steps:
  1. fireEvent.pointerDown(incrementBtn)
  2. act(() => vi.advanceTimersByTime(500))
  3. record onChange call count
  4. fireEvent.pointerLeave(incrementBtn)
  5. act(() => vi.advanceTimersByTime(1000))
Expected:
  - onChange not called after pointerLeave
Classification: Unit
```

#### TC_W301_17: Short press (<500ms) does NOT trigger rapid mode

```
Pre-condition: value=50, step=1, vi.useFakeTimers
Steps:
  1. fireEvent.pointerDown(incrementBtn)
  2. act(() => vi.advanceTimersByTime(400)) // under threshold
  3. fireEvent.pointerUp(incrementBtn)
  4. act(() => vi.advanceTimersByTime(1000))
Expected:
  - onChange called exactly 1 time (initial click only)
  - Value = 51
Classification: Unit
```

#### TC_W301_18: Long-press clamps at max during hold

```
Pre-condition: value=298, step=1, max=300, vi.useFakeTimers
Steps:
  1. fireEvent.pointerDown(incrementBtn)
  2. act(() => vi.advanceTimersByTime(2000)) // enough for many ticks
  3. fireEvent.pointerUp(incrementBtn)
Expected:
  - Final onChange value = 300 (clamped, not 310+)
  - onChange NOT called after reaching 300
Classification: Unit
```

#### TC_W301_19: Long-press clamps at min during hold

```
Pre-condition: value=2, step=1, min=0, vi.useFakeTimers
Steps:
  1. fireEvent.pointerDown(decrementBtn)
  2. act(() => vi.advanceTimersByTime(2000))
  3. fireEvent.pointerUp(decrementBtn)
Expected:
  - Final onChange value = 0 (clamped at min)
  - onChange NOT called after reaching 0
Classification: Unit
```

---

### SC_W301_04: Manual Input

#### TC_W301_20: Type valid number in input field

```
Pre-condition: value=50, step=1, onChange=mockFn
Steps:
  1. Clear input field
  2. Type "75"
  3. Blur input (tab away)
Expected:
  - onChange called with 75
Classification: Unit
```

#### TC_W301_21: Type valid decimal for weight (step=0.5)

```
Pre-condition: value=75.0, step=0.5
Steps:
  1. Clear and type "80.5"
  2. Blur
Expected:
  - onChange called with 80.5
Classification: Unit
```

#### TC_W301_22: Empty input on blur reverts to current value

```
Pre-condition: value=50, step=1
Steps:
  1. Clear input (empty string)
  2. Blur
Expected:
  - onChange NOT called with NaN
  - Input value reverts to "50" OR onChange called with previous value
Classification: Unit
```

#### TC_W301_23: Input clamped to min on blur

```
Pre-condition: value=50, step=1, min=0
Steps:
  1. Clear and type "-5"
  2. Blur
Expected:
  - onChange called with 0 (clamped to min)
Classification: Unit
```

#### TC_W301_24: Input clamped to max on blur

```
Pre-condition: value=50, step=1, max=300
Steps:
  1. Clear and type "999"
  2. Blur
Expected:
  - onChange called with 300 (clamped to max)
Classification: Unit
```

---

### SC_W301_05: Boundary Conditions

#### TC_W301_25: Minus button disabled at min value (AC-4)

```
Pre-condition: value=0, step=1, min=0
Steps: render
Expected:
  - Decrement button has disabled attribute
  - Decrement button has disabled:opacity-50 class (or equivalent visual)
  - Click does NOT call onChange
Classification: Unit
```

#### TC_W301_26: Plus button disabled at max value (AC-5)

```
Pre-condition: value=300, step=1, max=300
Steps: render
Expected:
  - Increment button has disabled attribute
  - Click does NOT call onChange
Classification: Unit
```

#### TC_W301_27: Value exactly at min — decrement disabled, increment enabled

```
Pre-condition: value=0, step=0.5, min=0
Steps: render
Expected:
  - Decrement button disabled
  - Increment button NOT disabled
  - Click increment → onChange(0.5)
Classification: Unit
```

#### TC_W301_28: Value exactly at max — increment disabled, decrement enabled

```
Pre-condition: value=300, step=0.5, max=300
Steps: render
Expected:
  - Increment button disabled
  - Decrement button NOT disabled
  - Click decrement → onChange(299.5)
Classification: Unit
```

#### TC_W301_29: No max prop — increment never disabled

```
Pre-condition: value=99999, step=1, max=undefined
Steps: render
Expected:
  - Increment button NOT disabled
  - Click → onChange(100000)
Classification: Unit
```

#### TC_W301_30: min=0 prevents negative values

```
Pre-condition: value=0.5, step=0.5, min=0
Steps: click decrement
Expected:
  - onChange called with 0
  - Next decrement click: onChange NOT called (already at min)
Classification: Unit
```

#### TC_W301_31: Long-press does NOT start when at boundary (increment at max)

```
Pre-condition: value=300, step=1, max=300, vi.useFakeTimers
Steps:
  1. fireEvent.pointerDown(incrementBtn)
  2. act(() => vi.advanceTimersByTime(2000))
  3. fireEvent.pointerUp(incrementBtn)
Expected:
  - onChange never called
  - Value stays 300
Classification: Unit
```

#### TC_W301_32: Floating-point precision — step=0.5 from 0.1

```
Pre-condition: value=0.1, step=0.5
Steps: click increment
Expected:
  - onChange called with 0.6 (not 0.6000000000000001)
  - Proper rounding applied
Classification: Unit
```

---

### SC_W301_06: Warning State

#### TC_W301_33: No warning when value ≤ warningThreshold

```
Pre-condition: value=300, warningThreshold=300
Steps: render
Expected:
  - Warning element NOT in DOM (queryByTestId("{testId}-warning") === null)
Classification: Unit
```

#### TC_W301_34: Warning shown when value > warningThreshold (BR-14)

```
Pre-condition: value=301, step=0.5, warningThreshold=300
Steps: render
Expected:
  - Warning element IS in DOM
  - Warning has visual indicator (text-warning or text-destructive class)
  - Warning text communicates high value
Classification: Unit
```

#### TC_W301_35: Warning appears dynamically when crossing threshold via increment

```
Pre-condition: value=300, step=0.5, warningThreshold=300, onChange updates value
Steps:
  1. Verify no warning at 300
  2. Click increment → value becomes 300.5
  3. Re-render with value=300.5
Expected:
  - Warning now visible
Classification: Unit
```

#### TC_W301_36: Warning disappears when value drops below threshold

```
Pre-condition: value=301, step=1, warningThreshold=300
Steps:
  1. Verify warning visible at 301
  2. Click decrement → 300
  3. Re-render with value=300
Expected:
  - Warning disappears
Classification: Unit
```

#### TC_W301_37: No warningThreshold prop — warning never shows

```
Pre-condition: value=99999, warningThreshold=undefined
Steps: render
Expected:
  - No warning element in DOM regardless of value
Classification: Unit
```

---

### SC_W301_07: Disabled State

#### TC_W301_38: All interaction blocked when disabled=true

```
Pre-condition: value=50, step=1, disabled=true, onChange=mockFn
Steps:
  1. Click increment → nothing
  2. Click decrement → nothing
  3. Try typing in input → blocked
Expected:
  - onChange never called
  - Both buttons have disabled attribute
  - Input has readOnly or disabled attribute
Classification: Unit
```

#### TC_W301_39: Disabled buttons have opacity-50 visual

```
Pre-condition: disabled=true
Steps: render
Expected:
  - Both buttons have disabled:opacity-50 or opacity-50 class
Classification: Unit
```

#### TC_W301_40: Long-press does not trigger when disabled

```
Pre-condition: value=50, step=1, disabled=true, vi.useFakeTimers
Steps:
  1. fireEvent.pointerDown(incrementBtn)
  2. act(() => vi.advanceTimersByTime(2000))
  3. fireEvent.pointerUp(incrementBtn)
Expected:
  - onChange never called
Classification: Unit
```

---

### SC_W301_08: Compact Variant

#### TC_W301_41: Compact mode renders smaller elements

```
Pre-condition: compact=true
Steps: render
Expected:
  - Component has compact-specific classes (smaller height/width)
  - Buttons may have smaller min-h/min-w (still ≥44px for accessibility)
  - Input may have smaller width
Classification: Unit
```

#### TC_W301_42: Compact mode — functionality identical

```
Pre-condition: compact=true, value=10, step=1
Steps: click increment, click decrement
Expected:
  - onChange called with 11, then 10
  - Same behavior as non-compact
Classification: Unit
```

---

### SC_W301_09: NaN Prevention

#### TC_W301_43: Non-numeric input rejected on blur

```
Pre-condition: value=50
Steps:
  1. Clear input, type "abc"
  2. Blur
Expected:
  - onChange NOT called with NaN
  - Input reverts to "50" or previous valid value
Classification: Unit
```

#### TC_W301_44: Input "e" (scientific notation character) handled

```
Pre-condition: value=50
Steps: Type "1e2" then blur
Expected:
  - onChange called with 100 (1e2 = 100) if accepted, OR reverts to 50
  - Must NOT result in NaN
Classification: Unit
```

#### TC_W301_45: Input with spaces handled

```
Pre-condition: value=50
Steps: Type " 75 " then blur
Expected:
  - onChange called with 75 (trimmed) OR reverts
  - Must NOT result in NaN
Classification: Unit
```

#### TC_W301_46: Input "0" is valid (when min=0)

```
Pre-condition: value=5, min=0
Steps: Clear, type "0", blur
Expected:
  - onChange called with 0
  - 0 is NOT treated as empty/invalid
Classification: Unit
```

#### TC_W301_47: Extremely large number clamped

```
Pre-condition: value=50, max=300
Steps: Type "999999", blur
Expected:
  - onChange called with 300 (clamped to max)
Classification: Unit
```

---

### SC_W301_10: Accessibility

#### TC_W301_48: Buttons have aria-labels with label context

```
Pre-condition: label="Cân nặng"
Steps: render
Expected:
  - Decrement: aria-label matches pattern "Giảm Cân nặng" or "Giảm"
  - Increment: aria-label matches pattern "Tăng Cân nặng" or "Tăng"
Classification: Unit
```

#### TC_W301_49: Input has appropriate inputMode

```
Pre-condition: step=0.5 (decimal input)
Steps: render
Expected:
  - Input has inputMode="decimal" (for weight with step=0.5)
Classification: Unit
```

#### TC_W301_50: Input has inputMode="numeric" for integer step

```
Pre-condition: step=1 (integer input)
Steps: render
Expected:
  - Input has inputMode="numeric" (for reps with step=1)
Classification: Unit
```

#### TC_W301_51: Warning has role="alert" or aria-live

```
Pre-condition: value=301, warningThreshold=300
Steps: render
Expected:
  - Warning element has role="alert" OR aria-live="polite"
  - Screen reader will announce warning
Classification: Unit
```

---

## 4. COVERAGE MATRIX

| Scenario           | TCs      | Requirement Covered            |
| ------------------ | -------- | ------------------------------ |
| SC_01 Rendering    | TC_01–06 | AC-7, AC-8, AC-9, BR-37, BR-42 |
| SC_02 Tap ±        | TC_07–11 | AC-1                           |
| SC_03 Long-press   | TC_12–19 | AC-2 (500ms/150ms timing)      |
| SC_04 Manual input | TC_20–24 | AC-3                           |
| SC_05 Boundaries   | TC_25–32 | AC-4, AC-5                     |
| SC_06 Warning      | TC_33–37 | AC-6, BR-14                    |
| SC_07 Disabled     | TC_38–40 | Props: disabled                |
| SC_08 Compact      | TC_41–42 | Props: compact                 |
| SC_09 NaN          | TC_43–47 | Robustness                     |
| SC_10 A11y         | TC_48–51 | Accessibility                  |

**Total: 51 test cases, all Unit (Vitest)**

---

## 5. TEST CODE SKELETON

```typescript
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StepperInput } from '@/features/fitness/components/StepperInput';

/* ---------- helpers ---------- */
const defaultProps = {
  value: 50,
  onChange: vi.fn(),
  step: 1,
  testId: 'test-stepper',
};

function renderStepper(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides, onChange: overrides.onChange ?? vi.fn() };
  return { ...render(<StepperInput {...props} />), onChange: props.onChange };
}

function getDecBtn() {
  return screen.getByTestId('test-stepper-decrement');
}
function getIncBtn() {
  return screen.getByTestId('test-stepper-increment');
}
function getInput() {
  return screen.getByTestId('test-stepper-input');
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('StepperInput', () => {
  describe('SC_01: Rendering', () => {
    // TC_01–06
  });

  describe('SC_02: Single Tap', () => {
    // TC_07–11
  });

  describe('SC_03: Long-Press', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });
    afterEach(() => {
      vi.useRealTimers();
    });
    // TC_12–19
    // Pattern:
    // fireEvent.pointerDown(btn)
    // act(() => vi.advanceTimersByTime(500)) // threshold
    // act(() => vi.advanceTimersByTime(150)) // each interval tick
    // fireEvent.pointerUp(btn)
  });

  describe('SC_04: Manual Input', () => {
    // TC_20–24
    // Pattern:
    // await user.clear(getInput());
    // await user.type(getInput(), '75');
    // fireEvent.blur(getInput());
  });

  describe('SC_05: Boundaries', () => {
    // TC_25–32
  });

  describe('SC_06: Warning', () => {
    // TC_33–37
  });

  describe('SC_07: Disabled', () => {
    // TC_38–40
  });

  describe('SC_08: Compact', () => {
    // TC_41–42
  });

  describe('SC_09: NaN Prevention', () => {
    // TC_43–47
  });

  describe('SC_10: Accessibility', () => {
    // TC_48–51
  });
});
```

---

## 6. KEY PATTERNS FOR DEV (TDD Reference)

### 6.1 Long-Press Timer Testing Pattern

```typescript
// From WeightQuickLog.test.tsx — PROVEN pattern in this codebase
it('long press triggers rapid increment', () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const onChange = vi.fn();
  render(<StepperInput value={50} step={1} onChange={onChange} testId="s" />);

  const incBtn = screen.getByTestId('s-increment');
  fireEvent.pointerDown(incBtn);

  // 500ms = hold threshold → first tick
  act(() => { vi.advanceTimersByTime(500); });
  expect(onChange).toHaveBeenCalledWith(51);

  // 150ms × 2 = two more ticks
  act(() => { vi.advanceTimersByTime(300); });
  expect(onChange).toHaveBeenCalledTimes(3);

  fireEvent.pointerUp(incBtn);

  // No more ticks after release
  act(() => { vi.advanceTimersByTime(1000); });
  expect(onChange).toHaveBeenCalledTimes(3);

  vi.useRealTimers();
});
```

### 6.2 Controlled Component Re-render Pattern

StepperInput is controlled (value comes from parent). For multi-tap tests:

```typescript
it('multiple taps accumulate', () => {
  const onChange = vi.fn();
  const { rerender } = render(
    <StepperInput value={10} step={1} onChange={onChange} testId="s" />
  );

  fireEvent.click(screen.getByTestId('s-increment'));
  expect(onChange).toHaveBeenCalledWith(11);

  // Simulate parent updating value
  rerender(<StepperInput value={11} step={1} onChange={onChange} testId="s" />);

  fireEvent.click(screen.getByTestId('s-increment'));
  expect(onChange).toHaveBeenCalledWith(12);
});
```

### 6.3 Floating-Point Precision

Dev MUST use rounding (same as `round1` in DailyWeightInput.tsx):

```typescript
// round to avoid 0.1 + 0.5 = 0.6000000000000001
const round = (n: number, decimals = 1) => Math.round(n * 10 ** decimals) / 10 ** decimals;
```

### 6.4 Long-Press Internal State (Controlled Component)

StepperInput is a CONTROLLED component — `value` comes from parent via props. For long-press rapid increment, the component must track an internal accumulator during the press, since the parent won't re-render between 150ms ticks:

```typescript
// Option A: Internal ref tracks running value during press
const runningValueRef = useRef(value);
// On each tick: runningValueRef.current += step; onChange(runningValueRef.current);
// On pointerUp: sync runningValueRef with props

// Option B: onChange fires each tick, parent debounces re-render
// Simpler but parent must handle rapid updates
```

Dev should choose the approach that keeps onChange calls accurate. Tests expect onChange to be called on EACH tick with the correct accumulated value.

---

## 7. RISK AREAS

| Risk                               | Impact                            | Mitigation                           |
| ---------------------------------- | --------------------------------- | ------------------------------------ |
| Floating-point drift with step=0.5 | Values like 75.50000001 displayed | Explicit rounding in onChange        |
| Timer cleanup on unmount           | Memory leak, stale callbacks      | useEffect cleanup in long-press hook |
| Rapid pointerDown→Up race          | Timer set but never cleared       | Guard in stop callback               |
| NaN propagation from empty input   | Downstream calculations break     | Guard on blur: isNaN → revert        |
| Controlled component + rapid ticks | Value prop stale during press     | Use internal ref for running value   |

---

## 8. LOC BUDGET VERIFICATION

Spec requires ≤150 LOC. Expected breakdown:

- Props interface + types: ~15 LOC
- useLongPress hook (reuse pattern from WeightQuickLog): ~25 LOC
- Component body (state, handlers): ~40 LOC
- JSX render: ~50 LOC
- Exports: ~5 LOC
- **Total estimate: ~135 LOC** ✅

---

**TEST_PLAN_READY**

Dev can use this as TDD input:

1. Create test file with skeleton from §5
2. Implement TCs in order (SC_01 → SC_10)
3. Red → Green → Refactor for each TC
4. Long-press tests use `vi.useFakeTimers` + `fireEvent.pointerDown/Up` pattern
5. All 51 TCs must pass with 100% coverage
