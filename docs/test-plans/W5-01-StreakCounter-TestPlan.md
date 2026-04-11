# W5-01 — StreakCounter Redesign Test Plan

> **Component**: `src/features/fitness/components/StreakCounter.tsx`
> **Test File**: `src/__tests__/StreakCounter.test.tsx`
> **Author**: Senior QA Engineer
> **Date**: 2025-07-17
> **Status**: READY FOR DEV

---

## 1. Component Requirements Summary

### State Machine (4 visual states)

| State     | Condition             | Icon      | Behavior                                       |
| --------- | --------------------- | --------- | ---------------------------------------------- |
| `hidden`  | `currentStreak === 0` | —         | No DOM rendered at all                         |
| `flame`   | `1 ≤ streak ≤ 6`      | 🔥 Flame  | Flame icon + count + `animate-scale-in` on 0→1 |
| `trophy`  | `streak ≥ 7`          | 🏆 Trophy | Trophy icon + count                            |
| `at-risk` | `streakAtRisk=true`   | ⚠️ Badge  | Warning badge overlay on any active state      |

### Props / Data Source

Component reads from `useFitnessStore` via `selectActivePlan` selector + `useShallow` for `workouts` and `trainingPlanDays`. Then calls `calculateStreak()` to produce:

```typescript
interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  weekDots: Array<{
    day: number;
    status: 'completed' | 'rest' | 'missed' | 'today' | 'upcoming';
  }>;
  gracePeriodUsed: boolean;
  streakAtRisk: boolean;
}
```

### Visual Spec

| Aspect               | Requirement                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| Streak count         | `text-2xl font-bold tabular-nums`                                                                       |
| Entry animation      | `animate-scale-in` on 0→1 transition only                                                               |
| Week dots            | 7 dots, one per day Mon–Sun                                                                             |
| Dot statuses (BR-09) | completed(green), rest(blue), planned(outlined), missed(red), today(ring), future(gray), at-risk(amber) |
| Milestone text       | Visible at streak = 7, 14, 30, 60, 90                                                                   |
| Longest streak       | Always displayed when component visible                                                                 |
| Hidden state         | `streak=0` → component returns `null` (no DOM)                                                          |

### Milestone Thresholds (BR-12)

| Threshold | Label i18n Key (expected)           | Icon     |
| --------- | ----------------------------------- | -------- |
| 7         | `fitness.streak.milestone` count=7  | calendar |
| 14        | `fitness.streak.milestone` count=14 | sparkles |
| 30        | `fitness.streak.milestone` count=30 | shield   |
| 60        | `fitness.streak.milestone` count=60 | crown    |
| 90        | `fitness.streak.milestone` count=90 | trophy   |

### i18n Keys Used

| Key                                  | Vietnamese Value                     |
| ------------------------------------ | ------------------------------------ |
| `fitness.gamification.streak`        | "Chuỗi ngày tập"                     |
| `fitness.gamification.longestStreak` | "Chuỗi dài nhất"                     |
| `fitness.gamification.streakAtRisk`  | "Giữ chuỗi ngày tập nhé!"            |
| `fitness.streak.milestone`           | "🔥 Chuỗi {{count}} ngày liên tiếp!" |

---

## 2. Test Environment & Mocking Strategy

### Fixed Date

All tests use `vi.useFakeTimers()` with `FIXED_DATE = new Date('2024-01-10T12:00:00Z')` (Wednesday).

- Monday of that week: `2024-01-08`
- Wednesday (today): `2024-01-10`
- Week: Mon 08 → Sun 14

### Store Mock Pattern

```typescript
vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

function setupStore(overrides: Record<string, unknown> = {}) {
  const state = {
    workouts: [],
    trainingPlanDays: [],
    trainingPlans: [],
    ...overrides,
  };
  mockStore.mockImplementation((sel: Function) => sel(state));
}
```

### Workout Factory

```typescript
function makeWorkout(id: string, date: string): Workout {
  return { id, date, name: 'W', createdAt: date, updatedAt: date };
}
```

### Active Plan + Days Factory

```typescript
function makePlan(dayOfWeeks: number[]) {
  return {
    trainingPlans: [{ id: 'p1', status: 'active' }],
    trainingPlanDays: dayOfWeeks.map((d, i) => ({
      id: `d${i}`,
      planId: 'p1',
      dayOfWeek: d,
    })),
  };
}
```

---

## 3. Test Scenarios

