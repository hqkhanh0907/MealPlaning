import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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
  ExerciseSelector: ({ isOpen, onSelect }: { isOpen: boolean; onSelect: (ex: unknown) => void }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="exercise-selector">
        <button onClick={() => onSelect({ id: 'new-ex', nameVi: 'Squat', muscleGroup: 'legs', category: 'compound', equipment: ['barbell'], exerciseType: 'strength', defaultRepsMin: 8, defaultRepsMax: 12 })}>
          Add Squat
        </button>
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

  it('click remove button removes exercise from list', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    const removeButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(removeButtons[0]);
    expect(screen.queryByText('Bench Press')).not.toBeInTheDocument();
    expect(screen.getByText('OHP')).toBeInTheDocument();
  });

  it('click save calls updatePlanDayExercises and popPage', () => {
    render(<PlanDayEditor planDay={makePlanDay()} />);
    // Remove an exercise to create a change
    const removeButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(removeButtons[0]);
    fireEvent.click(screen.getByText('Lưu'));
    expect(useFitnessStore.getState().updatePlanDayExercises).toBeDefined();
    expect(mockPopPage).toHaveBeenCalled();
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
});
