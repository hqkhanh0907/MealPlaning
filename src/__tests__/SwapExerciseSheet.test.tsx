import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SwapExerciseSheet } from '../features/fitness/components/SwapExerciseSheet';
import type { Exercise } from '../features/fitness/types';

// Mock ModalBackdrop — render children directly with a backdrop button
vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({
    children,
    onClose,
  }: {
    children: React.ReactNode;
    onClose: () => void;
  }) => (
    <div data-testid="modal-backdrop">
      <button data-testid="backdrop-overlay" onClick={onClose} type="button" />
      {children}
    </div>
  ),
}));

// Mock useModalBackHandler
vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

// Mock exercise database with a small controlled set
vi.mock('../features/fitness/data/exerciseDatabase', () => ({
  EXERCISES: [
    {
      id: 'barbell-bench-press',
      nameVi: 'Đẩy tạ đòn nằm ngang',
      nameEn: 'Barbell Bench Press',
      muscleGroup: 'chest',
      secondaryMuscles: ['shoulders', 'arms'],
      category: 'compound',
      equipment: ['barbell'],
      contraindicated: ['shoulders'],
      exerciseType: 'strength',
      defaultRepsMin: 6,
      defaultRepsMax: 12,
      isCustom: false,
    },
    {
      id: 'dumbbell-fly',
      nameVi: 'Bay tạ tay',
      nameEn: 'Dumbbell Fly',
      muscleGroup: 'chest',
      secondaryMuscles: [],
      category: 'isolation',
      equipment: ['dumbbell'],
      contraindicated: [],
      exerciseType: 'strength',
      defaultRepsMin: 10,
      defaultRepsMax: 15,
      isCustom: false,
    },
    {
      id: 'incline-dumbbell-press',
      nameVi: 'Đẩy tạ tay ghế nghiêng',
      nameEn: 'Incline Dumbbell Press',
      muscleGroup: 'chest',
      secondaryMuscles: ['shoulders'],
      category: 'compound',
      equipment: ['dumbbell'],
      contraindicated: [],
      exerciseType: 'strength',
      defaultRepsMin: 8,
      defaultRepsMax: 12,
      isCustom: false,
    },
    {
      id: 'barbell-row',
      nameVi: 'Chèo tạ đòn',
      nameEn: 'Barbell Row',
      muscleGroup: 'back',
      secondaryMuscles: ['arms'],
      category: 'compound',
      equipment: ['barbell'],
      contraindicated: ['lower_back'],
      exerciseType: 'strength',
      defaultRepsMin: 6,
      defaultRepsMax: 12,
      isCustom: false,
    },
    {
      id: 'lat-pulldown',
      nameVi: 'Kéo xô máy',
      nameEn: 'Lat Pulldown',
      muscleGroup: 'back',
      secondaryMuscles: ['arms'],
      category: 'secondary',
      equipment: ['cable'],
      contraindicated: [],
      exerciseType: 'strength',
      defaultRepsMin: 8,
      defaultRepsMax: 12,
      isCustom: false,
    },
    {
      id: 'bodyweight-squat',
      nameVi: 'Squat tự trọng',
      nameEn: 'Bodyweight Squat',
      muscleGroup: 'legs',
      secondaryMuscles: ['glutes', 'core'],
      category: 'compound',
      equipment: ['bodyweight'],
      contraindicated: ['knees'],
      exerciseType: 'strength',
      defaultRepsMin: 12,
      defaultRepsMax: 20,
      isCustom: false,
    },
  ],
}));

afterEach(cleanup);

