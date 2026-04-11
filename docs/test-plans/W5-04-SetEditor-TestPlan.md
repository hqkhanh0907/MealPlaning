# Test Plan: W5-04 — SetEditor Modal Redesign

> **Task**: TASK-W5-04  
> **Component**: `src/features/fitness/components/SetEditor.tsx`  
> **Test File**: `src/__tests__/SetEditor.test.tsx`  
> **Author**: QA Engineer (Phase 1 — TDD-First)  
> **Date**: 2026-07-05  
> **Status**: Draft v1.0

---

## 1. Scope & Objectives

### 1.1 In-Scope

| Area                | Description                                                                             |
| ------------------- | --------------------------------------------------------------------------------------- |
| Modal rendering     | `ModalBackdrop` integration, `animate-slide-up` entrance, `data-testid="set-editor"`    |
| Weight StepperInput | `step=0.5`, `min=0`, `warningThreshold=300`, `unit="kg"`                                |
| Reps StepperInput   | `step=1`, `min=1`, `unit="rep"`                                                         |
| RPE selector        | 5 radio buttons `[6, 7, 8, 9, 10]`, color progression green→yellow→red, toggle deselect |
| Rest StepperInput   | `step=15`, `min=0`, `unit="s"` (NEW field)                                              |
| Recent weight chips | Quick-select from `recentWeights[]`                                                     |
| Save/Cancel CTAs    | `min-h-12`, correct callback data including new `restSeconds`                           |
| Accessibility       | `aria-pressed`, `aria-label`, `aria-modal`, focus trap (via ModalBackdrop)              |
| i18n                | All labels from `fitness.editor.*` namespace                                            |
| Visibility          | `isVisible=false` → null render                                                         |

### 1.2 Out-of-Scope

- `ModalBackdrop` internal implementation (tested separately)
- `StepperInput` internal hold-to-repeat/blur logic (tested in `StepperInput.test.tsx`)
- `WorkoutLogger` consumer integration
- Native Capacitor/emulator behavior

### 1.3 Constants Reference

```typescript
// src/features/fitness/constants.ts
RPE_OPTIONS = [6, 7, 8, 9, 10];
WEIGHT_INCREMENT = 0.5;
REPS_INCREMENT = 1;
MIN_WEIGHT_KG = 0;
MIN_REPS = 1;
DEFAULT_REST_SECONDS = 90;
```

### 1.4 Interface (Current → Redesigned)

```typescript
// CURRENT onSave signature
onSave: (data: { weight: number; reps: number; rpe?: number }) => void;

// REDESIGNED onSave signature (adds restSeconds)
onSave: (data: { weight: number; reps: number; rpe?: number; restSeconds: number }) => void;

// NEW props expected
interface SetEditorProps {
  initialWeight: number;
  initialReps: number;
  initialRpe?: number;
  initialRestSeconds?: number;  // NEW — defaults to DEFAULT_REST_SECONDS (90)
  recentWeights: number[];
  onSave: (data: { weight: number; reps: number; rpe?: number; restSeconds: number }) => void;
  onCancel: () => void;
  isVisible: boolean;
}
```

---

## 2. Test Environment

| Item            | Value                                                    |
| --------------- | -------------------------------------------------------- |
| Framework       | Vitest + React Testing Library                           |
| Setup           | `src/__tests__/setup.ts` (i18n Vietnamese)               |
| Coverage target | 100% statements, branches, functions, lines              |
| Mocking         | `vi.fn()` for `onSave`, `onCancel`                       |
| User events     | `@testing-library/user-event` for realistic interactions |
| DOM assertions  | `@testing-library/jest-dom` matchers                     |

### 2.1 Default Test Props

```typescript
const defaultProps = {
  initialWeight: 60,
  initialReps: 10,
  initialRpe: undefined as number | undefined,
  initialRestSeconds: 90,
  recentWeights: [50, 55, 60, 65, 70],
  onSave: vi.fn(),
  onCancel: vi.fn(),
  isVisible: true,
};
```

---

## 3. Test Scenarios

### SC_W504_01: Modal Rendering & Structure

**Objective**: Verify SetEditor renders as a bottom sheet via `ModalBackdrop` with correct structure.

| TC ID      | Test Case                                        | Pre-condition      | Steps                     | Expected Result                                                                            |
| ---------- | ------------------------------------------------ | ------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| TC_W504_01 | Renders modal when `isVisible=true`              | Default props      | Render SetEditor          | `[data-testid="set-editor"]` exists in DOM, wrapped in `<dialog>` with `aria-modal="true"` |
| TC_W504_02 | Returns null when `isVisible=false`              | `isVisible: false` | Render SetEditor          | `queryByTestId("set-editor")` returns `null`                                               |
| TC_W504_03 | Modal has `animate-slide-up` entrance class      | Default props      | Render, inspect container | Container `div[data-testid="set-editor"]` has class `animate-slide-up`                     |
| TC_W504_04 | Title displays Vietnamese label                  | Default props      | Render                    | Text "Chỉnh sửa set" visible (`t('fitness.editor.title')`)                                 |
| TC_W504_05 | Close button (X) present with correct aria-label | Default props      | Render                    | `[data-testid="editor-close-button"]` exists with `aria-label="Đóng"`                      |

