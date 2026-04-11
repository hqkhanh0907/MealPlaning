# TEST PLAN: W3-05 — WorkoutLogger Integration (Rewire)

**Status**: TEST_PLAN_READY
**Author**: QA Agent
**Date**: 2026-07-15
**Scope**: Rewire WorkoutLogger.tsx to use WorkoutCompletionCard, enhanced RestTimer, and verify ExerciseWorkoutCard integration

---

## 1. OVERVIEW

### 1.1 What Changes

| #   | Change                                  | Old                                                                              | New                                                                                                                             |
| --- | --------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Summary card on completion              | `<WorkoutSummaryCard>` (testid: `workout-summary-card`)                          | `<WorkoutCompletionCard>` (testid: `workout-completion-card`)                                                                   |
| C2  | Summary card props signature            | `durationSeconds, totalVolume, setsCompleted, personalRecords, onSave, isSaving` | `stats: WorkoutStats, personalRecords?: PRDetection[], streakMilestone?, sessionMilestone?, isFirstWorkout?, onSave, onDiscard` |
| C3  | Save button testid                      | `save-workout-button`                                                            | `btn-save-workout`                                                                                                              |
| C4  | PR data format                          | `{ exerciseName, weight }`                                                       | `PRDetection { exerciseId, exerciseName, newWeight, previousWeight, reps, improvement }`                                        |
| C5  | Discard option                          | None (only Save)                                                                 | `onDiscard` prop, testid `btn-discard-workout`                                                                                  |
| C6  | Empty workout handling                  | Not supported                                                                    | Shows empty state (testid `empty-workout`) when totalSets === 0                                                                 |
| C7  | RestTimer enhanced features             | `durationSeconds, onComplete, onSkip`                                            | + `onAddTime?, isVisible?` — pause/resume internal, SVG ring, +30s                                                              |
| C8  | RestTimer mock needs update             | Mock renders Skip + Done buttons only                                            | Mock must include Pause, +30s, SVG ring testids                                                                                 |
| C9  | ExerciseWorkoutCard `onCopyPrevSession` | Already wired in W3-02                                                           | Verify pass-through from WorkoutLogger                                                                                          |

### 1.2 Test Strategy

- **Mock child components**: RestTimer, ExerciseSelector, SwapExerciseSheet, SetEditor, NextExercisePreview (same as current approach)
- **WorkoutCompletionCard**: Mock to capture props — verify correct data mapping
- **RestTimer mock**: Update to expose pause/+30s/skip/done buttons and new testids
- **Focus**: Props mapping correctness, not child rendering (children have their own test suites)

### 1.3 Files Modified

- `src/__tests__/WorkoutLogger.test.tsx` — All changes below

---

## 2. MOCK UPDATES REQUIRED

### 2.1 Replace WorkoutSummaryCard Mock → WorkoutCompletionCard Mock

```typescript
// OLD mock (REMOVE):
vi.mock('../features/fitness/components/WorkoutSummaryCard', () => ({
  WorkoutSummaryCard: vi.fn((props: {...}) => <div data-testid="workout-summary-card">...</div>),
}));

// NEW mock (ADD):
vi.mock('../features/fitness/components/WorkoutCompletionCard', () => ({
  WorkoutCompletionCard: vi.fn((props: {
    stats: { duration: number; totalVolume: number; totalSets: number; exerciseCount: number };
    personalRecords?: Array<{ exerciseId: string; exerciseName: string; newWeight: number; previousWeight: number; reps: number; improvement: number }>;
    streakMilestone?: number;
    sessionMilestone?: number;
    isFirstWorkout?: boolean;
    onSave: () => void;
    onDiscard: () => void;
  }) => (
    <div data-testid="workout-completion-card">
      <span data-testid="stat-duration">{props.stats.duration}m</span>
      <span data-testid="stat-volume">{props.stats.totalVolume}kg</span>
      <span data-testid="stat-sets">{props.stats.totalSets}</span>
      <span data-testid="stat-exercises">{props.stats.exerciseCount}</span>
      {props.personalRecords?.map(pr => (
        <span key={pr.exerciseId} data-testid="pr-item">{pr.exerciseName} +{pr.improvement}kg</span>
      ))}
      {props.streakMilestone && <span data-testid="streak-milestone">{props.streakMilestone}</span>}
      {props.sessionMilestone && <span data-testid="session-milestone">{props.sessionMilestone}</span>}
      <button type="button" data-testid="btn-save-workout" onClick={props.onSave} disabled={false}>Save</button>
      <button type="button" data-testid="btn-discard-workout" onClick={props.onDiscard}>Discard</button>
    </div>
  )),
}));
```

