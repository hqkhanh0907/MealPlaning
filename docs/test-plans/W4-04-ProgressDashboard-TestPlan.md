# W4-04 — ProgressDashboard Integration Rewire: Test Plan

> **Author**: QA Engineer (Senior)
> **Task**: Replace inline `SimpleBarChart` with `VolumeTrendChart` + add `PersonalRecords` to ProgressDashboard
> **Scope**: Integration tests ONLY — unit tests for VolumeTrendChart (W4-01) and PersonalRecords (W4-02) already exist
> **Test Framework**: Vitest + React Testing Library
> **Target Coverage**: 100% for new/modified code

---

## 1. Test Strategy

### 1.1 Scope

| In Scope                                       | Out of Scope                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| VolumeTrendChart integration into bottom sheet | VolumeTrendChart internal rendering (covered by W4-01)                     |
| PersonalRecords integration into dashboard     | PersonalRecords internal rendering (covered by W4-02)                      |
| 8-week rolling WeekVolume[] computation        | `calculateWeeklyVolume()` / `getWeekBounds()` pure functions (unit-tested) |
| PersonalRecord[] computation from workoutSets  | `estimate1RM()` pure function (unit-tested)                                |
| SimpleBarChart removal verification            | Metric card internal logic (existing tests cover)                          |
| Regression of existing bottom sheet behavior   | Insights/plateau logic (existing tests cover)                              |
| Empty state for both new components            | Onboarding flow                                                            |

### 1.2 Test Approach

1. **Integration focus**: Verify ProgressDashboard correctly computes and passes data to child components
2. **Data accuracy**: Manually calculate expected WeekVolume[] and PersonalRecord[] values, compare against rendered output
3. **Regression**: Ensure ALL 20 existing test cases remain green after rewire
4. **Edge cases**: 0 workouts, workouts with 0 sets, single exercise, multiple exercises with ties

### 1.3 Environment

| Item               | Value                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------- |
| Framework          | Vitest 3.x + @testing-library/react                                                    |
| Mock strategy      | `vi.mock('react-i18next')`, `vi.mock('../store/fitnessStore')`                         |
| Fake timers        | `vi.useFakeTimers()` fixed at `2024-01-10T12:00:00.000Z`                               |
| Fixed date context | This week: Mon 2024-01-08 → Sun 2024-01-14; Last week: Mon 2024-01-01 → Sun 2024-01-07 |

### 1.4 Key Data-Testids (Contract)

**Existing (must remain)**:

- `progress-empty-state`, `progress-dashboard`, `hero-metric-card`, `volume-change`
- `metric-cards`, `metric-card-weight`, `metric-card-1rm`, `metric-card-adherence`, `metric-card-sessions`
- `cycle-progress`, `insights-section`, `insight-*`
- `metric-bottom-sheet`, `bottom-sheet-backdrop`, `close-bottom-sheet`, `time-range-filter`, `time-range-*`
- `sparkline`, `start-training-cta`, `weight-delta`, `weight-stable`

**Removed**:

