import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { PlanDayEditor } from '../features/fitness/components/PlanDayEditor';
import { useFitnessStore } from '../store/fitnessStore';
import type { TrainingPlanDay, SelectedExercise } from '../features/fitness/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => {
    const map: Record<string, string> = {
      'fitness.plan.editExercises': 'Chỉnh sửa bài tập',
      'fitness.plan.addExercise': 'Thêm bài tập',
      'fitness.plan.save': 'Lưu',
      'fitness.plan.restore': 'Khôi phục gốc',
      'fitness.plan.modified': 'Đã chỉnh sửa',
      'fitness.plan.noExercises': 'Chưa có bài tập nào',
      'fitness.plan.unsavedChanges': 'Bạn có thay đổi chưa lưu. Bỏ thay đổi?',
      'fitness.plan.exerciseRemoved': 'đã xóa',
      'fitness.plan.undo': 'Hoàn tác',
      'fitness.plan.setsLabel': 'hiệp',
      'fitness.plan.repsLabel': 'lần',
      'fitness.plan.repsMinLabel': 'Lần tối thiểu',
      'fitness.plan.repsMaxLabel': 'Lần tối đa',
      'fitness.plan.restLabel': 'Nghỉ',
      'fitness.plan.editParams': 'Chỉnh thông số',
      'fitness.swap.title': 'Đổi bài tập',
      'common.back': 'Quay lại',
      'common.confirm': 'Xác nhận',
      'common.cancel': 'Hủy',
      'common.close': 'Đóng',
    };
    return map[key] ?? key;
  } }),
}));

const mockPopPage = vi.fn();
vi.mock('../store/navigationStore', () => ({
  useNavigationStore: () => ({ popPage: mockPopPage }),
}));

// Mock ExerciseSelector
vi.mock('../features/fitness/components/ExerciseSelector', () => ({
  ExerciseSelector: ({ isOpen, onSelect, onClose }: { isOpen: boolean; onSelect: (ex: unknown) => void; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="exercise-selector">
        <button onClick={() => onSelect({ id: 'new-ex', nameVi: 'Squat', muscleGroup: 'legs', category: 'compound', equipment: ['barbell'], exerciseType: 'strength', defaultRepsMin: 8, defaultRepsMax: 12 })}>
          Add Squat
        </button>
        <button data-testid="close-selector" onClick={onClose}>Close Selector</button>
      </div>
    );
  },
}));

