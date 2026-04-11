# Test Plan: W1-01 TodayWorkoutCard Extraction

**Component**: `src/features/fitness/components/TodayWorkoutCard.tsx`
**Test File**: `src/__tests__/TodayWorkoutCard.test.tsx`
**Type**: Unit Test (Vitest + React Testing Library)
**Author**: QA Engineer
**Status**: TEST_PLAN_READY

---

## 1. Scope

### In Scope

- TodayWorkoutCard renders today's workout with exercise list, stats, CTA, and action buttons
- Props interface correctness and type safety
- Multi-session tab delegation to `SessionTabs.tsx`
- Exercise list rendering with collapse/expand (threshold = 3)
- Modified badge + restore original button
- All interactive element touch targets (≥48dp → `min-h-12 min-w-12` i.e. `min-h-[48px]` or `min-h-[44px]` per existing pattern)
- Press feedback (`active:scale-[0.98] motion-reduce:transform-none`)
- Focus visibility (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`)
- Edge cases: empty exercises, zero exercises, invalid JSON, cardio workout type
- 100% test coverage for new file

### Out of Scope

- SessionTabs internal logic (tested separately, mocked here)
- TrainingPlanView integration (parent component)
- Emulator/CDP testing (pure component extraction)
- WorkoutLogger navigation (tested via callback verification)

---

## 2. Proposed Props Interface (Contract)

Based on source analysis of TrainingPlanView.tsx lines 609-765, the extracted component requires:

```typescript
interface TodayWorkoutCardProps {
  /** Current active plan day being displayed */
  planDay: TrainingPlanDay;
  /** All sessions for today's day-of-week (for SessionTabs) */
  daySessions: TrainingPlanDay[];
  /** Currently active session tab ID */
  activeSessionId: string;
  /** IDs of sessions already completed today */
  completedSessionIds: string[];
  /** Parsed exercises for active session */
  exercises: SelectedExercise[];
  /** Estimated workout duration in minutes */
  estimatedMinutes: number;
  /** Whether exercises expand/collapse is toggled open */
  exercisesExpanded: boolean;

  // --- Callbacks ---
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

---

## 3. Test Data Fixtures

### 3.1 Standard Exercises (3 — at collapse threshold)

```typescript
const EXERCISES_3 = [
  { exercise: { id: 'e1', nameVi: 'Bench Press' }, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
  { exercise: { id: 'e2', nameVi: 'Shoulder Press' }, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
  { exercise: { id: 'e3', nameVi: 'Fly' }, sets: 2, repsMin: 10, repsMax: 15, restSeconds: 60 },
];
// estimateDuration: 3*(40+90)+30 + 3*(40+90)+30 + 2*(40+60)+30 = 1070s ≈ 18min + 5 warmup = 23 min
```

### 3.2 Many Exercises (6 — triggers collapse)

```typescript
const EXERCISES_6 = [
  ...EXERCISES_3,
  { exercise: { id: 'e4', nameVi: 'Dips' }, sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
  { exercise: { id: 'e5', nameVi: 'Cable Fly' }, sets: 3, repsMin: 10, repsMax: 15, restSeconds: 60 },
  { exercise: { id: 'e6', nameVi: 'Tricep Push' }, sets: 2, repsMin: 12, repsMax: 15, restSeconds: 60 },
];
// Hidden count: 6 - 3 = 3
```

### 3.3 Plan Day Fixtures

```typescript
const basePlanDay: TrainingPlanDay = {
  id: 'd1',
  planId: 'plan1',
  dayOfWeek: 1,
  sessionOrder: 1,
  workoutType: 'Upper Body A',
  muscleGroups: 'chest,shoulders',
  exercises: JSON.stringify(EXERCISES_3),
  isUserAssigned: false,
  originalDayOfWeek: 1,
};

const modifiedPlanDay: TrainingPlanDay = {
  ...basePlanDay,
  exercises: JSON.stringify([EXERCISES_3[0]]), // modified to 1 exercise
  originalExercises: JSON.stringify(EXERCISES_3), // original had 3
};

const cardioPlanDay: TrainingPlanDay = {
  ...basePlanDay,
  id: 'd-cardio',
  workoutType: 'Cardio',
  muscleGroups: undefined,
  exercises: '[]',
};

const noExercisesPlanDay: TrainingPlanDay = {
  ...basePlanDay,
  exercises: undefined,
};
```

### 3.4 Multi-Session Fixtures

```typescript
const session1: TrainingPlanDay = { ...basePlanDay, id: 'ms1', sessionOrder: 1 };
const session2: TrainingPlanDay = {
  ...basePlanDay,
  id: 'ms2',
  sessionOrder: 2,
  workoutType: 'Cardio',
  muscleGroups: '',
  exercises: '[]',
};
const session3: TrainingPlanDay = {
  ...basePlanDay,
  id: 'ms3',
  sessionOrder: 3,
  workoutType: 'Core',
  muscleGroups: 'core',
  exercises: JSON.stringify([EXERCISES_3[0]]),
};
```

---

## 4. Test Scenarios

### SC_W1_01_01: Happy Path — Standard workout with exercises

**Precondition**: planDay with 3 exercises, single session, not modified.

| #   | Verify                                        | Expected                                                     |
| --- | --------------------------------------------- | ------------------------------------------------------------ |
| 1   | Card renders with testid `today-workout-card` | Present in DOM                                               |
| 2   | Header label shows "Buổi tập hôm nay"         | Text content matches i18n key `fitness.plan.todayWorkout`    |
| 3   | Workout type title                            | `translateWorkoutType(t, 'Upper Body A')` → "Thân trên A"    |
| 4   | Muscle groups displayed                       | "Ngực, Vai" (translated from `chest,shoulders`)              |
| 5   | Workout stats                                 | "3 bài tập" and "~23 phút"                                   |
| 6   | Exercise list has 3 items                     | `exercise-list` children count = 3                           |
| 7   | Exercise names visible                        | "Bench Press", "Shoulder Press", "Fly"                       |
| 8   | Exercise set/rep format                       | "3 hiệp × 8-12 lần" for first exercise                       |
| 9   | No collapse toggle                            | `exercise-collapse-toggle` NOT in DOM                        |
| 10  | Start workout CTA visible                     | `start-workout-btn` with text "Bắt đầu tập" or matching i18n |
| 11  | Edit exercises button visible                 | `edit-exercises-btn` present                                 |
| 12  | Convert to rest button visible                | `day-convert-rest-btn` present                               |
| 13  | No modified badge                             | `modified-badge` NOT in DOM                                  |
| 14  | No restore button                             | `restore-original-btn` NOT in DOM                            |

---

### SC_W1_01_02: Multi-Session — 2 sessions with tab switching

**Precondition**: 2 sessions on same dayOfWeek (session1=Push, session2=Cardio).

| #   | Verify                                | Expected                                                        |
| --- | ------------------------------------- | --------------------------------------------------------------- |
| 1   | SessionTabs rendered                  | Mock `SessionTabs` present (sessions.length >= 1)               |
| 2   | SessionTabs receives correct sessions | `sessions` prop = [session1, session2]                          |
| 3   | Active session ID passed              | `activeSessionId` = session1.id (default first)                 |
| 4   | onSelectSession callback wired        | Clicking session tab triggers `onSelectSession` with session ID |
| 5   | onAddSession callback wired           | Add button triggers `onAddSession`                              |
| 6   | onDeleteSession callback wired        | Delete triggers `onDeleteSession`                               |

---

### SC_W1_01_03: Multi-Session — 3 sessions (BR-13 max boundary)

**Precondition**: 3 sessions on same dayOfWeek.

| #   | Verify                               | Expected                                 |
| --- | ------------------------------------ | ---------------------------------------- |
| 1   | SessionTabs rendered with 3 sessions | sessions.length = 3                      |
| 2   | Card still renders correctly         | `today-workout-card` present             |
| 3   | Active session content shown         | Workout type of active session displayed |

---

### SC_W1_01_04: Empty Exercises — exercises is undefined

**Precondition**: planDay with `exercises: undefined`, `exercises` prop = [].

| #   | Verify                    | Expected                              |
| --- | ------------------------- | ------------------------------------- |
| 1   | Card renders              | `today-workout-card` present          |
| 2   | No exercise list          | `exercise-list` NOT in DOM            |
| 3   | No collapse toggle        | `exercise-collapse-toggle` NOT in DOM |
| 4   | Workout stats show 0      | "0 bài tập", "~0 phút"                |
| 5   | CTA still visible         | `start-workout-btn` present           |
| 6   | Edit button still visible | `edit-exercises-btn` present          |

---

### SC_W1_01_05: Empty Exercises — exercises is `[]` (empty array)

**Precondition**: planDay with `exercises: '[]'`, `exercises` prop = [].

| #   | Verify             | Expected                              |
| --- | ------------------ | ------------------------------------- |
| 1   | No exercise list   | `exercise-list` NOT in DOM            |
| 2   | No collapse toggle | `exercise-collapse-toggle` NOT in DOM |
| 3   | CTA still works    | `start-workout-btn` clickable         |

---

### SC_W1_01_06: Exercise Collapse/Expand — >3 exercises

**Precondition**: planDay with 6 exercises, `exercisesExpanded = false`.

| #   | Verify                                         | Expected                                                               |
| --- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Only 3 exercises shown initially               | `exercise-list` children count = 3                                     |
| 2   | Collapse toggle present                        | `exercise-collapse-toggle` in DOM                                      |
| 3   | Toggle text shows hidden count                 | "+3 bài tập nữa" (i18n: `fitness.plan.moreExercises` with remaining=3) |
| 4   | Toggle has correct aria-label                  | Same as text content                                                   |
| 5   | Clicking toggle calls `onToggleExerciseExpand` | Callback invoked once                                                  |

---

### SC_W1_01_07: Exercise Collapse/Expand — expanded state

**Precondition**: planDay with 6 exercises, `exercisesExpanded = true`.

| #   | Verify                                         | Expected                           |
| --- | ---------------------------------------------- | ---------------------------------- |
| 1   | All 6 exercises shown                          | `exercise-list` children count = 6 |
| 2   | Toggle text = "Thu gọn"                        | i18n: `fitness.plan.showLess`      |
| 3   | Clicking toggle calls `onToggleExerciseExpand` | Callback invoked once              |

---

### SC_W1_01_08: Modified Badge & Restore

**Precondition**: planDay where `exercises !== originalExercises` and `originalExercises != null`.

| #   | Verify                                     | Expected                                         |
| --- | ------------------------------------------ | ------------------------------------------------ |
| 1   | Modified badge visible                     | `modified-badge` in DOM with text "Đã chỉnh sửa" |
| 2   | Restore button visible                     | `restore-original-btn` in DOM                    |
| 3   | Restore button has correct aria-label      | `fitness.plan.restore` translation               |
| 4   | Clicking restore calls `onRestoreOriginal` | Called with `planDay.id`                         |

---

### SC_W1_01_09: Not Modified — exercises equal to original

**Precondition**: planDay where `exercises === originalExercises`.

| #   | Verify            | Expected                          |
| --- | ----------------- | --------------------------------- |
| 1   | No modified badge | `modified-badge` NOT in DOM       |
| 2   | No restore button | `restore-original-btn` NOT in DOM |

---

### SC_W1_01_10: Not Modified — originalExercises is undefined

**Precondition**: planDay where `originalExercises` is undefined/null.

| #   | Verify            | Expected                          |
| --- | ----------------- | --------------------------------- |
| 1   | No modified badge | `modified-badge` NOT in DOM       |
| 2   | No restore button | `restore-original-btn` NOT in DOM |

---

### SC_W1_01_11: CTA Interactions — Start Workout

**Precondition**: Standard planDay with exercises.

| #   | Verify              | Expected                                           |
| --- | ------------------- | -------------------------------------------------- |
| 1   | Click start workout | `onStartWorkout` called with `planDay` object      |
| 2   | Button text         | Contains text matching `fitness.plan.startWorkout` |
| 3   | Play icon present   | `<Play>` icon rendered (aria-hidden)               |

---

### SC_W1_01_12: CTA Interactions — Convert to Rest

**Precondition**: Standard planDay.

| #   | Verify                 | Expected                                                      |
| --- | ---------------------- | ------------------------------------------------------------- |
| 1   | Convert button visible | `day-convert-rest-btn` in DOM                                 |
| 2   | Button text            | "Chuyển thành ngày nghỉ" (i18n: `fitness.plan.convertToRest`) |
| 3   | Click convert button   | `onConvertToRest` called once                                 |
| 4   | Moon icon present      | Rendered inside button                                        |

---

### SC_W1_01_13: CTA Interactions — Edit Exercises

**Precondition**: Standard planDay.

| #   | Verify              | Expected                                 |
| --- | ------------------- | ---------------------------------------- |
| 1   | Edit button visible | `edit-exercises-btn` in DOM              |
| 2   | Correct aria-label  | `fitness.plan.editExercises` translation |
| 3   | Click edit button   | `onEditExercises` called with `planDay`  |
| 4   | Pencil icon present | Rendered inside button                   |

---

### SC_W1_01_14: Cardio Workout Type

**Precondition**: planDay with `workoutType: 'Cardio'`, no muscle groups, empty exercises.

| #   | Verify                      | Expected                                           |
| --- | --------------------------- | -------------------------------------------------- |
| 1   | WorkoutStats shows "Cardio" | Text "Cardio" displayed (from WorkoutStatsContent) |
| 2   | No muscle groups line       | No comma-separated muscle group text               |
| 3   | Card still renders          | `today-workout-card` present                       |

---

### SC_W1_01_15: Touch Targets (BR-37)

**Precondition**: Standard planDay (modified, with exercises).

| Button            | testid                     | Expected class                             |
| ----------------- | -------------------------- | ------------------------------------------ |
| Start Workout CTA | `start-workout-btn`        | Contains `min-h-` (≥44px)                  |
| Edit Exercises    | `edit-exercises-btn`       | Contains `min-h-[44px]` AND `min-w-[44px]` |
| Convert to Rest   | `day-convert-rest-btn`     | Contains `min-h-[44px]`                    |
| Restore Original  | `restore-original-btn`     | Contains `min-h-[44px]` AND `min-w-[44px]` |
| Collapse Toggle   | `exercise-collapse-toggle` | Focusable, has focus ring                  |

---

### SC_W1_01_16: Press Feedback (BR-42)

**Precondition**: Standard planDay.

| Button            | testid              | Expected class                                           |
| ----------------- | ------------------- | -------------------------------------------------------- |
| Start Workout CTA | `start-workout-btn` | `active:scale-[0.98]` AND `motion-reduce:transform-none` |

---

### SC_W1_01_17: Focus Visibility (Accessibility)

**Precondition**: Standard planDay (modified).

| Button            | testid                     | Expected class                                                                        |
| ----------------- | -------------------------- | ------------------------------------------------------------------------------------- |
| Start Workout CTA | `start-workout-btn`        | `focus-visible:ring-2` AND `focus-visible:ring-ring` AND `focus-visible:outline-none` |
| Edit Exercises    | `edit-exercises-btn`       | Same pattern                                                                          |
| Convert to Rest   | `day-convert-rest-btn`     | Same pattern                                                                          |
| Restore Original  | `restore-original-btn`     | Same pattern                                                                          |
| Collapse Toggle   | `exercise-collapse-toggle` | `focus-visible:ring-2` AND `focus-visible:ring-ring` AND `focus-visible:outline-none` |

---

### SC_W1_01_18: Single Session — SessionTabs still renders

**Precondition**: Only 1 session for today.

| #   | Verify                                              | Expected                 |
| --- | --------------------------------------------------- | ------------------------ |
| 1   | SessionTabs rendered when `daySessions.length >= 1` | Mock SessionTabs present |
| 2   | Sessions prop has 1 item                            | `sessions.length === 1`  |
| 3   | Add session button available                        | Via SessionTabs mock     |

---

## 5. Test Cases

### TC_W1_01_01: Renders complete workout card with exercises (Happy path)

**Precondition**: planDay = basePlanDay (Upper Body A, 3 exercises, single session)
**Steps**:

1. Render `<TodayWorkoutCard {...defaultProps} />`
2. Assert `today-workout-card` is in document
3. Assert header contains "Buổi tập hôm nay"
4. Assert "Thân trên A" (or workoutType translation) visible
5. Assert "Ngực, Vai" visible (muscleGroups translated)
6. Assert `workout-stats` contains "3 bài tập" and "~23 phút"
7. Assert `exercise-list` has 3 children
8. Assert "Bench Press", "Shoulder Press", "Fly" visible
9. Assert first exercise shows "3 hiệp × 8-12 lần"
10. Assert `start-workout-btn` is in document
11. Assert `edit-exercises-btn` is in document
12. Assert `day-convert-rest-btn` is in document
    **Expected**: All assertions pass.

---

### TC_W1_01_02: No modified badge when originalExercises is undefined

**Precondition**: planDay without `originalExercises`
**Steps**:

1. Render with planDay that has NO `originalExercises`
2. Assert `modified-badge` NOT in document
3. Assert `restore-original-btn` NOT in document
   **Expected**: Neither badge nor restore button rendered.

---

### TC_W1_01_03: Shows modified badge when exercises differ from original

**Precondition**: planDay with `exercises ≠ originalExercises` and both defined
**Steps**:

1. Render with `modifiedPlanDay`
2. Assert `modified-badge` is in document with text "Đã chỉnh sửa"
3. Assert `restore-original-btn` is in document
   **Expected**: Badge and restore button visible.

---

### TC_W1_01_04: No modified badge when exercises equal original

**Precondition**: planDay where `exercises === originalExercises`
**Steps**:

1. Render with planDay where both fields are identical strings
2. Assert `modified-badge` NOT in document
3. Assert `restore-original-btn` NOT in document
   **Expected**: No badge or restore button.

---

### TC_W1_01_05: Clicking restore calls onRestoreOriginal with planDay.id

**Precondition**: modifiedPlanDay
**Steps**:

1. Render with modifiedPlanDay
2. Click `restore-original-btn`
3. Assert `onRestoreOriginal` called with `'d1'`
   **Expected**: Callback invoked exactly once with correct ID.

---

### TC_W1_01_06: Start workout CTA calls onStartWorkout

**Precondition**: Standard planDay
**Steps**:

1. Render component
2. Click `start-workout-btn`
3. Assert `onStartWorkout` called with planDay object
   **Expected**: `onStartWorkout` called once with exact planDay reference.

---

### TC_W1_01_07: Edit exercises calls onEditExercises

**Precondition**: Standard planDay
**Steps**:

1. Render component
2. Click `edit-exercises-btn`
3. Assert `onEditExercises` called with planDay object
   **Expected**: `onEditExercises` called once with exact planDay reference.

---

### TC_W1_01_08: Convert to rest calls onConvertToRest

**Precondition**: Standard planDay
**Steps**:

1. Render component
2. Click `day-convert-rest-btn`
3. Assert `onConvertToRest` called once
   **Expected**: Callback invoked.

---

### TC_W1_01_09: No exercise list when exercises prop is empty array

**Precondition**: exercises = [], estimatedMinutes = 0
**Steps**:

1. Render with exercises=[], estimatedMinutes=0
2. Assert `exercise-list` NOT in document
3. Assert `exercise-collapse-toggle` NOT in document
4. Assert `start-workout-btn` IS in document (CTA always present)
   **Expected**: No list rendered, CTA still available.

---

### TC_W1_01_10: No exercise list when exercises field undefined (0 parsed)

**Precondition**: planDay.exercises = undefined, exercises prop = []
**Steps**:

1. Render with noExercisesPlanDay, exercises=[], estimatedMinutes=0
2. Assert `exercise-list` NOT in document
3. Assert `workout-stats` shows "0 bài tập" and "~0 phút"
   **Expected**: Stats show zero, no list.

---

### TC_W1_01_11: Exercise list shows 3 items without collapse when exactly 3

**Precondition**: exercises = EXERCISES_3 (length = 3)
**Steps**:

1. Render with 3 exercises
2. Assert `exercise-list` children count = 3
3. Assert `exercise-collapse-toggle` NOT in document
   **Expected**: All 3 visible, no toggle.

---

### TC_W1_01_12: Collapses to 3 with toggle when >3 exercises (collapsed state)

**Precondition**: exercises = EXERCISES_6 (length = 6), exercisesExpanded = false
**Steps**:

1. Render with 6 exercises, exercisesExpanded=false
2. Assert `exercise-list` children count = 3
3. Assert `exercise-collapse-toggle` in document
4. Assert toggle text = "+3 bài tập nữa"
5. Assert toggle aria-label matches text
   **Expected**: Only first 3 shown, toggle shows remaining count.

---

### TC_W1_01_13: Shows all exercises when expanded state

**Precondition**: exercises = EXERCISES_6, exercisesExpanded = true
**Steps**:

1. Render with 6 exercises, exercisesExpanded=true
2. Assert `exercise-list` children count = 6
3. Assert toggle text = "Thu gọn"
   **Expected**: All 6 visible, toggle shows collapse label.

---

### TC_W1_01_14: Clicking collapse toggle calls onToggleExerciseExpand

**Precondition**: exercises = EXERCISES_6
**Steps**:

1. Render with 6 exercises
2. Click `exercise-collapse-toggle`
3. Assert `onToggleExerciseExpand` called once
   **Expected**: Callback invoked.

---

### TC_W1_01_15: SessionTabs rendered when daySessions has 1+ session

**Precondition**: daySessions = [session1] (single session)
**Steps**:

1. Render with daySessions containing 1 session
2. Assert mocked SessionTabs is in document
   **Expected**: SessionTabs present even for single session (shows + button).

---

### TC_W1_01_16: SessionTabs receives correct props for multi-session

**Precondition**: daySessions = [session1, session2], activeSessionId = session1.id
**Steps**:

1. Render with 2 sessions
2. Assert mocked SessionTabs rendered with sessions=[session1, session2]
3. Assert activeSessionId = session1.id
4. Assert onSelectSession, onAddSession, onDeleteSession wired
   **Expected**: All props passed correctly.

---

### TC_W1_01_17: SessionTabs renders for 3 sessions (BR-13 max)

**Precondition**: daySessions = [session1, session2, session3]
**Steps**:

1. Render with 3 sessions
2. Assert SessionTabs rendered with 3 sessions
3. Assert card still functional
   **Expected**: Renders correctly at max session boundary.

---

### TC_W1_01_18: Cardio workout type shows "Cardio" in stats

**Precondition**: planDay.workoutType = 'Cardio', exercises = []
**Steps**:

1. Render with cardioPlanDay, exercises=[], estimatedMinutes=0
2. Assert stats area shows "Cardio" (from WorkoutStatsContent)
3. Assert no muscle groups text
   **Expected**: Cardio label displayed, no muscle group line.

---

### TC_W1_01_19: Workout type without muscleGroups renders cleanly

**Precondition**: planDay.muscleGroups = undefined
**Steps**:

1. Render with planDay that has no muscleGroups field
2. Assert no muscle groups paragraph rendered
3. Assert rest of card renders normally
   **Expected**: No crash, no empty paragraph.

---

### TC_W1_01_20: Start workout CTA has active:scale and motion-reduce

**Precondition**: Standard planDay
**Steps**:

1. Render component
2. Get `start-workout-btn` element
3. Assert className contains `active:scale-[0.98]`
4. Assert className contains `motion-reduce:transform-none`
   **Expected**: Both classes present.

---

### TC_W1_01_21: All interactive elements have focus-visible ring

**Precondition**: modifiedPlanDay (to ensure restore button visible)
**Steps**:

1. Render with modifiedPlanDay and 6 exercises
2. For each button (`start-workout-btn`, `edit-exercises-btn`, `day-convert-rest-btn`, `restore-original-btn`, `exercise-collapse-toggle`):
   - Assert className contains `focus-visible:ring-2`
   - Assert className contains `focus-visible:outline-none`
     **Expected**: All interactive elements have focus ring.

---

### TC_W1_01_22: Touch targets — all buttons ≥44px min size

**Precondition**: modifiedPlanDay with 6 exercises
**Steps**:

1. Render with modifiedPlanDay
2. Assert `start-workout-btn` className contains min-h pattern
3. Assert `edit-exercises-btn` className contains `min-h-[44px]` AND `min-w-[44px]`
4. Assert `day-convert-rest-btn` className contains `min-h-[44px]`
5. Assert `restore-original-btn` className contains `min-h-[44px]` AND `min-w-[44px]`
   **Expected**: All touch targets meet 44px minimum.

---

### TC_W1_01_23: Exercise item shows set/rep format correctly

**Precondition**: exercises with varied sets/reps
**Steps**:

1. Render with EXERCISES_3
2. Find first exercise item
3. Assert text contains "3 hiệp × 8-12 lần"
4. Find third exercise item (Fly)
5. Assert text contains "2 hiệp × 10-15 lần"
   **Expected**: Format: `{sets} hiệp × {repsMin}-{repsMax} lần`

---

### TC_W1_01_24: Exercise names are truncated (CSS class)

**Precondition**: Standard exercises
**Steps**:

1. Render component
2. Find exercise name span elements
3. Assert name spans have `truncate` class (or `min-w-0 truncate`)
   **Expected**: Long names get CSS truncation.

---

### TC_W1_01_25: Header shows disabled toggle with correct label

**Precondition**: Standard planDay
**Steps**:

1. Render component
2. Find header button with testid `day-accordion-toggle-{dayNum}` (or equivalent)
3. Assert button is disabled (today's card is always expanded)
4. Assert contains Calendar icon
5. Assert text = "Buổi tập hôm nay"
   **Expected**: Header rendered as disabled (non-interactive for today).

---

## 6. Edge Cases

### EC_W1_01_01: Exercises at exactly threshold boundary (3)

- 3 exercises → NO collapse toggle
- 4 exercises → collapse toggle shows "+1 bài tập nữa"

### EC_W1_01_02: Single exercise

- exercises = [1 item] → list shows 1 item, no collapse, stats = "1 bài tập"

### EC_W1_01_03: muscleGroups as JSON array vs comma-separated

- `'["chest","shoulders"]'` → parsed via `safeParseJsonArray` → "Ngực, Vai"
- `'chest,shoulders'` → fallback comma split → "Ngực, Vai"
- `undefined` → no muscle groups paragraph

### EC_W1_01_04: Workout type translation fallback

- `workoutType: 'Push'` → no i18n key → returns raw "Push"
- `workoutType: 'Upper Body A'` → key `fitness.workoutType.Upper Body A` → "Thân trên A"

### EC_W1_01_05: completedSessionIds interaction

- Active session in completedSessionIds → SessionTabs shows check icon (delegated)

### EC_W1_01_06: onDeleteSession undefined

- When `onDeleteSession` is not provided → SessionTabs should still render without delete capability

---

## 7. Mock Strategy

```typescript
// Mock react-i18next (reuse existing TrainingPlanView.test.tsx pattern)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown> | string) => {
      // Include all keys used by TodayWorkoutCard
      const map: Record<string, string> = {
        'fitness.plan.todayWorkout': 'Buổi tập hôm nay',
        'fitness.plan.startWorkout': 'Bắt đầu tập',
        'fitness.plan.convertToRest': 'Chuyển thành ngày nghỉ',
        'fitness.plan.editExercises': 'Chỉnh sửa bài tập',
        'fitness.plan.restore': 'Khôi phục',
        'fitness.plan.modified': 'Đã chỉnh sửa',
        'fitness.plan.setsLabel': 'hiệp',
        'fitness.plan.repsLabel': 'lần',
        'fitness.plan.exercises': 'bài tập',
        'fitness.plan.minutes': 'phút',
        'fitness.plan.moreExercises': '+{{remaining}} bài tập nữa',
        'fitness.plan.showLess': 'Thu gọn',
        'fitness.plan.cardioDay': 'Cardio',
        'fitness.onboarding.muscle_chest': 'Ngực',
        'fitness.onboarding.muscle_shoulders': 'Vai',
        'fitness.onboarding.muscle_back': 'Lưng',
        'fitness.onboarding.muscle_arms': 'Tay',
        'fitness.onboarding.muscle_legs': 'Chân',
        'fitness.onboarding.muscle_core': 'Cơ trung tâm',
        'fitness.workoutType.Upper Body A': 'Thân trên A',
      };
      // Template interpolation for {{remaining}}
      const tpl = map[key];
      if (tpl && typeof opts === 'object' && opts !== null) {
        return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => String(opts[k] ?? ''));
      }
      if (tpl) return tpl;
      if (typeof opts === 'string') return opts;
      if (typeof opts === 'object' && opts?.defaultValue) return String(opts.defaultValue);
      return key;
    },
    i18n: { language: 'vi' },
  }),
}));

// Mock SessionTabs (follow existing pattern from TrainingPlanView.test.tsx)
vi.mock('../features/fitness/components/SessionTabs', () => ({
  SessionTabs: (props: SessionTabsProps) => (
    <div data-testid="session-tabs" role="tablist">
      {props.sessions.map((s, i) => (
        <button key={i} role="tab" data-testid={`session-tab-${i}`}
          onClick={() => props.onSelectSession(s.id)} />
      ))}
      <button data-testid="add-session-tab" onClick={props.onAddSession}>+</button>
    </div>
  ),
}));
```

---

## 8. Coverage Requirements

| Metric     | Target | Notes                                                                |
| ---------- | ------ | -------------------------------------------------------------------- |
| Statements | 100%   | All branches in render logic                                         |
| Branches   | 100%   | Modified badge conditions, collapse threshold, muscleGroups presence |
| Functions  | 100%   | All callbacks exercised                                              |
| Lines      | 100%   | Every line executed                                                  |

### Critical branches requiring explicit tests:

1. `exercises.length > 0` (true/false)
2. `exercises.length > COLLAPSE_THRESHOLD` (true/false)
3. `exercisesExpanded` (true/false) — when shouldCollapse
4. `planDay.originalExercises != null && planDay.exercises !== planDay.originalExercises` (true/false × 2 locations)
5. `planDay.muscleGroups` truthy/falsy
6. `daySessions.length >= 1` (true/false for SessionTabs rendering)
7. WorkoutStatsContent: cardio vs strength vs rest type

---

## 9. LOC Budget Check

Target: ≤250 LOC for `TodayWorkoutCard.tsx`

Source analysis: Extracted section (lines 609-765) = ~156 lines of JSX + ~20 lines for imports/interface/export ≈ **~180 LOC**. Well within budget.

---

## 10. Definition of Done

- [ ] All 25 test cases pass (TC_W1_01_01 through TC_W1_01_25)
- [ ] 100% coverage on `TodayWorkoutCard.tsx`
- [ ] `npm run lint` → 0 errors
- [ ] `npm run test` → 0 failures
- [ ] `npm run build` → clean build
- [ ] Component ≤250 LOC
- [ ] No `eslint-disable` comments
- [ ] All buttons have `min-h-[44px]` (touch target compliance)
- [ ] CTA has `active:scale-[0.98] motion-reduce:transform-none`
- [ ] All interactive elements have `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`

---

[QA] Trạng thái: TEST_PLAN_READY
