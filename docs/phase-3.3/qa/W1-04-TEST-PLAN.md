# 🧪 Test Plan — TASK-W1-04: PlanDayAccordion Extraction

> **Status**: TEST_PLAN_READY
> **Author**: QA Agent (TDD-First)
> **Date**: 2025-07-14
> **Task**: W1-04 — Extract non-today day accordion from TrainingPlanView into PlanDayAccordion
> **Test File**: `src/__tests__/PlanDayAccordion.test.tsx`
> **SUT File**: `src/features/fitness/components/PlanDayAccordion.tsx`
> **Type**: Unit Tests (Vitest + React Testing Library)

---

## 1. References

| Document             | Section             | Key Info                                                                      |
| -------------------- | ------------------- | ----------------------------------------------------------------------------- |
| TECH-LEADER-PLAN.md  | §TASK-W1-04         | AC 1-8, QA focus areas                                                        |
| DESIGNER-UI-SPEC.md  | §3.4 (US-04)        | Props interface, layout, a11y, edge cases                                     |
| BM-BUSINESS-LOGIC.md | US-04, BR-35, BR-37 | Touch targets ≥48dp, long-press context menu                                  |
| TrainingPlanView.tsx | Lines 839-973       | Source code to extract (non-today collapsed + expanded states)                |
| EmptyState.tsx       | variant="compact"   | Inline empty: title + optional CTA button                                     |
| vi.json              | fitness.plan.\*     | i18n keys: startWorkout, editExercises, exercises, setsLabel, repsLabel, etc. |

---

## 2. Props Interface Under Test

From Design §3.4:

```typescript
interface PlanDayAccordionProps {
  planDay: TrainingPlanDay; // from src/features/fitness/types.ts
  dayOfWeek: number; // 1-7 (Mon=1, Sun=7)
  isExpanded: boolean;
  isCompleted: boolean;
  onToggle: () => void;
  onStartWorkout: () => void;
  onEditExercises: () => void;
}
```

Key derived data inside component:

- `dayLabel`: from `DAY_LABELS[dayOfWeek - 1]` (T2-CN)
- `workoutName`: from `translateWorkoutType(t, planDay.workoutType)`
- `exercises`: parsed from `planDay.exercises` JSON string via `parseExercises()`
- `muscleGroups`: parsed from `planDay.muscleGroups` JSON string

---

## 3. Test Data Fixtures

### 3.1 Standard PlanDay (with exercises)

```typescript
const MOCK_EXERCISES: SelectedExercise[] = [
  {
    exercise: {
      id: 'bench-press',
      nameVi: 'Đẩy ngực ngang',
      nameEn: 'Bench Press',
      muscleGroup: 'chest',
      secondaryMuscles: ['shoulders', 'arms'],
      category: 'compound',
      equipment: ['barbell'],
      contraindicated: [],
      exerciseType: 'strength',
      defaultRepsMin: 8,
      defaultRepsMax: 12,
      isCustom: false,
      updatedAt: '',
    },
    sets: 4,
    repsMin: 8,
    repsMax: 12,
  },
  {
    exercise: {
      id: 'incline-db',
      nameVi: 'Đẩy ngực dốc tạ tay',
      nameEn: 'Incline DB Press',
      muscleGroup: 'chest',
      secondaryMuscles: ['shoulders'],
      category: 'compound',
      equipment: ['dumbbell'],
      contraindicated: [],
      exerciseType: 'strength',
      defaultRepsMin: 10,
      defaultRepsMax: 15,
      isCustom: false,
      updatedAt: '',
    },
    sets: 3,
    repsMin: 10,
    repsMax: 15,
  },
];

const MOCK_PLAN_DAY: TrainingPlanDay = {
  id: 'day-tue-1',
  planId: 'plan-1',
  dayOfWeek: 2, // Tuesday
  sessionOrder: 1,
  workoutType: 'Chest',
  muscleGroups: JSON.stringify(['chest', 'shoulders']),
  exercises: JSON.stringify(MOCK_EXERCISES),
  originalExercises: JSON.stringify(MOCK_EXERCISES),
  isUserAssigned: false,
  originalDayOfWeek: 2,
};
```

