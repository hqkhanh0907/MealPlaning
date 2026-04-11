# W1-06 Test Plan — PlanEmptyState + TrainingPlanView Rewire

> **Status**: TEST_PLAN_READY
> **Components**:
>
> - NEW: `src/features/fitness/components/PlanEmptyState.tsx`
> - MODIFY: `src/features/fitness/components/TrainingPlanView.tsx` (1,093 LOC → ≤250 LOC)
>   **Test files**:
> - NEW: `src/__tests__/PlanEmptyState.test.tsx`
> - MODIFY: `src/__tests__/TrainingPlanView.test.tsx` (1,885 LOC — migrate to new structure)
>   **Type**: Unit + Integration (Vitest + React Testing Library)
>   **Author**: QA Engineer (TDD-First)
>   **Date**: 2026-07-15

---

## 1. Source Analysis

### 1.1 Current TrainingPlanView.tsx (1,093 LOC)

TrainingPlanView currently contains ALL inline logic for:

| Section              | Lines     | After Rewire               |
| -------------------- | --------- | -------------------------- |
| Empty states (4)     | 315–417   | → `PlanEmptyState.tsx`     |
| Calendar strip       | 433–470   | → `WeekCalendarStrip`      |
| Action bar           | 474–523   | → `PlanActionBar`          |
| Today workout card   | 609–765   | → `TodayWorkoutCard`       |
| Today rest card      | 768–836   | → `TodayRestCard`          |
| Non-today accordion  | 839–1008  | → `PlanDayAccordion`       |
| Context menu         | 525–565   | Stays inline (≤30 LOC)     |
| Coaching hint        | 567–582   | Stays inline (≤15 LOC)     |
| Modals               | 1014–1087 | Stays (compose wrappers)   |
| State/hooks/handlers | 148–313   | Stays (orchestrator logic) |

### 1.2 Empty State Mapping (Current → PlanEmptyState)

| #   | Condition                                  | Current Lines           | Variant   | Icon                    | testid                    | CTA                                              |
| --- | ------------------------------------------ | ----------------------- | --------- | ----------------------- | ------------------------- | ------------------------------------------------ |
| 1   | `!activePlan && planStrategy !== 'manual'` | 371–417                 | `hero`    | `Dumbbell`              | `no-plan-cta`             | "Tạo kế hoạch" → `onGeneratePlan()`              |
| 2   | `!activePlan && planStrategy === 'manual'` | 337–368                 | `hero`    | `CalendarPlus`          | `manual-plan-cta`         | "Tạo buổi tập đầu tiên" → `onCreateManualPlan()` |
| 3   | `activePlan && isPlanExpired()`            | 315–333                 | `hero`\*  | `RefreshCw`             | `plan-expired-cta`        | "Tạo chu kỳ mới" → `onGeneratePlan()`            |
| 4   | Day has 0 exercises (non-cardio)           | PlanDayAccordion:94–100 | `compact` | `Plus` (via EmptyState) | N/A (inline in accordion) | "Thêm bài tập" → `onEditExercises()`             |

\* Designer spec says `variant="standard"` for expired, but current code renders hero-style layout. **Test should verify CURRENT behavior first, then spec compliance after rewire.**

### 1.3 Five Extracted Components (W1-01 → W1-05) — Props Interfaces

#### TodayWorkoutCard (W1-01)

```typescript
interface TodayWorkoutCardProps {
  planDay: TrainingPlanDay;
  daySessions: TrainingPlanDay[];
  activeSessionId: string;
  completedSessionIds: string[];
  exercises: SelectedExercise[];
  estimatedMinutes: number;
  exercisesExpanded: boolean;
  onStartWorkout: (planDay: TrainingPlanDay) => void;
  onEditExercises: (planDay: TrainingPlanDay) => void;
  onConvertToRest: () => void;
  onRestoreOriginal: (planDayId: string) => void;
  onSelectSession: (sessionId: string) => void;
  onAddSession: () => void;
  onDeleteSession?: (dayId: string) => void;
  onToggleExerciseExpand: () => void;
}
```

**Prop count**: 16. High coupling — validates orchestrator must wire correctly.

#### TodayRestCard (W1-02)

```typescript
interface TodayRestCardProps {
  readonly tomorrowPlanDay?: TrainingPlanDay;
  readonly tomorrowExerciseCount: number;
  readonly onConvertToWorkout: () => void;
  readonly onLogWeight: () => void;
  readonly onLogCardio: () => void;
}
```

**Prop count**: 5. Medium coupling.

#### WeekCalendarStrip (W1-03)

```typescript
interface WeekCalendarStripProps {
  readonly selectedDay: number;
  readonly todayDow: number;
  readonly planDays: readonly TrainingPlanDay[];
  readonly completedDays: Set<number>;
  readonly onDaySelect: (day: number) => void;
}
```

**Prop count**: 5. Medium coupling.

