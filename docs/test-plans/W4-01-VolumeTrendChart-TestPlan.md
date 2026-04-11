# W4-01 — VolumeTrendChart Test Plan

> **Component**: `src/features/fitness/components/VolumeTrendChart.tsx`
> **Test File**: `src/__tests__/VolumeTrendChart.test.tsx`
> **Author**: QA Engineer (TDD-First)
> **Date**: 2025-07-15
> **Status**: READY FOR DEV

---

## 1. Component Requirements Summary

### Props Interface (Design §6.1)

```typescript
export interface WeekVolume {
  weekLabel: string; // "W1", "W2", ... "W8"
  volume: number; // Total kg lifted that week (≥0)
  isCurrent: boolean; // true for current week only
}

export interface VolumeTrendChartProps {
  weeks: WeekVolume[]; // 0–8 entries, 8-week rolling view
}
```

### Visual Specification

| Aspect           | Requirement                                                       |
| ---------------- | ----------------------------------------------------------------- |
| Container        | `h-40 flex items-end gap-1`                                       |
| Bar width        | `flex-1` (equal distribution)                                     |
| Bar height       | Proportional: `(volume / maxVolume) * 100%`, min 4px for non-zero |
| Current week bar | `bg-primary rounded-t-md`                                         |
| Other week bars  | `bg-primary/30 rounded-t-md`                                      |
| Week labels      | `text-[10px] tabular-nums text-muted-foreground`                  |
| Transition       | `transition-all duration-300` on bar height                       |
| Empty state      | "Chưa có dữ liệu" when `weeks.length === 0`                       |
| LOC limit        | ≤200 lines                                                        |

### Volume Formula (from `trainingMetrics.ts`)

```
Volume = Σ(reps × weightKg) per set, aggregated per week
Example: 3 sets × 10 reps × 100 kg = 3,000 kg weekly volume
```

---

## 2. Test Scenarios

| ID         | Scenario                         | Category    | Priority |
| ---------- | -------------------------------- | ----------- | -------- |
| SC_W401_01 | Empty state — no weeks data      | Empty/Error | P0       |
| SC_W401_02 | Single week with volume          | Minimal     | P0       |
| SC_W401_03 | All 8 weeks with varying volumes | Happy Path  | P0       |
| SC_W401_04 | Current week highlighting        | Visual      | P0       |
| SC_W401_05 | Bar height proportionality       | Logic       | P0       |
| SC_W401_06 | Zero volume week (bar height 0)  | Edge Case   | P0       |
| SC_W401_07 | Week labels rendering            | Visual      | P1       |
| SC_W401_08 | CSS class contracts              | Visual      | P1       |
| SC_W401_09 | Transition classes               | Animation   | P1       |
| SC_W401_10 | All weeks with equal volume      | Edge Case   | P1       |
| SC_W401_11 | Single non-zero among zeros      | Edge Case   | P1       |
| SC_W401_12 | Very large volume values         | Edge Case   | P2       |
| SC_W401_13 | Tooltip on hover/tap             | Interaction | P1       |
| SC_W401_14 | Accessibility attributes         | A11y        | P1       |
| SC_W401_15 | React.memo optimization          | Performance | P2       |
| SC_W401_16 | Fewer than 8 weeks               | Alternative | P1       |

---

## 3. Detailed Test Cases

### SC_W401_01 — Empty State

#### TC_W401_01: Renders empty state message when weeks array is empty

- **Pre-condition**: Component rendered with `weeks = []`
- **Steps**:
  1. Render `<VolumeTrendChart weeks={[]} />`
  2. Query for empty state element by `data-testid="volume-trend-empty"`
  3. Query for chart container by `data-testid="volume-trend-chart"`
- **Expected Result**:
  - `data-testid="volume-trend-empty"` is in the document
  - Text "Chưa có dữ liệu" is visible (from i18n key `fitness.volumeTrend.noData` or hardcoded)
  - `data-testid="volume-trend-chart"` is NOT in the document
- **Type**: Unit (Vitest)

#### TC_W401_02: Empty state does NOT render any bars

- **Pre-condition**: Component rendered with `weeks = []`
- **Steps**:
  1. Render `<VolumeTrendChart weeks={[]} />`
  2. Query for any elements with `data-testid` matching `volume-bar-*`
