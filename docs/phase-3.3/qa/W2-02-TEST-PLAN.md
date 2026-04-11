# Test Plan: TASK-W2-02 — Week Overview Strip Redesign (WeekCalendarStrip)

**Document Version**: 1.0
**Task**: W2-02
**Business Rules**: BR-09 (7 statuses), BR-37 (≥48dp touch), BR-40 (reduced motion), BR-42 (press feedback)
**Test Type**: Unit (Vitest + React Testing Library)
**Test File**: `src/__tests__/WeekCalendarStrip.test.tsx`
**Component File**: `src/features/fitness/components/WeekCalendarStrip.tsx`
**Status**: TEST_PLAN_READY

---

## 1. Scope & Objectives

### 1.1 In Scope

- Expand `DayStatus` from 3 → 6: `completed`, `rest`, `workout`, `missed`, `noPlan`, `today` (ring modifier)
- New Lucide icons: `X` (missed), `Circle` (noPlan)
- New color: `bg-error/10 text-error` (missed), `bg-info text-info` (rest planned)
- Date number rendered below day abbreviation in each pill
- `animate-slide-up animate-stagger-2` entrance animation on container
- `motion-reduce:transform-none` on pill animations
- `active:scale-[0.98]` press feedback on all pills (BR-42)
- Selected day expanded preview panel (workout name + exercise count)
- Context menu (`onDayContextMenu`) integration test

### 1.2 Out of Scope

- StreakCounter integration (separate component)
- Keyboard navigation (Arrow Left/Right) — deferred
- Real SQLite data hydration — unit tests use mocked props

### 1.3 Delta from W1-03 Tests (57 existing TCs)

All 57 existing TCs from W1-03 MUST continue to pass. New TCs cover:

| Area           | Existing TCs              | New TCs        | Why                                              |
| -------------- | ------------------------- | -------------- | ------------------------------------------------ |
| Status icons   | TC_WCS_06–13 (3 statuses) | TC_WCS_58–67   | +3 new statuses (missed, noPlan, today modifier) |
| Status colors  | TC_WCS_14–19 (3 colors)   | TC_WCS_68–74   | +2 new colors (error, info)                      |
| Date number    | —                         | TC_WCS_75–78   | New element: date number in pill                 |
| Animation      | —                         | TC_WCS_79–84   | New: entrance animation + reduced motion         |
| Press feedback | —                         | TC_WCS_85–86   | BR-42: active:scale-[0.98]                       |
| Preview panel  | —                         | TC_WCS_87–96   | New: selected day preview below strip            |
| Context menu   | —                         | TC_WCS_97–100  | Existing prop, new test coverage                 |
| Edge cases     | TC_WCS_50–57              | TC_WCS_101–107 | Expanded for 6-status matrix                     |

---

## 2. Status Determination Logic (getDayStatus)

The redesign requires `getDayStatus` to use `todayDow` to differentiate past/future:

```
Input: dayNum, todayDow, planDays, completedDays

1. IF completedDays.has(dayNum)          → 'completed'
2. IF dayNum < todayDow AND hasPlanDay   → 'missed'      (past + planned + not done)
3. IF dayNum < todayDow AND !hasPlanDay  → 'rest'         (past + no plan = rest)
4. IF dayNum === todayDow                → status + today ring (modifier, not a status)
5. IF dayNum > todayDow AND hasPlanDay   → 'workout'      (future + planned)
6. IF dayNum > todayDow AND !hasPlanDay  → 'noPlan'       (future + no plan)
7. IF hasPlanDay && workoutType === 'rest'→ 'rest'         (explicit rest day in plan)
```

**Note**: `todayDow` splits the same "no workout" into `rest` (past) vs `noPlan` (future). The current implementation treats both as `rest` — this is the core behavioral change.

### 2.1 Status → Icon → Color Mapping (Design §4.2)