#### PlanDayAccordion (W1-04)

```typescript
interface PlanDayAccordionProps {
  planDay: TrainingPlanDay;
  dayOfWeek: number;
  isExpanded: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  onStartWorkout: () => void;
  onEditExercises: () => void;
}
```

**Prop count**: 7. Medium coupling.

#### PlanActionBar (W1-05)

```typescript
interface PlanActionBarProps {
  readonly onEditSchedule: () => void;
  readonly onChangeSplit: () => void;
  readonly onBrowseTemplates: () => void;
  readonly isDisabled?: boolean;
}
```

**Prop count**: 4. Low coupling.

### 1.4 Existing Test File (1,885 LOC, ~80+ tests)

Current `TrainingPlanView.test.tsx` tests inline behavior directly. After rewire:

- Tests that validate **orchestrator behavior** (state wiring, props passing) STAY in TPV test
- Tests that validate **child component internals** (exercise list collapse, button styling) are ALREADY covered by W1-01→W1-05 tests (189 total)
- Tests MUST continue passing — **zero regression**

---

## 2. Risk Analysis

### 2.1 HIGH Risk — Prop Wiring Errors

| Risk                               | Impact                                | Likelihood | Mitigation                                               |
| ---------------------------------- | ------------------------------------- | ---------- | -------------------------------------------------------- |
| Wrong prop name passed to child    | Component renders but with wrong data | HIGH       | TypeScript catches at compile; test with specific values |
| Missing callback wiring            | Click does nothing                    | HIGH       | Test every callback fires with correct args              |
| Stale closure in useCallback       | Callback uses old state               | MEDIUM     | Test state change → callback still correct               |
| Wrong component rendered for today | Shows rest when should show workout   | HIGH       | Test both today-workout and today-rest paths             |

### 2.2 MEDIUM Risk — Empty State Context Selection

| Risk                                              | Impact              | Likelihood | Mitigation                       |
| ------------------------------------------------- | ------------------- | ---------- | -------------------------------- |
| Wrong empty state shown for condition             | User sees wrong CTA | MEDIUM     | Exhaustive condition matrix test |
| planStrategy=null shows wrong state               | Confusing UX        | MEDIUM     | Explicit test for null/undefined |
| Deleted plan shows "expired" instead of "no plan" | User confusion      | LOW        | EC-1 from BM spec                |

### 2.3 LOW Risk — Test Migration

| Risk                                      | Impact                    | Likelihood | Mitigation                            |
| ----------------------------------------- | ------------------------- | ---------- | ------------------------------------- |
| Mock structure changes break tests        | False failures            | MEDIUM     | Incremental migration — mock children |
| New mocks needed for extracted components | Missing coverage          | LOW        | List all new mocks upfront            |
| Snapshot/testid changes                   | Tests find wrong elements | LOW        | Verify testids preserved in spec      |

---

## 3. Test Scenarios — PlanEmptyState

### 3.1 Context Selection (4 contexts)

| TC ID      | Scenario                               | Pre-condition                                | Props                         | Expected Result                                                                                                     |
| ---------- | -------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| TC_PES_C01 | No plan (auto strategy)                | `context="no-plan"`, `planStrategy="auto"`   | `onAction=onGeneratePlan`     | Renders `variant="hero"`, icon=Dumbbell, title contains "Chưa có lịch tập cho tuần này", CTA="Tạo kế hoạch"         |
| TC_PES_C02 | No plan (manual strategy)              | `context="no-plan"`, `planStrategy="manual"` | `onAction=onCreateManualPlan` | Renders `variant="hero"`, icon=CalendarPlus, title contains "Sẵn sàng tự xếp lịch tập", CTA="Tạo buổi tập đầu tiên" |
| TC_PES_C03 | No plan (null strategy — never chosen) | `context="no-plan"`, `planStrategy=null`     | `onAction=onGeneratePlan`     | Renders `variant="hero"`, icon=Dumbbell, shows auto plan CTA (default)                                              |
| TC_PES_C04 | Plan expired                           | `context="expired-plan"`                     | `onAction=onGeneratePlan`     | Renders with icon=RefreshCw, title="Kế hoạch đã hết hạn", CTA="Tạo chu kỳ mới"                                      |
| TC_PES_C05 | Manual, no exercises                   | `context="manual-no-exercises"`              | `onAction=onCreateManualPlan` | Renders `variant="standard"` or similar, CTA="Tạo buổi tập đầu tiên"                                                |

### 3.2 CTA Button Interactions