### 3.2 Empty Exercises PlanDay

```typescript
const MOCK_EMPTY_PLAN_DAY: TrainingPlanDay = {
  ...MOCK_PLAN_DAY,
  id: 'day-wed-1',
  dayOfWeek: 3,
  exercises: '[]',
  originalExercises: '[]',
};
```

### 3.3 Many Exercises PlanDay (>3 for collapse threshold)

```typescript
// 5 exercises — triggers shouldCollapse logic (COLLAPSE_THRESHOLD = 3)
const MOCK_MANY_EXERCISES: SelectedExercise[] = [
  /* ... 5 exercises ... */
];

const MOCK_MANY_EX_PLAN_DAY: TrainingPlanDay = {
  ...MOCK_PLAN_DAY,
  id: 'day-thu-1',
  dayOfWeek: 4,
  exercises: JSON.stringify(MOCK_MANY_EXERCISES),
};
```

### 3.4 Cardio PlanDay

```typescript
const MOCK_CARDIO_PLAN_DAY: TrainingPlanDay = {
  ...MOCK_PLAN_DAY,
  id: 'day-fri-1',
  dayOfWeek: 5,
  workoutType: 'Cardio',
  muscleGroups: '',
  exercises: '[]',
};
```

---

## 4. Test Scenarios

### TS-01: Collapsed State (Default)

**Objective**: Verify collapsed accordion shows only header row with correct content.

| TC ID     | Test Case                                  | Pre-conditions                                             | Steps            | Expected Result                                            | Priority |
| --------- | ------------------------------------------ | ---------------------------------------------------------- | ---------------- | ---------------------------------------------------------- | -------- |
| TC_PDA_01 | Collapsed header shows day label           | `isExpanded=false`, `dayOfWeek=2`                          | Render component | Day label "T2" visible in header                           | P0       |
| TC_PDA_02 | Collapsed header shows workout type        | `isExpanded=false`, `workoutType='Chest'`                  | Render component | Translated workout type text visible                       | P0       |
| TC_PDA_03 | Collapsed header shows exercise count      | `isExpanded=false`, 2 exercises                            | Render component | Text "2 bài tập" visible                                   | P0       |
| TC_PDA_04 | Collapsed header shows muscle groups       | `isExpanded=false`, `muscleGroups='["chest","shoulders"]'` | Render component | "Ngực, Vai" text visible                                   | P1       |
| TC_PDA_05 | Collapsed hides exercise list              | `isExpanded=false`                                         | Render component | No exercise names (e.g., "Đẩy ngực ngang") in DOM          | P0       |
| TC_PDA_06 | Collapsed hides action buttons             | `isExpanded=false`                                         | Render component | "Bắt đầu tập" and edit button NOT in DOM                   | P0       |
| TC_PDA_07 | Collapsed shows chevron down (not rotated) | `isExpanded=false`                                         | Render component | ChevronDown icon present, does NOT have `rotate-180` class | P1       |
| TC_PDA_08 | Collapsed header has `aria-expanded=false` | `isExpanded=false`                                         | Render component | Header button has `aria-expanded="false"`                  | P1       |

### TS-02: Expanded State

**Objective**: Verify expanded accordion shows exercise list and action buttons.

