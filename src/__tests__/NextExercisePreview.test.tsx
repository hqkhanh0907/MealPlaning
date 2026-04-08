import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NextExercisePreview } from '../features/fitness/components/NextExercisePreview';
import type { ExerciseSessionMeta } from '../features/fitness/types';

const mockMeta: ExerciseSessionMeta = {
  exercise: {
    id: 'incline-db-press',
    nameVi: 'Đẩy tạ tay nghiêng',
    nameEn: 'Incline DB Press',
    muscleGroup: 'chest',
    secondaryMuscles: ['shoulders', 'arms'],
    category: 'compound',
    equipment: ['dumbbell'],
    contraindicated: [],
    exerciseType: 'strength',
    defaultRepsMin: 10,
    defaultRepsMax: 12,
    isCustom: false,
    updatedAt: '2026-01-01',
  },
  plannedSets: 4,
  repsMin: 10,
  repsMax: 12,
  restSeconds: 90,
};

describe('NextExercisePreview', () => {
  it('renders null when meta is null', () => {
    const { container } = render(<NextExercisePreview meta={null} onNavigate={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders exercise name', () => {
    render(<NextExercisePreview meta={mockMeta} onNavigate={vi.fn()} />);
    expect(screen.getByText('Đẩy tạ tay nghiêng')).toBeInTheDocument();
  });

  it('renders planned sets and rep range from meta', () => {
    render(<NextExercisePreview meta={mockMeta} onNavigate={vi.fn()} />);
    expect(screen.getByText(/4 hiệp/)).toBeInTheDocument();
    expect(screen.getByText(/10-12 lần/)).toBeInTheDocument();
  });

  it('renders section heading', () => {
    render(<NextExercisePreview meta={mockMeta} onNavigate={vi.fn()} />);
    expect(screen.getByText(/tiếp theo/i)).toBeInTheDocument();
  });

  it('calls onNavigate when card clicked', () => {
    const onNavigate = vi.fn();
    render(<NextExercisePreview meta={mockMeta} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByTestId('next-exercise-card'));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('has Dumbbell icon hidden from screen reader', () => {
    render(<NextExercisePreview meta={mockMeta} onNavigate={vi.fn()} />);
    const card = screen.getByTestId('next-exercise-card');
    expect(card.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
