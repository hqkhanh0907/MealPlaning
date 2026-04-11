# Test Plan — W1-02: TodayRestCard Extraction

| Field           | Value                                                    |
| --------------- | -------------------------------------------------------- |
| **Task**        | TASK-W1-02 — Extract TodayRestCard from TrainingPlanView |
| **Type**        | Unit Test (Vitest + React Testing Library)               |
| **Target File** | `src/__tests__/TodayRestCard.test.tsx`                   |
| **SUT**         | `src/features/fitness/components/TodayRestCard.tsx`      |
| **Author**      | QA Engineer (TDD-First)                                  |
| **Status**      | TEST_PLAN_READY                                          |

---

## 1. Source Analysis

### 1.1 Extracted Code (TrainingPlanView.tsx lines 768–836)

The rest day card renders when `isToday && isRestDay` and includes:

| Element                 | testid / selector      | i18n key                        | Notes                                          |
| ----------------------- | ---------------------- | ------------------------------- | ---------------------------------------------- |
| Rest day heading        | —                      | `fitness.plan.restDay`          | "Ngày nghỉ" with Moon icon                     |
| Tip 1                   | —                      | `fitness.plan.restDayTip1`      | "Ngủ đủ 7-9 giờ..."                            |
| Tip 2                   | —                      | `fitness.plan.restDayTip2`      | "Uống đủ nước..."                              |
| Tip 3                   | —                      | `fitness.plan.restDayTip3`      | "Có thể đi bộ nhẹ..."                          |
| "Thêm buổi tập" btn     | `rest-add-workout-btn` | `fitness.plan.convertToWorkout` | Calls `onConvertToWorkout`                     |
| Tomorrow preview        | `tomorrow-preview`     | `fitness.plan.tomorrow`         | Conditional on `tomorrowPlanDay` being defined |
| Quick actions container | `quick-actions`        | —                               | flex container with 3 buttons                  |
| "Ghi cân nặng" btn      | `quick-log-weight`     | `fitness.plan.logWeight`        | Scrolls to weight input                        |
| "Ghi cardio nhẹ" btn    | `quick-log-cardio`     | `fitness.plan.logLightCardio`   | Calls `onLogCardio`                            |

### 1.2 Expected Props Interface

```typescript
interface TodayRestCardProps {
  tomorrowPlanDay?: TrainingPlanDay; // undefined = no tomorrow preview
  tomorrowExerciseCount: number; // parsed from tomorrowPlanDay.exercises
  onConvertToWorkout: () => void; // "Thêm buổi tập" button
  onLogWeight: () => void; // "Ghi cân nặng" button
  onLogCardio: () => void; // "Ghi cardio nhẹ" button
}
```

### 1.3 Dependencies

- `TrainingPlanDay` from `../features/fitness/types`
- `translateWorkoutType` from `../features/fitness/utils/translateWorkoutType`
- i18n keys under `fitness.plan.*`
- Lucide icons: `Moon`, `Plus`, `ClipboardList`

---

## 2. Test Scenarios

### TS-01: Happy Path — Rest Day with Tomorrow Preview

**Objective**: Verify complete rendering when all data is provided.

| TC ID    | Description                                        | Pre-conditions                                                                                             | Steps                                                       | Expected Result                                                                                                              |
| -------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| TC_RC_01 | Renders rest day heading with Moon icon            | Render `<TodayRestCard>` with full props including `tomorrowPlanDay`                                       | 1. Check heading text                                       | Heading contains "Ngày nghỉ" (i18n: `fitness.plan.restDay`). Moon icon present (via `aria-hidden`).                          |
| TC_RC_02 | Renders 3 rest day tips                            | Same as TC_RC_01                                                                                           | 1. Query all `<li>` within the tips list                    | 3 list items rendered with texts matching `restDayTip1`, `restDayTip2`, `restDayTip3`.                                       |
| TC_RC_03 | Renders tomorrow preview with workout type & count | `tomorrowPlanDay = { workoutType: 'Upper Body', exercises: JSON(2 exercises) }`, `tomorrowExerciseCount=2` | 1. Find `tomorrow-preview` testid                           | Element visible. Contains translated workout type + "2" + `fitness.plan.exercises`.                                          |
| TC_RC_04 | Renders "Thêm buổi tập" button                     | Same as TC_RC_01                                                                                           | 1. Find `rest-add-workout-btn`                              | Button rendered with text "Thêm buổi tập" (i18n: `fitness.plan.convertToWorkout`).                                           |
| TC_RC_05 | Renders quick actions container with 3 buttons     | Same as TC_RC_01                                                                                           | 1. Find `quick-actions` container<br>2. Count child buttons | Container has 3 buttons: `quick-log-weight`, `quick-log-cardio`, and `rest-add-workout-btn` (outside container but in card). |

