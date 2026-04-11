# Test Plan: W5-05 — Workout Draft Auto-Recovery + i18n Finalization

| Field             | Value                                                          |
| ----------------- | -------------------------------------------------------------- |
| **Task**          | TASK-W5-05                                                     |
| **Author**        | QA Engineer (Phase 1 — TDD-First)                              |
| **Date**          | 2025-07-17                                                     |
| **Status**        | DRAFT — Awaiting Dev implementation                            |
| **Coverage Goal** | 100% statements/branches/functions for new code                |
| **Framework**     | Vitest 3.x + React Testing Library + @testing-library/jest-dom |

---

## 1. Scope

### 1.1 In Scope

| Area                   | Files                                               |
| ---------------------- | --------------------------------------------------- |
| Draft auto-recovery UI | `src/features/fitness/components/FitnessTab.tsx`    |
| Test file              | `src/__tests__/FitnessTab.test.tsx`                 |
| i18n keys              | `src/locales/vi.json` (fitness.draft.\*, §8.6 keys) |

### 1.2 Out of Scope

- `fitnessStore.ts` draft logic (`loadWorkoutDraft`, `clearWorkoutDraft`, `setWorkoutDraft`) — already implemented, tested separately
- `WorkoutLogger.tsx` draft consumption — pre-existing, not owned by this task
- Non-fitness i18n keys (common.\* from §8.6 handled only if blocking fitness tests)

### 1.3 Dependencies

| Dependency                     | Status     | Notes                                                                            |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------- |
| `useFitnessStore.workoutDraft` | ✅ Exists  | Nullable object: `{ exercises, exerciseMetas, sets, elapsedSeconds, planDayId }` |
| `loadWorkoutDraft()`           | ✅ Exists  | Async, reads from `workout_drafts` SQLite table                                  |
| `clearWorkoutDraft()`          | ✅ Exists  | Sync state + async DB delete                                                     |
| `pushPage()` (navigation)      | ✅ Exists  | Opens WorkoutLogger via PageStackOverlay                                         |
| `fitness.draft.*` i18n keys    | ❌ Missing | Must be added to vi.json by Dev                                                  |

---

## 2. Test Environment

| Component | Version / Config                                        |
| --------- | ------------------------------------------------------- |
| Runner    | Vitest 3.x (via `npm run test`)                         |
| DOM       | jsdom (Vitest default)                                  |
| Rendering | React Testing Library (`render`, `screen`, `fireEvent`) |
| Mocking   | `vi.mock()` + `vi.hoisted()` (existing pattern)         |
| i18n      | Inline translation map in test mock (existing pattern)  |
| Store     | Manual Zustand selector mock (existing pattern)         |

---

## 3. Test Data

### 3.1 Valid Draft Object

```typescript
const VALID_DRAFT = {
  exercises: [
    { id: 'ex-1', nameVi: 'Bench Press', muscleGroup: 'chest', category: 'compound', equipment: 'barbell' },
    { id: 'ex-2', nameVi: 'Squat', muscleGroup: 'legs', category: 'compound', equipment: 'barbell' },
  ],
  exerciseMetas: [
    {
      exercise: { id: 'ex-1', nameVi: 'Bench Press', muscleGroup: 'chest', category: 'compound', equipment: 'barbell' },
      plannedSets: 3,
      repsMin: 8,
      repsMax: 12,
      restSeconds: 90,
    },
    {
      exercise: { id: 'ex-2', nameVi: 'Squat', muscleGroup: 'legs', category: 'compound', equipment: 'barbell' },
      plannedSets: 4,
      repsMin: 6,
      repsMax: 10,
      restSeconds: 120,
    },
  ],
  sets: [
    { id: 'set-1', workoutId: 'w1', exerciseId: 'ex-1', setNumber: 1, reps: 10, weightKg: 60, updatedAt: '2025-07-17' },
    { id: 'set-2', workoutId: 'w1', exerciseId: 'ex-1', setNumber: 2, reps: 8, weightKg: 65, updatedAt: '2025-07-17' },
    { id: 'set-3', workoutId: 'w1', exerciseId: 'ex-2', setNumber: 1, reps: 8, weightKg: 80, updatedAt: '2025-07-17' },
  ],
  elapsedSeconds: 1200,
  planDayId: 'plan-day-1',
};
```

### 3.2 Minimal Draft (1 exercise, 0 sets)

```typescript
const MINIMAL_DRAFT = {
  exercises: [{ id: 'ex-1', nameVi: 'Bench Press', muscleGroup: 'chest', category: 'compound', equipment: 'barbell' }],
  sets: [],
  elapsedSeconds: 0,
  planDayId: undefined,
};
```

### 3.3 Draft Without PlanDayId (ad-hoc workout)

```typescript
const ADHOC_DRAFT = {
  exercises: [{ id: 'ex-1', nameVi: 'Bench Press', muscleGroup: 'chest', category: 'compound', equipment: 'barbell' }],
  sets: [
    { id: 'set-1', workoutId: 'w1', exerciseId: 'ex-1', setNumber: 1, reps: 10, weightKg: 60, updatedAt: '2025-07-17' },
  ],
  elapsedSeconds: 600,
  planDayId: undefined,
};
```