| Status           | Icon                   | Color Classes           | Background Classes      |
| ---------------- | ---------------------- | ----------------------- | ----------------------- |
| `completed`      | `Check` h-3.5 w-3.5    | `text-success`          | `bg-success/10`         |
| `rest`           | `Moon` h-3.5 w-3.5     | `text-info`             | `bg-muted`              |
| `workout`        | `Dumbbell` h-3.5 w-3.5 | `text-primary`          | `bg-primary/10`         |
| `missed`         | `X` h-3.5 w-3.5        | `text-error`            | `bg-error/10`           |
| `noPlan`         | `Circle` h-3.5 w-3.5   | `text-muted-foreground` | `bg-muted`              |
| today (modifier) | Same as base status    | Same                    | + `ring-2 ring-primary` |

---

## 3. Test Fixtures

### 3.1 Plan Day Factory (reuse existing)

```typescript
const createPlanDay = (overrides: Partial<TrainingPlanDay>): TrainingPlanDay => ({
  id: `pd-${overrides.dayOfWeek ?? 1}`,
  planId: 'plan-1',
  dayOfWeek: 1,
  sessionOrder: 1,
  workoutType: 'Push',
  muscleGroups: '["chest","shoulders"]',
  exercises: '["bench-press","overhead-press","lateral-raise"]',
  isUserAssigned: false,
  originalDayOfWeek: overrides.dayOfWeek ?? 1,
  ...overrides,
});
```

### 3.2 Default Props (updated for 6-status coverage)

```typescript
// 3-day split: Mon(Push), Wed(Pull), Fri(Legs)
// Today = Wednesday (day 3)
// Mon completed, Wed = today workout, Fri = upcoming workout
// Tue = past no-plan (rest), Thu = future no-plan (noPlan), Sat/Sun = noPlan
const defaultProps: WeekCalendarStripProps = {
  selectedDay: 1,
  todayDow: 3, // Wednesday
  planDays: [
    createPlanDay({ dayOfWeek: 1, workoutType: 'Push', exercises: '["bp","ohp","lr"]' }),
    createPlanDay({ dayOfWeek: 3, workoutType: 'Pull', exercises: '["row","curl"]' }),
    createPlanDay({ dayOfWeek: 5, workoutType: 'Legs', exercises: '["squat","rdl","lunge","calf"]' }),
  ],
  completedDays: new Set([1]), // Monday completed
  onDaySelect: vi.fn(),
};
```

**Expected status per day** (todayDow=3, completedDays={1}):

| Day     | Name | Has Plan | Completed | Rel to Today | Expected Status        |
| ------- | ---- | -------- | --------- | ------------ | ---------------------- |
| 1 (Mon) | T2   | Push     | ✅        | past         | `completed`            |
| 2 (Tue) | T3   | —        | —         | past         | `rest`                 |
| 3 (Wed) | T4   | Pull     | —         | **today**    | `workout` + today ring |
| 4 (Thu) | T5   | —        | —         | future       | `noPlan`               |
| 5 (Fri) | T6   | Legs     | —         | future       | `workout`              |
| 6 (Sat) | T7   | —        | —         | future       | `noPlan`               |
| 7 (Sun) | CN   | —        | —         | future       | `noPlan`               |

### 3.3 i18n Mock (extended)

```typescript
const i18nMap: Record<string, string> = {
  // Existing keys
  'fitness.plan.weekOverview': 'Tổng quan tuần',
  'fitness.dayFull.0': 'Thứ 2',
  'fitness.dayFull.1': 'Thứ 3',
  'fitness.dayFull.2': 'Thứ 4',
  'fitness.dayFull.3': 'Thứ 5',
  'fitness.dayFull.4': 'Thứ 6',
  'fitness.dayFull.5': 'Thứ 7',
  'fitness.dayFull.6': 'Chủ Nhật',
  'fitness.plan.completed': 'Hoàn thành',
  'fitness.plan.workout': 'Buổi tập',
  'fitness.plan.restDay': 'Ngày nghỉ',
  // NEW keys for W2-02
  'fitness.plan.missed': 'Bỏ lỡ',
  'fitness.plan.noPlan': 'Chưa có kế hoạch',
  'fitness.plan.upcoming': 'Sắp tới',
  'fitness.plan.exerciseCount': '{{count}} bài tập',
  'fitness.plan.dayPreview': '{{workoutName}} — {{count}} bài tập',
};
```

---

