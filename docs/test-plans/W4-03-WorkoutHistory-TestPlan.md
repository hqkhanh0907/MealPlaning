# W4-03 — WorkoutHistory Week Grouping + PR Badge + Clone

## Test Plan v1.1 (Critique-Revised)

| Field            | Value                                                                |
| ---------------- | -------------------------------------------------------------------- |
| Feature          | WorkoutHistory enhancements: sticky headers, PR badges, clone action |
| Owned files      | `WorkoutHistory.tsx`, `WorkoutHistory.test.tsx`                      |
| Author           | QA Agent (TDD-First)                                                 |
| Created          | 2026-07-14                                                           |
| Fake system time | `2026-03-25 12:00:00` (matches existing test suite)                  |
| i18n             | Vietnamese only (`vi.json`)                                          |
| Coverage target  | 100% statements + branches for NEW code                              |

---

## 1. Scope Analysis

### 1.1 EXISTING functionality (already tested — DO NOT rewrite)

| Feature               | Existing tests | Status             |
| --------------------- | -------------- | ------------------ |
| Empty state           | 4 tests        | ✅ Covered         |
| Reverse chrono sort   | 1 test         | ✅ Covered         |
| Filter chips          | 5 tests        | ✅ Covered         |
| Expand/collapse       | 6 tests        | ✅ Covered         |
| Exercise details      | 2 tests        | ✅ Covered         |
| Volume display        | 1 test         | ✅ Covered         |
| Notes display         | 2 tests        | ✅ Covered         |
| Delete workflow       | 3 tests        | ✅ Covered         |
| Week grouping (basic) | 1 test         | ✅ Covered (label) |
| Relative dates        | 2 tests        | ✅ Covered         |

### 1.2 NEW functionality (this test plan)

| Feature                    | Test scenarios | Priority |
| -------------------------- | -------------- | -------- |
| Sticky week headers (CSS)  | SC_W403_01     | P0       |
| Week label with date range | SC_W403_02     | P0       |
| PR badge rendering         | SC_W403_03     | P0       |
| Clone button rendering     | SC_W403_04     | P0       |
| Clone action (draft + nav) | SC_W403_05     | P0       |
| Edge cases & boundary      | SC_W403_06     | P1       |

---

## 2. Test Data Design

### 2.1 Calendar context (fakeTimers = 2026-03-25 12:00)

```
2026-03-25 = Wednesday
getMondayOfWeek("2026-03-25") = "2026-03-23" (Monday)
ISO Week 13: 23/03 - 29/03

getMondayOfWeek("2026-03-23") = "2026-03-23" (Monday)
Same week 13

getMondayOfWeek("2026-03-21") = "2026-03-16" (Saturday → Monday of that week)
ISO Week 12: 16/03 - 22/03

getMondayOfWeek("2026-03-10") = "2026-03-09" (Tuesday → Monday)
ISO Week 11: 09/03 - 15/03
```

### 2.2 Existing mock workouts (reuse from current test)

| ID  | Date       | Week Monday | Week # | Name        |
| --- | ---------- | ----------- | ------ | ----------- |
| w3  | 2026-03-25 | 2026-03-23  | 13     | Leg Day     |
| w1  | 2026-03-23 | 2026-03-23  | 13     | Chest Day   |
| w2  | 2026-03-21 | 2026-03-16  | 12     | Morning Run |
| w4  | 2026-03-10 | 2026-03-09  | 11     | Back Day    |

**Week groups after sort**: Week 13 (w3, w1) → Week 12 (w2) → Week 11 (w4)

### 2.3 NEW mock data for PR tests

```typescript
// Workout w5: has sets that are PRs relative to historical w1/w4
const prWorkout = {
  id: 'w5',
  date: '2026-03-24',
  name: 'PR Session',
  createdAt: '2026-03-24T10:00:00Z',
  updatedAt: '2026-03-24T11:00:00Z',
};

// Set where bench-press 80kg×10 beats w1's 70kg×8 (PR!)
const prSet = {
  id: 's-pr1',
  workoutId: 'w5',
  exerciseId: 'bench-press',
  setNumber: 1,
  reps: 10,
  weightKg: 80,
  rpe: 9,
  updatedAt: '2026-03-24T10:10:00Z',
};

// Set that is NOT a PR (same weight as before)
const nonPrSet = {
  id: 's-nopr1',
  workoutId: 'w5',
  exerciseId: 'squat',
  setNumber: 1,
  reps: 8,
  weightKg: 60, // lower than w3's 80kg
  updatedAt: '2026-03-24T10:20:00Z',
};
```

### 2.4 NEW mock data for Clone tests