### 3.4 i18n Keys Required (§8.6 — `fitness.draft.*`)

| Key                         | Expected Vietnamese Value                    | Interpolation       |
| --------------------------- | -------------------------------------------- | ------------------- |
| `fitness.draft.resumeTitle` | `Buổi tập chưa hoàn thành`                   | None                |
| `fitness.draft.resumeDesc`  | `{{exercises}} bài tập, {{sets}} set đã ghi` | `exercises`, `sets` |
| `fitness.draft.continue`    | `Tiếp tục`                                   | None                |
| `fitness.draft.discard`     | `Hủy`                                        | None                |

---

## 4. Mock Setup Guide

### 4.1 Extending MockFitnessState

The existing `MockFitnessState` interface (line 113) must be extended:

```typescript
interface MockFitnessState {
  // ... existing fields ...
  trainingProfile: unknown;
  planStrategy: 'auto' | 'manual' | null;
  profileOutOfSync: boolean;
  profileChangedFields: string[];
  addTrainingPlan: Mock;
  addPlanDays: Mock;
  setActivePlan: Mock;
  // NEW — draft recovery
  workoutDraft: typeof VALID_DRAFT | null;
  loadWorkoutDraft: Mock;
  clearWorkoutDraft: Mock;
}
```

### 4.2 Translation Map Extension

Add to the `translations` Record in `vi.mock('react-i18next', ...)`:

```typescript
'fitness.draft.resumeTitle': 'Buổi tập chưa hoàn thành',
'fitness.draft.resumeDesc': '{{exercises}} bài tập, {{sets}} set đã ghi',
'fitness.draft.continue': 'Tiếp tục',
'fitness.draft.discard': 'Hủy',
```

**Note:** The mock `t()` function currently does NOT handle interpolation (`{{var}}`). The test mock should either:

- (A) Return raw template strings and assert against them (simpler, existing pattern), OR
- (B) Implement basic interpolation: `t(key, params)` replaces `{{var}}` with `params.var`

Recommendation: **(B)** for `fitness.draft.resumeDesc` since the displayed text includes dynamic counts that acceptance criteria implicitly validate.

### 4.3 Expected data-testid Map (Proposed)

| Element                | Proposed testid         | Notes                           |
| ---------------------- | ----------------------- | ------------------------------- |
| Draft prompt container | `draft-recovery-prompt` | Entire banner div               |
| Draft description text | `draft-recovery-desc`   | Shows "X bài tập, Y set đã ghi" |
| "Tiếp tục" button      | `draft-continue-btn`    | Opens WorkoutLogger with draft  |
| "Hủy" button           | `draft-discard-btn`     | Calls clearWorkoutDraft()       |

---

## 5. Test Scenarios

### SC_W505_01: Draft Prompt Visibility on FitnessTab Mount

**Objective:** Verify that when `workoutDraft !== null` in the store, FitnessTab renders an inline recovery prompt on the `plan` sub-tab.

**Business Rule:** BR-20 (draft survives restart)

**Coverage:** Prompt rendering, conditional display, sub-tab scoping

---

### SC_W505_02: Draft Resume Flow ("Tiếp tục")

**Objective:** Verify that clicking "Tiếp tục" opens WorkoutLogger via `pushPage()` with draft exercise/set data.

**Business Rule:** BR-20

**Coverage:** Button click handler, pushPage call with correct props, draft data passthrough

---

### SC_W505_03: Draft Discard Flow ("Hủy")

**Objective:** Verify that clicking "Hủy" calls `clearWorkoutDraft()` and removes the prompt from DOM.

**Coverage:** Button click handler, store action call, prompt disappearance

---

### SC_W505_04: Draft Prompt Styling (CSS Compliance)

**Objective:** Verify prompt container has exact Tailwind classes from acceptance criteria: `bg-warning/10 border border-warning/20 rounded-xl p-4`.

**Coverage:** CSS class assertion

---

### SC_W505_05: Edge Cases — No Draft / Corrupted / Minimal

**Objective:** Verify correct behavior for boundary conditions: no draft, draft with 0 sets, draft without planDayId, draft shown only on `plan` tab.

**Coverage:** Null guard, empty arrays, missing optional fields, tab-scoped visibility

---

### SC_W505_06: i18n Key Completeness (§8.6)

**Objective:** Verify ALL `fitness.draft.*` keys exist in vi.json with correct Vietnamese text. Verify ALL keys referenced by `t()` calls in fitness components have corresponding vi.json entries.

**Business Rule:** BR-43 (all text via t())

**Coverage:** i18n key existence, interpolation params, no hardcoded strings

---

### SC_W505_07: Draft Prompt Does Not Interfere with Existing Features

**Objective:** Verify that draft prompt presence doesn't break profileOutOfSync banner, SmartInsightBanner, or sub-tab navigation.

**Coverage:** Regression — coexistence with existing conditional UI elements

---

## 6. Test Cases

### SC_W505_01: Draft Prompt Visibility

#### TC_W505_01: Prompt shown when workoutDraft is non-null on plan tab