## 4. Test Scenarios & Test Cases

### TS-10: New Status — Missed (past, had plan, not completed)

**Pre-condition**: todayDow=5 (Friday), planDays includes Monday(1), completedDays empty.

| TC ID     | Description                             | Steps                                                         | Expected                                                 |
| --------- | --------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| TC_WCS_58 | Missed day has `data-status="missed"`   | Render with todayDow=5, planDays=[day1:Push], completedDays=∅ | day-pill-1 has `data-status="missed"`                    |
| TC_WCS_59 | Missed day shows X icon SVG             | Same as above                                                 | day-pill-1 contains `<svg>` with X icon                  |
| TC_WCS_60 | Missed day has `bg-error/10 text-error` | Same as above                                                 | pill-1 className contains `bg-error/10` AND `text-error` |
| TC_WCS_61 | Missed day aria-label includes "Bỏ lỡ"  | Same as above                                                 | pill-1 aria-label = "Thứ 2 — Bỏ lỡ"                      |
| TC_WCS_62 | Multiple missed days all show X         | todayDow=7, planDays=[1,3,5], completedDays=∅                 | pills 1,3,5 all have data-status="missed"                |

### TS-11: New Status — No Plan (future, no plan day)

**Pre-condition**: todayDow=1 (Monday), no planDays for Tue–Sun.

| TC ID     | Description                                     | Steps                                                         | Expected                                                                  |
| --------- | ----------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| TC_WCS_63 | NoPlan day has `data-status="noPlan"`           | Render with todayDow=1, planDays=[day1:Push], completedDays=∅ | day-pill-2 through day-pill-7 have `data-status="noPlan"`                 |
| TC_WCS_64 | NoPlan day shows Circle icon SVG                | Same as above                                                 | pill-4 contains `<svg>` (Circle)                                          |
| TC_WCS_65 | NoPlan day has `bg-muted text-muted-foreground` | Same as above                                                 | pill-2 className contains `bg-muted` AND `text-muted-foreground`          |
| TC_WCS_66 | NoPlan aria-label includes "Chưa có kế hoạch"   | Same as above                                                 | pill-2 aria-label = "Thứ 3 — Chưa có kế hoạch"                            |
| TC_WCS_67 | Past no-plan = rest, future no-plan = noPlan    | todayDow=4, planDays=[], completedDays=∅                      | pills 1-3 status="rest", pills 5-7 status="noPlan", pill 4 has today ring |

### TS-12: Expanded Status Colors

| TC ID     | Description                                                    | Steps                                                                 | Expected                                                                                                                     |
| --------- | -------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| TC_WCS_68 | Missed color is NOT success or primary                         | todayDow=5, planDays=[day1], completedDays=∅                          | pill-1 className NOT contain `bg-success/10` or `bg-primary/10`                                                              |
| TC_WCS_69 | Rest (planned) uses `bg-muted text-info`                       | planDays=[day4:rest], todayDow=1                                      | pill-4 has rest status with appropriate info text color                                                                      |
| TC_WCS_70 | NoPlan color differs from rest when design uses same bg        | todayDow=1, planDays=[]                                               | pill-2 (noPlan) has `bg-muted text-muted-foreground`                                                                         |
| TC_WCS_71 | Completed overrides missed (past + plan + completed)           | todayDow=5, planDays=[day1], completedDays={1}                        | pill-1 status="completed", bg-success/10                                                                                     |
| TC_WCS_72 | Completed overrides noPlan (spontaneous future workout?)       | todayDow=1, completedDays={5}                                         | pill-5 status="completed" even though future                                                                                 |
| TC_WCS_73 | Today ring on missed-equivalent day (today has plan, not done) | todayDow=3, planDays=[day3], completedDays=∅                          | pill-3 status="workout" (today=present, not past) + ring-primary                                                             |
| TC_WCS_74 | Full 6-status rainbow render                                   | todayDow=4, planDays=[1:Push,2:rest,4:Pull,6:Legs], completedDays={1} | pill-1=completed, pill-2=rest, pill-3=rest(past no-plan), pill-4=workout+today, pill-5=noPlan, pill-6=workout, pill-7=noPlan |