---

### TS-02: No Tomorrow — `tomorrowPlanDay` is undefined

**Objective**: Verify graceful handling when no tomorrow data exists.

| TC ID    | Description                                     | Pre-conditions                                                         | Steps                                         | Expected Result                                                                       |
| -------- | ----------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| TC_RC_06 | Does NOT render tomorrow preview when undefined | Render with `tomorrowPlanDay={undefined}`, `tomorrowExerciseCount={0}` | 1. Query `tomorrow-preview` testid            | Element NOT in document (`queryByTestId('tomorrow-preview')` returns null).           |
| TC_RC_07 | Rest day heading and tips still render          | Same as TC_RC_06                                                       | 1. Check heading<br>2. Check tips list        | Heading "Ngày nghỉ" and 3 tips still present. Card is fully functional minus preview. |
| TC_RC_08 | Quick actions still render and are clickable    | Same as TC_RC_06                                                       | 1. Find quick action buttons<br>2. Click each | All 3 action buttons present and fire callbacks.                                      |

---

### TS-03: Quick Action Button Callbacks

**Objective**: Verify all 3 action buttons invoke correct callbacks.

| TC ID    | Description                                       | Pre-conditions                             | Steps                               | Expected Result                                        |
| -------- | ------------------------------------------------- | ------------------------------------------ | ----------------------------------- | ------------------------------------------------------ |
| TC_RC_09 | "Thêm buổi tập" fires `onConvertToWorkout`        | Render with `onConvertToWorkout = vi.fn()` | 1. Click `rest-add-workout-btn`     | `onConvertToWorkout` called exactly 1 time.            |
| TC_RC_10 | "Ghi cân nặng" fires `onLogWeight`                | Render with `onLogWeight = vi.fn()`        | 1. Click `quick-log-weight`         | `onLogWeight` called exactly 1 time.                   |
| TC_RC_11 | "Ghi cardio nhẹ" fires `onLogCardio`              | Render with `onLogCardio = vi.fn()`        | 1. Click `quick-log-cardio`         | `onLogCardio` called exactly 1 time.                   |
| TC_RC_12 | Multiple clicks on same button fire correct count | Render with all callbacks as `vi.fn()`     | 1. Click `quick-log-weight` 3 times | `onLogWeight` called exactly 3 times. Others: 0 times. |

---

### TS-04: Touch Targets (BR-37: ≥48dp)

**Objective**: Verify all interactive elements meet minimum 48dp (min-h-12 = 48px) touch target.

| TC ID    | Description                                    | Pre-conditions       | Steps                                                       | Expected Result                                                                          |
| -------- | ---------------------------------------------- | -------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| TC_RC_13 | "Thêm buổi tập" button has min-h-[44px] class  | Render TodayRestCard | 1. Get `rest-add-workout-btn` element<br>2. Check className | Button has class containing `min-h-` (≥44px from source, acceptance says min-h-12=48px). |
| TC_RC_14 | "Ghi cân nặng" button has min-h-[44px] class   | Same                 | 1. Get `quick-log-weight` element<br>2. Check className     | Button has class containing `min-h-`.                                                    |
| TC_RC_15 | "Ghi cardio nhẹ" button has min-h-[44px] class | Same                 | 1. Get `quick-log-cardio` element<br>2. Check className     | Button has class containing `min-h-`.                                                    |

> **Note for Dev**: Current source uses `min-h-[44px]`. Acceptance criteria specifies `min-h-12` (48px). Dev MUST upgrade to `min-h-12` during extraction. Tests should assert `min-h-12` (the TARGET, not the legacy value).

---

### TS-05: Accessibility & Semantics

**Objective**: Verify accessible markup.