| Field              | Value                                                                                                                                                                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_01                                                                                                                                                                                                                                                                                   |
| **Scenario**       | SC_W505_01                                                                                                                                                                                                                                                                                   |
| **Priority**       | P0 — Core acceptance criterion                                                                                                                                                                                                                                                               |
| **Pre-conditions** | Store has `workoutDraft = VALID_DRAFT` (2 exercises, 3 sets). Active sub-tab = `plan` (default).                                                                                                                                                                                             |
| **Steps**          | 1. Setup store with `workoutDraft: VALID_DRAFT`<br>2. Render `<FitnessTab />`<br>3. Query for `data-testid="draft-recovery-prompt"`                                                                                                                                                          |
| **Expected**       | Element with `data-testid="draft-recovery-prompt"` is in the document.<br>Contains text matching `fitness.draft.resumeTitle` ("Buổi tập chưa hoàn thành").<br>Contains "Tiếp tục" button (`data-testid="draft-continue-btn"`).<br>Contains "Hủy" button (`data-testid="draft-discard-btn"`). |

---

#### TC_W505_02: Prompt NOT shown when workoutDraft is null

| Field              | Value                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_02                                                                                                                   |
| **Scenario**       | SC_W505_01                                                                                                                   |
| **Priority**       | P0 — Core acceptance criterion                                                                                               |
| **Pre-conditions** | Store has `workoutDraft = null`. Default sub-tab.                                                                            |
| **Steps**          | 1. Setup store with `workoutDraft: null`<br>2. Render `<FitnessTab />`<br>3. Query for `data-testid="draft-recovery-prompt"` |
| **Expected**       | `queryByTestId("draft-recovery-prompt")` returns `null`. No draft-related UI visible.                                        |

---

#### TC_W505_03: Prompt NOT shown on history sub-tab even with draft

| Field              | Value                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_03                                                                                                                                                    |
| **Scenario**       | SC_W505_01                                                                                                                                                    |
| **Priority**       | P1 — Tab scoping                                                                                                                                              |
| **Pre-conditions** | Store has `workoutDraft = VALID_DRAFT`.                                                                                                                       |
| **Steps**          | 1. Setup store with `workoutDraft: VALID_DRAFT`<br>2. Render `<FitnessTab />`<br>3. Click "Lịch sử" tab<br>4. Query for `data-testid="draft-recovery-prompt"` |
| **Expected**       | `queryByTestId("draft-recovery-prompt")` returns `null`. History content visible.                                                                             |

---

#### TC_W505_04: Prompt NOT shown on progress sub-tab even with draft

| Field              | Value                                                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_04                                                                                                                                                       |
| **Scenario**       | SC_W505_01                                                                                                                                                       |
| **Priority**       | P1 — Tab scoping                                                                                                                                                 |
| **Pre-conditions** | Store has `workoutDraft = VALID_DRAFT`.                                                                                                                          |
| **Steps**          | 1. Setup store with `workoutDraft: VALID_DRAFT`<br>2. Render `<FitnessTab />`<br>3. Click "Tiến trình" tab<br>4. Query for `data-testid="draft-recovery-prompt"` |
| **Expected**       | `queryByTestId("draft-recovery-prompt")` returns `null`. Progress content visible.                                                                               |

---

#### TC_W505_05: Prompt reappears when switching back to plan tab

| Field              | Value                                                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_05                                                                                                                                                                                            |
| **Scenario**       | SC_W505_01                                                                                                                                                                                            |
| **Priority**       | P1 — Tab lifecycle                                                                                                                                                                                    |
| **Pre-conditions** | Store has `workoutDraft = VALID_DRAFT`.                                                                                                                                                               |
| **Steps**          | 1. Setup store with draft<br>2. Render `<FitnessTab />`<br>3. Verify prompt visible<br>4. Click "Lịch sử" tab<br>5. Verify prompt NOT visible<br>6. Click "Kế hoạch" tab<br>7. Query for draft prompt |
| **Expected**       | Prompt visible again after returning to plan tab.                                                                                                                                                     |

---

### SC_W505_02: Draft Resume Flow

#### TC_W505_06: "Tiếp tục" button calls pushPage with WorkoutLogger + draft data

| Field              | Value                                                                                                                                                                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_06                                                                                                                                                                                                                                               |
| **Scenario**       | SC_W505_02                                                                                                                                                                                                                                               |
| **Priority**       | P0 — Core acceptance criterion                                                                                                                                                                                                                           |
| **Pre-conditions** | Store has `workoutDraft = VALID_DRAFT` (planDayId: 'plan-day-1').                                                                                                                                                                                        |
| **Steps**          | 1. Setup store with `workoutDraft: VALID_DRAFT`<br>2. Render `<FitnessTab />`<br>3. Click `data-testid="draft-continue-btn"`<br>4. Assert `pushPage` called                                                                                              |
| **Expected**       | `pushPage` called once with argument matching:<br>`{ id: 'workout-logger', component: 'WorkoutLogger', props: { planDay: expect.objectContaining({ id: 'plan-day-1' }) } }`<br>OR equivalent structure that passes draft's `planDayId` to WorkoutLogger. |

---

#### TC_W505_07: "Tiếp tục" works for ad-hoc draft (no planDayId)