- `bottom-sheet-chart` (was SimpleBarChart's testid)
- `chart-bar` (was SimpleBarChart bar testid)

**New — from VolumeTrendChart**:

- `volume-trend-chart` — chart container (replaces `bottom-sheet-chart`)
- `volume-trend-empty` — empty state within chart
- `volume-bar-{index}` — individual bars

**New — from PersonalRecords**:

- `personal-records` — section container
- `pr-title`, `pr-empty-state`, `pr-loading`
- `pr-item-{exerciseId}`, `pr-weight-{exerciseId}`, `pr-reps-{exerciseId}`, `pr-date-{exerciseId}`
- `pr-toggle-{exerciseId}`, `pr-history-{exerciseId}`

---

## 2. Test Data

### 2.1 Fixed Date Anchors

```
NOW             = 2024-01-10T12:00:00.000Z (Wednesday)
This week       = 2024-01-08 (Mon) → 2024-01-14 (Sun)
Last week       = 2024-01-01 (Mon) → 2024-01-07 (Sun)
8 weeks back    = 2023-11-20 (Mon of week -7) → 2024-01-14 (Sun of week 0)
```

### 2.2 8-Week Rolling Test Data

For TC_W404_07–TC_W404_10, create workouts spanning 8 weeks:

| Week         | Monday     | Workout IDs | Sets (exerciseId, reps × weightKg) | Volume |
| ------------ | ---------- | ----------- | ---------------------------------- | ------ |
| W-7          | 2023-11-20 | w-7         | e1: 10×60 = 600                    | 600    |
| W-6          | 2023-11-27 | w-6         | e1: 10×65 = 650                    | 650    |
| W-5          | 2023-12-04 | w-5         | e1: 10×70 = 700                    | 700    |
| W-4          | 2023-12-11 | w-4         | e1: 10×75 = 750                    | 750    |
| W-3          | 2023-12-18 | w-3         | e1: 10×80 = 800                    | 800    |
| W-2          | 2023-12-25 | w-2         | e1: 10×85 = 850                    | 850    |
| W-1          | 2024-01-01 | w-1         | e1: 10×80 = 800                    | 800    |
| W0 (current) | 2024-01-08 | w0          | e1: 10×100 = 1000                  | 1000   |

**Expected WeekVolume[]**:

```ts
[
  { weekLabel: 'W-7', volume: 600, isCurrent: false },
  { weekLabel: 'W-6', volume: 650, isCurrent: false },
  { weekLabel: 'W-5', volume: 700, isCurrent: false },
  { weekLabel: 'W-4', volume: 750, isCurrent: false },
  { weekLabel: 'W-3', volume: 800, isCurrent: false },
  { weekLabel: 'W-2', volume: 850, isCurrent: false },
  { weekLabel: 'W-1', volume: 800, isCurrent: false },
  { weekLabel: 'W0', volume: 1000, isCurrent: true },
];
```

### 2.3 PersonalRecord Test Data

For TC_W404_13–TC_W404_16, use workoutSets with multiple exercises:

| exerciseId       | Sets (workoutId, reps, weightKg, date)                                                   | Best weight | Best reps at best weight |
| ---------------- | ---------------------------------------------------------------------------------------- | ----------- | ------------------------ |
| e1 (Bench Press) | (w0, 10, 100), (w-1, 10, 80), (w-2, 10, 85), (w-3, 10, 80), (w-4, 10, 75), (w-5, 10, 70) | 100         | 10                       |
| e2 (Squat)       | (w0, 5, 120), (w-1, 5, 115), (w-2, 5, 110)                                               | 120         | 5                        |
| e3 (Curl)        | (w0, 8, 30)                                                                              | 30          | 8                        |

**Expected PersonalRecord[]** (sorted by bestWeight desc):

```ts
[
  { exerciseId: "e2", exerciseName: "Squat", bestWeight: 120, bestReps: 5, date: "2024-01-10",
    history: [{ weight: 115, reps: 5, date: "2024-01-03" }, { weight: 110, reps: 5, date: "2023-12-25" }] },
  { exerciseId: "e1", exerciseName: "Bench Press", bestWeight: 100, bestReps: 10, date: "2024-01-10",
    history: [{ weight: 85, reps: 10, date: "2023-12-25" }, { weight: 80, reps: 10, date: "2024-01-03" }, ...] },
  { exerciseId: "e3", exerciseName: "Curl", bestWeight: 30, bestReps: 8, date: "2024-01-10",
    history: [] },
]
```

---

## 3. Test Cases

### Group A: SimpleBarChart Removal Verification

#### TC_W404_01 — SimpleBarChart function no longer exists

| Field              | Value                                                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**           | Unit (Vitest — static code check)                                                                                                                                     |
| **Pre-condition**  | ProgressDashboard.tsx source after rewire                                                                                                                             |
| **Steps**          | 1. Read ProgressDashboard.tsx source via import or grep. 2. Search for `function SimpleBarChart` or `SimpleBarChart` definition.                                      |
| **Expected**       | No `SimpleBarChart` function definition found in ProgressDashboard.tsx. `grep -c 'function SimpleBarChart' src/features/fitness/components/ProgressDashboard.tsx` = 0 |
| **Implementation** | `expect(source).not.toContain('function SimpleBarChart')` OR integration: verify old testids gone                                                                     |

#### TC_W404_02 — Old testids removed from DOM

| Field             | Value                                                                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                                                                               |
| **Pre-condition** | Store has data → dashboard renders. Open bottom sheet via metric card click.                                                                                                |
| **Steps**         | 1. `setupStore(fullState())`. 2. `render(<ProgressDashboard />)`. 3. Click `metric-card-weight`. 4. Query for `bottom-sheet-chart` testid. 5. Query for `chart-bar` testid. |
| **Expected**      | `screen.queryByTestId('bottom-sheet-chart')` = `null`. `screen.queryByTestId('chart-bar')` = `null`.                                                                        |

---

### Group B: VolumeTrendChart Integration in Bottom Sheet

#### TC_W404_03 — VolumeTrendChart renders inside bottom sheet

| Field             | Value                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                                                                                            |
| **Pre-condition** | Store has workouts + workoutSets (fullState).                                                                                                                                            |
| **Steps**         | 1. `setupStore(fullState())`. 2. `render(<ProgressDashboard />)`. 3. Click `metric-card-weight` to open bottom sheet. 4. Query `volume-trend-chart` testid inside `metric-bottom-sheet`. |
| **Expected**      | `screen.getByTestId('volume-trend-chart')` exists inside `metric-bottom-sheet`.                                                                                                          |

#### TC_W404_04 — VolumeTrendChart replaces SimpleBarChart for ALL metric cards

| Field             | Value                                                                                                                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                                                                                                                              |
| **Pre-condition** | Store has fullState data.                                                                                                                                                                                                  |
| **Steps**         | For each card (`weight`, `1rm`, `adherence`, `sessions`): 1. Click `metric-card-{type}`. 2. Verify `volume-trend-chart` OR `volume-trend-empty` is present. 3. Verify `bottom-sheet-chart` is NOT present. 4. Close sheet. |
| **Expected**      | All 4 metric cards show VolumeTrendChart (or its empty state) in the bottom sheet — never SimpleBarChart.                                                                                                                  |

#### TC_W404_05 — Bottom sheet time range filter still works with VolumeTrendChart

| Field             | Value                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Type**          | Unit (Vitest)                                                                                                                                                                                                      |
| **Pre-condition** | Store has weight entries spanning 1W and 1M ranges.                                                                                                                                                                |
| **Steps**         | 1. `setupStore({ ...fullState(), weightEntries: [recent, old, extra1, extra2] })`. 2. Click `metric-card-weight`. 3. Count bars (`volume-bar-*`) in 1W range. 4. Click `time-range-1M`. 5. Count bars in 1M range. |
| **Expected**      | Bar count changes between time ranges (1M > 1W). `time-range-filter` testid still present. Time range buttons still clickable.                                                                                     |

#### TC_W404_06 — Bottom sheet close behavior unchanged

| Field             | Value                                                                                                                                                                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                                                                                                                                                         |
| **Pre-condition** | Bottom sheet is open (after metric card click).                                                                                                                                                                                                       |
| **Steps**         | 1. Open bottom sheet via `metric-card-weight`. 2. Verify `metric-bottom-sheet` present. 3. Click `bottom-sheet-backdrop`. 4. Verify sheet closed. 5. Re-open via `metric-card-1rm`. 6. Click `close-bottom-sheet` (X button). 7. Verify sheet closed. |
| **Expected**      | Both close mechanisms (backdrop + X button) still work. Sheet fully removed from DOM after close.                                                                                                                                                     |

---

### Group C: 8-Week Rolling Volume Computation

#### TC_W404_07 — Correct 8-week WeekVolume[] passed to VolumeTrendChart

| Field             | Value                                                                                                                                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                                                                                                                                                                                   |
| **Pre-condition** | Store has workouts spanning 8 weeks (see §2.2 test data).                                                                                                                                                                                                                       |
| **Steps**         | 1. Setup store with 8 weeks of workouts+sets. 2. `render(<ProgressDashboard />)`. 3. Click any metric card to open bottom sheet. 4. Count `volume-bar-*` elements → expect exactly 8 bars. 5. Verify bar heights are proportional: W0 (max=1000) gets 100%, W-7 (600) gets 60%. |
| **Expected**      | Exactly 8 `volume-bar-{0..7}` testids present. Last bar (`volume-bar-7`) has `bg-primary` class (current week). Bars 0-6 have `bg-primary/30` class. Heights: `volume-bar-0`=60%, `volume-bar-7`=100%.                                                                          |

#### TC_W404_08 — Weeks with no workouts have volume=0

| Field             | Value                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                                                                           |
| **Pre-condition** | Store has workouts in only 2 of 8 weeks (W0 and W-3).                                                                                                                   |
| **Steps**         | 1. Setup store: workouts only in week 0 and week -3. 2. Render + open bottom sheet. 3. Check bars: 6 bars should have `height: 0%`, 2 bars should have non-zero height. |
| **Expected**      | 8 bars total. Bars for empty weeks show `height: 0%`. Bar for W0 shows `height: 100%` (max).                                                                            |

#### TC_W404_09 — Rolling window slides correctly (only last 8 weeks)

| Field             | Value                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                  |
| **Pre-condition** | Store has a workout 9 weeks ago (2023-11-13) + workouts in last 8 weeks.                                       |
| **Steps**         | 1. Add workout at `2023-11-13` (week -8, outside 8-week window). 2. Render + open bottom sheet. 3. Count bars. |
| **Expected**      | Exactly 8 bars — the week-9 workout is excluded from the rolling window.                                       |

#### TC_W404_10 — Volume calculation accuracy: multi-set workouts

| Field             | Value                                                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                                                                          |
| **Pre-condition** | Week 0 has 1 workout with 3 sets: (10×100=1000, 8×80=640, 12×60=720). Total = 2360.                                                                                    |
| **Steps**         | 1. Setup store with multi-set workout. 2. Render + open bottom sheet. 3. Verify bar for current week reflects volume=2360.                                             |
| **Expected**      | `volume-bar-7` (current week) has height proportional to 2360. If this is the only week with data, height=100%. Tooltip on hover shows "2.360 kg" (Vietnamese locale). |

---

### Group D: PersonalRecords Section Integration

#### TC_W404_11 — PersonalRecords section renders between cycle progress and insights

| Field             | Value                                                                                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                                                                                          |
| **Pre-condition** | Store has fullState (active plan + insights data).                                                                                                                                     |
| **Steps**         | 1. `setupStore(fullState())`. 2. `render(<ProgressDashboard />)`. 3. Query `personal-records` testid. 4. Verify DOM order: `cycle-progress` → `personal-records` → `insights-section`. |
| **Expected**      | `screen.getByTestId('personal-records')` present. In the DOM tree of `progress-dashboard`, `personal-records` appears AFTER `cycle-progress` and BEFORE `insights-section`.            |

#### TC_W404_12 — PersonalRecords section renders when no active plan (no cycle progress)

| Field             | Value                                                                                                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                                                                                       |
| **Pre-condition** | Store has workout data but no active plan.                                                                                                                                          |
| **Steps**         | 1. `setupStore({ ...fullState(), trainingPlans: [], getActivePlan: () => undefined })`. 2. Render. 3. Verify `cycle-progress` NOT present. 4. Verify `personal-records` IS present. |
| **Expected**      | `personal-records` renders regardless of whether `cycle-progress` is present.                                                                                                       |

---

### Group E: PersonalRecord[] Data Computation

#### TC_W404_13 — Correct PR data computed from workoutSets

| Field             | Value                                                                                                                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                                                                                                                                                 |
| **Pre-condition** | Store has workoutSets for 2 exercises: e1 (max weight 100kg×10reps), e2 (max weight 120kg×5reps). Exercises store or name resolution available.                                                                                               |
| **Steps**         | 1. Setup store with multi-exercise sets. 2. Render. 3. Verify `pr-item-e1` and `pr-item-e2` exist within `personal-records`. 4. Check `pr-weight-e1` = "100kg", `pr-reps-e1` = "×10". 5. Check `pr-weight-e2` = "120kg", `pr-reps-e2` = "×5". |
| **Expected**      | Each exercise's best weight and corresponding reps are correctly displayed. PR items match computed values from §2.3.                                                                                                                         |

#### TC_W404_14 — PR history limited to last 5 entries

| Field             | Value                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                  |
| **Pre-condition** | Exercise e1 has 8 historical sets (6 non-best entries + best entry + another entry).                           |
| **Steps**         | 1. Setup store with 8 sets for e1. 2. Render. 3. Click `pr-toggle-e1`. 4. Count `pr-history-entry-*` elements. |
| **Expected**      | At most 5 history entries displayed. `pr-history-entry-0` through `pr-history-entry-4` max.                    |

#### TC_W404_15 — PR for exercise with single set (no history)

| Field             | Value                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                                 |
| **Pre-condition** | Exercise e3 has exactly 1 workoutSet (30kg×8reps).                                                                            |
| **Steps**         | 1. Setup store with 1 set for e3. 2. Render. 3. Check `pr-item-e3` present. 4. Check `pr-toggle-e3` NOT present (no history). |
| **Expected**      | PR item renders with bestWeight=30, bestReps=8. No toggle button (no history to expand).                                      |

#### TC_W404_16 — PR with tied best weight picks most recent

| Field             | Value                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                  |
| **Pre-condition** | Exercise e1 has two sets with same weight (100kg): one from 2024-01-10, one from 2024-01-03.   |
| **Steps**         | 1. Setup store with tied-weight sets. 2. Render. 3. Check `pr-date-e1` shows most recent date. |
| **Expected**      | `pr-date-e1` contains "10/01/2024" (most recent), NOT "03/01/2024".                            |

---

### Group F: Empty State Edge Cases

#### TC_W404_17 — Global empty state (0 workouts): neither new component renders

| Field             | Value                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                                                                             |
| **Pre-condition** | Store has 0 workouts (empty state).                                                                                                                                       |
| **Steps**         | 1. `setupStore()` (defaults: empty arrays). 2. Render. 3. Verify `progress-empty-state` present. 4. Query `volume-trend-chart`, `volume-trend-empty`, `personal-records`. |
| **Expected**      | `progress-empty-state` renders. `volume-trend-chart` / `volume-trend-empty` / `personal-records` all absent (dashboard body not rendered).                                |

#### TC_W404_18 — Has workouts but 0 sets → PersonalRecords empty state

| Field             | Value                                                                                                                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                                                                                                                               |
| **Pre-condition** | Store has 1 workout (triggers hasData=true) but 0 workoutSets.                                                                                                                                                              |
| **Steps**         | 1. `setupStore({ workouts: [thisWeekWorkout], workoutSets: [] })`. 2. Render. 3. Verify `progress-dashboard` present (not empty state). 4. Verify `personal-records` present. 5. Verify `pr-empty-state` present inside it. |
| **Expected**      | Dashboard renders (hasData=true). PersonalRecords shows empty state with "Chưa có kỷ lục" message.                                                                                                                          |

#### TC_W404_19 — Has workouts but 0 sets → VolumeTrendChart empty in bottom sheet

| Field             | Value                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                                     |
| **Pre-condition** | Store has 1 workout, 0 workoutSets.                                                                               |
| **Steps**         | 1. Same setup as TC_W404_18. 2. Click `metric-card-weight` (or any). 3. Check bottom sheet content.               |
| **Expected**      | Bottom sheet opens. Inside it, `volume-trend-empty` or `volume-trend-chart` with 0-height bars renders. No crash. |

#### TC_W404_20 — Workouts with sets but 0 weight (reps-only exercises)

| Field             | Value                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest)                                                                                         |
| **Pre-condition** | Store has sets with `weightKg: 0` and `reps: 20` (bodyweight exercise).                               |
| **Steps**         | 1. Setup store with bodyweight sets. 2. Render. 3. Check PersonalRecords handles bestWeight=0.        |
| **Expected**      | No crash. PR item may show "0kg" or be excluded depending on implementation. Volume=0 for those sets. |