---

### SC_W504_02: Weight StepperInput

**Objective**: Verify weight field uses `<StepperInput step={0.5} min={0} warningThreshold={300} unit="kg">`.

| TC ID      | Test Case                                 | Pre-condition        | Steps                                            | Expected Result                                                  |
| ---------- | ----------------------------------------- | -------------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| TC_W504_06 | Renders weight stepper with initial value | `initialWeight: 75`  | Render                                           | `[data-testid="weight-stepper-input"]` has value `"75"`          |
| TC_W504_07 | Weight increment by 0.5kg                 | `initialWeight: 60`  | Click `[data-testid="weight-stepper-increment"]` | Value changes to `"60.5"`, `onChange` called with `60.5`         |
| TC_W504_08 | Weight decrement by 0.5kg                 | `initialWeight: 60`  | Click `[data-testid="weight-stepper-decrement"]` | Value changes to `"59.5"`, `onChange` called with `59.5`         |
| TC_W504_09 | Weight cannot go below 0 (min=0)          | `initialWeight: 0`   | Click decrement                                  | Decrement button disabled (`atMin`), value stays `"0"`           |
| TC_W504_10 | Weight at 0.5 → decrement → 0             | `initialWeight: 0.5` | Click decrement                                  | Value changes to `"0"`                                           |
| TC_W504_11 | Weight unit displays "kg"                 | Default props        | Render                                           | `[data-testid="weight-stepper-unit"]` has text `"kg"`            |
| TC_W504_12 | Weight warning at >300kg                  | `initialWeight: 301` | Render                                           | `[data-testid="weight-stepper-warning"]` visible with alert role |
| TC_W504_13 | No weight warning at 300kg                | `initialWeight: 300` | Render                                           | `queryByTestId("weight-stepper-warning")` returns `null`         |
| TC_W504_14 | No weight warning at 100kg (normal)       | `initialWeight: 100` | Render                                           | Warning element absent                                           |

---

### SC_W504_03: Recent Weight Chips

**Objective**: Verify quick-select chips for recent weights.

| TC ID      | Test Case                                 | Pre-condition                                    | Steps           | Expected Result                                                                                |
| ---------- | ----------------------------------------- | ------------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------- |
| TC_W504_15 | Renders recent weight chips               | `recentWeights: [50, 55, 60]`                    | Render          | 3 chip buttons visible with text `50`, `55`, `60`                                              |
| TC_W504_16 | Clicking chip sets weight                 | `initialWeight: 60, recentWeights: [70, 80]`     | Click chip `70` | Weight stepper input value updates to `"70"`                                                   |
| TC_W504_17 | Active chip highlighted (variant=default) | `initialWeight: 60, recentWeights: [50, 60, 70]` | Render          | Chip `60` has selected styling (variant `default`), chips `50` and `70` have `outline` variant |
| TC_W504_18 | No chips section when recentWeights empty | `recentWeights: []`                              | Render          | `queryByTestId("recent-weights-section")` returns `null`                                       |
| TC_W504_19 | Label "Cân nặng gần đây" visible          | `recentWeights: [50]`                            | Render          | Text "Cân nặng gần đây" in DOM                                                                 |

---

### SC_W504_04: Reps StepperInput

**Objective**: Verify reps field uses `<StepperInput step={1} min={1} unit="rep">`.

| TC ID      | Test Case                               | Pre-condition     | Steps                                          | Expected Result                                       |
| ---------- | --------------------------------------- | ----------------- | ---------------------------------------------- | ----------------------------------------------------- |
| TC_W504_20 | Renders reps stepper with initial value | `initialReps: 12` | Render                                         | `[data-testid="reps-stepper-input"]` has value `"12"` |
| TC_W504_21 | Reps increment by 1                     | `initialReps: 10` | Click `[data-testid="reps-stepper-increment"]` | Value → `"11"`                                        |
| TC_W504_22 | Reps decrement by 1                     | `initialReps: 10` | Click `[data-testid="reps-stepper-decrement"]` | Value → `"9"`                                         |
| TC_W504_23 | Reps cannot go below 1 (min=1)          | `initialReps: 1`  | Click decrement                                | Decrement button disabled, value stays `"1"`          |
| TC_W504_24 | Reps unit displays "rep"                | Default props     | Render                                         | `[data-testid="reps-stepper-unit"]` has text `"rep"`  |

---

### SC_W504_05: RPE Selector (5 Radio Buttons)

**Objective**: Verify RPE radio buttons [6, 7, 8, 9, 10] with color coding and toggle behavior.