| TC ID     | Test Case                                                | Pre-conditions                   | Steps            | Expected Result                                                                        | Priority |
| --------- | -------------------------------------------------------- | -------------------------------- | ---------------- | -------------------------------------------------------------------------------------- | -------- |
| TC_PDA_09 | Expanded shows exercise list                             | `isExpanded=true`, 2 exercises   | Render component | Both exercise names visible: "Đẩy ngực ngang", "Đẩy ngực dốc tạ tay"                   | P0       |
| TC_PDA_10 | Expanded shows sets × reps for each exercise             | `isExpanded=true`, 2 exercises   | Render component | "4 hiệp × 8-12 lần" and "3 hiệp × 10-15 lần" visible                                   | P0       |
| TC_PDA_11 | Expanded shows "Bắt đầu tập" button                      | `isExpanded=true`                | Render component | Button with text "Bắt đầu tập" visible                                                 | P0       |
| TC_PDA_12 | Expanded shows edit exercises button                     | `isExpanded=true`                | Render component | Button with `aria-label="Chỉnh sửa bài tập"` visible                                   | P0       |
| TC_PDA_13 | Expanded chevron rotated 180°                            | `isExpanded=true`                | Render component | ChevronDown icon has `rotate-180` class                                                | P1       |
| TC_PDA_14 | Expanded header has `aria-expanded=true`                 | `isExpanded=true`                | Render component | Header button has `aria-expanded="true"`                                               | P1       |
| TC_PDA_15 | Expanded content has matching `id` for `aria-controls`   | `isExpanded=true`, `dayOfWeek=2` | Render component | Header has `aria-controls="plan-day-content-2"`, content has `id="plan-day-content-2"` | P1       |
| TC_PDA_16 | Expanded shows workout stats (exercise count + duration) | `isExpanded=true`, non-cardio    | Render component | Exercise count and estimated duration visible                                          | P2       |

### TS-03: Toggle Interaction

**Objective**: Verify clicking header calls `onToggle` callback.

| TC ID     | Test Case                                  | Pre-conditions     | Steps               | Expected Result               | Priority |
| --------- | ------------------------------------------ | ------------------ | ------------------- | ----------------------------- | -------- |
| TC_PDA_17 | Click header calls onToggle                | `isExpanded=false` | Click header button | `onToggle` called once        | P0       |
| TC_PDA_18 | Click expanded header calls onToggle       | `isExpanded=true`  | Click header button | `onToggle` called once        | P0       |
| TC_PDA_19 | Click "Bắt đầu tập" calls onStartWorkout   | `isExpanded=true`  | Click "Bắt đầu tập" | `onStartWorkout` called once  | P0       |
| TC_PDA_20 | Click edit button calls onEditExercises    | `isExpanded=true`  | Click edit button   | `onEditExercises` called once | P0       |
| TC_PDA_21 | Click "Bắt đầu tập" does NOT call onToggle | `isExpanded=true`  | Click "Bắt đầu tập" | `onToggle` NOT called         | P1       |

### TS-04: Completed State

**Objective**: Verify completed workout shows green check badge overlay.

| TC ID     | Test Case                                 | Pre-conditions                         | Steps            | Expected Result                                                        | Priority |
| --------- | ----------------------------------------- | -------------------------------------- | ---------------- | ---------------------------------------------------------------------- | -------- |
| TC_PDA_22 | Completed shows check badge               | `isCompleted=true`, `isExpanded=false` | Render component | Element with "Hoàn thành" text visible                                 | P0       |
| TC_PDA_23 | Completed badge has success styling       | `isCompleted=true`                     | Render component | Badge contains success color classes (`bg-success/10`, `text-success`) | P1       |
| TC_PDA_24 | Completed badge visible in expanded state | `isCompleted=true`, `isExpanded=true`  | Render component | "Hoàn thành" badge visible alongside exercise list                     | P1       |
| TC_PDA_25 | Not completed hides check badge           | `isCompleted=false`                    | Render component | "Hoàn thành" text NOT in DOM                                           | P0       |

### TS-05: Empty Exercises State

**Objective**: Verify 0 exercises shows compact EmptyState with "Chưa có bài tập" and CTA.

| TC ID     | Test Case                                                 | Pre-conditions                       | Steps                | Expected Result                                                            | Priority |
| --------- | --------------------------------------------------------- | ------------------------------------ | -------------------- | -------------------------------------------------------------------------- | -------- |
| TC_PDA_26 | Empty exercises shows "Chưa có bài tập" message           | `isExpanded=true`, `exercises='[]'`  | Render component     | Text "Chưa có bài tập" visible (from EmptyState compact variant or inline) | P0       |
| TC_PDA_27 | Empty exercises shows "Thêm bài tập" CTA                  | `isExpanded=true`, `exercises='[]'`  | Render component     | "Thêm bài tập" button/link visible                                         | P0       |
| TC_PDA_28 | Empty exercises CTA triggers onEditExercises              | `isExpanded=true`, `exercises='[]'`  | Click "Thêm bài tập" | `onEditExercises` called once                                              | P0       |
| TC_PDA_29 | Empty exercises hides action buttons                      | `isExpanded=true`, `exercises='[]'`  | Render component     | "Bắt đầu tập" button NOT visible (cannot start with 0 exercises)           | P1       |
| TC_PDA_30 | Empty exercises in collapsed state shows exercise count 0 | `isExpanded=false`, `exercises='[]'` | Render component     | No exercise count displayed OR shows appropriate empty indicator           | P2       |