---

### Group G: Regression — Existing Functionality

#### TC_W404_21 — All existing metric card tests pass unchanged

| Field             | Value                                                                                                                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest — regression)                                                                                                                                                                                           |
| **Pre-condition** | Existing test data from `fullState()`.                                                                                                                                                                               |
| **Steps**         | Run ALL existing test cases from ProgressDashboard.test.tsx: empty state (3 TCs), hero card, metric cards, weight delta, cycle progress (2 TCs), insights (3 TCs), bottom sheet (4 TCs), plus branch coverage tests. |
| **Expected**      | All 20 existing tests pass. Zero failures. Zero assertion changes needed (except replacing `bottom-sheet-chart` / `chart-bar` references with new testids).                                                          |

#### TC_W404_22 — Hero metric card volume change % unaffected

| Field             | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| **Type**          | Unit (Vitest — regression)                                            |
| **Pre-condition** | fullState: thisWeekVolume=1000, lastWeekVolume=800.                   |
| **Steps**         | 1. Render with fullState. 2. Check `volume-change` text.              |
| **Expected**      | `+25%` displayed (same as before rewire). Sparkline still has 7 bars. |

#### TC_W404_23 — Insights section unaffected by new sections

| Field             | Value                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| **Type**          | Unit (Vitest — regression)                                                                                  |
| **Pre-condition** | fullState generates volume-up + missed-sessions + weight-change insights.                                   |
| **Steps**         | 1. Render with fullState. 2. Verify all 3 insight testids present. 3. Dismiss volume-up. 4. Verify removed. |
| **Expected**      | Insights render and dismiss behavior identical to pre-rewire.                                               |

