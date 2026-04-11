import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TodayRestCardProps } from '../features/fitness/components/TodayRestCard';
import { TodayRestCard } from '../features/fitness/components/TodayRestCard';
import type { TrainingPlanDay } from '../features/fitness/types';

const makeTomorrowPlanDay = (overrides: Partial<TrainingPlanDay> = {}): TrainingPlanDay => ({
  id: 'day-thu',
  planId: 'plan-1',
  dayOfWeek: 4,
  sessionOrder: 1,
  workoutType: 'Upper Body A',
  muscleGroups: 'chest, shoulders, triceps',
  exercises: JSON.stringify([
    {
      exercise: {
        id: 'bench',
        nameVi: 'Đẩy ngang',
        muscleGroup: 'chest',
        secondaryMuscles: ['shoulders'],
        category: 'compound',
        equipment: ['barbell'],
        contraindicated: [],
        exerciseType: 'strength',
        defaultRepsMin: 6,
        defaultRepsMax: 8,
        isCustom: false,
        updatedAt: '2025-01-01',
      },
      sets: 4,
      repsMin: 6,
      repsMax: 8,
      restSeconds: 180,
    },
    {
      exercise: {
        id: 'ohp',
        nameVi: 'Đẩy vai',
        muscleGroup: 'shoulders',
        secondaryMuscles: ['triceps'],
        category: 'compound',
        equipment: ['barbell'],
        contraindicated: [],
        exerciseType: 'strength',
        defaultRepsMin: 8,
        defaultRepsMax: 10,
        isCustom: false,
        updatedAt: '2025-01-01',
      },
      sets: 3,
      repsMin: 8,
      repsMax: 10,
      restSeconds: 120,
    },
  ]),
  isUserAssigned: false,
  originalDayOfWeek: 4,
  ...overrides,
});

function makeProps(overrides: Partial<TodayRestCardProps> = {}): TodayRestCardProps {
  return {
    tomorrowPlanDay: makeTomorrowPlanDay(),
    tomorrowExerciseCount: 2,
    onConvertToWorkout: vi.fn(),
    onLogWeight: vi.fn(),
    onLogCardio: vi.fn(),
    ...overrides,
  };
}

afterEach(cleanup);