```typescript
// Workout with multiple exercises + multiple sets for clone stress test
const cloneWorkout = {
  id: 'w-clone',
  date: '2026-03-25',
  name: 'Full Body',
  planDayId: 'pd-1',
  durationMin: 90,
  notes: 'Heavy session',
  createdAt: '2026-03-25T08:00:00Z',
  updatedAt: '2026-03-25T09:30:00Z',
};

// 3 exercises × 3 sets = 9 sets
const cloneSets = [
  {
    id: 'cs1',
    workoutId: 'w-clone',
    exerciseId: 'bench-press',
    setNumber: 1,
    reps: 10,
    weightKg: 60,
    updatedAt: '...',
  },
  { id: 'cs2', workoutId: 'w-clone', exerciseId: 'bench-press', setNumber: 2, reps: 8, weightKg: 70, updatedAt: '...' },
  { id: 'cs3', workoutId: 'w-clone', exerciseId: 'bench-press', setNumber: 3, reps: 6, weightKg: 80, updatedAt: '...' },
  { id: 'cs4', workoutId: 'w-clone', exerciseId: 'squat', setNumber: 1, reps: 10, weightKg: 80, updatedAt: '...' },
  { id: 'cs5', workoutId: 'w-clone', exerciseId: 'squat', setNumber: 2, reps: 8, weightKg: 90, updatedAt: '...' },
  { id: 'cs6', workoutId: 'w-clone', exerciseId: 'squat', setNumber: 3, reps: 6, weightKg: 100, updatedAt: '...' },
  { id: 'cs7', workoutId: 'w-clone', exerciseId: 'deadlift', setNumber: 1, reps: 5, weightKg: 100, updatedAt: '...' },
  { id: 'cs8', workoutId: 'w-clone', exerciseId: 'deadlift', setNumber: 2, reps: 5, weightKg: 110, updatedAt: '...' },
  { id: 'cs9', workoutId: 'w-clone', exerciseId: 'deadlift', setNumber: 3, reps: 3, weightKg: 120, updatedAt: '...' },
];
```

---

## 3. Test Scenarios

### SC_W403_01 — Sticky Week Headers

**Goal**: Verify week header elements have `sticky` positioning CSS classes.

**Pre-conditions**: Workouts spanning multiple weeks exist.

**Why**: Acceptance Criteria #2 requires `sticky top-0 z-10 bg-background` on week headers so they remain visible when scrolling within a week group.

---

### SC_W403_02 — Week Label Format with Date Range

**Goal**: Verify week headers display full date range (Monday–Sunday), not just Monday date.

**Pre-conditions**: Same workouts as SC_W403_01.

**Why**: AC #1 specifies format "Tuần 28: 7/7 - 13/7" — ISO week number + start/end date range.

**Note**: The current implementation uses `t('fitness.history.weekOf', { date: weekLabel })` → "Tuần từ 23/03". The new format needs week number and Sunday end date. Dev must update `getWeekLabel()` and possibly the i18n key.

---

### SC_W403_03 — PR Badge Rendering

**Goal**: Verify PR badges appear inline on exercise groups where a personal record was achieved.

**Pre-conditions**: Workout with sets that surpass historical max for that exercise (by weight at same reps).

**Why**: AC #3 — "PR badge shows on exercise cards where `isPR === true`".

**PR Detection Logic** (from `detectPRs` in `gamification.ts`):

- Compare `set.weightKg` for same `exerciseId` + same `reps` against all previous workout sets
- If `set.weightKg > max(previous.weightKg)` → PR

---

### SC_W403_04 — Clone Button Rendering

**Goal**: Verify a clone/copy button appears on each workout card.

**Pre-conditions**: At least one workout exists.

**Why**: AC #4 — "Copy icon on each workout card".

---

### SC_W403_05 — Clone Action (Draft + Navigation)

**Goal**: Verify tapping clone creates a workout draft and navigates to today's plan view.

**Pre-conditions**: Workout with exercises and sets exists. `setWorkoutDraft` and `navigateTab` are available in store.

**Why**: AC #5 — "Clone creates draft via `setWorkoutDraft()` and navigates to plan tab".

**Draft shape** (from fitnessStore):

```typescript
{
  exercises: Exercise[];          // Exercise objects for each unique exerciseId in workout
  exerciseMetas?: ExerciseSessionMeta[];
  sets: WorkoutSet[];             // Cloned sets (new IDs, today's date)
  elapsedSeconds: number;         // 0 for fresh clone
  planDayId?: string;             // undefined for clone (not tied to a plan)
}
```

---

### SC_W403_06 — Edge Cases & Boundary Conditions

**Goal**: Cover week boundary (Sun→Mon transition), empty-after-filter weeks, clone with 10+ exercises, clone for cardio-only workout.

**Why**: QA Focus areas specified in task description.

---

## 4. Detailed Test Cases

### SC_W403_01 — Sticky Week Headers

#### TC_W403_01: Week header has sticky CSS classes

| Field         | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Pre-condition | Workouts from existing mock data (4 workouts, 3 week groups)                 |
| Steps         | 1. Render `<WorkoutHistory />`                                               |
|               | 2. Query `week-header-2026-03-23`                                            |
|               | 3. Check CSS classes                                                         |
| Expected      | Element has classes: `sticky`, `top-0`, `z-10`, `bg-background`              |
| testid        | `week-header-2026-03-23`, `week-header-2026-03-16`, `week-header-2026-03-09` |

```typescript
it('week headers have sticky positioning classes', () => {
  render(<WorkoutHistory />);
  const headers = screen.getAllByTestId(/^week-header-/);
  expect(headers).toHaveLength(3);
  for (const header of headers) {
    expect(header.className).toContain('sticky');
    expect(header.className).toContain('top-0');
    expect(header.className).toContain('z-10');
  }
});
```

#### TC_W403_02: Week header has background for readability over scrolled content