| TC ID      | Scenario                                 | Pre-condition                                | Steps                                | Expected Result                                           |
| ---------- | ---------------------------------------- | -------------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| TC_PES_B01 | Auto plan CTA fires onGeneratePlan       | `context="no-plan"`, `planStrategy="auto"`   | Click "Tạo kế hoạch" button          | `onGeneratePlan` called exactly 1 time                    |
| TC_PES_B02 | Manual plan CTA fires onCreateManualPlan | `context="no-plan"`, `planStrategy="manual"` | Click "Tạo buổi tập đầu tiên" button | `onCreateManualPlan` called exactly 1 time                |
| TC_PES_B03 | Expired plan CTA fires onGeneratePlan    | `context="expired-plan"`                     | Click "Tạo chu kỳ mới" button        | `onGeneratePlan` called exactly 1 time                    |
| TC_PES_B04 | isGenerating disables auto CTA           | `context="no-plan"`, `isGenerating=true`     | Render                               | Button has `disabled` attribute, text shows "Đang tạo..." |
| TC_PES_B05 | isGenerating shows spinner               | `context="no-plan"`, `isGenerating=true`     | Render                               | Spinning RefreshCw icon visible (animate-spin class)      |
| TC_PES_B06 | CTA button has focus-visible ring        | Any context                                  | Tab to button                        | `focus-visible:ring-2` class present                      |
| TC_PES_B07 | CTA button has press feedback            | Any context                                  | Check className                      | `active:scale-95` or `active:scale-[0.98]` class present  |

### 3.3 Surface State Contract

| TC ID      | Scenario                               | Pre-condition                                | Steps                          | Expected Result                                                                    |
| ---------- | -------------------------------------- | -------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------- |
| TC_PES_S01 | Auto plan uses surfaceState contract   | `context="no-plan"`, `planStrategy="auto"`   | Render, check EmptyState props | `createSurfaceStateContract` called with `surface='fitness.plan'`, `state='setup'` |
| TC_PES_S02 | Manual plan uses surfaceState contract | `context="no-plan"`, `planStrategy="manual"` | Render, check EmptyState props | `createSurfaceStateContract` called with `surface='fitness.plan'`, `state='setup'` |
| TC_PES_S03 | data-testid preserved                  | All contexts                                 | Query by testid                | `no-plan-cta`, `manual-plan-cta`, `plan-expired-cta` testids present               |

### 3.4 Rendering Details

| TC ID      | Scenario                             | Pre-condition                                | Expected Result                                         |
| ---------- | ------------------------------------ | -------------------------------------------- | ------------------------------------------------------- |
| TC_PES_R01 | No-plan auto shows value text        | `context="no-plan"`, `planStrategy="auto"`   | Text "Sau khi tạo plan, tab này sẽ hiển thị..." visible |
| TC_PES_R02 | No-plan manual shows value text      | `context="no-plan"`, `planStrategy="manual"` | Text "Khi có buổi đầu tiên..." visible                  |
| TC_PES_R03 | Expired shows message                | `context="expired-plan"`                     | Text "Kế hoạch tập luyện của bạn đã hết hạn." visible   |
| TC_PES_R04 | training-plan-view testid on wrapper | All contexts                                 | Parent `div[data-testid="training-plan-view"]` present  |
| TC_PES_R05 | No streak/calendar in empty states   | `context="no-plan"`                          | `streak-counter` and `calendar-strip` NOT in DOM        |

### 3.5 Edge Cases

| TC ID      | Scenario                                   | Pre-condition                                  | Expected Result                                                            |
| ---------- | ------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------- |
| TC_PES_E01 | Deleted plan (not expired) shows no-plan   | Plan deleted (trainingPlans=[])                | Shows "no-plan" empty state, NOT "expired"                                 |
| TC_PES_E02 | planStrategy undefined treated as auto     | `planStrategy=undefined`                       | Shows auto CTA (same as null)                                              |
| TC_PES_E03 | onCreateManualPlan not provided for manual | `planStrategy="manual"`, no onCreateManualPlan | Falls back gracefully — no crash, shows auto CTA or disables manual button |

---

## 4. Test Scenarios — TrainingPlanView Rewire (Orchestrator)

### 4.1 Component Composition Verification

| TC ID      | Scenario                                        | Pre-condition                           | Expected Result                                                                                         |
| ---------- | ----------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| TC_TPV_W01 | Renders WeekCalendarStrip when plan active      | Active plan + planDays                  | `week-calendar-strip` OR `day-pill-1`..`day-pill-7` testids in DOM                                      |
| TC_TPV_W02 | Renders PlanActionBar when plan active          | Active plan                             | `plan-action-bar` with `action-edit-schedule`, `action-change-split`, `action-templates` testids in DOM |
| TC_TPV_W03 | Renders TodayWorkoutCard when today has workout | Today=Monday, planDay for Monday exists | `today-workout-card` testid in DOM, `start-workout-btn` visible                                         |
| TC_TPV_W04 | Renders TodayRestCard when today is rest        | Today=Tuesday (no planDay)              | `rest-day-card` testid in DOM, rest tips visible                                                        |
| TC_TPV_W05 | Renders PlanDayAccordion for non-today days     | Active plan, multiple planDays          | `plan-day-{N}` or `day-row-{N}` testids for non-today workout days                                      |
| TC_TPV_W06 | Renders PlanEmptyState when no plan             | trainingPlans=[]                        | Empty state CTA visible, NO calendar/action-bar                                                         |
| TC_TPV_W07 | Renders PlanEmptyState when plan expired        | Expired endDate                         | Expired CTA visible                                                                                     |
| TC_TPV_W08 | StreakCounter rendered when plan active         | Active plan                             | `streak-counter` testid in DOM                                                                          |
| TC_TPV_W09 | EnergyBalanceCard rendered when plan active     | Active plan                             | Component receives `caloriesIn`, `caloriesOut`, `targetCalories`, `proteinCurrent`, `proteinTarget`     |
| TC_TPV_W10 | DailyWeightInput rendered at bottom             | Active plan                             | `daily-weight-input` testid in DOM                                                                      |