| ID         | Scenario                             | Category    | Priority |
| ---------- | ------------------------------------ | ----------- | -------- |
| SC_W501_01 | Hidden state — streak=0, no workouts | State       | P0       |
| SC_W501_02 | Flame state — streak 1-6             | State       | P0       |
| SC_W501_03 | Trophy state — streak 7+             | State       | P0       |
| SC_W501_04 | At-risk badge overlay                | State       | P0       |
| SC_W501_05 | Entry animation (0→1)                | Animation   | P0       |
| SC_W501_06 | Week dots — 7 statuses per BR-09     | Visual      | P0       |
| SC_W501_07 | Milestone text at thresholds         | Feature     | P0       |
| SC_W501_08 | Longest streak display               | Feature     | P0       |
| SC_W501_09 | State transition (6→7 flame→trophy)  | Edge Case   | P0       |
| SC_W501_10 | Typography & CSS contracts           | Visual      | P1       |
| SC_W501_11 | Accessibility attributes             | A11y        | P1       |
| SC_W501_12 | React.memo optimization              | Performance | P2       |

---

## 4. Detailed Test Cases

### SC_W501_01 — Hidden State (streak=0)

#### TC_W501_01: Returns null when no workouts exist (streak=0)

- **Pre-condition**: Store has `workouts: []`, no active plan
- **Steps**:
  1. Call `setupStore({ workouts: [] })`
  2. Render `<StreakCounter />`
  3. Query for `data-testid="streak-counter"`
- **Expected Result**:
  - `queryByTestId('streak-counter')` returns `null`
  - No DOM is rendered — component returns `null`
- **Type**: Unit (Vitest + RTL)

#### TC_W501_02: Returns null when workouts exist but all are old (streak=0)

- **Pre-condition**: Store has workouts from 30 days ago only, no plan → streak breaks to 0
- **Steps**:
  1. `setupStore({ workouts: [makeWorkout('w1', '2023-12-01')] })`
  2. Render `<StreakCounter />`
  3. Query for `data-testid="streak-counter"`
- **Expected Result**:
  - `queryByTestId('streak-counter')` returns `null`
  - `calculateStreak` returns `currentStreak=0` for this input with today=2024-01-10
- **Type**: Unit (Vitest + RTL)

---

### SC_W501_02 — Flame State (streak 1-6)

#### TC_W501_03: Shows Flame icon when streak=1 (single workout today)

- **Pre-condition**: 1 workout on 2024-01-10 (today), no plan
- **Steps**:
  1. `setupStore({ workouts: [makeWorkout('w1', '2024-01-10')] })`
  2. Render `<StreakCounter />`
  3. Query for streak-counter testid
  4. Verify Flame icon presence (Lucide `<svg>` with expected class or accessible name)
  5. Verify Trophy icon is NOT present
- **Expected Result**:
  - `data-testid="streak-counter"` is in document
  - Flame icon is rendered (assert by `data-testid="streak-icon-flame"` or Lucide class)
  - `data-testid="streak-count"` has text `"1"`
  - No Trophy icon in the document
- **Type**: Unit (Vitest + RTL)

#### TC_W501_04: Shows Flame icon when streak=3 (consecutive days)

- **Pre-condition**: Workouts on 2024-01-08, 01-09, 01-10, no plan
- **Steps**:
  1. `setupStore({ workouts: [makeWorkout('w1','2024-01-08'), makeWorkout('w2','2024-01-09'), makeWorkout('w3','2024-01-10')] })`
  2. Render `<StreakCounter />`
  3. Read streak count text
- **Expected Result**:
  - `data-testid="streak-count"` has text `"3"`
  - Flame icon rendered, not Trophy
- **Type**: Unit (Vitest + RTL)

#### TC_W501_05: Shows Flame icon at streak=6 (boundary — max flame)

- **Pre-condition**: 6 consecutive workouts from 2024-01-05 through 2024-01-10, no plan
- **Steps**:
  1. Create 6 workouts: dates 01-05, 01-06, 01-07, 01-08, 01-09, 01-10
  2. `setupStore({ workouts: [...] })`
  3. Render `<StreakCounter />`
  4. Verify icon type and count
- **Expected Result**:
  - `data-testid="streak-count"` has text `"6"`
  - Flame icon rendered (NOT Trophy — 6 < 7)
- **Type**: Unit (Vitest + RTL)

---

### SC_W501_03 — Trophy State (streak ≥ 7)

#### TC_W501_06: Shows Trophy icon when streak=7 (exact threshold)

- **Pre-condition**: 7 consecutive workouts from 2024-01-04 through 2024-01-10, no plan
- **Steps**:
  1. Create 7 workouts: dates 01-04 through 01-10
  2. `setupStore({ workouts: [...] })`
  3. Render `<StreakCounter />`
  4. Verify Trophy icon, NOT Flame