---

### Group H: Manual Emulator Verification

#### TC_W404_24 — Visual layout: PersonalRecords between cycle progress and insights

| Field             | Value                                                                                                                                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Manual (Emulator CDP)                                                                                                                                                                                                                             |
| **Pre-condition** | App running on emulator-5556, user has completed onboarding, has active training plan with 2+ logged workouts containing sets.                                                                                                                    |
| **Steps**         | 1. Navigate to Fitness tab → Progress sub-tab. 2. Scroll down past hero card → metric cards → cycle progress bar. 3. Verify "Kỷ lục cá nhân" section visible. 4. Continue scrolling → verify "Phân tích" (insights) section below. 5. Screenshot. |
| **Expected**      | Visual order top→bottom: Hero card → Metric cards (horizontal scroll) → Cycle progress → **Kỷ lục cá nhân** → Phân tích. No overlap, no layout breaks.                                                                                            |

#### TC_W404_25 — Visual: VolumeTrendChart in bottom sheet

| Field             | Value                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Type**          | Manual (Emulator CDP)                                                                                                                                                                                              |
| **Pre-condition** | Same as TC_W404_24.                                                                                                                                                                                                |
| **Steps**         | 1. Tap "Cân nặng" metric card. 2. Bottom sheet slides up. 3. Verify bar chart visible (not old SimpleBarChart). 4. Tap time range buttons (1W → 1M → 3M → all). 5. Verify chart updates. 6. Screenshot each range. |
| **Expected**      | VolumeTrendChart renders with colored bars. Current week bar is solid primary color. Time range changes update chart data. No "Chưa có dữ liệu" unless no data for that range.                                     |