- **Expected Result**:
  - No elements matching `volume-bar-*` exist in the document
- **Type**: Unit (Vitest)

---

### SC_W401_02 — Single Week

#### TC_W401_03: Renders exactly 1 bar for single week data

- **Pre-condition**: Component rendered with 1 week entry
- **Input**:
  ```typescript
  const weeks = [{ weekLabel: 'W1', volume: 5000, isCurrent: true }];
  ```
- **Steps**:
  1. Render `<VolumeTrendChart weeks={weeks} />`
  2. Query all bar elements by `data-testid` pattern `volume-bar-0`
  3. Query for chart container
- **Expected Result**:
  - Exactly 1 bar element exists: `data-testid="volume-bar-0"`
  - Chart container `data-testid="volume-trend-chart"` is in the document
  - Empty state is NOT rendered
- **Type**: Unit (Vitest)

#### TC_W401_04: Single week bar has 100% height (it IS the max)

- **Pre-condition**: 1 week with volume 5000
- **Input**:
  ```typescript
  const weeks = [{ weekLabel: 'W1', volume: 5000, isCurrent: true }];
  ```
- **Steps**:
  1. Render `<VolumeTrendChart weeks={weeks} />`
  2. Get bar element `data-testid="volume-bar-0"`
  3. Read `style.height`
- **Expected Result**:
  - Bar height is `100%` (5000/5000 = 100%)
- **Type**: Unit (Vitest)

---

### SC_W401_03 — Full 8-Week Happy Path

#### TC_W401_05: Renders exactly 8 bars for 8-week data

