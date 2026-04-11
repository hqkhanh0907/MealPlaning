# W5-03 — Touch Target Audit + Stagger Animations: Test Plan

> **Author**: QA Engineer (Senior)
> **Task**: TASK-W5-03 — Cross-cutting touch target audit, stagger animation keyframes, focus ring compliance
> **Scope**: CSS class verification ONLY — no behavioral changes expected
> **Test Framework**: Vitest + React Testing Library
> **Target Coverage**: 100% for new/modified code

---

## 1. Test Strategy

### 1.1 Scope

| In Scope                                                                                          | Out of Scope                                                         |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `@keyframes slide-up`, `fade-in`, `scale-in` defined in index.css                                 | Animation visual rendering (requires emulator)                       |
| `.animate-stagger-{1-5}` utility classes with correct delays                                      | Pixel-perfect animation timing (browser-dependent)                   |
| Touch target compliance (`min-h-12`) on all 8 owned components                                    | Touch targets in components NOT in owned files list                  |
| `active:scale-[0.98] motion-reduce:transform-none` on interactive elements                        | Behavioral regression (task explicitly states NO behavioral changes) |
| `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` on interactive elements | Keyboard navigation flow testing (requires E2E)                      |
| `prefers-reduced-motion` disables animations                                                      | Visual animation verification (requires emulator/browser)            |
| Regression: all existing tests pass unchanged                                                     | Other fitness components not in owned list                           |

### 1.2 Test Approach

1. **CSS class assertion**: Render each component → query interactive elements by `data-testid` or role → assert `className` contains required classes
2. **Keyframe verification**: Parse `index.css` file content → verify `@keyframes` declarations exist with correct names and properties
3. **Stagger verification**: Parse `index.css` → verify `.animate-stagger-{1-5}` classes with `animation-delay: {n*30}ms`
4. **Reduced motion**: Verify `motion-reduce:transform-none` present on all elements that have `active:scale-*`
5. **Regression**: Run full `npm run test` — 0 new failures expected

### 1.3 Environment

| Item           | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| Framework      | Vitest 3.x + @testing-library/react                                         |
| Mock strategy  | `vi.mock('react-i18next')`, `vi.mock('lucide-react')` per existing patterns |
| DOM assertions | `@testing-library/jest-dom` matchers (`toHaveClass`, `toBeInTheDocument`)   |
| CSS file tests | `fs.readFileSync` on `src/index.css` — no DOM rendering needed              |

### 1.4 Key Constants

