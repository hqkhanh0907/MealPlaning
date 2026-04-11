# W1-05 Test Plan — PlanActionBar Extraction

> **Status**: TEST_PLAN_READY
> **Component**: `src/features/fitness/components/PlanActionBar.tsx`
> **Test file**: `src/__tests__/PlanActionBar.test.tsx`
> **Type**: Unit (Vitest + React Testing Library)
> **Author**: QA Engineer (TDD-First)
> **Date**: 2026-07-14

---

## 1. Source Analysis

### Current Code (TrainingPlanView.tsx lines 474–523)

Three action buttons in a `flex gap-2` row:

| Button           | data-testid            | Icon             | Label (vi.json)                    | Translation  |
| ---------------- | ---------------------- | ---------------- | ---------------------------------- | ------------ |
| Edit schedule    | `action-edit-schedule` | `CalendarCog`    | `fitness.planActions.editSchedule` | "Chỉnh lịch" |
| Change split     | `action-change-split`  | `ArrowRightLeft` | `fitness.planActions.changeSplit`  | "Đổi Split"  |
| Browse templates | `action-templates`     | `BookOpen`       | `fitness.planActions.templates`    | "Mẫu Plan"   |

### Delta: Current → Extracted Component

| Aspect           | Current (inline)       | Target (PlanActionBar) | Note                                            |
| ---------------- | ---------------------- | ---------------------- | ----------------------------------------------- |
| Touch target     | `min-h-[44px]`         | `min-h-12` (48px)      | **Upgrade** to satisfy BR-37 (≥48dp)            |
| Press feedback   | None                   | `active:scale-[0.98]`  | **New** per AC-3 / BR-42                        |
| Disabled support | None                   | `disabled:opacity-50`  | **New** per AC-2                                |
| Focus ring       | `focus-visible:ring-2` | `focus-visible:ring-2` | Preserved                                       |
| Click handler    | Inline `pushPage()`    | Callback props         | Decoupled — parent passes `onEditSchedule` etc. |

---

## 2. Proposed Component Interface

```tsx
interface PlanActionBarProps {
  readonly onEditSchedule: () => void;
  readonly onChangeSplit: () => void;
  readonly onBrowseTemplates: () => void;
  readonly isDisabled?: boolean;
}
```

---

## 3. Test Scenarios

### 3.1 — Rendering (Happy Path)

| TC ID      | Scenario                        | Pre-condition     | Steps                                         | Expected Result                      |
| ---------- | ------------------------------- | ----------------- | --------------------------------------------- | ------------------------------------ |
| TC_PAB_R01 | Container renders with testid   | Component mounted | `render(<PlanActionBar {...defaultProps} />)` | `plan-action-bar` element in DOM     |
| TC_PAB_R02 | Renders exactly 3 buttons       | Component mounted | Query all `role="button"`                     | Length = 3                           |
| TC_PAB_R03 | First button shows "Chỉnh lịch" | Component mounted | Query by text                                 | Button with text "Chỉnh lịch" in DOM |
| TC_PAB_R04 | Second button shows "Đổi Split" | Component mounted | Query by text                                 | Button with text "Đổi Split" in DOM  |
| TC_PAB_R05 | Third button shows "Mẫu Plan"   | Component mounted | Query by text                                 | Button with text "Mẫu Plan" in DOM   |
| TC_PAB_R06 | Edit schedule button has testid | Component mounted | `getByTestId('action-edit-schedule')`         | Element present                      |
| TC_PAB_R07 | Change split button has testid  | Component mounted | `getByTestId('action-change-split')`          | Element present                      |
| TC_PAB_R08 | Templates button has testid     | Component mounted | `getByTestId('action-templates')`             | Element present                      |

### 3.2 — Icons

| TC ID      | Scenario                                   | Expected Result                                                     |
| ---------- | ------------------------------------------ | ------------------------------------------------------------------- |
| TC_PAB_I01 | CalendarCog icon in edit-schedule button   | `action-edit-schedule` contains SVG child with `aria-hidden="true"` |
| TC_PAB_I02 | ArrowRightLeft icon in change-split button | `action-change-split` contains SVG child with `aria-hidden="true"`  |
| TC_PAB_I03 | BookOpen icon in templates button          | `action-templates` contains SVG child with `aria-hidden="true"`     |

### 3.3 — Disabled State