| TC ID      | Test Case                                        | Pre-condition        | Steps                   | Expected Result                                                                             |
| ---------- | ------------------------------------------------ | -------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| TC_W504_25 | Renders all 5 RPE buttons                        | Default props        | Render                  | `rpe-button-6`, `rpe-button-7`, `rpe-button-8`, `rpe-button-9`, `rpe-button-10` all present |
| TC_W504_26 | RPE buttons show values [6,7,8,9,10]             | Default props        | Render                  | Each button's `textContent` matches its RPE value                                           |
| TC_W504_27 | Select RPE 8 → aria-pressed=true                 | No initial RPE       | Click `rpe-button-8`    | `rpe-button-8` has `aria-pressed="true"`, all others `"false"`                              |
| TC_W504_28 | Toggle same RPE deselects                        | `initialRpe: 8`      | Click `rpe-button-8`    | `rpe-button-8` has `aria-pressed="false"` (toggle off)                                      |
| TC_W504_29 | Switch RPE: 7 → 9                                | `initialRpe: 7`      | Click `rpe-button-9`    | `rpe-button-9` aria-pressed=true, `rpe-button-7` aria-pressed=false                         |
| TC_W504_30 | Initial RPE 10 highlighted                       | `initialRpe: 10`     | Render                  | `rpe-button-10` has `aria-pressed="true"`                                                   |
| TC_W504_31 | RPE color progression: 6=green, 8=yellow, 10=red | Default, select each | Render, inspect classes | RPE 6: green-tinted class, RPE 8: yellow/amber class, RPE 10: red class                     |
| TC_W504_32 | RPE fieldset has correct aria-label              | Default props        | Render                  | `[data-testid="rpe-selector"]` has `aria-label` containing "RPE"                            |

---

### SC_W504_06: Rest Seconds StepperInput (NEW)

**Objective**: Verify rest seconds field uses `<StepperInput step={15} min={0} unit="s">`.

| TC ID      | Test Case                             | Pre-condition             | Steps                                          | Expected Result                                       |
| ---------- | ------------------------------------- | ------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| TC_W504_33 | Renders rest stepper with default 90s | Default props             | Render                                         | `[data-testid="rest-stepper-input"]` has value `"90"` |
| TC_W504_34 | Rest increment by 15s                 | `initialRestSeconds: 90`  | Click `[data-testid="rest-stepper-increment"]` | Value → `"105"`                                       |
| TC_W504_35 | Rest decrement by 15s                 | `initialRestSeconds: 90`  | Click `[data-testid="rest-stepper-decrement"]` | Value → `"75"`                                        |
| TC_W504_36 | Rest cannot go below 0 (min=0)        | `initialRestSeconds: 0`   | Click decrement                                | Decrement button disabled, value stays `"0"`          |
| TC_W504_37 | Rest at 15 → decrement → 0            | `initialRestSeconds: 15`  | Click decrement                                | Value → `"0"`                                         |
| TC_W504_38 | Rest unit displays "s"                | Default props             | Render                                         | `[data-testid="rest-stepper-unit"]` has text `"s"`    |
| TC_W504_39 | Custom initial rest value             | `initialRestSeconds: 120` | Render                                         | Input value = `"120"`                                 |

---

### SC_W504_07: Save Behavior

**Objective**: Verify "Lưu" button fires `onSave` with correct data shape including new `restSeconds`.

| TC ID      | Test Case                       | Pre-condition                                                | Steps                               | Expected Result                                                           |
| ---------- | ------------------------------- | ------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------- |
| TC_W504_40 | Save with defaults              | `initialWeight: 60, initialReps: 10, initialRestSeconds: 90` | Click save                          | `onSave({ weight: 60, reps: 10, rpe: undefined, restSeconds: 90 })`       |
| TC_W504_41 | Save after modifying all fields | Defaults                                                     | +weight, +reps, select RPE 8, +rest | `onSave({ weight: 60.5, reps: 11, rpe: 8, restSeconds: 105 })`            |
| TC_W504_42 | Save enforces min weight=0      | Set weight to -5 somehow                                     | Click save                          | `onSave` receives `weight: 0` (clamped by `Math.max(MIN_WEIGHT_KG, ...)`) |
| TC_W504_43 | Save enforces min reps=1        | Set reps to 0 somehow                                        | Click save                          | `onSave` receives `reps: 1` (clamped by `Math.max(MIN_REPS, ...)`)        |
| TC_W504_44 | Save without RPE                | Defaults, no RPE click                                       | Click save                          | `onSave` receives `rpe: undefined`                                        |
| TC_W504_45 | Save button text is "Lưu"       | Default                                                      | Render                              | Button `[data-testid="save-button"]` text = "Lưu"                         |
| TC_W504_46 | Save button has min-h-12 class  | Default                                                      | Render                              | `save-button` className includes `min-h-12`                               |

---

### SC_W504_08: Cancel & Dismiss Behavior

**Objective**: Verify "Hủy" button, close button, and backdrop dismiss all fire `onCancel`.