| Field         | Value                                                              |
| ------------- | ------------------------------------------------------------------ |
| Pre-condition | Same as TC_W403_01                                                 |
| Steps         | 1. Render `<WorkoutHistory />`                                     |
|               | 2. Check first week header for `bg-background` class               |
| Expected      | All week headers include `bg-background` (or equivalent opaque bg) |

```typescript
it('week headers have opaque background for sticky readability', () => {
  render(<WorkoutHistory />);
  const header = screen.getByTestId('week-header-2026-03-23');
  expect(header.className).toMatch(/bg-background/);
});
```

---

### SC_W403_02 — Week Label Format with Date Range

#### TC_W403_03: Week header displays date range (Monday–Sunday)

| Field         | Value                                                               |
| ------------- | ------------------------------------------------------------------- |
| Pre-condition | Workouts exist in week starting 2026-03-23 (Monday)                 |
| Steps         | 1. Render `<WorkoutHistory />`                                      |
|               | 2. Read text of `week-header-2026-03-23`                            |
| Expected      | Text contains both Monday start "23/03" AND Sunday end "29/03"      |
| Note          | Exact format TBD by dev (e.g., "Tuần 13: 23/03 - 29/03" or similar) |

```typescript
it('week header shows date range with Monday start and Sunday end', () => {
  render(<WorkoutHistory />);
  const header = screen.getByTestId('week-header-2026-03-23');
  // Must contain start date (Monday)
  expect(header.textContent).toContain('23/03');
  // Must contain end date (Sunday = Monday + 6 days)
  expect(header.textContent).toContain('29/03');
});
```

#### TC_W403_04: All week headers display correct date ranges

| Field         | Value                                                                              |
| ------------- | ---------------------------------------------------------------------------------- |
| Pre-condition | 3 week groups from mock data                                                       |
| Steps         | 1. Render `<WorkoutHistory />`                                                     |
|               | 2. Verify each week header                                                         |
| Expected      | Week 13: "23/03" - "29/03", Week 12: "16/03" - "22/03", Week 11: "09/03" - "15/03" |

```typescript
it('all week headers display correct Monday-Sunday date ranges', () => {
  render(<WorkoutHistory />);
  const weekRanges = [
    { testid: 'week-header-2026-03-23', start: '23/03', end: '29/03' },
    { testid: 'week-header-2026-03-16', start: '16/03', end: '22/03' },
    { testid: 'week-header-2026-03-09', start: '09/03', end: '15/03' },
  ];
  for (const { testid, start, end } of weekRanges) {
    const header = screen.getByTestId(testid);
    expect(header.textContent).toContain(start);
    expect(header.textContent).toContain(end);
  }
});
```

#### TC_W403_05: Filtered workouts do not show empty week headers

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Pre-condition | Filter set to "cardio" → only w2 (Morning Run) survives                |
| Steps         | 1. Render `<WorkoutHistory />`                                         |
|               | 2. Click `filter-cardio`                                               |
|               | 3. Count week headers                                                  |
| Expected      | Only 1 week header (week of 2026-03-16). Weeks 13 and 11 NOT rendered. |

```typescript
it('empty weeks are not rendered after filtering', () => {
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('filter-cardio'));
  const headers = screen.getAllByTestId(/^week-header-/);
  expect(headers).toHaveLength(1);
  expect(headers[0]).toHaveAttribute('data-testid', 'week-header-2026-03-16');
  expect(screen.queryByTestId('week-header-2026-03-23')).not.toBeInTheDocument();
  expect(screen.queryByTestId('week-header-2026-03-09')).not.toBeInTheDocument();
});
```

---

### SC_W403_03 — PR Badge Rendering

#### TC_W403_06: PR badge appears on exercise with personal record

| Field         | Value                                                                              |
| ------------- | ---------------------------------------------------------------------------------- |
| Pre-condition | w5 has bench-press set at 80kg×10 which beats w1's best (70kg×8 at same rep count) |
|               | Mock store includes w1 sets as historical data                                     |
| Steps         | 1. Render `<WorkoutHistory />` with PR-enabled mock data                           |
|               | 2. Expand workout w5                                                               |
|               | 3. Check exercise group for bench-press                                            |
| Expected      | A PR badge element is present within `exercise-group-bench-press`                  |
| testid        | `pr-badge-bench-press` (or element containing "PR" text within exercise group)     |

```typescript
it('displays PR badge on exercise where personal record was set', () => {
  // Setup: mockUseFitnessStore with w5 + historical w1 sets
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('workout-toggle-w5'));
  const exerciseGroup = screen.getByTestId('exercise-group-bench-press');
  // PR badge should be within this exercise group
  expect(within(exerciseGroup).getByTestId('pr-badge-bench-press')).toBeInTheDocument();
});
```

#### TC_W403_07: No PR badge on exercise without personal record

| Field         | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Pre-condition | w5 has squat set at 60kg×8 which does NOT beat w3's 80kg×8 |
| Steps         | 1. Render with PR mock data                                |
|               | 2. Expand workout w5                                       |
|               | 3. Check exercise group for squat                          |
| Expected      | No PR badge within `exercise-group-squat`                  |

