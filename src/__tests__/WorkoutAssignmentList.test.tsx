import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  WorkoutAssignmentList,
  type WorkoutAssignmentListProps,
} from '../features/fitness/components/WorkoutAssignmentList';
import type { TrainingPlanDay } from '../features/fitness/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'fitness.scheduleEditor.monday': 'T2',
        'fitness.scheduleEditor.tuesday': 'T3',
        'fitness.scheduleEditor.wednesday': 'T4',
        'fitness.scheduleEditor.thursday': 'T5',
        'fitness.scheduleEditor.friday': 'T6',
        'fitness.scheduleEditor.saturday': 'T7',
        'fitness.scheduleEditor.sunday': 'CN',
        'fitness.scheduleEditor.noWorkouts': 'Không có bài tập nào',
        'fitness.scheduleEditor.moveUp': 'Di chuyển lên',
        'fitness.scheduleEditor.moveDown': 'Di chuyển xuống',
        'fitness.scheduleEditor.dragHandle': 'Kéo để sắp xếp',
        'fitness.scheduleEditor.reassignDay': 'Đổi ngày',
      };
      return map[key] ?? key;
    },
  }),
}));

afterEach(cleanup);

function sampleDay(overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay {
  return {
    id: 'day-1',
    planId: 'plan-1',
    dayOfWeek: 1,
    sessionOrder: 1,
    workoutType: 'Push',
    muscleGroups: 'chest,shoulders',
    isUserAssigned: false,
    originalDayOfWeek: 1,
    ...overrides,
  };
}

const defaultProps: WorkoutAssignmentListProps = {
  planDays: [
    sampleDay({ id: 'day-1', dayOfWeek: 1, workoutType: 'Push', muscleGroups: 'chest,shoulders' }),
    sampleDay({ id: 'day-2', dayOfWeek: 3, workoutType: 'Pull', muscleGroups: 'back,biceps', sessionOrder: 2 }),
    sampleDay({ id: 'day-3', dayOfWeek: 5, workoutType: 'Legs', muscleGroups: 'quads,hamstrings', sessionOrder: 3 }),
  ],
  trainingDays: [1, 3, 5],
};

describe('WorkoutAssignmentList', () => {
  it('renders all workout items', () => {
    render(<WorkoutAssignmentList {...defaultProps} />);
    expect(screen.getByTestId('workout-item-day-1')).toBeInTheDocument();
    expect(screen.getByTestId('workout-item-day-2')).toBeInTheDocument();
    expect(screen.getByTestId('workout-item-day-3')).toBeInTheDocument();
  });

  it('displays workout type and muscle groups', () => {
    render(<WorkoutAssignmentList {...defaultProps} />);
    expect(screen.getByText('Push')).toBeInTheDocument();
    expect(screen.getByText('chest,shoulders')).toBeInTheDocument();
    expect(screen.getByText('Pull')).toBeInTheDocument();
    expect(screen.getByText('back,biceps')).toBeInTheDocument();
  });

  it('displays day badges with correct labels', () => {
    render(<WorkoutAssignmentList {...defaultProps} />);
    expect(screen.getByTestId('reassign-btn-day-1')).toHaveTextContent('T2');
    expect(screen.getByTestId('reassign-btn-day-2')).toHaveTextContent('T4');
    expect(screen.getByTestId('reassign-btn-day-3')).toHaveTextContent('T6');
  });

  it('renders empty state when planDays is empty', () => {
    render(<WorkoutAssignmentList planDays={[]} trainingDays={[1, 3, 5]} />);
    expect(screen.getByTestId('workout-assignment-empty')).toBeInTheDocument();
    expect(screen.getByText('Không có bài tập nào')).toBeInTheDocument();
  });

  it('calls onReorder with correct indices when move up is clicked', () => {
    const onReorder = vi.fn();
    render(<WorkoutAssignmentList {...defaultProps} onReorder={onReorder} />);
    fireEvent.click(screen.getByTestId('move-up-day-2'));
    expect(onReorder).toHaveBeenCalledWith(1, 0);
  });

  it('calls onReorder with correct indices when move down is clicked', () => {
    const onReorder = vi.fn();
    render(<WorkoutAssignmentList {...defaultProps} onReorder={onReorder} />);
    fireEvent.click(screen.getByTestId('move-down-day-1'));
    expect(onReorder).toHaveBeenCalledWith(0, 1);
  });

  it('disables move up for first item', () => {
    render(<WorkoutAssignmentList {...defaultProps} onReorder={vi.fn()} />);
    const moveUpFirst = screen.getByTestId('move-up-day-1');
    expect(moveUpFirst).toBeDisabled();
  });

  it('disables move down for last item', () => {
    render(<WorkoutAssignmentList {...defaultProps} onReorder={vi.fn()} />);
    const moveDownLast = screen.getByTestId('move-down-day-3');
    expect(moveDownLast).toBeDisabled();
  });

  it('does not call onReorder when move up on first item (disabled)', () => {
    const onReorder = vi.fn();
    render(<WorkoutAssignmentList {...defaultProps} onReorder={onReorder} />);
    fireEvent.click(screen.getByTestId('move-up-day-1'));
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('does not call onReorder when move down on last item (disabled)', () => {
    const onReorder = vi.fn();
    render(<WorkoutAssignmentList {...defaultProps} onReorder={onReorder} />);
    fireEvent.click(screen.getByTestId('move-down-day-3'));
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('calls onReassign with day id when day badge is clicked', () => {
    const onReassign = vi.fn();
    render(<WorkoutAssignmentList {...defaultProps} onReassign={onReassign} />);
    fireEvent.click(screen.getByTestId('reassign-btn-day-2'));
    expect(onReassign).toHaveBeenCalledWith('day-2');
  });

  it('move up/down buttons have accessible labels', () => {
    render(<WorkoutAssignmentList {...defaultProps} />);
    expect(screen.getAllByLabelText('Di chuyển lên')).toHaveLength(3);
    expect(screen.getAllByLabelText('Di chuyển xuống')).toHaveLength(3);
  });

  it('reassign buttons have accessible labels', () => {
    render(<WorkoutAssignmentList {...defaultProps} />);
    expect(screen.getByLabelText('Đổi ngày: Push')).toBeInTheDocument();
    expect(screen.getByLabelText('Đổi ngày: Pull')).toBeInTheDocument();
    expect(screen.getByLabelText('Đổi ngày: Legs')).toBeInTheDocument();
  });

  it('renders as a list with role="list"', () => {
    render(<WorkoutAssignmentList {...defaultProps} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('handles missing muscle groups gracefully', () => {
    const days = [sampleDay({ id: 'day-no-mg', muscleGroups: undefined })];
    render(<WorkoutAssignmentList planDays={days} trainingDays={[1]} />);
    expect(screen.getByText('Push')).toBeInTheDocument();
  });

  it('handles no callbacks gracefully', () => {
    render(<WorkoutAssignmentList {...defaultProps} />);
    expect(() => {
      fireEvent.click(screen.getByTestId('reassign-btn-day-1'));
      fireEvent.click(screen.getByTestId('move-up-day-2'));
      fireEvent.click(screen.getByTestId('move-down-day-1'));
    }).not.toThrow();
  });

  it('applies touch-manipulation on interactive elements', () => {
    render(<WorkoutAssignmentList {...defaultProps} />);
    const reassignBtn = screen.getByTestId('reassign-btn-day-1');
    expect(reassignBtn.className).toContain('touch-manipulation');
    const moveUp = screen.getByTestId('move-up-day-1');
    expect(moveUp.className).toContain('touch-manipulation');
  });
});