#### TC_W404_26 — Visual: PersonalRecords expand/collapse

| Field             | Value                                                                                                                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Manual (Emulator CDP)                                                                                                                                                                                                                     |
| **Pre-condition** | User has logged multiple sets for at least 1 exercise.                                                                                                                                                                                    |
| **Steps**         | 1. Scroll to "Kỷ lục cá nhân" section. 2. Verify PR items visible with trophy icon, weight, reps, date. 3. Tap chevron to expand history. 4. Verify history entries appear below. 5. Tap again to collapse. 6. Screenshot expanded state. |
| **Expected**      | Smooth expand/collapse animation. History entries show weight+reps+date in DD/MM/YYYY format. Chevron rotates 180° when expanded.                                                                                                         |

#### TC_W404_27 — Empty state: new user with no workouts

| Field             | Value                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**          | Manual (Emulator CDP)                                                                                                                                                     |
| **Pre-condition** | Fresh app install, onboarding complete, 0 workouts logged.                                                                                                                |
| **Steps**         | 1. Navigate to Fitness → Progress. 2. Verify empty state screen. 3. Verify "Bắt đầu tập ngay →" CTA visible. 4. Verify NO PersonalRecords section visible. 5. Screenshot. |
| **Expected**      | Clean empty state. No broken layout. CTA button functional. PersonalRecords and VolumeTrendChart not rendered.                                                            |