| TC ID    | Description                            | Pre-conditions       | Steps                                                               | Expected Result                                              |
| -------- | -------------------------------------- | -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| TC_RC_16 | All buttons have `type="button"`       | Render TodayRestCard | 1. Query all `button` elements in card<br>2. Check `type` attribute | Every button has `type="button"` (prevents form submission). |
| TC_RC_17 | Icons have `aria-hidden="true"`        | Render TodayRestCard | 1. Query SVG elements (Moon, Plus, ClipboardList icons)             | All icon SVGs have `aria-hidden="true"`.                     |
| TC_RC_18 | Card has `data-testid="rest-day-card"` | Render TodayRestCard | 1. Query `rest-day-card`                                            | Root card container found.                                   |

---

## 3. Test Data Fixtures

### 3.1 TrainingPlanDay Factory

```typescript
const makeTomorrowPlanDay = (overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay => ({
  id: 'day-thu',
  planId: 'plan-1',
  dayOfWeek: 4,
  sessionOrder: 1,
  workoutType: 'Upper Body A',
  muscleGroups: 'chest, shoulders, triceps',
  exercises: JSON.stringify([
    {
      exercise: {
        id: 'bench',
        nameVi: 'Đẩy ngang',
        muscleGroup: 'chest',
        secondaryMuscles: ['shoulders'],
        category: 'compound',
        equipment: ['barbell'],
        contraindicated: [],
        exerciseType: 'strength',
        defaultRepsMin: 6,
        defaultRepsMax: 8,
        isCustom: false,
        updatedAt: '2025-01-01',
      },
      sets: 4,
      repsMin: 6,
      repsMax: 8,
      restSeconds: 180,
    },
    {
      exercise: {
        id: 'ohp',
        nameVi: 'Đẩy vai',
        muscleGroup: 'shoulders',
        secondaryMuscles: ['triceps'],
        category: 'compound',
        equipment: ['barbell'],
        contraindicated: [],
        exerciseType: 'strength',
        defaultRepsMin: 8,
        defaultRepsMax: 10,
        isCustom: false,
        updatedAt: '2025-01-01',
      },
      sets: 3,
      repsMin: 8,
      repsMax: 10,
      restSeconds: 120,
    },
  ]),
  isUserAssigned: false,
  originalDayOfWeek: 4,
  ...overrides,
});
```

### 3.2 Default Props

```typescript
const defaultProps: TodayRestCardProps = {
  tomorrowPlanDay: makeTomorrowPlanDay(),
  tomorrowExerciseCount: 2,
  onConvertToWorkout: vi.fn(),
  onLogWeight: vi.fn(),
  onLogCardio: vi.fn(),
};
```

### 3.3 "No tomorrow" Props

```typescript
const noTomorrowProps: TodayRestCardProps = {
  tomorrowPlanDay: undefined,
  tomorrowExerciseCount: 0,
  onConvertToWorkout: vi.fn(),
  onLogWeight: vi.fn(),
  onLogCardio: vi.fn(),
};
```

---

## 4. Test Structure (describe blocks)

```
describe('TodayRestCard')
  ├── describe('rendering — with tomorrow preview')
  │   ├── it('renders rest day heading with Moon icon')              // TC_RC_01
  │   ├── it('renders 3 rest day tips')                              // TC_RC_02
  │   ├── it('renders tomorrow preview with workout type and count') // TC_RC_03
  │   ├── it('renders convert-to-workout button')                    // TC_RC_04
  │   └── it('renders quick actions container with 2 quick buttons') // TC_RC_05
  │
  ├── describe('rendering — without tomorrow preview')
  │   ├── it('does NOT render tomorrow-preview element')             // TC_RC_06
  │   ├── it('still renders heading and tips')                       // TC_RC_07
  │   └── it('still renders quick action buttons')                   // TC_RC_08
  │
  ├── describe('button callbacks')
  │   ├── it('onConvertToWorkout fires on convert button click')     // TC_RC_09
  │   ├── it('onLogWeight fires on weight button click')             // TC_RC_10
  │   ├── it('onLogCardio fires on cardio button click')             // TC_RC_11
  │   └── it('repeated clicks increment call count correctly')       // TC_RC_12
  │
  ├── describe('touch targets (BR-37)')
  │   ├── it('convert button has min-h-12 class')                    // TC_RC_13
  │   ├── it('weight button has min-h-12 class')                     // TC_RC_14
  │   └── it('cardio button has min-h-12 class')                     // TC_RC_15
  │
  └── describe('accessibility')
      ├── it('all buttons have type="button"')                       // TC_RC_16
      ├── it('decorative icons have aria-hidden')                    // TC_RC_17
      └── it('card has data-testid="rest-day-card"')                 // TC_RC_18
```

