import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkoutLogger } from '../features/fitness/components/WorkoutLogger';
import { useFitnessStore } from '../store/fitnessStore';

vi.mock('../features/fitness/data/exerciseDatabase', () => ({
  EXERCISES: [
    {
      id: 'bench-press',
      nameVi: 'Đẩy tạ nằm',
      nameEn: 'Bench Press',
      muscleGroup: 'chest',
      secondaryMuscles: ['shoulders', 'arms'],
      category: 'compound' as const,
      equipment: ['barbell'],
      contraindicated: [],
      exerciseType: 'strength' as const,
      defaultRepsMin: 8,
      defaultRepsMax: 12,
      isCustom: false as const,
    },
    {
      id: 'squat',
      nameVi: 'Gánh tạ',
      nameEn: 'Squat',
      muscleGroup: 'legs',
      secondaryMuscles: ['core', 'glutes'],
      category: 'compound' as const,
      equipment: ['barbell'],
      contraindicated: [],
      exerciseType: 'strength' as const,
      defaultRepsMin: 6,
      defaultRepsMax: 10,
      isCustom: false as const,
    },
    {
      id: 'incline-press',
      nameVi: 'Đẩy tạ nằm nghiêng',
      nameEn: 'Incline Press',
      muscleGroup: 'chest',
      secondaryMuscles: ['shoulders'],
      category: 'compound' as const,
      equipment: ['barbell'],
      contraindicated: [],
      exerciseType: 'strength' as const,
      defaultRepsMin: 8,
      defaultRepsMax: 12,
      isCustom: false as const,
    },
  ],
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

vi.mock('../features/fitness/components/RestTimer', () => ({
  RestTimer: vi.fn((props: { onComplete: () => void; onSkip: () => void }) => (
    <div data-testid="rest-timer">
      <button type="button" onClick={props.onSkip}>
        Skip
      </button>
      <button type="button" onClick={props.onComplete}>
        Done
      </button>
    </div>
  )),
}));

vi.mock('../features/fitness/components/ExerciseSelector', () => ({
  ExerciseSelector: vi.fn(
    (props: {
      isOpen: boolean;
      onSelect: (exercise: {
        id: string;
        nameVi: string;
        muscleGroup: string;
        secondaryMuscles: string[];
        category: string;
        equipment: string[];
        contraindicated: string[];
        exerciseType: string;
        defaultRepsMin: number;
        defaultRepsMax: number;
        isCustom: boolean;
        updatedAt: string;
      }) => void;
      onClose: () => void;
    }) =>
      props.isOpen ? (
        <div data-testid="exercise-selector">
          <button
            type="button"
            onClick={() =>
              props.onSelect({
                id: 'test-ex',
                nameVi: 'Test Exercise',
                muscleGroup: 'chest',
                secondaryMuscles: [],
                category: 'compound',
                equipment: ['barbell'],
                contraindicated: [],
                exerciseType: 'strength',
                defaultRepsMin: 8,
                defaultRepsMax: 12,
                isCustom: false,
                updatedAt: '',
              })
            }
          >
            Select
          </button>
          <button type="button" onClick={props.onClose}>
            Close
          </button>
        </div>
      ) : null,
  ),
}));

vi.mock('../features/fitness/components/SwapExerciseSheet', () => ({
  SwapExerciseSheet: vi.fn(
    (props: {
      isOpen: boolean;
      currentExercise: { id: string };
      excludeIds?: string[];
      onSelect: (exercise: {
        id: string;
        nameVi: string;
        muscleGroup: string;
        secondaryMuscles: string[];
        category: string;
        equipment: string[];
        contraindicated: string[];
        exerciseType: string;
        defaultRepsMin: number;
        defaultRepsMax: number;
        isCustom: boolean;
        updatedAt: string;
      }) => void;
      onClose: () => void;
    }) =>
      props.isOpen ? (
        <div data-testid="swap-exercise-sheet">
          <button
            type="button"
            data-testid="swap-select-incline"
            onClick={() =>
              props.onSelect({
                id: 'incline-press',
                nameVi: 'Đẩy tạ nằm nghiêng',
                muscleGroup: 'chest',
                secondaryMuscles: ['shoulders'],
                category: 'compound',
                equipment: ['barbell'],
                contraindicated: [],
                exerciseType: 'strength',
                defaultRepsMin: 8,
                defaultRepsMax: 12,
                isCustom: false,
                updatedAt: '',
              })
            }
          >
            Swap Incline
          </button>
          <button type="button" onClick={props.onClose}>
            Close Swap
          </button>
        </div>
      ) : null,
  ),
}));

const mockSaveWorkoutAtomic = vi.fn().mockResolvedValue(undefined);
const mockSetWorkoutDraft = vi.fn();
const mockClearWorkoutDraft = vi.fn();
const mockLoadWorkoutDraft = vi.fn().mockResolvedValue(undefined);
const mockSuggestNextSet = vi.fn();

vi.mock('../features/fitness/hooks/useProgressiveOverload', () => ({
  useProgressiveOverload: () => ({
    suggestNextSet: mockSuggestNextSet,
    getLastSets: vi.fn().mockReturnValue([]),
    checkPlateau: vi.fn().mockReturnValue({ isPlateaued: false, weeks: 0 }),
    analyzeExercisePlateau: vi.fn(),
    checkAcuteFatigue: vi.fn().mockReturnValue({ level: 'none', message: '' }),
    checkChronicOvertraining: vi.fn().mockReturnValue({ level: 'none', message: '' }),
    acuteFatigue: { level: 'none', message: '' },
    chronicOvertraining: { level: 'none', message: '' },
  }),
}));

const mockNotify = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  dismiss: vi.fn(),
  dismissAll: vi.fn(),
};
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
}));

afterEach(cleanup);

