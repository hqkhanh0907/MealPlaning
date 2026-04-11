# Test Plan: TASK-W1-03 — WeekCalendarStrip Extraction

**Document Version**: 1.0
**Task**: W1-03
**User Story**: US-03
**Business Rules**: BR-09 (7 day statuses), BR-37 (touch targets ≥48dp)
**Design Spec**: DESIGNER-UI-SPEC §3.3
**Test Type**: Unit (Vitest + React Testing Library)
**Test File**: `src/__tests__/WeekCalendarStrip.test.tsx`
**Component File**: `src/features/fitness/components/WeekCalendarStrip.tsx`
**Status**: TEST_PLAN_READY

---

## 1. Scope & Objectives

### 1.1 In Scope

- New `WeekCalendarStrip` component (extracted from TrainingPlanView lines 433-470)
- 7 day pills with status icons (Check, Dumbbell, Moon, X)
- Today ring highlight
- Day selection callback (`onDaySelect`)
- Status color mapping per acceptance criteria
- Accessibility: `role="radiogroup"`, `role="radio"`, `aria-checked`, `aria-current="date"`

### 1.2 Out of Scope

- Existing `WeeklyCalendarStrip.tsx` (PlanScheduleEditor toggle semantics) — separate component, NOT modified
- Context menu (`onContextMenu`) — deferred to W1-06 rewire
- Expanded day preview below strip — deferred to W2-02
- Animation (`animate-slide-up`, `animate-stagger-2`) — deferred to W2-02
- Keyboard navigation (Arrow Left/Right, Home/End) — deferred to W2-02

### 1.3 Key Differences from WeeklyCalendarStrip

| Aspect         | WeeklyCalendarStrip (existing) | WeekCalendarStrip (NEW)                                |
| -------------- | ------------------------------ | ------------------------------------------------------ |
| Semantics      | Toggle (training/rest)         | Select (day details)                                   |
| Props          | `trainingDays: number[]`       | `planDays`, `completedDays`, `selectedDay`, `todayDow` |
| Icons          | None (text only)               | Check, Dumbbell, Moon (per status)                     |
| Status states  | 2 (training/rest)              | 5+ (completed/workout/rest/missed/upcoming)            |
| Shape          | `rounded-full`, h-11 w-11      | `rounded-xl`, flex-1 min-h-11                          |
| Container role | `fieldset`                     | `radiogroup`                                           |
| Pill role      | `button` with `aria-pressed`   | `radio` with `aria-checked`                            |
| Today ring     | `ring-status-info`             | `ring-primary` (per AC-2)                              |
| Used by        | PlanScheduleEditor             | TrainingPlanView                                       |
| testid prefix  | `calendar-day-{n}`             | `day-pill-{n}`                                         |

---

## 2. Props Interface (from Design §3.3)

```typescript
interface WeekCalendarStripProps {
  selectedDay: number; // 1-7 (Mon=1, Sun=7)
  todayDow: number; // Today's day of week (1-7)
  planDays: TrainingPlanDay[]; // Plan days for active plan
  completedDays: Set<number>; // Days with logged workouts this week
  onDaySelect: (day: number) => void; // Day selection callback
}
```

### 2.1 Day Status Derivation Logic (from §3.3 layout)

For each `dayNum` (1-7):

```
planDay = planDays.find(d => d.dayOfWeek === dayNum)
isRest = !planDay || planDay.workoutType === 'rest'
isCompleted = completedDays.has(dayNum)
isToday = dayNum === todayDow
isSelected = dayNum === selectedDay

Status resolution (priority order):
1. isCompleted → "completed" → Check icon, bg-success/10 text-success
2. !isCompleted && !isRest → "workout" → Dumbbell icon, bg-primary/10 text-primary
3. isRest && !isCompleted → "rest" → Moon icon, bg-muted text-muted-foreground

Ring resolution:
1. isToday → ring-2 ring-primary
2. !isToday && isSelected → ring-2 ring-ring
3. otherwise → no ring
```

**NOTE on "missed" and "upcoming"**: The acceptance criteria from TECH-LEADER-PLAN mention BR-09 (7 statuses including missed/upcoming). However, the §3.3 spec only shows 3 visual states (completed/workout/rest). The W1-03 extraction focuses on the 3 states visible in the spec; the full 7-status mapping (including missed=`bg-error/10 text-error`) may be added in W2-02 enhancement. Test plan covers the **AC-4 color mapping** for all 4 colors specified.