- **Expected Result**:
  - `data-testid="streak-count"` has text `"7"`
  - Trophy icon rendered (assert by `data-testid="streak-icon-trophy"` or Lucide class)
  - No Flame icon in document
- **Type**: Unit (Vitest + RTL)

#### TC_W501_07: Shows Trophy icon when streak=14

- **Pre-condition**: 14 consecutive workouts ending on today, no plan
- **Steps**:
  1. Create 14 workouts: 2023-12-28 through 2024-01-10
  2. `setupStore({ workouts: [...] })`
  3. Render and check
- **Expected Result**:
  - `data-testid="streak-count"` has text `"14"`
  - Trophy icon rendered
- **Type**: Unit (Vitest + RTL)

#### TC_W501_08: Shows Trophy with high streak=30

- **Pre-condition**: 30 consecutive workouts ending on today
- **Steps**:
  1. Generate 30 workouts dynamically (2023-12-12 through 2024-01-10)
  2. Render `<StreakCounter />`
- **Expected Result**:
  - `data-testid="streak-count"` has text `"30"`
  - Trophy icon present
- **Type**: Unit (Vitest + RTL)

---

### SC_W501_04 — At-Risk Badge

#### TC_W501_09: Warning badge visible when streakAtRisk=true

- **Pre-condition**: Plan Mon/Wed/Fri (1,3,5), workouts Mon + Wed only, Tue is missed (grace consumed) → atRisk=true
- **Steps**:
  1. ```typescript
     setupStore({
       workouts: [makeWorkout('w1', '2024-01-08'), makeWorkout('w2', '2024-01-10')],
       ...makePlan([1, 3, 5]),
     });
     ```
  2. Render `<StreakCounter />`
  3. Query for streak-warning or at-risk badge testid
- **Expected Result**:
  - `data-testid="streak-warning"` is in the document
  - Warning text contains "Giữ chuỗi ngày tập nhé!" (i18n `fitness.gamification.streakAtRisk`)
- **Type**: Unit (Vitest + RTL)

#### TC_W501_10: No warning badge when streak is healthy (no grace used)

- **Pre-condition**: 3 consecutive workouts, no plan
- **Steps**:
  1. `setupStore({ workouts: [makeWorkout('w1','2024-01-08'), makeWorkout('w2','2024-01-09'), makeWorkout('w3','2024-01-10')] })`
  2. Render `<StreakCounter />`
  3. Query for streak-warning
- **Expected Result**:
  - `queryByTestId('streak-warning')` returns `null`
- **Type**: Unit (Vitest + RTL)

#### TC_W501_11: At-risk badge coexists with Flame icon (streak=3, at-risk)

- **Pre-condition**: Plan Mon-Fri (1-5), workouts Mon + Wed (skipping Tue — grace period) → streak ~3 with atRisk
- **Steps**:
  1. ```typescript
     setupStore({
       workouts: [makeWorkout('w1', '2024-01-08'), makeWorkout('w2', '2024-01-10')],
       ...makePlan([1, 2, 3, 4, 5]),
     });
     ```
  2. Render `<StreakCounter />`
  3. Verify BOTH Flame icon AND warning badge are present
- **Expected Result**:
  - Flame icon is in document (streak = small number in 1-6 range)
  - `data-testid="streak-warning"` is in document
  - Both are simultaneously visible
- **Type**: Unit (Vitest + RTL)

---

### SC_W501_05 — Entry Animation (0→1 Transition)

#### TC_W501_12: Container has `animate-scale-in` class on initial render with streak=1

- **Pre-condition**: Store transitions from 0→1 workout (first workout scenario)
- **Steps**:
  1. `setupStore({ workouts: [makeWorkout('w1', '2024-01-10')] })`
  2. Render `<StreakCounter />`
  3. Get the root container element
  4. Check `className` for `animate-scale-in`
- **Expected Result**:
  - `data-testid="streak-counter"` element's `className` contains `animate-scale-in`
- **Type**: Unit (Vitest + RTL)

#### TC_W501_13: No `animate-scale-in` when streak > 1 (not a 0→1 transition)

- **Pre-condition**: Store has streak=3 (already established streak)
- **Steps**:
  1. Setup 3 consecutive workouts
  2. Render `<StreakCounter />`
  3. Check `className` on container
- **Expected Result**:
  - `data-testid="streak-counter"` element's `className` does NOT contain `animate-scale-in`
- **Type**: Unit (Vitest + RTL)

#### TC_W501_14: No animation when streak=0 (component hidden)