| TC ID      | Test Case                        | Pre-condition | Steps                                       | Expected Result                                            |
| ---------- | -------------------------------- | ------------- | ------------------------------------------- | ---------------------------------------------------------- |
| TC_W504_47 | Cancel button calls onCancel     | Default       | Click `[data-testid="cancel-button"]`       | `onCancel` called once                                     |
| TC_W504_48 | Cancel button text is "Hủy"      | Default       | Render                                      | Button text = "Hủy"                                        |
| TC_W504_49 | Cancel button has min-h-12 class | Default       | Render                                      | className includes `min-h-12`                              |
| TC_W504_50 | Close (X) button calls onCancel  | Default       | Click `[data-testid="editor-close-button"]` | `onCancel` called once                                     |
| TC_W504_51 | Backdrop click calls onCancel    | Default       | Click backdrop area (outside modal content) | `onCancel` called once                                     |
| TC_W504_52 | Escape key calls onCancel        | Default       | Press `Escape` key                          | `onCancel` called once (via ModalBackdrop `closeOnEscape`) |

---

### SC_W504_09: Accessibility

**Objective**: Verify WCAG compliance — aria attributes, focus management, semantic structure.

| TC ID      | Test Case                                | Pre-condition            | Steps  | Expected Result                                               |
| ---------- | ---------------------------------------- | ------------------------ | ------ | ------------------------------------------------------------- |
| TC_W504_53 | Dialog has aria-modal=true               | Default                  | Render | Nearest `<dialog>` ancestor has `aria-modal="true"`           |
| TC_W504_54 | Editor container has aria-label          | Default                  | Render | `[data-testid="set-editor"]` has `aria-label="Chỉnh sửa set"` |
| TC_W504_55 | RPE buttons have aria-pressed            | Default, `initialRpe: 7` | Render | `rpe-button-7` → `aria-pressed="true"`, others → `"false"`    |
| TC_W504_56 | RPE fieldset wraps buttons               | Default                  | Render | `[data-testid="rpe-selector"]` is a `<fieldset>` element      |
| TC_W504_57 | Weight stepper label contains "Cân nặng" | Default                  | Render | Weight label text includes "Cân nặng"                         |

---

### SC_W504_10: i18n Labels

**Objective**: Verify all Vietnamese labels render correctly.

| TC ID      | Test Case                    | Pre-condition | Steps  | Expected Result                |
| ---------- | ---------------------------- | ------------- | ------ | ------------------------------ |
| TC_W504_58 | Title "Chỉnh sửa set"        | Default       | Render | Heading text = "Chỉnh sửa set" |
| TC_W504_59 | Weight label "Cân nặng (kg)" | Default       | Render | Label text includes "Cân nặng" |
| TC_W504_60 | Reps label "Số lần"          | Default       | Render | Label text = "Số lần"          |
| TC_W504_61 | RPE label                    | Default       | Render | Label text = "RPE"             |
| TC_W504_62 | Save text "Lưu"              | Default       | Render | Save button text = "Lưu"       |
| TC_W504_63 | Cancel text "Hủy"            | Default       | Render | Cancel button text = "Hủy"     |

---

## 4. Test Data Matrix

### 4.1 Weight Edge Cases

| Input                  | After Action    | Expected State                      |
| ---------------------- | --------------- | ----------------------------------- |
| `initialWeight: 0`     | Render          | Input = `"0"`, decrement disabled   |
| `initialWeight: 0`     | Click increment | Input = `"0.5"`                     |
| `initialWeight: 0.5`   | Click decrement | Input = `"0"`                       |
| `initialWeight: 300`   | Render          | No warning (threshold is >, not >=) |
| `initialWeight: 300.5` | Render          | Warning visible                     |
| `initialWeight: 999`   | Render          | Warning visible                     |

### 4.2 Reps Edge Cases

| Input              | After Action    | Expected State     |
| ------------------ | --------------- | ------------------ |
| `initialReps: 1`   | Render          | Decrement disabled |
| `initialReps: 1`   | Click increment | Input = `"2"`      |
| `initialReps: 100` | Click decrement | Input = `"99"`     |

### 4.3 Rest Seconds Edge Cases

| Input                           | After Action    | Expected State                          |
| ------------------------------- | --------------- | --------------------------------------- |
| `initialRestSeconds: 0`         | Render          | Decrement disabled                      |
| `initialRestSeconds: 0`         | Click increment | Input = `"15"`                          |
| `initialRestSeconds: 15`        | Click decrement | Input = `"0"`                           |
| `initialRestSeconds: 300`       | Click increment | Input = `"315"` (no max)                |
| `initialRestSeconds: undefined` | Render          | Defaults to `90` (DEFAULT_REST_SECONDS) |

### 4.4 RPE Selection Matrix

| Initial RPE | Action                 | Expected RPE State           |
| ----------- | ---------------------- | ---------------------------- |
| `undefined` | Click 6                | `6` selected                 |
| `undefined` | Click 10               | `10` selected                |
| `8`         | Click 8 (same)         | `undefined` (toggled off)    |
| `7`         | Click 9 (different)    | `9` selected, `7` deselected |
| `6`         | Click 6, then click 10 | `10` selected                |