---

## 4. Test Execution Matrix

| TC ID      | Group              | Type   | Priority | Status     |
| ---------- | ------------------ | ------ | -------- | ---------- |
| TC_W404_01 | A: Removal         | Unit   | P0       | ⬜ Pending |
| TC_W404_02 | A: Removal         | Unit   | P0       | ⬜ Pending |
| TC_W404_03 | B: VTC Integration | Unit   | P0       | ⬜ Pending |
| TC_W404_04 | B: VTC Integration | Unit   | P0       | ⬜ Pending |
| TC_W404_05 | B: VTC Integration | Unit   | P1       | ⬜ Pending |
| TC_W404_06 | B: VTC Integration | Unit   | P1       | ⬜ Pending |
| TC_W404_07 | C: 8-Week Calc     | Unit   | P0       | ⬜ Pending |
| TC_W404_08 | C: 8-Week Calc     | Unit   | P1       | ⬜ Pending |
| TC_W404_09 | C: 8-Week Calc     | Unit   | P1       | ⬜ Pending |
| TC_W404_10 | C: 8-Week Calc     | Unit   | P1       | ⬜ Pending |
| TC_W404_11 | D: PR Section      | Unit   | P0       | ⬜ Pending |
| TC_W404_12 | D: PR Section      | Unit   | P1       | ⬜ Pending |
| TC_W404_13 | E: PR Data         | Unit   | P0       | ⬜ Pending |
| TC_W404_14 | E: PR Data         | Unit   | P1       | ⬜ Pending |
| TC_W404_15 | E: PR Data         | Unit   | P1       | ⬜ Pending |
| TC_W404_16 | E: PR Data         | Unit   | P2       | ⬜ Pending |
| TC_W404_17 | F: Empty States    | Unit   | P0       | ⬜ Pending |
| TC_W404_18 | F: Empty States    | Unit   | P0       | ⬜ Pending |
| TC_W404_19 | F: Empty States    | Unit   | P1       | ⬜ Pending |
| TC_W404_20 | F: Empty States    | Unit   | P2       | ⬜ Pending |
| TC_W404_21 | G: Regression      | Unit   | P0       | ⬜ Pending |
| TC_W404_22 | G: Regression      | Unit   | P0       | ⬜ Pending |
| TC_W404_23 | G: Regression      | Unit   | P1       | ⬜ Pending |
| TC_W404_24 | H: Emulator        | Manual | P0       | ⬜ Pending |
| TC_W404_25 | H: Emulator        | Manual | P0       | ⬜ Pending |
| TC_W404_26 | H: Emulator        | Manual | P1       | ⬜ Pending |
| TC_W404_27 | H: Emulator        | Manual | P1       | ⬜ Pending |