### 4.2 Prop Wiring — WeekCalendarStrip

| TC ID        | Scenario                                 | Pre-condition                | Steps                        | Expected Result                                       |
| ------------ | ---------------------------------------- | ---------------------------- | ---------------------------- | ----------------------------------------------------- |
| TC_TPV_WCS01 | selectedDay passed as todayDow initially | Today=Monday (1)             | Render                       | Day 1 pill has selected/highlight state               |
| TC_TPV_WCS02 | onDaySelect toggles accordion expand     | Today=Monday                 | Click day-pill-3 (Wednesday) | Wednesday day row expands                             |
| TC_TPV_WCS03 | planDays correctly mapped                | 4 planDays (Mon/Wed/Fri/Sat) | Render                       | Days 1,3,5,6 show workout pills; days 2,4,7 show rest |
| TC_TPV_WCS04 | todayDow matches actual day              | Fake timer = Monday          | Render                       | Day 1 has `aria-current="date"`                       |

### 4.3 Prop Wiring — TodayWorkoutCard

| TC ID        | Scenario                                         | Pre-condition         | Steps                 | Expected Result                                                                                |
| ------------ | ------------------------------------------------ | --------------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| TC_TPV_TWC01 | onStartWorkout wires to pushPage(WorkoutLogger)  | Today has workout     | Click "Bắt đầu"       | `pushPage` called with `{id: 'workout-logger', component: 'WorkoutLogger', props: {planDay}}`  |
| TC_TPV_TWC02 | onEditExercises wires to pushPage(PlanDayEditor) | Today has workout     | Click edit button     | `pushPage` called with `{id: 'plan-day-editor', component: 'PlanDayEditor', props: {planDay}}` |
| TC_TPV_TWC03 | onConvertToRest wires to confirmation modal      | Today has workout     | Click convert-to-rest | Confirmation modal opens                                                                       |
| TC_TPV_TWC04 | exercises passed correctly                       | Today has 3 exercises | Render                | Exercise names "Bench Press", "Shoulder Press", "Fly" visible                                  |
| TC_TPV_TWC05 | estimatedMinutes calculated from exercises       | 3 exercises with rest | Render                | Duration estimate shown                                                                        |
| TC_TPV_TWC06 | onRestoreOriginal wires to store action          | Modified exercises    | Click restore button  | `restorePlanDayOriginal(planDayId)` called                                                     |
| TC_TPV_TWC07 | activeSessionId defaults to first session        | 2 sessions for today  | Render                | First session active                                                                           |
| TC_TPV_TWC08 | onSelectSession updates activeSessionId          | 2 sessions            | Click session tab     | Active session changes                                                                         |

### 4.4 Prop Wiring — TodayRestCard

| TC ID        | Scenario                                        | Pre-condition                 | Steps                  | Expected Result                                      |
| ------------ | ----------------------------------------------- | ----------------------------- | ---------------------- | ---------------------------------------------------- |
| TC_TPV_TRC01 | onConvertToWorkout wires to AddSessionModal     | Today=rest day                | Click "Thêm buổi tập"  | AddSessionModal opens                                |
| TC_TPV_TRC02 | onLogWeight scrolls to DailyWeightInput         | Today=rest                    | Click "Log cân nặng"   | `scrollIntoView` called on DailyWeightInput          |
| TC_TPV_TRC03 | onLogCardio wires to pushPage(CardioLogger)     | Today=rest                    | Click "Log cardio nhẹ" | `pushPage` called with `{component: 'CardioLogger'}` |
| TC_TPV_TRC04 | tomorrowPlanDay passed correctly                | Tomorrow=Wednesday (Pull day) | Render                 | "Ngày mai: Pull — 3 bài tập" visible                 |
| TC_TPV_TRC05 | tomorrowPlanDay undefined when tomorrow is rest | Tomorrow has no planDay       | Render                 | Tomorrow preview NOT shown                           |

### 4.5 Prop Wiring — PlanActionBar