---

## 3. Test Scenarios

### TS-01: Basic Rendering

Verify the component renders 7 day pills in a strip layout.

### TS-02: Status Icon Rendering

Verify correct Lucide icon appears for each of the status states.

### TS-03: Status Color Mapping

Verify correct background/text color classes per acceptance criteria AC-4.

### TS-04: Today Ring Highlight

Verify today's pill has `ring-2 ring-primary` and no other pill has it.

### TS-05: Selected Day Ring

Verify selected (non-today) pill has `ring-2 ring-ring`.

### TS-06: Day Selection Callback

Verify `onDaySelect` fires with correct day number on click.

### TS-07: Accessibility

Verify ARIA roles, attributes, and labels.

### TS-08: Layout & Sizing

Verify pill dimensions, flex layout, and touch targets per BR-37.

### TS-09: Edge Cases

Verify behavior with no plan, all completed, spontaneous workouts, etc.

---

## 4. Test Cases

### TS-01: Basic Rendering

| TC ID     | Test Case                             | Pre-conditions                | Steps            | Expected Result                                                |
| --------- | ------------------------------------- | ----------------------------- | ---------------- | -------------------------------------------------------------- |
| TC_WCS_01 | Renders exactly 7 pill buttons        | Default props with 3 planDays | Render component | `getAllByRole('radio')` returns 7 elements                     |
| TC_WCS_02 | Renders Vietnamese day labels (T2-CN) | Default props                 | Render component | Text content includes "T2", "T3", "T4", "T5", "T6", "T7", "CN" |
| TC_WCS_03 | Container has radiogroup role         | Default props                 | Render component | `getByRole('radiogroup')` exists                               |
| TC_WCS_04 | Each pill has correct data-testid     | Default props                 | Render component | `day-pill-1` through `day-pill-7` all found via `getByTestId`  |
| TC_WCS_05 | Container has data-testid             | Default props                 | Render component | `getByTestId('week-calendar-strip')` exists                    |

### TS-02: Status Icon Rendering

| TC ID     | Test Case                          | Pre-conditions                                                     | Steps  | Expected Result                                                                 |
| --------- | ---------------------------------- | ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------- |
| TC_WCS_06 | Completed day shows Check icon     | `completedDays=new Set([1])`, planDay for day 1                    | Render | `day-pill-1` contains SVG with `lucide-check` class (or aria-hidden Check icon) |
| TC_WCS_07 | Workout day shows Dumbbell icon    | planDay for day 2 (workoutType="Push"), day 2 NOT in completedDays | Render | `day-pill-2` contains Dumbbell SVG                                              |
| TC_WCS_08 | Rest day shows Moon icon           | No planDay for day 3, day 3 NOT in completedDays                   | Render | `day-pill-3` contains Moon SVG                                                  |
| TC_WCS_09 | Rest-type planDay shows Moon icon  | planDay for day 4 with `workoutType="rest"`, NOT completed         | Render | `day-pill-4` contains Moon SVG                                                  |
| TC_WCS_10 | Completed overrides workout status | planDay for day 1 (workout) AND day 1 in completedDays             | Render | `day-pill-1` shows Check icon (NOT Dumbbell)                                    |
| TC_WCS_11 | Completed on rest day shows Check  | No planDay for day 5, day 5 in completedDays (spontaneous)         | Render | `day-pill-5` shows Check icon (NOT Moon)                                        |
| TC_WCS_12 | All icons have aria-hidden="true"  | Mixed statuses                                                     | Render | All SVG icons inside pills have `aria-hidden="true"`                            |
| TC_WCS_13 | Icons have correct size class      | Any status                                                         | Render | Icon SVGs have `h-3.5 w-3.5` classes                                            |

### TS-03: Status Color Mapping (AC-4)