- **Pre-condition**: No workouts
- **Steps**:
  1. `setupStore({ workouts: [] })`
  2. Render `<StreakCounter />`
  3. Query for any element with `animate-scale-in`
- **Expected Result**:
  - Component renders nothing → no element has `animate-scale-in`
- **Type**: Unit (Vitest + RTL)

---

### SC_W501_06 — Week Dots (7 Statuses per BR-09)

#### TC_W501_15: Renders exactly 7 week dots

- **Pre-condition**: Any store state
- **Steps**:
  1. `setupStore({ workouts: [makeWorkout('w1','2024-01-10')] })`
  2. Render `<StreakCounter />`
  3. Query `data-testid="week-dots"` children count
- **Expected Result**:
  - `week-dots` container has exactly 7 child elements
  - Each child has a day label: T2, T3, T4, T5, T6, T7, CN
- **Type**: Unit (Vitest + RTL)

#### TC_W501_16: Completed dot for past day with workout

- **Pre-condition**: Workout on Monday (2024-01-08), today=Wednesday (2024-01-10), no plan
- **Steps**:
  1. `setupStore({ workouts: [makeWorkout('w1','2024-01-08'), makeWorkout('w2','2024-01-10')] })`
  2. Render `<StreakCounter />`
  3. Query for `data-testid="dot-completed"`
- **Expected Result**:
  - At least 1 `dot-completed` element exists (Monday)
  - Completed dot icon has green color class (`text-primary`)
- **Type**: Unit (Vitest + RTL)

#### TC_W501_17: Rest dot for non-plan day

- **Pre-condition**: Plan Mon/Wed/Fri (1,3,5), workout on Mon → Tuesday (non-plan day) = rest
- **Steps**:
  1. ```typescript
     setupStore({
       workouts: [makeWorkout('w1', '2024-01-08')],
       ...makePlan([1, 3, 5]),
     });
     ```
  2. Render and query for `dot-rest`
- **Expected Result**:
  - `data-testid="dot-rest"` exists (Tuesday is not in plan)
  - Rest dot has blue styling class (`text-info`)
- **Type**: Unit (Vitest + RTL)

#### TC_W501_18: Today dot for current day

- **Pre-condition**: Today=2024-01-10 (Wednesday), with plan
- **Steps**:
  1. `setupStore({ workouts: [makeWorkout('w1','2024-01-08')], ...makePlan([1, 3, 5]) })`
  2. Render and query `dot-today`
- **Expected Result**:
  - `data-testid="dot-today"` exists (Wednesday = today)
  - Today dot has ring styling (`text-primary` with MapPin icon)
- **Type**: Unit (Vitest + RTL)

#### TC_W501_19: Missed dot for planned day without workout

- **Pre-condition**: Plan Mon-Fri (1-5), workout only Monday → Tuesday is planned but missed
- **Steps**:
  1. ```typescript
     setupStore({
       workouts: [makeWorkout('w1', '2024-01-08')],
       ...makePlan([1, 2, 3, 4, 5]),
     });
     ```
  2. Render and query `dot-missed`
- **Expected Result**:
  - `data-testid="dot-missed"` exists (Tuesday: planned, no workout)
  - Missed dot has red/destructive class (`text-destructive`)
- **Type**: Unit (Vitest + RTL)

#### TC_W501_20: Upcoming/future dots for days after today

- **Pre-condition**: Today=Wednesday (01-10), Thu-Sun are future
- **Steps**:
  1. `setupStore({ workouts: [makeWorkout('w1','2024-01-10')] })`
  2. Render and query all dots with `dot-upcoming` testid
- **Expected Result**:
  - There are 4 `dot-upcoming` elements (Thu, Fri, Sat, Sun)
  - Future dots have muted styling (`text-muted-foreground`)
- **Type**: Unit (Vitest + RTL)

#### TC_W501_21: Mixed dot statuses in a realistic week

- **Pre-condition**: Plan Mon/Wed/Fri (1,3,5), workouts Mon only, today=Wed
- **Steps**:
  1. ```typescript
     setupStore({
       workouts: [makeWorkout('w1', '2024-01-08')],
       ...makePlan([1, 3, 5]),
     });
     ```
  2. Render `<StreakCounter />`
  3. Verify all 7 dots:
     - Mon (01-08): completed (workout exists)
     - Tue (01-09): rest (not in plan, past)
     - Wed (01-10): today
     - Thu (01-11): upcoming (future)
     - Fri (01-12): upcoming (future)
     - Sat (01-13): upcoming (future)
     - Sun (01-14): upcoming (future)