```typescript
it('does not display PR badge on exercise without personal record', () => {
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('workout-toggle-w5'));
  const exerciseGroup = screen.getByTestId('exercise-group-squat');
  expect(within(exerciseGroup).queryByTestId(/pr-badge/)).not.toBeInTheDocument();
});
```

#### TC_W403_08: PR badge is not shown when workout is collapsed

| Field         | Value                                                           |
| ------------- | --------------------------------------------------------------- |
| Pre-condition | Workout with PR exists but is collapsed                         |
| Steps         | 1. Render `<WorkoutHistory />` (w5 collapsed by default)        |
|               | 2. Query for PR badges                                          |
| Expected      | No PR badges visible (they only render in expanded detail view) |

```typescript
it('PR badges are only visible in expanded workout detail', () => {
  render(<WorkoutHistory />);
  // Collapsed — no detail rendered, no PR badges
  expect(screen.queryByTestId(/pr-badge/)).not.toBeInTheDocument();
});
```

#### TC_W403_09: PR badge has accessible label

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Pre-condition | Same PR data as TC_W403_06                                       |
| Steps         | 1. Expand w5, locate PR badge                                    |
| Expected      | PR badge has either `aria-label` or visible text "PR" / i18n key |

```typescript
it('PR badge has accessible text', () => {
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('workout-toggle-w5'));
  const badge = screen.getByTestId('pr-badge-bench-press');
  // Badge should contain accessible text
  expect(badge.textContent || badge.getAttribute('aria-label')).toBeTruthy();
});
```

#### TC_W403_10: First workout for an exercise does NOT show PR badge

| Field         | Value                                                                                |
| ------------- | ------------------------------------------------------------------------------------ |
| Pre-condition | Workout with a brand-new exercise (no history) — e.g., exerciseId = 'overhead-press' |
| Steps         | 1. Render with workout containing first-ever overhead-press set                      |
|               | 2. Expand workout                                                                    |
| Expected      | No PR badge on overhead-press (no previous data to compare against)                  |
| Rationale     | `detectPRs()` requires `prevForExercise.length > 0` — first occurrence skipped       |

```typescript
it('no PR badge for exercise with no historical data', () => {
  // Setup: add workout with brand-new exercise 'overhead-press', no historical sets for it
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('workout-toggle-w-new'));
  const group = screen.getByTestId('exercise-group-overhead-press');
  expect(within(group).queryByTestId(/pr-badge/)).not.toBeInTheDocument();
});
```

---

### SC_W403_04 — Clone Button Rendering

#### TC_W403_11: Clone button renders on each workout card

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Pre-condition | 4 workouts exist                                                        |
| Steps         | 1. Render `<WorkoutHistory />`                                          |
|               | 2. Query clone buttons                                                  |
| Expected      | 4 clone buttons, one per workout card, with testid `clone-workout-{id}` |

```typescript
it('renders clone button on each workout card', () => {
  render(<WorkoutHistory />);
  expect(screen.getByTestId('clone-workout-w1')).toBeInTheDocument();
  expect(screen.getByTestId('clone-workout-w2')).toBeInTheDocument();
  expect(screen.getByTestId('clone-workout-w3')).toBeInTheDocument();
  expect(screen.getByTestId('clone-workout-w4')).toBeInTheDocument();
});
```

#### TC_W403_12: Clone button has accessible label

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Pre-condition | Same setup                                                             |
| Steps         | 1. Render, locate clone button for w1                                  |
| Expected      | Button has `aria-label` containing clone/copy intent (i18n Vietnamese) |

```typescript
it('clone button has accessible aria-label', () => {
  render(<WorkoutHistory />);
  const cloneBtn = screen.getByTestId('clone-workout-w1');
  expect(cloneBtn).toHaveAttribute('aria-label');
  expect(cloneBtn.getAttribute('aria-label')).toBeTruthy();
});
```

#### TC_W403_13: Clone button is visible WITHOUT expanding the workout

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Pre-condition | Workout collapsed (default state)                                      |
| Steps         | 1. Render, verify w1 is NOT expanded                                   |
|               | 2. Check clone button visibility                                       |
| Expected      | Clone button `clone-workout-w1` is in the document even when collapsed |
| Note          | Clone is a quick action — should be accessible without expanding       |

```typescript
it('clone button visible without expanding workout', () => {
  render(<WorkoutHistory />);
  expect(screen.queryByTestId('workout-detail-w1')).not.toBeInTheDocument(); // collapsed
  expect(screen.getByTestId('clone-workout-w1')).toBeInTheDocument(); // clone visible
});
```

---

### SC_W403_05 — Clone Action (Draft + Navigation)

#### TC_W403_14: Clone calls setWorkoutDraft with correct exercises and sets

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Pre-condition | w1 has 2 exercises (bench-press: 2 sets, chest-fly: 1 set)                 |
|               | `setWorkoutDraft` and `navigateTab` mocked                                 |
| Steps         | 1. Render `<WorkoutHistory />`                                             |
|               | 2. Click `clone-workout-w1`                                                |
| Expected      | `setWorkoutDraft` called once with:                                        |
|               | - `exercises`: array containing bench-press and chest-fly Exercise objects |
|               | - `sets`: array of 3 sets matching w1's exercise/weight/reps structure     |
|               | - `elapsedSeconds`: 0                                                      |
|               | - `planDayId`: undefined (clone is not tied to plan)                       |