### 2.2 Update RestTimer Mock

```typescript
// OLD mock (REMOVE):
vi.mock('../features/fitness/components/RestTimer', () => ({
  RestTimer: vi.fn((props: { onComplete: () => void; onSkip: () => void }) => (
    <div data-testid="rest-timer">
      <button type="button" onClick={props.onSkip}>Skip</button>
      <button type="button" onClick={props.onComplete}>Done</button>
    </div>
  )),
}));

// NEW mock (REPLACE):
vi.mock('../features/fitness/components/RestTimer', () => ({
  RestTimer: vi.fn((props: {
    durationSeconds: number;
    onComplete: () => void;
    onSkip: () => void;
    onAddTime?: (seconds: number) => void;
    isVisible?: boolean;
  }) => (
    props.isVisible === false ? null : (
      <div data-testid="rest-timer" role="alertdialog">
        <span data-testid="timer-display">{props.durationSeconds}</span>
        <button type="button" data-testid="pause-button" onClick={() => {}}>Pause</button>
        <button type="button" data-testid="add-time-button" onClick={() => props.onAddTime?.(30)}>+30s</button>
        <button type="button" data-testid="skip-button" onClick={props.onSkip}>Skip</button>
        <button type="button" onClick={props.onComplete}>Done</button>
      </div>
    )
  )),
}));
```

### 2.3 Import Updates in WorkoutLogger.tsx (Dev task)

```typescript
// OLD:
import { WorkoutSummaryCard } from './WorkoutSummaryCard';

// NEW:
import { WorkoutCompletionCard } from './WorkoutCompletionCard';
import type { WorkoutStats } from './WorkoutCompletionCard';
```

---

## 3. TEST CASES — WorkoutCompletionCard Integration

### 3.1 TC_COMP_01: Renders WorkoutCompletionCard on finish (replaces WorkoutSummaryCard)

**Pre-conditions**: WorkoutLogger rendered with planDay  
**Steps**:

1. Click `finish-button`  
   **Expected**:

- `workout-completion-card` is in the document
- `workout-summary-card` is NOT in the document (old component gone)

```typescript
it('TC_COMP_01: renders WorkoutCompletionCard on finish', () => {
  render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
  fireEvent.click(screen.getByTestId('finish-button'));
  expect(screen.getByTestId('workout-completion-card')).toBeInTheDocument();
  expect(screen.queryByTestId('workout-summary-card')).not.toBeInTheDocument();
});
```

### 3.2 TC_COMP_02: Stats props mapped correctly (duration, volume, sets, exerciseCount)

**Pre-conditions**: WorkoutLogger with 1 exercise, 2 sets logged, elapsed 65s  
**Steps**:

1. Log set: 50kg × 10 reps → skip rest
2. Log set: 50kg × 10 reps → skip rest
3. Advance timer 65 seconds
4. Click `finish-button`  
   **Expected**:

- `stat-duration` shows `1m` (Math.floor(65/60) = 1)
- `stat-volume` shows `1000kg` (50×10 + 50×10)
- `stat-sets` shows `2`
- `stat-exercises` shows `1` (unique exercise count)

```typescript
it('TC_COMP_02: maps stats props correctly to WorkoutCompletionCard', () => {
  render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

  logSetAndDismissRest('50', '10');
  logSetAndDismissRest('50', '10');

  act(() => { vi.advanceTimersByTime(65000); });

  fireEvent.click(screen.getByTestId('finish-button'));

  const card = screen.getByTestId('workout-completion-card');
  expect(within(card).getByTestId('stat-duration')).toHaveTextContent('1m');
  expect(within(card).getByTestId('stat-volume')).toHaveTextContent('1000kg');
  expect(within(card).getByTestId('stat-sets')).toHaveTextContent('2');
  expect(within(card).getByTestId('stat-exercises')).toHaveTextContent('1');
});
```

### 3.3 TC_COMP_03: exerciseCount counts DISTINCT exercises in multi-exercise workout

**Pre-conditions**: Multi-exercise plan (bench-press + squat), 1 set per exercise  
**Steps**:

1. Log 1 set for bench-press → skip rest
2. Navigate to squat → log 1 set → skip rest
3. Click `finish-button`  
   **Expected**:

- `stat-exercises` shows `2`
- `stat-sets` shows `2`

```typescript
it('TC_COMP_03: exerciseCount counts distinct exercises', () => {
  const multiPlan = {
    dayOfWeek: 1,
    workoutType: 'Full Body',
    exercises: makeExercisesJson('bench-press', 'squat'),
  };
  render(<WorkoutLogger {...defaultProps} planDay={multiPlan} />);

  logSetAndDismissRest('80', '5');
  navigateToNext();
  logSetAndDismissRest('100', '8');

  fireEvent.click(screen.getByTestId('finish-button'));

  const card = screen.getByTestId('workout-completion-card');
  expect(within(card).getByTestId('stat-exercises')).toHaveTextContent('2');
  expect(within(card).getByTestId('stat-sets')).toHaveTextContent('2');
});
```

### 3.4 TC_COMP_04: Personal records passed as PRDetection[] format

**Pre-conditions**: Previous workout sets exist, current set beats previous weight  
**Steps**:

1. Mock `useFitnessStore.getState()` to include `workoutSets` with previous bench press data
2. Log a heavier set
3. Click `finish-button`  
   **Expected**:

- `pr-item` is visible
- PR data includes `exerciseName`, `improvement` (weight difference)

```typescript
it('TC_COMP_04: passes PRDetection[] to WorkoutCompletionCard', () => {
  const previousSets = [
    { id: 's1', workoutId: 'w1', exerciseId: 'bench-press', setNumber: 1, reps: 5, weightKg: 80, updatedAt: '' },
  ];
  (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(() => ({
    workoutDraft: null,
    workoutSets: previousSets,
  }));

  render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

  logSetAndDismissRest('85', '5');  // beats previous 80kg

  fireEvent.click(screen.getByTestId('finish-button'));

  const card = screen.getByTestId('workout-completion-card');
  expect(within(card).getByTestId('pr-item')).toBeInTheDocument();
  expect(within(card).getByTestId('pr-item')).toHaveTextContent('Đẩy tạ nằm');
  expect(within(card).getByTestId('pr-item')).toHaveTextContent('+5kg');
});
```

### 3.5 TC_COMP_05: Save button uses new testid `btn-save-workout`

**Pre-conditions**: Summary shown  
**Steps**:

1. Click `finish-button` → click `btn-save-workout`  
   **Expected**:

- `mockSaveWorkoutAtomic` called
- `onComplete` called
- `clearWorkoutDraft` called

```typescript
it('TC_COMP_05: save via btn-save-workout triggers atomic save', async () => {
  const onComplete = vi.fn();
  render(<WorkoutLogger {...defaultProps} onComplete={onComplete} planDay={planDayWithExercises} />);

  logSetAndDismissRest('80', '5');
  fireEvent.click(screen.getByTestId('finish-button'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('btn-save-workout'));
  });

  expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
  expect(mockClearWorkoutDraft).toHaveBeenCalledTimes(1);
  expect(onComplete).toHaveBeenCalledTimes(1);
});
```

### 3.6 TC_COMP_06: Discard button calls onBack + clears draft

**Pre-conditions**: Summary shown with no sets  
**Steps**:

1. Click `finish-button`
2. Click `btn-discard-workout`  
   **Expected**:

- `clearWorkoutDraft` called
- `onBack` called
- `saveWorkoutAtomic` NOT called

```typescript
it('TC_COMP_06: discard workout clears draft and calls onBack', () => {
  render(<WorkoutLogger {...defaultProps} />);

  fireEvent.click(screen.getByTestId('finish-button'));
  fireEvent.click(screen.getByTestId('btn-discard-workout'));

  expect(mockClearWorkoutDraft).toHaveBeenCalledTimes(1);
  expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  expect(mockSaveWorkoutAtomic).not.toHaveBeenCalled();
});
```

### 3.7 TC_COMP_07: Empty workout (0 sets) shows empty state with discard

**Pre-conditions**: No exercises or sets logged  
**Steps**:

1. Click `finish-button` (no sets logged)  
   **Expected**:

- If WorkoutCompletionCard receives `stats.totalSets === 0`, it shows `empty-workout` state
- `btn-discard-empty` OR `btn-discard-workout` is available

```typescript
it('TC_COMP_07: empty workout shows discard option', () => {
  render(<WorkoutLogger {...defaultProps} />);
  fireEvent.click(screen.getByTestId('finish-button'));

  // WorkoutCompletionCard with 0 sets shows empty state
  const card = screen.getByTestId('workout-completion-card');
  expect(card).toBeInTheDocument();
  // stats.totalSets = 0 → component shows empty-workout internally
});
```

