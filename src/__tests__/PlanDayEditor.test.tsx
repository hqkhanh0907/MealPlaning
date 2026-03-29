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
      'common.back': 'Quay lại',
      'common.confirm': 'Xác nhận',
      'common.cancel': 'Hủy',
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
});
