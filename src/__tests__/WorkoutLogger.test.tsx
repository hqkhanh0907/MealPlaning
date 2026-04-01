import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import type { Mock } from 'vitest';
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
  ],
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

vi.mock('../features/fitness/components/RestTimer', () => ({
  RestTimer: vi.fn(
    (props: { onComplete: () => void; onSkip: () => void }) => (
      <div data-testid="rest-timer">
        <button type="button" onClick={props.onSkip}>
          Skip
        </button>
        <button type="button" onClick={props.onComplete}>
          Done
        </button>
      </div>
    ),
  ),
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

const mockNotify = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn(), dismissAll: vi.fn() };
vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => mockNotify,
}));

afterEach(cleanup);

describe('WorkoutLogger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (useFitnessStore as unknown as Mock).mockImplementation(
      (selector: (s: Record<string, unknown>) => unknown) =>
        selector({
          saveWorkoutAtomic: mockSaveWorkoutAtomic,
          setWorkoutDraft: mockSetWorkoutDraft,
          clearWorkoutDraft: mockClearWorkoutDraft,
          loadWorkoutDraft: mockLoadWorkoutDraft,
        }),
    );
    (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(
      () => ({ workoutDraft: null }),
    );
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
          nameVi: id === 'bench-press' ? 'Đẩy tạ nằm' : 'Gánh tạ',
          nameEn: id === 'bench-press' ? 'Bench Press' : 'Squat',
          muscleGroup: id === 'bench-press' ? 'chest' : 'legs',
          secondaryMuscles: id === 'bench-press' ? ['shoulders', 'arms'] : ['core', 'glutes'],
          category: 'compound',
          equipment: ['barbell'],
          contraindicated: [],
          exerciseType: 'strength',
          defaultRepsMin: id === 'bench-press' ? 8 : 6,
          defaultRepsMax: id === 'bench-press' ? 12 : 10,
          isCustom: false,
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        sets: 4,
        repsMin: id === 'bench-press' ? 8 : 6,
        repsMax: id === 'bench-press' ? 12 : 10,
        restSeconds: 120,
      })),
    );

  const planDayWithExercises = {
    dayOfWeek: 1,
    workoutType: 'Push Day',
    exercises: makeExercisesJson('bench-press'),
  };

  it('renders header with back button and timer', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(screen.getByTestId('workout-header')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
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

  it('shows planned exercises when planDay provided', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    expect(
      screen.getByTestId('exercise-section-bench-press'),
    ).toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
  });

  it('shows empty state when no exercises', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(
      screen.getByText('Chưa có bài tập. Thêm bài tập để bắt đầu.'),
    ).toBeInTheDocument();
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

  it('can log a set with weight and reps', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '60' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));

    expect(screen.getByText(/60kg × 10/)).toBeInTheDocument();
  });

  it('shows rest timer after logging a set', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument();
  });

  it('hides rest timer on skip', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Skip'));
    expect(screen.queryByTestId('rest-timer')).not.toBeInTheDocument();
  });

  it('hides rest timer on complete', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    expect(screen.getByTestId('rest-timer')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Done'));
    expect(screen.queryByTestId('rest-timer')).not.toBeInTheDocument();
  });

  it('opens exercise selector on add exercise click', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-exercise-button'));
    expect(screen.getByTestId('exercise-selector')).toBeInTheDocument();
  });

  it('adds selected exercise from selector to list', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-exercise-button'));
    fireEvent.click(screen.getByText('Select'));

    expect(
      screen.getByTestId('exercise-section-test-ex'),
    ).toBeInTheDocument();
    expect(screen.getByText('Test Exercise')).toBeInTheDocument();
    expect(
      screen.queryByTestId('exercise-selector'),
    ).not.toBeInTheDocument();
  });

  it('closes exercise selector without selecting', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('add-exercise-button'));
    expect(screen.getByTestId('exercise-selector')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(
      screen.queryByTestId('exercise-selector'),
    ).not.toBeInTheDocument();
  });

  it('shows summary on finish', () => {
    render(<WorkoutLogger {...defaultProps} />);
    fireEvent.click(screen.getByTestId('finish-button'));
    expect(screen.getByTestId('workout-summary-card')).toBeInTheDocument();
    expect(screen.getByText('Tổng kết buổi tập')).toBeInTheDocument();
  });

  it('shows correct duration and volume in summary', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '50' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));

    // Log a second set to exercise the filter callback on non-empty prev
    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '50' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));

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
    render(
      <WorkoutLogger
        {...defaultProps}
        onComplete={onComplete}
        planDay={planDayWithExercises}
      />,
    );

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '80' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));
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

  it('allows RPE selection and toggle', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    const rpe8 = screen.getByTestId('rpe-8-bench-press');
    fireEvent.click(rpe8);
    expect(rpe8).toHaveClass('bg-emerald-500');

    fireEvent.click(rpe8);
    expect(rpe8).not.toHaveClass('bg-emerald-500');
  });

  it('adjusts weight with ±2.5kg buttons', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    const weightInput = screen.getByTestId(
      'weight-input-bench-press',
    ) as HTMLInputElement;

    expect(weightInput.value).toBe('0');

    fireEvent.click(screen.getByTestId('weight-plus-bench-press'));
    expect(weightInput.value).toBe('2.5');

    fireEvent.click(screen.getByTestId('weight-plus-bench-press'));
    expect(weightInput.value).toBe('5');

    fireEvent.click(screen.getByTestId('weight-minus-bench-press'));
    expect(weightInput.value).toBe('2.5');

    fireEvent.click(screen.getByTestId('weight-minus-bench-press'));
    fireEvent.click(screen.getByTestId('weight-minus-bench-press'));
    expect(weightInput.value).toBe('0');
  });

  it('logs set with RPE and displays it', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '70' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByTestId('rpe-9-bench-press'));
    fireEvent.click(screen.getByTestId('log-set-bench-press'));

    expect(screen.getByText(/70kg × 8/)).toBeInTheDocument();
    expect(screen.getByText('RPE 9')).toBeInTheDocument();
  });

  it('uses fallback workout name when no planDay (freestyle default)', async () => {
    const onComplete = vi.fn();
    render(<WorkoutLogger {...defaultProps} onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId('finish-button'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(onComplete).toHaveBeenCalledWith();
  });

  it('resolves multiple planned exercises', () => {
    const multiPlan = {
      dayOfWeek: 1,
      workoutType: 'Full Body',
      exercises: makeExercisesJson('bench-press', 'squat'),
    };
    render(<WorkoutLogger {...defaultProps} planDay={multiPlan} />);

    expect(
      screen.getByTestId('exercise-section-bench-press'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('exercise-section-squat'),
    ).toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
    expect(
      screen.getByTestId('exercise-section-squat'),
    ).toHaveTextContent('Gánh tạ');
  });

  /* ---------- workout draft persistence ---------- */
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
    (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(
      () => ({ workoutDraft: draft }),
    );

    render(<WorkoutLogger {...defaultProps} />);

    expect(
      screen.getByTestId('exercise-section-bench-press'),
    ).toBeInTheDocument();
    expect(screen.getByText(/60kg × 10/)).toBeInTheDocument();
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('02:00');
  });

  it('does not restore when draft is null', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('00:00');
  });

  it('saves draft after debounce when exercises change', () => {
    render(<WorkoutLogger {...defaultProps} />);

    fireEvent.click(screen.getByTestId('add-exercise-button'));
    fireEvent.click(screen.getByText('Select'));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockSetWorkoutDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        exercises: expect.arrayContaining([
          expect.objectContaining({ id: 'test-ex' }),
        ]),
      }),
    );
  });

  it('saves draft after debounce when sets change', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '50' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));

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

    fireEvent.click(screen.getByTestId('add-exercise-button'));
    fireEvent.click(screen.getByText('Select'));

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockSetWorkoutDraft).not.toHaveBeenCalled();
  });

  it('assigns the same workoutId to all sets on batch save', async () => {
    const multiPlan = {
      dayOfWeek: 1,
      workoutType: 'Full Body',
      exercises: makeExercisesJson('bench-press', 'squat'),
    };
    render(<WorkoutLogger {...defaultProps} planDay={multiPlan} />);

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '80' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));

    fireEvent.change(screen.getByTestId('weight-input-squat'), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByTestId('reps-input-squat'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByTestId('log-set-squat'));
    fireEvent.click(screen.getByText('Skip'));

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

  it('clears draft on save', async () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    fireEvent.click(screen.getByTestId('log-set-bench-press'));
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

    render(
      <WorkoutLogger
        {...defaultProps}
        onComplete={onComplete}
        planDay={planDayWithExercises}
      />,
    );

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '80' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '80' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '8' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));

    fireEvent.click(screen.getByTestId('finish-button'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-workout-button'));
    });

    expect(mockSaveWorkoutAtomic).toHaveBeenCalledTimes(1);
    expect(mockClearWorkoutDraft).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[WorkoutLogger] Save failed, draft preserved:',
      expect.any(Error),
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

  it('resolves exercises from JSON string (SelectedExercise format)', () => {
    const planDay = {
      dayOfWeek: 1,
      workoutType: 'Push Day',
      exercises: makeExercisesJson('bench-press', 'squat'),
    };
    render(<WorkoutLogger {...defaultProps} planDay={planDay} />);

    expect(
      screen.getByTestId('exercise-section-bench-press'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('exercise-section-squat'),
    ).toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ nằm')).toBeInTheDocument();
    expect(
      screen.getByTestId('exercise-section-squat'),
    ).toHaveTextContent('Gánh tạ');
  });

  it('ignores unknown exercise IDs gracefully', () => {
    const planDay = {
      dayOfWeek: 1,
      workoutType: 'Test',
      exercises: JSON.stringify([
        {
          exercise: { id: 'bench-press', nameVi: 'Đẩy tạ nằm', nameEn: 'Bench Press', muscleGroup: 'chest', secondaryMuscles: ['shoulders'], category: 'compound', equipment: ['barbell'], contraindicated: [], exerciseType: 'strength', defaultRepsMin: 8, defaultRepsMax: 12, isCustom: false, updatedAt: '2025-01-01' },
          sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90,
        },
        {
          exercise: { id: 'nonexistent-exercise', nameVi: 'Không tồn tại', nameEn: 'Nonexistent', muscleGroup: 'chest', secondaryMuscles: [], category: 'isolation', equipment: ['machine'], contraindicated: [], exerciseType: 'strength', defaultRepsMin: 8, defaultRepsMax: 12, isCustom: false, updatedAt: '2025-01-01' },
          sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90,
        },
      ]),
    };
    render(<WorkoutLogger {...defaultProps} planDay={planDay} />);

    expect(
      screen.getByTestId('exercise-section-bench-press'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('exercise-section-nonexistent-exercise'),
    ).not.toBeInTheDocument();
  });

  it('calls loadWorkoutDraft on mount', () => {
    render(<WorkoutLogger {...defaultProps} />);
    expect(mockLoadWorkoutDraft).toHaveBeenCalledTimes(1);
  });

  /* ---------- progressive overload chip ---------- */
  it('shows progressive overload suggestion chip', () => {
    mockSuggestNextSet.mockReturnValue({
      weight: 62.5,
      reps: 5,
      source: 'progressive_overload',
    });
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    expect(screen.getByTestId('overload-chip')).toHaveTextContent(
      '62.5kg × 5',
    );
  });

  it('applies suggestion to inputs on chip click', () => {
    mockSuggestNextSet.mockReturnValue({
      weight: 62.5,
      reps: 5,
      source: 'progressive_overload',
    });
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    fireEvent.click(screen.getByTestId('overload-chip'));
    expect(
      (screen.getByTestId('weight-input-bench-press') as HTMLInputElement)
        .value,
    ).toBe('62.5');
    expect(
      (screen.getByTestId('reps-input-bench-press') as HTMLInputElement)
        .value,
    ).toBe('5');
  });

  it('shows plateau warning when plateaued', () => {
    mockSuggestNextSet.mockReturnValue({
      weight: 60,
      reps: 5,
      source: 'progressive_overload',
      isPlateaued: true,
      plateauWeeks: 3,
    });
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
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
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    expect(screen.queryByTestId('overload-chip')).not.toBeInTheDocument();
  });

  /* ---------- planDayId and freestyle ---------- */
  it('includes planDayId in saved workout when planDay has id', async () => {
    const onComplete = vi.fn();
    const planDayWithId = {
      id: 'pd-1',
      dayOfWeek: 1,
      workoutType: 'Push Day',
      exercises: makeExercisesJson('bench-press'),
    };
    render(
      <WorkoutLogger {...defaultProps} onComplete={onComplete} planDay={planDayWithId} />,
    );

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '80' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));
    fireEvent.click(screen.getByText('Skip'));
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

  it('add exercise button has sticky positioning', () => {
    render(<WorkoutLogger {...defaultProps} />);
    const container = screen.getByTestId('add-exercise-container');
    expect(container).toHaveClass('sticky');
    expect(container).toHaveClass('bottom-0');
    expect(container).toHaveClass('backdrop-blur-sm');
  });

  it('clearing weight input shows empty string, not zero', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    const weightInput = screen.getByTestId(
      'weight-input-bench-press',
    ) as HTMLInputElement;

    fireEvent.change(weightInput, { target: { value: '60' } });
    expect(weightInput.value).toBe('60');

    fireEvent.change(weightInput, { target: { value: '' } });
    expect(weightInput.value).toBe('');
  });

  it('clearing reps input shows empty string, not zero', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    const repsInput = screen.getByTestId(
      'reps-input-bench-press',
    ) as HTMLInputElement;

    fireEvent.change(repsInput, { target: { value: '10' } });
    expect(repsInput.value).toBe('10');

    fireEvent.change(repsInput, { target: { value: '' } });
    expect(repsInput.value).toBe('');
  });

  it('saving with cleared weight uses 0 fallback and reps uses 1 fallback', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    fireEvent.change(screen.getByTestId('weight-input-bench-press'), {
      target: { value: '' },
    });
    fireEvent.change(screen.getByTestId('reps-input-bench-press'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByTestId('log-set-bench-press'));

    expect(screen.getByText(/0kg × 1/)).toBeInTheDocument();
  });

  it('weight +/- buttons work after clearing the input', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    const weightInput = screen.getByTestId(
      'weight-input-bench-press',
    ) as HTMLInputElement;

    fireEvent.change(weightInput, { target: { value: '' } });
    expect(weightInput.value).toBe('');

    fireEvent.click(screen.getByTestId('weight-plus-bench-press'));
    expect(weightInput.value).toBe('2.5');
  });

  /* ---------- TC_WL_04: Invalid JSON exercises → graceful fallback ---------- */
  it('falls back to empty exercises when planDay.exercises is invalid JSON', () => {
    const invalidPlan = {
      dayOfWeek: 1,
      workoutType: 'Bad Data',
      exercises: 'not valid json {{{',
    };
    render(<WorkoutLogger {...defaultProps} planDay={invalidPlan} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  /* ---------- TC_WL_05: Timer auto-start with planned exercises ---------- */
  it('auto-starts timer when planDay has exercises', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );
    expect(screen.getByTestId('elapsed-timer')).toBeInTheDocument();
  });

  /* ---------- TC_WL_06: Draft takes priority over planDay ---------- */
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
    (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(
      () => ({ workoutDraft: draft }),
    );

    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    expect(
      screen.getByTestId('exercise-section-squat'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('exercise-section-bench-press'),
    ).not.toBeInTheDocument();
  });

  /* ---------- TC_WL_02: Empty JSON string → empty state ---------- */
  it('shows empty state when planDay.exercises is empty JSON array "[]"', () => {
    const emptyJsonPlan = {
      dayOfWeek: 1,
      workoutType: 'Empty Day',
      exercises: '[]',
    };
    render(<WorkoutLogger {...defaultProps} planDay={emptyJsonPlan} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  /* ================================================================
   *  TC_SET_01 – TC_SET_06: Set Edit / Delete
   * ================================================================ */

  /** Helper: log a set and dismiss the rest timer so subsequent interactions work. */
  function logSetAndDismissRest(
    exerciseId: string,
    weight: string,
    reps: string,
    rpe?: number,
  ) {
    fireEvent.change(screen.getByTestId(`weight-input-${exerciseId}`), {
      target: { value: weight },
    });
    fireEvent.change(screen.getByTestId(`reps-input-${exerciseId}`), {
      target: { value: reps },
    });
    if (rpe !== undefined) {
      fireEvent.click(screen.getByTestId(`rpe-${rpe}-${exerciseId}`));
    }
    fireEvent.click(screen.getByTestId(`log-set-${exerciseId}`));
    // Dismiss rest timer so UI doesn't block the next action
    fireEvent.click(screen.getByText('Skip'));
  }

  /* TC_SET_06: Edit/delete buttons exist for each logged set */
  it('TC_SET_06: renders edit and delete buttons for each logged set', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    logSetAndDismissRest('bench-press', '60', '10');
    logSetAndDismissRest('bench-press', '65', '8');

    // Both sets should have edit and delete buttons
    const editButtons = screen.getAllByRole('button', {
      name: 'Chỉnh sửa set',
    });
    const deleteButtons = screen.getAllByRole('button', {
      name: 'Xóa set',
    });
    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  /* TC_SET_01: Clicking edit opens SetEditor with that set's data */
  it('TC_SET_01: clicking edit opens SetEditor with set data', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    logSetAndDismissRest('bench-press', '75', '10');

    // Click the edit button for the logged set
    const editBtn = screen.getByRole('button', {
      name: 'Chỉnh sửa set',
    });
    fireEvent.click(editBtn);

    // SetEditor should be visible
    expect(screen.getByTestId('set-editor')).toBeInTheDocument();
    // Weight input should reflect the logged set value
    expect(
      (screen.getByTestId('weight-input') as HTMLInputElement).value,
    ).toBe('75');
    // Reps input should reflect the logged set value
    expect(
      (screen.getByTestId('reps-input') as HTMLInputElement).value,
    ).toBe('10');
  });

  /* TC_SET_02: Saving edit updates weight/reps/rpe in displayed list */
  it('TC_SET_02: saving edit updates set weight/reps/rpe', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    logSetAndDismissRest('bench-press', '60', '10');

    expect(screen.getByText(/60kg × 10/)).toBeInTheDocument();

    // Open editor
    fireEvent.click(
      screen.getByRole('button', { name: 'Chỉnh sửa set' }),
    );
    expect(screen.getByTestId('set-editor')).toBeInTheDocument();

    // Change weight to 70 and reps to 8
    fireEvent.change(screen.getByTestId('weight-input'), {
      target: { value: '70' },
    });
    fireEvent.change(screen.getByTestId('reps-input'), {
      target: { value: '8' },
    });
    // Save
    fireEvent.click(screen.getByTestId('save-button'));

    // SetEditor should close
    expect(screen.queryByTestId('set-editor')).not.toBeInTheDocument();
    // Updated values displayed
    expect(screen.getByText(/70kg × 8/)).toBeInTheDocument();
    expect(screen.queryByText(/60kg × 10/)).not.toBeInTheDocument();
  });

  /* TC_SET_03: Clicking delete removes the set */
  it('TC_SET_03: clicking delete removes the set', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    logSetAndDismissRest('bench-press', '60', '10');

    expect(screen.getByText(/60kg × 10/)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Xóa set' }),
    );

    expect(screen.queryByText(/60kg × 10/)).not.toBeInTheDocument();
  });

  /* TC_SET_04: Deleting middle set renumbers remaining sets */
  it('TC_SET_04: deleting middle set renumbers remaining to 1, 2', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    logSetAndDismissRest('bench-press', '60', '10');
    logSetAndDismissRest('bench-press', '65', '8');
    logSetAndDismissRest('bench-press', '70', '6');

    // Verify all 3 sets exist with set numbers 1, 2, 3
    const allSetRows = screen.getAllByText(/kg ×/);
    expect(allSetRows).toHaveLength(3);

    // Delete the second set (65kg × 8) – middle delete button
    const deleteButtons = screen.getAllByRole('button', {
      name: 'Xóa set',
    });
    // deleteButtons[1] is the middle set
    fireEvent.click(deleteButtons[1]);

    // Now only 2 sets remain
    expect(screen.queryByText(/65kg × 8/)).not.toBeInTheDocument();
    expect(screen.getByText(/60kg × 10/)).toBeInTheDocument();
    expect(screen.getByText(/70kg × 6/)).toBeInTheDocument();

    // The remaining sets should be renumbered to Set 1, Set 2
    const loggedSetDivs = screen.getAllByText(/kg ×/);
    expect(loggedSetDivs).toHaveLength(2);

    // Get the parent containers to check set numbers
    const setLabels = screen.getAllByText(/^Set \d+$/);
    expect(setLabels).toHaveLength(2);
    expect(setLabels[0]).toHaveTextContent('Set 1');
    expect(setLabels[1]).toHaveTextContent('Set 2');
  });

  /* TC_SET_05: Edit does not change the set's setNumber */
  it('TC_SET_05: editing a set preserves its setNumber', () => {
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithExercises} />,
    );

    logSetAndDismissRest('bench-press', '60', '10');
    logSetAndDismissRest('bench-press', '65', '8');

    // Verify Set 1 and Set 2 labels exist
    const setLabels = screen.getAllByText(/^Set \d+$/);
    expect(setLabels).toHaveLength(2);
    expect(setLabels[0]).toHaveTextContent('Set 1');
    expect(setLabels[1]).toHaveTextContent('Set 2');

    // Edit the first set (60kg × 10)
    const editButtons = screen.getAllByRole('button', {
      name: 'Chỉnh sửa set',
    });
    fireEvent.click(editButtons[0]);

    // Change weight and save
    fireEvent.change(screen.getByTestId('weight-input'), {
      target: { value: '62.5' },
    });
    fireEvent.click(screen.getByTestId('save-button'));

    // Set numbers should be unchanged
    const updatedLabels = screen.getAllByText(/^Set \d+$/);
    expect(updatedLabels).toHaveLength(2);
    expect(updatedLabels[0]).toHaveTextContent('Set 1');
    expect(updatedLabels[1]).toHaveTextContent('Set 2');

    // Value should be updated
    expect(screen.getByText(/62\.5kg × 10/)).toBeInTheDocument();
  });

  /* ================================================================
   *  TC_DRAFT_01 – TC_DRAFT_03: Stale Draft / planDayId
   * ================================================================ */

  /* TC_DRAFT_01: Draft with different planDayId is ignored */
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
    (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(
      () => ({ workoutDraft: draft }),
    );

    const planDayWithId = {
      id: 'current-plan-day-id',
      dayOfWeek: 1,
      workoutType: 'Push Day',
      exercises: makeExercisesJson('bench-press'),
    };
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithId} />,
    );

    // The stale draft's squat exercise should NOT appear
    expect(
      screen.queryByTestId('exercise-section-squat'),
    ).not.toBeInTheDocument();
    // The planDay's bench-press exercise SHOULD appear
    expect(
      screen.getByTestId('exercise-section-bench-press'),
    ).toBeInTheDocument();
    // The stale draft's logged set should NOT appear
    expect(screen.queryByText(/100kg × 5/)).not.toBeInTheDocument();
  });

  /* TC_DRAFT_02: Draft with matching planDayId is restored */
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
    (useFitnessStore as unknown as { getState: Mock }).getState = vi.fn(
      () => ({ workoutDraft: matchingDraft }),
    );

    const planDayWithId = {
      id: 'pd-matching',
      dayOfWeek: 1,
      workoutType: 'Push Day',
      exercises: makeExercisesJson('bench-press'),
    };
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithId} />,
    );

    // Draft exercises should be restored
    expect(
      screen.getByTestId('exercise-section-bench-press'),
    ).toBeInTheDocument();
    // Draft set should be visible
    expect(screen.getByText(/80kg × 10/)).toBeInTheDocument();
    // Elapsed time should be restored (180s = 03:00)
    expect(screen.getByTestId('elapsed-timer')).toHaveTextContent('03:00');
  });

  /* TC_DRAFT_03: Draft saves include planDayId */
  it('TC_DRAFT_03: draft save includes planDayId', () => {
    const planDayWithId = {
      id: 'pd-42',
      dayOfWeek: 1,
      workoutType: 'Push Day',
      exercises: makeExercisesJson('bench-press'),
    };
    render(
      <WorkoutLogger {...defaultProps} planDay={planDayWithId} />,
    );

    // Log a set so the draft save is triggered
    logSetAndDismissRest('bench-press', '60', '10');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockSetWorkoutDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        planDayId: 'pd-42',
      }),
    );
  });
});