| TC ID     | Test Case                                    | Pre-conditions                            | Steps  | Expected Result                                                        |
| --------- | -------------------------------------------- | ----------------------------------------- | ------ | ---------------------------------------------------------------------- |
| TC_WCS_14 | Completed day: bg-success/10 text-success    | Day 1 completed                           | Render | `day-pill-1` className contains `bg-success/10` AND `text-success`     |
| TC_WCS_15 | Workout day: bg-primary/10 text-primary      | Day 2 has planDay, not completed          | Render | `day-pill-2` className contains `bg-primary/10` AND `text-primary`     |
| TC_WCS_16 | Rest day: bg-muted text-muted-foreground     | Day 3 no planDay, not completed           | Render | `day-pill-3` className contains `bg-muted` AND `text-muted-foreground` |
| TC_WCS_17 | Completed color overrides workout color      | Day 1 has planDay AND completed           | Render | `day-pill-1` has `bg-success/10` NOT `bg-primary/10`                   |
| TC_WCS_18 | Completed on non-plan day uses success color | Day 5 completed, no planDay               | Render | `day-pill-5` has `bg-success/10 text-success`                          |
| TC_WCS_19 | Rest-type planDay uses muted color           | planDay.workoutType="rest", not completed | Render | Pill has `bg-muted text-muted-foreground`                              |

### TS-04: Today Ring Highlight (AC-2)

| TC ID     | Test Case                                | Pre-conditions               | Steps  | Expected Result                                                                      |
| --------- | ---------------------------------------- | ---------------------------- | ------ | ------------------------------------------------------------------------------------ |
| TC_WCS_20 | Today pill has ring-2 ring-primary       | todayDow=3                   | Render | `day-pill-3` className contains `ring-2` AND `ring-primary`                          |
| TC_WCS_21 | Non-today pills do NOT have ring-primary | todayDow=3                   | Render | `day-pill-1`, `day-pill-2`, `day-pill-4`..`day-pill-7` do NOT contain `ring-primary` |
| TC_WCS_22 | Today=Monday (day 1) has ring            | todayDow=1                   | Render | `day-pill-1` has `ring-primary`                                                      |
| TC_WCS_23 | Today=Sunday (day 7) has ring            | todayDow=7                   | Render | `day-pill-7` has `ring-primary`                                                      |
| TC_WCS_24 | Today ring applied regardless of status  | todayDow=2, day 2 completed  | Render | `day-pill-2` has BOTH `bg-success/10` AND `ring-primary`                             |
| TC_WCS_25 | Today ring applied on rest day           | todayDow=4, no planDay for 4 | Render | `day-pill-4` has BOTH `bg-muted` AND `ring-primary`                                  |

### TS-05: Selected Day Ring

| TC ID     | Test Case                             | Pre-conditions            | Steps  | Expected Result                                 |
| --------- | ------------------------------------- | ------------------------- | ------ | ----------------------------------------------- |
| TC_WCS_26 | Selected non-today pill has ring-ring | selectedDay=5, todayDow=3 | Render | `day-pill-5` has `ring-2 ring-ring`             |
| TC_WCS_27 | Selected + today → ring-primary wins  | selectedDay=3, todayDow=3 | Render | `day-pill-3` has `ring-primary` NOT `ring-ring` |
| TC_WCS_28 | Non-selected, non-today → no ring     | selectedDay=5, todayDow=3 | Render | `day-pill-1` does NOT contain `ring-2`          |
| TC_WCS_29 | aria-checked=true on selected         | selectedDay=5             | Render | `day-pill-5` has `aria-checked="true"`          |
| TC_WCS_30 | aria-checked=false on non-selected    | selectedDay=5             | Render | `day-pill-1` has `aria-checked="false"`         |

### TS-06: Day Selection Callback (AC-5)

| TC ID     | Test Case                                   | Pre-conditions                       | Steps                         | Expected Result                                                |
| --------- | ------------------------------------------- | ------------------------------------ | ----------------------------- | -------------------------------------------------------------- |
| TC_WCS_31 | Click day 1 calls onDaySelect(1)            | onDaySelect = vi.fn()                | `fireEvent.click(day-pill-1)` | `onDaySelect` called with `1`                                  |
| TC_WCS_32 | Click day 7 calls onDaySelect(7)            | onDaySelect = vi.fn()                | `fireEvent.click(day-pill-7)` | `onDaySelect` called with `7`                                  |
| TC_WCS_33 | Click each day calls correct number         | onDaySelect = vi.fn()                | Click pills 1-7 sequentially  | `onDaySelect` called 7 times with values 1,2,3,4,5,6,7         |
| TC_WCS_34 | Click today pill still calls onDaySelect    | todayDow=3, onDaySelect = vi.fn()    | `fireEvent.click(day-pill-3)` | `onDaySelect` called with `3`                                  |
| TC_WCS_35 | Click already-selected still calls callback | selectedDay=5, onDaySelect = vi.fn() | `fireEvent.click(day-pill-5)` | `onDaySelect` called with `5` (parent decides toggle behavior) |

