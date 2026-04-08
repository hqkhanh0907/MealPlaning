import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ExerciseWorkoutCard from '@/features/fitness/components/ExerciseWorkoutCard';
import type { OverloadSuggestion } from '@/features/fitness/hooks/useProgressiveOverload';
import type { BodyRegion, EquipmentType, ExerciseSessionMeta, MuscleGroup, WorkoutSet } from '@/features/fitness/types';
import type { SetInputData } from '@/schemas/workoutLoggerSchema';

const mockExercise = {
  id: 'bench-press',
  nameVi: 'Đẩy ngực nằm',
  nameEn: 'Bench Press',
  muscleGroup: 'chest' as MuscleGroup,
  secondaryMuscles: ['shoulders', 'arms'] as MuscleGroup[],
  category: 'compound' as const,
  equipment: ['barbell'] as EquipmentType[],
  contraindicated: [] as BodyRegion[],
  exerciseType: 'strength' as const,
  defaultRepsMin: 8,
  defaultRepsMax: 12,
  isCustom: false,
  updatedAt: '2026-01-01',
};

const mockMeta: ExerciseSessionMeta = {
  exercise: mockExercise,
  plannedSets: 4,
  repsMin: 8,
  repsMax: 12,
  restSeconds: 90,
};

const mockSet1: WorkoutSet = {
  id: 'set-1',
  workoutId: 'w1',
  exerciseId: 'bench-press',
  setNumber: 1,
  weightKg: 80,
  reps: 10,
  rpe: 8,
  updatedAt: '2026-01-01',
};

const mockSet2: WorkoutSet = {
  id: 'set-2',
  workoutId: 'w1',
  exerciseId: 'bench-press',
  setNumber: 2,
  weightKg: 80,
  reps: 8,
  rpe: 9,
  updatedAt: '2026-01-01',
};

const defaultProps = {
  meta: mockMeta,
  exerciseIndex: 1,
  totalExercises: 6,
  loggedSets: [] as WorkoutSet[],
  currentInput: { weight: 0, reps: 0 } as SetInputData,
  overloadSuggestion: null as OverloadSuggestion | null,
  onWeightChange: vi.fn(),
  onRepsChange: vi.fn(),
  onRpeSelect: vi.fn(),
  onWeightInput: vi.fn(),
  onRepsInput: vi.fn(),
  onDeleteSet: vi.fn(),
  onEditSet: vi.fn(),
  onCopyLastSet: vi.fn(),
  onApplyOverload: vi.fn(),
  onSwapExercise: vi.fn(),
};