| TC ID        | Scenario                                                 | Pre-condition | Steps              | Expected Result                                                                                                |
| ------------ | -------------------------------------------------------- | ------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| TC_TPV_PAB01 | onEditSchedule wires to pushPage(PlanScheduleEditor)     | Active plan   | Click "Chỉnh lịch" | `pushPage` called with `{component: 'PlanScheduleEditor', props: {planId: 'plan1'}}`                           |
| TC_TPV_PAB02 | onChangeSplit wires to pushPage(SplitChanger)            | Active plan   | Click "Đổi Split"  | `pushPage` called with `{component: 'SplitChanger', props: {planId: 'plan1', currentSplit: 'Push/Pull/Legs'}}` |
| TC_TPV_PAB03 | onBrowseTemplates wires to pushPage(PlanTemplateGallery) | Active plan   | Click "Mẫu Plan"   | `pushPage` called with `{component: 'PlanTemplateGallery', props: {planId: 'plan1'}}`                          |

### 4.6 Prop Wiring — PlanDayAccordion

| TC ID        | Scenario                                   | Pre-condition             | Steps              | Expected Result                                          |
| ------------ | ------------------------------------------ | ------------------------- | ------------------ | -------------------------------------------------------- |
| TC_TPV_PDA01 | Non-today day accordion toggle works       | Click day-pill-3 → expand | Click toggle again | Day 3 collapses                                          |
| TC_TPV_PDA02 | onStartWorkout for non-today day           | Expand Wed, click start   | Start button click | `pushPage(WorkoutLogger)` called with Wednesday planDay  |
| TC_TPV_PDA03 | onEditExercises for non-today day          | Expand Wed, click edit    | Edit button click  | `pushPage(PlanDayEditor)` called with Wednesday planDay  |
| TC_TPV_PDA04 | isExpanded prop matches expandedDays state | Click day 3, then day 5   | Render             | Days 3 and 5 both expanded (Set accumulates)             |
| TC_TPV_PDA05 | Today day NOT rendered as PlanDayAccordion | Today=Monday              | Render             | Day 1 rendered as TodayWorkoutCard, NOT PlanDayAccordion |

### 4.7 Context Menu (stays inline in orchestrator)

| TC ID       | Scenario                                        | Pre-condition                     | Steps                                    | Expected Result                                           |
| ----------- | ----------------------------------------------- | --------------------------------- | ---------------------------------------- | --------------------------------------------------------- |
| TC_TPV_CM01 | Right-click workout day shows "convert to rest" | Plan active                       | Right-click on day-pill-1 (workout)      | `day-context-menu` with `ctx-convert-rest` button visible |
| TC_TPV_CM02 | Right-click rest day shows "add workout"        | Plan active                       | Right-click on day-pill-2 (rest)         | `day-context-menu` with `ctx-add-workout` button visible  |
| TC_TPV_CM03 | Escape dismisses context menu                   | Context menu open                 | Press Escape                             | `day-context-menu` removed from DOM                       |
| TC_TPV_CM04 | Click outside dismisses context menu            | Context menu open                 | Click outside menu                       | `day-context-menu` removed from DOM                       |
| TC_TPV_CM05 | Convert to rest removes all sessions            | Context menu on multi-session day | Click "Chuyển thành ngày nghỉ" → confirm | `removePlanDaySession` called for ALL sessions            |

### 4.8 Modals (stays in orchestrator)

| TC ID      | Scenario                           | Pre-condition         | Steps                        | Expected Result                                      |
| ---------- | ---------------------------------- | --------------------- | ---------------------------- | ---------------------------------------------------- |
| TC_TPV_M01 | Regenerate confirmation flow       | Plan active           | Click regenerate → confirm   | `onGeneratePlan()` called, modal closes              |
| TC_TPV_M02 | Cancel regenerate                  | Plan active           | Click regenerate → cancel    | `onGeneratePlan()` NOT called, modal closes          |
| TC_TPV_M03 | Convert-to-rest confirmation flow  | Workout day           | Trigger convert → confirm    | Sessions removed, modal closes                       |
| TC_TPV_M04 | AddSessionModal strength callback  | Rest day context menu | Open modal → click Strength  | `addPlanDaySession` called with correct params       |
| TC_TPV_M05 | AddSessionModal cardio callback    | Rest day context menu | Open modal → click Cardio    | `addPlanDaySession` called with workoutType='Cardio' |
| TC_TPV_M06 | AddSessionModal freestyle callback | Rest day              | Open modal → click Freestyle | `pushPage(WorkoutLogger)` called                     |

### 4.9 Coaching Hint (stays inline)