### 3.8 TC_COMP_08: Freestyle name input still shown before WorkoutCompletionCard

**Pre-conditions**: No planDay (freestyle)  
**Steps**:

1. Click `finish-button`  
   **Expected**:

- `freestyle-name-section` is in the document
- `freestyle-name-input` is in the document
- `workout-completion-card` is ALSO in the document

```typescript
it('TC_COMP_08: freestyle name input shown alongside WorkoutCompletionCard', () => {
  render(<WorkoutLogger {...defaultProps} />);
  fireEvent.click(screen.getByTestId('finish-button'));

  expect(screen.getByTestId('freestyle-name-input')).toBeInTheDocument();
  expect(screen.getByTestId('workout-completion-card')).toBeInTheDocument();
});
```

### 3.9 TC_COMP_09: Freestyle name input NOT shown when planDay provided

**Pre-conditions**: planDay with exercises  
**Steps**:

1. Click `finish-button`  
   **Expected**:

- `freestyle-name-input` NOT in document
- `workout-completion-card` in document

```typescript
it('TC_COMP_09: no freestyle name input when planDay provided', () => {
  render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
  fireEvent.click(screen.getByTestId('finish-button'));

  expect(screen.queryByTestId('freestyle-name-input')).not.toBeInTheDocument();
  expect(screen.getByTestId('workout-completion-card')).toBeInTheDocument();
});
```

---

## 4. TEST CASES — RestTimer Enhanced Features

### 4.1 TC_REST_01: RestTimer receives onAddTime prop

**Pre-conditions**: Exercise loaded  
**Steps**:

1. Click `confirm-set-btn` to log set  
   **Expected**:

- RestTimer mock rendered
- `add-time-button` is in the document

```typescript
it('TC_REST_01: RestTimer has add-time button', () => {
  render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
  fireEvent.click(screen.getByTestId('confirm-set-btn'));
  expect(screen.getByTestId('rest-timer')).toBeInTheDocument();
  expect(screen.getByTestId('add-time-button')).toBeInTheDocument();
});
```

### 4.2 TC_REST_02: RestTimer receives pause-button

**Pre-conditions**: Set logged, rest timer visible  
**Steps**:

1. Log set → rest timer shows  
   **Expected**:

- `pause-button` is in the document

```typescript
it('TC_REST_02: RestTimer has pause button', () => {
  render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
  fireEvent.click(screen.getByTestId('confirm-set-btn'));
  expect(screen.getByTestId('pause-button')).toBeInTheDocument();
});
```

### 4.3 TC_REST_03: RestTimer receives correct durationSeconds from exercise meta

**Pre-conditions**: Exercise with restSeconds = 180  
**Steps**:

1. Render with plan that specifies restSeconds: 180
2. Log set  
   **Expected**:

- RestTimer mock receives `durationSeconds=180`
- `timer-display` shows `180`

```typescript
it('TC_REST_03: RestTimer receives exercise restSeconds', () => {
  const planWithCustomRest = {
    dayOfWeek: 1,
    workoutType: 'Push',
    exercises: JSON.stringify([{
      exercise: {
        id: 'bench-press', nameVi: 'Đẩy tạ nằm', nameEn: 'Bench Press',
        muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'arms'],
        category: 'compound', equipment: ['barbell'], contraindicated: [],
        exerciseType: 'strength', defaultRepsMin: 8, defaultRepsMax: 12,
        isCustom: false, updatedAt: '2025-01-01',
      },
      sets: 3, repsMin: 8, repsMax: 12, restSeconds: 180,
    }]),
  };
  render(<WorkoutLogger {...defaultProps} planDay={planWithCustomRest} />);
  fireEvent.click(screen.getByTestId('confirm-set-btn'));
  expect(screen.getByTestId('timer-display')).toHaveTextContent('180');
});
```

### 4.4 TC_REST_04: Skip button hides rest timer (regression)

**Pre-conditions**: Rest timer visible  
**Steps**:

1. Log set → rest timer shows
2. Click `skip-button`  
   **Expected**:

- `rest-timer` not in document