- **Expected Result**:
  - Exactly 1 `dot-completed` (Mon)
  - Exactly 1 `dot-rest` (Tue)
  - Exactly 1 `dot-today` (Wed)
  - Exactly 4 `dot-upcoming` (Thu–Sun)
  - Total = 7 dots
- **Type**: Unit (Vitest + RTL)

---

### SC_W501_07 — Milestone Text at Thresholds

#### TC_W501_22: Milestone text displayed at streak=7

- **Pre-condition**: 7 consecutive workouts (2024-01-04 → 2024-01-10), no plan
- **Steps**:
  1. Generate 7 workouts
  2. Render `<StreakCounter />`
  3. Query for milestone element (`data-testid="streak-milestone"`)
- **Expected Result**:
  - `data-testid="streak-milestone"` is in document
  - Text contains the i18n-resolved string for `fitness.streak.milestone` with `count=7`
  - Expected text: "🔥 Chuỗi 7 ngày liên tiếp!"
- **Type**: Unit (Vitest + RTL)

#### TC_W501_23: Milestone text displayed at streak=14

- **Pre-condition**: 14 consecutive workouts ending on today
- **Steps**:
  1. Generate 14 workouts (2023-12-28 → 2024-01-10)
  2. Render `<StreakCounter />`
  3. Query for milestone text
- **Expected Result**:
  - Milestone element visible with count=14
  - Text: "🔥 Chuỗi 14 ngày liên tiếp!"
- **Type**: Unit (Vitest + RTL)

#### TC_W501_24: Milestone text displayed at streak=30

- **Pre-condition**: 30 consecutive workouts ending today
- **Steps**:
  1. Generate 30 workouts
  2. Render `<StreakCounter />`
- **Expected Result**:
  - Milestone text with count=30 is displayed
- **Type**: Unit (Vitest + RTL)

#### TC_W501_25: NO milestone text at streak=6 (between thresholds)

- **Pre-condition**: 6 consecutive workouts
- **Steps**:
  1. Generate 6 workouts (01-05 → 01-10)
  2. Render `<StreakCounter />`
  3. Query for `streak-milestone`
- **Expected Result**:
  - `queryByTestId('streak-milestone')` returns `null`
  - No milestone text rendered (6 is not a milestone threshold)
- **Type**: Unit (Vitest + RTL)

#### TC_W501_26: NO milestone at streak=8 (past threshold, between 7 and 14)

- **Pre-condition**: 8 consecutive workouts
- **Steps**:
  1. Generate 8 workouts (01-03 → 01-10)
  2. Render `<StreakCounter />`
  3. Query for milestone
- **Expected Result**:
  - `queryByTestId('streak-milestone')` returns `null`
  - Milestone only shows at EXACT thresholds: 7, 14, 30, 60, 90
- **Type**: Unit (Vitest + RTL)

---

### SC_W501_08 — Longest Streak Display

#### TC_W501_27: Longest streak displays correctly

- **Pre-condition**: Current streak=3, longest streak=3 (no previous streaks)
- **Steps**:
  1. `setupStore({ workouts: [makeWorkout('w1','2024-01-08'), makeWorkout('w2','2024-01-09'), makeWorkout('w3','2024-01-10')] })`
  2. Render `<StreakCounter />`
  3. Query `data-testid="streak-record"`
- **Expected Result**:
  - `data-testid="streak-record"` contains text "Chuỗi dài nhất" (i18n key `fitness.gamification.longestStreak`)
  - Text includes the number `3`
- **Type**: Unit (Vitest + RTL)

#### TC_W501_28: Longest streak can exceed current streak

- **Pre-condition**: Past streak of 5 (Dec 20-24), gap, current streak of 2 (Jan 9-10). Longest=5, current=2.
- **Steps**:
  1. ```typescript
     setupStore({
       workouts: [
         // Past streak of 5
         makeWorkout('w1', '2023-12-20'),
         makeWorkout('w2', '2023-12-21'),
         makeWorkout('w3', '2023-12-22'),
         makeWorkout('w4', '2023-12-23'),
         makeWorkout('w5', '2023-12-24'),
         // Gap (12/25 → 01/08)
         // Current streak of 2
         makeWorkout('w6', '2024-01-09'),
         makeWorkout('w7', '2024-01-10'),
       ],
     });
     ```
  2. Render `<StreakCounter />`
  3. Check streak-count and streak-record
- **Expected Result**:
  - `data-testid="streak-count"` has text `"2"` (current)
  - `data-testid="streak-record"` contains `"5"` (longest)
- **Type**: Unit (Vitest + RTL)

---