**Priority Legend**: P0 = Must pass before merge. P1 = Should pass. P2 = Edge case, nice to have.

---

## 5. Existing Test Migration Notes

The following existing test assertions **MUST be updated** after rewire:

| Existing Test                          | Required Change                                                                                                                               |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| "bottom sheet opens on card tap"       | Replace `screen.getByTestId('bottom-sheet-chart')` → `screen.getByTestId('volume-trend-chart')` OR `screen.getByTestId('volume-trend-empty')` |
| "time range filter changes chart data" | Replace `screen.getAllByTestId('chart-bar')` → `screen.getAllByTestId(/^volume-bar-/)`                                                        |
| Any test asserting `chart-bar` count   | Update selector to `volume-bar-{index}` pattern                                                                                               |

**Tests that MUST NOT change** (no SimpleBarChart/chart-bar references):

- Empty state tests (3)
- Hero card test
- Metric cards render test
- Weight card delta test
- Cycle progress tests (2)
- Insights tests (4)
- Bottom sheet close tests (2: backdrop + X button)
- Branch coverage tests (volume down, no weight, stable weight, no insights, dismiss all, plateau, equal volume)

---

## 6. Risk Assessment

| Risk                                                 | Impact                         | Mitigation                                            |
| ---------------------------------------------------- | ------------------------------ | ----------------------------------------------------- |
| 8-week computation uses wrong week bounds            | High — incorrect chart data    | Manual calculation in TC_W404_07 with known test data |
| PersonalRecord computation picks wrong "best"        | High — misleading PR data      | TC_W404_16 explicitly tests tie-breaking behavior     |
| Bottom sheet time range filter breaks with new chart | Medium — UX regression         | TC_W404_05 verifies bar count changes with range      |
| DOM order wrong (PR section in wrong position)       | Medium — layout issue          | TC_W404_11 verifies DOM order programmatically        |
| Existing tests fail due to testid changes            | High — false regression signal | §5 migration notes document exact changes needed      |
| Performance regression from 8-week computation       | Low — memoized via useMemo     | N/A — monitor via emulator manual test                |