```typescript
it('TC_REST_04: skip button hides rest timer (regression)', () => {
  render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
  fireEvent.click(screen.getByTestId('confirm-set-btn'));
  expect(screen.getByTestId('rest-timer')).toBeInTheDocument();

  fireEvent.click(screen.getByTestId('skip-button'));
  expect(screen.queryByTestId('rest-timer')).not.toBeInTheDocument();
});
```

### 4.5 TC_REST_05: Done button hides rest timer (regression)

**Pre-conditions**: Rest timer visible  
**Steps**:

1. Log set → rest timer shows
2. Click `Done` (onComplete)  
   **Expected**:

- `rest-timer` not in document

```typescript
it('TC_REST_05: onComplete hides rest timer (regression)', () => {
  render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
  fireEvent.click(screen.getByTestId('confirm-set-btn'));
  expect(screen.getByTestId('rest-timer')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Done'));
  expect(screen.queryByTestId('rest-timer')).not.toBeInTheDocument();
});
```

### 4.6 TC_REST_06: RestTimer receives DEFAULT_REST_SECONDS when exercise has no restSeconds

**Pre-conditions**: Exercise without explicit restSeconds  
**Steps**:

1. Add exercise via selector (no restSeconds in meta)
2. Log set  
   **Expected**:

- `timer-display` shows DEFAULT_REST_SECONDS value (90)

```typescript
it('TC_REST_06: uses DEFAULT_REST_SECONDS when meta has no restSeconds', () => {
  render(<WorkoutLogger {...defaultProps} />);

  // Add exercise via selector → gets DEFAULT_REST_SECONDS
  fireEvent.click(screen.getByTestId('add-exercise-bottom-btn'));
  fireEvent.click(screen.getByText('Select'));
  fireEvent.click(screen.getByTestId('confirm-set-btn'));

  expect(screen.getByTestId('timer-display')).toHaveTextContent(String(DEFAULT_REST_SECONDS));
});
```

---

## 5. TEST CASES — Full Workout Flow (End-to-End Integration)

### 5.1 TC_FLOW_01: Start → Log sets → Rest → Navigate → Complete → Save

**Pre-conditions**: Multi-exercise plan  
**Steps**:

1. Render with 2 exercises (bench-press + squat)
2. Log set for bench-press: 80kg × 5 → skip rest
3. Navigate to squat
4. Log set for squat: 100kg × 8 → skip rest
5. Click `finish-button`
6. Click `btn-save-workout`  
   **Expected**:

- `saveWorkoutAtomic` called with correct workout + sets
- Both sets have same workoutId
- `clearWorkoutDraft` called
- `onComplete` called

```typescript
it('TC_FLOW_01: full flow start→log→rest→navigate→complete→save', async () => {
  const onComplete = vi.fn();
  const multiPlan = {
    dayOfWeek: 1,
    workoutType: 'Full Body',
    exercises: makeExercisesJson('bench-press', 'squat'),
  };
  render(<WorkoutLogger {...defaultProps} onComplete={onComplete} planDay={multiPlan} />);

  logSetAndDismissRest('80', '5');
  navigateToNext();
  logSetAndDismissRest('100', '8');

  fireEvent.click(screen.getByTestId('finish-button'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('btn-save-workout'));
  });

  expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
  const savedWorkout = mockSaveWorkoutAtomic.mock.calls[0][0];
  const savedSets = mockSaveWorkoutAtomic.mock.calls[0][1];
  expect(savedSets).toHaveLength(2);
  expect(savedSets[0].workoutId).toBe(savedWorkout.id);
  expect(savedSets[1].workoutId).toBe(savedWorkout.id);
  expect(mockClearWorkoutDraft).toHaveBeenCalledTimes(1);
  expect(onComplete).toHaveBeenCalledTimes(1);
});
```

### 5.2 TC_FLOW_02: Save failure does NOT clear draft (BR-19 atomic save)

**Pre-conditions**: Save will fail  
**Steps**:

1. Mock `saveWorkoutAtomic` to reject
2. Log set, finish, click save  
   **Expected**:

- Error notification shown
- `clearWorkoutDraft` NOT called (draft preserved for retry)
- `onComplete` NOT called

```typescript
it('TC_FLOW_02: save failure preserves draft (BR-19)', async () => {
  mockSaveWorkoutAtomic.mockRejectedValueOnce(new Error('DB error'));
  const onComplete = vi.fn();
  render(<WorkoutLogger {...defaultProps} onComplete={onComplete} planDay={planDayWithExercises} />);

  logSetAndDismissRest('80', '8');
  fireEvent.click(screen.getByTestId('finish-button'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('btn-save-workout'));
  });

  expect(mockNotify.error).toHaveBeenCalledWith(expect.any(String));
  expect(mockClearWorkoutDraft).not.toHaveBeenCalled();
  expect(onComplete).not.toHaveBeenCalled();
});
```