### SC_W501_09 — State Transition Edge Cases

#### TC_W501_29: Transition from flame(6) to trophy(7)

- **Pre-condition**: Test boundary at streak=6 vs streak=7
- **Steps**:
  1. **Render with streak=6**: 6 workouts (01-05 → 01-10) → assert Flame, NOT Trophy
  2. Cleanup
  3. **Render with streak=7**: 7 workouts (01-04 → 01-10) → assert Trophy, NOT Flame
- **Expected Result**:
  - streak=6 → Flame icon present, Trophy absent
  - streak=7 → Trophy icon present, Flame absent
  - Exact boundary is 7 (≥7 for trophy, <7 for flame)
- **Type**: Unit (Vitest + RTL)

#### TC_W501_30: Milestone at exact boundary 7 coincides with trophy transition

- **Pre-condition**: streak=7 is BOTH trophy threshold AND milestone threshold
- **Steps**:
  1. Create 7 consecutive workouts
  2. Render `<StreakCounter />`
  3. Verify Trophy icon + milestone text simultaneously
- **Expected Result**:
  - Trophy icon is rendered (streak ≥ 7)
  - Milestone text for count=7 is rendered
  - Both visible at the same time
- **Type**: Unit (Vitest + RTL)

---

### SC_W501_10 — Typography & CSS Contracts

#### TC_W501_31: Streak count has correct typography classes

- **Pre-condition**: streak=3 (visible state)
- **Steps**:
  1. Render with 3 workouts
  2. Get `data-testid="streak-count"` element
  3. Check `className`
- **Expected Result**:
  - className contains `text-2xl`
  - className contains `font-bold`
  - className contains `tabular-nums`
- **Type**: Unit (Vitest + RTL)

---

### SC_W501_11 — Accessibility

#### TC_W501_32: Icons have aria-hidden="true"

- **Pre-condition**: Component rendered in flame or trophy state
- **Steps**:
  1. Render with streak=3
  2. Query all `<svg>` elements inside `streak-counter`
  3. Verify `aria-hidden` attribute
- **Expected Result**:
  - All decorative SVG icons have `aria-hidden="true"`
- **Type**: Unit (Vitest + RTL)

#### TC_W501_33: Component has meaningful accessible label

- **Pre-condition**: Component rendered with streak=5
- **Steps**:
  1. Render with 5 workouts
  2. Check for `aria-label` or accessible text on container
- **Expected Result**:
  - Container has `role` and/or `aria-label` conveying streak status
  - Screen reader can announce streak count
- **Type**: Unit (Vitest + RTL)

---

## 5. Test Case Summary Matrix

| TC ID      | Scenario       | Description                         | Priority | Acceptance Criteria |
| ---------- | -------------- | ----------------------------------- | -------- | ------------------- |
| TC_W501_01 | Hidden state   | No DOM when streak=0                | P0       | AC-1                |
| TC_W501_02 | Hidden state   | No DOM with old workouts (streak=0) | P0       | AC-1                |
| TC_W501_03 | Flame state    | Flame icon at streak=1              | P0       | AC-2                |
| TC_W501_04 | Flame state    | Flame icon at streak=3              | P0       | AC-2                |
| TC_W501_05 | Flame state    | Flame at boundary streak=6          | P0       | AC-2                |
| TC_W501_06 | Trophy state   | Trophy icon at streak=7 (exact)     | P0       | AC-3                |
| TC_W501_07 | Trophy state   | Trophy icon at streak=14            | P0       | AC-3                |
| TC_W501_08 | Trophy state   | Trophy at streak=30                 | P0       | AC-3                |
| TC_W501_09 | At-risk badge  | Warning badge when atRisk=true      | P0       | AC-4                |
| TC_W501_10 | At-risk badge  | No warning when healthy             | P0       | AC-4                |
| TC_W501_11 | At-risk badge  | Badge coexists with Flame           | P0       | AC-4                |
| TC_W501_12 | Animation      | animate-scale-in at streak=1        | P0       | AC-5                |
| TC_W501_13 | Animation      | No animation when streak>1          | P0       | AC-5                |
| TC_W501_14 | Animation      | No animation when hidden            | P1       | AC-5                |
| TC_W501_15 | Week dots      | Exactly 7 dots rendered             | P0       | AC-6                |
| TC_W501_16 | Week dots      | Completed dot (green)               | P0       | AC-6                |
| TC_W501_17 | Week dots      | Rest dot (blue)                     | P0       | AC-6                |
| TC_W501_18 | Week dots      | Today dot (ring)                    | P0       | AC-6                |
| TC_W501_19 | Week dots      | Missed dot (red)                    | P0       | AC-6                |
| TC_W501_20 | Week dots      | Upcoming/future dots (gray)         | P0       | AC-6                |
| TC_W501_21 | Week dots      | Mixed statuses in realistic week    | P0       | AC-6                |
| TC_W501_22 | Milestone      | Text at streak=7                    | P0       | AC-7                |
| TC_W501_23 | Milestone      | Text at streak=14                   | P0       | AC-7                |
| TC_W501_24 | Milestone      | Text at streak=30                   | P0       | AC-7                |
| TC_W501_25 | Milestone      | No text at streak=6                 | P0       | AC-7                |
| TC_W501_26 | Milestone      | No text at streak=8                 | P0       | AC-7                |
| TC_W501_27 | Longest streak | Displays correctly                  | P0       | AC-8                |
| TC_W501_28 | Longest streak | Can exceed current streak           | P0       | AC-8                |
| TC_W501_29 | Edge case      | Flame(6)→Trophy(7) boundary         | P0       | AC-2, AC-3          |
| TC_W501_30 | Edge case      | Trophy + milestone coincide at 7    | P0       | AC-3, AC-7          |
| TC_W501_31 | CSS contracts  | text-2xl font-bold tabular-nums     | P1       | AC-8                |
| TC_W501_32 | Accessibility  | Icons have aria-hidden              | P1       | —                   |
| TC_W501_33 | Accessibility  | Meaningful accessible label         | P1       | —                   |