| TC ID      | Scenario                                        | Pre-condition        | Steps                              | Expected Result                               |
| ---------- | ----------------------------------------------- | -------------------- | ---------------------------------- | --------------------------------------------- |
| TC_PAB_D01 | All buttons disabled when isDisabled=true       | `isDisabled={true}`  | Query 3 buttons                    | All have `disabled` attribute                 |
| TC_PAB_D02 | Disabled buttons have opacity-50 class          | `isDisabled={true}`  | Check className of each button     | Each className contains `disabled:opacity-50` |
| TC_PAB_D03 | Click on disabled button does NOT fire callback | `isDisabled={true}`  | `userEvent.click(editScheduleBtn)` | `onEditSchedule` NOT called                   |
| TC_PAB_D04 | All 3 callbacks NOT fired when disabled         | `isDisabled={true}`  | Click all 3 buttons                | None of the 3 callbacks called                |
| TC_PAB_D05 | Buttons enabled by default (isDisabled omitted) | No isDisabled prop   | Query 3 buttons                    | None have `disabled` attribute                |
| TC_PAB_D06 | isDisabled=false → buttons enabled              | `isDisabled={false}` | Query 3 buttons                    | None have `disabled` attribute                |

### 3.4 — Click Handlers

| TC ID      | Scenario                                     | Steps                                                  | Expected Result                                    |
| ---------- | -------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------- |
| TC_PAB_C01 | Click edit-schedule fires onEditSchedule     | `userEvent.click(getByTestId('action-edit-schedule'))` | `onEditSchedule` called once                       |
| TC_PAB_C02 | Click change-split fires onChangeSplit       | `userEvent.click(getByTestId('action-change-split'))`  | `onChangeSplit` called once                        |
| TC_PAB_C03 | Click templates fires onBrowseTemplates      | `userEvent.click(getByTestId('action-templates'))`     | `onBrowseTemplates` called once                    |
| TC_PAB_C04 | Callbacks fire independently (no cross-talk) | Click edit-schedule only                               | `onChangeSplit` and `onBrowseTemplates` NOT called |

### 3.5 — Touch Target & Styling (BR-37, BR-42)

| TC ID      | Scenario                                      | Expected Result                                         |
| ---------- | --------------------------------------------- | ------------------------------------------------------- |
| TC_PAB_T01 | All buttons have min-h-12 (48px) touch target | Each button className contains `min-h-12`               |
| TC_PAB_T02 | All buttons have active:scale-[0.98] feedback | Each button className contains `active:scale-[0.98]`    |
| TC_PAB_T03 | All buttons have focus-visible:ring-2         | Each button className contains `focus-visible:ring-2`   |
| TC_PAB_T04 | All buttons have touch-manipulation           | Each button className contains `touch-manipulation`     |
| TC_PAB_T05 | Container uses flex layout with gap           | `plan-action-bar` className contains `flex` and `gap-2` |
| TC_PAB_T06 | Each button has flex-1 for equal width        | Each button className contains `flex-1`                 |

### 3.6 — Accessibility

| TC ID      | Scenario                              | Expected Result                                     |
| ---------- | ------------------------------------- | --------------------------------------------------- |
| TC_PAB_A01 | Each button has aria-label            | All 3 buttons have non-empty `aria-label` attribute |
| TC_PAB_A02 | Edit-schedule aria-label matches i18n | `aria-label` = "Chỉnh lịch"                         |
| TC_PAB_A03 | Change-split aria-label matches i18n  | `aria-label` = "Đổi Split"                          |
| TC_PAB_A04 | Templates aria-label matches i18n     | `aria-label` = "Mẫu Plan"                           |
| TC_PAB_A05 | All buttons have type="button"        | Each button has `type` attribute = "button"         |
| TC_PAB_A06 | Icons are decorative (aria-hidden)    | All SVGs inside buttons have `aria-hidden="true"`   |

### 3.7 — Layout on Narrow Viewport (360px)

| TC ID      | Scenario                                     | Expected Result                                                                                 |
| ---------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| TC_PAB_L01 | Container does not force horizontal overflow | `plan-action-bar` does NOT have `overflow-x-auto` or `overflow-hidden` that would clip content  |
| TC_PAB_L02 | Text labels render without `text-ellipsis`   | No button has `truncate` or `text-ellipsis` class                                               |
| TC_PAB_L03 | Labels are short enough for 3-column fit     | "Chỉnh lịch" (9ch), "Đổi Split" (9ch), "Mẫu Plan" (8ch) — all ≤12ch, within `text-xs` safe zone |

> **Note**: True overflow cannot be tested in jsdom (no layout engine). TC_PAB_L01–L03 verify the CSS contract. Visual verification deferred to emulator (CDP / manual).

---