### 4.5 Save Payload Combinations

| Weight | Reps | RPE       | Rest | Expected onSave Arg                                         |
| ------ | ---- | --------- | ---- | ----------------------------------------------------------- |
| 60     | 10   | undefined | 90   | `{ weight: 60, reps: 10, rpe: undefined, restSeconds: 90 }` |
| 60.5   | 11   | 8         | 105  | `{ weight: 60.5, reps: 11, rpe: 8, restSeconds: 105 }`      |
| 0      | 1    | 6         | 0    | `{ weight: 0, reps: 1, rpe: 6, restSeconds: 0 }`            |
| 100    | 5    | 10        | 180  | `{ weight: 100, reps: 5, rpe: 10, restSeconds: 180 }`       |

---

## 5. Test-to-Acceptance-Criteria Traceability

| AC#  | Acceptance Criteria                                                     | Covering TCs               |
| ---- | ----------------------------------------------------------------------- | -------------------------- |
| AC-1 | Renders as bottom sheet via `ModalBackdrop`                             | TC_01, TC_02, TC_53        |
| AC-2 | Weight: `StepperInput step=0.5, min=0, warningThreshold=300, unit="kg"` | TC_06–TC_14                |
| AC-3 | Reps: `StepperInput step=1, min=1, unit="rep"`                          | TC_20–TC_24                |
| AC-4 | RPE: 5 radio buttons with color green→yellow→red                        | TC_25–TC_32                |
| AC-5 | Rest: `StepperInput step=15, min=0, unit="s"`                           | TC_33–TC_39                |
| AC-6 | "Lưu" + "Hủy" buttons with `min-h-12`                                   | TC_45, TC_46, TC_48, TC_49 |
| AC-7 | `animate-slide-up` entrance                                             | TC_03                      |
| AC-8 | 100% test coverage                                                      | All TCs collectively       |

| BR#   | Business Rule                | Covering TCs        |
| ----- | ---------------------------- | ------------------- |
| BR-14 | Weight 0.5kg step            | TC_07, TC_08, TC_10 |
| BR-15 | Reps 1 step                  | TC_21, TC_22, TC_23 |
| BR-16 | RPE options [6, 7, 8, 9, 10] | TC_25, TC_26        |

---

## 6. data-testid Contract

The redesigned SetEditor MUST expose these `data-testid` values. The Dev agent MUST NOT change the testid naming of stepper sub-elements (they follow `{testId}-decrement`, `{testId}-input`, `{testId}-increment`, `{testId}-unit`, `{testId}-warning` convention from `StepperInput`).

### 6.1 Component-Level testids

| data-testid              | Element                   | Owner     |
| ------------------------ | ------------------------- | --------- |
| `set-editor`             | Root container `<div>`    | SetEditor |
| `editor-close-button`    | X close button            | SetEditor |
| `rpe-selector`           | RPE `<fieldset>`          | SetEditor |
| `rpe-button-{N}`         | RPE option (N=6,7,8,9,10) | SetEditor |
| `recent-weights-section` | Recent weights container  | SetEditor |
| `weight-chip-{N}`        | Quick weight button       | SetEditor |
| `save-button`            | "Lưu" CTA                 | SetEditor |
| `cancel-button`          | "Hủy" CTA                 | SetEditor |

### 6.2 StepperInput testid Mapping

| Stepper | testId prop        | Generated sub-testids                                                                                                                             |
| ------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weight  | `"weight-stepper"` | `weight-stepper`, `weight-stepper-decrement`, `weight-stepper-input`, `weight-stepper-increment`, `weight-stepper-unit`, `weight-stepper-warning` |
| Reps    | `"reps-stepper"`   | `reps-stepper`, `reps-stepper-decrement`, `reps-stepper-input`, `reps-stepper-increment`, `reps-stepper-unit`                                     |
| Rest    | `"rest-stepper"`   | `rest-stepper`, `rest-stepper-decrement`, `rest-stepper-input`, `rest-stepper-increment`, `rest-stepper-unit`                                     |

> **Note on migration**: Current tests use `weight-input`, `weight-plus-button`, `weight-minus-button` etc. (inline implementation). After redesign these change to `weight-stepper-input`, `weight-stepper-increment`, `weight-stepper-decrement` (StepperInput convention). The test file must be **fully rewritten** to match new testids.

---

## 7. Coverage Strategy

### 7.1 Branch Coverage Targets

| Branch                                           | How to Cover        |
| ------------------------------------------------ | ------------------- |
| `isVisible=false` → null                         | TC_02               |
| `isVisible=true` → render                        | TC_01               |
| `recentWeights.length > 0` → show chips          | TC_15               |
| `recentWeights.length === 0` → hide chips        | TC_18               |
| `rpe === value` → deselect (toggle)              | TC_28               |
| `rpe !== value` → select                         | TC_27               |
| `weight === w` → chip highlighted                | TC_17               |
| `initialRpe` defined → pre-selected              | TC_30               |
| `initialRpe` undefined → none selected           | TC_25               |
| `warningThreshold` exceeded → warning            | TC_12               |
| `warningThreshold` not exceeded → no warning     | TC_13, TC_14        |
| `initialRestSeconds` undefined → default 90      | TC_33 (via §4.3)    |
| min boundary clamping (weight=0, reps=1, rest=0) | TC_09, TC_23, TC_36 |