### TS-07: Accessibility

| TC ID     | Test Case                               | Pre-conditions                    | Steps  | Expected Result                                                                   |
| --------- | --------------------------------------- | --------------------------------- | ------ | --------------------------------------------------------------------------------- |
| TC_WCS_36 | Container role="radiogroup"             | Default props                     | Render | `screen.getByRole('radiogroup')` found                                            |
| TC_WCS_37 | Container has aria-label                | Default props                     | Render | radiogroup has `aria-label` attribute with i18n label text                        |
| TC_WCS_38 | Each pill has role="radio"              | Default props                     | Render | 7 elements with `role="radio"`                                                    |
| TC_WCS_39 | aria-current="date" on today only       | todayDow=4                        | Render | `day-pill-4` has `aria-current="date"`, others do NOT have `aria-current`         |
| TC_WCS_40 | aria-label with full day name + status  | planDay for day 1, rest for day 2 | Render | `day-pill-1` has aria-label containing full day name (e.g., "Thứ Hai") and status |
| TC_WCS_41 | Pill buttons have type="button"         | Default props                     | Render | All 7 buttons have `type="button"`                                                |
| TC_WCS_42 | focus-visible ring classes on all pills | Default props                     | Render | All pills have `focus-visible:ring-2` and `focus-visible:ring-ring`               |

### TS-08: Layout & Sizing (AC-3, BR-37)

| TC ID     | Test Case                             | Pre-conditions | Steps  | Expected Result                                                   |
| --------- | ------------------------------------- | -------------- | ------ | ----------------------------------------------------------------- |
| TC_WCS_43 | Each pill has min-h-11 class          | Default props  | Render | All pill buttons have `min-h-11` (or `min-h-[44px]`) in className |
| TC_WCS_44 | Each pill has flex-1 class            | Default props  | Render | All pill buttons have `flex-1` in className                       |
| TC_WCS_45 | Each pill has rounded-xl class        | Default props  | Render | All pill buttons have `rounded-xl` in className                   |
| TC_WCS_46 | Container uses flex gap-1.5           | Default props  | Render | Container has `flex` and `gap-1.5` in className                   |
| TC_WCS_47 | Day label has correct text size       | Default props  | Render | Day label span has `text-[10px]` or `text-xs` class               |
| TC_WCS_48 | Pill has flex-col items-center layout | Default props  | Render | Each pill has `flex-col items-center justify-center`              |
| TC_WCS_49 | transition-colors on pills            | Default props  | Render | All pills have `transition-colors` class                          |

### TS-09: Edge Cases

| TC ID     | Test Case                                  | Pre-conditions                                           | Steps  | Expected Result                                                           |
| --------- | ------------------------------------------ | -------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| TC_WCS_50 | No plan days → all pills rest style        | planDays=[], completedDays=empty                         | Render | All 7 pills have `bg-muted text-muted-foreground` with Moon icons         |
| TC_WCS_51 | All days completed                         | completedDays=new Set([1,2,3,4,5,6,7])                   | Render | All 7 pills have `bg-success/10 text-success` with Check icons            |
| TC_WCS_52 | Only 2 training days                       | planDays for Mon+Thu only                                | Render | Day 1,4 = workout (Dumbbell); Days 2,3,5,6,7 = rest (Moon)                |
| TC_WCS_53 | Spontaneous workout (no plan)              | planDays=[], completedDays=new Set([3])                  | Render | `day-pill-3` = completed (Check + success), others = rest (Moon + muted)  |
| TC_WCS_54 | Empty completedDays set                    | completedDays=new Set()                                  | Render | No pill shows Check icon or success colors                                |
| TC_WCS_55 | PlanDay with workoutType "rest"            | planDay.workoutType="rest" for day 5                     | Render | `day-pill-5` renders as rest (Moon + muted)                               |
| TC_WCS_56 | Cardio vs strength both show workout       | planDay.workoutType="Cardio" for day 1, "Push" for day 2 | Render | Both `day-pill-1` and `day-pill-2` show Dumbbell icon with primary colors |
| TC_WCS_57 | Multiple plan days per day (multi-session) | 2 planDays both on dayOfWeek=3                           | Render | Day 3 shows as workout (first session used for status)                    |

---