---

## 5. Coverage Strategy

| Metric     | Target | How                                                                           |
| ---------- | ------ | ----------------------------------------------------------------------------- |
| Statements | 100%   | Every JSX branch hit: with/without `tomorrowPlanDay`                          |
| Branches   | 100%   | Key branch: `tomorrowPlanDay && (...)` — TC_RC_03 (truthy) + TC_RC_06 (falsy) |
| Functions  | 100%   | 3 callback props each triggered                                               |
| Lines      | 100%   | Component ≤150 LOC, all paths exercised                                       |

### Critical Branch: `{tomorrowPlanDay && (<p data-testid="tomorrow-preview">...)}`

- **Truthy path**: TC_RC_03 renders with `tomorrowPlanDay` defined → preview visible
- **Falsy path**: TC_RC_06 renders with `undefined` → preview absent

---

## 6. Mocking Strategy

| Dependency              | Mock Approach                                                             |
| ----------------------- | ------------------------------------------------------------------------- |
| `translateWorkoutType`  | Import real function — it's pure, no side effects                         |
| i18n (`useTranslation`) | Already mocked globally in `src/__tests__/setup.ts` — returns key as text |
| Lucide icons            | No mock needed — rendered as SVGs, checked via `aria-hidden`              |

No Zustand store mocking required — TodayRestCard is a **pure presentational component** receiving all data via props.

---

## 7. Edge Cases & Risks

| Risk                                                                     | Mitigation                                                                                            |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Dev uses different testids than source                                   | Test plan documents expected testids explicitly. Dev must match.                                      |
| Touch target min-h differs (44px vs 48px)                                | Tests assert `min-h-12` (48px). Dev must upgrade from legacy `min-h-[44px]`.                          |
| `tomorrowExerciseCount` prop might be removed if Dev computes internally | If Dev parses exercises inside component, TC_RC_03 still verifies output text. Adjust prop if needed. |
| `translateWorkoutType` not imported correctly                            | TC_RC_03 verifies translated workout type text appears.                                               |
| Card wrapper testid renamed                                              | TC_RC_18 explicitly tests `rest-day-card`. Dev must preserve.                                         |

---

## 8. i18n Keys Required

All keys MUST exist in `src/locales/vi.json` under `fitness.plan.*`:

| Key                             | Expected Value (vi)                 | Used In     |
| ------------------------------- | ----------------------------------- | ----------- |
| `fitness.plan.restDay`          | "Ngày nghỉ"                         | TC_RC_01    |
| `fitness.plan.restDayTip1`      | "Ngủ đủ 7-9 giờ để phục hồi cơ bắp" | TC_RC_02    |
| `fitness.plan.restDayTip2`      | "Uống đủ nước và ăn giàu protein"   | TC_RC_02    |
| `fitness.plan.restDayTip3`      | "Có thể đi bộ nhẹ hoặc kéo giãn"    | TC_RC_02    |
| `fitness.plan.convertToWorkout` | "Thêm buổi tập"                     | TC_RC_04,09 |
| `fitness.plan.tomorrow`         | "Ngày mai"                          | TC_RC_03    |
| `fitness.plan.exercises`        | "bài"                               | TC_RC_03    |
| `fitness.plan.logWeight`        | "Ghi cân nặng"                      | TC_RC_10    |
| `fitness.plan.logLightCardio`   | "Ghi cardio nhẹ"                    | TC_RC_11    |

---

## 9. Traceability Matrix

| Acceptance Criteria                              | Test Cases                      |
| ------------------------------------------------ | ------------------------------- |
| AC-1: Renders rest day message, preview, buttons | TC_RC_01–05                     |
| AC-2: Props interface matches Design spec        | TC_RC_01–12 (all use props)     |
| AC-3: tomorrowPlanDay undefined → no preview     | TC_RC_06–08                     |
| AC-4: All buttons have min-h-12 touch target     | TC_RC_13–15                     |
| AC-5: 100% test coverage                         | Coverage Strategy §5            |
| AC-6: ≤150 LOC                                   | N/A (code review, not testable) |
| BR-37: Touch targets ≥48dp                       | TC_RC_13–15                     |

---

**Total: 18 Test Cases across 5 scenarios.**

**Status: TEST_PLAN_READY**