| TC ID       | Scenario                            | Pre-condition                     | Steps                   | Expected Result                                                |
| ----------- | ----------------------------------- | --------------------------------- | ----------------------- | -------------------------------------------------------------- |
| TC_TPV_CH01 | Shows coaching hint on first render | `localStorage` empty              | Render with active plan | `plan-coaching-hint` testid in DOM                             |
| TC_TPV_CH02 | Dismiss coaching hint               | Hint visible                      | Click dismiss button    | Hint removed, `localStorage('planCoachingDismissed')` = 'true' |
| TC_TPV_CH03 | Hint stays hidden after dismiss     | `localStorage` has dismissed=true | Re-render               | Hint NOT in DOM                                                |
| TC_TPV_CH04 | localStorage error → default false  | `localStorage.getItem` throws     | Render                  | Hint shown (default=false)                                     |

---

## 5. Test Scenarios — Existing Test Migration

### 5.1 Tests That MUST Continue Passing (Backward Compatibility)

These existing test categories must pass without behavior change. After rewire, the orchestrator + child components together must produce identical DOM output for these scenarios:

| Test Category                    | Current Count | Migration Strategy                                    |
| -------------------------------- | ------------- | ----------------------------------------------------- |
| No plan state (auto/manual/null) | 6 tests       | Route through PlanEmptyState → verify same testids    |
| Plan expired state               | 3 tests       | Route through PlanEmptyState → verify same testids    |
| Weekly calendar strip            | 5 tests       | Now via WeekCalendarStrip child → verify same testids |
| Today workout card               | 12 tests      | Now via TodayWorkoutCard child → verify same testids  |
| Today rest card                  | 5 tests       | Now via TodayRestCard child → verify same testids     |
| Day accordion expand/collapse    | 10 tests      | Now via PlanDayAccordion child → verify same testids  |
| Multi-session                    | 4 tests       | Callback wiring unchanged                             |
| Modified badge & restore         | 5 tests       | Now in TodayWorkoutCard → verify integration          |
| Context menu                     | 5 tests       | Stays inline                                          |
| Modals                           | 8 tests       | Stays inline                                          |
| Coaching hint                    | 4 tests       | Stays inline                                          |
| Cardio/workout stats             | 3 tests       | Moved to child components                             |
| Muscle groups parsing            | 4 tests       | Via child components                                  |
| Exercise collapse                | 4 tests       | Via TodayWorkoutCard                                  |
| Edge cases                       | 4 tests       | Verify no regression                                  |

### 5.2 New Mocks Required After Rewire

After rewire, TPV test has TWO options:

**Option A — Integration (RECOMMENDED)**: Keep rendering real child components. Existing tests should pass unchanged if testids are preserved. Mocks stay at leaf level (stores, hooks).

**Option B — Mock children**: Mock each extracted component. Tests verify props passed to children. Lighter but less realistic.

**Recommendation**: Option A for backward compat tests. Option B only for new orchestrator-specific wiring tests.

If Option B is used for some tests, these new mocks are needed:

```typescript
vi.mock('../features/fitness/components/TodayWorkoutCard', () => ({
  TodayWorkoutCard: (props) => <div data-testid="today-workout-card" />,
}));
vi.mock('../features/fitness/components/TodayRestCard', () => ({
  TodayRestCard: (props) => <div data-testid="rest-day-card" />,
}));
vi.mock('../features/fitness/components/WeekCalendarStrip', () => ({
  WeekCalendarStrip: (props) => <div data-testid="week-calendar-strip" />,
}));
vi.mock('../features/fitness/components/PlanDayAccordion', () => ({
  PlanDayAccordion: (props) => <div data-testid={`plan-day-${props.dayOfWeek}`} />,
}));
vi.mock('../features/fitness/components/PlanActionBar', () => ({
  PlanActionBar: (props) => <div data-testid="plan-action-bar" />,
}));
vi.mock('../features/fitness/components/PlanEmptyState', () => ({
  PlanEmptyState: (props) => <div data-testid={`empty-${props.context}`} />,
}));
```

---

## 6. Test Scenarios — LOC & Structural Verification

| TC ID        | Scenario                           | Verification Method                                            | Expected Result                                                                                               |
| ------------ | ---------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| TC_STRUCT_01 | TrainingPlanView.tsx ≤250 LOC      | `wc -l TrainingPlanView.tsx`                                   | ≤ 250                                                                                                         |
| TC_STRUCT_02 | Imports all 6 extracted components | `grep 'import.*from' TrainingPlanView.tsx`                     | Contains: TodayWorkoutCard, TodayRestCard, WeekCalendarStrip, PlanDayAccordion, PlanActionBar, PlanEmptyState |
| TC_STRUCT_03 | No inline WorkoutStatsContent      | `grep 'WorkoutStatsContent' TrainingPlanView.tsx`              | 0 matches (moved to TodayWorkoutCard)                                                                         |
| TC_STRUCT_04 | No inline exercise list rendering  | `grep 'exercise-list\|exercise-collapse' TrainingPlanView.tsx` | 0 matches (moved to children)                                                                                 |
| TC_STRUCT_05 | PlanEmptyState.tsx 100% coverage   | `npx vitest --coverage PlanEmptyState`                         | Statements, branches, functions, lines = 100%                                                                 |
| TC_STRUCT_06 | Zero eslint errors                 | `npm run lint`                                                 | 0 errors, 0 eslint-disable                                                                                    |
| TC_STRUCT_07 | Zero test failures                 | `npm run test`                                                 | All pass                                                                                                      |
| TC_STRUCT_08 | Clean production build             | `npm run build`                                                | 0 warnings, 0 errors                                                                                          |