describe('ExerciseWorkoutCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders exercise name and muscle groups', () => {
    render(<ExerciseWorkoutCard {...defaultProps} />);
    expect(screen.getByText('Đẩy ngực nằm')).toBeInTheDocument();
    // Muscle groups translated: chest→Ngực, shoulders→Vai, arms→Tay
    expect(screen.getByTestId('muscle-groups')).toHaveTextContent('Ngực');
    expect(screen.getByTestId('muscle-groups')).toHaveTextContent('Vai');
    expect(screen.getByTestId('muscle-groups')).toHaveTextContent('Tay');
  });

  it('shows progress indicator', () => {
    render(<ExerciseWorkoutCard {...defaultProps} />);
    // exerciseIndex=1 → current=2, totalExercises=6
    expect(screen.getByTestId('exercise-progress')).toHaveTextContent('2/6');
  });

  it('renders active input row when no sets logged', () => {
    render(<ExerciseWorkoutCard {...defaultProps} />);
    expect(screen.getByTestId('weight-input')).toBeInTheDocument();
    expect(screen.getByTestId('reps-input')).toBeInTheDocument();
    expect(screen.getByTestId('rpe-select')).toBeInTheDocument();
  });

  it('renders completed sets in table', () => {
    render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1, mockSet2]} />);
    expect(screen.getByTestId('logged-set-set-1')).toBeInTheDocument();
    expect(screen.getByTestId('logged-set-set-2')).toBeInTheDocument();
    expect(screen.getByTestId('logged-set-set-1')).toHaveTextContent('80');
    expect(screen.getByTestId('logged-set-set-1')).toHaveTextContent('10');
  });

  it('calls onEditSet when completed set edit button clicked', () => {
    const onEditSet = vi.fn();
    render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1]} onEditSet={onEditSet} />);
    fireEvent.click(screen.getByTestId('edit-set-set-1'));
    expect(onEditSet).toHaveBeenCalledWith(mockSet1);
  });

  it('calls onDeleteSet when delete clicked', () => {
    const onDeleteSet = vi.fn();
    render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1]} onDeleteSet={onDeleteSet} />);
    fireEvent.click(screen.getByTestId('delete-set-set-1'));
    expect(onDeleteSet).toHaveBeenCalledWith('set-1');
  });

  it('shows copy last set when sets exist', () => {
    render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1]} />);
    expect(screen.getByTestId('copy-last-set')).toBeInTheDocument();
  });

  it('hides copy last set when no sets logged', () => {
    render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[]} />);
    expect(screen.queryByTestId('copy-last-set')).not.toBeInTheDocument();
  });

  it('calls onCopyLastSet when copy button clicked', () => {
    const onCopyLastSet = vi.fn();
    render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1]} onCopyLastSet={onCopyLastSet} />);
    fireEvent.click(screen.getByTestId('copy-last-set'));
    expect(onCopyLastSet).toHaveBeenCalledTimes(1);
  });

  it('shows overload chip when suggestion available', () => {
    const suggestion: OverloadSuggestion = {
      weight: 82.5,
      reps: 8,
      source: 'progressive_overload',
    };
    render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={suggestion} />);
    expect(screen.getByTestId('overload-chip')).toBeInTheDocument();
    expect(screen.getByTestId('overload-chip')).toHaveTextContent('82.5');
  });

  it('hides overload chip when suggestion is null', () => {
    render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={null} />);
    expect(screen.queryByTestId('overload-chip')).not.toBeInTheDocument();
  });

  it('calls onApplyOverload when overload chip clicked', () => {
    const onApplyOverload = vi.fn();
    const suggestion: OverloadSuggestion = { weight: 82.5, reps: 8, source: 'progressive_overload' };
    render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={suggestion} onApplyOverload={onApplyOverload} />);
    fireEvent.click(screen.getByTestId('overload-chip'));
    expect(onApplyOverload).toHaveBeenCalledWith(suggestion);
  });

  it('RPE select calls onRpeSelect with correct value', () => {
    const onRpeSelect = vi.fn();
    render(<ExerciseWorkoutCard {...defaultProps} onRpeSelect={onRpeSelect} />);
    const select = screen.getByTestId('rpe-select');
    fireEvent.change(select, { target: { value: '8' } });
    expect(onRpeSelect).toHaveBeenCalledWith(8);
  });

  it('weight input calls onWeightInput', () => {
    const onWeightInput = vi.fn();
    render(<ExerciseWorkoutCard {...defaultProps} onWeightInput={onWeightInput} />);
    const input = screen.getByTestId('weight-input');
    fireEvent.change(input, { target: { value: '85' } });
    expect(onWeightInput).toHaveBeenCalledWith('85');
  });

  it('reps input calls onRepsInput', () => {
    const onRepsInput = vi.fn();
    render(<ExerciseWorkoutCard {...defaultProps} onRepsInput={onRepsInput} />);
    const input = screen.getByTestId('reps-input');
    fireEvent.change(input, { target: { value: '12' } });
    expect(onRepsInput).toHaveBeenCalledWith('12');
  });

  it('renders swap button and calls onSwapExercise', () => {
    const onSwapExercise = vi.fn();
    render(<ExerciseWorkoutCard {...defaultProps} onSwapExercise={onSwapExercise} />);
    fireEvent.click(screen.getByTestId('swap-exercise'));
    expect(onSwapExercise).toHaveBeenCalledTimes(1);
  });
});