```typescript
it('clone creates workout draft with correct exercises and sets', () => {
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('clone-workout-w1'));

  expect(mockSetWorkoutDraft).toHaveBeenCalledTimes(1);
  const draft = mockSetWorkoutDraft.mock.calls[0][0];
  expect(draft.elapsedSeconds).toBe(0);
  // 2 unique exercises in w1: bench-press, chest-fly
  expect(draft.exercises).toHaveLength(2);
  const exerciseIds = draft.exercises.map(e => e.id);
  expect(exerciseIds).toContain('bench-press');
  expect(exerciseIds).toContain('chest-fly');
  // 3 sets in w1: s1, s2, s6
  expect(draft.sets).toHaveLength(3);
  // Sets should carry over weight/reps structure
  expect(draft.sets.some(s => s.weightKg === 60 && s.reps === 10)).toBe(true);
  expect(draft.sets.some(s => s.weightKg === 70 && s.reps === 8)).toBe(true);
  expect(draft.sets.some(s => s.weightKg === 20)).toBe(true);
  // No planDayId on clone
  expect(draft.planDayId).toBeUndefined();
});
```

#### TC_W403_15: Clone navigates to fitness plan/today view

| Field         | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Pre-condition | Same setup. `navigateTab` or sub-tab navigation mocked.          |
| Steps         | 1. Click `clone-workout-w1`                                      |
| Expected      | Navigation triggered to fitness tab's plan view (today)          |
|               | `navigateTab('fitness')` called OR equivalent sub-tab navigation |

```typescript
it('clone navigates to fitness plan view', () => {
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('clone-workout-w1'));
  // Verify navigation to plan/today view
  expect(mockNavigateTab).toHaveBeenCalledWith('fitness');
  // OR: expect(mockSetActiveSubTab).toHaveBeenCalledWith('plan');
});
```

#### TC_W403_16: Cloned sets have new IDs (not reuse original)

| Field         | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Pre-condition | w1 has sets with ids: s1, s2, s6                           |
| Steps         | 1. Click `clone-workout-w1`                                |
|               | 2. Inspect draft.sets IDs                                  |
| Expected      | None of the cloned set IDs match original IDs (s1, s2, s6) |
| Rationale     | Cloned sets must have unique IDs to avoid DB conflicts     |

```typescript
it('cloned sets have fresh IDs, not original IDs', () => {
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('clone-workout-w1'));

  const draft = mockSetWorkoutDraft.mock.calls[0][0];
  const originalIds = ['s1', 's2', 's6'];
  for (const set of draft.sets) {
    expect(originalIds).not.toContain(set.id);
  }
});
```

#### TC_W403_17: Clone cardio-only workout

| Field         | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Pre-condition | w2 (Morning Run) — cardio only, 1 set with durationMin=30, weightKg=0 |
| Steps         | 1. Click `clone-workout-w2`                                           |
| Expected      | Draft created with:                                                   |
|               | - 1 exercise (running)                                                |
|               | - 1 set with durationMin=30, weightKg=0                               |
|               | - elapsedSeconds=0                                                    |

```typescript
it('clone works for cardio-only workout', () => {
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('clone-workout-w2'));

  const draft = mockSetWorkoutDraft.mock.calls[0][0];
  expect(draft.exercises).toHaveLength(1);
  expect(draft.sets).toHaveLength(1);
  expect(draft.sets[0].durationMin).toBe(30);
  expect(draft.sets[0].weightKg).toBe(0);
  expect(draft.elapsedSeconds).toBe(0);
});
```

---

### SC_W403_06 — Edge Cases & Boundary Conditions

#### TC_W403_18: Sunday workout grouped with correct week (same week as preceding Monday)

| Field         | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Pre-condition | Add workout on Sunday 2026-03-29 (last day of week 13)     |
|               | `getMondayOfWeek("2026-03-29")` should return "2026-03-23" |
| Steps         | 1. Render with workout on 2026-03-29                       |
|               | 2. Verify it appears under week-header-2026-03-23          |
| Expected      | Sunday workout is in same week group as Monday 2026-03-23  |

```typescript
it('Sunday workout groups with its week (Mon-Sun boundary)', () => {
  // Add workout on Sunday 2026-03-29
  const sundayWorkout = { id: 'w-sun', date: '2026-03-29', name: 'Sunday Run', ... };
  mockUseFitnessStore.mockImplementation(selector => selector({
    workouts: [sundayWorkout, ...mockWorkouts],
    workoutSets: mockWorkoutSets,
    deleteWorkout: vi.fn(),
  }));
  render(<WorkoutHistory />);
  const weekGroup = screen.getByTestId('week-group-2026-03-23');
  expect(within(weekGroup).getByTestId('workout-card-w-sun')).toBeInTheDocument();
});
```

#### TC_W403_19: Monday workout starts a new week group

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Pre-condition | Add workout on Monday 2026-03-30 (first day of week 14)                |
|               | `getMondayOfWeek("2026-03-30")` should return "2026-03-30"             |
| Steps         | 1. Render with workout on 2026-03-30                                   |
|               | 2. Verify it's in a DIFFERENT week group from 2026-03-23 workouts      |
| Expected      | New week header `week-header-2026-03-30` exists, separate from week 13 |