### TS-06: Rest Day (No PlanDay)

**Objective**: Verify rest day rendering when no planDay exists for this dayOfWeek.

> **Note**: Per current source (lines 975-1008), expanded rest days show tips + "Thêm buổi tập" CTA. The component may receive a `planDay` with `workoutType='rest'` or handle rest day via a separate prop. Dev should clarify — but tests should cover:

| TC ID     | Test Case                            | Pre-conditions                   | Steps            | Expected Result          | Priority |
| --------- | ------------------------------------ | -------------------------------- | ---------------- | ------------------------ | -------- |
| TC_PDA_31 | Rest day collapsed shows "Ngày nghỉ" | Rest day planDay (if applicable) | Render collapsed | "Ngày nghỉ" text visible | P1       |
| TC_PDA_32 | Rest day expanded shows tips         | Rest day, `isExpanded=true`      | Render expanded  | Rest day tips visible    | P2       |

### TS-07: Accessibility & Touch Targets

**Objective**: Verify WCAG compliance and mobile touch UX.

| TC ID     | Test Case                                      | Pre-conditions    | Steps            | Expected Result                                                             | Priority |
| --------- | ---------------------------------------------- | ----------------- | ---------------- | --------------------------------------------------------------------------- | -------- |
| TC_PDA_33 | Header button has `active:scale-[0.98]`        | Any state         | Render component | Header button's className includes `active:scale-[0.98]`                    | P1       |
| TC_PDA_34 | Header button has `focus-visible:ring-2`       | Any state         | Render component | Header button's className includes `focus-visible:ring-2`                   | P1       |
| TC_PDA_35 | Header button has min-height ≥44px             | Any state         | Render component | Header button className includes `min-h-[44px]` or `min-h-11` or `min-h-12` | P1       |
| TC_PDA_36 | Chevron has `transition-transform`             | Any state         | Render component | Chevron element's className includes `transition-transform`                 | P1       |
| TC_PDA_37 | Start workout button has adequate touch target | `isExpanded=true` | Render component | Button className includes `min-h-11` or equivalent (≥44dp)                  | P1       |
| TC_PDA_38 | Edit button has adequate touch target          | `isExpanded=true` | Render component | Edit button className includes min-height class (≥44dp)                     | P1       |
| TC_PDA_39 | Component has correct `data-testid`            | `dayOfWeek=2`     | Render component | Wrapper has `data-testid="plan-day-2"`                                      | P0       |
| TC_PDA_40 | motion-reduce removes scale transform          | Any state         | Render component | Header button className includes `motion-reduce:transform-none`             | P2       |

### TS-08: Exercise Collapse/Expand (>3 exercises)

**Objective**: Verify exercise list truncation when >3 exercises.

| TC ID     | Test Case                                 | Pre-conditions                                         | Steps                  | Expected Result                         | Priority |
| --------- | ----------------------------------------- | ------------------------------------------------------ | ---------------------- | --------------------------------------- | -------- |
| TC_PDA_41 | >3 exercises shows only first 3 initially | `isExpanded=true`, 5 exercises                         | Render component       | Only 3 exercise names visible, 2 hidden | P1       |
| TC_PDA_42 | >3 exercises shows "more" button          | `isExpanded=true`, 5 exercises                         | Render component       | Text "+2 bài tập nữa" visible           | P1       |
| TC_PDA_43 | Click "more" shows all exercises          | `isExpanded=true`, 5 exercises                         | Click "+2 bài tập nữa" | All 5 exercise names visible            | P1       |
| TC_PDA_44 | After expand, shows "Thu gọn"             | `isExpanded=true`, 5 exercises, exercise list expanded | After clicking more    | "Thu gọn" text visible                  | P1       |
| TC_PDA_45 | ≤3 exercises does NOT show more button    | `isExpanded=true`, 2 exercises                         | Render component       | No "bài tập nữa" or "Thu gọn" text      | P2       |