### TS-13: Date Number in Pill

**Pre-condition**: Component must render date number (e.g., 15, 16, ...) below day abbreviation.

> **Note to Dev**: The component currently only renders day abbreviation (T2-CN). The redesign adds a date number. This requires either a new prop (`weekStartDate: Date`) or computing from `todayDow` + current date. If the prop interface changes, update fixtures accordingly.

| TC ID     | Description                                 | Steps                           | Expected                                                                                        |
| --------- | ------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| TC_WCS_75 | Each pill renders a date number element     | Render default                  | Each pill has a `<span>` or element with numeric text (1-31)                                    |
| TC_WCS_76 | Date number is below day abbreviation       | Render default                  | Within each pill, day label span appears before date number span in DOM order (flex-col layout) |
| TC_WCS_77 | Date numbers are consecutive (Mon-Sun)      | Render with known weekStartDate | Date numbers form a consecutive sequence (e.g., 12,13,14,15,16,17,18)                           |
| TC_WCS_78 | Date number has appropriate text size class | Render default                  | Date number element has `text-xs` or `text-[10px]` class                                        |

### TS-14: Entrance Animation (AC-4, BR-40)

| TC ID     | Description                                                       | Steps                                        | Expected                                                                                                                |
| --------- | ----------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| TC_WCS_79 | Container has `animate-slide-up` class                            | Render default (reducedMotion=false)         | `week-calendar-strip` container className contains `animate-slide-up`                                                   |
| TC_WCS_80 | Container has `animate-stagger-2` class                           | Render default                               | Container className contains `animate-stagger-2`                                                                        |
| TC_WCS_81 | Reduced motion: container has `motion-reduce:transform-none`      | Render default                               | Container or pill className contains `motion-reduce:transform-none`                                                     |
| TC_WCS_82 | Reduced motion removes animation class when useReducedMotion=true | Mock `useReducedMotion()` → true, render     | Container does NOT have `animate-slide-up` (or class is present but CSS @media overrides — verify class-based approach) |
| TC_WCS_83 | Animation classes from `getAnimationClass('slideUp', 2)`          | Render, verify container uses motion utility | Container classes match output of `getAnimationClass('slideUp', 2)`                                                     |
| TC_WCS_84 | Stagger delay tier 2 = 60ms                                       | Verify CSS definition                        | `animate-stagger-2` has `animation-delay: 60ms` (CSS-level, document for visual QA)                                     |

### TS-15: Press Feedback (BR-42)

| TC ID     | Description                                     | Steps          | Expected                                                         |
| --------- | ----------------------------------------------- | -------------- | ---------------------------------------------------------------- |
| TC_WCS_85 | All 7 pills have `active:scale-[0.98]`          | Render default | Every `day-pill-{1..7}` className contains `active:scale-[0.98]` |
| TC_WCS_86 | All 7 pills have `motion-reduce:transform-none` | Render default | Every pill className contains `motion-reduce:transform-none`     |

### TS-16: Selected Day Preview Panel (AC-2)

**Pre-condition**: When a day with a workout is selected, an inline preview appears below the strip showing workout name + exercise count.

| TC ID     | Description                                        | Steps                                                            | Expected                                                                          |
| --------- | -------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| TC_WCS_87 | Preview panel renders when workout day selected    | Render with selectedDay=1 (Push, 3 exercises)                    | Element with `data-testid="day-preview"` is in document                           |
| TC_WCS_88 | Preview shows workout name                         | selectedDay=1 (Push planDay)                                     | Preview contains text "Push" (workoutType)                                        |
| TC_WCS_89 | Preview shows exercise count                       | selectedDay=1 (3 exercises in JSON)                              | Preview contains "3 bài tập"                                                      |
| TC_WCS_90 | Preview hidden when rest day selected              | selectedDay=2 (no planDay, rest)                                 | `day-preview` NOT in document                                                     |
| TC_WCS_91 | Preview hidden when noPlan day selected            | selectedDay=4 (future, no plan)                                  | `day-preview` NOT in document                                                     |
| TC_WCS_92 | Preview updates when selecting different day       | Render selectedDay=1, rerender selectedDay=5 (Legs, 4 exercises) | Preview text changes to show "Legs" and "4 bài tập"                               |
| TC_WCS_93 | Preview for completed day still shows workout info | selectedDay=1 (completed + has Push planDay)                     | Preview shows "Push" + exercise count                                             |
| TC_WCS_94 | Preview for missed day shows workout info          | todayDow=7, selectedDay=1 (missed + has Push planDay)            | Preview shows workout name + exercise count (missed ≠ no data)                    |
| TC_WCS_95 | Preview for day with 0 exercises                   | planDays=[day1: Push, exercises='[]'], selectedDay=1             | Preview shows "Push" + "0 bài tập" OR preview hidden (depends on design decision) |
| TC_WCS_96 | Preview panel has `animate-slide-up` entrance      | selectedDay=1                                                    | `day-preview` element className contains animation class                          |