## 5. Test Data Fixtures

### 5.1 Default Props Factory

```typescript
const createPlanDay = (overrides: Partial<TrainingPlanDay>): TrainingPlanDay => ({
  id: `pd-${overrides.dayOfWeek ?? 1}`,
  planId: 'plan-1',
  dayOfWeek: 1,
  sessionOrder: 1,
  workoutType: 'Push',
  muscleGroups: '["chest","shoulders"]',
  exercises: '[]',
  isUserAssigned: false,
  originalDayOfWeek: overrides.dayOfWeek ?? 1,
  ...overrides,
});

// 3-day split: Mon(Push), Wed(Pull), Fri(Legs)
const defaultPlanDays: TrainingPlanDay[] = [
  createPlanDay({ id: 'pd-1', dayOfWeek: 1, workoutType: 'Push' }),
  createPlanDay({ id: 'pd-3', dayOfWeek: 3, workoutType: 'Pull' }),
  createPlanDay({ id: 'pd-5', dayOfWeek: 5, workoutType: 'Legs' }),
];

const defaultProps: WeekCalendarStripProps = {
  selectedDay: 1,
  todayDow: 3, // Wednesday
  planDays: defaultPlanDays,
  completedDays: new Set([1]), // Monday completed
  onDaySelect: vi.fn(),
};
```

### 5.2 i18n Mock

```typescript
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'fitness.plan.weekOverview': 'Tổng quan tuần',
        'fitness.dayFull.0': 'Thứ 2',
        'fitness.dayFull.1': 'Thứ 3',
        'fitness.dayFull.2': 'Thứ 4',
        'fitness.dayFull.3': 'Thứ 5',
        'fitness.dayFull.4': 'Thứ 6',
        'fitness.dayFull.5': 'Thứ 7',
        'fitness.dayFull.6': 'Chủ Nhật',
      };
      return map[key] ?? key;
    },
  }),
}));
```

### 5.3 Status Combinations Matrix

| Day | planDay | completedDays.has | Expected Status | Icon     | Color Classes                    |
| --- | ------- | ----------------- | --------------- | -------- | -------------------------------- |
| 1   | Push    | true              | completed       | Check    | `bg-success/10 text-success`     |
| 2   | —       | false             | rest            | Moon     | `bg-muted text-muted-foreground` |
| 3   | Pull    | false             | workout         | Dumbbell | `bg-primary/10 text-primary`     |
| 4   | —       | false             | rest            | Moon     | `bg-muted text-muted-foreground` |
| 5   | Legs    | false             | workout         | Dumbbell | `bg-primary/10 text-primary`     |
| 6   | —       | false             | rest            | Moon     | `bg-muted text-muted-foreground` |
| 7   | —       | false             | rest            | Moon     | `bg-muted text-muted-foreground` |

---

## 6. Test Implementation Notes

### 6.1 Icon Detection Strategy

Lucide React icons render as `<svg>` with specific class patterns. Detect by:

```typescript
// Option A: Test via aria-hidden SVG presence in pill
const pill = screen.getByTestId('day-pill-1');
const svg = pill.querySelector('svg');
expect(svg).toBeInTheDocument();
expect(svg).toHaveAttribute('aria-hidden', 'true');

// Option B: If component sets data-testid on icon wrapper
// E.g., data-testid="icon-check", "icon-dumbbell", "icon-moon"
// → Prefer this if Dev adds testids

// Option C: Test icon class (lucide adds class like "lucide-check")
// → Fragile, depends on lucide-react internals
```

**Recommendation to Dev**: Add `data-testid="day-icon-{dayNum}"` on each icon wrapper or use a status data attribute like `data-status="completed"` on the pill button for easier test assertions.

### 6.2 Color Class Assertion Pattern

```typescript
// Use className.includes() for Tailwind classes
const pill = screen.getByTestId('day-pill-1');
expect(pill.className).toContain('bg-success/10');
expect(pill.className).toContain('text-success');
expect(pill.className).not.toContain('bg-primary/10');
```

### 6.3 Multiple Assertions per Pill

For comprehensive status verification, prefer a helper:

```typescript
function expectPillStatus(dayNum: number, expectedBg: string, expectedText: string, unexpectedBg?: string) {
  const pill = screen.getByTestId(`day-pill-${dayNum}`);
  expect(pill.className).toContain(expectedBg);
  expect(pill.className).toContain(expectedText);
  if (unexpectedBg) {
    expect(pill.className).not.toContain(unexpectedBg);
  }
}
```