### 7.2 Files to Cover

| File            | Target                                 | Strategy             |
| --------------- | -------------------------------------- | -------------------- |
| `SetEditor.tsx` | 100% stmts, branches, functions, lines | All TCs in this plan |

StepperInput internal coverage is handled by `StepperInput.test.tsx` (already 100%). SetEditor tests only verify StepperInput **integration** (correct props passed, callbacks wired).

---

## 8. Mock Strategy

```typescript
// No store mocks needed — SetEditor is a pure presentational component.
// Mocks required:
vi.fn(); // onSave, onCancel callbacks

// i18n: Loaded in setup.ts with Vietnamese translations.
// No need to mock — real translations used.

// ModalBackdrop: NOT mocked — rendered in full.
// Reason: Need to verify dialog structure, aria-modal, backdrop click, Escape key.

// StepperInput: NOT mocked — rendered in full.
// Reason: Need to verify stepper integration (clicks → state → save payload).
```

---

## 9. Test Skeleton (Implementation Guide for Dev)

```typescript
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SetEditor } from '../features/fitness/components/SetEditor';

afterEach(cleanup);

const defaultProps = {
  initialWeight: 60,
  initialReps: 10,
  initialRpe: undefined as number | undefined,
  initialRestSeconds: 90,
  recentWeights: [50, 55, 60, 65, 70],
  onSave: vi.fn(),
  onCancel: vi.fn(),
  isVisible: true,
};

function renderEditor(overrides: Partial<typeof defaultProps> = {}) {
  const props = {
    ...defaultProps,
    ...overrides,
    onSave: overrides.onSave ?? vi.fn(),
    onCancel: overrides.onCancel ?? vi.fn(),
  };
  const result = render(<SetEditor {...props} />);
  return { ...result, props };
}

/* ================================================================== */
/* SC_W504_01: Modal Rendering & Structure                             */
/* ================================================================== */
describe('SC_W504_01: Modal Rendering & Structure', () => {
  it('TC_W504_01: renders modal when isVisible=true', () => {
    renderEditor();
    expect(screen.getByTestId('set-editor')).toBeInTheDocument();
  });

  it('TC_W504_02: returns null when isVisible=false', () => {
    renderEditor({ isVisible: false });
    expect(screen.queryByTestId('set-editor')).not.toBeInTheDocument();
  });

  it('TC_W504_03: modal container has animate-slide-up class', () => { /* ... */ });
  it('TC_W504_04: title displays "Chỉnh sửa set"', () => { /* ... */ });
  it('TC_W504_05: close button has aria-label "Đóng"', () => { /* ... */ });
});

/* ================================================================== */
/* SC_W504_02: Weight StepperInput                                     */
/* ================================================================== */
describe('SC_W504_02: Weight StepperInput', () => {
  it('TC_W504_06: renders initial weight value', () => { /* ... */ });
  it('TC_W504_07: increment adds 0.5kg', () => { /* ... */ });
  it('TC_W504_08: decrement subtracts 0.5kg', () => { /* ... */ });
  it('TC_W504_09: weight=0 disables decrement', () => { /* ... */ });
  it('TC_W504_10: weight 0.5→0 on decrement', () => { /* ... */ });
  it('TC_W504_11: unit displays "kg"', () => { /* ... */ });
  it('TC_W504_12: warning at >300kg', () => { /* ... */ });
  it('TC_W504_13: no warning at 300kg', () => { /* ... */ });
  it('TC_W504_14: no warning at 100kg', () => { /* ... */ });
});

/* ================================================================== */
/* SC_W504_03: Recent Weight Chips                                     */
/* ================================================================== */
describe('SC_W504_03: Recent Weight Chips', () => {
  it('TC_W504_15: renders chips for each recent weight', () => { /* ... */ });
  it('TC_W504_16: clicking chip updates weight', () => { /* ... */ });
  it('TC_W504_17: active chip has default variant', () => { /* ... */ });
  it('TC_W504_18: no chips section when empty', () => { /* ... */ });
  it('TC_W504_19: label "Cân nặng gần đây" visible', () => { /* ... */ });
});

/* ================================================================== */
/* SC_W504_04: Reps StepperInput                                       */
/* ================================================================== */
describe('SC_W504_04: Reps StepperInput', () => {
  it('TC_W504_20: renders initial reps value', () => { /* ... */ });
  it('TC_W504_21: increment adds 1', () => { /* ... */ });
  it('TC_W504_22: decrement subtracts 1', () => { /* ... */ });
  it('TC_W504_23: reps=1 disables decrement (min=1)', () => { /* ... */ });
  it('TC_W504_24: unit displays "rep"', () => { /* ... */ });
});

/* ================================================================== */
/* SC_W504_05: RPE Selector                                            */
/* ================================================================== */
describe('SC_W504_05: RPE Selector', () => {
  it('TC_W504_25: renders 5 RPE buttons [6,7,8,9,10]', () => { /* ... */ });
  it('TC_W504_26: buttons display correct values', () => { /* ... */ });
  it('TC_W504_27: selecting RPE sets aria-pressed=true', () => { /* ... */ });
  it('TC_W504_28: toggling same RPE deselects', () => { /* ... */ });
  it('TC_W504_29: switching RPE from 7→9', () => { /* ... */ });
  it('TC_W504_30: initial RPE 10 highlighted', () => { /* ... */ });
  it('TC_W504_31: RPE color progression classes', () => { /* ... */ });
  it('TC_W504_32: fieldset has RPE aria-label', () => { /* ... */ });
});

/* ================================================================== */
/* SC_W504_06: Rest Seconds StepperInput                               */
/* ================================================================== */
describe('SC_W504_06: Rest Seconds StepperInput', () => {
  it('TC_W504_33: renders default 90s', () => { /* ... */ });
  it('TC_W504_34: increment adds 15s', () => { /* ... */ });
  it('TC_W504_35: decrement subtracts 15s', () => { /* ... */ });
  it('TC_W504_36: rest=0 disables decrement', () => { /* ... */ });
  it('TC_W504_37: rest 15→0 on decrement', () => { /* ... */ });
  it('TC_W504_38: unit displays "s"', () => { /* ... */ });
  it('TC_W504_39: custom initial rest value', () => { /* ... */ });
});

/* ================================================================== */
/* SC_W504_07: Save Behavior                                           */
/* ================================================================== */
describe('SC_W504_07: Save Behavior', () => {
  it('TC_W504_40: save with defaults', () => { /* ... */ });
  it('TC_W504_41: save after modifying all fields', () => { /* ... */ });
  it('TC_W504_42: save enforces min weight=0', () => { /* ... */ });
  it('TC_W504_43: save enforces min reps=1', () => { /* ... */ });
  it('TC_W504_44: save without RPE → undefined', () => { /* ... */ });
  it('TC_W504_45: save button text "Lưu"', () => { /* ... */ });
  it('TC_W504_46: save button has min-h-12', () => { /* ... */ });
});

/* ================================================================== */
/* SC_W504_08: Cancel & Dismiss                                        */
/* ================================================================== */
describe('SC_W504_08: Cancel & Dismiss', () => {
  it('TC_W504_47: cancel button calls onCancel', () => { /* ... */ });
  it('TC_W504_48: cancel button text "Hủy"', () => { /* ... */ });
  it('TC_W504_49: cancel button has min-h-12', () => { /* ... */ });
  it('TC_W504_50: close (X) button calls onCancel', () => { /* ... */ });
  it('TC_W504_51: backdrop click calls onCancel', () => { /* ... */ });
  it('TC_W504_52: Escape key calls onCancel', () => { /* ... */ });
});

/* ================================================================== */
/* SC_W504_09: Accessibility                                           */
/* ================================================================== */
describe('SC_W504_09: Accessibility', () => {
  it('TC_W504_53: dialog has aria-modal=true', () => { /* ... */ });
  it('TC_W504_54: editor has aria-label', () => { /* ... */ });
  it('TC_W504_55: RPE buttons have correct aria-pressed', () => { /* ... */ });
  it('TC_W504_56: RPE fieldset element', () => { /* ... */ });
  it('TC_W504_57: weight label contains "Cân nặng"', () => { /* ... */ });
});

/* ================================================================== */
/* SC_W504_10: i18n Labels                                             */
/* ================================================================== */
describe('SC_W504_10: i18n Labels', () => {
  it('TC_W504_58: title "Chỉnh sửa set"', () => { /* ... */ });
  it('TC_W504_59: weight label', () => { /* ... */ });
  it('TC_W504_60: reps label "Số lần"', () => { /* ... */ });
  it('TC_W504_61: RPE label', () => { /* ... */ });
  it('TC_W504_62: save text "Lưu"', () => { /* ... */ });
  it('TC_W504_63: cancel text "Hủy"', () => { /* ... */ });
});
```