| Field              | Value                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_07                                                                                                                   |
| **Scenario**       | SC_W505_02                                                                                                                   |
| **Priority**       | P1 — Edge case                                                                                                               |
| **Pre-conditions** | Store has `workoutDraft = ADHOC_DRAFT` (planDayId: undefined).                                                               |
| **Steps**          | 1. Setup store with `workoutDraft: ADHOC_DRAFT`<br>2. Render `<FitnessTab />`<br>3. Click `data-testid="draft-continue-btn"` |
| **Expected**       | `pushPage` called once. Props do NOT include `planDay` or include `planDay: undefined`. No crash.                            |

---

### SC_W505_03: Draft Discard Flow

#### TC_W505_08: "Hủy" button calls clearWorkoutDraft

| Field              | Value                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_08                                                                                                                       |
| **Scenario**       | SC_W505_03                                                                                                                       |
| **Priority**       | P0 — Core acceptance criterion                                                                                                   |
| **Pre-conditions** | Store has `workoutDraft = VALID_DRAFT`. `clearWorkoutDraft` is a mock fn.                                                        |
| **Steps**          | 1. Setup store with draft + mock `clearWorkoutDraft`<br>2. Render `<FitnessTab />`<br>3. Click `data-testid="draft-discard-btn"` |
| **Expected**       | `clearWorkoutDraft` called exactly once with no arguments.                                                                       |

---

#### TC_W505_09: Prompt disappears after discard

| Field              | Value                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**             | TC_W505_09                                                                                                                                                                                 |
| **Scenario**       | SC_W505_03                                                                                                                                                                                 |
| **Priority**       | P0 — UI feedback                                                                                                                                                                           |
| **Pre-conditions** | Store has `workoutDraft = VALID_DRAFT`.                                                                                                                                                    |
| **Steps**          | 1. Setup store with draft<br>2. Render `<FitnessTab />`<br>3. Verify prompt visible<br>4. Simulate discard: re-render with `workoutDraft: null` (mock store update)<br>5. Query for prompt |
| **Expected**       | `queryByTestId("draft-recovery-prompt")` returns `null` after store update.                                                                                                                |

**Implementation Note:** Since store is mocked, simulate the "disappear" by re-mocking store with `workoutDraft: null` and re-rendering, OR use a stateful mock that toggles on `clearWorkoutDraft()` call. The simpler approach: after clicking "Hủy", verify `clearWorkoutDraft` was called (TC_W505_08 covers correctness); separately test that `workoutDraft: null` → no prompt (TC_W505_02 covers this). Together they prove end-to-end flow.

---

### SC_W505_04: Draft Prompt Styling

#### TC_W505_10: Prompt container has required CSS classes

| Field              | Value                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_10                                                                                                                                                                      |
| **Scenario**       | SC_W505_04                                                                                                                                                                      |
| **Priority**       | P1 — Visual compliance                                                                                                                                                          |
| **Pre-conditions** | Store has `workoutDraft = VALID_DRAFT`.                                                                                                                                         |
| **Steps**          | 1. Setup store with draft<br>2. Render `<FitnessTab />`<br>3. Get `data-testid="draft-recovery-prompt"` element<br>4. Assert className                                          |
| **Expected**       | Element's className contains ALL of: `bg-warning/10`, `border`, `border-warning/20`, `rounded-xl`, `p-4`.<br>Assert via: `expect(el.className).toContain('bg-warning/10')` etc. |

---

### SC_W505_05: Edge Cases

#### TC_W505_11: Prompt shows correct description with interpolated counts

| Field              | Value                                                                                                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_11                                                                                                                                                                                                                                          |
| **Scenario**       | SC_W505_05                                                                                                                                                                                                                                          |
| **Priority**       | P0 — Data accuracy                                                                                                                                                                                                                                  |
| **Pre-conditions** | Store has `workoutDraft = VALID_DRAFT` (2 exercises, 3 sets).                                                                                                                                                                                       |
| **Steps**          | 1. Setup store with VALID_DRAFT<br>2. Render `<FitnessTab />`<br>3. Read text of `data-testid="draft-recovery-desc"` (or query by text content)                                                                                                     |
| **Expected**       | Text contains "2" (exercise count) AND "3" (set count).<br>If mock `t()` handles interpolation: text = "2 bài tập, 3 set đã ghi".<br>If mock returns raw key: assert `t` was called with `('fitness.draft.resumeDesc', { exercises: 2, sets: 3 })`. |

---

#### TC_W505_12: Minimal draft (1 exercise, 0 sets) shows correct counts

| Field              | Value                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_12                                                                                                                   |
| **Scenario**       | SC_W505_05                                                                                                                   |
| **Priority**       | P1 — Boundary                                                                                                                |
| **Pre-conditions** | Store has `workoutDraft = MINIMAL_DRAFT` (1 exercise, 0 sets).                                                               |
| **Steps**          | 1. Setup store with MINIMAL_DRAFT<br>2. Render `<FitnessTab />`<br>3. Verify prompt shows and description has correct counts |
| **Expected**       | Prompt visible. Description text contains "1" (exercises) and "0" (sets).                                                    |

---

#### TC_W505_13: Draft with exerciseMetas uses exerciseMetas.length for count