## 4. Test Implementation Blueprint

```tsx
// src/__tests__/PlanActionBar.test.tsx
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanActionBar } from '../features/fitness/components/PlanActionBar';

// Default props factory — all callbacks are vi.fn()
function createProps(overrides = {}) {
  return {
    onEditSchedule: vi.fn(),
    onChangeSplit: vi.fn(),
    onBrowseTemplates: vi.fn(),
    ...overrides,
  };
}

afterEach(cleanup);

describe('PlanActionBar', () => {
  // §3.1 — Rendering
  describe('Rendering', () => {
    // TC_PAB_R01..R08
  });

  // §3.2 — Icons
  describe('Icons', () => {
    // TC_PAB_I01..I03
  });

  // §3.3 — Disabled state
  describe('Disabled state', () => {
    // TC_PAB_D01..D06
  });

  // §3.4 — Click handlers
  describe('Click handlers', () => {
    // TC_PAB_C01..C04
  });

  // §3.5 — Touch target & styling
  describe('Touch targets (BR-37, BR-42)', () => {
    // TC_PAB_T01..T06
  });

  // §3.6 — Accessibility
  describe('Accessibility', () => {
    // TC_PAB_A01..A06
  });

  // §3.7 — Layout contract
  describe('Layout contract (360px)', () => {
    // TC_PAB_L01..L03
  });
});
```

---

## 5. Coverage Matrix

| Area           | Test Cases | Count  | Covers AC  |
| -------------- | ---------- | ------ | ---------- |
| Rendering      | R01–R08    | 8      | AC-1       |
| Icons          | I01–I03    | 3      | AC-1       |
| Disabled       | D01–D06    | 6      | AC-2       |
| Click handlers | C01–C04    | 4      | —          |
| Touch/styling  | T01–T06    | 6      | AC-3, AC-4 |
| Accessibility  | A01–A06    | 6      | —          |
| Layout         | L01–L03    | 3      | AC-5       |
| **Total**      |            | **36** |            |

### AC → TC Traceability

| Acceptance Criteria                                       | Test Cases                 |
| --------------------------------------------------------- | -------------------------- |
| AC-1: 3 buttons with correct icons + labels               | R01–R08, I01–I03           |
| AC-2: isDisabled disables all with disabled:opacity-50    | D01–D06                    |
| AC-3: min-h-12, active:scale-[0.98], focus-visible:ring-2 | T01–T03                    |
| AC-4: 100% test coverage                                  | All 36 TCs (stmt + branch) |
| AC-5: ≤200 LOC                                            | L01–L03 (layout contract)  |

### Business Rule → TC Traceability

| Business Rule              | Test Cases |
| -------------------------- | ---------- |
| BR-37: Touch targets ≥48dp | T01, T04   |
| BR-42: Press feedback      | T02        |

---

## 6. Edge Cases & Risks

| Risk                                           | Mitigation                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| Button text truncation on 360px                | TC_PAB_L03 verifies label char count. Emulator visual check.        |
| Callback fires on disabled button              | TC_PAB_D03–D04 explicitly click disabled + assert not called.       |
| Icon not decorative → screen reader reads icon | TC_PAB_A06 verifies `aria-hidden="true"` on all SVGs.               |
| Missing type="button" → form submit            | TC_PAB_A05 verifies `type="button"` on all.                         |
| Disabled opacity not applied (missing class)   | TC_PAB_D02 checks `disabled:opacity-50` in className.               |
| min-h downgrade from spec (44px → 48px skip)   | TC_PAB_T01 explicitly checks `min-h-12` (48px), NOT `min-h-[44px]`. |

---

## 7. Notes for Dev

1. **Upgrade touch target**: Current inline code uses `min-h-[44px]` (44px). New component MUST use `min-h-12` (48px = 3rem) per BR-37.
2. **Add press feedback**: Current inline code has NO `active:scale-[0.98]`. Must add per AC-3.
3. **Add disabled support**: Current inline code has NO disabled handling. Must accept `isDisabled` prop → set `disabled` attribute + `disabled:opacity-50` class.
4. **Callback props**: Decouple from `pushPage()` — parent (TrainingPlanView) passes `onEditSchedule`, `onChangeSplit`, `onBrowseTemplates` callbacks.
5. **Keep existing testids**: `action-edit-schedule`, `action-change-split`, `action-templates`, `plan-action-bar`.
6. **Props must be Readonly**: `Readonly<PlanActionBarProps>` per SonarQube rule.
7. **All buttons `type="button"`**: Prevent accidental form submission.