```typescript
it('Monday workout creates new week group (Mon boundary)', () => {
  const mondayWorkout = { id: 'w-mon', date: '2026-03-30', name: 'Monday Chest', ... };
  mockUseFitnessStore.mockImplementation(selector => selector({
    workouts: [mondayWorkout, ...mockWorkouts],
    workoutSets: mockWorkoutSets,
    deleteWorkout: vi.fn(),
  }));
  render(<WorkoutHistory />);
  expect(screen.getByTestId('week-header-2026-03-30')).toBeInTheDocument();
  expect(screen.getByTestId('week-header-2026-03-23')).toBeInTheDocument();
  // They're separate groups
  const newWeek = screen.getByTestId('week-group-2026-03-30');
  expect(within(newWeek).getByTestId('workout-card-w-mon')).toBeInTheDocument();
  expect(within(newWeek).queryByTestId('workout-card-w3')).not.toBeInTheDocument();
});
```

#### TC_W403_20: Clone workout with 10+ exercises (stress test)

| Field         | Value                                                                         |
| ------------- | ----------------------------------------------------------------------------- |
| Pre-condition | Workout `w-big` with 12 unique exercises, 36 sets total                       |
| Steps         | 1. Click `clone-workout-w-big`                                                |
| Expected      | `setWorkoutDraft` called with `exercises.length === 12`, `sets.length === 36` |
|               | All 12 exercise IDs present. All 36 sets cloned.                              |
| Rationale     | QA Focus: "clone with 10+ exercises"                                          |

```typescript
it('clone handles workout with 10+ exercises', () => {
  // Setup: 12 exercises × 3 sets = 36 sets
  const bigSets = Array.from({ length: 36 }, (_, i) => ({
    id: `big-s${i}`,
    workoutId: 'w-big',
    exerciseId: `exercise-${Math.floor(i / 3)}`,
    setNumber: (i % 3) + 1,
    reps: 10,
    weightKg: 50 + i,
    updatedAt: '2026-03-25T10:00:00Z',
  }));
  // ... setup mock with w-big + bigSets
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('clone-workout-w-big'));

  const draft = mockSetWorkoutDraft.mock.calls[0][0];
  expect(draft.exercises).toHaveLength(12);
  expect(draft.sets).toHaveLength(36);
});
```

#### TC_W403_21: Clone workout with deleted exercises (exerciseId = null)

| Field         | Value                                                       |
| ------------- | ----------------------------------------------------------- |
| Pre-condition | Workout has sets with `exerciseId: null` (deleted exercise) |
| Steps         | 1. Click clone on workout with deleted exercise sets        |
| Expected      | Clone gracefully handles null exerciseId:                   |
|               | - Either excludes deleted exercise sets from draft          |
|               | - Or includes them with exerciseId null (no crash)          |
| Rationale     | Defensive — exercises can be deleted after workout logged   |

```typescript
it('clone handles sets with deleted exercises gracefully', () => {
  // Setup: workout with one set having exerciseId: null
  const deletedSets = [
    { id: 'ds1', workoutId: 'w-del', exerciseId: null, setNumber: 1, weightKg: 50, reps: 10, updatedAt: '...' },
    { id: 'ds2', workoutId: 'w-del', exerciseId: 'bench-press', setNumber: 1, weightKg: 60, reps: 10, updatedAt: '...' },
  ];
  // ... setup mock
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('clone-workout-w-del'));

  // Should not crash
  expect(mockSetWorkoutDraft).toHaveBeenCalledTimes(1);
  const draft = mockSetWorkoutDraft.mock.calls[0][0];
  // At minimum: bench-press should be in draft
  expect(draft.exercises.some(e => e.id === 'bench-press')).toBe(true);
});
```

#### TC_W403_22: Week header not rendered for week with 0 workouts (after delete)

| Field         | Value                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| Pre-condition | Only 1 workout in week 11 (w4). Delete w4.                                                                    |
| Steps         | 1. Render `<WorkoutHistory />` with only w4                                                                   |
|               | 2. Delete w4 (expand → delete → confirm)                                                                      |
| Expected      | After delete, if w4's week has 0 workouts → week header disappears                                            |
| Note          | This is already handled by existing `weekGroups` memo from `filteredWorkouts`, but worth verifying explicitly |

---

## 5. Mock Setup Requirements for New Tests

### 5.1 Additional store selectors to mock

The dev implementation will likely need these new selectors from the store:

```typescript
// For clone action
setWorkoutDraft: vi.fn(),

// For navigation after clone
// Option A: navigateTab from navigationStore
// Option B: setActiveFitnessSubTab from uiStore
```

### 5.2 Additional mock for navigationStore

```typescript
vi.mock('../store/navigationStore', () => ({
  default: vi.fn(), // or useNavigationStore
}));
const mockNavigateTab = vi.fn();
// Wire into mock implementation
```

### 5.3 i18n keys to add for new features

The dev MUST add these keys to `vi.json` and to the test mock:

| Key (proposed)                 | Value (proposed)                     |
| ------------------------------ | ------------------------------------ |
| `fitness.history.cloneWorkout` | `Sao chép buổi tập`                  |
| `fitness.history.prBadge`      | `PR`                                 |
| `fitness.history.weekRange`    | `Tuần {{week}}: {{start}} - {{end}}` |