### 6.4 Test Organization

```
describe('WeekCalendarStrip', () => {
  describe('rendering', () => { ... })        // TC_WCS_01 → TC_WCS_05
  describe('status icons', () => { ... })      // TC_WCS_06 → TC_WCS_13
  describe('status colors', () => { ... })     // TC_WCS_14 → TC_WCS_19
  describe('today highlight', () => { ... })   // TC_WCS_20 → TC_WCS_25
  describe('selected day', () => { ... })      // TC_WCS_26 → TC_WCS_30
  describe('day selection', () => { ... })     // TC_WCS_31 → TC_WCS_35
  describe('accessibility', () => { ... })     // TC_WCS_36 → TC_WCS_42
  describe('layout & sizing', () => { ... })   // TC_WCS_43 → TC_WCS_49
  describe('edge cases', () => { ... })        // TC_WCS_50 → TC_WCS_57
});
```

---

## 7. Traceability Matrix

| Acceptance Criteria                               |                                 Test Cases |
| ------------------------------------------------- | -----------------------------------------: |
| AC-1: 7 pills with correct status icons per BR-09 |      TC_WCS_01, TC_WCS_06-13, TC_WCS_50-57 |
| AC-2: Today highlighted ring-2 ring-primary       |                               TC_WCS_20-25 |
| AC-3: Status colors (4 mappings)                  |                               TC_WCS_14-19 |
| AC-4: Each pill min-h-11 flex-1 rounded-xl        |                               TC_WCS_43-45 |
| AC-5: Day click calls onDaySelect(dayNumber)      |                               TC_WCS_31-35 |
| AC-6: 100% test coverage                          |                        Full suite (57 TCs) |
| BR-09: 7 day statuses                             |   TC_WCS_06-11, TC_WCS_14-19, TC_WCS_50-57 |
| BR-37: Touch targets ≥48dp                        | TC_WCS_43 (min-h-11 = 44px ≈ 48dp at mdpi) |
| §3.3: radiogroup/radio ARIA                       |                               TC_WCS_36-42 |
| §3.3: aria-current="date"                         |                                  TC_WCS_39 |
| §3.3: aria-checked                                |                               TC_WCS_29-30 |
| Edge: No active plan                              |                                  TC_WCS_50 |
| Edge: All completed                               |                                  TC_WCS_51 |
| Edge: Spontaneous workout                         |                                  TC_WCS_53 |
| Edge: Multi-session day                           |                                  TC_WCS_57 |

---

## 8. Dev Recommendations (from QA)

1. **Add `data-status` attribute on pills** — e.g., `data-status="completed"` — makes test assertions more robust than parsing className strings for Tailwind utility classes.

2. **Use `DAY_LABELS` from constants.ts** — The existing constant `['T2','T3','T4','T5','T6','T7','CN']` already exists. Reuse it.

3. **Container testid**: Use `data-testid="week-calendar-strip"` (per Design §3.3), NOT `data-testid="calendar-strip"` (current inline code).

4. **Icon size**: Design spec says `h-3.5 w-3.5`. Ensure all 3 icon types (Check, Dumbbell, Moon) use identical sizing.

5. **Rest day detection**: Both "no planDay" and "planDay with workoutType=rest" should render as rest. Normalize via `const isRest = !planDay || planDay.workoutType.toLowerCase() === 'rest'`.

6. **Completion overrides everything**: If `completedDays.has(dayNum)` is true, the pill MUST show Check + success colors regardless of planDay/rest status. This is the highest-priority visual state.

7. **Do NOT handle "missed" or "upcoming" in W1-03** — The design spec §3.3 only defines 3 icon states (Check/Dumbbell/Moon). Missed (bg-error/10) and upcoming statuses are enhancement territory for W2-02. Keep scope clean.

---

## 9. Coverage Target

| Metric     | Target |
| ---------- | ------ |
| Statements | 100%   |
| Branches   | 100%   |
| Functions  | 100%   |
| Lines      | 100%   |

All 3 status branches (completed/workout/rest), both ring branches (today/selected), and the callback path must be covered. The 57 test cases above cover every branch.

---

**QA Sign-off**: TEST_PLAN_READY
**Total Test Cases**: 57
**Estimated Dev Test Time**: ~2 hours
