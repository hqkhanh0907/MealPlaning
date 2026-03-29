import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ExerciseSelector } from '../features/fitness/components/ExerciseSelector';
import type { Exercise, EquipmentType } from '../features/fitness/types';

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
    {
      id: 'plank-hold',
      nameVi: 'Plank giữ',
      nameEn: '',
      muscleGroup: 'core',
      secondaryMuscles: [],
      category: 'isolation',
      equipment: ['bodyweight'],
      contraindicated: [],
      exerciseType: 'strength',
      defaultRepsMin: 1,
      defaultRepsMax: 3,
      isCustom: false,
    },
  ],
}));

afterEach(cleanup);

describe('ExerciseSelector', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(
      <ExerciseSelector {...defaultProps} isOpen={false} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders bottom sheet when isOpen is true', () => {
    render(<ExerciseSelector {...defaultProps} />);
    expect(screen.getByTestId('exercise-selector-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('modal-backdrop')).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(<ExerciseSelector {...defaultProps} />);
    const input = screen.getByTestId('exercise-search-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute(
      'placeholder',
      'Tìm bài tập...',
    );
  });

  it('search filters exercises by Vietnamese name', async () => {
    const user = userEvent.setup();
    render(<ExerciseSelector {...defaultProps} />);

    const input = screen.getByTestId('exercise-search-input');
    await user.type(input, 'Đẩy tạ');

    expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();
    expect(screen.queryByText('Chèo tạ đòn')).not.toBeInTheDocument();
    expect(screen.queryByText('Kéo xô máy')).not.toBeInTheDocument();
  });

  it('search filters exercises by English name', async () => {
    const user = userEvent.setup();
    render(<ExerciseSelector {...defaultProps} />);

    const input = screen.getByTestId('exercise-search-input');
    await user.type(input, 'Pulldown');

    expect(screen.getByText('Kéo xô máy')).toBeInTheDocument();
    expect(screen.queryByText('Đẩy tạ đòn nằm ngang')).not.toBeInTheDocument();
  });

  it('handles search for exercise with no English name', async () => {
    const user = userEvent.setup();
    render(<ExerciseSelector {...defaultProps} />);

    const input = screen.getByTestId('exercise-search-input');
    await user.type(input, 'Plank giữ');

    expect(screen.getByText('Plank giữ')).toBeInTheDocument();
  });

  it('muscle group chips filter exercises', async () => {
    const user = userEvent.setup();
    render(<ExerciseSelector {...defaultProps} />);

    // All exercises visible initially
    expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();
    expect(screen.getByText('Chèo tạ đòn')).toBeInTheDocument();

    const chipRow = screen.getByTestId('muscle-group-chips');
    const findChip = (label: string) =>
      Array.from(chipRow.querySelectorAll('button')).find(
        (btn) => btn.textContent === label,
      ) as HTMLElement;

    // Click "Lưng" (back) chip
    await user.click(findChip('Lưng'));

    expect(screen.getByText('Chèo tạ đòn')).toBeInTheDocument();
    expect(screen.getByText('Kéo xô máy')).toBeInTheDocument();
    expect(
      screen.queryByText('Đẩy tạ đòn nằm ngang'),
    ).not.toBeInTheDocument();

    // Click "Tất cả" (all) chip to reset filter
    await user.click(
      findChip('Tất cả'),
    );

    expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();
    expect(screen.getByText('Chèo tạ đòn')).toBeInTheDocument();
    expect(screen.getByText('Squat tự trọng')).toBeInTheDocument();
  });

  it('pre-filters by equipment when equipmentFilter provided', () => {
    render(
      <ExerciseSelector
        {...defaultProps}
        equipmentFilter={['cable'] as EquipmentType[]}
      />,
    );

    // Only cable exercises should appear
    expect(screen.getByText('Kéo xô máy')).toBeInTheDocument();
    expect(
      screen.queryByText('Đẩy tạ đòn nằm ngang'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Chèo tạ đòn')).not.toBeInTheDocument();
  });

  it('tap on exercise calls onSelect with correct exercise', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ExerciseSelector
        {...defaultProps}
        onSelect={onSelect}
        onClose={onClose}
      />,
    );

    await user.click(
      screen.getByTestId('exercise-item-barbell-bench-press'),
    );

    expect(onSelect).toHaveBeenCalledTimes(1);
    const selectedExercise = onSelect.mock.calls[0][0] as Exercise;
    expect(selectedExercise.id).toBe('barbell-bench-press');
    expect(selectedExercise.nameVi).toBe('Đẩy tạ đòn nằm ngang');
    expect(selectedExercise.muscleGroup).toBe('chest');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop click calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ExerciseSelector {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByTestId('backdrop-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('empty state shown when no exercises match', async () => {
    const user = userEvent.setup();
    render(<ExerciseSelector {...defaultProps} />);

    const input = screen.getByTestId('exercise-search-input');
    await user.type(input, 'xyznonexistent');

    expect(screen.getByTestId('exercise-empty-state')).toBeInTheDocument();
    expect(
      screen.getByText('Không tìm thấy bài tập'),
    ).toBeInTheDocument();
  });

  it('shows exercise details (name, category, equipment)', () => {
    render(<ExerciseSelector {...defaultProps} />);

    // Check bench press details
    expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();

    // Category badge should show compound (translated)
    const compoundBadges = screen.getAllByText('Đa khớp');
    expect(compoundBadges.length).toBeGreaterThan(0);

    // Equipment text (translated)
    expect(screen.getAllByText('Tạ đòn').length).toBeGreaterThan(0);

    // Muscle group label
    expect(screen.getAllByText('Ngực').length).toBeGreaterThan(0);

    // Check secondary category (translated)
    expect(screen.getByText('Phụ trợ')).toBeInTheDocument();

    // Check isolation category (translated)
    const isolationBadges = screen.getAllByText('Cô lập');
    expect(isolationBadges.length).toBeGreaterThan(0);
  });

  it('shows add custom exercise button', () => {
    render(<ExerciseSelector {...defaultProps} />);
    expect(screen.getByTestId('add-custom-exercise')).toBeInTheDocument();
  });

  it('opens custom exercise modal on button click', async () => {
    const user = userEvent.setup();
    render(<ExerciseSelector {...defaultProps} />);

    await user.click(screen.getByTestId('add-custom-exercise'));
    expect(screen.getByTestId('custom-exercise-modal')).toBeInTheDocument();
  });

  it('saves custom exercise via form submission', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <ExerciseSelector
        isOpen
        onClose={onClose}
        onSelect={onSelect}
        equipmentFilter={[]}
      />,
    );

    await user.click(screen.getByTestId('add-custom-exercise'));
    expect(screen.getByTestId('custom-exercise-modal')).toBeInTheDocument();

    const nameInput = screen.getByTestId('custom-exercise-name');
    await user.type(nameInput, 'My Custom Exercise');

    const submitBtn = screen.getByTestId('save-custom-exercise');
    await user.click(submitBtn);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        nameVi: 'My Custom Exercise',
        nameEn: 'My Custom Exercise',
        isCustom: true,
        exerciseType: 'strength',
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('closes custom exercise modal via backdrop close', async () => {
    const user = userEvent.setup();
    render(<ExerciseSelector {...defaultProps} />);

    await user.click(screen.getByTestId('add-custom-exercise'));
    expect(screen.getByTestId('custom-exercise-modal')).toBeInTheDocument();

    const overlays = screen.getAllByTestId('backdrop-overlay');
    await user.click(overlays[overlays.length - 1]);

    expect(screen.queryByTestId('custom-exercise-modal')).not.toBeInTheDocument();
  });
});