### 5.3 TC_FLOW_03: Draft auto-save still works (BR-20)

**Pre-conditions**: Exercise loaded  
**Steps**:

1. Log a set → skip rest
2. Advance timer 500ms (debounce)  
   **Expected**:

- `setWorkoutDraft` called with exercise data and sets

```typescript
it('TC_FLOW_03: draft auto-save works after logging set (BR-20)', () => {
  render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

  logSetAndDismissRest('50', '8');

  act(() => { vi.advanceTimersByTime(500); });

  expect(mockSetWorkoutDraft).toHaveBeenCalledWith(
    expect.objectContaining({
      sets: expect.arrayContaining([
        expect.objectContaining({ exerciseId: 'bench-press', weightKg: 50, reps: 8 }),
      ]),
    }),
  );
});
```

---

## 6. TEST CASES — Draft Recovery with New Components

### 6.1 TC_DRAFT_COMP_01: Draft recovery shows WorkoutCompletionCard-compatible data on finish

**Pre-conditions**: Draft with 1 exercise and 1 set  
**Steps**:

1. Set mock draft state
2. Render WorkoutLogger
3. Click `finish-button`  
   **Expected**:

- `workout-completion-card` shows with correct stats from draft data

```typescript
it('TC_DRAFT_COMP_01: draft recovery works with new completion card', () => {
  const draft = {
    exercises: [{
      id: 'bench-press', nameVi: 'Đẩy tạ nằm', nameEn: 'Bench Press',
      muscleGroup: 'chest', secondaryMuscles: ['shoulders', 'arms'],
      category: 'compound', equipment: ['barbell'], contraindicated: [],
      exerciseType: 'strength', defaultRepsMin: 8, defaultRepsMax: 12,
      isCustom: false, updatedAt: '2025-01-01T00:00:00.000Z',
    }],
    sets: [{
      id: 'set-draft-1', workoutId: '', exerciseId: 'bench-press',
      setNumber: 1, reps: 10, weightKg: 60, updatedAt: '2025-01-01T00:00:00.000Z',
    }],
    elapsedSeconds: 120,
  };
  (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(() => ({ workoutDraft: draft }));

  render(<WorkoutLogger {...defaultProps} />);

  expect(screen.getByTestId('exercise-workout-card')).toBeInTheDocument();
  expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('02:00');

  fireEvent.click(screen.getByTestId('finish-button'));
  expect(screen.getByTestId('workout-completion-card')).toBeInTheDocument();
  expect(within(screen.getByTestId('workout-completion-card')).getByTestId('stat-sets')).toHaveTextContent('1');
});
```

---

## 7. TEST CASES — Back Button During Workout

### 7.1 TC_BACK_01: Back clears draft and calls onBack

**Pre-conditions**: WorkoutLogger rendered  
**Steps**:

1. Click `back-button`  
   **Expected**:

- `clearWorkoutDraft` called
- `onBack` called

```typescript
it('TC_BACK_01: back button clears draft and navigates (regression)', () => {
  render(<WorkoutLogger {...defaultProps} />);
  fireEvent.click(screen.getByTestId('back-button'));
  expect(mockClearWorkoutDraft).toHaveBeenCalledTimes(1);
  expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
});
```

### 7.2 TC_BACK_02: Back during active workout still clears draft

**Pre-conditions**: Exercise loaded, sets logged  
**Steps**:

1. Log 2 sets
2. Click `back-button`  
   **Expected**:

- `clearWorkoutDraft` called (logged work discarded)
- `onBack` called

```typescript
it('TC_BACK_02: back during active workout clears draft', () => {
  render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
  logSetAndDismissRest('60', '10');
  logSetAndDismissRest('65', '8');
  fireEvent.click(screen.getByTestId('back-button'));
  expect(mockClearWorkoutDraft).toHaveBeenCalledTimes(1);
  expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
});
```

---

## 8. TEST CASES — ExerciseWorkoutCard Integration Verification

### 8.1 TC_EWC_01: onCopyLastSet passes through to ExerciseWorkoutCard

**Pre-conditions**: 1 set logged  
**Steps**:

1. Log set: 60kg × 10
2. Click `btn-copy-last-set`  
   **Expected**:

- Weight input = 60, Reps input = 10 (copied from last set)

```typescript
it('TC_EWC_01: copy-last-set still works through rewired logger (regression)', () => {
  render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
  logSetAndDismissRest('60', '10');
  fireEvent.click(screen.getByTestId('btn-copy-last-set'));

  const card = screen.getByTestId('exercise-workout-card');
  expect((within(card).getByTestId('weight-input') as HTMLInputElement).value).toBe('60');
  expect((within(card).getByTestId('reps-input') as HTMLInputElement).value).toBe('10');
});
```

### 8.2 TC_EWC_02: Overload suggestion chip applies values

**Pre-conditions**: Progressive overload returns suggestion  
**Steps**:

1. Mock `suggestNextSet` to return weight=62.5, reps=5
2. Click `btn-overload-suggestion`  
   **Expected**:

- Weight input = 62.5, Reps input = 5

```typescript
it('TC_EWC_02: overload suggestion applies to inputs (regression)', () => {
  mockSuggestNextSet.mockReturnValue({ weight: 62.5, reps: 5, source: 'progressive_overload' });
  render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

  fireEvent.click(screen.getByTestId('btn-overload-suggestion'));

  const card = screen.getByTestId('exercise-workout-card');
  expect((within(card).getByTestId('weight-input') as HTMLInputElement).value).toBe('62.5');
  expect((within(card).getByTestId('reps-input') as HTMLInputElement).value).toBe('5');
});
```

### 8.3 TC_EWC_03: lastSessionSet prop wired from getLastSets hook

**Pre-conditions**: getLastSets returns previous session data  
**Steps**: Verify `ExerciseWorkoutCard` receives `lastSessionSet` prop  
**Expected**:

- If `getLastSets` returns data and no sets logged, `btn-copy-prev-session` appears
- Note: ExerciseWorkoutCard mock already renders this based on props

> **Implementation note for Dev**: This test verifies the mock's `getLastSets` return value is correctly mapped to `lastSessionSet` prop. The mock needs to be configured to return non-empty data.

---

## 9. TEST CASES — Regression Suite (Existing Tests That Must Still Pass)

All tests below must pass WITHOUT modification (they test unchanged behavior):

| Existing Test ID                                | Description        | Notes                                                                        |
| ----------------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| `renders header with back button and timer`     | Header structure   | No changes needed                                                            |
| `increments elapsed timer each second`          | Timer accuracy     | No changes needed                                                            |
| `shows planned exercise when planDay provided`  | Exercise display   | No changes needed                                                            |
| `shows empty state when no exercises`           | Empty state        | No changes needed                                                            |
| `can log a set with weight and reps`            | Set logging        | No changes needed                                                            |
| `shows rest timer after logging a set`          | Rest timer trigger | Mock update changes button text → update assertions                          |
| `hides rest timer on skip`                      | Skip behavior      | **UPDATE**: `screen.getByText('Skip')` → `screen.getByTestId('skip-button')` |
| `hides rest timer on complete`                  | Complete behavior  | **UPDATE**: `screen.getByText('Done')` stays (mock still has text)           |
| `opens exercise selector on add exercise click` | Selector open      | No changes needed                                                            |
| `adds selected exercise from selector`          | Selector flow      | No changes needed                                                            |
| `shows summary on finish`                       | Summary render     | **UPDATE**: testid `workout-summary-card` → `workout-completion-card`        |
| `shows correct duration and volume in summary`  | Summary data       | **UPDATE**: testid + text format changes                                     |
| `calls onComplete on save`                      | Save flow          | **UPDATE**: `save-workout-button` → `btn-save-workout`                       |
| All TC*DRAFT*\*                                 | Draft persistence  | No changes needed                                                            |
| All TC*SET*\*                                   | Set CRUD           | No changes needed                                                            |
| All TC*COPY*\*                                  | Copy last set      | No changes needed                                                            |
| All TC*SWAP*\*                                  | Swap exercise      | No changes needed                                                            |
| All stepper tests                               | Weight/reps ±      | No changes needed                                                            |

### 9.1 Tests Requiring TestID Updates

These existing tests need search-and-replace for testid changes:

```
OLD → NEW:
'workout-summary-card' → 'workout-completion-card'
'save-workout-button' → 'btn-save-workout'
screen.getByText('Skip') → screen.getByTestId('skip-button')  (in rest timer dismiss tests)
```