describe('TodayRestCard', () => {
  describe('rendering — with tomorrow preview', () => {
    it('renders rest day heading with Moon icon', () => {
      render(<TodayRestCard {...makeProps()} />);

      expect(screen.getByText('Ngày nghỉ')).toBeInTheDocument();
      const moonIcon = screen.getByTestId('rest-day-card').querySelector('svg[aria-hidden="true"]');
      expect(moonIcon).toBeInTheDocument();
    });

    it('renders 3 rest day tips', () => {
      render(<TodayRestCard {...makeProps()} />);

      expect(screen.getByText('Ngủ đủ 7-9 giờ để phục hồi cơ bắp')).toBeInTheDocument();
      expect(screen.getByText('Uống đủ nước và ăn giàu protein')).toBeInTheDocument();
      expect(screen.getByText('Có thể đi bộ nhẹ hoặc kéo giãn')).toBeInTheDocument();

      const tips = screen.getByTestId('rest-day-card').querySelectorAll('li');
      expect(tips).toHaveLength(3);
    });

    it('renders tomorrow preview with workout type and count', () => {
      render(<TodayRestCard {...makeProps()} />);

      const preview = screen.getByTestId('tomorrow-preview');
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveTextContent('Ngày mai');
      expect(preview).toHaveTextContent('2');
      expect(preview).toHaveTextContent('bài tập');
    });

    it('renders convert-to-workout button', () => {
      render(<TodayRestCard {...makeProps()} />);

      const btn = screen.getByTestId('rest-add-workout-btn');
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent('Thêm buổi tập');
    });

    it('renders quick actions container with 2 quick buttons', () => {
      render(<TodayRestCard {...makeProps()} />);

      const container = screen.getByTestId('quick-actions');
      expect(container).toBeInTheDocument();

      const weightBtn = screen.getByTestId('quick-log-weight');
      const cardioBtn = screen.getByTestId('quick-log-cardio');
      expect(weightBtn).toBeInTheDocument();
      expect(cardioBtn).toBeInTheDocument();
    });
  });

  describe('rendering — without tomorrow preview', () => {
    const noTomorrowProps = makeProps({
      tomorrowPlanDay: undefined,
      tomorrowExerciseCount: 0,
    });

    it('does NOT render tomorrow-preview element', () => {
      render(<TodayRestCard {...noTomorrowProps} />);

      expect(screen.queryByTestId('tomorrow-preview')).not.toBeInTheDocument();
    });

    it('still renders heading and tips', () => {
      render(<TodayRestCard {...noTomorrowProps} />);

      expect(screen.getByText('Ngày nghỉ')).toBeInTheDocument();
      const tips = screen.getByTestId('rest-day-card').querySelectorAll('li');
      expect(tips).toHaveLength(3);
    });

    it('still renders quick action buttons', () => {
      render(<TodayRestCard {...noTomorrowProps} />);

      expect(screen.getByTestId('rest-add-workout-btn')).toBeInTheDocument();
      expect(screen.getByTestId('quick-log-weight')).toBeInTheDocument();
      expect(screen.getByTestId('quick-log-cardio')).toBeInTheDocument();
    });
  });

  describe('button callbacks', () => {
    it('onConvertToWorkout fires on convert button click', () => {
      const onConvertToWorkout = vi.fn();
      render(<TodayRestCard {...makeProps({ onConvertToWorkout })} />);

      fireEvent.click(screen.getByTestId('rest-add-workout-btn'));
      expect(onConvertToWorkout).toHaveBeenCalledTimes(1);
    });

    it('onLogWeight fires on weight button click', () => {
      const onLogWeight = vi.fn();
      render(<TodayRestCard {...makeProps({ onLogWeight })} />);

      fireEvent.click(screen.getByTestId('quick-log-weight'));
      expect(onLogWeight).toHaveBeenCalledTimes(1);
    });

    it('onLogCardio fires on cardio button click', () => {
      const onLogCardio = vi.fn();
      render(<TodayRestCard {...makeProps({ onLogCardio })} />);

      fireEvent.click(screen.getByTestId('quick-log-cardio'));
      expect(onLogCardio).toHaveBeenCalledTimes(1);
    });

    it('repeated clicks increment call count correctly', () => {
      const onLogWeight = vi.fn();
      const onConvertToWorkout = vi.fn();
      const onLogCardio = vi.fn();
      render(<TodayRestCard {...makeProps({ onLogWeight, onConvertToWorkout, onLogCardio })} />);

      fireEvent.click(screen.getByTestId('quick-log-weight'));
      fireEvent.click(screen.getByTestId('quick-log-weight'));
      fireEvent.click(screen.getByTestId('quick-log-weight'));

      expect(onLogWeight).toHaveBeenCalledTimes(3);
      expect(onConvertToWorkout).toHaveBeenCalledTimes(0);
      expect(onLogCardio).toHaveBeenCalledTimes(0);
    });
  });

  describe('touch targets (BR-37)', () => {
    it('convert button has min-h-12 class', () => {
      render(<TodayRestCard {...makeProps()} />);

      expect(screen.getByTestId('rest-add-workout-btn').className).toContain('min-h-12');
    });

    it('weight button has min-h-12 class', () => {
      render(<TodayRestCard {...makeProps()} />);

      expect(screen.getByTestId('quick-log-weight').className).toContain('min-h-12');
    });

    it('cardio button has min-h-12 class', () => {
      render(<TodayRestCard {...makeProps()} />);

      expect(screen.getByTestId('quick-log-cardio').className).toContain('min-h-12');
    });
  });

  describe('accessibility', () => {
    it('all buttons have type="button"', () => {
      render(<TodayRestCard {...makeProps()} />);

      const buttons = screen.getByTestId('rest-day-card').querySelectorAll('button');
      buttons.forEach(btn => {
        expect(btn).toHaveAttribute('type', 'button');
      });
    });

    it('decorative icons have aria-hidden', () => {
      render(<TodayRestCard {...makeProps()} />);

      const svgs = screen.getByTestId('rest-day-card').querySelectorAll('svg');
      svgs.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('card has data-testid="rest-day-card"', () => {
      render(<TodayRestCard {...makeProps()} />);

      expect(screen.getByTestId('rest-day-card')).toBeInTheDocument();
    });
  });
});