| Constant                   | Value                                                                     | Rationale                                      |
| -------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------- |
| Min touch target (buttons) | `min-h-12` (48px = 12 × 4px)                                              | WCAG 2.5.8 / Material Design 48dp              |
| Min touch target (pills)   | `min-h-11` (44px = 11 × 4px)                                              | AC3 exception for pill elements                |
| Active feedback            | `active:scale-[0.98]`                                                     | AC4 specification                              |
| Motion safety              | `motion-reduce:transform-none`                                            | AC4 — disables scale on prefers-reduced-motion |
| Focus ring                 | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` | AC5 specification                              |
| Stagger increment          | 30ms                                                                      | AC2 specification                              |
| Max total animation time   | ≤ 350ms                                                                   | QA Focus constraint                            |

---

## 2. Pre-Audit Findings (Current State)

### 2.1 Component-Level Gap Analysis

| Component               | Interactive Elements                                                 | Touch Target Gap                                   | Active Scale Gap                                     | Focus Ring Gap                                       |
| ----------------------- | -------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| **SessionTabs**         | 5 buttons (tab, delete-X, add, confirm-delete, cancel-delete)        | `min-h-[44px]` → need `min-h-12`                   | Has `0.97` → need `0.98`; 3 buttons missing entirely | Delete-X uses `ring-white` not `ring-ring`           |
| **AddSessionModal**     | 6 buttons (strength/cardio/freestyle, back, create) + 7 muscle pills | NO `min-h` on option buttons; back=`h-11 w-11`     | ALL missing                                          | ALL missing                                          |
| **CustomExerciseModal** | 2 buttons (cancel/save) + 2 selects                                  | `min-h-[44px]` → need `min-h-12`                   | ALL missing                                          | Buttons ✅; selects ✅                               |
| **DayAssignmentSheet**  | 7 day-option buttons                                                 | NO `min-h`                                         | ALL missing                                          | ✅ (has ring-ring + ring-offset-2)                   |
| **SwapExerciseSheet**   | N swap-item buttons + search input                                   | `min-h-11` on items (pills OK); search needs audit | ALL missing                                          | Items partial (no `outline-none` prefix)             |
| **QuickConfirmCard**    | 2 buttons (customize/confirm)                                        | `p-2` only (~32px!) → need `min-h-12 min-w-12`     | ALL missing                                          | Uses `ring-3 ring-ring/50` → need `ring-2 ring-ring` |
| **DeloadModal**         | 2 buttons (accept/override)                                          | `min-h-[44px]` → need `min-h-12`                   | ALL missing                                          | Accept uses `ring-warning` → need `ring-ring`        |
| **SplitChangeConfirm**  | 2 shadcn Buttons (cancel/confirm)                                    | Depends on `<Button>` base class                   | ALL missing                                          | Inherits from shadcn Button                          |

### 2.2 index.css Gap Analysis

| Item                              | Current State                                               | Required                          |
| --------------------------------- | ----------------------------------------------------------- | --------------------------------- |
| `@keyframes slide-up`             | ❌ Missing                                                  | Translate Y animation             |
| `@keyframes fade-in`              | ❌ Missing                                                  | Opacity 0→1 animation             |
| `@keyframes scale-in`             | ❌ Missing                                                  | Scale 0.95→1 + opacity animation  |
| `.animate-stagger-1` through `-5` | ❌ Missing                                                  | `animation-delay: 30ms` → `150ms` |
| `@keyframes pulse-subtle`         | ✅ Exists (line 285)                                        | Keep unchanged                    |
| `@keyframes loading-bar`          | ✅ Exists (line 568)                                        | Keep unchanged                    |
| `prefers-reduced-motion`          | ✅ Partial (line 629: `animation-duration: 0ms !important`) | Verify covers new keyframes       |

---

## 3. Test Scenarios

### Scenario A: Keyframe Definitions in index.css

Verify all 3 required `@keyframes` are defined with valid CSS properties.

### Scenario B: Stagger Utility Classes

Verify `.animate-stagger-{1-5}` classes exist with correct `animation-delay` values at 30ms increments.

### Scenario C: Reduced Motion Global Rule

Verify `prefers-reduced-motion: reduce` media query disables new animations.

### Scenario D: Touch Target Compliance — Buttons (min-h-12)

Verify every interactive `<button>` in audited components has `min-h-12` class (48px).

### Scenario E: Touch Target Compliance — Pills (min-h-11)

Verify pill-style toggle buttons (muscle groups, swap items) have `min-h-11` class (44px).

### Scenario F: Active Press Feedback

Verify `active:scale-[0.98]` present on all interactive buttons in audited components.

### Scenario G: Motion-Reduce Safety on Scale

Verify `motion-reduce:transform-none` accompanies every `active:scale-[0.98]`.

### Scenario H: Focus Ring Compliance

Verify `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` on all interactive elements.

### Scenario I: Regression — No Behavioral Changes

Verify all existing tests pass without modification (click handlers, props, rendering unchanged).

---

## 4. Test Cases

### Scenario A: Keyframe Definitions

#### TC_W503_01 — `@keyframes slide-up` defined correctly

| Field               | Value                                                                                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_01                                                                                                                                                                                                                               |
| **Scenario**        | A — Keyframe Definitions                                                                                                                                                                                                                 |
| **Pre-conditions**  | `src/index.css` file exists and is readable                                                                                                                                                                                              |
| **Steps**           | 1. Read `src/index.css` file content as string<br>2. Search for `@keyframes slide-up` declaration<br>3. Verify it contains `transform: translateY(...)` property<br>4. Verify it transitions from a positive Y offset to `translateY(0)` |
| **Expected Result** | `@keyframes slide-up` block exists with `from { transform: translateY(N) }` → `to { transform: translateY(0) }` where N > 0 (e.g., `8px` or `0.5rem`)                                                                                    |
| **Test Type**       | Static file parse                                                                                                                                                                                                                        |

#### TC_W503_02 — `@keyframes fade-in` defined correctly

| Field               | Value                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_02                                                                                                                                                              |
| **Scenario**        | A — Keyframe Definitions                                                                                                                                                |
| **Pre-conditions**  | `src/index.css` file exists                                                                                                                                             |
| **Steps**           | 1. Read `src/index.css`<br>2. Search for `@keyframes fade-in`<br>3. Verify it contains `opacity` property<br>4. Verify it transitions from `opacity: 0` to `opacity: 1` |
| **Expected Result** | `@keyframes fade-in` block exists with `from { opacity: 0 }` → `to { opacity: 1 }`                                                                                      |
| **Test Type**       | Static file parse                                                                                                                                                       |

#### TC_W503_03 — `@keyframes scale-in` defined correctly

| Field               | Value                                                                                                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**              | TC_W503_03                                                                                                                                                                                                                     |
| **Scenario**        | A — Keyframe Definitions                                                                                                                                                                                                       |
| **Pre-conditions**  | `src/index.css` file exists                                                                                                                                                                                                    |
| **Steps**           | 1. Read `src/index.css`<br>2. Search for `@keyframes scale-in`<br>3. Verify it contains both `transform: scale(...)` and `opacity` properties<br>4. Verify it transitions from `scale(0.95) opacity:0` to `scale(1) opacity:1` |
| **Expected Result** | `@keyframes scale-in` block exists with combined scale + opacity transition                                                                                                                                                    |
| **Test Type**       | Static file parse                                                                                                                                                                                                              |

#### TC_W503_04 — Existing keyframes unchanged

| Field               | Value                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **ID**              | TC_W503_04                                                                                                                     |
| **Scenario**        | A — Keyframe Definitions                                                                                                       |
| **Pre-conditions**  | `src/index.css` with existing `pulse-subtle` and `loading-bar`                                                                 |
| **Steps**           | 1. Read `src/index.css`<br>2. Verify `@keyframes pulse-subtle` still exists<br>3. Verify `@keyframes loading-bar` still exists |
| **Expected Result** | Both pre-existing keyframes remain intact                                                                                      |
| **Test Type**       | Static file parse                                                                                                              |

---

### Scenario B: Stagger Utility Classes

#### TC_W503_05 — `.animate-stagger-{1-5}` classes with correct delays

| Field               | Value                                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_05                                                                                                                                                                               |
| **Scenario**        | B — Stagger Utilities                                                                                                                                                                    |
| **Pre-conditions**  | `src/index.css` file exists                                                                                                                                                              |
| **Steps**           | 1. Read `src/index.css`<br>2. For each N in [1, 2, 3, 4, 5]:<br>&nbsp;&nbsp;a. Verify `.animate-stagger-{N}` class exists<br>&nbsp;&nbsp;b. Verify it sets `animation-delay: {N * 30}ms` |
| **Expected Result** | `.animate-stagger-1` = 30ms, `.animate-stagger-2` = 60ms, `.animate-stagger-3` = 90ms, `.animate-stagger-4` = 120ms, `.animate-stagger-5` = 150ms                                        |
| **Test Type**       | Static file parse                                                                                                                                                                        |

#### TC_W503_06 — Max stagger delay ≤ 350ms total animation budget

| Field               | Value                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_06                                                                                                                                                              |
| **Scenario**        | B — Stagger Utilities                                                                                                                                                   |
| **Pre-conditions**  | Stagger classes defined                                                                                                                                                 |
| **Steps**           | 1. Parse max delay: `animate-stagger-5` = 150ms<br>2. Assume animation duration ≤ 200ms (standard entrance)<br>3. Calculate total: 150ms delay + 200ms duration = 350ms |
| **Expected Result** | Total animation time (max stagger delay + animation duration) ≤ 350ms                                                                                                   |
| **Test Type**       | Calculation verification                                                                                                                                                |

---

### Scenario C: Reduced Motion

#### TC_W503_07 — `prefers-reduced-motion: reduce` disables new animations

| Field               | Value                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**              | TC_W503_07                                                                                                                                                                                                                                       |
| **Scenario**        | C — Reduced Motion                                                                                                                                                                                                                               |
| **Pre-conditions**  | `src/index.css` with new keyframes                                                                                                                                                                                                               |
| **Steps**           | 1. Read `src/index.css`<br>2. Verify `@media (prefers-reduced-motion: reduce)` block exists<br>3. Verify it sets `animation-duration: 0ms` or `animation: none` globally<br>4. Verify it covers all new keyframes (no animation-name exceptions) |
| **Expected Result** | All animations (including `slide-up`, `fade-in`, `scale-in`) are disabled when user prefers reduced motion                                                                                                                                       |
| **Test Type**       | Static file parse                                                                                                                                                                                                                                |

---

### Scenario D: Touch Target — Buttons (min-h-12)

#### TC_W503_08 — SessionTabs: All 5 button types have `min-h-12`

| Field               | Value                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_08                                                                                                                                                                                                                                                                                                                                                        |
| **Scenario**        | D — Touch Target Buttons                                                                                                                                                                                                                                                                                                                                          |
| **Pre-conditions**  | `SessionTabs` rendered with sessions, delete mode active                                                                                                                                                                                                                                                                                                          |
| **Steps**           | 1. Render `SessionTabs` with 2 sessions, `onDeleteSession` provided<br>2. Query tab buttons (`role="tab"`)<br>3. Query delete-X button (`data-testid="delete-session-*"`)<br>4. Query add session button (`data-testid="add-session-tab"`)<br>5. Trigger delete confirm → query confirm/cancel buttons<br>6. Assert each button's `className` contains `min-h-12` |
| **Expected Result** | All 5 button types include `min-h-12` in className                                                                                                                                                                                                                                                                                                                |
| **Test Type**       | RTL render + class assertion                                                                                                                                                                                                                                                                                                                                      |

#### TC_W503_09 — AddSessionModal: Option buttons have `min-h-12`

| Field               | Value                                                                                                                                                                                                                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_09                                                                                                                                                                                                                                                                                                                                                     |
| **Scenario**        | D — Touch Target Buttons                                                                                                                                                                                                                                                                                                                                       |
| **Pre-conditions**  | `AddSessionModal` rendered with `isOpen=true`                                                                                                                                                                                                                                                                                                                  |
| **Steps**           | 1. Render `AddSessionModal` with `isOpen=true`, `currentSessionCount=0`<br>2. Query strength button (contains text `fitness.plan.strengthOption`)<br>3. Query cardio button (contains text `fitness.plan.cardioOption`)<br>4. Query freestyle button (contains text `fitness.plan.freestyleOption`)<br>5. Assert each button's `className` contains `min-h-12` |
| **Expected Result** | All 3 session-type option buttons include `min-h-12`                                                                                                                                                                                                                                                                                                           |
| **Test Type**       | RTL render + class assertion                                                                                                                                                                                                                                                                                                                                   |

#### TC_W503_10 — AddSessionModal: Back button has `min-h-12 min-w-12`

| Field               | Value                                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_10                                                                                                                                                                                                                      |
| **Scenario**        | D — Touch Target Buttons                                                                                                                                                                                                        |
| **Pre-conditions**  | `AddSessionModal` rendered, navigated to muscle-groups step                                                                                                                                                                     |
| **Steps**           | 1. Render `AddSessionModal` with `isOpen=true`<br>2. Click strength button to navigate to muscle-groups step<br>3. Query back button (`aria-label` = `common.back`)<br>4. Assert `className` contains `min-h-12` and `min-w-12` |
| **Expected Result** | Back button includes both `min-h-12` and `min-w-12`                                                                                                                                                                             |
| **Test Type**       | RTL render + class assertion                                                                                                                                                                                                    |

#### TC_W503_11 — AddSessionModal: Create session button has `min-h-12`

| Field               | Value                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_11                                                                                                                                                  |
| **Scenario**        | D — Touch Target Buttons                                                                                                                                    |
| **Pre-conditions**  | `AddSessionModal` on muscle-groups step                                                                                                                     |
| **Steps**           | 1. Render → navigate to muscle-groups step<br>2. Query create button (`data-testid="create-strength-session"`)<br>3. Assert `className` contains `min-h-12` |
| **Expected Result** | Create button includes `min-h-12`                                                                                                                           |
| **Test Type**       | RTL render + class assertion                                                                                                                                |

#### TC_W503_12 — CustomExerciseModal: Cancel and Save buttons have `min-h-12`

| Field               | Value                                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_12                                                                                                                                                                                                                      |
| **Scenario**        | D — Touch Target Buttons                                                                                                                                                                                                        |
| **Pre-conditions**  | `CustomExerciseModal` rendered with `isOpen=true`                                                                                                                                                                               |
| **Steps**           | 1. Render `CustomExerciseModal` with `isOpen=true`<br>2. Query cancel button (text = `common.cancel`)<br>3. Query save button (`data-testid="save-custom-exercise"`)<br>4. Assert each button's `className` contains `min-h-12` |
| **Expected Result** | Both action buttons include `min-h-12`                                                                                                                                                                                          |
| **Test Type**       | RTL render + class assertion                                                                                                                                                                                                    |

#### TC_W503_13 — DayAssignmentSheet: Day option buttons have `min-h-12`

| Field               | Value                                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**              | TC_W503_13                                                                                                                                                                                                   |
| **Scenario**        | D — Touch Target Buttons                                                                                                                                                                                     |
| **Pre-conditions**  | `DayAssignmentSheet` rendered with `open=true`                                                                                                                                                               |
| **Steps**           | 1. Render `DayAssignmentSheet` with `open=true`, `trainingDays=[1,3,5]`<br>2. Query day option buttons (`data-testid="day-option-1"`, `-3`, `-5`)<br>3. Assert each button's `className` contains `min-h-12` |
| **Expected Result** | All day option buttons include `min-h-12`                                                                                                                                                                    |
| **Test Type**       | RTL render + class assertion                                                                                                                                                                                 |

#### TC_W503_14 — QuickConfirmCard: Both action buttons have `min-h-12 min-w-12`

| Field               | Value                                                                                                                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_14                                                                                                                                                                                                                                                |
| **Scenario**        | D — Touch Target Buttons                                                                                                                                                                                                                                  |
| **Pre-conditions**  | `QuickConfirmCard` rendered                                                                                                                                                                                                                               |
| **Steps**           | 1. Render `QuickConfirmCard` with valid props<br>2. Query customize button (`data-testid="customize-button"`)<br>3. Query confirm button (`data-testid="quick-confirm-button"`)<br>4. Assert each button's `className` contains `min-h-12` and `min-w-12` |
| **Expected Result** | Both icon-only buttons include `min-h-12 min-w-12` (critical — currently only `p-2` = ~32px!)                                                                                                                                                             |
| **Test Type**       | RTL render + class assertion                                                                                                                                                                                                                              |

#### TC_W503_15 — DeloadModal: Accept and Override buttons have `min-h-12`

| Field               | Value                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_15                                                                                                                                                                                                                    |
| **Scenario**        | D — Touch Target Buttons                                                                                                                                                                                                      |
| **Pre-conditions**  | `DeloadModal` rendered with `isOpen=true`                                                                                                                                                                                     |
| **Steps**           | 1. Render `DeloadModal` with `isOpen=true`<br>2. Query accept button (`data-testid="deload-accept"`)<br>3. Query override button (`data-testid="deload-override"`)<br>4. Assert each button's `className` contains `min-h-12` |
| **Expected Result** | Both modal action buttons include `min-h-12`                                                                                                                                                                                  |
| **Test Type**       | RTL render + class assertion                                                                                                                                                                                                  |

---

### Scenario E: Touch Target — Pills (min-h-11)

#### TC_W503_16 — AddSessionModal: Muscle group pills have `min-h-11`

| Field               | Value                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_16                                                                                                                                                           |
| **Scenario**        | E — Touch Target Pills                                                                                                                                               |
| **Pre-conditions**  | `AddSessionModal` on muscle-groups step                                                                                                                              |
| **Steps**           | 1. Render → navigate to muscle-groups step<br>2. Query all 7 muscle group toggle buttons (`aria-pressed`)<br>3. Assert each button's `className` contains `min-h-11` |
| **Expected Result** | All 7 muscle group pill buttons include `min-h-11` (44px — AC3 pill exception)                                                                                       |
| **Test Type**       | RTL render + class assertion                                                                                                                                         |

#### TC_W503_17 — SwapExerciseSheet: Swap item buttons have `min-h-11`

| Field               | Value                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_17                                                                                                                                                                                                                    |
| **Scenario**        | E — Touch Target Pills                                                                                                                                                                                                        |
| **Pre-conditions**  | `SwapExerciseSheet` rendered with alternatives available                                                                                                                                                                      |
| **Steps**           | 1. Render `SwapExerciseSheet` with `isOpen=true`, `currentExercise` matching a group with alternatives<br>2. Query swap item buttons (`data-testid^="swap-item-"`)<br>3. Assert each button's `className` contains `min-h-11` |
| **Expected Result** | Swap item list buttons include `min-h-11` (pill/list-item exception)                                                                                                                                                          |
| **Test Type**       | RTL render + class assertion                                                                                                                                                                                                  |

---

### Scenario F: Active Press Feedback

#### TC_W503_18 — All interactive buttons have `active:scale-[0.98]`

| Field               | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_18                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Scenario**        | F — Active Press Feedback                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Pre-conditions**  | Each component rendered in its interactive state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Steps**           | For each component, render and query ALL interactive `<button>` elements, then assert `className` contains `active:scale-[0.98]`:<br><br>**SessionTabs** (5 buttons):<br>- Tab buttons, delete-X, add-session, confirm-delete, cancel-delete<br><br>**AddSessionModal** (4 buttons + 7 pills + create):<br>- Strength, cardio, freestyle, back, 7 muscle pills, create-session<br><br>**CustomExerciseModal** (2 buttons):<br>- Cancel, save<br><br>**DayAssignmentSheet** (N day buttons):<br>- All day-option-{N} buttons<br><br>**SwapExerciseSheet** (N swap buttons):<br>- All swap-item-{id} buttons<br><br>**QuickConfirmCard** (2 buttons):<br>- Customize, quick-confirm<br><br>**DeloadModal** (2 buttons):<br>- Accept, override |
| **Expected Result** | Every `<button>` in all 8 components contains `active:scale-[0.98]` in className. Note: SessionTabs currently uses `0.97` — must change to `0.98`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Test Type**       | RTL render + class assertion (aggregate test or per-component)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

---

### Scenario G: Motion-Reduce Safety

#### TC_W503_19 — Every `active:scale-[0.98]` is paired with `motion-reduce:transform-none`

| Field               | Value                                                                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_19                                                                                                                                                                                                     |
| **Scenario**        | G — Motion-Reduce Safety                                                                                                                                                                                       |
| **Pre-conditions**  | Same renders as TC_W503_18                                                                                                                                                                                     |
| **Steps**           | 1. For each component, render and query ALL buttons<br>2. For every button whose `className` contains `active:scale-[0.98]`:<br>&nbsp;&nbsp;a. Assert `className` also contains `motion-reduce:transform-none` |
| **Expected Result** | `active:scale-[0.98]` and `motion-reduce:transform-none` always appear together — no orphaned scale without motion safety                                                                                      |
| **Test Type**       | RTL render + invariant check                                                                                                                                                                                   |

---

### Scenario H: Focus Ring Compliance

#### TC_W503_20 — SessionTabs: All buttons have standard focus ring

| Field               | Value                                                                                                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_20                                                                                                                                                                                                                                   |
| **Scenario**        | H — Focus Ring                                                                                                                                                                                                                               |
| **Pre-conditions**  | `SessionTabs` rendered with delete mode                                                                                                                                                                                                      |
| **Steps**           | 1. Render SessionTabs → query all buttons<br>2. For each button, assert `className` contains ALL 3 classes:<br>&nbsp;&nbsp;- `focus-visible:ring-2`<br>&nbsp;&nbsp;- `focus-visible:ring-ring`<br>&nbsp;&nbsp;- `focus-visible:outline-none` |
| **Expected Result** | All buttons use consistent `ring-ring` token (not `ring-white`). Delete-X button currently uses `ring-white` — must be changed.                                                                                                              |
| **Test Type**       | RTL render + class assertion                                                                                                                                                                                                                 |

#### TC_W503_21 — AddSessionModal: All interactive elements have focus ring

| Field               | Value                                                                                                                                                                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_21                                                                                                                                                                                                                                                                                     |
| **Scenario**        | H — Focus Ring                                                                                                                                                                                                                                                                                 |
| **Pre-conditions**  | `AddSessionModal` rendered in both steps                                                                                                                                                                                                                                                       |
| **Steps**           | 1. Render on "options" step → verify 3 option buttons have focus ring<br>2. Navigate to "muscle-groups" step → verify back button, 7 pills, create button all have focus ring<br>3. Each element must contain: `focus-visible:ring-2`, `focus-visible:ring-ring`, `focus-visible:outline-none` |
| **Expected Result** | All 12 interactive elements have the standard 3-class focus ring pattern                                                                                                                                                                                                                       |
| **Test Type**       | RTL render + class assertion                                                                                                                                                                                                                                                                   |

#### TC_W503_22 — QuickConfirmCard: Focus ring uses `ring-2` not `ring-3`

| Field               | Value                                                                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_22                                                                                                                                                                                                                                                                    |
| **Scenario**        | H — Focus Ring                                                                                                                                                                                                                                                                |
| **Pre-conditions**  | `QuickConfirmCard` rendered                                                                                                                                                                                                                                                   |
| **Steps**           | 1. Render `QuickConfirmCard`<br>2. Query customize button + confirm button<br>3. Assert each contains `focus-visible:ring-2` (NOT `ring-3`)<br>4. Assert each contains `focus-visible:ring-ring` (NOT `ring-ring/50`)<br>5. Assert each contains `focus-visible:outline-none` |
| **Expected Result** | Both buttons normalized to standard focus ring. Currently uses non-standard `ring-3 ring-ring/50` — must be changed to `ring-2 ring-ring`.                                                                                                                                    |
| **Test Type**       | RTL render + class assertion                                                                                                                                                                                                                                                  |

#### TC_W503_23 — DeloadModal: Accept button uses `ring-ring` not `ring-warning`

| Field               | Value                                                                                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**              | TC_W503_23                                                                                                                                                                                                                                                   |
| **Scenario**        | H — Focus Ring                                                                                                                                                                                                                                               |
| **Pre-conditions**  | `DeloadModal` rendered with `isOpen=true`                                                                                                                                                                                                                    |
| **Steps**           | 1. Render `DeloadModal`<br>2. Query accept button (`data-testid="deload-accept"`)<br>3. Assert `className` contains `focus-visible:ring-ring` (NOT `ring-warning`)<br>4. Assert `className` contains `focus-visible:ring-2` and `focus-visible:outline-none` |
| **Expected Result** | Accept button uses standard `ring-ring` token for consistent focus ring appearance                                                                                                                                                                           |
| **Test Type**       | RTL render + class assertion                                                                                                                                                                                                                                 |

#### TC_W503_24 — SplitChangeConfirm: shadcn Buttons have focus ring

| Field               | Value                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**              | TC_W503_24                                                                                                                                                                                                                                                                                                                                                                                       |
| **Scenario**        | H — Focus Ring                                                                                                                                                                                                                                                                                                                                                                                   |
| **Pre-conditions**  | `SplitChangeConfirm` rendered with `open=true`                                                                                                                                                                                                                                                                                                                                                   |
| **Steps**           | 1. Render `SplitChangeConfirm` with valid props<br>2. Query cancel button (`data-testid="cancel-button"`)<br>3. Query confirm button (`data-testid="confirm-button"`)<br>4. Assert each button element's `className` contains `focus-visible:ring-2`, `focus-visible:ring-ring`, `focus-visible:outline-none`<br>5. Also verify `active:scale-[0.98]` and `motion-reduce:transform-none` present |
| **Expected Result** | shadcn Button instances have focus + active + motion-reduce classes applied via className prop                                                                                                                                                                                                                                                                                                   |
| **Test Type**       | RTL render + class assertion                                                                                                                                                                                                                                                                                                                                                                     |

---

### Scenario I: Regression

#### TC_W503_25 — Full test suite passes with zero new failures

| Field               | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**              | TC_W503_25                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Scenario**        | I — Regression                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Pre-conditions**  | All code changes applied                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Steps**           | 1. Run `npm run lint` → expect 0 errors<br>2. Run `npm run test` → expect 0 failures<br>3. Run `npm run build` → expect clean build<br>4. Verify all 8 existing test files still pass:<br>&nbsp;&nbsp;- `SessionTabs.test.tsx`<br>&nbsp;&nbsp;- `AddSessionModal.test.tsx`<br>&nbsp;&nbsp;- `CustomExerciseModal.test.tsx`<br>&nbsp;&nbsp;- `DayAssignmentSheet.test.tsx`<br>&nbsp;&nbsp;- `SwapExerciseSheet.test.tsx`<br>&nbsp;&nbsp;- `QuickConfirmCard.test.tsx`<br>&nbsp;&nbsp;- `DeloadModal.test.tsx`<br>&nbsp;&nbsp;- `SplitChangeConfirm.test.tsx` |
| **Expected Result** | 0 new lint errors, 0 test failures, clean build. No behavioral changes means all existing assertions remain valid.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Test Type**       | Full pipeline                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

---

## 5. Test Implementation Notes

### 5.1 Helper Function: `assertTouchTarget(element, type)`

```typescript
function assertTouchTarget(element: HTMLElement, type: 'button' | 'pill' = 'button') {
  const minH = type === 'pill' ? 'min-h-11' : 'min-h-12';
  expect(element.className).toContain(minH);
  expect(element.className).toContain('active:scale-[0.98]');
  expect(element.className).toContain('motion-reduce:transform-none');
}