### TS-09: Edge Cases

| TC ID     | Test Case                            | Pre-conditions                        | Steps            | Expected Result                            | Priority |
| --------- | ------------------------------------ | ------------------------------------- | ---------------- | ------------------------------------------ | -------- |
| TC_PDA_46 | Null/undefined exercises handled     | `planDay.exercises = undefined`       | Render collapsed | No crash, shows 0 exercises or empty state | P1       |
| TC_PDA_47 | Invalid JSON exercises handled       | `planDay.exercises = 'invalid'`       | Render           | No crash, graceful fallback (empty array)  | P1       |
| TC_PDA_48 | All 7 day positions render correctly | `dayOfWeek` = 1-7                     | Render each      | Day labels T2-CN displayed correctly       | P2       |
| TC_PDA_49 | Long workout type name truncates     | `workoutType='Upper Body Strength 2'` | Render collapsed | Text truncated with ellipsis, no overflow  | P2       |
| TC_PDA_50 | Cardio day shows cardio stats        | `workoutType='Cardio'`                | Render expanded  | "Cardio" text instead of exercise count    | P2       |

---

## 5. Test Implementation Notes

### 5.1 Required Mocks

```typescript
// i18n — initialized via src/__tests__/setup.ts (loads vi.json)

// translateWorkoutType — may need mock if complex
vi.mock('../utils/translateWorkoutType', () => ({
  translateWorkoutType: (_t: unknown, type: string) => type,
}));

// estimateDuration — mock for predictable values
vi.mock('../utils/durationEstimator', () => ({
  estimateDuration: () => 45,
}));

// EmptyState — render as-is (no mock needed, it's a shared component)
```

### 5.2 Render Helper

```typescript
function renderAccordion(overrides: Partial<PlanDayAccordionProps> = {}) {
  const defaultProps: PlanDayAccordionProps = {
    planDay: MOCK_PLAN_DAY,
    dayOfWeek: 2,
    isExpanded: false,
    isCompleted: false,
    onToggle: vi.fn(),
    onStartWorkout: vi.fn(),
    onEditExercises: vi.fn(),
  };
  return render(<PlanDayAccordion {...defaultProps} {...overrides} />);
}
```

### 5.3 Key Assertions Patterns

```typescript
// Collapsed state — content hidden
expect(screen.queryByText('Đẩy ngực ngang')).not.toBeInTheDocument();

// Expanded state — content visible
expect(screen.getByText('Đẩy ngực ngang')).toBeInTheDocument();

// Chevron rotation
const chevron = screen.getByTestId('plan-day-2').querySelector('[aria-hidden="true"]');
expect(chevron).toHaveClass('rotate-180'); // expanded
expect(chevron).not.toHaveClass('rotate-180'); // collapsed

// aria-expanded
expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument();
expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();

// Callback invocation
await userEvent.click(header);
expect(onToggle).toHaveBeenCalledTimes(1);

// Completed badge
expect(screen.getByText('Hoàn thành')).toBeInTheDocument();

// Empty state
expect(screen.getByText(/Chưa có bài tập/)).toBeInTheDocument();
expect(screen.getByText('Thêm bài tập')).toBeInTheDocument();
```

### 5.4 Test Organization (describe blocks)

```
describe('PlanDayAccordion')
├── describe('Collapsed State')              → TC_PDA_01-08
├── describe('Expanded State')               → TC_PDA_09-16
├── describe('Toggle Interaction')            → TC_PDA_17-21
├── describe('Completed State')              → TC_PDA_22-25
├── describe('Empty Exercises')              → TC_PDA_26-30
├── describe('Accessibility & Touch')        → TC_PDA_33-40
├── describe('Exercise Collapse (>3)')       → TC_PDA_41-45
└── describe('Edge Cases')                   → TC_PDA_46-50
```