---

## 7. Test Data

### 7.1 Active Plan Fixture

```typescript
const activePlan = {
  id: 'plan1',
  name: 'Push/Pull/Legs - hypertrophy',
  status: 'active' as const,
  splitType: 'Push/Pull/Legs',
  durationWeeks: 8,
  startDate: '2025-01-06T00:00:00.000Z',
  createdAt: '2025-01-06T00:00:00.000Z',
  updatedAt: '2025-01-06T00:00:00.000Z',
};
```

### 7.2 Expired Plan Fixture

```typescript
const expiredPlan = {
  ...activePlan,
  endDate: '2025-01-05T00:00:00.000Z', // Yesterday relative to fake time
};
```

### 7.3 Plan Days Fixture (Mon/Wed/Fri/Sat workouts, rest on Tue/Thu/Sun)

```typescript
const planDays = [
  {
    id: 'd1',
    planId: 'plan1',
    dayOfWeek: 1,
    sessionOrder: 1,
    workoutType: 'Push',
    muscleGroups: 'chest,shoulders',
    exercises: mockExercises,
  },
  {
    id: 'd2',
    planId: 'plan1',
    dayOfWeek: 3,
    sessionOrder: 1,
    workoutType: 'Pull',
    muscleGroups: 'back,arms',
    exercises: mockExercises,
  },
  {
    id: 'd3',
    planId: 'plan1',
    dayOfWeek: 5,
    sessionOrder: 1,
    workoutType: 'Legs',
    muscleGroups: 'legs,glutes,core',
    exercises: mockExercises,
  },
  { id: 'd4', planId: 'plan1', dayOfWeek: 6, sessionOrder: 1, workoutType: 'Cardio' },
];
```

### 7.4 Fake Time

```typescript
// Monday Jan 6, 2025 — dayOfWeek = 1
vi.setSystemTime(new Date('2025-01-06T12:00:00'));
```

- Today = Monday (1) → workout day (Push)
- Tomorrow = Tuesday (2) → rest day
- Sunday test: `vi.setSystemTime(new Date('2025-01-12T12:00:00'))` → dayOfWeek=7

### 7.5 Mock Exercises (3 exercises — below collapse threshold)

```typescript
const mockExercisesData = [
  { exercise: { id: 'e1', nameVi: 'Bench Press' }, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
  { exercise: { id: 'e2', nameVi: 'Shoulder Press' }, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
  { exercise: { id: 'e3', nameVi: 'Fly' }, sets: 2, repsMin: 10, repsMax: 15, restSeconds: 60 },
];
```

### 7.6 Many Exercises (5 exercises — above collapse threshold)

```typescript
const manyExercisesData = [
  { exercise: { id: 'p1', nameVi: 'Deadlift' }, sets: 4, repsMin: 5, repsMax: 8, restSeconds: 120 },
  { exercise: { id: 'p2', nameVi: 'Barbell Row' }, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
  { exercise: { id: 'p3', nameVi: 'Pull Up' }, sets: 3, repsMin: 6, repsMax: 10, restSeconds: 90 },
  { exercise: { id: 'p4', nameVi: 'Face Pull' }, sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
  { exercise: { id: 'p5', nameVi: 'Hammer Curl' }, sets: 3, repsMin: 10, repsMax: 12, restSeconds: 60 },
];
```

---

## 8. Coverage Requirements

| File                               | Statements | Branches  | Functions | Lines     |
| ---------------------------------- | ---------- | --------- | --------- | --------- |
| PlanEmptyState.tsx                 | 100%       | 100%      | 100%      | 100%      |
| TrainingPlanView.tsx (post-rewire) | ≥ current  | ≥ current | ≥ current | ≥ current |

### Branch Coverage Focus for PlanEmptyState

| Branch | Condition                                            | Tests Covering         |
| ------ | ---------------------------------------------------- | ---------------------- |
| B1     | `context === "no-plan" && planStrategy === "auto"`   | TC_PES_C01, TC_PES_C03 |
| B2     | `context === "no-plan" && planStrategy === "manual"` | TC_PES_C02             |
| B3     | `context === "expired-plan"`                         | TC_PES_C04             |
| B4     | `context === "manual-no-exercises"`                  | TC_PES_C05             |
| B5     | `isGenerating === true` (within auto)                | TC_PES_B04, TC_PES_B05 |
| B6     | `isGenerating === false` (within auto)               | TC_PES_B01             |
| B7     | `onCreateManualPlan` provided vs undefined           | TC_PES_E03             |