| Field              | Value                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_13                                                                                                                  |
| **Scenario**       | SC_W505_05                                                                                                                  |
| **Priority**       | P2 — Data source priority                                                                                                   |
| **Pre-conditions** | Store has `workoutDraft` with `exerciseMetas.length = 2` AND `exercises.length = 2` (both consistent).                      |
| **Steps**          | 1. Setup store with VALID_DRAFT<br>2. Render<br>3. Assert exercise count = 2                                                |
| **Expected**       | Count derived from `exercises.length` (or `exerciseMetas.length` — both are 2). No crash regardless of which array is read. |

---

#### TC_W505_14: loadWorkoutDraft called on mount

| Field              | Value                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_14                                                                                            |
| **Scenario**       | SC_W505_05                                                                                            |
| **Priority**       | P0 — Core recovery mechanism                                                                          |
| **Pre-conditions** | `loadWorkoutDraft` is a mock fn in the store.                                                         |
| **Steps**          | 1. Setup store with `workoutDraft: null` and mock `loadWorkoutDraft`<br>2. Render `<FitnessTab />`    |
| **Expected**       | `loadWorkoutDraft` called exactly once on mount. (Verifies the useEffect hook that triggers DB read.) |

---

#### TC_W505_15: Draft prompt and profileOutOfSync banner coexist

| Field              | Value                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_15                                                                                                                              |
| **Scenario**       | SC_W505_07                                                                                                                              |
| **Priority**       | P1 — Regression                                                                                                                         |
| **Pre-conditions** | Store: `workoutDraft = VALID_DRAFT`, `profileOutOfSync = true`, `profileChangedFields = ['weight']`.                                    |
| **Steps**          | 1. Setup store with both draft and out-of-sync state<br>2. Render `<FitnessTab />`<br>3. Query for both banners                         |
| **Expected**       | BOTH `data-testid="draft-recovery-prompt"` AND `data-testid="profile-out-of-sync-banner"` are in the document. Neither hides the other. |

---

#### TC_W505_16: Draft prompt and SmartInsightBanner coexist

| Field              | Value                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**             | TC_W505_16                                                                                                                           |
| **Scenario**       | SC_W505_07                                                                                                                           |
| **Priority**       | P1 — Regression                                                                                                                      |
| **Pre-conditions** | Store: `workoutDraft = VALID_DRAFT`. `useFitnessNutritionBridge` returns `insight = 'Low protein'`.                                  |
| **Steps**          | 1. Setup store with draft + set `mockInsightRef.current = 'Low protein'`<br>2. Render `<FitnessTab />`<br>3. Query for both elements |
| **Expected**       | BOTH `data-testid="draft-recovery-prompt"` AND `data-testid="smart-insight-banner"` are in the document.                             |

---

#### TC_W505_17: Draft prompt renders ABOVE plan content (DOM order)

| Field              | Value                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_17                                                                                                                                              |
| **Scenario**       | SC_W505_04                                                                                                                                              |
| **Priority**       | P2 — UX ordering                                                                                                                                        |
| **Pre-conditions** | Store: `workoutDraft = VALID_DRAFT`.                                                                                                                    |
| **Steps**          | 1. Render `<FitnessTab />`<br>2. Get draft prompt element<br>3. Get plan-subtab-content element<br>4. Compare DOM positions                             |
| **Expected**       | Draft prompt appears BEFORE (above) `plan-subtab-content` in DOM tree. Verify using `compareDocumentPosition` or element order in container's children. |

---

### SC_W505_06: i18n Key Completeness

#### TC_W505_18: All fitness.draft.\* keys exist in vi.json

| Field              | Value                                                                                                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_18                                                                                                                                                                                                                          |
| **Scenario**       | SC_W505_06                                                                                                                                                                                                                          |
| **Priority**       | P0 — BR-43 compliance                                                                                                                                                                                                               |
| **Pre-conditions** | Access to `src/locales/vi.json` (can be imported in test).                                                                                                                                                                          |
| **Steps**          | 1. Import vi.json<br>2. Assert each required key exists and is non-empty string                                                                                                                                                     |
| **Expected**       | ALL of the following keys exist with non-empty string values:<br>- `fitness.draft.resumeTitle`<br>- `fitness.draft.resumeDesc` (contains `{{exercises}}` and `{{sets}}`)<br>- `fitness.draft.continue`<br>- `fitness.draft.discard` |

**Implementation:**

```typescript
import viJson from '../locales/vi.json';

it('has all fitness.draft.* i18n keys', () => {
  const draft = (viJson as Record<string, unknown>).fitness as Record<string, unknown>;
  const draftKeys = draft.draft as Record<string, string>;
  expect(draftKeys.resumeTitle).toBe('Buổi tập chưa hoàn thành');
  expect(draftKeys.resumeDesc).toContain('{{exercises}}');
  expect(draftKeys.resumeDesc).toContain('{{sets}}');
  expect(draftKeys.continue).toBe('Tiếp tục');
  expect(draftKeys.discard).toBe('Hủy');
});
```

---

#### TC_W505_19: All §8.6 missing fitness keys added to vi.json