### TS-17: Context Menu

| TC ID      | Description                                              | Steps                                                              | Expected                                |
| ---------- | -------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------- |
| TC_WCS_97  | Right-click calls onDayContextMenu with dayNum and event | Render with onDayContextMenu mock, fireEvent.contextMenu on pill-3 | Mock called with `(3, event)`           |
| TC_WCS_98  | Context menu fires for each day 1-7                      | contextMenu each pill                                              | Mock called 7 times with correct dayNum |
| TC_WCS_99  | No context menu handler → no error on right-click        | Render without onDayContextMenu prop                               | No error thrown on contextMenu event    |
| TC_WCS_100 | Context menu works on completed/missed/noPlan days       | contextMenu on completed(1), missed, noPlan pills                  | All fire correctly                      |

### TS-18: Expanded Edge Cases (6-status matrix)

| TC ID      | Description                                                            | Steps                                                            | Expected                                                  |
| ---------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| TC_WCS_101 | All days in past, none completed → all rest/missed                     | todayDow=7, planDays=[1,3,5], completedDays=∅                    | pills 1,3,5=missed; pills 2,4,6=rest; pill 7=today ring   |
| TC_WCS_102 | All days in future (todayDow=1) → workout/noPlan                       | todayDow=1, planDays=[3,5], completedDays=∅                      | pill-1=today, pill-3=workout, pill-5=workout, rest=noPlan |
| TC_WCS_103 | todayDow=7 (Sunday) → 6 past days + today                              | todayDow=7, planDays=[1:Push], completedDays={1}                 | pill-1=completed, pills 2-6 vary, pill-7=today ring       |
| TC_WCS_104 | Missed day with rest-type plan → rest (not missed)                     | todayDow=5, planDays=[day2: workoutType='rest'], completedDays=∅ | pill-2 status="rest" (explicit rest ≠ missed)             |
| TC_WCS_105 | Today is rest day (planned)                                            | todayDow=4, planDays=[day4: workoutType='rest']                  | pill-4 status="rest" + ring-primary                       |
| TC_WCS_106 | Today has workout + completed                                          | todayDow=3, planDays=[day3:Pull], completedDays={3}              | pill-3 status="completed" + ring-primary                  |
| TC_WCS_107 | No planDays + todayDow=4 → past=rest, future=noPlan, today=noPlan+ring | planDays=[], completedDays=∅, todayDow=4                         | pills 1-3=rest, pill-4=noPlan+ring, pills 5-7=noPlan      |

---

## 5. 360px Layout Verification

The existing TC_WCS_43–49 cover `flex-1`, `min-h-11`, `gap-1.5`, `flex-col`. Additional layout checks for the redesign:

| TC ID     | Area     | Verification                                                       |
| --------- | -------- | ------------------------------------------------------------------ |
| TC_WCS_43 | min-h-11 | Each pill ≥ 44px height (11 × 4px) — meets BR-37 ≥44dp             |
| TC_WCS_44 | flex-1   | All pills share equal width — no overflow at 360px                 |
| TC_WCS_46 | gap-1.5  | 6px gap × 6 = 36px total gap. 360-36=324px / 7 = ~46px per pill ✅ |