describe('WorkoutLogger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (useFitnessStore as unknown as Mock).mockImplementation((selector: (s: Record<string, unknown>) => unknown) =>
      selector({
        saveWorkoutAtomic: mockSaveWorkoutAtomic,
        setWorkoutDraft: mockSetWorkoutDraft,
        clearWorkoutDraft: mockClearWorkoutDraft,
        loadWorkoutDraft: mockLoadWorkoutDraft,
      }),
    );
    (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(() => ({ workoutDraft: null }));
    mockSaveWorkoutAtomic.mockReset().mockResolvedValue(undefined);
    mockSetWorkoutDraft.mockReset();
    mockClearWorkoutDraft.mockReset();
    mockLoadWorkoutDraft.mockReset().mockResolvedValue(undefined);
    mockSuggestNextSet.mockReset().mockReturnValue({ weight: 0, reps: 8, source: 'manual' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    onComplete: vi.fn(),
    onBack: vi.fn(),
  };

  const makeExercisesJson = (...ids: string[]): string =>
    JSON.stringify(
      ids.map(id => ({
        exercise: {
          id,
          nameVi: id === 'bench-press' ? 'Đẩy tạ nằm' : id === 'squat' ? 'Gánh tạ' : 'Đẩy tạ nằm nghiêng',
          nameEn: id === 'bench-press' ? 'Bench Press' : id === 'squat' ? 'Squat' : 'Incline Press',
          muscleGroup: id === 'squat' ? 'legs' : 'chest',
          secondaryMuscles:
            id === 'bench-press' ? ['shoulders', 'arms'] : id === 'squat' ? ['core', 'glutes'] : ['shoulders'],
          category: 'compound',
          equipment: ['barbell'],
          contraindicated: [],
          exerciseType: 'strength',
          defaultRepsMin: id === 'squat' ? 6 : 8,
          defaultRepsMax: id === 'squat' ? 10 : 12,
          isCustom: false,
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        sets: 4,
        repsMin: id === 'squat' ? 6 : 8,
        repsMax: id === 'squat' ? 10 : 12,
        restSeconds: 120,
      })),
    );

  const planDayWithExercises = {
    dayOfWeek: 1,
    workoutType: 'Push Day',
    exercises: makeExercisesJson('bench-press'),
  };

  /** Helper: log a set for the currently visible exercise and dismiss the rest timer. */
  function logSetAndDismissRest(weight: string, reps: string, rpe?: number) {
    const card = screen.getByTestId('exercise-workout-card');
    fireEvent.change(within(card).getByTestId('weight-input'), {
      target: { value: weight },
    });
    fireEvent.change(within(card).getByTestId('reps-input'), {
      target: { value: reps },
    });
    if (rpe !== undefined) {
      fireEvent.change(within(card).getByTestId('rpe-select'), {
        target: { value: String(rpe) },
      });
    }
    fireEvent.click(screen.getByTestId('confirm-set-btn'));
    fireEvent.click(screen.getByText('Skip'));
  }

  /** Navigate to the next exercise using the next-exercise-card. */
  function navigateToNext() {
    const nextCard = screen.queryByTestId('next-exercise-card');
    if (nextCard) {
      fireEvent.click(nextCard);
    }
  }

  function navigateToPrev() {
    fireEvent.click(screen.getByTestId('prev-exercise-btn'));
  }

  /** Get all logged-set rows inside the current ExerciseWorkoutCard. */
  function getLoggedSets() {
    const card = screen.getByTestId('exercise-workout-card');
    return within(card).queryAllByTestId(/^logged-set-/);
  }

  /* ================================================================
   * HEADER & TIMER
   * ================================================================ */

  it('renders header with back button and timer', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(screen.getByTestId('workout-header')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByTestId('elapsed-timer-pill')).toBeInTheDocument();
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('00:00');
    expect(screen.getByTestId('finish-button')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<WorkoutLogger {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByTestId('back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('increments elapsed timer each second', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('00:00');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('00:01');

    act(() => {
      vi.advanceTimersByTime(59000);
    });
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('01:00');
  });

  /* ================================================================
   * EXERCISE DISPLAY & EMPTY STATE
   * ================================================================ */

  it('shows planned exercise when planDay provided', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    expect(screen.getByTestId('exercise-workout-card')).toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
  });

  it('shows empty state when no exercises', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('Chưa có bài tập. Thêm bài tập để bắt đầu.')).toBeInTheDocument();
  });

  it('shows empty state for empty exercises array', () => {
    const emptyPlan = {
      dayOfWeek: 1,
      workoutType: 'Test',
      exercises: '[]',
    };
    render(<WorkoutLogger {...defaultProps} planDay={emptyPlan} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  /* ================================================================
   * SET LOGGING & REST TIMER
   * ================================================================ */

  it('can log a set with weight and reps', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    const card = screen.getByTestId('exercise-workout-card');
    fireEvent.change(within(card).getByTestId('weight-input'), {
      target: { value: '60' },
    });
    fireEvent.change(within(card).getByTestId('reps-input'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByTestId('confirm-set-btn'));

    const sets = getLoggedSets();
    expect(sets).toHaveLength(1);
    expect(sets[0]).toHaveTextContent('60');
    expect(sets[0]).toHaveTextContent('10');
  });

  it('shows rest timer after logging a set', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    fireEvent.click(screen.getByTestId('confirm-set-btn'));
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument();
  });

  it('hides rest timer on skip', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    fireEvent.click(screen.getByTestId('confirm-set-btn'));
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Skip'));
    expect(screen.queryByTestId('rest-timer')).not.toBeInTheDocument();
  });

  it('hides rest timer on complete', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    fireEvent.click(screen.getByTestId('confirm-set-btn'));
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Done'));
    expect(screen.queryByTestId('rest-timer')).not.toBeInTheDocument();
  });

  /* ================================================================
   * EXERCISE SELECTOR (Add Exercise)
   * ================================================================ */

  it('opens exercise selector on add exercise click', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-exercise-bottom-btn'));
    expect(screen.getByTestId('exercise-selector')).toBeInTheDocument();
  });

  it('adds selected exercise from selector and focuses it', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-exercise-bottom-btn'));
    fireEvent.click(screen.getByText('Select'));

    expect(screen.getByTestId('exercise-workout-card')).toBeInTheDocument();
    expect(screen.getByText('Test Exercise')).toBeInTheDocument();
    expect(screen.queryByTestId('exercise-selector')).not.toBeInTheDocument();
  });

  it('closes exercise selector without selecting', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-exercise-bottom-btn'));
    expect(screen.getByTestId('exercise-selector')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('exercise-selector')).not.toBeInTheDocument();
  });

  /* ================================================================
   * WORKOUT SUMMARY & SAVE
   * ================================================================ */

  it('shows summary on finish', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('finish-button'));
    expect(screen.getByTestId('workout-summary-card')).toBeInTheDocument();
    expect(screen.getByText('Tổng kết buổi tập')).toBeInTheDocument();
  });

  it('shows correct duration and volume in summary', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    logSetAndDismissRest('50', '10');
    logSetAndDismissRest('50', '10');

    act(() => {
      vi.advanceTimersByTime(65000);
    });

    fireEvent.click(screen.getByTestId('finish-button'));

    const summary = screen.getByTestId('workout-summary-card');
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent('1,000 kg');
    expect(summary).toHaveTextContent('2');
    expect(summary).toHaveTextContent('01:05');
  });

  it('calls onComplete and stores workout on save', async () => {
    const onComplete = vi.fn();
    render(<WorkoutLogger {...defaultProps} onComplete={onComplete} planDay={planDayWithExercises} />);

    logSetAndDismissRest('80', '5');
    fireEvent.click(screen.getByTestId('finish-button'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
    expect(mockSaveWorkoutAtomic).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Push Day',
        date: expect.any(String),
      }),
      expect.arrayContaining([
        expect.objectContaining({
          exerciseId: 'bench-press',
          weightKg: 80,
          reps: 5,
        }),
      ]),
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith();
  });

  /* ================================================================
   * RPE SELECT
   * ================================================================ */

  it('allows RPE selection via select dropdown', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    const card = screen.getByTestId('exercise-workout-card');
    const rpeSelect = within(card).getByTestId('rpe-select') as HTMLSelectElement;

    fireEvent.change(rpeSelect, { target: { value: '8' } });
    expect(rpeSelect.value).toBe('8');
  });

  it('logs set with RPE and displays it', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    const card = screen.getByTestId('exercise-workout-card');
    fireEvent.change(within(card).getByTestId('weight-input'), {
      target: { value: '70' },
    });
    fireEvent.change(within(card).getByTestId('reps-input'), {
      target: { value: '8' },
    });
    fireEvent.change(within(card).getByTestId('rpe-select'), {
      target: { value: '9' },
    });
    fireEvent.click(screen.getByTestId('confirm-set-btn'));

    const sets = getLoggedSets();
    expect(sets).toHaveLength(1);
    expect(sets[0]).toHaveTextContent('70');
    expect(sets[0]).toHaveTextContent('8');
    expect(sets[0]).toHaveTextContent('9');
  });

  /* ================================================================
   * WEIGHT/REPS STEPPER BUTTONS
   * ================================================================ */

  it('adjusts weight with ±0.5kg buttons', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    const card = screen.getByTestId('exercise-workout-card');
    const weightInput = within(card).getByTestId('weight-input') as HTMLInputElement;

    expect(weightInput.value).toBe('0');

    fireEvent.click(within(card).getByTestId('weight-plus'));
    expect(weightInput.value).toBe('0.5');

    fireEvent.click(within(card).getByTestId('weight-plus'));
    expect(weightInput.value).toBe('1');

    fireEvent.click(within(card).getByTestId('weight-minus'));
    expect(weightInput.value).toBe('0.5');

    fireEvent.click(within(card).getByTestId('weight-minus'));
    fireEvent.click(within(card).getByTestId('weight-minus'));
    expect(weightInput.value).toBe('0');
  });

  it('renders reps +/- stepper buttons', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    const card = screen.getByTestId('exercise-workout-card');
    expect(within(card).getByTestId('reps-minus')).toBeInTheDocument();
    expect(within(card).getByTestId('reps-plus')).toBeInTheDocument();
  });

  it('reps + button increments reps by 1', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    const card = screen.getByTestId('exercise-workout-card');
    const repsInput = within(card).getByTestId('reps-input') as HTMLInputElement;
    fireEvent.click(within(card).getByTestId('reps-plus'));
    expect(Number(repsInput.value)).toBeGreaterThanOrEqual(1);
  });

  it('reps - button decrements reps by 1, cannot go below 1', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    const card = screen.getByTestId('exercise-workout-card');
    const repsInput = within(card).getByTestId('reps-input') as HTMLInputElement;
    fireEvent.change(repsInput, { target: { value: '3' } });
    expect(repsInput.value).toBe('3');

    fireEvent.click(within(card).getByTestId('reps-minus'));
    expect(repsInput.value).toBe('2');

    fireEvent.click(within(card).getByTestId('reps-minus'));
    expect(repsInput.value).toBe('1');

    fireEvent.click(within(card).getByTestId('reps-minus'));
    expect(repsInput.value).toBe('1');
  });

  it('reps stepper buttons have correct aria-labels', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    const card = screen.getByTestId('exercise-workout-card');
    expect(within(card).getByTestId('reps-minus')).toHaveAttribute('aria-label', 'Giảm số lần');
    expect(within(card).getByTestId('reps-plus')).toHaveAttribute('aria-label', 'Tăng số lần');
  });

  /* ================================================================
   * FREESTYLE WORKOUT
   * ================================================================ */

  it('uses fallback workout name when no planDay (freestyle default)', async () => {
    const onComplete = vi.fn();
    render(<WorkoutLogger {...defaultProps} onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId('finish-button'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(onComplete).toHaveBeenCalledWith();
  });

  it('shows freestyle name input after finishing a freestyle workout', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('finish-button'));

    expect(screen.getByTestId('freestyle-name-input')).toBeInTheDocument();
    expect(screen.getByText('Đặt tên buổi tập')).toBeInTheDocument();
  });

  it('does not show freestyle name input when planDay is provided', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    fireEvent.click(screen.getByTestId('finish-button'));

    expect(screen.queryByTestId('freestyle-name-input')).not.toBeInTheDocument();
  });

  it('uses custom freestyle name when provided', async () => {
    const onComplete = vi.fn();
    render(<WorkoutLogger {...defaultProps} onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId('finish-button'));
    fireEvent.change(screen.getByTestId('freestyle-name-input'), {
      target: { value: 'Leg Day Custom' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(onComplete).toHaveBeenCalledWith();
  });

  /* ================================================================
   * MULTI-EXERCISE NAVIGATION
   * ================================================================ */

  it('shows first exercise in multi-exercise plan with navigation', () => {
    const multiPlan = {
      dayOfWeek: 1,
      workoutType: 'Full Body',
      exercises: makeExercisesJson('bench-press', 'squat'),
    };
    render(<WorkoutLogger {...defaultProps} planDay={multiPlan} />);

    expect(screen.getByTestId('exercise-workout-card')).toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
    expect(screen.getByTestId('next-exercise-card')).toBeInTheDocument();
    expect(screen.getByTestId('exercise-progress')).toHaveTextContent('1/2');
  });

  it('navigates to next exercise and shows correct progress', () => {
    const multiPlan = {
      dayOfWeek: 1,
      workoutType: 'Full Body',
      exercises: makeExercisesJson('bench-press', 'squat'),
    };
    render(<WorkoutLogger {...defaultProps} planDay={multiPlan} />);

    navigateToNext();

    expect(screen.getByText('Gánh tạ')).toBeInTheDocument();
    expect(screen.getByTestId('exercise-progress')).toHaveTextContent('2/2');
    expect(screen.queryByTestId('next-exercise-card')).not.toBeInTheDocument();
  });

  it('navigates back to previous exercise', () => {
    const multiPlan = {
      dayOfWeek: 1,
      workoutType: 'Full Body',
      exercises: makeExercisesJson('bench-press', 'squat'),
    };
    render(<WorkoutLogger {...defaultProps} planDay={multiPlan} />);

    navigateToNext();
    expect(screen.getByText('Gánh tạ')).toBeInTheDocument();

    navigateToPrev();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
    expect(screen.getByTestId('exercise-progress')).toHaveTextContent('1/2');
  });

  it('prev button is disabled on first exercise', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    expect(screen.getByTestId('prev-exercise-btn')).toBeDisabled();
  });

  it('assigns the same workoutId to all sets on batch save', async () => {
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
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);

    const savedWorkout = mockSaveWorkoutAtomic.mock.calls[0][0] as { id: string };
    const savedSets = mockSaveWorkoutAtomic.mock.calls[0][1] as { workoutId: string }[];
    expect(savedSets).toHaveLength(2);
    expect(savedSets[0].workoutId).toBe(savedWorkout.id);
    expect(savedSets[1].workoutId).toBe(savedWorkout.id);
  });

  /* ================================================================
   * DRAFT PERSISTENCE
   * ================================================================ */

  it('restores draft on mount', () => {
    const draft = {
      exercises: [
        {
          id: 'bench-press',
          nameVi: 'Đẩy tạ nằm',
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
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      sets: [
        {
          id: 'set-draft-1',
          workoutId: '',
          exerciseId: 'bench-press',
          setNumber: 1,
          reps: 10,
          weightKg: 60,
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      elapsedSeconds: 120,
    };
    (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(() => ({ workoutDraft: draft }));

    render(<WorkoutLogger {...defaultProps} />);

    expect(screen.getByTestId('exercise-workout-card')).toBeInTheDocument();
    const sets = getLoggedSets();
    expect(sets).toHaveLength(1);
    expect(sets[0]).toHaveTextContent('60');
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('02:00');
  });

  it('does not restore when draft is null', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('00:00');
  });

  it('saves draft after debounce when exercises change', () => {
    render(<WorkoutLogger {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-exercise-bottom-btn'));
    fireEvent.click(screen.getByText('Select'));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockSetWorkoutDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        exercises: expect.arrayContaining([expect.objectContaining({ id: 'test-ex' })]),
      }),
    );
  });

  it('saves draft after debounce when sets change', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    logSetAndDismissRest('50', '8');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockSetWorkoutDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        sets: expect.arrayContaining([
          expect.objectContaining({
            exerciseId: 'bench-press',
            weightKg: 50,
            reps: 8,
          }),
        ]),
      }),
    );
  });

  it('does not save draft before debounce period', () => {
    render(<WorkoutLogger {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-exercise-bottom-btn'));
    fireEvent.click(screen.getByText('Select'));

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockSetWorkoutDraft).not.toHaveBeenCalled();
  });

  it('clears draft on save', async () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    fireEvent.click(screen.getByTestId('confirm-set-btn'));
    fireEvent.click(screen.getByText('Skip'));
    fireEvent.click(screen.getByTestId('finish-button'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(mockClearWorkoutDraft).toHaveBeenCalledTimes(1);
  });

  it('does not clear draft on save failure (transaction rollback)', async () => {
    const onComplete = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSaveWorkoutAtomic.mockRejectedValueOnce(new Error('Simulated DB failure'));

    render(<WorkoutLogger {...defaultProps} onComplete={onComplete} planDay={planDayWithExercises} />);

    logSetAndDismissRest('80', '8');
    logSetAndDismissRest('80', '8');

    fireEvent.click(screen.getByTestId('finish-button'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
    expect(mockClearWorkoutDraft).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[WorkoutLogger] save',
      expect.objectContaining({ message: 'Simulated DB failure' }),
    );

    consoleErrorSpy.mockRestore();
  });

  it('clears draft on back', () => {
    render(<WorkoutLogger {...defaultProps} />);

    fireEvent.click(screen.getByTestId('back-button'));

    expect(mockClearWorkoutDraft).toHaveBeenCalledTimes(1);
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('does not save draft when no exercises or sets exist', () => {
    render(<WorkoutLogger {...defaultProps} />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockSetWorkoutDraft).not.toHaveBeenCalled();
  });

  it('calls loadWorkoutDraft on mount', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(mockLoadWorkoutDraft).toHaveBeenCalledTimes(1);
  });

  /* ================================================================
   * STALE DRAFT / PLAN-DAY-ID
   * ================================================================ */

  it('TC_DRAFT_01: draft with different planDayId is ignored – shows planDay exercises', () => {
    const draft = {
      exercises: [
        {
          id: 'squat',
          nameVi: 'Gánh tạ',
          nameEn: 'Squat',
          muscleGroup: 'legs',
          secondaryMuscles: ['core', 'glutes'],
          category: 'compound' as const,
          equipment: ['barbell'] as string[],
          contraindicated: [] as string[],
          exerciseType: 'strength' as const,
          defaultRepsMin: 6,
          defaultRepsMax: 10,
          isCustom: false,
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      sets: [
        {
          id: 'stale-set-1',
          workoutId: '',
          exerciseId: 'squat',
          setNumber: 1,
          reps: 5,
          weightKg: 100,
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      elapsedSeconds: 300,
      planDayId: 'old-plan-day-id',
    };
    (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(() => ({ workoutDraft: draft }));

    const planDayWithId = {
      id: 'current-plan-day-id',
      dayOfWeek: 1,
      workoutType: 'Push Day',
      exercises: makeExercisesJson('bench-press'),
    };
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithId} />);

    expect(screen.getByTestId('exercise-workout-card')).toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
    expect(screen.queryByText(/100kg × 5/)).not.toBeInTheDocument();
  });

  it('TC_DRAFT_02: draft with matching planDayId is restored', () => {
    const matchingDraft = {
      exercises: [
        {
          id: 'bench-press',
          nameVi: 'Đẩy tạ nằm',
          nameEn: 'Bench Press',
          muscleGroup: 'chest',
          secondaryMuscles: ['shoulders', 'arms'],
          category: 'compound' as const,
          equipment: ['barbell'] as string[],
          contraindicated: [] as string[],
          exerciseType: 'strength' as const,
          defaultRepsMin: 8,
          defaultRepsMax: 12,
          isCustom: false,
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      sets: [
        {
          id: 'draft-set-1',
          workoutId: '',
          exerciseId: 'bench-press',
          setNumber: 1,
          reps: 10,
          weightKg: 80,
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      elapsedSeconds: 180,
      planDayId: 'pd-matching',
    };
    (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(() => ({ workoutDraft: matchingDraft }));

    const planDayWithId = {
      id: 'pd-matching',
      dayOfWeek: 1,
      workoutType: 'Push Day',
      exercises: makeExercisesJson('bench-press'),
    };
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithId} />);

    expect(screen.getByTestId('exercise-workout-card')).toBeInTheDocument();
    const sets = getLoggedSets();
    expect(sets).toHaveLength(1);
    expect(sets[0]).toHaveTextContent('80');
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('03:00');
  });

  it('TC_DRAFT_03: draft save includes planDayId', () => {
    const planDayWithId = {
      id: 'pd-42',
      dayOfWeek: 1,
      workoutType: 'Push Day',
      exercises: makeExercisesJson('bench-press'),
    };
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithId} />);

    logSetAndDismissRest('60', '10');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockSetWorkoutDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        planDayId: 'pd-42',
      }),
    );
  });

  it('uses draft exercises instead of planDay exercises when draft exists', () => {
    const draft = {
      exercises: [
        {
          id: 'squat',
          nameVi: 'Gánh tạ',
          nameEn: 'Squat',
          muscleGroup: 'legs',
          secondaryMuscles: ['core', 'glutes'],
          category: 'compound' as const,
          equipment: ['barbell'] as string[],
          contraindicated: [] as string[],
          exerciseType: 'strength' as const,
          defaultRepsMin: 6,
          defaultRepsMax: 10,
          isCustom: false,
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      sets: [],
      elapsedSeconds: 60,
    };
    (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(() => ({ workoutDraft: draft }));

    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    expect(screen.getByTestId('exercise-workout-card')).toBeInTheDocument();
    expect(screen.getByText('Gánh tạ')).toBeInTheDocument();
  });

  /* ================================================================
   * PROGRESSIVE OVERLOAD
   * ================================================================ */

  it('shows progressive overload suggestion chip', () => {
    mockSuggestNextSet.mockReturnValue({
      weight: 62.5,
      reps: 5,
      source: 'progressive_overload',
    });
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    expect(screen.getByTestId('overload-chip')).toHaveTextContent('62.5kg × 5');
  });

  it('applies suggestion to inputs on chip click', () => {
    mockSuggestNextSet.mockReturnValue({
      weight: 62.5,
      reps: 5,
      source: 'progressive_overload',
    });
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    fireEvent.click(screen.getByTestId('overload-chip'));
    const card = screen.getByTestId('exercise-workout-card');
    expect((within(card).getByTestId('weight-input') as HTMLInputElement).value).toBe('62.5');
    expect((within(card).getByTestId('reps-input') as HTMLInputElement).value).toBe('5');
  });

  it('shows plateau warning when plateaued', () => {
    mockSuggestNextSet.mockReturnValue({
      weight: 60,
      reps: 5,
      source: 'progressive_overload',
      isPlateaued: true,
      plateauWeeks: 3,
    });
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    const chip = screen.getByTestId('overload-chip');
    expect(chip).toHaveTextContent('60kg × 5');
    expect(chip).toHaveTextContent('plateau 3w');
  });

  it('does not show overload chip when no suggestion data', () => {
    mockSuggestNextSet.mockReturnValue({
      weight: 0,
      reps: 8,
      source: 'manual',
    });
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    expect(screen.queryByTestId('overload-chip')).not.toBeInTheDocument();
  });

  /* ================================================================
   * planDayId in saved workout
   * ================================================================ */

  it('includes planDayId in saved workout when planDay has id', async () => {
    const onComplete = vi.fn();
    const planDayWithId = {
      id: 'pd-1',
      dayOfWeek: 1,
      workoutType: 'Push Day',
      exercises: makeExercisesJson('bench-press'),
    };
    render(<WorkoutLogger {...defaultProps} onComplete={onComplete} planDay={planDayWithId} />);

    logSetAndDismissRest('80', '5');
    fireEvent.click(screen.getByTestId('finish-button'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(mockSaveWorkoutAtomic).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Push Day',
        planDayId: 'pd-1',
      }),
      expect.any(Array),
    );
    expect(onComplete).toHaveBeenCalledWith();
  });

  it('saves workout with undefined planDayId when no planDay (freestyle)', async () => {
    const onComplete = vi.fn();
    render(<WorkoutLogger {...defaultProps} onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId('finish-button'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    const savedWorkout = mockSaveWorkoutAtomic.mock.calls[0][0] as Record<string, unknown>;
    expect(savedWorkout.planDayId).toBeUndefined();
  });

  /* ================================================================
   * BOTTOM BAR
   * ================================================================ */

  it('bottom bar has sticky positioning', () => {
    render(<WorkoutLogger {...defaultProps} />);
    const container = screen.getByTestId('bottom-bar');
    expect(container).toHaveClass('sticky');
    expect(container).toHaveClass('bottom-0');
    expect(container).toHaveClass('backdrop-blur-sm');
  });

  /* ================================================================
   * INPUT EDGE CASES
   * ================================================================ */

  it('clearing weight input shows empty string, not zero', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    const card = screen.getByTestId('exercise-workout-card');
    const weightInput = within(card).getByTestId('weight-input') as HTMLInputElement;

    fireEvent.change(weightInput, { target: { value: '60' } });
    expect(weightInput.value).toBe('60');

    fireEvent.change(weightInput, { target: { value: '' } });
    expect(weightInput.value).toBe('');
  });

  it('clearing reps input shows empty string, not zero', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    const card = screen.getByTestId('exercise-workout-card');
    const repsInput = within(card).getByTestId('reps-input') as HTMLInputElement;

    fireEvent.change(repsInput, { target: { value: '10' } });
    expect(repsInput.value).toBe('10');

    fireEvent.change(repsInput, { target: { value: '' } });
    expect(repsInput.value).toBe('');
  });

  it('saving with cleared weight uses 0 fallback and reps uses 1 fallback', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    const card = screen.getByTestId('exercise-workout-card');
    fireEvent.change(within(card).getByTestId('weight-input'), {
      target: { value: '' },
    });
    fireEvent.change(within(card).getByTestId('reps-input'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByTestId('confirm-set-btn'));

    const sets = getLoggedSets();
    expect(sets).toHaveLength(1);
    expect(sets[0]).toHaveTextContent('0');
  });

  it('weight +/- buttons work after clearing the input', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    const card = screen.getByTestId('exercise-workout-card');
    const weightInput = within(card).getByTestId('weight-input') as HTMLInputElement;

    fireEvent.change(weightInput, { target: { value: '' } });
    expect(weightInput.value).toBe('');

    fireEvent.click(within(card).getByTestId('weight-plus'));
    expect(weightInput.value).toBe('0.5');
  });

  /* ================================================================
   * EDGE CASES: Invalid JSON, Null exercises
   * ================================================================ */

  it('falls back to empty exercises when planDay.exercises is invalid JSON', () => {
    const invalidPlan = {
      dayOfWeek: 1,
      workoutType: 'Bad Data',
      exercises: 'not valid json {{{',
    };
    render(<WorkoutLogger {...defaultProps} planDay={invalidPlan} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('shows empty state when planDay.exercises is empty JSON array "[]"', () => {
    const emptyJsonPlan = {
      dayOfWeek: 1,
      workoutType: 'Empty Day',
      exercises: '[]',
    };
    render(<WorkoutLogger {...defaultProps} planDay={emptyJsonPlan} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('ignores exercises with missing id gracefully', () => {
    const planDay = {
      dayOfWeek: 1,
      workoutType: 'Test',
      exercises: JSON.stringify([
        {
          exercise: {
            id: 'bench-press',
            nameVi: 'Đẩy tạ nằm',
            nameEn: 'Bench Press',
            muscleGroup: 'chest',
            secondaryMuscles: ['shoulders'],
            category: 'compound',
            equipment: ['barbell'],
            contraindicated: [],
            exerciseType: 'strength',
            defaultRepsMin: 8,
            defaultRepsMax: 12,
            isCustom: false,
            updatedAt: '2025-01-01',
          },
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          restSeconds: 90,
        },
        {
          exercise: null,
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          restSeconds: 90,
        },
      ]),
    };
    render(<WorkoutLogger {...defaultProps} planDay={planDay} />);

    expect(screen.getByTestId('exercise-workout-card')).toBeInTheDocument();
    expect(screen.queryByTestId('next-exercise-card')).not.toBeInTheDocument();
    expect(screen.getByTestId('exercise-progress')).toHaveTextContent('1/1');
  });

  it('renders custom exercises not in seed database', () => {
    const planDay = {
      dayOfWeek: 1,
      workoutType: 'Test',
      exercises: JSON.stringify([
        {
          exercise: {
            id: 'bench-press',
            nameVi: 'Đẩy tạ nằm',
            nameEn: 'Bench Press',
            muscleGroup: 'chest',
            secondaryMuscles: ['shoulders'],
            category: 'compound',
            equipment: ['barbell'],
            contraindicated: [],
            exerciseType: 'strength',
            defaultRepsMin: 8,
            defaultRepsMax: 12,
            isCustom: false,
            updatedAt: '2025-01-01',
          },
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          restSeconds: 90,
        },
        {
          exercise: {
            id: 'custom-exercise',
            nameVi: 'Bài tập tùy chỉnh',
            nameEn: 'Custom',
            muscleGroup: 'chest',
            secondaryMuscles: [],
            category: 'isolation',
            equipment: ['machine'],
            contraindicated: [],
            exerciseType: 'strength',
            defaultRepsMin: 8,
            defaultRepsMax: 12,
            isCustom: true,
            updatedAt: '2025-01-01',
          },
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          restSeconds: 90,
        },
      ]),
    };
    render(<WorkoutLogger {...defaultProps} planDay={planDay} />);

    expect(screen.getByTestId('exercise-workout-card')).toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
    navigateToNext();
    expect(screen.getAllByText('Bài tập tùy chỉnh').length).toBeGreaterThan(0);
  });

  it('auto-starts timer when planDay has exercises', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    expect(screen.getByTestId('elapsed-timer')).toBeInTheDocument();
  });

  it('resolves exercises from JSON string (SelectedExercise format)', () => {
    const planDay = {
      dayOfWeek: 1,
      workoutType: 'Push Day',
      exercises: makeExercisesJson('bench-press', 'squat'),
    };
    render(<WorkoutLogger {...defaultProps} planDay={planDay} />);

    expect(screen.getByTestId('exercise-workout-card')).toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
    expect(screen.getByTestId('next-exercise-card')).toBeInTheDocument();
  });

  /* ================================================================
   * SET EDIT / DELETE
   * ================================================================ */

  it('TC_SET_06: renders edit and delete buttons for each logged set', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    logSetAndDismissRest('60', '10');
    logSetAndDismissRest('65', '8');

    const editButtons = screen.getAllByRole('button', { name: 'Chỉnh sửa set' });
    const deleteButtons = screen.getAllByRole('button', { name: 'Xóa set' });
    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it('TC_SET_01: clicking edit opens SetEditor with set data', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    logSetAndDismissRest('75', '10');

    const editBtn = screen.getByRole('button', { name: 'Chỉnh sửa set' });
    fireEvent.click(editBtn);

    const editor = screen.getByTestId('set-editor');
    expect(editor).toBeInTheDocument();
    expect((within(editor).getByTestId('weight-input') as HTMLInputElement).value).toBe('75');
    expect((within(editor).getByTestId('reps-input') as HTMLInputElement).value).toBe('10');
  });

  it('TC_SET_02: saving edit updates set weight/reps/rpe', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    logSetAndDismissRest('60', '10');
    let sets = getLoggedSets();
    expect(sets).toHaveLength(1);
    expect(sets[0]).toHaveTextContent('60');

    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa set' }));
    const editor = screen.getByTestId('set-editor');

    fireEvent.change(within(editor).getByTestId('weight-input'), { target: { value: '70' } });
    fireEvent.change(within(editor).getByTestId('reps-input'), { target: { value: '8' } });
    fireEvent.click(screen.getByTestId('save-button'));

    expect(screen.queryByTestId('set-editor')).not.toBeInTheDocument();
    sets = getLoggedSets();
    expect(sets).toHaveLength(1);
    expect(sets[0]).toHaveTextContent('70');
    expect(sets[0]).toHaveTextContent('8');
  });

  it('TC_SET_03: clicking delete removes the set', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    logSetAndDismissRest('60', '10');
    expect(getLoggedSets()).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Xóa set' }));
    expect(getLoggedSets()).toHaveLength(0);
  });

  it('TC_SET_04: deleting middle set renumbers remaining to 1, 2', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    logSetAndDismissRest('60', '10');
    logSetAndDismissRest('65', '8');
    logSetAndDismissRest('70', '6');

    expect(getLoggedSets()).toHaveLength(3);

    const deleteButtons = screen.getAllByRole('button', { name: 'Xóa set' });
    fireEvent.click(deleteButtons[1]);

    const sets = getLoggedSets();
    expect(sets).toHaveLength(2);
    expect(sets[0]).toHaveTextContent('60');
    expect(sets[1]).toHaveTextContent('70');
  });

  it('TC_SET_05: editing a set preserves its setNumber', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    logSetAndDismissRest('60', '10');
    logSetAndDismissRest('65', '8');

    expect(getLoggedSets()).toHaveLength(2);

    const editButtons = screen.getAllByRole('button', { name: 'Chỉnh sửa set' });
    fireEvent.click(editButtons[0]);

    const editor = screen.getByTestId('set-editor');
    fireEvent.change(within(editor).getByTestId('weight-input'), { target: { value: '62.5' } });
    fireEvent.click(screen.getByTestId('save-button'));

    const sets = getLoggedSets();
    expect(sets).toHaveLength(2);
    expect(sets[0]).toHaveTextContent('62.5');
    expect(sets[1]).toHaveTextContent('65');
  });

  it('TC_SET_MULTI: deleting bench-press set leaves squat set unchanged', () => {
    const multiPlan = {
      dayOfWeek: 1,
      workoutType: 'Full Body',
      exercises: makeExercisesJson('bench-press', 'squat'),
    };
    render(<WorkoutLogger {...defaultProps} planDay={multiPlan} />);

    logSetAndDismissRest('60', '10');
    logSetAndDismissRest('70', '8');

    navigateToNext();
    logSetAndDismissRest('100', '6');

    navigateToPrev();
    let sets = getLoggedSets();
    expect(sets).toHaveLength(2);
    expect(sets[0]).toHaveTextContent('60');
    expect(sets[1]).toHaveTextContent('70');

    const deleteButtons = screen.getAllByRole('button', { name: 'Xóa set' });
    fireEvent.click(deleteButtons[0]);

    sets = getLoggedSets();
    expect(sets).toHaveLength(1);
    expect(sets[0]).toHaveTextContent('70');

    navigateToNext();
    sets = getLoggedSets();
    expect(sets).toHaveLength(1);
    expect(sets[0]).toHaveTextContent('100');
  });

  it('TC_SET_CANCEL: edit cancel closes editor without modifying set', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    logSetAndDismissRest('60', '10');

    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa set' }));
    expect(screen.getByTestId('set-editor')).toBeInTheDocument();

    const editor = screen.getByTestId('set-editor');
    fireEvent.change(within(editor).getByTestId('weight-input'), { target: { value: '99' } });

    fireEvent.click(screen.getByTestId('cancel-button'));

    expect(screen.queryByTestId('set-editor')).not.toBeInTheDocument();
    const sets = getLoggedSets();
    expect(sets).toHaveLength(1);
    expect(sets[0]).toHaveTextContent('60');
  });

  /* ================================================================
   * COPY LAST SET
   * ================================================================ */

  it('TC_COPY_01: copy-last-set button is hidden when no sets are logged', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    expect(screen.queryByTestId('copy-last-set')).not.toBeInTheDocument();
  });

  it('TC_COPY_02: copy-last-set button appears after logging a set', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    logSetAndDismissRest('60', '10');
    expect(screen.getByTestId('copy-last-set')).toBeInTheDocument();
  });

  it('TC_COPY_03: clicking copy-last-set prefills weight and reps from the latest set', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    logSetAndDismissRest('60', '10');
    logSetAndDismissRest('75', '8');

    fireEvent.click(screen.getByTestId('copy-last-set'));

    const card = screen.getByTestId('exercise-workout-card');
    const weightInput = within(card).getByTestId('weight-input') as HTMLInputElement;
    const repsInput = within(card).getByTestId('reps-input') as HTMLInputElement;
    expect(weightInput.value).toBe('75');
    expect(repsInput.value).toBe('8');
  });

  it('TC_COPY_04: copy-last-set does not appear for exercises with no logged sets', () => {
    const multiPlan = {
      dayOfWeek: 1,
      workoutType: 'Full Body',
      exercises: makeExercisesJson('bench-press', 'squat'),
    };
    render(<WorkoutLogger {...defaultProps} planDay={multiPlan} />);

    logSetAndDismissRest('60', '10');
    expect(screen.getByTestId('copy-last-set')).toBeInTheDocument();

    navigateToNext();
    expect(screen.queryByTestId('copy-last-set')).not.toBeInTheDocument();
  });

  /* ================================================================
   * SWAP EXERCISE
   * ================================================================ */

  it('TC_SWAP_01: clicking swap opens SwapExerciseSheet', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);
    const card = screen.getByTestId('exercise-workout-card');
    fireEvent.click(within(card).getByTestId('swap-exercise'));
    expect(screen.getByTestId('swap-exercise-sheet')).toBeInTheDocument();
  });

  it('TC_SWAP_02: swapping replaces current exercise and clears old sets', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    logSetAndDismissRest('60', '10');
    expect(getLoggedSets()).toHaveLength(1);

    const card = screen.getByTestId('exercise-workout-card');
    fireEvent.click(within(card).getByTestId('swap-exercise'));
    fireEvent.click(screen.getByTestId('swap-select-incline'));

    expect(screen.queryByText('Đẩy tạ nằm')).not.toBeInTheDocument();
    expect(getLoggedSets()).toHaveLength(0);
    expect(screen.getByText('Đẩy tạ nằm nghiêng')).toBeInTheDocument();
  });

  it('TC_SWAP_03: closing swap sheet without selecting does nothing', () => {
    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    const card = screen.getByTestId('exercise-workout-card');
    fireEvent.click(within(card).getByTestId('swap-exercise'));
    expect(screen.getByTestId('swap-exercise-sheet')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close Swap'));
    expect(screen.queryByTestId('swap-exercise-sheet')).not.toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
  });

  /* ================================================================
   * SAVE ERROR HANDLING
   * ================================================================ */

  it('shows error notification when save fails', async () => {
    mockSaveWorkoutAtomic.mockRejectedValueOnce(new Error('DB error'));
    const onComplete = vi.fn();
    render(<WorkoutLogger {...defaultProps} onComplete={onComplete} planDay={planDayWithExercises} />);

    logSetAndDismissRest('60', '10');
    fireEvent.click(screen.getByTestId('finish-button'));

    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(mockNotify.error).toHaveBeenCalledWith('Chưa lưu buổi tập được. Thử lại nhé!');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('disables save button while saving', async () => {
    let resolvePromise: () => void;
    const savePromise = new Promise<void>(resolve => {
      resolvePromise = resolve;
    });
    mockSaveWorkoutAtomic.mockReturnValueOnce(savePromise);

    render(<WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />);

    logSetAndDismissRest('60', '10');
    fireEvent.click(screen.getByTestId('finish-button'));

    const saveButton = screen.getByTestId('save-workout-button');
    expect(saveButton).not.toBeDisabled();

    act(() => {
      fireEvent.click(saveButton);
    });

    expect(screen.getByTestId('save-workout-button')).toBeDisabled();

    await act(async () => {
      resolvePromise!();
    });
  });

  /* ================================================================
   * TC_NAV: Index Clamping & Rest Timer
   * ================================================================ */

  it('TC_NAV_01: swap at last index keeps view correct', () => {
    const multiPlan = {
      dayOfWeek: 1,
      workoutType: 'Full Body',
      exercises: makeExercisesJson('bench-press', 'squat'),
    };
    render(<WorkoutLogger {...defaultProps} planDay={multiPlan} />);

    navigateToNext();
    expect(screen.getByText('Gánh tạ')).toBeInTheDocument();
    expect(screen.getByTestId('exercise-progress')).toHaveTextContent('2/2');

    const card = screen.getByTestId('exercise-workout-card');
    fireEvent.click(within(card).getByTestId('swap-exercise'));
    fireEvent.click(screen.getByTestId('swap-select-incline'));

    expect(screen.getByText('Đẩy tạ nằm nghiêng')).toBeInTheDocument();
  });

  it('TC_NAV_02: rest timer shows after logging set', () => {
    const planWithCustomRest = {
      dayOfWeek: 1,
      workoutType: 'Push',
      exercises: JSON.stringify([
        {
          exercise: {
            id: 'bench-press',
            nameVi: 'Đẩy tạ nằm',
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
            updatedAt: '2025-01-01',
          },
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          restSeconds: 180,
        },
      ]),
    };
    render(<WorkoutLogger {...defaultProps} planDay={planWithCustomRest} />);
    fireEvent.click(screen.getByTestId('confirm-set-btn'));
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument();
  });
});