---

## 9. PlanEmptyState Proposed Interface

Based on analysis of current TrainingPlanView lines 315–417 and Designer spec §3.6:

```typescript
type EmptyContext = 'no-plan' | 'expired-plan' | 'manual-no-exercises' | 'empty-day';

interface PlanEmptyStateProps {
  readonly context: EmptyContext;
  readonly planStrategy?: 'auto' | 'manual' | null;
  readonly isGenerating?: boolean;
  readonly onGeneratePlan: () => void;
  readonly onCreateManualPlan?: () => void;
}
```

### Mapping Rules

| context               | planStrategy                    | Variant    | Icon         | Title i18n key                  | CTA i18n key                      |
| --------------------- | ------------------------------- | ---------- | ------------ | ------------------------------- | --------------------------------- |
| `no-plan`             | `auto` or `null` or `undefined` | `hero`     | Dumbbell     | `fitness.plan.autoReadyTitle`   | `fitness.plan.createPlan`         |
| `no-plan`             | `manual`                        | `hero`     | CalendarPlus | `fitness.plan.manualReadyTitle` | `fitness.plan.createFirstWorkout` |
| `expired-plan`        | \*                              | `hero`†    | RefreshCw    | `fitness.plan.planExpired`      | `fitness.plan.createNewCycle`     |
| `manual-no-exercises` | \*                              | `standard` | CalendarPlus | `fitness.plan.manualReadyTitle` | `fitness.plan.createFirstWorkout` |
| `empty-day`           | \*                              | `compact`  | Plus         | `fitness.plan.noExercises`      | `fitness.plan.addExercise`        |

† Spec says `standard` but current impl uses hero-like layout. Dev should match current behavior for zero regression, or explicitly upgrade per spec.

---

## 10. Traceability Matrix

| Test Case        | BM AC            | Designer Spec           | Risk                     |
| ---------------- | ---------------- | ----------------------- | ------------------------ |
| TC_PES_C01–C05   | US-06 AC-1, AC-2 | §3.6 Variants table     | Empty state context      |
| TC_PES_B01–B07   | US-06 AC-3, AC-4 | §3.6 CTA Button Pattern | CTA interactions         |
| TC_PES_S01–S03   | US-06 AC-1       | §3.6                    | Surface state contract   |
| TC_PES_E01–E03   | US-06 EC-1, EC-2 | —                       | Edge cases               |
| TC_TPV_W01–W10   | US-07 AC-1, AC-2 | §3.7 Layout             | Composition verification |
| TC_TPV_WCS01–04  | US-07 AC-3       | §3.7 WeekCalendarStrip  | Calendar wiring          |
| TC_TPV_TWC01–08  | US-07 AC-3       | §3.7 TodayWorkoutCard   | Workout card wiring      |
| TC_TPV_TRC01–05  | US-07 AC-3       | §3.7 TodayRestCard      | Rest card wiring         |
| TC_TPV_PAB01–03  | US-07 AC-3       | §3.7 PlanActionBar      | Action bar wiring        |
| TC_TPV_PDA01–05  | US-07 AC-3       | §3.7 PlanDayAccordion   | Accordion wiring         |
| TC_TPV_CM01–05   | US-07 AC-4       | —                       | Context menu (inline)    |
| TC_TPV_M01–M06   | US-07 AC-4       | —                       | Modals (inline)          |
| TC_TPV_CH01–CH04 | US-07 AC-4       | —                       | Coaching hint (inline)   |
| TC_STRUCT_01–08  | US-07 AC-1, AC-5 | §3.7 Rule               | Structural verification  |

---

## 11. Execution Order

1. **PlanEmptyState unit tests** (TC*PES*\*) — component must work in isolation FIRST
2. **TrainingPlanView composition tests** (TC_TPV_W\*) — verify children are rendered
3. **TrainingPlanView prop wiring tests** (TC_TPV_WCS/TWC/TRC/PAB/PDA\*) — verify callbacks connected
4. **Existing test migration** — run full existing suite, verify 0 regressions
5. **Context menu + modals** (TC_TPV_CM/M\*) — inline behavior unchanged
6. **Structural verification** (TC*STRUCT*\*) — LOC count, imports, coverage, lint

---

## 12. Summary

| Metric                            | Value                             |
| --------------------------------- | --------------------------------- |
| Total test scenarios              | 83                                |
| PlanEmptyState scenarios          | 20                                |
| TrainingPlanView rewire scenarios | 55                                |
| Structural verification           | 8                                 |
| Risk: HIGH                        | 4 (prop wiring errors)            |
| Risk: MEDIUM                      | 3 (empty state selection)         |
| Risk: LOW                         | 3 (test migration)                |
| Coverage target                   | 100% PlanEmptyState, ≥current TPV |
| Existing tests to preserve        | ~80+ (zero regression)            |