**Visual QA note for emulator**: At 360px viewport, 7 pills × flex-1 with gap-1.5 = each pill ~46px wide. Icons at h-3.5 w-3.5 (14px) + day label + date number must fit vertically in min-h-11 (44px). **Verify no text truncation on emulator**.

---

## 6. Accessibility Checklist

| #   | Requirement                         | TC Coverage                     | Notes                               |
| --- | ----------------------------------- | ------------------------------- | ----------------------------------- |
| A1  | `role="toolbar"` on container       | TC_WCS_03, TC_WCS_36            | Existing — keep                     |
| A2  | `aria-label` on container           | TC_WCS_37                       | Existing — keep                     |
| A3  | `aria-pressed` on selected pill     | TC_WCS_29–30                    | Existing — keep                     |
| A4  | `aria-current="date"` on today      | TC_WCS_39                       | Existing — keep                     |
| A5  | `aria-label` with day name + status | TC_WCS_40, TC_WCS_61, TC_WCS_66 | Extended for new statuses           |
| A6  | `aria-hidden="true"` on all icons   | TC_WCS_12                       | Existing — applies to new icons too |
| A7  | `type="button"` on all pills        | TC_WCS_41                       | Existing — keep                     |
| A8  | `focus-visible:ring-2` classes      | TC_WCS_42                       | Existing — keep                     |
| A9  | Touch target ≥44dp                  | TC_WCS_43                       | min-h-11 = 44px ✅                  |

---

## 7. Test Implementation Notes

### 7.1 Asserting Specific Lucide Icons

Lucide icons render as `<svg>` elements. To differentiate Check vs X vs Moon vs Dumbbell vs Circle, use one of:

```typescript
// Option A: Check data-status attribute (preferred — already in component)
expect(pill).toHaveAttribute('data-status', 'missed');

// Option B: Check SVG child count/structure (fragile — avoid)
// Option C: Snapshot specific SVG class patterns (if icons get unique classes)
```

**Recommendation**: Use `data-status` for status verification. Use SVG existence for "icon renders" verification. Do NOT assert specific SVG path data — too fragile.

### 7.2 Preview Panel Exercise Count

The `exercises` field in `TrainingPlanDay` is a JSON string: `'["bench-press","ohp","lr"]'`. The component must parse this to get count. Test with:

```typescript
// 3 exercises
createPlanDay({ exercises: '["a","b","c"]' }); // → "3 bài tập"

// 0 exercises
createPlanDay({ exercises: '[]' }); // → "0 bài tập" or hidden

// Malformed JSON (edge case)
createPlanDay({ exercises: '' }); // → graceful fallback
```

### 7.3 Animation Testing Strategy

CSS animations (`animate-slide-up`) are class-based. JSDOM does not execute CSS animations, so:

- **Assert class presence**: `expect(container.className).toContain('animate-slide-up')`
- **Assert reduced motion class**: `expect(pill.className).toContain('motion-reduce:transform-none')`
- **Do NOT assert computed animation state** — JSDOM limitation

For `useReducedMotion()` hook: mock via `vi.mock('@/utils/motion')` or override `window.matchMedia`.

### 7.4 Date Number Testing

If the component receives a `weekStartDate` prop or computes dates:

```typescript
// Mock: week of 2026-04-13 (Monday) to 2026-04-19 (Sunday)
renderStrip({ weekStartDate: new Date(2026, 3, 13) });
expect(screen.getByTestId('day-pill-1')).toHaveTextContent('13');
expect(screen.getByTestId('day-pill-7')).toHaveTextContent('19');
```

If dates are computed internally from `todayDow` — mock `Date.now()` or inject a date utility.

---

## 8. Coverage Requirements

| Metric     | Target | Notes                                                  |
| ---------- | ------ | ------------------------------------------------------ |
| Statements | 100%   | All branches of `getDayStatus` must be hit             |
| Branches   | 100%   | 6 status branches × today modifier × selected modifier |
| Functions  | 100%   | `getDayStatus`, `WeekCalendarStrip`, preview helpers   |
| Lines      | 100%   | No uncovered lines                                     |

### Critical Branch Coverage Matrix