### 9.2 Tests Requiring Assertion Updates

```typescript
// OLD (summary shows "Tổng kết buổi tập"):
expect(screen.getByText('Tổng kết buổi tập')).toBeInTheDocument();

// NEW (completion card shows different content — verify by testid):
expect(screen.getByTestId('workout-completion-card')).toBeInTheDocument();
```

```typescript
// OLD (summary shows "1,000 kg" as text):
expect(summary).toHaveTextContent('1,000 kg');

// NEW (stat-volume shows "1000kg"):
expect(within(card).getByTestId('stat-volume')).toHaveTextContent('1000kg');
```

---

## 10. SUMMARY — Test Count & Coverage

| Category                          | New Tests            | Updated Tests | Total   |
| --------------------------------- | -------------------- | ------------- | ------- |
| WorkoutCompletionCard integration | 9 (TC_COMP_01→09)    | 0             | 9       |
| RestTimer enhanced                | 6 (TC_REST_01→06)    | 0             | 6       |
| Full workout flow                 | 3 (TC_FLOW_01→03)    | 0             | 3       |
| Draft recovery + new components   | 1 (TC_DRAFT_COMP_01) | 0             | 1       |
| Back button                       | 2 (TC_BACK_01→02)    | 0             | 2       |
| ExerciseWorkoutCard verification  | 3 (TC_EWC_01→03)     | 0             | 3       |
| Regression (testid updates)       | 0                    | ~8            | 8       |
| **TOTAL**                         | **24**               | **~8**        | **~32** |

### Dev Implementation Checklist

1. [ ] Replace `import { WorkoutSummaryCard }` → `import { WorkoutCompletionCard, type WorkoutStats }`
2. [ ] Build `WorkoutStats` object: `{ duration: Math.floor(elapsedRef.current / 60), totalVolume, totalSets: loggedSets.length, exerciseCount: new Set(loggedSets.map(s => s.exerciseId)).size }`
3. [ ] Convert `detectedPRs` from `{ exerciseName, weight }[]` to `PRDetection[]` (already returned by `detectPRs()`)
4. [ ] Add `onDiscard` handler: `clearWorkoutDraft() + onBack()`
5. [ ] Wire `onAddTime` callback to RestTimer (optional — can be no-op passthrough since RestTimer manages internally)
6. [ ] Update test file: new mocks, new testids, new test cases
7. [ ] `npm run lint` → 0 errors
8. [ ] `npm run test` → 0 failures, 100% coverage on changed lines

---

## APPENDIX A — Props Mapping Reference

### WorkoutSummaryCard (OLD) → WorkoutCompletionCard (NEW)

| Old Prop          | Old Value              | New Prop              | New Value                                         |
| ----------------- | ---------------------- | --------------------- | ------------------------------------------------- |
| `durationSeconds` | `elapsedRef.current`   | `stats.duration`      | `Math.floor(elapsedRef.current / 60)`             |
| `totalVolume`     | `totalVolume`          | `stats.totalVolume`   | `totalVolume` (same)                              |
| `setsCompleted`   | `loggedSets.length`    | `stats.totalSets`     | `loggedSets.length` (same)                        |
| —                 | —                      | `stats.exerciseCount` | `new Set(loggedSets.map(s => s.exerciseId)).size` |
| `personalRecords` | `detectedPRs` (mapped) | `personalRecords`     | `detectPRs()` result directly (PRDetection[])     |
| `onSave`          | `handleSave`           | `onSave`              | `handleSave` (same)                               |
| `isSaving`        | `isSaving`             | —                     | **REMOVED** (no loading state in new card)        |
| —                 | —                      | `onDiscard`           | **NEW**: `handleDiscard` (clearDraft + onBack)    |
| —                 | —                      | `streakMilestone?`    | Optional — future feature                         |
| —                 | —                      | `sessionMilestone?`   | Optional — future feature                         |
| —                 | —                      | `isFirstWorkout?`     | Optional — future feature                         |

### RestTimer (OLD → NEW)

| Old Prop          | New Prop          | Change                                              |
| ----------------- | ----------------- | --------------------------------------------------- |
| `durationSeconds` | `durationSeconds` | Same                                                |
| `onComplete`      | `onComplete`      | Same                                                |
| `onSkip`          | `onSkip`          | Same                                                |
| —                 | `onAddTime?`      | **NEW**: Optional callback when +30s pressed        |
| —                 | `isVisible?`      | **NEW**: Optional visibility control (default true) |