---

## 7. Acceptance Criteria Cross-Reference

| AC# | Acceptance Criteria                                              | Covered By                                                 |
| --- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| AC1 | SimpleBarChart function removed                                  | TC_W404_01, TC_W404_02                                     |
| AC2 | VolumeTrendChart renders in bottom sheet with 8-week data        | TC_W404_03, TC_W404_07, TC_W404_25                         |
| AC3 | PersonalRecords between cycle progress and insights              | TC_W404_11, TC_W404_24                                     |
| AC4 | PR data: best weight per exercise from workoutSets               | TC_W404_13, TC_W404_16                                     |
| AC5 | Existing metric card tests pass                                  | TC_W404_21, TC_W404_22                                     |
| AC6 | New integration tests for VTC + PR presence                      | TC_W404_03, TC_W404_04, TC_W404_11, TC_W404_12, TC_W404_13 |
| AC7 | Empty state: no workout data → both components handle gracefully | TC_W404_17, TC_W404_18, TC_W404_19, TC_W404_27             |
| AC8 | Bottom sheet works with time range + VolumeTrendChart            | TC_W404_05, TC_W404_06, TC_W404_25                         |

---

## 8. Sign-Off

| Role         | Name | Date | Status           |
| ------------ | ---- | ---- | ---------------- |
| QA Author    | —    | —    | ✅ Plan Complete |
| Dev Reviewer | —    | —    | ⬜ Pending       |
| QA Executor  | —    | —    | ⬜ Pending       |