---

## 6. Coverage Requirements

| Metric     | Target | Rationale                                                                                   |
| ---------- | ------ | ------------------------------------------------------------------------------------------- |
| Statements | 100%   | AC #7                                                                                       |
| Branches   | 100%   | All conditional paths: collapsed/expanded, completed/not, empty/has-exercises, >3 exercises |
| Functions  | 100%   | All callbacks: onToggle, onStartWorkout, onEditExercises                                    |
| Lines      | 100%   | No dead code in ≤250 LOC component                                                          |

### Critical Branches to Cover

1. `isExpanded === false` → collapsed header only
2. `isExpanded === true` + exercises > 0 → full exercise list + buttons
3. `isExpanded === true` + exercises === 0 → EmptyState compact
4. `isCompleted === true` → green badge visible
5. `isCompleted === false` → no badge
6. exercises.length > 3 → collapse/expand toggle
7. exercises.length ≤ 3 → no toggle
8. `planDay.muscleGroups` present vs absent
9. Cardio workoutType → different stats display

---

## 7. Traceability Matrix

| AC # | Acceptance Criteria                                         | Test Cases              | Status |
| ---- | ----------------------------------------------------------- | ----------------------- | ------ |
| AC-1 | Collapsed: header with day name, workout type, chevron down | TC_PDA_01-08            | ⬜     |
| AC-2 | Expanded: exercise list + action buttons, chevron rotates   | TC_PDA_09-16            | ⬜     |
| AC-3 | Completed: green check badge overlay                        | TC_PDA_22-25            | ⬜     |
| AC-4 | Empty exercises: inline "Chưa có bài tập" + "Thêm" CTA      | TC_PDA_26-30            | ⬜     |
| AC-5 | Header: active:scale-[0.98], focus-visible:ring-2           | TC_PDA_33-34, TC_PDA_40 | ⬜     |
| AC-6 | Chevron: transition-transform                               | TC_PDA_36               | ⬜     |
| AC-7 | 100% test coverage                                          | All 50 TCs              | ⬜     |
| AC-8 | ≤250 LOC                                                    | (Dev verification)      | ⬜     |

| BR #  | Business Rule                    | Test Cases                                   | Status |
| ----- | -------------------------------- | -------------------------------------------- | ------ |
| BR-35 | Long-press context menu (future) | N/A (future enhancement, verify no blocking) | ⬜     |
| BR-37 | Touch targets ≥48dp              | TC_PDA_35, TC_PDA_37, TC_PDA_38              | ⬜     |

---

## 8. QA Focus Areas (from Tech Leader)

| Focus Area                  | Test Cases                      | Verification Method                                        |
| --------------------------- | ------------------------------- | ---------------------------------------------------------- |
| Expand/collapse animation   | TC_PDA_07, TC_PDA_13, TC_PDA_36 | Class assertion: `rotate-180`, `transition-transform`      |
| Completed overlay rendering | TC_PDA_22-25                    | Text + class assertion: "Hoàn thành", success colors       |
| Empty exercises state       | TC_PDA_26-30                    | EmptyState compact variant rendered, CTA triggers callback |

---

## 9. Risk Notes

1. **Props interface may differ slightly from Design §3.4**: If Dev adds/removes props (e.g., `sessions`, `onContextMenu`, `dayLabel`), test plan must be updated to match actual interface.
2. **Rest day handling**: Design §3.4 focuses on workout days. If PlanDayAccordion also handles rest days (no planDay), TC_PDA_31-32 need to be expanded. If rest days are handled by a separate component, these TCs can be removed.
3. **Exercise collapse threshold**: Current source uses `COLLAPSE_THRESHOLD = 3`. If Dev changes this, TC_PDA_41-45 thresholds must match.
4. **translateWorkoutType dependency**: If Dev imports this utility, mock may be needed for predictable test output. If Dev inlines the translation, mock is unnecessary.
5. **SessionTabs integration**: Current source renders SessionTabs in expanded state. If PlanDayAccordion includes SessionTabs, additional TCs for multi-session rendering will be needed.

---

**TEST_PLAN_READY**