const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: 'barbell-bench-press',
  nameVi: 'Đẩy tạ đòn nằm ngang',
  nameEn: 'Barbell Bench Press',
  muscleGroup: 'chest',
  secondaryMuscles: ['shoulders', 'arms'],
  category: 'compound',
  equipment: ['barbell'],
  contraindicated: ['shoulders'],
  exerciseType: 'strength',
  defaultRepsMin: 6,
  defaultRepsMax: 12,
  isCustom: false,
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('SwapExerciseSheet', () => {
  const defaultProps = {
    isOpen: true,
    currentExercise: makeExercise(),
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(
      <SwapExerciseSheet {...defaultProps} isOpen={false} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders bottom sheet when isOpen is true', () => {
    render(<SwapExerciseSheet {...defaultProps} />);
    expect(screen.getByTestId('swap-exercise-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('modal-backdrop')).toBeInTheDocument();
  });

  it('shows header with title and current exercise name', () => {
    render(<SwapExerciseSheet {...defaultProps} />);
    expect(screen.getByText('Đổi bài tập')).toBeInTheDocument();
    expect(screen.getByTestId('swap-current-name')).toHaveTextContent(
      'Đẩy tạ đòn nằm ngang',
    );
  });

  it('shows muscle group label in header', () => {
    render(<SwapExerciseSheet {...defaultProps} />);
    expect(screen.getByText(/Cùng nhóm cơ/)).toBeInTheDocument();
    expect(screen.getByText(/Ngực/)).toBeInTheDocument();
  });

  it('renders only exercises from the same muscle group', () => {
    render(<SwapExerciseSheet {...defaultProps} />);

    // Same muscle group (chest): dumbbell-fly, incline-dumbbell-press
    expect(screen.getByText('Bay tạ tay')).toBeInTheDocument();
    expect(screen.getByText('Đẩy tạ tay ghế nghiêng')).toBeInTheDocument();

    // Different muscle groups should not appear
    expect(screen.queryByText('Chèo tạ đòn')).not.toBeInTheDocument();
    expect(screen.queryByText('Kéo xô máy')).not.toBeInTheDocument();
    expect(screen.queryByText('Squat tự trọng')).not.toBeInTheDocument();
  });

  it('excludes the current exercise from the list', () => {
    render(<SwapExerciseSheet {...defaultProps} />);

    // currentExercise is barbell-bench-press — should NOT appear in list
    expect(
      screen.queryByTestId('swap-item-barbell-bench-press'),
    ).not.toBeInTheDocument();

    // Other chest exercises should appear
    expect(screen.getByTestId('swap-item-dumbbell-fly')).toBeInTheDocument();
    expect(
      screen.getByTestId('swap-item-incline-dumbbell-press'),
    ).toBeInTheDocument();
  });

  it('shows exercise details (category badge and equipment)', () => {
    render(<SwapExerciseSheet {...defaultProps} />);

    // dumbbell-fly is isolation category
    const isolationBadges = screen.getAllByText('Cô lập');
    expect(isolationBadges.length).toBeGreaterThan(0);

    // incline-dumbbell-press is compound
    const compoundBadges = screen.getAllByText('Đa khớp');
    expect(compoundBadges.length).toBeGreaterThan(0);

    // Equipment shown
    expect(screen.getAllByText('dumbbell').length).toBeGreaterThan(0);
  });

  it('search filters exercises by Vietnamese name', async () => {
    const user = userEvent.setup();
    render(<SwapExerciseSheet {...defaultProps} />);

    const input = screen.getByTestId('swap-search-input');
    await user.type(input, 'Bay tạ');

    expect(screen.getByText('Bay tạ tay')).toBeInTheDocument();
    expect(
      screen.queryByText('Đẩy tạ tay ghế nghiêng'),
    ).not.toBeInTheDocument();
  });

  it('search filters exercises by English name', async () => {
    const user = userEvent.setup();
    render(<SwapExerciseSheet {...defaultProps} />);

    const input = screen.getByTestId('swap-search-input');
    await user.type(input, 'Incline');

    expect(screen.getByText('Đẩy tạ tay ghế nghiêng')).toBeInTheDocument();
    expect(screen.queryByText('Bay tạ tay')).not.toBeInTheDocument();
  });

  it('shows empty state when search has no matches', async () => {
    const user = userEvent.setup();
    render(<SwapExerciseSheet {...defaultProps} />);

    const input = screen.getByTestId('swap-search-input');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByTestId('swap-empty-state')).toBeInTheDocument();
    expect(
      screen.getByText('Không có bài tập thay thế'),
    ).toBeInTheDocument();
  });

  it('calls onSelect and onClose when an exercise is tapped', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <SwapExerciseSheet
        {...defaultProps}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByTestId('swap-item-dumbbell-fly'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    const selectedExercise = onSelect.mock.calls[0][0] as Exercise;
    expect(selectedExercise.id).toBe('dumbbell-fly');
    expect(selectedExercise.nameVi).toBe('Bay tạ tay');
    expect(selectedExercise.muscleGroup).toBe('chest');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SwapExerciseSheet {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByTestId('backdrop-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no alternatives exist for the muscle group', () => {
    const squatExercise = makeExercise({
      id: 'bodyweight-squat',
      nameVi: 'Squat tự trọng',
      muscleGroup: 'legs',
    });

    render(
      <SwapExerciseSheet
        {...defaultProps}
        currentExercise={squatExercise}
      />,
    );

    expect(screen.getByTestId('swap-empty-state')).toBeInTheDocument();
    expect(
      screen.getByText('Không có bài tập thay thế'),
    ).toBeInTheDocument();
  });

  it('displays alternatives count in the section label', () => {
    render(<SwapExerciseSheet {...defaultProps} />);

    // 2 alternatives for chest (dumbbell-fly + incline-dumbbell-press)
    expect(screen.getByText(/Bài tập thay thế \(2\)/)).toBeInTheDocument();
  });

  it('shows search input with correct placeholder', () => {
    render(<SwapExerciseSheet {...defaultProps} />);
    const input = screen.getByTestId('swap-search-input');
    expect(input).toHaveAttribute('placeholder', 'Tìm bài tập...');
  });

  it('renders with correct aria-labels on exercise buttons', () => {
    render(<SwapExerciseSheet {...defaultProps} />);

    const flyButton = screen.getByTestId('swap-item-dumbbell-fly');
    expect(flyButton).toHaveAttribute(
      'aria-label',
      'Đổi bài tập: Bay tạ tay',
    );
  });
});