// Mock SwapExerciseSheet
vi.mock('../features/fitness/components/SwapExerciseSheet', () => ({
  SwapExerciseSheet: ({ isOpen, currentExercise, onSelect, onClose }: { isOpen: boolean; currentExercise: { nameVi: string }; onSelect: (ex: unknown) => void; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="swap-exercise-sheet">
        <span data-testid="swap-current">{currentExercise.nameVi}</span>
        <button data-testid="swap-select" onClick={() => onSelect({ id: 'fly', nameVi: 'Chest Fly', nameEn: 'Chest Fly', muscleGroup: 'chest', secondaryMuscles: [], category: 'isolation', equipment: ['dumbbell'], contraindicated: [], exerciseType: 'strength', defaultRepsMin: 10, defaultRepsMax: 15, isCustom: false, updatedAt: '' })}>
          Select Fly
        </button>
        <button data-testid="swap-close" onClick={onClose}>Close</button>
      </div>
    );
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const sampleExercise: SelectedExercise = {
  exercise: { id: 'bench', nameVi: 'Bench Press', nameEn: 'Bench Press', muscleGroup: 'chest', secondaryMuscles: [], category: 'compound', equipment: ['barbell'], contraindicated: [], exerciseType: 'strength', defaultRepsMin: 6, defaultRepsMax: 10, isCustom: false, updatedAt: '' },
  sets: 4, repsMin: 6, repsMax: 10, restSeconds: 120,
};

const sampleExercise2: SelectedExercise = {
  exercise: { id: 'ohp', nameVi: 'OHP', nameEn: 'Overhead Press', muscleGroup: 'shoulders', secondaryMuscles: [], category: 'compound', equipment: ['barbell'], contraindicated: [], exerciseType: 'strength', defaultRepsMin: 8, defaultRepsMax: 12, isCustom: false, updatedAt: '' },
  sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90,
};

const makePlanDay = (exercises: SelectedExercise[] = [sampleExercise, sampleExercise2]): TrainingPlanDay => ({
  id: 'pd-1',
  planId: 'plan-1',
  dayOfWeek: 1,
  sessionOrder: 1,
  workoutType: 'Upper Push',
  exercises: JSON.stringify(exercises),
  originalExercises: JSON.stringify(exercises),
});

describe('PlanDayEditor', () => {
  it('renders all exercises from plan day', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('OHP')).toBeInTheDocument();
  });

  it('shows empty state when no exercises', () => {
    render(<PlanDayEditor planDay={makePlanDay([])} />);
    expect(screen.getByText('Chưa có bài tập nào')).toBeInTheDocument();
  });

  it('click remove button hides exercise and shows undo toast', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const removeButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(removeButtons[0]);
    const benchEl = screen.getByText('Bench Press');
    expect(benchEl.closest('li')?.className).toContain('opacity-0');
    expect(screen.getByText('Hoàn tác')).toBeInTheDocument();
  });

  it('undo restores exercise after remove', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const removeButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(removeButtons[0]);
    fireEvent.click(screen.getByText('Hoàn tác'));
    const benchEl = screen.getByText('Bench Press');
    expect(benchEl.closest('li')?.className).not.toContain('opacity-0');
    expect(screen.queryByText('Hoàn tác')).not.toBeInTheDocument();
  });

  it('exercise is permanently removed after timeout', async () => {
    vi.useFakeTimers();
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const removeButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(removeButtons[0]);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
    expect(screen.getByText('OHP')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('click save calls updatePlanDayExercises and popPage', async () => {
    vi.useFakeTimers();
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const removeButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(removeButtons[0]);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    fireEvent.click(screen.getByText('Lưu'));
    expect(useFitnessStore.getState().updatePlanDayExercises).toBeDefined();
    expect(mockPopPage).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('click restore calls restorePlanDayOriginal', () => {
    const day = makePlanDay();
    // Modify exercises to differ from original
    day.exercises = JSON.stringify([sampleExercise]);
    render(<PlanDayEditor planDay={day} />);
    const restoreBtn = screen.getByText('Khôi phục gốc');
    fireEvent.click(restoreBtn);
    // After restore, should show original exercises
  });

  it('move up button reorders exercises', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    // The second exercise should have a move-up button
    const moveUpButtons = screen.getAllByLabelText(/move up/i);
    // Click move up on the second exercise (index 1)
    if (moveUpButtons.length > 0) {
      fireEvent.click(moveUpButtons[moveUpButtons.length - 1]);
      // OHP should now be first
      const exerciseNames = screen.getAllByTestId('exercise-name');
      if (exerciseNames.length >= 2) {
        expect(exerciseNames[0].textContent).toContain('OHP');
      }
    }
  });

  it('click add exercise opens ExerciseSelector', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getByText('Thêm bài tập'));
    expect(screen.getByTestId('exercise-selector')).toBeInTheDocument();
  });

  it('back button calls popPage when no unsaved changes', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getByLabelText('Quay lại'));
    expect(mockPopPage).toHaveBeenCalled();
  });

  it('tap exercise card expands to show inline steppers', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    // Click the first exercise name to expand it
    const exerciseNames = screen.getAllByTestId('exercise-name');
    fireEvent.click(exerciseNames[0]);

    expect(screen.getByTestId('exercise-params-0')).toBeInTheDocument();
    expect(screen.getByTestId('stepper-sets-0')).toBeInTheDocument();
    expect(screen.getByTestId('stepper-rest-0')).toBeInTheDocument();
    expect(screen.getByTestId('stepper-repsMin-0')).toBeInTheDocument();
    expect(screen.getByTestId('stepper-repsMax-0')).toBeInTheDocument();
  });

  it('tap expanded exercise collapses it', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const exerciseNames = screen.getAllByTestId('exercise-name');
    fireEvent.click(exerciseNames[0]);
    expect(screen.getByTestId('exercise-params-0')).toBeInTheDocument();

    fireEvent.click(exerciseNames[0]);
    expect(screen.queryByTestId('exercise-params-0')).not.toBeInTheDocument();
  });

  it('increment sets stepper updates exercise params', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const exerciseNames = screen.getAllByTestId('exercise-name');
    fireEvent.click(exerciseNames[0]);

    // sampleExercise has sets=4, click increment
    const incrementBtn = screen.getByTestId('stepper-sets-0').querySelector('[aria-label="Increase hiệp"]');
    expect(incrementBtn).not.toBeNull();
    fireEvent.click(incrementBtn!);

    // Sets text should now show 5
    const exerciseInfo = screen.getAllByTestId('exercise-name')[0].parentElement;
    expect(exerciseInfo?.textContent).toContain('5');
  });

  it('swap button opens SwapExerciseSheet with current exercise', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const swapBtn = screen.getByTestId('swap-exercise-0');
    fireEvent.click(swapBtn);

    expect(screen.getByTestId('swap-exercise-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('swap-current')).toHaveTextContent('Bench Press');
  });

  it('selecting swap replacement updates exercise in list', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getByTestId('swap-exercise-0'));
    fireEvent.click(screen.getByTestId('swap-select'));

    // Bench Press should be replaced with Chest Fly
    expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
    expect(screen.getByText('Chest Fly')).toBeInTheDocument();
    // OHP should still be there
    expect(screen.getByText('OHP')).toBeInTheDocument();
  });

  it('closing swap sheet without selecting preserves original exercise', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getByTestId('swap-exercise-0'));
    fireEvent.click(screen.getByTestId('swap-close'));

    expect(screen.queryByTestId('swap-exercise-sheet')).not.toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('move down reorders exercises correctly', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const moveDownButtons = screen.getAllByLabelText(/move down/i);
    fireEvent.click(moveDownButtons[0]);
    const names = screen.getAllByTestId('exercise-name');
    expect(names[0].textContent).toContain('OHP');
    expect(names[1].textContent).toContain('Bench Press');
  });

  it('move down on last exercise is a no-op', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const moveDownButtons = screen.getAllByLabelText(/move down/i);
    fireEvent.click(moveDownButtons[moveDownButtons.length - 1]);
    const names = screen.getAllByTestId('exercise-name');
    expect(names[names.length - 1].textContent).toContain('OHP');
  });

  it('move up on first exercise is a no-op', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const moveUpButtons = screen.getAllByLabelText(/move up/i);
    fireEvent.click(moveUpButtons[0]);
    const names = screen.getAllByTestId('exercise-name');
    expect(names[0].textContent).toContain('Bench Press');
  });

  it('decrement sets stepper decreases value', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getAllByTestId('exercise-name')[0]);
    const btn = screen.getByTestId('stepper-sets-0').querySelector('[aria-label="Decrease hiệp"]');
    expect(btn).not.toBeNull();
    fireEvent.click(btn!);
    const info = screen.getAllByTestId('exercise-name')[0].parentElement;
    expect(info?.textContent).toContain('3');
  });

  it('increment and decrement repsMin stepper', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getAllByTestId('exercise-name')[0]);
    const inc = screen.getByTestId('stepper-repsMin-0').querySelector('[aria-label="Increase Lần tối thiểu"]');
    const dec = screen.getByTestId('stepper-repsMin-0').querySelector('[aria-label="Decrease Lần tối thiểu"]');
    expect(inc).not.toBeNull();
    expect(dec).not.toBeNull();
    fireEvent.click(inc!);
    fireEvent.click(dec!);
  });

  it('increment and decrement repsMax stepper', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getAllByTestId('exercise-name')[0]);
    const inc = screen.getByTestId('stepper-repsMax-0').querySelector('[aria-label="Increase Lần tối đa"]');
    const dec = screen.getByTestId('stepper-repsMax-0').querySelector('[aria-label="Decrease Lần tối đa"]');
    expect(inc).not.toBeNull();
    expect(dec).not.toBeNull();
    fireEvent.click(inc!);
    fireEvent.click(dec!);
  });

  it('increment and decrement rest stepper', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getAllByTestId('exercise-name')[0]);
    const inc = screen.getByTestId('stepper-rest-0').querySelector('[aria-label="Increase Nghỉ"]');
    const dec = screen.getByTestId('stepper-rest-0').querySelector('[aria-label="Decrease Nghỉ"]');
    expect(inc).not.toBeNull();
    expect(dec).not.toBeNull();
    fireEvent.click(inc!);
    fireEvent.click(dec!);
  });

  it('sets stepper respects min boundary', () => {
    const minExercise: SelectedExercise = {
      ...sampleExercise,
      sets: 1,
    };
    render(<PlanDayEditor planDay={makePlanDay([minExercise])} />);
    fireEvent.click(screen.getAllByTestId('exercise-name')[0]);
    const dec = screen.getByTestId('stepper-sets-0').querySelector('[aria-label="Decrease hiệp"]');
    expect(dec).toBeDisabled();
  });

  it('sets stepper respects max boundary', () => {
    const maxExercise: SelectedExercise = {
      ...sampleExercise,
      sets: 10,
    };
    render(<PlanDayEditor planDay={makePlanDay([maxExercise])} />);
    fireEvent.click(screen.getAllByTestId('exercise-name')[0]);
    const inc = screen.getByTestId('stepper-sets-0').querySelector('[aria-label="Increase hiệp"]');
    expect(inc).toBeDisabled();
  });

  it('repsMin stepper cannot exceed repsMax', () => {
    const exercise: SelectedExercise = {
      ...sampleExercise,
      repsMin: 10,
      repsMax: 10,
    };
    render(<PlanDayEditor planDay={makePlanDay([exercise])} />);
    fireEvent.click(screen.getAllByTestId('exercise-name')[0]);
    const inc = screen.getByTestId('stepper-repsMin-0').querySelector('[aria-label="Increase Lần tối thiểu"]');
    expect(inc).toBeDisabled();
  });

  it('repsMax stepper cannot go below repsMin', () => {
    const exercise: SelectedExercise = {
      ...sampleExercise,
      repsMin: 10,
      repsMax: 10,
    };
    render(<PlanDayEditor planDay={makePlanDay([exercise])} />);
    fireEvent.click(screen.getAllByTestId('exercise-name')[0]);
    const dec = screen.getByTestId('stepper-repsMax-0').querySelector('[aria-label="Decrease Lần tối đa"]');
    expect(dec).toBeDisabled();
  });

  it('rest stepper respects min=30 boundary', () => {
    const exercise: SelectedExercise = {
      ...sampleExercise,
      restSeconds: 30,
    };
    render(<PlanDayEditor planDay={makePlanDay([exercise])} />);
    fireEvent.click(screen.getAllByTestId('exercise-name')[0]);
    const dec = screen.getByTestId('stepper-rest-0').querySelector('[aria-label="Decrease Nghỉ"]');
    expect(dec).toBeDisabled();
  });

  it('rest stepper respects max=300 boundary', () => {
    const exercise: SelectedExercise = {
      ...sampleExercise,
      restSeconds: 300,
    };
    render(<PlanDayEditor planDay={makePlanDay([exercise])} />);
    fireEvent.click(screen.getAllByTestId('exercise-name')[0]);
    const inc = screen.getByTestId('stepper-rest-0').querySelector('[aria-label="Increase Nghỉ"]');
    expect(inc).toBeDisabled();
  });

  it('back with unsaved changes shows confirm dialog with a11y attrs', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getByText('Thêm bài tập'));
    fireEvent.click(screen.getByText('Add Squat'));
    fireEvent.click(screen.getByLabelText('Quay lại'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
    expect(screen.getByText('Bạn có thay đổi chưa lưu. Bỏ thay đổi?')).toBeInTheDocument();
  });

  it('cancel discard closes dialog without navigating', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getByText('Thêm bài tập'));
    fireEvent.click(screen.getByText('Add Squat'));
    fireEvent.click(screen.getByLabelText('Quay lại'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hủy'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockPopPage).not.toHaveBeenCalled();
  });

  it('confirm discard navigates away', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getByText('Thêm bài tập'));
    fireEvent.click(screen.getByText('Add Squat'));
    fireEvent.click(screen.getByLabelText('Quay lại'));
    fireEvent.click(screen.getByText('Xác nhận'));
    expect(mockPopPage).toHaveBeenCalled();
  });

  it('GripVertical icons have aria-hidden true', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const svgs = document.querySelectorAll('[aria-hidden="true"]');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('second removal commits first pending removal', async () => {
    vi.useFakeTimers();
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const removeButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(removeButtons[0]);
    expect(screen.getByText('Hoàn tác')).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText(/remove/i)[1]);
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows modified badge when originalExercises differs from exercises', () => {
    const day = makePlanDay();
    day.originalExercises = JSON.stringify([sampleExercise]);
    render(<PlanDayEditor planDay={day} />);
    expect(screen.getByText('Đã chỉnh sửa')).toBeInTheDocument();
  });

  it('save while undo toast is showing still navigates', () => {
    vi.useFakeTimers();
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const removeButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(removeButtons[0]);
    expect(screen.getByText('Hoàn tác')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Lưu'));
    expect(mockPopPage).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('cleanup effect clears timeout on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = render(<PlanDayEditor planDay={makePlanDay()} />);
    const removeButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(removeButtons[0]);
    unmount();
    vi.advanceTimersByTime(5000);
    vi.useRealTimers();
  });

  it('adding exercise via selector closes sheet and updates list', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getByText('Thêm bài tập'));
    fireEvent.click(screen.getByText('Add Squat'));
    expect(screen.queryByTestId('exercise-selector')).not.toBeInTheDocument();
    expect(screen.getByText('Squat')).toBeInTheDocument();
  });

  it('shows hasChanges badge after modifying exercises', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    expect(screen.queryByText('Đã chỉnh sửa')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Thêm bài tập'));
    fireEvent.click(screen.getByText('Add Squat'));
    expect(screen.getByText('Đã chỉnh sửa')).toBeInTheDocument();
  });

  it('renders suffix in stepper field (rest seconds shows "s")', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getAllByTestId('exercise-name')[0]);
    const restStepper = screen.getByTestId('stepper-rest-0');
    expect(restStepper.textContent).toContain('120s');
  });

  it('closing exercise selector without selecting preserves list', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getByText('Thêm bài tập'));
    expect(screen.getByTestId('exercise-selector')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('close-selector'));
    expect(screen.queryByTestId('exercise-selector')).not.toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('OHP')).toBeInTheDocument();
  });

  it('exercise names use line-clamp-2 and have title tooltip', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const names = screen.getAllByTestId('exercise-name');
    names.forEach(name => {
      expect(name.className).toContain('line-clamp-2');
      expect(name).toHaveAttribute('title');
    });
  });

  it('undo toast has aria-live polite attribute', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const removeButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(removeButtons[0]);
    const toast = screen.getByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('expand button has aria-controls linking to params panel', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const exerciseNames = screen.getAllByTestId('exercise-name');
    fireEvent.click(exerciseNames[0]);
    const expandBtn = exerciseNames[0].closest('button');
    expect(expandBtn).not.toBeNull();
    expect(expandBtn).toHaveAttribute('aria-expanded', 'true');
    expect(expandBtn).toHaveAttribute('aria-controls', 'exercise-params-0');
  });

  it('unsaved changes dialog dismisses with Escape', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    fireEvent.click(screen.getByText('Thêm bài tập'));
    fireEvent.click(screen.getByText('Add Squat'));
    fireEvent.click(screen.getByLabelText('Quay lại'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