---

## 10. Risks & Mitigations

| #   | Risk                                                                  | Impact                                                    | Mitigation                                                                                                                   |
| --- | --------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| R1  | StepperInput `pointerDown` events not testable with `fireEvent.click` | Stepper won't actually change value via click in test     | Use `fireEvent.pointerDown` + `fireEvent.pointerUp` for StepperInput buttons, OR verify `onChange` callback directly         |
| R2  | `ModalBackdrop` scroll lock interferes with test cleanup              | Body style leaks across tests                             | Ensure `cleanup()` in `afterEach`; ModalBackdrop teardown restores body styles                                               |
| R3  | Backdrop click target ambiguous                                       | May click content instead of backdrop                     | Click the backdrop `<button>` directly (sibling of content wrapper), not just "outside"                                      |
| R4  | `animate-slide-up` class on wrong element                             | Class may be on wrapper, not `[data-testid="set-editor"]` | Test plan specifies checking `set-editor` container; Dev may put class on parent — adjust selector if needed                 |
| R5  | RPE color classes not yet defined in constants                        | TC_31 will fail if Dev uses inline styles                 | If colors are inline classes (Tailwind), check `className` contains expected color token; if CSS variables, adjust assertion |
| R6  | `initialRestSeconds` prop doesn't exist yet                           | Test scaffold references prop that Dev must add           | This is TDD — test defines the contract, Dev implements to match                                                             |