**Total: 33 test cases** — 27 P0 (critical), 6 P1 (important)

---

## 6. Manual Test Cases (Emulator Verification)

> These are executed on the Android emulator (emulator-5556) via CDP after building APK.

### MT_W501_01: Streak=0 hidden on fresh install

- **Pre-condition**: Fresh install (`pm clear`), complete onboarding with NO workouts logged
- **Steps**:
  1. Navigate to Fitness tab (`nav-fitness`)
  2. Screenshot the Fitness tab
  3. Run CDP: `document.querySelector('[data-testid="streak-counter"]')`
- **Expected Result**:
  - `streak-counter` element is `null` (not in DOM)
  - No streak section visible in screenshot
- **Pass/Fail Criteria**: Element absent + screenshot confirms

### MT_W501_02: Flame icon appears after logging first workout

- **Pre-condition**: Fresh install with training plan, 0 workouts
- **Steps**:
  1. Navigate to Fitness tab
  2. Verify streak-counter is NOT present (hidden)
  3. Log 1 workout via WorkoutLogger (complete all sets for today)
  4. Navigate back to Fitness overview
  5. Screenshot
  6. Verify streak-counter IS present with Flame icon
- **Expected Result**:
  - Before: no streak-counter
  - After: streak-counter visible with `animate-scale-in` entrance animation
  - Flame icon (🔥) with count "1"
  - Entry animation visually confirmed in screenshot
- **Pass/Fail Criteria**: Visual transition 0→1 with animation

### MT_W501_03: Trophy icon at streak=7 with milestone celebration

- **Pre-condition**: Mock 6 previous workouts via CDP store injection, then log today's workout
- **Steps**:
  1. Inject 6 past workouts via `Capacitor.Plugins.CapacitorSQLite.run()`
  2. Log today's workout manually
  3. Navigate to Fitness tab
  4. Screenshot
  5. Verify Trophy icon + milestone text
- **Expected Result**:
  - Trophy icon (🏆) visible, not Flame
  - Streak count shows "7"
  - Milestone text: "🔥 Chuỗi 7 ngày liên tiếp!" is visible
- **Pass/Fail Criteria**: Trophy icon + milestone text + correct count

### MT_W501_04: Week dots visual inspection

- **Pre-condition**: Plan Mon/Wed/Fri, workouts Mon only, today=Wed
- **Steps**:
  1. Setup plan + workout via CDP
  2. Navigate to Fitness tab
  3. Screenshot week-dots section
  4. Verify dot colors via CDP:
     ```javascript
     document.querySelectorAll('[data-testid="week-dots"] svg').forEach(s => {
       console.log(s.className.baseVal);
     });
     ```
- **Expected Result**:
  - Mon: green (completed)
  - Tue: blue (rest — not in plan)
  - Wed: primary ring (today)
  - Thu-Sun: gray (future)
  - 7 dots total, proper spacing
- **Pass/Fail Criteria**: Colors match spec, no overflow, proper alignment

### MT_W501_05: At-risk badge visibility on mobile viewport