function assertFocusRing(element: HTMLElement) {
  expect(element.className).toContain('focus-visible:ring-2');
  expect(element.className).toContain('focus-visible:ring-ring');
  expect(element.className).toContain('focus-visible:outline-none');
}

function assertFullCompliance(element: HTMLElement, type: 'button' | 'pill' = 'button') {
  assertTouchTarget(element, type);
  assertFocusRing(element);
}
```

### 5.2 CSS File Test Pattern

```typescript
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, '../../src/index.css'), 'utf-8');

// Keyframe existence
expect(css).toContain('@keyframes slide-up');

// Stagger delay verification
const staggerMatch = css.match(/\.animate-stagger-3\s*\{[^}]*animation-delay:\s*90ms/);
expect(staggerMatch).not.toBeNull();
```

### 5.3 Negative Assertions (What Must NOT Exist After Fix)

| Old Pattern (must NOT exist)                       | Replacement               |
| -------------------------------------------------- | ------------------------- |
| `min-h-[44px]` on buttons                          | `min-h-12`                |
| `active:scale-[0.97]`                              | `active:scale-[0.98]`     |
| `focus-visible:ring-white`                         | `focus-visible:ring-ring` |
| `focus-visible:ring-3`                             | `focus-visible:ring-2`    |
| `focus-visible:ring-ring/50`                       | `focus-visible:ring-ring` |
| `focus-visible:ring-warning` (on standard buttons) | `focus-visible:ring-ring` |

### 5.4 SplitChangeConfirm Special Handling

`SplitChangeConfirm` uses shadcn `<Button>` + `<Sheet>`. The touch-target/active/focus classes must be applied via the `className` prop override, not by modifying the shadcn base component. Test should verify the **rendered** button element has the classes, regardless of how they're applied (base class vs override).

---

## 6. Element Inventory (Exhaustive)

### Total Interactive Elements Per Component

| Component           | Buttons | Selects/Inputs | Total   | Notes                                                     |
| ------------------- | ------- | -------------- | ------- | --------------------------------------------------------- |
| SessionTabs         | 5       | 0              | 5       | Tab(×N) + delete-X + add + confirm-delete + cancel-delete |
| AddSessionModal     | 12      | 0              | 12      | strength + cardio + freestyle + back + 7 pills + create   |
| CustomExerciseModal | 2       | 2              | 4       | cancel + save + muscle-select + category-select           |
| DayAssignmentSheet  | up to 7 | 0              | 7       | day-option-{1..7}                                         |
| SwapExerciseSheet   | N+0     | 1              | N+1     | swap-item-{id} × N + search input                         |
| QuickConfirmCard    | 2       | 0              | 2       | customize + quick-confirm                                 |
| DeloadModal         | 2       | 0              | 2       | accept + override                                         |
| SplitChangeConfirm  | 2       | 0              | 2       | cancel + confirm (shadcn Button)                          |
| **TOTAL**           | **~34** | **3**          | **~37** | All must pass compliance                                  |

---

## 7. Risk Assessment

| Risk                                                   | Likelihood | Impact | Mitigation                                                                                                                             |
| ------------------------------------------------------ | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `min-h-12` conflicts with existing `py-3`/`p-2` sizing | Low        | Low    | `min-h` is a minimum — it won't shrink existing larger elements                                                                        |
| shadcn `<Button>` already has focus ring → duplication | Medium     | Low    | Verify rendered output, not source; Tailwind deduplicates                                                                              |
| `active:scale-[0.98]` causes layout shift              | Low        | Medium | `motion-reduce:transform-none` as safety net; `transform-origin: center` implicit                                                      |
| Stagger animation exceeds 350ms budget                 | Low        | Medium | TC_W503_06 validates math: 150ms max delay + ≤200ms duration = 350ms                                                                   |
| Existing tests check `className` exact matches         | Medium     | High   | If existing tests use `toHaveClass('...')` exact match, adding classes may break them. Verify test assertions use `toContain` pattern. |

---

## 8. Acceptance Criteria Traceability

| AC# | Acceptance Criterion                                                      | Test Case(s)                       | Status |
| --- | ------------------------------------------------------------------------- | ---------------------------------- | ------ |
| AC1 | `@keyframes slide-up`, `fade-in`, `scale-in` in index.css                 | TC_W503_01, TC_W503_02, TC_W503_03 | 🔲     |
| AC2 | `.animate-stagger-{1-5}` with `animation-delay: {n*30}ms`                 | TC_W503_05, TC_W503_06             | 🔲     |
| AC3 | Interactive elements: `min-h-12` (buttons) / `min-h-11` (pills)           | TC_W503_08–17                      | 🔲     |
| AC4 | `active:scale-[0.98] motion-reduce:transform-none`                        | TC_W503_18, TC_W503_19             | 🔲     |
| AC5 | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` | TC_W503_20–24                      | 🔲     |
| AC6 | `npm run lint` → 0 errors                                                 | TC_W503_25                         | 🔲     |
| AC7 | `npm run test` → 0 failures                                               | TC_W503_25                         | 🔲     |
| QA1 | Total animation ≤ 350ms                                                   | TC_W503_06                         | 🔲     |
| QA2 | Reduced motion disables all animations                                    | TC_W503_07                         | 🔲     |
| QA3 | Focus ring visible on keyboard nav                                        | TC_W503_20–24 (class presence)     | 🔲     |