---

## 11. Implementation Notes for Dev

1. **StepperInput interaction pattern**: StepperInput uses `onPointerDown`/`onPointerUp` (not `onClick`). For tests to work with `fireEvent`, the recommended approach:
   - Use `fireEvent.pointerDown(button)` followed by `fireEvent.pointerUp(button)` — this triggers `startHold()` → `tick()` → `onChange()`.
   - OR wrap StepperInput value management in SetEditor state and verify via save payload.

2. **testid migration**: Current tests reference `weight-input`, `weight-plus-button`, etc. These will change to `weight-stepper-input`, `weight-stepper-increment`, etc. Test file is a **full rewrite**.

3. **RPE color coding**: The test plan expects distinct color classes per RPE value. Suggested implementation:

   ```typescript
   const RPE_COLORS: Record<number, string> = {
     6: 'bg-success/15 text-success border-success/30', // green
     7: 'bg-success/10 text-success border-success/20', // light green
     8: 'bg-warning/15 text-warning border-warning/30', // yellow/amber
     9: 'bg-warning/10 text-error border-error/20', // orange-ish
     10: 'bg-error/15 text-error border-error/30', // red
   };
   ```

   TC_31 will check for color token presence in `className` (e.g., `text-success`, `text-warning`, `text-error`).

4. **Rest seconds default**: If `initialRestSeconds` prop is omitted, component MUST default to `DEFAULT_REST_SECONDS` (90). Use `initialRestSeconds = DEFAULT_REST_SECONDS` in destructuring.

5. **onSave shape change**: Adding `restSeconds` to onSave payload is a **breaking change** for `WorkoutLogger.handleEditSetSave`. The consumer must be updated — but that is OUT OF SCOPE for this task (SetEditor only). Dev should update the type signature; consumer update is separate.

---

## 12. Test Count Summary

| Scenario                              | Count  |
| ------------------------------------- | ------ |
| SC_W504_01: Modal Rendering           | 5      |
| SC_W504_02: Weight StepperInput       | 9      |
| SC_W504_03: Recent Weight Chips       | 5      |
| SC_W504_04: Reps StepperInput         | 5      |
| SC_W504_05: RPE Selector              | 8      |
| SC_W504_06: Rest Seconds StepperInput | 7      |
| SC_W504_07: Save Behavior             | 7      |
| SC_W504_08: Cancel & Dismiss          | 6      |
| SC_W504_09: Accessibility             | 5      |
| SC_W504_10: i18n Labels               | 6      |
| **TOTAL**                             | **63** |

---

## Appendix A: Existing Test Migration Map

The current `SetEditor.test.tsx` has 31 tests. Below maps old tests to new TCs:

| Old Test                                  | New TC       | Change                                                                                                |
| ----------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| renders the editor when isVisible is true | TC_01        | testid unchanged                                                                                      |
| renders nothing when isVisible is false   | TC_02        | Same                                                                                                  |
| displays initial weight value             | TC_06        | testid: `weight-input` → `weight-stepper-input`                                                       |
| +0.5kg button increments weight           | TC_07        | testid: `weight-plus-button` → `weight-stepper-increment`; event: `click` → `pointerDown`+`pointerUp` |
| -0.5kg button decrements weight           | TC_08        | Same migration                                                                                        |
| weight does not go below 0                | TC_09        | Check `disabled` attribute instead of clicking twice                                                  |
| renders RPE pill buttons 6 through 10     | TC_25        | Same                                                                                                  |
| selecting an RPE value highlights it      | TC_27        | Check `aria-pressed` instead of className                                                             |
| toggling same RPE value deselects it      | TC_28        | Same                                                                                                  |
| save button calls onSave                  | TC_40, TC_41 | Add `restSeconds` in expected payload                                                                 |
| cancel button calls onCancel              | TC_47        | Same                                                                                                  |
| close (X) button calls onCancel           | TC_50        | Same                                                                                                  |
| **NEW: rest seconds tests**               | TC_33–TC_39  | Entirely new                                                                                          |
| **NEW: backdrop dismiss**                 | TC_51        | New                                                                                                   |
| **NEW: Escape key dismiss**               | TC_52        | New                                                                                                   |
| **NEW: RPE color progression**            | TC_31        | New                                                                                                   |
| **REMOVED: direct input change/blur**     | —            | Handled by StepperInput internally                                                                    |