| #   | completedDays.has | dayNum < todayDow | hasPlanDay | workoutType | Expected Status | TC                   |
| --- | ----------------- | ----------------- | ---------- | ----------- | --------------- | -------------------- |
| 1   | ✅                | any               | any        | any         | completed       | TC_WCS_10, TC_WCS_71 |
| 2   | ❌                | ✅ (past)         | ✅         | !rest       | missed          | TC_WCS_58            |
| 3   | ❌                | ✅ (past)         | ✅         | rest        | rest            | TC_WCS_104           |
| 4   | ❌                | ✅ (past)         | ❌         | —           | rest            | TC_WCS_67            |
| 5   | ❌                | ❌ (today)        | ✅         | !rest       | workout         | TC_WCS_73            |
| 6   | ❌                | ❌ (today)        | ✅         | rest        | rest            | TC_WCS_105           |
| 7   | ❌                | ❌ (today)        | ❌         | —           | noPlan          | TC_WCS_107           |
| 8   | ❌                | ❌ (future)       | ✅         | !rest       | workout         | TC_WCS_63            |
| 9   | ❌                | ❌ (future)       | ✅         | rest        | rest            | TC_WCS_09 (existing) |
| 10  | ❌                | ❌ (future)       | ❌         | —           | noPlan          | TC_WCS_63            |

---

## 9. Regression Checklist

All 57 existing TCs from W1-03 MUST pass without modification (unless the status logic change makes them legitimately need updating). Specifically:

| Existing TC                                | Risk of Breaking | Reason                                                                                                                          |
| ------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| TC_WCS_08 (rest day Moon icon)             | ⚠️ MEDIUM        | "Rest" now requires `todayDow` context. Day 2 with todayDow=3 is past+no-plan → still "rest". OK if todayDow default ≥ 3.       |
| TC_WCS_16 (rest bg-muted)                  | ⚠️ MEDIUM        | Same as above — "rest" color may change to `text-info` per new spec.                                                            |
| TC_WCS_50 (no plan days → all rest)        | 🔴 HIGH          | With todayDow differentiation, future no-plan days become `noPlan` not `rest`. **This TC MUST be updated.**                     |
| TC_WCS_54 (empty completedDays → no Check) | ⚠️ MEDIUM        | Past planned days now show `missed` instead of `workout`. May break if test asserts "no completed" but doesn't expect "missed". |

**Dev instruction**: Update these TCs to account for the `todayDow`-aware logic. Do not delete them — adapt assertions.

---

## 10. Emulator Manual Test Checklist (Post-Unit-Test)

| #   | Check                            | Method                                                       | Pass Criteria                                        |
| --- | -------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| E1  | 7 pills visible without scroll   | CDP screenshot at 360px                                      | All 7 pills in viewport, no horizontal scrollbar     |
| E2  | Icons visually correct           | Screenshot comparison                                        | Check ✓, X ✗, Dumbbell 🏋️, Moon 🌙, Circle ○ visible |
| E3  | Today ring visible               | Visual                                                       | Blue ring on today's pill                            |
| E4  | Press feedback felt              | CDP tap + screenshot                                         | Slight scale reduction visible on press              |
| E5  | Entrance animation plays         | Record screen                                                | Slide-up with 60ms stagger delay                     |
| E6  | Preview shows on tap             | CDP tap selected day → screenshot                            | Workout name + exercise count below strip            |
| E7  | Preview hides on rest/noPlan tap | CDP tap rest day → screenshot                                | No preview panel                                     |
| E8  | Reduced motion OFF               | Emulator accessibility settings → reduce motion → screenshot | No animation, no scale transform                     |

---

## 11. Summary

- **Total new TCs**: 50 (TC_WCS_58 – TC_WCS_107)
- **Existing TCs retained**: 57 (TC_WCS_01 – TC_WCS_57), ~4 need adaptation
- **Grand total**: ~107 TCs
- **Coverage target**: 100% statements, branches, functions, lines
- **Key behavioral change**: `getDayStatus` now uses `todayDow` to split past/future into missed/noPlan
- **New UI elements**: date number, preview panel, entrance animation, press feedback
- **Risk areas**: TC_WCS_50 (regression), preview panel exercise count parsing, animation class assertions

**TEST_PLAN_READY**