- **Pre-condition**: Create at-risk scenario (grace period used)
- **Steps**:
  1. Setup plan Mon-Fri, workouts Mon + Wed (skipping Tue)
  2. Navigate to Fitness tab
  3. Screenshot
  4. Verify warning badge is visible and not clipped
  5. Check text via CDP: `getByTestId('streak-warning').textContent`
- **Expected Result**:
  - Warning badge visible: "Giữ chuỗi ngày tập nhé!"
  - Badge does not overflow container
  - Text fully readable on 411px mobile viewport
- **Pass/Fail Criteria**: Badge visible + not clipped + correct text

---

## 7. Coverage Strategy

### Target: 100% Statement/Branch/Function Coverage

| Coverage Type | Target | Strategy                                                              |
| ------------- | ------ | --------------------------------------------------------------------- |
| Statements    | 100%   | Every line of component code executed                                 |
| Branches      | 100%   | All if/else/ternary paths (hidden, flame, trophy, at-risk, milestone) |
| Functions     | 100%   | All internal helpers (DotIcon, main component)                        |
| Lines         | 100%   | Every line reached                                                    |

### Branch Coverage Matrix

| Branch                            | True path TC       | False path TC      |
| --------------------------------- | ------------------ | ------------------ |
| `streak === 0` → return null      | TC_01, TC_02       | TC_03–TC_33        |
| `streak ≤ 6` → Flame              | TC_03–TC_05        | TC_06–TC_08        |
| `streak ≥ 7` → Trophy             | TC_06–TC_08        | TC_03–TC_05        |
| `streakAtRisk` → warning          | TC_09, TC_11       | TC_10              |
| `streak === 1` → animate-scale-in | TC_12              | TC_13              |
| `milestone thresholds` → text     | TC_22–TC_24, TC_30 | TC_25, TC_26       |
| DotIcon switch cases              | TC_16–TC_20        | (default in TC_20) |

### Defensive Guards

If the redesign adds `Number.isFinite()` guards or NaN checks, add:

```typescript
// Defensive: NaN streak → treated as 0 → hidden
it('TC_GUARD: treats NaN streak as hidden', () => { ... });
```

---

## 8. Risk Assessment

| Risk                                            | Mitigation                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| `calculateStreak` interface changes in redesign | Tests mock store, not function directly — robust                 |
| New dot statuses (planned, at-risk, future)     | Week dot tests verify by testid, not by count of specific status |
| Animation class name change                     | Single TC (TC_12) checks class — easy to update                  |
| i18n key rename for milestones                  | t() mock is centralized — 1 place to update                      |
| Streak count overflow (999+ days)               | TC_08 tests streak=30; add TC for 90+ if needed                  |

---

## 9. Traceability Matrix (Test → Acceptance Criteria)

| AC   | Description                  | Test Cases                        |
| ---- | ---------------------------- | --------------------------------- |
| AC-1 | Hidden when streak=0         | TC_01, TC_02                      |
| AC-2 | Flame icon streak 1-6        | TC_03, TC_04, TC_05, TC_29        |
| AC-3 | Trophy icon streak 7+        | TC_06, TC_07, TC_08, TC_29, TC_30 |
| AC-4 | Warning badge on atRisk      | TC_09, TC_10, TC_11               |
| AC-5 | animate-scale-in on 0→1      | TC_12, TC_13, TC_14               |
| AC-6 | Week dots 7 statuses         | TC_15–TC_21                       |
| AC-7 | Milestone text at thresholds | TC_22–TC_26, TC_30                |
| AC-8 | 100% test coverage           | All TCs collectively              |

---

## 10. Notes for Dev Implementation

1. **Component MUST return `null`** when `currentStreak === 0` — existing code renders regardless. This is a breaking change from current behavior.

2. **Icon switching logic**: Use simple ternary or map:

   ```typescript
   const IconComponent = currentStreak >= 7 ? Trophy : Flame;
   ```

   Add `data-testid="streak-icon-flame"` and `data-testid="streak-icon-trophy"` for test targeting.

3. **Milestone detection**: Check if `currentStreak` is in `[7, 14, 30, 60, 90]` set. Render milestone element with `data-testid="streak-milestone"`.

4. **Animation class**: Apply `animate-scale-in` to container ONLY when `currentStreak === 1`. This implies the 0→1 transition scenario.

5. **Week dot testids**: Keep pattern `data-testid="dot-{status}"`. If multiple dots share the same status, tests use `getAllByTestId`.

6. **Existing test file**: `src/__tests__/StreakCounter.test.tsx` has 6 tests. The redesign will require rewriting ALL tests (not additive) since hidden-state behavior and icon switching are new.