| Field              | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_19                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Scenario**       | SC_W505_06                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Priority**       | P0 — i18n finalization                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Pre-conditions** | Access to vi.json.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Steps**          | 1. Import vi.json<br>2. Check each §8.6 key exists                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Expected**       | ALL of these keys from Design §8.6 exist in vi.json (non-empty):<br><br>**fitness.draft (4 keys):**<br>`resumeTitle`, `resumeDesc`, `continue`, `discard`<br><br>**fitness.restTimer (5 keys):**<br>`title`, `remaining`, `addTime`, `skip`, `progress`<br><br>**fitness.streak (missing keys):**<br>`days`, `atRisk`, `weekView`<br>(Note: `milestone` already exists)<br><br>**fitness.progress (missing keys):**<br>`stable`, `volumeUnit`, `volumeChartAria`, `noPRs`, `noPRsDesc`<br>(Note: `volumeTrend`, `personalRecords` may exist under different paths)<br><br>**fitness.history (missing keys):**<br>`week`, `workouts`<br>(Note: `cloneWorkout` already exists)<br><br>**fitness.logger (missing keys):**<br>`suggestWeight`, `suggestReps`, `highWeightWarning`<br>(Note: many logger keys already exist)<br><br>**fitness.plan (missing keys):**<br>`todayLabel`, `tomorrowPreview`, `moreExercises`, `weekOverview`<br><br>**fitness.exerciseSelector:**<br>`recentlyUsed` (under fitness namespace, not generic) |

**Implementation:**

```typescript
it('has all §8.6 i18n keys', () => {
  const fitness = (viJson as Record<string, unknown>).fitness as Record<string, unknown>;

  // fitness.draft
  const draft = fitness.draft as Record<string, string>;
  expect(draft).toBeDefined();
  expect(Object.keys(draft)).toEqual(expect.arrayContaining(['resumeTitle', 'resumeDesc', 'continue', 'discard']));

  // fitness.restTimer
  const restTimer = fitness.restTimer as Record<string, string>;
  expect(restTimer).toBeDefined();
  for (const key of ['title', 'remaining', 'addTime', 'skip', 'progress']) {
    expect(restTimer[key]).toBeTruthy();
  }

  // ... similar assertions for each group
});
```

---

#### TC_W505_20: No t() calls in fitness components reference missing vi.json keys

| Field              | Value                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**             | TC_W505_20                                                                                                                                                   |
| **Scenario**       | SC_W505_06                                                                                                                                                   |
| **Priority**       | P0 — BR-43 compliance                                                                                                                                        |
| **Pre-conditions** | Access to filesystem (can run in Vitest with `fs` or as shell assertion).                                                                                    |
| **Steps**          | 1. Extract all `t('fitness.*')` calls from `src/features/fitness/**/*.{ts,tsx}`<br>2. Load vi.json<br>3. For each extracted key, verify it exists in vi.json |
| **Expected**       | 0 missing keys. Every `t('fitness.X.Y')` call has a corresponding `fitness.X.Y` entry in vi.json.                                                            |

**Implementation Note:** This can be a Vitest test that uses `fs.readFileSync` + regex to extract keys, then checks against the JSON. OR a shell script assertion:

```bash
# Shell validation (for CI or manual check)
grep -roh "t(['\"]fitness\.[^'\"]*['\"]" src/features/fitness/ | \
  sed "s/t(['\"]//;s/['\"]$//" | sort -u | \
  while read key; do
    node -e "const j=require('./src/locales/vi.json'); \
      const parts='$key'.split('.'); \
      let v=j; parts.forEach(p=>v=v&&v[p]); \
      if(!v) { console.error('MISSING: $key'); process.exit(1); }"
  done
```

---

#### TC_W505_21: fitness.draft.resumeDesc interpolation params match component usage

| Field              | Value                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_21                                                                                                                                                                   |
| **Scenario**       | SC_W505_06                                                                                                                                                                   |
| **Priority**       | P1 — Interpolation correctness                                                                                                                                               |
| **Pre-conditions** | vi.json `fitness.draft.resumeDesc` = `"{{exercises}} bài tập, {{sets}} set đã ghi"`                                                                                          |
| **Steps**          | 1. Verify vi.json value contains `{{exercises}}` and `{{sets}}`<br>2. Verify FitnessTab calls `t('fitness.draft.resumeDesc', { exercises: N, sets: M })` with numeric params |
| **Expected**       | Template placeholders in vi.json match the object keys passed to `t()`. No mismatched/missing interpolation variables.                                                       |

---

### SC_W505_07: Regression / Coexistence

#### TC_W505_22: Existing sub-tab tests still pass with draft state in store

| Field              | Value                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_22                                                                                                                                                |
| **Scenario**       | SC_W505_07                                                                                                                                                |
| **Priority**       | P1 — Regression                                                                                                                                           |
| **Pre-conditions** | Store extended with `workoutDraft: null`, `loadWorkoutDraft: vi.fn()`, `clearWorkoutDraft: vi.fn()`.                                                      |
| **Steps**          | 1. Add new mock fields to ALL existing `setupStore()` functions (defaulting to `workoutDraft: null`)<br>2. Run full test suite<br>3. Verify 0 regressions |
| **Expected**       | All 38+ existing tests pass unchanged. The new store fields (defaulting to null) cause zero side effects.                                                 |

---

#### TC_W505_23: Clicking "Tiếp tục" does NOT call clearWorkoutDraft