- **Pre-condition**: Component rendered with 8 week entries
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 2000, isCurrent: false },
    { weekLabel: 'W2', volume: 3000, isCurrent: false },
    { weekLabel: 'W3', volume: 3500, isCurrent: false },
    { weekLabel: 'W4', volume: 4000, isCurrent: false },
    { weekLabel: 'W5', volume: 4200, isCurrent: false },
    { weekLabel: 'W6', volume: 4500, isCurrent: false },
    { weekLabel: 'W7', volume: 5000, isCurrent: false },
    { weekLabel: 'W8', volume: 5500, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render `<VolumeTrendChart weeks={weeks} />`
  2. Query all bar elements `volume-bar-0` through `volume-bar-7`
- **Expected Result**:
  - 8 bar elements exist in the document
  - `volume-bar-0` through `volume-bar-7` all present
- **Type**: Unit (Vitest)

#### TC_W401_06: Bar heights are proportional to volume (8 weeks)

- **Pre-condition**: 8 weeks, max volume = 5500 (W8)
- **Input**: Same as TC_W401_05
- **Steps**:
  1. Render component
  2. Read `style.height` for each bar
- **Expected Result** (height = Math.round(volume / maxVolume \* 100)):
  - Bar 0 (W1, 2000): height = `36%` (2000/5500 ≈ 36.36 → 36)
  - Bar 1 (W2, 3000): height = `55%` (3000/5500 ≈ 54.55 → 55)
  - Bar 2 (W3, 3500): height = `64%` (3500/5500 ≈ 63.64 → 64)
  - Bar 3 (W4, 4000): height = `73%` (4000/5500 ≈ 72.73 → 73)
  - Bar 4 (W5, 4200): height = `76%` (4200/5500 ≈ 76.36 → 76)
  - Bar 5 (W6, 4500): height = `82%` (4500/5500 ≈ 81.82 → 82)
  - Bar 6 (W7, 5000): height = `91%` (5000/5500 ≈ 90.91 → 91)
  - Bar 7 (W8, 5500): height = `100%` (5500/5500 = 100)
- **Type**: Unit (Vitest)

---

### SC_W401_04 — Current Week Highlighting

#### TC_W401_07: Current week bar has `bg-primary` class

- **Pre-condition**: 8 weeks, W8 is `isCurrent: true`
- **Input**: Same as TC_W401_05
- **Steps**:
  1. Render component
  2. Get bar `data-testid="volume-bar-7"` (W8, current)
  3. Check className
- **Expected Result**:
  - `className` contains `bg-primary`
  - `className` does NOT contain `bg-primary/30`
  - `className` contains `rounded-t-md`
- **Type**: Unit (Vitest)

#### TC_W401_08: Non-current week bars have `bg-primary/30` class

- **Pre-condition**: 8 weeks, only W8 is current
- **Input**: Same as TC_W401_05
- **Steps**:
  1. Render component
  2. Get bars `volume-bar-0` through `volume-bar-6` (W1–W7, not current)
  3. Check className of each
- **Expected Result**:
  - Each non-current bar's `className` contains `bg-primary/30`
  - Each non-current bar's `className` contains `rounded-t-md`
- **Type**: Unit (Vitest)

#### TC_W401_09: Only ONE bar can be current at a time

- **Pre-condition**: Multiple weeks marked `isCurrent: true` (invalid but defensive)
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 1000, isCurrent: true },
    { weekLabel: 'W2', volume: 2000, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render component
  2. Query all bars, check which have `bg-primary` (not `/30`)
- **Expected Result**:
  - Component renders without error
  - Both bars with `isCurrent: true` get `bg-primary` class (respects prop per-bar)
- **Note**: Defensive — component trusts input, doesn't enforce single-current
- **Type**: Unit (Vitest)

---

### SC_W401_05 — Bar Height Proportionality

#### TC_W401_10: Max volume bar always gets 100% height

- **Pre-condition**: 3 weeks with different volumes
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 1000, isCurrent: false },
    { weekLabel: 'W2', volume: 7500, isCurrent: false },
    { weekLabel: 'W3', volume: 3000, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render component
  2. Get bar `volume-bar-1` (W2, max = 7500)
  3. Read `style.height`
- **Expected Result**:
  - Bar 1 (W2): height = `100%`
  - Bar 0 (W1): height = `13%` (1000/7500 ≈ 13.33 → 13)
  - Bar 2 (W3): height = `40%` (3000/7500 = 40)
- **Type**: Unit (Vitest)

#### TC_W401_11: Height calculation uses Math.round for percentage

- **Pre-condition**: Volumes that produce fractional percentages
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 3333, isCurrent: false },
    { weekLabel: 'W2', volume: 10000, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render component
  2. Get bar `volume-bar-0`
  3. Read `style.height`
- **Expected Result**:
  - Bar 0: height = `33%` (3333/10000 = 33.33 → rounded to 33)
- **Type**: Unit (Vitest)

---

### SC_W401_06 — Zero Volume Week

#### TC_W401_12: Zero volume week renders bar with 0% height

- **Pre-condition**: Mix of zero and non-zero volumes
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 0, isCurrent: false },
    { weekLabel: 'W2', volume: 5000, isCurrent: false },
    { weekLabel: 'W3', volume: 0, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render component
  2. Get bars `volume-bar-0` and `volume-bar-2`
  3. Read `style.height`
- **Expected Result**:
  - Bar 0 (volume=0): height = `0%`
  - Bar 2 (volume=0): height = `0%`
  - Bar 1 (volume=5000): height = `100%`
- **Type**: Unit (Vitest)

#### TC_W401_13: All-zero volume weeks — all bars render with 0% height

- **Pre-condition**: All weeks have volume = 0
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 0, isCurrent: false },
    { weekLabel: 'W2', volume: 0, isCurrent: false },
    { weekLabel: 'W3', volume: 0, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render component
  2. Get all 3 bars
  3. Read `style.height` for each
- **Expected Result**:
  - All bars: height = `0%` (maxVolume = 0, division guarded → 0%)
  - Component does NOT crash (no division by zero)
  - Empty state is NOT shown (weeks.length = 3, not 0)
- **Type**: Unit (Vitest)

---

### SC_W401_07 — Week Labels

#### TC_W401_14: Each bar has its week label displayed

- **Pre-condition**: 4 weeks
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 1000, isCurrent: false },
    { weekLabel: 'W2', volume: 2000, isCurrent: false },
    { weekLabel: 'W3', volume: 3000, isCurrent: false },
    { weekLabel: 'W4', volume: 4000, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render component
  2. Query for text "W1", "W2", "W3", "W4"
- **Expected Result**:
  - All 4 labels visible: "W1", "W2", "W3", "W4"
- **Type**: Unit (Vitest)

#### TC_W401_15: Week labels have correct CSS classes

- **Pre-condition**: At least 1 week
- **Input**:
  ```typescript
  const weeks = [{ weekLabel: 'W1', volume: 1000, isCurrent: true }];
  ```
- **Steps**:
  1. Render component
  2. Get label element containing "W1"
  3. Check className
- **Expected Result**:
  - `className` contains `text-[10px]`
  - `className` contains `tabular-nums`
  - `className` contains `text-muted-foreground`
- **Type**: Unit (Vitest)

---

### SC_W401_08 — Container CSS Classes

#### TC_W401_16: Chart container has correct layout classes

- **Pre-condition**: Non-empty weeks
- **Input**: Any valid weeks array with ≥1 entry
- **Steps**:
  1. Render component
  2. Get chart container `data-testid="volume-trend-chart"`
  3. Check className
- **Expected Result**:
  - `className` contains `h-40`
  - `className` contains `flex`
  - `className` contains `items-end`
  - `className` contains `gap-1`
- **Type**: Unit (Vitest)

#### TC_W401_17: Each bar column uses flex-1 for equal width

- **Pre-condition**: 3 weeks
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 1000, isCurrent: false },
    { weekLabel: 'W2', volume: 2000, isCurrent: false },
    { weekLabel: 'W3', volume: 3000, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render component
  2. Get each bar column wrapper (parent of bar + label)
  3. Check className
- **Expected Result**:
  - Each bar column's `className` contains `flex-1`
- **Type**: Unit (Vitest)

---

### SC_W401_09 — Transition Animation

#### TC_W401_18: Bars have transition classes

- **Pre-condition**: Non-empty weeks
- **Input**:
  ```typescript
  const weeks = [{ weekLabel: 'W1', volume: 1000, isCurrent: true }];
  ```
- **Steps**:
  1. Render component
  2. Get bar element `volume-bar-0`
  3. Check className
- **Expected Result**:
  - `className` contains `transition-all`
  - `className` contains `duration-300`
- **Type**: Unit (Vitest)

---

### SC_W401_10 — Equal Volume Edge Case

#### TC_W401_19: All weeks with identical volume — all bars 100% height

- **Pre-condition**: All weeks have same non-zero volume
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 4000, isCurrent: false },
    { weekLabel: 'W2', volume: 4000, isCurrent: false },
    { weekLabel: 'W3', volume: 4000, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render component
  2. Read `style.height` for all 3 bars
- **Expected Result**:
  - All bars: height = `100%` (4000/4000 = 100%)
- **Type**: Unit (Vitest)

---

### SC_W401_11 — Single Non-Zero Among Zeros

#### TC_W401_20: One non-zero week among all-zero weeks

- **Pre-condition**: Only 1 week has volume > 0
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 0, isCurrent: false },
    { weekLabel: 'W2', volume: 0, isCurrent: false },
    { weekLabel: 'W3', volume: 3500, isCurrent: false },
    { weekLabel: 'W4', volume: 0, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render component
  2. Read `style.height` for all bars
- **Expected Result**:
  - Bar 0 (0): height = `0%`
  - Bar 1 (0): height = `0%`
  - Bar 2 (3500): height = `100%`
  - Bar 3 (0): height = `0%`
- **Type**: Unit (Vitest)

---

### SC_W401_12 — Large Volume Values

#### TC_W401_21: Very large volumes render correctly without overflow

- **Pre-condition**: Volumes in the tens of thousands
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 50000, isCurrent: false },
    { weekLabel: 'W2', volume: 100000, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render component
  2. Read `style.height` for each bar
- **Expected Result**:
  - Bar 0: height = `50%` (50000/100000 = 50)
  - Bar 1: height = `100%`
  - No render errors, no overflow
- **Type**: Unit (Vitest)

---

### SC_W401_13 — Tooltip Interaction

#### TC_W401_22: Hovering/clicking a bar shows tooltip with exact volume

- **Pre-condition**: Weeks with volume data
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 4250, isCurrent: false },
    { weekLabel: 'W2', volume: 5800, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render component
  2. Fire `mouseEnter` (or `click` for mobile tap) on `volume-bar-0`
  3. Query for tooltip element `data-testid="volume-tooltip"`
- **Expected Result**:
  - Tooltip appears with text containing `4,250` or `4250` (locale-formatted volume in kg)
  - Tooltip is associated with W1 bar
- **Type**: Unit (Vitest)

#### TC_W401_23: Tooltip hides on mouse leave

- **Pre-condition**: Tooltip is shown for W1 bar
- **Steps**:
  1. Render component
  2. Fire `mouseEnter` on `volume-bar-0` → tooltip visible
  3. Fire `mouseLeave` on `volume-bar-0`
  4. Query for tooltip
- **Expected Result**:
  - Tooltip is NOT in the document (or is hidden)
- **Type**: Unit (Vitest)

#### TC_W401_24: Tooltip shows volume for correct bar when switching

- **Pre-condition**: 2 bars rendered
- **Input**: Same as TC_W401_22
- **Steps**:
  1. Render component
  2. Fire `mouseEnter` on `volume-bar-0` → tooltip shows "4,250"
  3. Fire `mouseLeave` on `volume-bar-0`
  4. Fire `mouseEnter` on `volume-bar-1` → tooltip shows "5,800"
- **Expected Result**:
  - First tooltip: contains volume for W1 (4,250 kg)
  - Second tooltip: contains volume for W2 (5,800 kg)
- **Type**: Unit (Vitest)

#### TC_W401_25: Tooltip for zero-volume week shows "0 kg"

- **Pre-condition**: Week with volume = 0
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 0, isCurrent: false },
    { weekLabel: 'W2', volume: 1000, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render component
  2. Fire `mouseEnter` on `volume-bar-0`
- **Expected Result**:
  - Tooltip visible with "0 kg" or "0"
- **Type**: Unit (Vitest)

---

### SC_W401_14 — Accessibility

#### TC_W401_26: Chart container has `role="img"` and descriptive `aria-label`

- **Pre-condition**: Non-empty weeks
- **Steps**:
  1. Render component with valid weeks
  2. Get chart container
  3. Check role and aria-label attributes
- **Expected Result**:
  - Container has `role="img"` (or `role="figure"`)
  - Container has `aria-label` describing the chart purpose
- **Type**: Unit (Vitest)

#### TC_W401_27: Each bar has aria-label with volume value

- **Pre-condition**: Weeks with volume data
- **Input**:
  ```typescript
  const weeks = [{ weekLabel: 'W1', volume: 3000, isCurrent: true }];
  ```
- **Steps**:
  1. Render component
  2. Get bar `volume-bar-0`
  3. Check `aria-label` attribute
- **Expected Result**:
  - `aria-label` contains "W1" and "3000" (or localized equivalent)
- **Type**: Unit (Vitest)

---

### SC_W401_15 — React.memo

#### TC_W401_28: Component is wrapped with React.memo

- **Pre-condition**: Import VolumeTrendChart
- **Steps**:
  1. Check `VolumeTrendChart.displayName` or `$$typeof`
- **Expected Result**:
  - `displayName` is `'VolumeTrendChart'` (or component is memo-wrapped)
- **Type**: Unit (Vitest)

---

### SC_W401_16 — Fewer Than 8 Weeks

#### TC_W401_29: Renders 3 bars for 3-week data (not padded to 8)

- **Pre-condition**: Only 3 weeks provided
- **Input**:
  ```typescript
  const weeks = [
    { weekLabel: 'W1', volume: 1000, isCurrent: false },
    { weekLabel: 'W2', volume: 2000, isCurrent: false },
    { weekLabel: 'W3', volume: 3000, isCurrent: true },
  ];
  ```
- **Steps**:
  1. Render component
  2. Count bar elements
- **Expected Result**:
  - Exactly 3 bars rendered (NOT padded to 8)
  - `volume-bar-0`, `volume-bar-1`, `volume-bar-2` exist
  - `volume-bar-3` does NOT exist
- **Type**: Unit (Vitest)

#### TC_W401_30: Renders 5 bars for 5-week data

- **Pre-condition**: 5 weeks provided
- **Input**:
  ```typescript
  const weeks = Array.from({ length: 5 }, (_, i) => ({
    weekLabel: `W${i + 1}`,
    volume: (i + 1) * 1000,
    isCurrent: i === 4,
  }));
  ```
- **Steps**:
  1. Render component
  2. Count bar elements
- **Expected Result**:
  - Exactly 5 bars rendered
- **Type**: Unit (Vitest)

---

## 4. Test Data Fixtures

### Standard 8-Week Fixture (Upward Trend)

```typescript
const EIGHT_WEEK_UPTREND: WeekVolume[] = [
  { weekLabel: 'W1', volume: 2000, isCurrent: false },
  { weekLabel: 'W2', volume: 3000, isCurrent: false },
  { weekLabel: 'W3', volume: 3500, isCurrent: false },
  { weekLabel: 'W4', volume: 4000, isCurrent: false },
  { weekLabel: 'W5', volume: 4200, isCurrent: false },
  { weekLabel: 'W6', volume: 4500, isCurrent: false },
  { weekLabel: 'W7', volume: 5000, isCurrent: false },
  { weekLabel: 'W8', volume: 5500, isCurrent: true },
];
// maxVolume = 5500
// Heights: 36%, 55%, 64%, 73%, 76%, 82%, 91%, 100%
```

### Mixed with Zeros Fixture

```typescript
const MIXED_WITH_ZEROS: WeekVolume[] = [
  { weekLabel: 'W1', volume: 0, isCurrent: false },
  { weekLabel: 'W2', volume: 5000, isCurrent: false },
  { weekLabel: 'W3', volume: 0, isCurrent: false },
  { weekLabel: 'W4', volume: 3000, isCurrent: true },
];
// maxVolume = 5000
// Heights: 0%, 100%, 0%, 60%
```

### All Equal Fixture

```typescript
const ALL_EQUAL: WeekVolume[] = [
  { weekLabel: 'W1', volume: 4000, isCurrent: false },
  { weekLabel: 'W2', volume: 4000, isCurrent: false },
  { weekLabel: 'W3', volume: 4000, isCurrent: true },
];
// maxVolume = 4000
// Heights: 100%, 100%, 100%
```

### All Zeros Fixture

```typescript
const ALL_ZEROS: WeekVolume[] = [
  { weekLabel: 'W1', volume: 0, isCurrent: false },
  { weekLabel: 'W2', volume: 0, isCurrent: false },
  { weekLabel: 'W3', volume: 0, isCurrent: true },
];
// maxVolume = 0 → guard against division by zero → all heights 0%
```

---

## 5. Expected data-testid Map

| Element                     | data-testid            | Notes                                  |
| --------------------------- | ---------------------- | -------------------------------------- |
| Chart container (bars area) | `volume-trend-chart`   | Has `h-40 flex items-end gap-1`        |
| Empty state wrapper         | `volume-trend-empty`   | Only when `weeks.length === 0`         |
| Individual bar (fill div)   | `volume-bar-{index}`   | 0-indexed, e.g., `volume-bar-0`        |
| Bar column wrapper          | `volume-col-{index}`   | Parent of bar + label, has `flex-1`    |
| Week label                  | `volume-label-{index}` | Text: "W1", "W2", etc.                 |
| Tooltip                     | `volume-tooltip`       | Shown on hover/tap, contains volume kg |

---

## 6. Height Calculation Reference

```
heightPercent(volume, maxVolume):
  if maxVolume === 0 → return 0
  return Math.round((volume / maxVolume) * 100)
```

### Verification Table (8-week uptrend)

| Week | Volume | maxVolume | Calc                   | Height   |
| ---- | ------ | --------- | ---------------------- | -------- |
| W1   | 2000   | 5500      | 2000/5500×100 = 36.36  | **36%**  |
| W2   | 3000   | 5500      | 3000/5500×100 = 54.55  | **55%**  |
| W3   | 3500   | 5500      | 3500/5500×100 = 63.64  | **64%**  |
| W4   | 4000   | 5500      | 4000/5500×100 = 72.73  | **73%**  |
| W5   | 4200   | 5500      | 4200/5500×100 = 76.36  | **76%**  |
| W6   | 4500   | 5500      | 4500/5500×100 = 81.82  | **82%**  |
| W7   | 5000   | 5500      | 5000/5500×100 = 90.91  | **91%**  |
| W8   | 5500   | 5500      | 5500/5500×100 = 100.00 | **100%** |

---

## 7. Test Implementation Blueprint

```typescript
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VolumeTrendChart } from '@/features/fitness/components/VolumeTrendChart';
import type { WeekVolume } from '@/features/fitness/components/VolumeTrendChart';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'fitness.volumeTrend.noData': 'Chưa có dữ liệu',
      };
      return translations[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

afterEach(cleanup);

// ── Fixtures ──
const EIGHT_WEEK_UPTREND: WeekVolume[] = [
  /* ... */
];
const MIXED_WITH_ZEROS: WeekVolume[] = [
  /* ... */
];
const ALL_EQUAL: WeekVolume[] = [
  /* ... */
];
const ALL_ZEROS: WeekVolume[] = [
  /* ... */
];

describe('VolumeTrendChart', () => {
  // SC_W401_01: Empty State
  describe('empty state', () => {
    // TC_W401_01, TC_W401_02
  });

  // SC_W401_02: Single Week
  describe('single week', () => {
    // TC_W401_03, TC_W401_04
  });

  // SC_W401_03: Full 8-Week
  describe('8-week data', () => {
    // TC_W401_05, TC_W401_06
  });

  // SC_W401_04: Current Week Highlighting
  describe('current week highlighting', () => {
    // TC_W401_07, TC_W401_08, TC_W401_09
  });

  // SC_W401_05: Bar Height Proportionality
  describe('bar height proportionality', () => {
    // TC_W401_10, TC_W401_11
  });

  // SC_W401_06: Zero Volume
  describe('zero volume weeks', () => {
    // TC_W401_12, TC_W401_13
  });

  // SC_W401_07: Week Labels
  describe('week labels', () => {
    // TC_W401_14, TC_W401_15
  });

  // SC_W401_08: Container CSS
  describe('container layout', () => {
    // TC_W401_16, TC_W401_17
  });

  // SC_W401_09: Transitions
  describe('animation', () => {
    // TC_W401_18
  });

  // SC_W401_10–12: Edge Cases
  describe('edge cases', () => {
    // TC_W401_19, TC_W401_20, TC_W401_21
  });

  // SC_W401_13: Tooltip
  describe('tooltip interaction', () => {
    // TC_W401_22, TC_W401_23, TC_W401_24, TC_W401_25
  });

  // SC_W401_14: Accessibility
  describe('accessibility', () => {
    // TC_W401_26, TC_W401_27
  });

  // SC_W401_15: React.memo
  describe('optimization', () => {
    // TC_W401_28
  });

  // SC_W401_16: Fewer Than 8 Weeks
  describe('partial weeks', () => {
    // TC_W401_29, TC_W401_30
  });
});
```

---

## 8. Coverage Requirements

| Metric     | Target | Strategy                                                             |
| ---------- | ------ | -------------------------------------------------------------------- |
| Statements | 100%   | Every code path exercised                                            |
| Branches   | 100%   | Empty vs non-empty, zero vs non-zero maxVolume, isCurrent true/false |
| Functions  | 100%   | Component render, height calc, tooltip handler                       |
| Lines      | 100%   | All lines covered by ≥1 test case                                    |

### Critical Branches to Cover

1. `weeks.length === 0` → empty state
2. `weeks.length > 0` → chart render
3. `maxVolume === 0` → guard (no division by zero)
4. `maxVolume > 0` → normal height calc
5. `week.isCurrent === true` → `bg-primary`
6. `week.isCurrent === false` → `bg-primary/30`
7. `week.volume === 0` → `0%` height
8. `week.volume > 0` → calculated `%` height
9. Tooltip show (hover/click)
10. Tooltip hide (mouse leave)

---

## 9. Manual Test Cases (Emulator)

### MT_W401_01: Visual bar chart on mobile

- **Pre-condition**: APK installed, fitness tab visible, ≥2 weeks of workout data
- **Steps**:
  1. Open fitness tab → scroll to volume trend chart
  2. Verify 8 bars visible with varying heights
  3. Verify current week bar is visually distinct (primary color)
  4. Tap on a bar → tooltip shows exact kg
- **Expected Result**: Bars proportional, current week highlighted, tooltip readable
- **Type**: Manual (Emulator CDP)

### MT_W401_02: Empty state on fresh install

- **Pre-condition**: Fresh install, no workout history
- **Steps**:
  1. Navigate to fitness tab
  2. Look for volume trend chart area
- **Expected Result**: "Chưa có dữ liệu" message displayed, no bars
- **Type**: Manual (Emulator CDP)

### MT_W401_03: Transition animation visible

- **Pre-condition**: Chart with data
- **Steps**:
  1. Navigate away from fitness tab
  2. Return to fitness tab
  3. Observe bar animation
- **Expected Result**: Bars animate from 0 to final height with smooth 300ms transition
- **Type**: Manual (Emulator CDP)

---

## 10. Test Case Summary Matrix

| TC ID      | Scenario              | Input           | Expected                      | Type |
| ---------- | --------------------- | --------------- | ----------------------------- | ---- |
| TC_W401_01 | Empty state message   | `weeks=[]`      | "Chưa có dữ liệu" visible     | Unit |
| TC_W401_02 | Empty state no bars   | `weeks=[]`      | 0 bar elements                | Unit |
| TC_W401_03 | Single week — 1 bar   | 1 week          | 1 bar element                 | Unit |
| TC_W401_04 | Single week — 100%    | vol=5000        | height=`100%`                 | Unit |
| TC_W401_05 | 8 bars count          | 8 weeks         | 8 bar elements                | Unit |
| TC_W401_06 | 8 bars heights        | 2000→5500       | 36%→100%                      | Unit |
| TC_W401_07 | Current bar primary   | isCurrent=true  | `bg-primary`                  | Unit |
| TC_W401_08 | Non-current bar       | isCurrent=false | `bg-primary/30`               | Unit |
| TC_W401_09 | Multi-current defense | 2× isCurrent    | Both `bg-primary`             | Unit |
| TC_W401_10 | Max bar = 100%        | max=7500        | height=`100%`                 | Unit |
| TC_W401_11 | Fractional rounding   | 3333/10000      | height=`33%`                  | Unit |
| TC_W401_12 | Zero among non-zero   | vol=0           | height=`0%`                   | Unit |
| TC_W401_13 | All zeros no crash    | all vol=0       | all height=`0%`               | Unit |
| TC_W401_14 | Week labels text      | W1–W4           | "W1"…"W4" visible             | Unit |
| TC_W401_15 | Label CSS classes     | any             | `text-[10px] tabular-nums`    | Unit |
| TC_W401_16 | Container classes     | any             | `h-40 flex items-end gap-1`   | Unit |
| TC_W401_17 | Column flex-1         | 3 weeks         | each col has `flex-1`         | Unit |
| TC_W401_18 | Transition classes    | any             | `transition-all duration-300` | Unit |
| TC_W401_19 | All equal heights     | all 4000        | all height=`100%`             | Unit |
| TC_W401_20 | 1 non-zero in zeros   | 1× 3500         | 1× 100%, rest 0%              | Unit |
| TC_W401_21 | Large volumes         | 50000/100000    | 50%/100%                      | Unit |
| TC_W401_22 | Tooltip on hover      | vol=4250        | tooltip "4,250"               | Unit |
| TC_W401_23 | Tooltip hide          | mouseLeave      | tooltip gone                  | Unit |
| TC_W401_24 | Tooltip switches      | 2 bars          | correct vol per bar           | Unit |
| TC_W401_25 | Tooltip zero vol      | vol=0           | tooltip "0"                   | Unit |
| TC_W401_26 | Container role+aria   | any             | role="img", aria-label        | Unit |
| TC_W401_27 | Bar aria-label        | vol=3000        | contains "W1" + "3000"        | Unit |
| TC_W401_28 | React.memo            | import          | displayName set               | Unit |
| TC_W401_29 | 3 weeks = 3 bars      | 3 weeks         | exactly 3 bars                | Unit |
| TC_W401_30 | 5 weeks = 5 bars      | 5 weeks         | exactly 5 bars                | Unit |

**Total: 30 Unit Test Cases + 3 Manual Test Cases = 33 TCs**

---

## 11. Risks & Assumptions

| #   | Risk/Assumption                                                          | Mitigation                                                          |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 1   | Props interface may differ from spec §6.1                                | Test plan assumes `WeekVolume[]` — Dev adjusts if interface changes |
| 2   | Tooltip implementation (hover vs click) varies                           | Tests cover both `mouseEnter`/`mouseLeave` and `click`              |
| 3   | Height calculation rounding (Math.round vs Math.floor)                   | Tests use Math.round; Dev must match                                |
| 4   | Empty state i18n key may not exist yet                                   | Dev creates key; test mocks it                                      |
| 5   | `bg-primary/30` Tailwind opacity — className check may need exact string | Use `toContain` for partial match                                   |
| 6   | Component may export type separately                                     | Test imports from same file or types file                           |

---

**TEST_PLAN_READY**
