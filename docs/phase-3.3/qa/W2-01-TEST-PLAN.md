# Test Plan: W2-01 Hero Card Redesign (TodayWorkoutCard)

**Component**: `src/features/fitness/components/TodayWorkoutCard.tsx`
**Test File**: `src/__tests__/TodayWorkoutCard.test.tsx`
**Type**: Unit Test (Vitest + React Testing Library)
**Author**: QA Engineer
**Status**: TEST_PLAN_READY
**Depends On**: W1-01 (TodayWorkoutCard extraction — COMPLETED)

---

## 1. Scope

### In Scope

- **Hero card gradient container**: `bg-gradient-to-br from-primary-subtle to-card rounded-2xl border border-border/60 p-5 shadow-sm`
- **Container semantic element**: `<section>` with `data-testid="today-hero-card"`, `aria-label`, `role="region"`
- **Eyebrow row**: "Hôm nay" label + completion status badge (completed/multi-session count)
- **Workout title**: `text-lg font-bold` with muscle groups and duration info
- **Session tabs**: Completion indicators (pill badges) via SessionTabs delegation
- **Exercise preview list**: Numbered (1., 2., 3.), with `sets×reps`, rest seconds, border-top separator
- **Primary CTA**: `min-h-12 rounded-xl bg-primary text-lg font-semibold shadow-sm` with `active:scale-[0.98]`
- **Secondary actions**: Convert to rest, edit exercises
- **Entrance animation**: `animate-slide-up` (tier 1, delay 0ms)
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` respected
- **Rest Day Hero variant**: Moon icon, rest day tip, tomorrow preview, quick actions
- **Completed Workout Hero variant**: Stats row (duration/volume/sets), outline CTA "Xem tổng kết"
- **All hero states**: empty exercises, single-session, multi-session, all-completed, rest day
- **Business rules**: BR-38, BR-13, BR-40, BR-42
- **100% test coverage** for modified component

### Out of Scope

- SessionTabs internal logic (tested separately, mocked here)
- TrainingPlanView integration (parent component — W1-06)
- Emulator/CDP testing (covered by manual QA scripts)
- durationEstimator internals (tested in `durationEstimator.test.ts`)
- i18n translation accuracy (vi.json verified separately)

---

## 2. Changes from W1-01 Baseline

### 2.1 Container Changes

| Aspect       | W1-01 (Current)                                | W2-01 (Redesign)                                |
| ------------ | ---------------------------------------------- | ----------------------------------------------- |
| Root element | `<div>`                                        | `<section>`                                     |
| Root testid  | `today-workout-card`                           | `today-hero-card`                               |
| Background   | `bg-card border-l-accent-highlight border-l-4` | `bg-gradient-to-br from-primary-subtle to-card` |
| Border       | `border`                                       | `border border-border/60`                       |
| Padding      | `p-4`                                          | `p-5`                                           |
| Shadow       | none                                           | `shadow-sm`                                     |
| Animation    | none                                           | `animate-slide-up`                              |
| Semantics    | `<div>`                                        | `<section aria-label={...}>`                    |

### 2.2 Layout Changes

| Aspect             | W1-01                                              | W2-01                                                    |
| ------------------ | -------------------------------------------------- | -------------------------------------------------------- |
| Header             | Disabled button "Buổi tập hôm nay" + Calendar icon | Eyebrow row: "Hôm nay" label + completion badge          |
| Title              | `text-xl font-semibold`                            | `text-lg font-bold leading-tight` (`<h2>`)               |
| Stats line         | Separate `workout-stats` div                       | Inline below title: muscleGroups · exercises · ~duration |
| Exercise numbering | None                                               | `{i+1}.` prefix with `tabular-nums`                      |
| Exercise rest info | Not shown                                          | `sets×repsRange` in `tabular-nums`                       |
| Exercise separator | None                                               | `border-border/60 border-t pt-3` above list              |
| Collapse text      | `+N bài tập nữa` (button)                          | `+N bài tập nữa` (paragraph, `text-xs`)                  |
| CTA classes        | `py-3.5 rounded-xl`                                | `min-h-12 rounded-xl shadow-sm`                          |
| CTA testid         | `start-workout-btn`                                | `btn-start-workout-hero`                                 |
| Secondary actions  | Rose border button in `border-t` footer            | Inline text button (simpler)                             |

### 2.3 New Features

| Feature             | Description                                                                    |
| ------------------- | ------------------------------------------------------------------------------ |
| Completed badge     | `bg-success/10 text-success` pill with Check icon when all sessions done       |
| Multi-session count | `completedCount/totalSessions` pill when >1 session                            |
| Rest Day Hero       | `today-hero-rest` variant with Moon icon, tip, tomorrow preview, quick actions |
| Completed Hero      | Outline CTA "Xem tổng kết", stats row: duration/volume/sets                    |
| `animate-slide-up`  | CSS animation on mount, respects `prefers-reduced-motion`                      |

---

## 3. Props Interface (Updated for W2-01)

```typescript
interface TodayWorkoutCardProps {
  planDay: TrainingPlanDay;
  daySessions: TrainingPlanDay[];
  activeSessionId: string;
  completedSessionIds: string[];
  exercises: SelectedExercise[];
  estimatedMinutes: number;
  exercisesExpanded: boolean;
  // NEW for W2-01:
  // completedWorkoutStats?: { durationMin: number; totalVolume: number; totalSets: number };
  // tomorrowPlanDay?: TrainingPlanDay;  (for rest day hero)
  // Callbacks (unchanged from W1-01):
  onStartWorkout: (planDay: TrainingPlanDay) => void;
  onEditExercises: (planDay: TrainingPlanDay) => void;
  onConvertToRest: () => void;
  onRestoreOriginal: (planDayId: string) => void;
  onSelectSession: (sessionId: string) => void;
  onAddSession: () => void;
  onDeleteSession?: (dayId: string) => void;
  onToggleExerciseExpand: () => void;
  // NEW optional callbacks for W2-01:
  // onLogWeight?: () => void;
  // onQuickCardio?: () => void;
  // onViewSummary?: () => void;
}
```

> **Note**: New props are PREDICTED based on Design §4.1. Dev may implement differently. QA test plan covers behavior regardless of exact prop naming.

---

## 4. Test Data Fixtures

### 4.1 Reuse from W1-01 (unchanged)

```typescript
// EXERCISES_3: 3 exercises at collapse threshold
// EXERCISES_6: 6 exercises (triggers collapse)
// basePlanDay: Upper Body A, muscleGroups='chest,shoulders'
// modifiedPlanDay: exercises ≠ originalExercises
// cardioPlanDay: workoutType='Cardio'
// session1, session2, session3: multi-session fixtures
```

### 4.2 New Fixtures for W2-01

```typescript
// Rest day plan day
const restPlanDay: TrainingPlanDay = {
  ...basePlanDay,
  id: 'd-rest',
  workoutType: 'rest',
  muscleGroups: undefined,
  exercises: '[]',
};