| Field              | Value                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_23                                                                                               |
| **Scenario**       | SC_W505_02                                                                                               |
| **Priority**       | P2 — Negative assertion                                                                                  |
| **Pre-conditions** | Store has `workoutDraft = VALID_DRAFT`.                                                                  |
| **Steps**          | 1. Setup store with draft and mock `clearWorkoutDraft`<br>2. Render<br>3. Click "Tiếp tục"               |
| **Expected**       | `clearWorkoutDraft` NOT called. Draft should persist so WorkoutLogger can read it. `pushPage` IS called. |

---

#### TC_W505_24: Accessibility — buttons have accessible names

| Field              | Value                                                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID**             | TC_W505_24                                                                                                                                                  |
| **Scenario**       | SC_W505_04                                                                                                                                                  |
| **Priority**       | P2 — a11y                                                                                                                                                   |
| **Pre-conditions** | Store has `workoutDraft = VALID_DRAFT`.                                                                                                                     |
| **Steps**          | 1. Render `<FitnessTab />`<br>2. Query buttons by role + accessible name                                                                                    |
| **Expected**       | `screen.getByRole('button', { name: /tiếp tục/i })` found.<br>`screen.getByRole('button', { name: /hủy/i })` found.<br>Both are interactive (not disabled). |

---

#### TC_W505_25: Prompt container has type="button" on both buttons

| Field              | Value                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **ID**             | TC_W505_25                                                                                                                                 |
| **Scenario**       | SC_W505_04                                                                                                                                 |
| **Priority**       | P2 — Form safety                                                                                                                           |
| **Pre-conditions** | Store has `workoutDraft = VALID_DRAFT`.                                                                                                    |
| **Steps**          | 1. Render `<FitnessTab />`<br>2. Get both draft buttons<br>3. Assert `type="button"`                                                       |
| **Expected**       | Both `draft-continue-btn` and `draft-discard-btn` have `type="button"` attribute (prevents accidental form submission if wrapped in form). |

---

## 7. Test-to-Acceptance-Criteria Traceability Matrix

| AC# | Acceptance Criterion                                                    | Test Cases                        |
| --- | ----------------------------------------------------------------------- | --------------------------------- |
| AC1 | Draft prompt shown when `workoutDraft !== null` on mount                | TC_01, TC_02, TC_03, TC_04, TC_14 |
| AC2 | "Tiếp tục" opens WorkoutLogger with draft exercises + sets              | TC_06, TC_07, TC_23               |
| AC3 | "Hủy" clears draft and dismisses prompt                                 | TC_08, TC_09                      |
| AC4 | Prompt styling: `bg-warning/10 border border-warning/20 rounded-xl p-4` | TC_10                             |
| AC5 | ALL fitness i18n keys from §8.6 present in vi.json                      | TC_18, TC_19, TC_20               |
| AC6 | All `t()` calls have corresponding vi.json keys                         | TC_20, TC_21                      |
| AC7 | 100% test coverage for draft recovery                                   | TC_01–TC_17 (all branches)        |

---

## 8. Coverage Strategy

### 8.1 Branch Coverage Map

The new draft recovery code introduces these branches:

| Branch                                       | True Case Test | False Case Test |
| -------------------------------------------- | -------------- | --------------- |
| `workoutDraft !== null`                      | TC_01          | TC_02           |
| `activeSubTab === 'plan'` (for draft prompt) | TC_01          | TC_03, TC_04    |
| Click "Tiếp tục"                             | TC_06          | —               |
| Click "Hủy"                                  | TC_08          | —               |
| `workoutDraft.planDayId` defined             | TC_06          | TC_07           |
| `loadWorkoutDraft` called on mount           | TC_14          | —               |

### 8.2 100% Coverage Guarantee

Every `if`/ternary/`&&` guard introduced by the dev MUST have:

- At least 1 test exercising the TRUE branch
- At least 1 test exercising the FALSE branch

The test cases above cover all identified branches. If dev introduces additional branches (e.g., error handling for `loadWorkoutDraft` failure), the QA engineer must add corresponding test cases.

---

## 9. Risks & Mitigations

| Risk                                                  | Likelihood | Impact | Mitigation                                                                           |
| ----------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------ |
| Dev uses different testid names than proposed         | Medium     | Low    | Proposed testids are guidelines. Dev must update test plan if names differ.          |
| `loadWorkoutDraft` is async — timing issues in test   | Medium     | Medium | Use `waitFor` or `act(async () => ...)` for mount effects.                           |
| Mock `t()` doesn't handle interpolation               | High       | Low    | TC_W505_11 designed with fallback assertion (check `t()` call args).                 |
| §8.6 keys conflict with keys from other W5 tasks      | Low        | Medium | Dev owns vi.json for ALL fitness.\* keys (except W2-03). Single-owner = no conflict. |
| Draft data shape changes between task design and impl | Low        | High   | Test data (§3) mirrors exact store type from fitnessStore.ts line 137-143.           |

---

## 10. Appendix: §8.6 i18n Key Gap Analysis

### Keys CONFIRMED MISSING from vi.json (must be added)