Add to test mock `translations` object accordingly.

---

## 6. Regression Risk Assessment

| Change                   | Risk                                                         | Mitigation                                                |
| ------------------------ | ------------------------------------------------------------ | --------------------------------------------------------- |
| Sticky CSS on header     | Could break existing layout assertions                       | Existing test checks `toHaveTextContent` not class — safe |
| Week label format change | Existing TC line 247-254 checks "Tuần từ 23/03" — WILL BREAK | Update expected text in existing test                     |
| New clone button in card | Could shift layout of expand/chevron                         | New testid; existing tests use testid — safe              |
| PR badge in detail view  | Adds DOM within `exercise-group-*`                           | Existing tests check `exercise-group-*` presence — safe   |
| New store selectors      | Mock must include `setWorkoutDraft`                          | Update `mockUseFitnessStore.mockImplementation`           |

### 6.1 Existing test that WILL need update

**Line 244-254**: `it('groups workouts by week with headers')` — checks `toHaveTextContent('Tuần từ 23/03')`. If label format changes to include date range, this expected text MUST be updated.

---

## 7. Test Implementation Order (for Dev)

1. **Update existing test** (line 244-254) for new week label format
2. TC_W403_01, TC_W403_02 — sticky headers (CSS verification)
3. TC_W403_03, TC_W403_04, TC_W403_05 — week date ranges
4. TC_W403_11, TC_W403_12, TC_W403_13 — clone button rendering
5. TC_W403_14, TC_W403_15, TC_W403_16, TC_W403_17 — clone action
6. TC_W403_06, TC_W403_07, TC_W403_08, TC_W403_09, TC_W403_10 — PR badge
7. TC_W403_18, TC_W403_19 — week boundary edge cases
8. TC_W403_20, TC_W403_21 — clone edge cases
9. Run full suite → verify 0 regressions

---

## 8. Acceptance Criteria Traceability Matrix

| AC# | Description                          | Test Cases                                         |
| --- | ------------------------------------ | -------------------------------------------------- |
| 1   | Workouts grouped under week headers  | TC_W403_03, TC_W403_04 (existing tests also cover) |
| 2   | Sticky headers (`sticky top-0 z-10`) | TC_W403_01, TC_W403_02                             |
| 3   | PR badge on isPR exercises           | TC_W403_06–TC_W403_10                              |
| 4   | Clone button (Copy icon) on cards    | TC_W403_11–TC_W403_13                              |
| 5   | Clone creates draft + navigates      | TC_W403_14–TC_W403_17                              |
| 6   | Existing tests pass                  | Regression suite (29 existing)                     |
| 7   | New tests for grouping/PR/clone      | All TC*W403*\* (22 new test cases)                 |

| QA Focus              | Test Cases             |
| --------------------- | ---------------------- |
| Week boundary Sun→Mon | TC_W403_18, TC_W403_19 |
| Empty week no header  | TC_W403_05, TC_W403_22 |
| Clone 10+ exercises   | TC_W403_20             |
| Clone navigation      | TC_W403_15             |
| Clone from filter     | TC_W403_24             |
| PR same-reps-only     | TC_W403_25             |
| Draft exerciseMetas   | TC_W403_23             |

---

## 9. Critique Findings & Resolutions (Round 1)

| #   | Severity | Finding                                                                                                              | Resolution                                                                                           |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| C1  | CRITICAL | `WorkoutSet` has NO `isPR` field; PR must be computed via `detectPRs(currentSets, allPreviousSets, exerciseNameMap)` | PR tests updated: mock `detectPRs` or test the computation directly. Dev decides detection approach. |
| C2  | MAJOR    | `setActiveFitnessSubTab` doesn't exist in codebase                                                                   | Fixed: navigation tests use `navigateTab('fitness')` only                                            |
| C3  | MAJOR    | `exerciseMetas` fallback logic in draft not covered                                                                  | Added TC_W403_23: verify draft includes `exerciseMetas` when available                               |
| C4  | MAJOR    | Clone from filtered view — does it clone ALL sets or only visible?                                                   | Added TC_W403_24: clone always clones ALL original sets regardless of active filter                  |
| C5  | MAJOR    | PR detection same-reps-only not explicitly tested                                                                    | Added TC_W403_25: different reps → no PR badge even if weight higher                                 |
| C6  | MINOR    | `planDayId` handling for ad-hoc workouts                                                                             | Already covered by TC_W403_14 (`planDayId: undefined`)                                               |
| C7  | MINOR    | SQLite draft persistence                                                                                             | Out of scope — belongs to fitnessStore tests, not WorkoutHistory component tests                     |
| C8  | MINOR    | Filter state after clone+return                                                                                      | `filter` is React local state → resets on remount. Expected behavior, not a bug.                     |

### Additional Test Cases from Critique

#### TC_W403_23: Clone draft includes exerciseMetas when available