// Tomorrow plan day (for rest day preview)
const tomorrowPlanDay: TrainingPlanDay = {
  ...basePlanDay,
  id: 'd-tomorrow',
  dayOfWeek: 2,
  workoutType: 'Lower Body A',
  muscleGroups: 'legs,glutes',
};

// Completed workout stats
const completedStats = {
  durationMin: 45,
  totalVolume: 2340,
  totalSets: 18,
};

// All sessions completed
const allCompletedSessionIds = ['ms1', 'ms2', 'ms3'];
```

---

## 5. Test Scenarios

### SC_W201_01: Hero Card Container — Gradient & Styling

**Precondition**: Standard planDay (Upper Body A, 3 exercises, single session).

| #   | Verify                      | Expected                                     |
| --- | --------------------------- | -------------------------------------------- |
| 1   | Root element is `<section>` | Tag name check                               |
| 2   | testid = `today-hero-card`  | Present in DOM                               |
| 3   | Gradient class applied      | `bg-gradient-to-br` in className             |
| 4   | `from-primary-subtle` class | Present in className                         |
| 5   | `to-card` class             | Present in className                         |
| 6   | Border class                | `border-border/60` in className              |
| 7   | Padding = `p-5`             | Present in className                         |
| 8   | Shadow = `shadow-sm`        | Present in className                         |
| 9   | `rounded-2xl`               | Present in className                         |
| 10  | `aria-label` set            | Matches i18n key `fitness.plan.todayWorkout` |

---

### SC_W201_02: Entrance Animation — animate-slide-up

**Precondition**: Standard planDay.

| #   | Verify                              | Expected                                        |
| --- | ----------------------------------- | ----------------------------------------------- |
| 1   | `animate-slide-up` class on root    | Present in className                            |
| 2   | Reduced motion: class still present | CSS handles via `@media` rule, class IS applied |

> **Note**: `animate-slide-up` is CSS-level — the class is always applied; `@media (prefers-reduced-motion: reduce)` sets `animation: none` at CSS level. Component does NOT conditionally add/remove the class per Design §4.1.

---

### SC_W201_03: Eyebrow Row — Today Label

**Precondition**: Standard planDay, no completed sessions.

| #   | Verify                              | Expected                                      |
| --- | ----------------------------------- | --------------------------------------------- |
| 1   | "Hôm nay" eyebrow label             | Text matching `fitness.plan.todayLabel`       |
| 2   | Eyebrow has uppercase tracking-wide | `text-xs font-medium uppercase tracking-wide` |
| 3   | No completion badge (0 completed)   | No `bg-success/10` element                    |
| 4   | No session count badge (1 session)  | No `completedCount/totalSessions` text        |

---

### SC_W201_04: Eyebrow — Completed Badge (All Sessions Done)

**Precondition**: Single session, `completedSessionIds` includes active session.

| #   | Verify                  | Expected                                  |
| --- | ----------------------- | ----------------------------------------- |
| 1   | Completed badge visible | `bg-success/10 text-success` pill present |
| 2   | Badge has Check icon    | `<Check>` icon rendered                   |
| 3   | Badge text              | Contains i18n `fitness.plan.completed`    |

---

### SC_W201_05: Eyebrow — Multi-Session Progress Badge

**Precondition**: 3 sessions, 2 completed.

| #   | Verify                      | Expected                              |
| --- | --------------------------- | ------------------------------------- |
| 1   | Session count badge visible | `bg-primary/10 text-primary` pill     |
| 2   | Badge shows "2/3"           | `completedCount/totalSessions` format |
| 3   | No "completed" badge        | Not all sessions done                 |

---

### SC_W201_06: Workout Title & Info Line

**Precondition**: Standard planDay with muscleGroups, 3 exercises, 23 min.

| #   | Verify                        | Expected                                                  |
| --- | ----------------------------- | --------------------------------------------------------- |
| 1   | Title is `<h2>` element       | `text-lg font-bold leading-tight`                         |
| 2   | Title text                    | `translateWorkoutType(t, 'Upper Body A')` → "Thân trên A" |
| 3   | Info line: muscle groups      | "Ngực · Vai" (dot-separated, not comma)                   |
| 4   | Info line: exercise count     | "3 bài tập"                                               |
| 5   | Info line: estimated duration | "~23 phút"                                                |
| 6   | Modified badge (if modified)  | Same behavior as W1-01                                    |

---

### SC_W201_07: Exercise Preview List — Numbered & Compact

**Precondition**: 3 exercises, collapsed.

| #   | Verify                                  | Expected                                               |
| --- | --------------------------------------- | ------------------------------------------------------ |
| 1   | Exercise list has border-top separator  | `border-border/60 border-t pt-3` on container          |
| 2   | Exercise 1 numbered                     | "1" prefix visible                                     |
| 3   | Exercise name truncated                 | CSS `truncate` class on name span                      |
| 4   | Sets×reps format                        | "3×8-12" (tabular-nums, compact, no "hiệp"/"lần" text) |
| 5   | Rest seconds shown (if design includes) | e.g., "90s rest" — verify per final implementation     |
| 6   | 3 exercises displayed at threshold      | List has 3 items                                       |
| 7   | No collapse toggle at threshold=3       | Not in DOM                                             |

---

### SC_W201_08: Exercise Collapse — >3 Exercises

**Precondition**: 6 exercises, `exercisesExpanded = false`.

| #   | Verify                         | Expected                                            |
| --- | ------------------------------ | --------------------------------------------------- |
| 1   | Only 3 preview exercises shown | List has 3 items                                    |
| 2   | "+3 more" indicator            | `+3 bài tập nữa` text (may be `<p>` not `<button>`) |
| 3   | Expand toggle calls callback   | `onToggleExerciseExpand` fires on click             |

---

### SC_W201_09: Exercise Collapse — Expanded State

**Precondition**: 6 exercises, `exercisesExpanded = true`.

| #   | Verify                   | Expected                            |
| --- | ------------------------ | ----------------------------------- |
| 1   | All 6 exercises shown    | List has 6 items                    |
| 2   | "Thu gọn" toggle visible | `fitness.plan.showLess` translation |
| 3   | Toggle calls callback    | `onToggleExerciseExpand` fires      |

---

### SC_W201_10: Primary CTA — Start Workout Hero

**Precondition**: Standard planDay, no completed sessions.

| #   | Verify                                  | Expected                                    |
| --- | --------------------------------------- | ------------------------------------------- |
| 1   | CTA testid                              | `btn-start-workout-hero` (per Design §4.1)  |
| 2   | CTA text                                | "Bắt đầu tập" (`fitness.plan.startWorkout`) |
| 3   | Play icon                               | Present, `aria-hidden="true"`               |
| 4   | `min-h-12` class                        | Touch target ≥48px                          |
| 5   | `rounded-xl` class                      | Present                                     |
| 6   | `bg-primary` class                      | Present                                     |
| 7   | `text-lg font-semibold`                 | Present                                     |
| 8   | `shadow-sm`                             | Present                                     |
| 9   | `active:scale-[0.98]`                   | BR-42 press feedback                        |
| 10  | `motion-reduce:transform-none`          | BR-40 reduced motion                        |
| 11  | Click fires `onStartWorkout(planDay)`   | Callback with correct arg                   |
| 12  | `focus-visible:ring-2` + `outline-none` | Accessibility                               |

---

### SC_W201_11: Secondary Actions — Convert to Rest

**Precondition**: Standard workout planDay.

| #   | Verify                             | Expected                      |
| --- | ---------------------------------- | ----------------------------- |
| 1   | Convert button visible             | Text "Chuyển thành ngày nghỉ" |
| 2   | Moon icon present                  | `<Moon>` rendered             |
| 3   | Click fires `onConvertToRest`      | Callback invoked once         |
| 4   | `min-h-11` or `min-h-[44px]` class | Touch target ≥44px            |
| 5   | `active:scale-[0.98]`              | BR-42 press feedback          |

---

### SC_W201_12: Secondary Actions — Edit Exercises

**Precondition**: Standard workout planDay.

| #   | Verify                                 | Expected                                                 |
| --- | -------------------------------------- | -------------------------------------------------------- |
| 1   | Edit button accessible                 | `aria-label` = `fitness.plan.editExercises`              |
| 2   | Click fires `onEditExercises(planDay)` | Callback with planDay arg                                |
| 3   | Touch target ≥44px                     | `min-h-[44px]` AND `min-w-[44px]` or `min-h-11 min-w-11` |

---

### SC_W201_13: Multi-Session — Tab Delegation

**Precondition**: 2 sessions, activeSessionId = session1.id.

| #   | Verify                       | Expected               |
| --- | ---------------------------- | ---------------------- |
| 1   | SessionTabs rendered         | Mock component present |
| 2   | Sessions prop correct        | `[session1, session2]` |
| 3   | `activeSessionId` passed     | session1.id            |
| 4   | `completedSessionIds` passed | Array passed through   |
| 5   | `onSelectSession` wired      | Click tab → callback   |
| 6   | `onAddSession` wired         | Click add → callback   |
| 7   | `onDeleteSession` wired      | Delete → callback      |

---

### SC_W201_14: Multi-Session — 3 Sessions (BR-13 Max)

**Precondition**: 3 sessions, 1 completed.

| #   | Verify                    | Expected                  |
| --- | ------------------------- | ------------------------- |
| 1   | SessionTabs has 3 tabs    | `sessions.length === 3`   |
| 2   | Card renders correctly    | `today-hero-card` present |
| 3   | Multi-session badge "1/3" | Shows completion progress |

---

### SC_W201_15: Rest Day Hero Variant

**Precondition**: planDay with `workoutType = 'rest'`.

| #   | Verify                                              | Expected                                |
| --- | --------------------------------------------------- | --------------------------------------- |
| 1   | Rest hero testid                                    | `today-hero-rest`                       |
| 2   | Gradient class                                      | `bg-gradient-to-br from-info/5 to-card` |
| 3   | Moon icon container                                 | `bg-info/10` circle with `<Moon>` icon  |
| 4   | Title "Ngày nghỉ"                                   | `fitness.plan.restDay` translation      |
| 5   | Rest day tip text                                   | `fitness.plan.restDayTip` translation   |
| 6   | `aria-label`                                        | `fitness.plan.restDayRegion`            |
| 7   | `animate-slide-up`                                  | Present on root                         |
| 8   | `rounded-2xl border border-border/60 p-5 shadow-sm` | Same hero styling                       |
| 9   | No start workout CTA                                | `btn-start-workout-hero` NOT in DOM     |
| 10  | No exercise list                                    | `exercise-list` NOT in DOM              |

---

### SC_W201_16: Rest Day Hero — Tomorrow Preview

**Precondition**: Rest day + `tomorrowPlanDay` provided.

| #   | Verify                           | Expected                                     |
| --- | -------------------------------- | -------------------------------------------- |
| 1   | Tomorrow preview section visible | Contains `fitness.plan.tomorrowPreview` text |
| 2   | Tomorrow workout name            | "Lower Body A" translated                    |
| 3   | Preview has card styling         | `rounded-xl border bg-card/50 p-3`           |

---

### SC_W201_17: Rest Day Hero — No Tomorrow Preview

**Precondition**: Rest day, `tomorrowPlanDay` = undefined/null.

| #   | Verify                      | Expected                          |
| --- | --------------------------- | --------------------------------- |
| 1   | No tomorrow preview section | `tomorrowPreview` text NOT in DOM |
| 2   | Rest hero still renders     | `today-hero-rest` present         |

---

### SC_W201_18: Rest Day Hero — Quick Actions

**Precondition**: Rest day variant.

| #   | Verify                                   | Expected                                  |
| --- | ---------------------------------------- | ----------------------------------------- |
| 1   | "Cân nặng" quick action button           | `fitness.plan.logWeight` text             |
| 2   | "Cardio nhanh" quick action button       | `fitness.plan.quickCardio` text           |
| 3   | Both buttons have touch target ≥44px     | `min-h-11` class                          |
| 4   | Both have `active:scale-[0.98]`          | BR-42                                     |
| 5   | Both have `motion-reduce:transform-none` | BR-40                                     |
| 6   | Click log weight                         | `onLogWeight` callback (if prop exists)   |
| 7   | Click quick cardio                       | `onQuickCardio` callback (if prop exists) |

---

### SC_W201_19: Completed Workout Hero Variant

**Precondition**: Single session, session completed, `completedWorkoutStats` provided.

| #   | Verify                   | Expected                                    |
| --- | ------------------------ | ------------------------------------------- |
| 1   | Completed badge visible  | `bg-success/10 text-success` pill           |
| 2   | Stats row rendered       | Duration, volume, sets displayed            |
| 3   | Duration stat            | `{durationMin}m` with Clock icon            |
| 4   | Volume stat              | `{totalVolume}kg` with Dumbbell icon        |
| 5   | Sets stat                | `{totalSets} sets` with Layers icon         |
| 6   | CTA text changes         | "Xem tổng kết" (not "Bắt đầu tập")          |
| 7   | CTA style changes        | Outline/secondary style (not `bg-primary`)  |
| 8   | CTA still fires callback | Click → `onViewSummary` or `onStartWorkout` |

---

### SC_W201_20: Multi-Session All Completed

**Precondition**: 3 sessions, all 3 completed.

| #   | Verify                        | Expected                     |
| --- | ----------------------------- | ---------------------------- |
| 1   | Eyebrow shows completed badge | "Hoàn thành" with Check icon |
| 2   | CTA changes to summary view   | "Xem tổng kết" text          |
| 3   | Session tabs still visible    | Can review each session      |
| 4   | "3/3" count badge             | All sessions counted         |

---

### SC_W201_21: Empty Exercises

**Precondition**: planDay with `exercises: '[]'`, exercises prop = [].

| #   | Verify                      | Expected                     |
| --- | --------------------------- | ---------------------------- |
| 1   | Card renders                | `today-hero-card` present    |
| 2   | No exercise list            | Exercise list NOT in DOM     |
| 3   | Info line shows "0 bài tập" | Zero count                   |
| 4   | CTA still visible           | Start workout button present |
| 5   | Edit button visible         | Can add exercises            |

---

### SC_W201_22: Modified Badge & Restore (Regression)

**Precondition**: modifiedPlanDay (exercises ≠ originalExercises).

| #   | Verify                 | Expected                                   |
| --- | ---------------------- | ------------------------------------------ |
| 1   | Modified badge visible | "Đã chỉnh sửa" text                        |
| 2   | Restore button visible | `restore-original-btn` present             |
| 3   | Click restore          | `onRestoreOriginal` called with planDay.id |
| 4   | Badge position         | Near title (consistent with redesign)      |

---

### SC_W201_23: Cardio Workout Type

**Precondition**: planDay with `workoutType: 'Cardio'`.

| #   | Verify                         | Expected                       |
| --- | ------------------------------ | ------------------------------ |
| 1   | Title shows "Cardio"           | Translated workout type        |
| 2   | No muscle groups in info line  | Cardio has no specific muscles |
| 3   | Info line still shows duration | `~X phút`                      |
| 4   | CTA still present              | Can start cardio workout       |

---

### SC_W201_24: Touch Targets (BR-37/BR-42)

**Precondition**: Standard planDay (modified, with exercises >3).

| Button                                 | Expected Class                                           |
| -------------------------------------- | -------------------------------------------------------- |
| Primary CTA (`btn-start-workout-hero`) | `min-h-12` (48px)                                        |
| Edit exercises                         | `min-h-[44px]` AND `min-w-[44px]` OR `min-h-11 min-w-11` |
| Convert to rest                        | `min-h-11` or `min-h-[44px]`                             |
| Restore original                       | `min-h-[44px]` AND `min-w-[44px]`                        |
| Collapse toggle                        | Focusable, min-h ≥44px                                   |

---

### SC_W201_25: Press Feedback All Buttons (BR-42)

**Precondition**: All interactive elements rendered.

| Button                 | Expected                                                                     |
| ---------------------- | ---------------------------------------------------------------------------- |
| Primary CTA            | `active:scale-[0.98] motion-reduce:transform-none`                           |
| Convert to rest        | `active:scale-[0.98] motion-reduce:transform-none`                           |
| Edit exercises         | `active:scale-[0.98] motion-reduce:transform-none` (if redesigned per BR-42) |
| Rest day quick actions | `active:scale-[0.98] motion-reduce:transform-none`                           |

---

### SC_W201_26: Focus Visibility — All Interactive Elements

**Precondition**: All buttons rendered (modified planDay, >3 exercises).

| Element          | Expected Class                                    |
| ---------------- | ------------------------------------------------- |
| Primary CTA      | `focus-visible:ring-2 focus-visible:outline-none` |
| Edit exercises   | `focus-visible:ring-2 focus-visible:outline-none` |
| Convert to rest  | `focus-visible:ring-2 focus-visible:outline-none` |
| Restore original | `focus-visible:ring-2 focus-visible:outline-none` |
| Collapse toggle  | `focus-visible:ring-2 focus-visible:outline-none` |

---

### SC_W201_27: No Muscle Groups

**Precondition**: planDay with `muscleGroups: undefined`.

| #   | Verify                                          | Expected                    |
| --- | ----------------------------------------------- | --------------------------- |
| 1   | No muscle groups in info line                   | No dot-separated group text |
| 2   | Info line still shows exercise count + duration | "3 bài tập · ~23 phút"      |
| 3   | Title renders correctly                         | Workout type name visible   |

---

### SC_W201_28: Single Exercise — No Collapse

**Precondition**: 1 exercise only.

| #   | Verify                   | Expected              |
| --- | ------------------------ | --------------------- |
| 1   | Exercise list has 1 item | Single numbered entry |
| 2   | No collapse toggle       | Not in DOM            |
| 3   | Exercise numbered "1"    | First entry           |

---

### SC_W201_29: onDeleteSession Undefined

**Precondition**: `onDeleteSession` prop not provided.

| #   | Verify                               | Expected                |
| --- | ------------------------------------ | ----------------------- |
| 1   | SessionTabs still renders            | Component present       |
| 2   | No delete button in SessionTabs mock | Delete tab not rendered |
| 3   | Card otherwise functional            | All other features work |

---

## 6. Test Cases

### TC_W201_01: Hero card renders with gradient container (SC_W201_01)

**Precondition**: basePlanDay, single session, 3 exercises
**Steps**:

1. Render `<TodayWorkoutCard {...defaultProps} />`
2. Get element by testid `today-hero-card`
3. Assert element tag = `SECTION`
4. Assert className contains: `bg-gradient-to-br`, `from-primary-subtle`, `to-card`, `rounded-2xl`, `border-border/60`, `p-5`, `shadow-sm`
5. Assert `aria-label` attribute set (matches todayWorkout translation)
   **Expected**: Gradient hero card with exact Design §4.1 classes.

---

### TC_W201_02: animate-slide-up applied on mount (SC_W201_02)

**Precondition**: Standard planDay
**Steps**:

1. Render component
2. Get root `today-hero-card` element
3. Assert className contains `animate-slide-up`
   **Expected**: Animation class present. CSS `@media` handles reduced motion.

---

### TC_W201_03: Eyebrow shows "Hôm nay" label (SC_W201_03)

**Precondition**: Standard planDay, no completed sessions
**Steps**:

1. Render component with `completedSessionIds: []`
2. Assert text "Hôm nay" (or `fitness.plan.todayLabel` translation) visible
3. Assert eyebrow has `text-xs font-medium uppercase tracking-wide` classes
4. Assert NO completion badge present
   **Expected**: Simple eyebrow label without status indicators.

---

### TC_W201_04: Completed badge shows when all sessions done (SC_W201_04)

**Precondition**: Single session, session ID in completedSessionIds
**Steps**:

1. Render with `completedSessionIds: [basePlanDay.id]`
2. Assert badge with `bg-success/10` and `text-success` classes present
3. Assert badge contains Check icon
4. Assert badge text matches `fitness.plan.completed` translation
   **Expected**: Green completion badge with checkmark.

---

### TC_W201_05: Multi-session progress badge "2/3" (SC_W201_05)

**Precondition**: 3 sessions, 2 completed
**Steps**:

1. Render with `daySessions: [session1, session2, session3]`, `completedSessionIds: ['ms1', 'ms2']`
2. Assert pill badge with `bg-primary/10` class present
3. Assert badge text contains "2/3"
   **Expected**: Blue progress pill showing completed/total ratio.

---

### TC_W201_06: Workout title as h2 with info line (SC_W201_06)

**Precondition**: basePlanDay, 3 exercises, 23 min
**Steps**:

1. Render component
2. Assert `<h2>` element contains translated workout type
3. Assert `h2` has `text-lg font-bold` classes
4. Assert info line contains muscle groups (dot-separated or comma-separated)
5. Assert info line contains "3 bài tập"
6. Assert info line contains "~23 phút"
   **Expected**: Title + combined info line.

---

### TC_W201_07: Exercise list numbered with border separator (SC_W201_07)

**Precondition**: 3 exercises
**Steps**:

1. Render component
2. Locate exercise list container
3. Assert border-top separator exists (`border-border/60 border-t` or similar)
4. Assert first exercise has "1" prefix
5. Assert exercise name has `truncate` class
6. Assert sets×reps displayed in `tabular-nums` format
7. Assert list has 3 items
   **Expected**: Numbered, compact exercise preview with separator.

---

### TC_W201_08: Exercise sets×reps format (SC_W201_07)

**Precondition**: EXERCISES_3 (Bench Press: 3 sets, 8-12 reps)
**Steps**:

1. Render component
2. Find first exercise entry
3. Assert text contains "3×8-12" or "3 hiệp × 8-12 lần" (per final implementation)
   **Expected**: Compact set/rep info for each exercise.

---

### TC_W201_09: Collapse at >3 exercises (SC_W201_08)

**Precondition**: 6 exercises, `exercisesExpanded = false`
**Steps**:

1. Render with EXERCISES_6
2. Assert exercise list shows exactly 3 items
3. Assert "+3 bài tập nữa" text visible
4. Assert clicking the expand element fires `onToggleExerciseExpand`
   **Expected**: Preview limited to 3 with expansion indicator.

---

### TC_W201_10: Expand shows all exercises (SC_W201_09)

**Precondition**: 6 exercises, `exercisesExpanded = true`
**Steps**:

1. Render with EXERCISES_6, `exercisesExpanded: true`
2. Assert exercise list shows 6 items
3. Assert "Thu gọn" text visible
4. Assert click fires `onToggleExerciseExpand`
   **Expected**: Full exercise list with collapse option.

---

### TC_W201_11: Primary CTA min-h-12 with shadow-sm (SC_W201_10)

**Precondition**: Standard planDay
**Steps**:

1. Render component
2. Get CTA by testid `btn-start-workout-hero`
3. Assert className contains: `min-h-12`, `rounded-xl`, `bg-primary`, `text-lg`, `font-semibold`, `shadow-sm`
4. Assert className contains: `active:scale-[0.98]`, `motion-reduce:transform-none`
5. Assert text "Bắt đầu tập"
6. Assert Play icon present (aria-hidden)
   **Expected**: Primary CTA with all Design §4.1 classes.

---

### TC_W201_12: CTA click fires onStartWorkout (SC_W201_10)

**Precondition**: Standard planDay
**Steps**:

1. Render component
2. Click CTA button
3. Assert `onStartWorkout` called once with `planDay` object
   **Expected**: Callback invoked with correct argument.

---

### TC_W201_13: Convert to rest button (SC_W201_11)

**Precondition**: Standard workout planDay
**Steps**:

1. Render component
2. Find button with "Chuyển thành ngày nghỉ" text
3. Assert Moon icon present
4. Click button
5. Assert `onConvertToRest` called once
   **Expected**: Secondary action works correctly.

---

### TC_W201_14: Edit exercises button (SC_W201_12)

**Precondition**: Standard planDay
**Steps**:

1. Render component
2. Find edit button (by testid or aria-label)
3. Assert aria-label = `fitness.plan.editExercises` translation
4. Click button
5. Assert `onEditExercises` called with `planDay`
   **Expected**: Edit action correctly wired.

---

### TC_W201_15: SessionTabs delegation for multi-session (SC_W201_13)

**Precondition**: 2 sessions
**Steps**:

1. Render with `daySessions: [session1, session2]`, `activeSessionId: session1.id`
2. Assert mock SessionTabs rendered (testid `session-tabs`)
3. Click session tab 1 → assert `onSelectSession('ms2')`
4. Click add → assert `onAddSession` called
5. Click delete → assert `onDeleteSession` called
   **Expected**: All SessionTabs callbacks properly delegated.

---

### TC_W201_16: 3 sessions max boundary (SC_W201_14, BR-13)

**Precondition**: 3 sessions
**Steps**:

1. Render with `daySessions: [session1, session2, session3]`
2. Assert 3 session tabs rendered
3. Assert card renders correctly
   **Expected**: BR-13 max 3 sessions displayed.

---

### TC_W201_17: Rest Day Hero renders with Moon icon (SC_W201_15)

**Precondition**: restPlanDay (workoutType='rest')
**Steps**:

1. Render with restPlanDay
2. Assert testid `today-hero-rest` present
3. Assert className contains `bg-gradient-to-br`, `from-info/5`, `to-card`
4. Assert Moon icon present in `bg-info/10` container
5. Assert "Ngày nghỉ" title visible
6. Assert rest day tip text visible
7. Assert `aria-label` = `fitness.plan.restDayRegion` translation
8. Assert `animate-slide-up` class present
9. Assert `btn-start-workout-hero` NOT in DOM
   **Expected**: Rest Day Hero with correct gradient and content.

---

### TC_W201_18: Rest Day Hero tomorrow preview (SC_W201_16)

**Precondition**: restPlanDay + tomorrowPlanDay provided
**Steps**:

1. Render with rest day and tomorrowPlanDay
2. Assert "Ngày mai" label visible (`fitness.plan.tomorrowPreview`)
3. Assert tomorrow workout name visible
4. Assert preview has card-like styling
   **Expected**: Tomorrow preview section rendered.

---

### TC_W201_19: Rest Day Hero no tomorrow preview (SC_W201_17)

**Precondition**: restPlanDay, no tomorrowPlanDay
**Steps**:

1. Render with rest day, tomorrowPlanDay undefined
2. Assert tomorrow preview text NOT in DOM
3. Assert rest hero still renders
   **Expected**: Graceful handling of missing tomorrow data.

---

### TC_W201_20: Rest Day quick actions (SC_W201_18)

**Precondition**: restPlanDay
**Steps**:

1. Render with rest day
2. Assert "Cân nặng" button visible
3. Assert "Cardio nhanh" button visible
4. Assert both have `min-h-11` class (touch target)
5. Assert both have `active:scale-[0.98]` class
6. Click each → verify callbacks fire
   **Expected**: Quick actions with proper touch targets and feedback.

---

### TC_W201_21: Completed Hero — stats row and CTA change (SC_W201_19)

**Precondition**: Session completed, completedWorkoutStats provided
**Steps**:

1. Render with completed session and stats
2. Assert completed badge visible
3. Assert stats row: duration (`45m`), volume (`2340kg`), sets (`18 sets`)
4. Assert Clock, Dumbbell, Layers icons present
5. Assert CTA text = "Xem tổng kết" (not "Bắt đầu tập")
6. Assert CTA has outline/secondary styling (not `bg-primary`)
   **Expected**: Completed state shows stats and summary CTA.

---

### TC_W201_22: All 3 sessions completed (SC_W201_20)

**Precondition**: 3 sessions, all completed
**Steps**:

1. Render with `completedSessionIds: ['ms1', 'ms2', 'ms3']`, `daySessions: [session1, session2, session3]`
2. Assert "Hoàn thành" badge OR "3/3" badge visible
3. Assert CTA changes to summary view
4. Assert SessionTabs still rendered
   **Expected**: Fully completed state with all indicators.

---

### TC_W201_23: Empty exercises still renders hero (SC_W201_21)

**Precondition**: planDay with `exercises: '[]'`, exercises prop = []
**Steps**:

1. Render with empty exercises
2. Assert `today-hero-card` present (hero renders)
3. Assert exercise list NOT in DOM
4. Assert info line shows "0 bài tập"
5. Assert CTA still visible
   **Expected**: Hero renders without exercises.

---

### TC_W201_24: Modified badge and restore (SC_W201_22, regression)

**Precondition**: modifiedPlanDay
**Steps**:

1. Render with modifiedPlanDay
2. Assert "Đã chỉnh sửa" badge visible
3. Assert restore button visible
4. Click restore → `onRestoreOriginal` called with 'd1'
   **Expected**: W1-01 modification behavior preserved in redesign.

---

### TC_W201_25: Not modified — no badge (regression)

**Precondition**: basePlanDay (originalExercises undefined)
**Steps**:

1. Render with standard planDay
2. Assert modified badge NOT in DOM
3. Assert restore button NOT in DOM
   **Expected**: No modification indicators on unmodified plan.

---

### TC_W201_26: Cardio workout type (SC_W201_23)

**Precondition**: cardioPlanDay
**Steps**:

1. Render with cardio planDay
2. Assert title shows "Cardio" (translated)
3. Assert no muscle groups in info line
4. Assert CTA present
   **Expected**: Cardio type handled correctly.

---

### TC_W201_27: Touch targets on all buttons (SC_W201_24, BR-37)

**Precondition**: modifiedPlanDay, EXERCISES_6
**Steps**:

1. Render with all buttons visible
2. Assert CTA: `min-h-12` (48px)
3. Assert edit: `min-h-[44px]` and `min-w-[44px]` (or `min-h-11 min-w-11`)
4. Assert convert to rest: `min-h-11` or `min-h-[44px]`
5. Assert restore: `min-h-[44px]` and `min-w-[44px]`
   **Expected**: All interactive elements meet minimum touch target.

---

### TC_W201_28: Press feedback on all interactive elements (SC_W201_25, BR-42)

**Precondition**: Standard planDay
**Steps**:

1. Render component
2. Assert CTA has `active:scale-[0.98]` and `motion-reduce:transform-none`
3. Assert convert button has same classes
4. Assert ALL tappable elements have press feedback
   **Expected**: BR-42 compliant press feedback.

---

### TC_W201_29: Focus visibility on all buttons (SC_W201_26)

**Precondition**: modifiedPlanDay with EXERCISES_6
**Steps**:

1. Render with all interactive elements visible
2. For each button, assert `focus-visible:ring-2` and `focus-visible:outline-none`
   **Expected**: Full keyboard accessibility.

---

### TC_W201_30: No muscle groups renders cleanly (SC_W201_27)

**Precondition**: planDay with `muscleGroups: undefined`
**Steps**:

1. Render component
2. Assert no muscle group text in info line
3. Assert exercise count and duration still visible
4. Assert card renders without errors
   **Expected**: Graceful handling of missing muscle groups.

---

### TC_W201_31: Single exercise, no collapse (SC_W201_28)

**Precondition**: 1 exercise only
**Steps**:

1. Render with single exercise
2. Assert exercise list has 1 item
3. Assert no collapse toggle in DOM
   **Expected**: No collapse for ≤3 exercises.

---

### TC_W201_32: onDeleteSession undefined (SC_W201_29)

**Precondition**: `onDeleteSession` not provided
**Steps**:

1. Render without `onDeleteSession` prop
2. Assert SessionTabs renders
3. Assert no delete button in mock
   **Expected**: Optional delete callback handled.

---

### TC_W201_33: Rest workout type in stats (regression)

**Precondition**: planDay with `workoutType: 'rest'`, exercises=[]
**Steps**:

1. Render component (using WorkoutStatsContent branch)
2. Assert "Ngày nghỉ" shown in stats/info area
   **Expected**: Rest type label correctly displayed.

---

### TC_W201_34: Exactly 4 exercises — collapse shows "+1" (edge case)

**Precondition**: 4 exercises, `exercisesExpanded: false`
**Steps**:

1. Render with 4 exercises
2. Assert list shows 3 items
3. Assert "+1 bài tập nữa" text visible
   **Expected**: Boundary case at threshold+1 handled.

---

## 7. Coverage Requirements

### 7.1 Branch Coverage

| Branch                                              | Test Cases                         |
| --------------------------------------------------- | ---------------------------------- |
| Workout hero vs Rest hero vs Completed hero         | TC_W201_01, TC_W201_17, TC_W201_21 |
| Eyebrow: no badge / completed / multi-session count | TC_W201_03, TC_W201_04, TC_W201_05 |
| muscleGroups defined vs undefined                   | TC_W201_06, TC_W201_30             |
| exercises.length === 0                              | TC_W201_23                         |
| exercises.length ≤ 3 (no collapse)                  | TC_W201_07, TC_W201_31             |
| exercises.length > 3 (collapsed)                    | TC_W201_09                         |
| exercisesExpanded true/false                        | TC_W201_09, TC_W201_10             |
| isModified true/false                               | TC_W201_24, TC_W201_25             |
| completedSessionIds includes all / partial / none   | TC_W201_03, TC_W201_05, TC_W201_22 |
| tomorrowPlanDay provided / undefined                | TC_W201_18, TC_W201_19             |
| onDeleteSession provided / undefined                | TC_W201_15, TC_W201_32             |
| daySessions.length 1 / 2 / 3                        | TC_W201_01, TC_W201_15, TC_W201_16 |

### 7.2 Statement Coverage Target

- **100%** for all lines in `TodayWorkoutCard.tsx`
- Every JSX branch (conditional renders) covered
- WorkoutStatsContent all 3 branches: cardio, rest, strength

---

## 8. i18n Keys Required

### 8.1 Existing Keys (from W1-01)

| Key                          | Vietnamese                 |
| ---------------------------- | -------------------------- |
| `fitness.plan.todayWorkout`  | Buổi tập hôm nay           |
| `fitness.plan.startWorkout`  | Bắt đầu tập                |
| `fitness.plan.convertToRest` | Chuyển thành ngày nghỉ     |
| `fitness.plan.editExercises` | Chỉnh sửa bài tập          |
| `fitness.plan.modified`      | Đã chỉnh sửa               |
| `fitness.plan.restore`       | Khôi phục                  |
| `fitness.plan.setsLabel`     | hiệp                       |
| `fitness.plan.repsLabel`     | lần                        |
| `fitness.plan.exercises`     | bài tập                    |
| `fitness.plan.minutes`       | phút                       |
| `fitness.plan.moreExercises` | +{{remaining}} bài tập nữa |
| `fitness.plan.showLess`      | Thu gọn                    |
| `fitness.plan.cardioDay`     | Cardio                     |
| `fitness.plan.restDay`       | Ngày nghỉ                  |

### 8.2 New Keys for W2-01

| Key                            | Vietnamese                   | Used In               |
| ------------------------------ | ---------------------------- | --------------------- |
| `fitness.plan.todayLabel`      | Hôm nay                      | Eyebrow label         |
| `fitness.plan.completed`       | Hoàn thành                   | Completed badge       |
| `fitness.plan.tomorrowPreview` | Ngày mai                     | Rest hero preview     |
| `fitness.plan.restDayTip`      | Nghỉ ngơi để cơ thể phục hồi | Rest hero description |
| `fitness.plan.restDayRegion`   | Khu vực ngày nghỉ            | Rest hero aria-label  |
| `fitness.plan.logWeight`       | Cân nặng                     | Rest quick action     |
| `fitness.plan.quickCardio`     | Cardio nhanh                 | Rest quick action     |
| `fitness.plan.viewSummary`     | Xem tổng kết                 | Completed CTA         |

---

## 9. Risk Assessment

| Risk                                                   | Severity | Mitigation                                                |
| ------------------------------------------------------ | -------- | --------------------------------------------------------- |
| testid change `today-workout-card` → `today-hero-card` | HIGH     | Update ALL test selectors; parent tests may break         |
| CTA testid change → `btn-start-workout-hero`           | HIGH     | Update test + verify parent component uses new testid     |
| New props required for rest/completed variants         | MEDIUM   | Dev may add internal state or new props; tests must adapt |
| Exercise format change (numbered, tabular-nums)        | LOW      | Update exercise text assertions                           |
| WorkoutStatsContent may be removed/replaced            | MEDIUM   | If inline info replaces separate component, update tests  |
| New i18n keys not added to vi.json                     | LOW      | Mock translations in test; verify vi.json separately      |
| `<section>` vs `<div>` — tag-level assertions          | LOW      | Only matters if test checks tag name                      |

---

## 10. Test Execution Notes

### 10.1 Mock Updates Required

The test mock for `react-i18next` must add new translation keys:

```typescript
const translations: Record<string, string> = {
  // ... existing keys ...
  'fitness.plan.todayLabel': 'Hôm nay',
  'fitness.plan.completed': 'Hoàn thành',
  'fitness.plan.tomorrowPreview': 'Ngày mai',
  'fitness.plan.restDayTip': 'Nghỉ ngơi để cơ thể phục hồi',
  'fitness.plan.restDayRegion': 'Khu vực ngày nghỉ',
  'fitness.plan.logWeight': 'Cân nặng',
  'fitness.plan.quickCardio': 'Cardio nhanh',
  'fitness.plan.viewSummary': 'Xem tổng kết',
};
```

### 10.2 W1-01 Test Migration

All 30 W1-01 tests MUST either:

1. **Updated**: Testid changes (`today-workout-card` → `today-hero-card`, `start-workout-btn` → `btn-start-workout-hero`)
2. **Preserved**: Core callback behaviors (regression)
3. **Enhanced**: New CSS class assertions for redesigned styling

### 10.3 Quality Gates

```bash
npm run lint          # 0 errors
npm run test          # 0 failures, 100% coverage for TodayWorkoutCard
npm run build         # Clean build
npm run test:coverage # Coverage report
npm run sonar         # 0 issues
```

---

**STATUS**: TEST_PLAN_READY
