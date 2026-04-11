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

const mockSet3: WorkoutSet = {
  id: 'set-3',
  workoutId: 'w1',
  exerciseId: 'bench-press',
  setNumber: 3,
  weightKg: 82.5,
  reps: 10,
  updatedAt: '2026-01-01',
};

const mockPrevSessionSet: WorkoutSet = {
  id: 'prev-set-1',
  workoutId: 'w-prev',
  exerciseId: 'bench-press',
  setNumber: 1,
  weightKg: 75,
  reps: 12,
  rpe: 7,
  updatedAt: '2025-12-25',
};

const defaultProps = {
  meta: mockMeta,
  exerciseIndex: 1,
  totalExercises: 6,
  loggedSets: [] as WorkoutSet[],
  lastSessionSet: null as WorkoutSet | null,
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
  onCopyPrevSession: vi.fn(),
  onApplyOverload: vi.fn(),
  onSwapExercise: vi.fn(),
  onLogSet: vi.fn(),
};

describe('ExerciseWorkoutCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders exercise name and muscle groups', () => {
    render(<ExerciseWorkoutCard {...defaultProps} />);
    expect(screen.getByText('Đẩy ngực nằm')).toBeInTheDocument();
    expect(screen.getByTestId('muscle-groups')).toHaveTextContent('Ngực');
    expect(screen.getByTestId('muscle-groups')).toHaveTextContent('Vai');
    expect(screen.getByTestId('muscle-groups')).toHaveTextContent('Tay');
  });

  it('shows progress indicator', () => {
    render(<ExerciseWorkoutCard {...defaultProps} />);
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

  it('weight input shows empty string when currentInput.weight is NaN', () => {
    render(<ExerciseWorkoutCard {...defaultProps} currentInput={{ weight: NaN, reps: 5 } as SetInputData} />);
    const input = screen.getByTestId('weight-input') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('reps input shows empty string when currentInput.reps is NaN', () => {
    render(<ExerciseWorkoutCard {...defaultProps} currentInput={{ weight: 60, reps: NaN } as SetInputData} />);
    const input = screen.getByTestId('reps-input') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('weight stepper minus calls onWeightChange with negative increment', () => {
    const onWeightChange = vi.fn();
    render(<ExerciseWorkoutCard {...defaultProps} onWeightChange={onWeightChange} />);
    fireEvent.click(screen.getByTestId('weight-minus'));
    expect(onWeightChange).toHaveBeenCalledWith(-0.5);
  });

  it('weight stepper plus calls onWeightChange with positive increment', () => {
    const onWeightChange = vi.fn();
    render(<ExerciseWorkoutCard {...defaultProps} onWeightChange={onWeightChange} />);
    fireEvent.click(screen.getByTestId('weight-plus'));
    expect(onWeightChange).toHaveBeenCalledWith(0.5);
  });

  it('reps stepper minus calls onRepsChange with negative increment', () => {
    const onRepsChange = vi.fn();
    render(<ExerciseWorkoutCard {...defaultProps} onRepsChange={onRepsChange} />);
    fireEvent.click(screen.getByTestId('reps-minus'));
    expect(onRepsChange).toHaveBeenCalledWith(-1);
  });

  it('reps stepper plus calls onRepsChange with positive increment', () => {
    const onRepsChange = vi.fn();
    render(<ExerciseWorkoutCard {...defaultProps} onRepsChange={onRepsChange} />);
    fireEvent.click(screen.getByTestId('reps-plus'));
    expect(onRepsChange).toHaveBeenCalledWith(1);
  });

  it('renders swap button and calls onSwapExercise', () => {
    const onSwapExercise = vi.fn();
    render(<ExerciseWorkoutCard {...defaultProps} onSwapExercise={onSwapExercise} />);
    fireEvent.click(screen.getByTestId('swap-exercise'));
    expect(onSwapExercise).toHaveBeenCalledTimes(1);
  });

  it('calls onLogSet when confirm button clicked', () => {
    const onLogSet = vi.fn();
    render(<ExerciseWorkoutCard {...defaultProps} onLogSet={onLogSet} />);
    fireEvent.click(screen.getByTestId('confirm-set-btn'));
    expect(onLogSet).toHaveBeenCalledTimes(1);
  });

  it('renders active set card with correct set number', () => {
    render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1, mockSet2]} />);
    const activeCard = screen.getByTestId('active-set-card');
    expect(activeCard).toBeInTheDocument();
    expect(activeCard).toHaveTextContent('3');
  });

  it('displays 0 for logged set reps when reps is null', () => {
    const nullRepsSet: WorkoutSet = { ...mockSet1, reps: null as unknown as number };
    render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[nullRepsSet]} />);
    const completedSet = screen.getByTestId('logged-set-set-1');
    expect(completedSet).toHaveTextContent('80');
    expect(completedSet).toHaveTextContent(/×\s*0/);
  });

  // === TC_W302_01: Copy button hidden on set 1 (no previous sets) ===
  describe('Copy Previous Set', () => {
    it('TC_W302_01: hides copy button when no sets logged (set 1)', () => {
      render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[]} />);
      expect(screen.queryByTestId('btn-copy-last-set')).not.toBeInTheDocument();
    });

    // === TC_W302_02: Copy button visible on set 2 ===
    it('TC_W302_02: shows copy-last-set button when 1 set logged (entering set 2)', () => {
      render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1]} />);
      const btn = screen.getByTestId('btn-copy-last-set');
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent('80');
      expect(btn).toHaveTextContent('10');
    });

    // === TC_W302_03: Copy button visible on set 3 with set 2 data ===
    it('TC_W302_03: shows copy-last-set button on set 3 with latest set data', () => {
      render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1, mockSet2]} />);
      const btn = screen.getByTestId('btn-copy-last-set');
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent('80');
      expect(btn).toHaveTextContent('8');
    });

    // === TC_W302_04: Copy fills weight + reps + RPE from previous set ===
    it('TC_W302_04: calls onCopyLastSet when copy button clicked', () => {
      const onCopyLastSet = vi.fn();
      render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1]} onCopyLastSet={onCopyLastSet} />);
      fireEvent.click(screen.getByTestId('btn-copy-last-set'));
      expect(onCopyLastSet).toHaveBeenCalledTimes(1);
    });

    it('shows prev-session button when no current sets but lastSessionSet exists', () => {
      render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[]} lastSessionSet={mockPrevSessionSet} />);
      expect(screen.queryByTestId('btn-copy-last-set')).not.toBeInTheDocument();
      const prevBtn = screen.getByTestId('btn-copy-prev-session');
      expect(prevBtn).toBeInTheDocument();
      expect(prevBtn).toHaveTextContent('75');
      expect(prevBtn).toHaveTextContent('12');
    });

    it('hides prev-session button when current sets exist (copy-last-set takes priority)', () => {
      render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1]} lastSessionSet={mockPrevSessionSet} />);
      expect(screen.getByTestId('btn-copy-last-set')).toBeInTheDocument();
      expect(screen.queryByTestId('btn-copy-prev-session')).not.toBeInTheDocument();
    });

    it('calls onCopyPrevSession when prev-session button clicked', () => {
      const onCopyPrevSession = vi.fn();
      render(
        <ExerciseWorkoutCard
          {...defaultProps}
          loggedSets={[]}
          lastSessionSet={mockPrevSessionSet}
          onCopyPrevSession={onCopyPrevSession}
        />,
      );
      fireEvent.click(screen.getByTestId('btn-copy-prev-session'));
      expect(onCopyPrevSession).toHaveBeenCalledTimes(1);
    });

    it('displays 0 reps for prev-session set when reps is null', () => {
      const nullRepsSet: WorkoutSet = { ...mockPrevSessionSet, reps: null as unknown as number };
      render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[]} lastSessionSet={nullRepsSet} />);
      const prevBtn = screen.getByTestId('btn-copy-prev-session');
      expect(prevBtn).toHaveTextContent(/×\s*0/);
    });

    it('displays 0 reps for copy-last-set when last set has null reps', () => {
      const nullRepsSet: WorkoutSet = { ...mockSet1, reps: null as unknown as number };
      render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[nullRepsSet]} />);
      const btn = screen.getByTestId('btn-copy-last-set');
      expect(btn).toHaveTextContent(/×\s*0/);
    });
  });

  // === TC_W302_05-06: Overload Chip ===
  describe('Progressive Overload Chip', () => {
    const progressiveSuggestion: OverloadSuggestion = {
      weight: 82.5,
      reps: 8,
      source: 'progressive_overload',
    };

    const repProgressionSuggestion: OverloadSuggestion = {
      weight: 80,
      reps: 11,
      source: 'rep_progression',
    };

    // TC_W302_05: Overload chip displays when suggestion returned
    it('TC_W302_05: shows overload chip when suggestion available (not plateaued)', () => {
      render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={progressiveSuggestion} />);
      const chip = screen.getByTestId('btn-overload-suggestion');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent('82.5');
      expect(chip).toHaveTextContent('8');
    });

    it('hides overload chip when suggestion is null', () => {
      render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={null} />);
      expect(screen.queryByTestId('btn-overload-suggestion')).not.toBeInTheDocument();
    });

    // TC_W302_06: Tap overload chip auto-fills values
    it('TC_W302_06: calls onApplyOverload when overload chip clicked', () => {
      const onApplyOverload = vi.fn();
      render(
        <ExerciseWorkoutCard
          {...defaultProps}
          overloadSuggestion={progressiveSuggestion}
          onApplyOverload={onApplyOverload}
        />,
      );
      fireEvent.click(screen.getByTestId('btn-overload-suggestion'));
      expect(onApplyOverload).toHaveBeenCalledWith(progressiveSuggestion);
    });

    // TC_W302_10: rep_progression source differentiation
    it('TC_W302_10: shows overload chip for rep_progression source', () => {
      render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={repProgressionSuggestion} />);
      const chip = screen.getByTestId('btn-overload-suggestion');
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveTextContent('80');
      expect(chip).toHaveTextContent('11');
    });

    // TC_W302_08: Non-plateau chip uses TrendingUp icon and energy CSS
    it('TC_W302_08: non-plateau chip has energy styling (no warning text)', () => {
      render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={progressiveSuggestion} />);
      const chip = screen.getByTestId('btn-overload-suggestion');
      expect(chip.className).toContain('bg-energy-subtle');
      expect(chip.className).toContain('text-energy');
      expect(screen.queryByTestId('plateau-warning')).not.toBeInTheDocument();
    });

    // TC_W302_13: NaN weight/reps in suggestion → chip not shown
    it('TC_W302_13: hides overload chip when suggestion has NaN weight', () => {
      const nanSuggestion: OverloadSuggestion = { weight: Number.NaN, reps: 8, source: 'progressive_overload' };
      render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={nanSuggestion} />);
      expect(screen.queryByTestId('btn-overload-suggestion')).not.toBeInTheDocument();
    });

    it('hides overload chip when suggestion has NaN reps', () => {
      const nanSuggestion: OverloadSuggestion = { weight: 80, reps: Number.NaN, source: 'progressive_overload' };
      render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={nanSuggestion} />);
      expect(screen.queryByTestId('btn-overload-suggestion')).not.toBeInTheDocument();
    });

    it('hides overload chip when suggestion weight is 0', () => {
      const zeroSuggestion: OverloadSuggestion = { weight: 0, reps: 8, source: 'progressive_overload' };
      render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={zeroSuggestion} />);
      expect(screen.queryByTestId('btn-overload-suggestion')).not.toBeInTheDocument();
    });
  });

  // === TC_W302_07, TC_W302_09: Plateau State ===
  describe('Plateau Warning', () => {
    const plateauSuggestion: OverloadSuggestion = {
      weight: 82.5,
      reps: 8,
      source: 'progressive_overload',
      isPlateaued: true,
      plateauWeeks: 4,
    };

    // TC_W302_07: Plateau state shows AlertTriangle, warning CSS, "X tuần không tiến bộ"
    it('TC_W302_07: shows plateau warning with weeks when isPlateaued=true', () => {
      render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={plateauSuggestion} />);
      const chip = screen.getByTestId('btn-overload-suggestion');
      expect(chip).toBeInTheDocument();
      expect(chip.className).toContain('bg-warning/10');
      expect(chip.className).toContain('text-warning');
      const warningBadge = screen.getByTestId('plateau-warning');
      expect(warningBadge).toBeInTheDocument();
      expect(warningBadge).toHaveTextContent('4');
    });

    // TC_W302_09: plateauWeeks rendering when isPlateaued=true
    it('TC_W302_09: renders plateauWeeks in warning badge', () => {
      const suggestion5Weeks: OverloadSuggestion = {
        weight: 80,
        reps: 10,
        source: 'progressive_overload',
        isPlateaued: true,
        plateauWeeks: 5,
      };
      render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={suggestion5Weeks} />);
      expect(screen.getByTestId('plateau-warning')).toHaveTextContent('5');
    });

    it('does not show plateau warning when plateauWeeks is null', () => {
      const noPWeeks: OverloadSuggestion = {
        weight: 80,
        reps: 10,
        source: 'progressive_overload',
        isPlateaued: true,
      };
      render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={noPWeeks} />);
      expect(screen.getByTestId('btn-overload-suggestion')).toBeInTheDocument();
      expect(screen.queryByTestId('plateau-warning')).not.toBeInTheDocument();
    });

    it('calls onApplyOverload when plateau chip clicked', () => {
      const onApplyOverload = vi.fn();
      render(
        <ExerciseWorkoutCard
          {...defaultProps}
          overloadSuggestion={plateauSuggestion}
          onApplyOverload={onApplyOverload}
        />,
      );
      fireEvent.click(screen.getByTestId('btn-overload-suggestion'));
      expect(onApplyOverload).toHaveBeenCalledWith(plateauSuggestion);
    });
  });

  // === TC_W302_11-12: RPE display / clearing ===
  describe('RPE Display', () => {
    // TC_W302_11: RPE display when provided
    it('TC_W302_11: shows RPE badge for logged set with rpe value', () => {
      render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1]} />);
      const setRow = screen.getByTestId('logged-set-set-1');
      expect(setRow).toHaveTextContent('RPE 8');
    });

    // TC_W302_12: RPE not shown when undefined
    it('TC_W302_12: hides RPE badge when rpe is undefined', () => {
      render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet3]} />);
      const setRow = screen.getByTestId('logged-set-set-3');
      expect(setRow).not.toHaveTextContent('RPE');
    });

    it('clears RPE when empty option selected', () => {
      const onRpeSelect = vi.fn();
      render(<ExerciseWorkoutCard {...defaultProps} onRpeSelect={onRpeSelect} />);
      const select = screen.getByTestId('rpe-select');
      fireEvent.change(select, { target: { value: '' } });
      expect(onRpeSelect).toHaveBeenCalledWith(undefined);
    });
  });

  // === TC_W302_14-16: Touch targets & active states ===
  describe('Touch Targets & Active States', () => {
    // TC_W302_14: min-h-11 on copy-last-set button
    it('TC_W302_14: copy-last-set button has min-h-11 class', () => {
      render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1]} />);
      const btn = screen.getByTestId('btn-copy-last-set');
      expect(btn.className).toContain('min-h-11');
    });

    // TC_W302_15: active:scale-[0.98] on copy-last-set button
    it('TC_W302_15: copy-last-set button has active:scale-[0.98] class', () => {
      render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[mockSet1]} />);
      const btn = screen.getByTestId('btn-copy-last-set');
      expect(btn.className).toContain('active:scale-[0.98]');
    });

    // TC_W302_16: swap-exercise button has min-h-11 and active:scale classes
    it('TC_W302_16: swap-exercise button has min-h-11 and active:scale-[0.98]', () => {
      render(<ExerciseWorkoutCard {...defaultProps} />);
      const btn = screen.getByTestId('swap-exercise');
      expect(btn.className).toContain('min-h-11');
      expect(btn.className).toContain('active:scale-[0.98]');
    });

    it('overload chip button has min-h-11 and active:scale-[0.98]', () => {
      const suggestion: OverloadSuggestion = { weight: 82.5, reps: 8, source: 'progressive_overload' };
      render(<ExerciseWorkoutCard {...defaultProps} overloadSuggestion={suggestion} />);
      const btn = screen.getByTestId('btn-overload-suggestion');
      expect(btn.className).toContain('min-h-11');
      expect(btn.className).toContain('active:scale-[0.98]');
    });

    it('prev-session button has min-h-11 and active:scale-[0.98]', () => {
      render(<ExerciseWorkoutCard {...defaultProps} loggedSets={[]} lastSessionSet={mockPrevSessionSet} />);
      const btn = screen.getByTestId('btn-copy-prev-session');
      expect(btn.className).toContain('min-h-11');
      expect(btn.className).toContain('active:scale-[0.98]');
    });
  });
});