| Namespace           | Key                 | §8.6 Value                                   | Status     |
| ------------------- | ------------------- | -------------------------------------------- | ---------- |
| `fitness.draft`     | `resumeTitle`       | `Buổi tập chưa hoàn thành`                   | ❌ Missing |
| `fitness.draft`     | `resumeDesc`        | `{{exercises}} bài tập, {{sets}} set đã ghi` | ❌ Missing |
| `fitness.draft`     | `continue`          | `Tiếp tục`                                   | ❌ Missing |
| `fitness.draft`     | `discard`           | `Hủy`                                        | ❌ Missing |
| `fitness.restTimer` | `title`             | `Nghỉ giữa set`                              | ❌ Missing |
| `fitness.restTimer` | `remaining`         | `còn lại`                                    | ❌ Missing |
| `fitness.restTimer` | `addTime`           | `Thêm 30 giây`                               | ❌ Missing |
| `fitness.restTimer` | `skip`              | `Bỏ qua`                                     | ❌ Missing |
| `fitness.restTimer` | `progress`          | `Tiến trình nghỉ`                            | ❌ Missing |
| `fitness.streak`    | `days`              | `ngày liên tiếp`                             | ❌ Missing |
| `fitness.streak`    | `atRisk`            | `Sắp mất!`                                   | ❌ Missing |
| `fitness.streak`    | `weekView`          | `7 ngày gần đây`                             | ❌ Missing |
| `fitness.progress`  | `stable`            | `Ổn định`                                    | ❌ Missing |
| `fitness.progress`  | `volumeUnit`        | `Tổng khối lượng (kg)`                       | ❌ Missing |
| `fitness.progress`  | `volumeChartAria`   | `Biểu đồ khối lượng tập luyện 8 tuần`        | ❌ Missing |
| `fitness.progress`  | `noPRs`             | `Chưa có kỷ lục`                             | ❌ Missing |
| `fitness.progress`  | `noPRsDesc`         | `Tập luyện để lập kỷ lục đầu tiên`           | ❌ Missing |
| `fitness.history`   | `week`              | `Tuần {{n}}`                                 | ❌ Missing |
| `fitness.history`   | `workouts`          | `buổi tập`                                   | ❌ Missing |
| `fitness.logger`    | `suggestWeight`     | `Tăng lên {{weight}}kg`                      | ❌ Missing |
| `fitness.logger`    | `suggestReps`       | `Tăng lên {{reps}} rep`                      | ❌ Missing |
| `fitness.logger`    | `highWeightWarning` | `Cân nặng cao bất thường`                    | ❌ Missing |
| `fitness.plan`      | `todayLabel`        | `Hôm nay`                                    | ❌ Missing |
| `fitness.plan`      | `tomorrowPreview`   | `Ngày mai`                                   | ❌ Missing |
| `fitness.plan`      | `moreExercises`     | `bài tập nữa`                                | ❌ Missing |
| `fitness.plan`      | `weekOverview`      | `Tổng quan tuần`                             | ❌ Missing |

### Keys ALREADY EXISTING (no action needed)

| Namespace         | Key                   | Current vi.json Value                |
| ----------------- | --------------------- | ------------------------------------ |
| `fitness.stats`   | `duration`            | `Thời gian`                          |
| `fitness.stats`   | `volume`              | `Khối lượng`                         |
| `fitness.stats`   | `sets`                | `Tổng set`                           |
| `fitness.stats`   | `exercises`           | `Bài tập`                            |
| `fitness.streak`  | `milestone`           | `🔥 Chuỗi {{count}} ngày liên tiếp!` |
| `fitness.history` | `cloneWorkout`        | `Sao chép buổi tập`                  |
| `fitness.logger`  | `repeatSet`           | `Lặp set trước`                      |
| `fitness.logger`  | `prevSession`         | `Buổi trước`                         |
| `fitness.logger`  | `plateauWarning`      | `Đã {{weeks}} tuần không tiến bộ`    |
| `fitness.logger`  | `workoutComplete`     | `Hoàn thành buổi tập!`               |
| `fitness.logger`  | `firstWorkoutMessage` | `Chúc mừng buổi tập đầu tiên!`       |
| `fitness.logger`  | `newPRs`              | `Kỷ lục mới`                         |
| `fitness.logger`  | `saveAndClose`        | `Lưu & đóng`                         |
| `fitness.logger`  | `emptyWorkout`        | `Buổi tập trống`                     |
| `fitness.logger`  | `discardEmpty`        | `Bỏ qua`                             |
| `fitness.logger`  | `saving`              | `Đang lưu...`                        |
| `fitness.logger`  | `editSet`             | `Chỉnh sửa set`                      |
| `fitness.logger`  | `recentWeights`       | `Cân nặng gần đây`                   |

### Keys with VALUE DIFFERENCES (§8.6 vs vi.json) — Dev to review

| Key                              | §8.6 Value                 | vi.json Value                     | Action                          |
| -------------------------------- | -------------------------- | --------------------------------- | ------------------------------- |
| `fitness.logger.repeatSet`       | `Lặp lại`                  | `Lặp set trước`                   | Keep vi.json (more descriptive) |
| `fitness.stats.sets`             | `Số set`                   | `Tổng set`                        | Keep vi.json                    |
| `fitness.personalRecords` (path) | Under `fitness.progress.*` | Under `fitness.personalRecords.*` | Keep vi.json structure          |

---

_End of Test Plan_