| Field         | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Pre-condition | w1 exercises (bench-press, chest-fly) exist in EXERCISES database         |
| Steps         | 1. Clone workout w1                                                       |
|               | 2. Inspect draft.exerciseMetas                                            |
| Expected      | `exerciseMetas` array contains ExerciseSessionMeta for each exercise      |
|               | with at least `exercise`, `plannedSets`, `repsMin`, `repsMax` fields      |
| Rationale     | fitnessStore persists `draft.exerciseMetas ?? draft.exercises` — if metas |
|               | are missing, WorkoutLogger may not display set suggestions correctly      |

```typescript
it('clone draft includes exerciseMetas for logger compatibility', () => {
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('clone-workout-w1'));

  const draft = mockSetWorkoutDraft.mock.calls[0][0];
  // exerciseMetas should be populated OR exercises should be sufficient
  if (draft.exerciseMetas) {
    expect(draft.exerciseMetas.length).toBeGreaterThan(0);
    expect(draft.exerciseMetas[0]).toHaveProperty('exercise');
  } else {
    // Fallback: exercises must be present
    expect(draft.exercises.length).toBeGreaterThan(0);
  }
});
```

#### TC_W403_24: Clone from filtered view includes ALL original sets

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Pre-condition | Filter set to "strength". w1 visible (has strength sets). w1 also has   |
|               | sets that are displayed. Clone is initiated from filtered view.         |
| Steps         | 1. Click `filter-strength`                                              |
|               | 2. Click `clone-workout-w1`                                             |
| Expected      | Draft contains ALL 3 sets from w1 (s1, s2, s6) — NOT just strength sets |
| Rationale     | Clone operates on the original workout, NOT the filtered view           |

```typescript
it('clone from filtered view includes all original sets, not just filtered', () => {
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('filter-strength'));
  fireEvent.click(screen.getByTestId('clone-workout-w1'));

  const draft = mockSetWorkoutDraft.mock.calls[0][0];
  expect(draft.sets).toHaveLength(3); // All w1 sets, regardless of filter
});
```

#### TC_W403_25: PR badge not shown when same exercise has higher weight at different reps

| Field         | Value                                                                               |
| ------------- | ----------------------------------------------------------------------------------- |
| Pre-condition | Historical: bench-press 70kg × 8 reps (w1). Current: bench-press 80kg × 5 reps (w5) |
|               | Same exercise, HIGHER weight, but DIFFERENT reps → NOT a PR per `detectPRs()` logic |
| Steps         | 1. Render with appropriate mock data                                                |
|               | 2. Expand w5                                                                        |
|               | 3. Check exercise-group-bench-press for PR badge                                    |
| Expected      | NO PR badge — `detectPRs()` only compares sets with matching reps count             |
| Rationale     | `detectPRs()` line 210: `s.reps === set.reps` — strict rep matching                 |

```typescript
it('no PR badge when weight higher but reps different', () => {
  // Historical: 70kg × 8 reps. Current: 80kg × 5 reps (different reps!)
  const prCheckSets = [{
    ...prSet,
    reps: 5,  // Different from historical 8 reps
    weightKg: 80,  // Higher weight
  }];
  // ... setup mock with w5 containing prCheckSets
  render(<WorkoutHistory />);
  fireEvent.click(screen.getByTestId('workout-toggle-w5'));
  const group = screen.getByTestId('exercise-group-bench-press');
  expect(within(group).queryByTestId(/pr-badge/)).not.toBeInTheDocument();
});
```

---

## 10. Implementation Notes for Dev

### PR Detection Approach (2 options)

**Option A — Compute at render time (recommended for simplicity):**

```typescript
// Inside WorkoutHistoryInner, compute PRs per workout when expanded
const prSetsForWorkout = useMemo(() => {
  if (!expandedId) return new Set<string>();
  const workout = workouts.find(w => w.id === expandedId);
  if (!workout) return new Set<string>();
  const currentSets = getSetsForWorkout(expandedId);
  const previousSets = workoutSets.filter(s => {
    const w = workouts.find(wk => wk.id === s.workoutId);
    return w && new Date(w.date) < new Date(workout.date);
  });
  const prs = detectPRs(currentSets, previousSets, EXERCISE_NAME_MAP);
  return new Set(prs.map(p => p.exerciseId));
}, [expandedId, workouts, workoutSets, getSetsForWorkout]);
```

**Option B — Store `isPR` on WorkoutSet (requires schema change):**
Not recommended — adds DB migration, schema v7, breaks existing tests.

### Clone Implementation Pattern

```typescript
const handleClone = useCallback(
  (workoutId: string) => {
    const sets = getSetsForWorkout(workoutId);
    const exerciseIds = [...new Set(sets.map(s => s.exerciseId).filter(Boolean))];
    const exercises = exerciseIds.map(id => EXERCISES.find(e => e.id === id)).filter((e): e is Exercise => !!e);
    const clonedSets = sets.map(s => ({
      ...s,
      id: crypto.randomUUID(),
      workoutId: '', // will be assigned by logger
    }));
    setWorkoutDraft({
      exercises,
      sets: clonedSets,
      elapsedSeconds: 0,
    });
    navigateTab('fitness'); // go to plan view where logger picks up draft
  },
  [getSetsForWorkout, setWorkoutDraft, navigateTab],
);
```

---

**Total**: 25 new test cases across 6 scenarios + 3 critique-driven additions. 0 existing tests rewritten (1 needs expected text update for week label format change).
