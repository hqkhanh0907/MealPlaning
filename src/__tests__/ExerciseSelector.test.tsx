import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ExerciseSelector } from '../features/fitness/components/ExerciseSelector';
import type { EquipmentType, Exercise } from '../features/fitness/types';

// -------------------------------------------------------------------
// Mocks
// -------------------------------------------------------------------

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({
    children,
    onClose,
    mobileLayout,
    allowSwipeToDismiss,
    ariaLabelledBy,
  }: {
    children: React.ReactNode;
    onClose: () => void;
    mobileLayout?: string;
    allowSwipeToDismiss?: boolean;
    ariaLabelledBy?: string;
  }) => (
    <div
      data-testid="modal-backdrop"
      data-mobile-layout={mobileLayout}
      data-allow-swipe={String(allowSwipeToDismiss)}
      data-aria-labelledby={ariaLabelledBy}
    >
      <button data-testid="backdrop-overlay" onClick={onClose} type="button" />
      {children}
    </div>
  ),
}));

vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

// vi.hoisted ensures these are available inside vi.mock factories
const { MOCK_EXERCISES, mockWorkoutSets } = vi.hoisted(() => {
  const exercises = [
    {
      id: 'barbell-bench-press',
      nameVi: 'Đẩy tạ đòn nằm ngang',
      nameEn: 'Barbell Bench Press',
      muscleGroup: 'chest',
      secondaryMuscles: ['shoulders', 'arms'],
      category: 'compound' as const,
      equipment: ['barbell'],
      contraindicated: ['shoulders'],
      exerciseType: 'strength' as const,
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
      category: 'isolation' as const,
      equipment: ['dumbbell'],
      contraindicated: [],
      exerciseType: 'strength' as const,
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
      category: 'compound' as const,
      equipment: ['barbell'],
      contraindicated: ['lower_back'],
      exerciseType: 'strength' as const,
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
      category: 'secondary' as const,
      equipment: ['cable'],
      contraindicated: [],
      exerciseType: 'strength' as const,
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
      category: 'compound' as const,
      equipment: ['bodyweight'],
      contraindicated: ['knees'],
      exerciseType: 'strength' as const,
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
      category: 'isolation' as const,
      equipment: ['bodyweight'],
      contraindicated: [],
      exerciseType: 'strength' as const,
      defaultRepsMin: 1,
      defaultRepsMax: 3,
      isCustom: false,
    },
    {
      id: 'running',
      nameVi: 'Chạy bộ',
      nameEn: 'Running',
      muscleGroup: 'cardio',
      secondaryMuscles: [],
      category: 'compound' as const,
      equipment: ['bodyweight'],
      contraindicated: [],
      exerciseType: 'cardio' as const,
      defaultRepsMin: 1,
      defaultRepsMax: 1,
      isCustom: false,
    },
    {
      id: 'overhead-press',
      nameVi: 'Đẩy vai',
      nameEn: 'Overhead Press',
      muscleGroup: 'shoulders',
      secondaryMuscles: ['arms'],
      category: 'compound' as const,
      equipment: ['barbell'],
      contraindicated: [],
      exerciseType: 'strength' as const,
      defaultRepsMin: 6,
      defaultRepsMax: 10,
      isCustom: false,
    },
  ];
  const sets: Array<{
    id: string;
    workoutId: string;
    exerciseId: string | null;
    setNumber: number;
    weightKg: number;
    updatedAt: string;
  }> = [];
  return { MOCK_EXERCISES: exercises, mockWorkoutSets: sets };
});

vi.mock('../features/fitness/data/exerciseDatabase', () => ({
  EXERCISES: MOCK_EXERCISES,
}));

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: (selector: (state: { workoutSets: typeof mockWorkoutSets }) => unknown) =>
    selector({ workoutSets: mockWorkoutSets }),
}));

// -------------------------------------------------------------------
// i18n overrides (vi.json keys used by the component)
// -------------------------------------------------------------------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      const map: Record<string, string> = {
        'fitness.exerciseSelector.title': 'Chọn bài tập',
        'fitness.exerciseSelector.search': 'Tìm bài tập...',
        'fitness.exerciseSelector.all': 'Tất cả',
        'fitness.exerciseSelector.compound': 'Đa khớp',
        'fitness.exerciseSelector.secondary': 'Phụ trợ',
        'fitness.exerciseSelector.isolation': 'Cô lập',
        'fitness.exerciseSelector.compoundCategory': 'Đa khớp',
        'fitness.exerciseSelector.isolationCategory': 'Cô lập',
        'fitness.exerciseSelector.cardioCategory': 'Cardio',
        'fitness.exerciseSelector.addCustom': 'Bài tập tùy chỉnh',
        'fitness.exerciseSelector.recentlyUsed': 'Gần đây',
        'fitness.exerciseSelector.createNewExercise': 'Tạo bài tập mới',
        'fitness.exerciseSelector.muscleChest': 'Ngực',
        'fitness.exerciseSelector.muscleBack': 'Lưng',
        'fitness.exerciseSelector.muscleShoulders': 'Vai',
        'fitness.exerciseSelector.muscleLegs': 'Chân',
        'fitness.exerciseSelector.muscleArms': 'Tay',
        'fitness.exerciseSelector.muscleCore': 'Bụng',
        'fitness.exerciseSelector.muscleGlutes': 'Mông',
        'emptyState.exerciseSearchNoResults': `Không tìm thấy "${opts?.query ?? ''}"`,
        'emptyState.exerciseFilterNoResults': 'Không tìm thấy bài tập phù hợp',
        'emptyState.exerciseNoResultsHint': 'Thử tìm với từ khóa khác hoặc thay đổi bộ lọc.',
        'common.cancel': 'Hủy',
        'common.save': 'Lưu',
        'fitness.customExercise.title': 'Tạo bài tập tùy chỉnh',
        'fitness.customExercise.name': 'Tên bài tập',
        'fitness.customExercise.muscleGroup': 'Nhóm cơ chính',
        'fitness.customExercise.category': 'Phân loại',
        'fitness.customExercise.equipment': 'Thiết bị',
        'fitness.customExercise.exerciseType': 'Loại bài tập',
      };
      return map[key] ?? key;
    },
    i18n: { language: 'vi' },
  }),
}));

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function setMockWorkoutSets(
  sets: Array<{
    id: string;
    workoutId: string;
    exerciseId: string | null;
    setNumber: number;
    weightKg: number;
    updatedAt: string;
  }>,
) {
  mockWorkoutSets.length = 0;
  mockWorkoutSets.push(...sets);
}

function makeSet(
  exerciseId: string | null,
  updatedAt: string,
  id?: string,
): {
  id: string;
  workoutId: string;
  exerciseId: string | null;
  setNumber: number;
  weightKg: number;
  updatedAt: string;
} {
  return {
    id: id ?? `s-${exerciseId ?? 'null'}-${updatedAt}`,
    workoutId: 'w1',
    exerciseId,
    setNumber: 1,
    weightKg: 60,
    updatedAt,
  };
}

function findChipInRegion(testId: string, label: string): HTMLElement {
  const region = screen.getByTestId(testId);
  const btn = Array.from(region.querySelectorAll('button')).find(b => b.textContent === label);
  if (!btn) throw new Error(`Chip "${label}" not found in ${testId}`);
  return btn as HTMLElement;
}

// -------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------

afterEach(() => {
  cleanup();
  setMockWorkoutSets([]);
});

describe('ExerciseSelector', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setMockWorkoutSets([]);
  });

  // ================================================================
  // SC_W502_01 — Base Rendering
  // ================================================================

  describe('SC_W502_01 — Base rendering', () => {
    it('TC_W502_01: returns null when isOpen is false', () => {
      const { container } = render(<ExerciseSelector {...defaultProps} isOpen={false} />);
      expect(container.innerHTML).toBe('');
    });

    it('TC_W502_02: renders all structural regions when open', () => {
      render(<ExerciseSelector {...defaultProps} />);
      expect(screen.getByTestId('exercise-selector-sheet')).toBeInTheDocument();
      expect(screen.getByTestId('modal-backdrop')).toHaveAttribute('data-mobile-layout', 'sheet');
      expect(screen.getByTestId('exercise-selector-title')).toHaveTextContent('Chọn bài tập');
      expect(screen.getByTestId('exercise-selector-search-region')).toBeInTheDocument();
      expect(screen.getByTestId('exercise-selector-chip-region')).toBeInTheDocument();
      expect(screen.getByTestId('exercise-selector-list-region')).toBeInTheDocument();
      expect(screen.getByTestId('exercise-category-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('equipment-chips')).toBeInTheDocument();
    });
  });

  // ================================================================
  // SC_W502_02 — "Gần đây" Section With History
  // ================================================================

  describe('SC_W502_02 — Recently used with history', () => {
    it('TC_W502_03: displays "Gần đây" section when workout history exists', () => {
      setMockWorkoutSets([makeSet('barbell-bench-press', '2025-07-18T10:00:00Z')]);
      render(<ExerciseSelector {...defaultProps} />);

      expect(screen.getByText('Gần đây')).toBeInTheDocument();
      expect(screen.getByTestId('recently-used-section')).toBeInTheDocument();
      expect(screen.getByTestId('recent-exercise-barbell-bench-press')).toBeInTheDocument();
    });

    it('TC_W502_04: recently used shows exercises in reverse-chronological order', () => {
      setMockWorkoutSets([
        makeSet('barbell-bench-press', '2025-07-16T10:00:00Z'),
        makeSet('barbell-row', '2025-07-17T10:00:00Z'),
        makeSet('lat-pulldown', '2025-07-18T10:00:00Z'),
      ]);
      render(<ExerciseSelector {...defaultProps} />);

      const section = screen.getByTestId('recently-used-section');
      const items = within(section).getAllByRole('button');
      expect(items[0]).toHaveTextContent('Kéo xô máy');
      expect(items[1]).toHaveTextContent('Chèo tạ đòn');
      expect(items[2]).toHaveTextContent('Đẩy tạ đòn nằm ngang');
    });
  });

  // ================================================================
  // SC_W502_03 — "Gần đây" Section With 0 History
  // ================================================================

  describe('SC_W502_03 — Recently used with 0 history', () => {
    it('TC_W502_05: hides "Gần đây" section when workoutSets is empty', () => {
      setMockWorkoutSets([]);
      render(<ExerciseSelector {...defaultProps} />);

      expect(screen.queryByText('Gần đây')).not.toBeInTheDocument();
      // Main exercise list still renders
      expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();
    });

    it('TC_W502_06: hides "Gần đây" section when all exerciseIds are null', () => {
      setMockWorkoutSets([makeSet(null, '2025-07-18T10:00:00Z', 's-null-1')]);
      render(<ExerciseSelector {...defaultProps} />);

      expect(screen.queryByText('Gần đây')).not.toBeInTheDocument();
    });
  });

  // ================================================================
  // SC_W502_04 — "Gần đây" Deduplication & Limit 5
  // ================================================================

  describe('SC_W502_04 — Recently used dedup & limit', () => {
    it('TC_W502_07: deduplicates exercises — shows each exercise only once', () => {
      setMockWorkoutSets([
        makeSet('barbell-bench-press', '2025-07-18T08:00:00Z', 's1'),
        makeSet('barbell-bench-press', '2025-07-18T08:01:00Z', 's2'),
        makeSet('barbell-bench-press', '2025-07-18T08:02:00Z', 's3'),
      ]);
      render(<ExerciseSelector {...defaultProps} />);

      const section = screen.getByTestId('recently-used-section');
      const items = within(section).getAllByRole('button');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Đẩy tạ đòn nằm ngang');
    });

    it('TC_W502_08: caps recently used at 5 unique exercises', () => {
      setMockWorkoutSets([
        makeSet('barbell-bench-press', '2025-07-11T10:00:00Z'),
        makeSet('dumbbell-fly', '2025-07-12T10:00:00Z'),
        makeSet('barbell-row', '2025-07-13T10:00:00Z'),
        makeSet('lat-pulldown', '2025-07-14T10:00:00Z'),
        makeSet('bodyweight-squat', '2025-07-15T10:00:00Z'),
        makeSet('plank-hold', '2025-07-16T10:00:00Z'),
        makeSet('overhead-press', '2025-07-17T10:00:00Z'),
      ]);
      render(<ExerciseSelector {...defaultProps} />);

      const section = screen.getByTestId('recently-used-section');
      const items = within(section).getAllByRole('button');
      expect(items).toHaveLength(5);
      // 5 most recent
      expect(items[0]).toHaveTextContent('Đẩy vai');
      expect(items[1]).toHaveTextContent('Plank giữ');
      expect(items[2]).toHaveTextContent('Squat tự trọng');
      expect(items[3]).toHaveTextContent('Kéo xô máy');
      expect(items[4]).toHaveTextContent('Chèo tạ đòn');
    });

    it('TC_W502_09: ignores workoutSets with exerciseId not in exercise database', () => {
      setMockWorkoutSets([
        makeSet('non-existent-exercise', '2025-07-18T10:00:00Z'),
        makeSet('barbell-bench-press', '2025-07-17T10:00:00Z'),
      ]);
      render(<ExerciseSelector {...defaultProps} />);

      const section = screen.getByTestId('recently-used-section');
      const items = within(section).getAllByRole('button');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Đẩy tạ đòn nằm ngang');
    });
  });

  // ================================================================
  // SC_W502_05/06/07 — Category Filter Tabs
  // ================================================================

  describe('SC_W502_05-07 — Category filter tabs', () => {
    it('TC_W502_10: category tabs render with 4 options', () => {
      render(<ExerciseSelector {...defaultProps} />);
      const tabRegion = screen.getByTestId('exercise-category-tabs');
      const tabs = within(tabRegion).getAllByRole('button');
      expect(tabs).toHaveLength(4);
      expect(tabs[0]).toHaveTextContent('Tất cả');
      expect(tabs[1]).toHaveTextContent('Đa khớp');
      expect(tabs[2]).toHaveTextContent('Cô lập');
      expect(tabs[3]).toHaveTextContent('Cardio');
    });

    it('TC_W502_11: compound tab filters to compound + secondary exercises (strength only)', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.click(screen.getByTestId('category-tab-compound'));

      // Visible: compound+strength and secondary+strength
      expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument(); // compound
      expect(screen.getByText('Chèo tạ đòn')).toBeInTheDocument(); // compound
      expect(screen.getByText('Squat tự trọng')).toBeInTheDocument(); // compound
      expect(screen.getByText('Kéo xô máy')).toBeInTheDocument(); // secondary
      expect(screen.getByText('Đẩy vai')).toBeInTheDocument(); // compound

      // Hidden: isolation + cardio
      expect(screen.queryByText('Bay tạ tay')).not.toBeInTheDocument();
      expect(screen.queryByText('Plank giữ')).not.toBeInTheDocument();
      // Cardio "Chạy bộ" hidden even though its category is compound
      expect(screen.queryByText('Chạy bộ')).not.toBeInTheDocument();
    });

    it('TC_W502_12: isolation tab filters to isolation exercises only', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.click(screen.getByTestId('category-tab-isolation'));

      expect(screen.getByText('Bay tạ tay')).toBeInTheDocument();
      expect(screen.getByText('Plank giữ')).toBeInTheDocument();
      expect(screen.queryByText('Đẩy tạ đòn nằm ngang')).not.toBeInTheDocument();
      expect(screen.queryByText('Chạy bộ')).not.toBeInTheDocument();
    });

    it('TC_W502_13: cardio tab filters to cardio exercises only', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.click(screen.getByTestId('category-tab-cardio'));

      expect(screen.getByText('Chạy bộ')).toBeInTheDocument();
      expect(screen.queryByText('Đẩy tạ đòn nằm ngang')).not.toBeInTheDocument();
      expect(screen.queryByText('Bay tạ tay')).not.toBeInTheDocument();
    });
  });

  // ================================================================
  // SC_W502_08 — Muscle Group Filter Chips (Preserved)
  // ================================================================

  describe('SC_W502_08 — Muscle group filter chips', () => {
    it('TC_W502_14: muscle group chips show all 7 groups + "Tất cả"', () => {
      render(<ExerciseSelector {...defaultProps} />);
      const chipRow = screen.getByTestId('muscle-group-chips');
      const buttons = within(chipRow).getAllByRole('button');
      expect(buttons).toHaveLength(8); // "Tất cả" + 7 groups
      expect(buttons[0]).toHaveTextContent('Tất cả');
      expect(buttons[1]).toHaveTextContent('Ngực');
      expect(buttons[2]).toHaveTextContent('Lưng');
      expect(buttons[3]).toHaveTextContent('Vai');
      expect(buttons[4]).toHaveTextContent('Chân');
      expect(buttons[5]).toHaveTextContent('Tay');
      expect(buttons[6]).toHaveTextContent('Bụng');
      expect(buttons[7]).toHaveTextContent('Mông');
    });

    it('TC_W502_15: clicking muscle group chip filters exercise list', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.click(findChipInRegion('muscle-group-chips', 'Lưng'));

      expect(screen.getByText('Chèo tạ đòn')).toBeInTheDocument();
      expect(screen.getByText('Kéo xô máy')).toBeInTheDocument();
      expect(screen.queryByText('Đẩy tạ đòn nằm ngang')).not.toBeInTheDocument();
      expect(screen.queryByText('Squat tự trọng')).not.toBeInTheDocument();
    });

    it('TC_W502_16: clicking "Tất cả" resets muscle group filter', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.click(findChipInRegion('muscle-group-chips', 'Lưng'));
      expect(screen.queryByText('Đẩy tạ đòn nằm ngang')).not.toBeInTheDocument();

      await user.click(findChipInRegion('muscle-group-chips', 'Tất cả'));
      expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();
      expect(screen.getByText('Chèo tạ đòn')).toBeInTheDocument();
    });
  });

  // ================================================================
  // SC_W502_09 — Equipment Filter Chips
  // ================================================================

  describe('SC_W502_09 — Equipment filter chips', () => {
    it('TC_W502_17: equipment chips render all 7 types', () => {
      render(<ExerciseSelector {...defaultProps} />);
      const chipRow = screen.getByTestId('equipment-chips');
      const buttons = within(chipRow).getAllByRole('button');
      expect(buttons).toHaveLength(7);
      expect(buttons[0]).toHaveTextContent('Tạ đòn');
      expect(buttons[1]).toHaveTextContent('Tạ tay');
      expect(buttons[2]).toHaveTextContent('Máy tập');
      expect(buttons[3]).toHaveTextContent('Dây cáp');
      expect(buttons[4]).toHaveTextContent('Tự trọng');
      expect(buttons[5]).toHaveTextContent('Dây kháng lực');
      expect(buttons[6]).toHaveTextContent('Tạ ấm');
    });

    it('TC_W502_18: clicking equipment chip filters exercises', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.click(screen.getByTestId('equipment-chip-cable'));

      expect(screen.getByText('Kéo xô máy')).toBeInTheDocument();
      expect(screen.queryByText('Đẩy tạ đòn nằm ngang')).not.toBeInTheDocument();
      expect(screen.queryByText('Bay tạ tay')).not.toBeInTheDocument();
    });

    it('TC_W502_19: equipment chips support multi-select', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.click(screen.getByTestId('equipment-chip-barbell'));
      await user.click(screen.getByTestId('equipment-chip-cable'));

      // barbell OR cable exercises visible
      expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument(); // barbell
      expect(screen.getByText('Chèo tạ đòn')).toBeInTheDocument(); // barbell
      expect(screen.getByText('Kéo xô máy')).toBeInTheDocument(); // cable
      expect(screen.queryByText('Bay tạ tay')).not.toBeInTheDocument(); // dumbbell
      expect(screen.queryByText('Squat tự trọng')).not.toBeInTheDocument(); // bodyweight
    });

    it('TC_W502_20: clicking active equipment chip deselects it', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.click(screen.getByTestId('equipment-chip-barbell'));
      expect(screen.queryByText('Bay tạ tay')).not.toBeInTheDocument();

      await user.click(screen.getByTestId('equipment-chip-barbell'));
      // All exercises visible again
      expect(screen.getByText('Bay tạ tay')).toBeInTheDocument();
      expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();
    });
  });

  // ================================================================
  // SC_W502_10/11 — Search
  // ================================================================

  describe('SC_W502_10-11 — Search', () => {
    it('TC_W502_21: search matches Vietnamese text with diacritics', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.type(screen.getByTestId('exercise-search-input'), 'Đẩy tạ');

      expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();
      expect(screen.queryByText('Chèo tạ đòn')).not.toBeInTheDocument();
    });

    it('TC_W502_22: search is case-insensitive for Vietnamese', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.type(screen.getByTestId('exercise-search-input'), 'đẩy tạ');

      expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();
    });

    it('TC_W502_23: partial match works mid-word', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.type(screen.getByTestId('exercise-search-input'), 'tạ đòn');

      expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();
      expect(screen.getByText('Chèo tạ đòn')).toBeInTheDocument();
      expect(screen.queryByText('Bay tạ tay')).not.toBeInTheDocument();
      expect(screen.queryByText('Kéo xô máy')).not.toBeInTheDocument();
    });

    it('TC_W502_12_EN: search filters exercises by English name', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.type(screen.getByTestId('exercise-search-input'), 'Pulldown');

      expect(screen.getByText('Kéo xô máy')).toBeInTheDocument();
      expect(screen.queryByText('Đẩy tạ đòn nằm ngang')).not.toBeInTheDocument();
    });

    it('handles search for exercise with no English name', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.type(screen.getByTestId('exercise-search-input'), 'Plank giữ');
      expect(screen.getByText('Plank giữ')).toBeInTheDocument();
    });
  });

  // ================================================================
  // SC_W502_13/14/28 — Combined Filters
  // ================================================================

  describe('SC_W502_13-14 — Combined filters', () => {
    it('TC_combined_muscle_equipment_category: muscle + equipment + category', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      // Select compound tab
      await user.click(screen.getByTestId('category-tab-compound'));
      // Select back muscle
      await user.click(findChipInRegion('muscle-group-chips', 'Lưng'));
      // Select barbell equipment
      await user.click(screen.getByTestId('equipment-chip-barbell'));

      // Only barbell + back + compound = Chèo tạ đòn
      expect(screen.getByText('Chèo tạ đòn')).toBeInTheDocument();
      expect(screen.queryByText('Kéo xô máy')).not.toBeInTheDocument(); // cable, not barbell
      expect(screen.queryByText('Đẩy tạ đòn nằm ngang')).not.toBeInTheDocument(); // chest, not back
    });

    it('TC_combined_search_muscle: search + muscle group', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.click(findChipInRegion('muscle-group-chips', 'Ngực'));
      await user.type(screen.getByTestId('exercise-search-input'), 'Bay');

      expect(screen.getByText('Bay tạ tay')).toBeInTheDocument();
      expect(screen.queryByText('Đẩy tạ đòn nằm ngang')).not.toBeInTheDocument();
    });

    it('TC_combined_search_equipment: search + equipment', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.click(screen.getByTestId('equipment-chip-barbell'));
      await user.type(screen.getByTestId('exercise-search-input'), 'Chèo');

      expect(screen.getByText('Chèo tạ đòn')).toBeInTheDocument();
      expect(screen.queryByText('Đẩy tạ đòn nằm ngang')).not.toBeInTheDocument();
    });
  });

  // ================================================================
  // SC_W502_15/16/17 — Empty State
  // ================================================================

  describe('SC_W502_15-17 — Empty state', () => {
    it('TC_W502_15: empty state with CTA shown when search has no results', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.type(screen.getByTestId('exercise-search-input'), 'xyznonexistent');

      expect(screen.getByTestId('exercise-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/Không tìm thấy "xyznonexistent"/)).toBeInTheDocument();
      expect(screen.getByTestId('empty-state-create-exercise')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state-create-exercise')).toHaveTextContent('Tạo bài tập mới');
    });

    it('TC_W502_16: empty state with CTA shown for filter no results', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.click(findChipInRegion('muscle-group-chips', 'Mông'));

      expect(screen.getByTestId('exercise-empty-state')).toBeInTheDocument();
      expect(screen.getByText('Không tìm thấy bài tập phù hợp')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state-create-exercise')).toBeInTheDocument();
    });

    it('TC_W502_17: empty state CTA opens CustomExerciseModal', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.type(screen.getByTestId('exercise-search-input'), 'xyznonexistent');
      await user.click(screen.getByTestId('empty-state-create-exercise'));

      expect(screen.getByTestId('custom-exercise-modal')).toBeInTheDocument();
    });

    it('TC_W502_31: empty state CTA reuses same CustomExerciseModal', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.type(screen.getByTestId('exercise-search-input'), 'xyznonexistent');
      await user.click(screen.getByTestId('empty-state-create-exercise'));
      expect(screen.getByTestId('custom-exercise-modal')).toBeInTheDocument();

      // Cancel should close modal
      const cancelButtons = screen.getAllByText('Hủy');
      await user.click(cancelButtons[cancelButtons.length - 1]);
      expect(screen.queryByTestId('custom-exercise-modal')).not.toBeInTheDocument();
    });
  });

  // ================================================================
  // SC_W502_18/19 — Touch Targets & Active Press
  // ================================================================

  describe('SC_W502_18-19 — Touch targets & active press', () => {
    it('TC_W502_18: all chips have min-h-12 class', () => {
      render(<ExerciseSelector {...defaultProps} />);

      // Category tab chips
      const categoryTabs = screen.getByTestId('exercise-category-tabs');
      within(categoryTabs)
        .getAllByRole('button')
        .forEach(btn => {
          expect(btn.className).toContain('min-h-12');
        });

      // Muscle group chips
      const muscleChips = screen.getByTestId('muscle-group-chips');
      within(muscleChips)
        .getAllByRole('button')
        .forEach(btn => {
          expect(btn.className).toContain('min-h-12');
        });

      // Equipment chips
      const equipChips = screen.getByTestId('equipment-chips');
      within(equipChips)
        .getAllByRole('button')
        .forEach(btn => {
          expect(btn.className).toContain('min-h-12');
        });
    });

    it('TC_W502_18b: exercise items have min-h-12 class', () => {
      render(<ExerciseSelector {...defaultProps} />);
      const item = screen.getByTestId('exercise-item-barbell-bench-press');
      expect(item.className).toContain('min-h-12');
    });

    it('TC_W502_18c: search input has min-h-12', () => {
      render(<ExerciseSelector {...defaultProps} />);
      const input = screen.getByTestId('exercise-search-input');
      expect(input.className).toContain('min-h-12');
    });

    it('TC_W502_18d: add custom exercise button has min-h-12', () => {
      render(<ExerciseSelector {...defaultProps} />);
      const btn = screen.getByTestId('add-custom-exercise');
      expect(btn.className).toContain('min-h-12');
    });

    it('TC_W502_19: chips have active:scale-[0.98] class', () => {
      render(<ExerciseSelector {...defaultProps} />);
      const categoryTabs = screen.getByTestId('exercise-category-tabs');
      within(categoryTabs)
        .getAllByRole('button')
        .forEach(btn => {
          expect(btn.className).toContain('active:scale-[0.98]');
        });

      const muscleChips = screen.getByTestId('muscle-group-chips');
      within(muscleChips)
        .getAllByRole('button')
        .forEach(btn => {
          expect(btn.className).toContain('active:scale-[0.98]');
        });
    });

    it('TC_W502_19b: exercise items have active:scale-[0.98] class', () => {
      render(<ExerciseSelector {...defaultProps} />);
      const item = screen.getByTestId('exercise-item-barbell-bench-press');
      expect(item.className).toContain('active:scale-[0.98]');
    });
  });

  // ================================================================
  // SC_W502_20/21 — Interaction: Select & Custom
  // ================================================================

  describe('SC_W502_20-21 — Interaction', () => {
    it('TC_W502_20: tap on exercise calls onSelect with correct exercise', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onClose = vi.fn();
      render(<ExerciseSelector {...defaultProps} onSelect={onSelect} onClose={onClose} />);

      await user.click(screen.getByTestId('exercise-item-barbell-bench-press'));

      expect(onSelect).toHaveBeenCalledTimes(1);
      const sel = onSelect.mock.calls[0][0] as Exercise;
      expect(sel.id).toBe('barbell-bench-press');
      expect(sel.nameVi).toBe('Đẩy tạ đòn nằm ngang');
      expect(sel.muscleGroup).toBe('chest');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('TC_W502_21: custom exercise flow preserved', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onClose = vi.fn();
      render(<ExerciseSelector isOpen onClose={onClose} onSelect={onSelect} />);

      await user.click(screen.getByTestId('add-custom-exercise'));
      expect(screen.getByTestId('custom-exercise-modal')).toBeInTheDocument();

      await user.type(screen.getByTestId('custom-exercise-name'), 'My Custom Exercise');
      await user.click(screen.getByTestId('save-custom-exercise'));

      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          nameVi: 'My Custom Exercise',
          isCustom: true,
          exerciseType: 'strength',
        }),
      );
      expect(onClose).toHaveBeenCalled();
    });

    it('canceling custom modal keeps selector state', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);
      await user.type(screen.getByTestId('exercise-search-input'), 'Đẩy');
      await user.click(screen.getByTestId('add-custom-exercise'));

      const cancelButtons = screen.getAllByText('Hủy');
      await user.click(cancelButtons[cancelButtons.length - 1]);

      expect(screen.queryByTestId('custom-exercise-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('exercise-search-input')).toHaveValue('Đẩy');
    });
  });

  // ================================================================
  // SC_W502_22 — Swipe Dismiss
  // ================================================================

  describe('SC_W502_22 — Swipe dismiss', () => {
    it('disables swipe dismissal while search input is focused', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);
      await user.click(screen.getByTestId('exercise-search-input'));
      expect(screen.getByTestId('modal-backdrop')).toHaveAttribute('data-allow-swipe', 'false');
      await user.tab();
      expect(screen.getByTestId('modal-backdrop')).toHaveAttribute('data-allow-swipe', 'true');
    });

    it('backdrop click calls onClose', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ExerciseSelector {...defaultProps} onClose={onClose} />);
      await user.click(screen.getByTestId('backdrop-overlay'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ================================================================
  // SC_W502_23 — Recently Used Items Selectable
  // ================================================================

  describe('SC_W502_23 — Recently used selectable', () => {
    it('clicking a recently used item calls onSelect + onClose', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onClose = vi.fn();
      setMockWorkoutSets([makeSet('barbell-bench-press', '2025-07-18T10:00:00Z')]);
      render(<ExerciseSelector {...defaultProps} onSelect={onSelect} onClose={onClose} />);

      await user.click(screen.getByTestId('recent-exercise-barbell-bench-press'));

      expect(onSelect).toHaveBeenCalledTimes(1);
      const sel = onSelect.mock.calls[0][0] as Exercise;
      expect(sel.id).toBe('barbell-bench-press');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ================================================================
  // SC_W502_24 — Category Tab Reset Behavior
  // ================================================================

  describe('SC_W502_24 — Category tab reset', () => {
    it('clicking "Tất cả" tab restores all exercises', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.click(screen.getByTestId('category-tab-isolation'));
      expect(screen.queryByText('Đẩy tạ đòn nằm ngang')).not.toBeInTheDocument();

      await user.click(screen.getByTestId('category-tab-all'));
      expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();
      expect(screen.getByText('Bay tạ tay')).toBeInTheDocument();
      expect(screen.getByText('Chạy bộ')).toBeInTheDocument();
    });
  });

  // ================================================================
  // SC_W502_27 — Cardio Tab Hides Chips
  // ================================================================

  describe('SC_W502_27 — Cardio tab hides chips', () => {
    it('cardio tab hides muscle group and equipment chips', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      expect(screen.getByTestId('muscle-group-chips')).toBeInTheDocument();
      expect(screen.getByTestId('equipment-chips')).toBeInTheDocument();

      await user.click(screen.getByTestId('category-tab-cardio'));

      expect(screen.queryByTestId('muscle-group-chips')).not.toBeInTheDocument();
      expect(screen.queryByTestId('equipment-chips')).not.toBeInTheDocument();
    });

    it('switching from cardio to compound restores chips', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      await user.click(screen.getByTestId('category-tab-cardio'));
      expect(screen.queryByTestId('muscle-group-chips')).not.toBeInTheDocument();

      await user.click(screen.getByTestId('category-tab-compound'));
      expect(screen.getByTestId('muscle-group-chips')).toBeInTheDocument();
      expect(screen.getByTestId('equipment-chips')).toBeInTheDocument();
    });

    it('cardio tab resets muscle group and equipment selections', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} />);

      // Set some filters
      await user.click(findChipInRegion('muscle-group-chips', 'Lưng'));
      await user.click(screen.getByTestId('equipment-chip-barbell'));

      // Switch to cardio (resets filters)
      await user.click(screen.getByTestId('category-tab-cardio'));

      // Switch back to all — should have no muscle/equipment filter active
      await user.click(screen.getByTestId('category-tab-all'));
      // All exercises visible (filters were reset)
      expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();
      expect(screen.getByText('Bay tạ tay')).toBeInTheDocument();
      expect(screen.getByText('Kéo xô máy')).toBeInTheDocument();
    });
  });

  // ================================================================
  // SC_W502_29 — equipmentFilter Prop + Interactive Chips Compat
  // ================================================================

  describe('SC_W502_29 — equipmentFilter prop + chips', () => {
    it('equipmentFilter prop pre-selects equipment chips', () => {
      render(<ExerciseSelector {...defaultProps} equipmentFilter={['cable'] as EquipmentType[]} />);

      // Only cable exercises visible
      expect(screen.getByText('Kéo xô máy')).toBeInTheDocument();
      expect(screen.queryByText('Đẩy tạ đòn nằm ngang')).not.toBeInTheDocument();
    });

    it('user can add more equipment on top of prop filter', async () => {
      const user = userEvent.setup();
      render(<ExerciseSelector {...defaultProps} equipmentFilter={['cable'] as EquipmentType[]} />);

      // cable pre-selected → only lat-pulldown
      expect(screen.getByText('Kéo xô máy')).toBeInTheDocument();

      // Add barbell
      await user.click(screen.getByTestId('equipment-chip-barbell'));

      // Now cable + barbell
      expect(screen.getByText('Kéo xô máy')).toBeInTheDocument();
      expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();
      expect(screen.getByText('Chèo tạ đòn')).toBeInTheDocument();
    });
  });

  // ================================================================
  // SC_W502_30 — Recently Used Items Display Format
  // ================================================================

  describe('SC_W502_30 — Recently used display format', () => {
    it('recently used items show name + muscle group + category', () => {
      setMockWorkoutSets([makeSet('barbell-bench-press', '2025-07-18T10:00:00Z')]);
      render(<ExerciseSelector {...defaultProps} />);

      const recentBtn = screen.getByTestId('recent-exercise-barbell-bench-press');
      expect(recentBtn).toHaveTextContent('Đẩy tạ đòn nằm ngang');
      expect(recentBtn).toHaveTextContent('Ngực');
      expect(recentBtn).toHaveTextContent('Đa khớp');
    });

    it('recently used items have active:scale-[0.98] and min-h-12', () => {
      setMockWorkoutSets([makeSet('barbell-bench-press', '2025-07-18T10:00:00Z')]);
      render(<ExerciseSelector {...defaultProps} />);

      const btn = screen.getByTestId('recent-exercise-barbell-bench-press');
      expect(btn.className).toContain('min-h-12');
      expect(btn.className).toContain('active:scale-[0.98]');
    });
  });

  // ================================================================
  // SC_W502_26 — Accessibility
  // ================================================================

  describe('SC_W502_26 — Accessibility', () => {
    it('search input has aria-label', () => {
      render(<ExerciseSelector {...defaultProps} />);
      expect(screen.getByTestId('exercise-search-input')).toHaveAttribute('aria-label', 'Tìm bài tập...');
    });

    it('search icon has aria-hidden', () => {
      render(<ExerciseSelector {...defaultProps} />);
      const region = screen.getByTestId('exercise-selector-search-region');
      const svg = region.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('title has id linked to modal', () => {
      render(<ExerciseSelector {...defaultProps} />);
      const title = screen.getByTestId('exercise-selector-title');
      const titleIdValue = title.getAttribute('id');
      expect(titleIdValue).toBeTruthy();
      expect(screen.getByTestId('modal-backdrop')).toHaveAttribute('data-aria-labelledby', titleIdValue);
    });
  });

  // ================================================================
  // Additional: Recently used hidden during search
  // ================================================================

  describe('Recently used hidden during search', () => {
    it('recently used section disappears when user types search query', async () => {
      const user = userEvent.setup();
      setMockWorkoutSets([makeSet('barbell-bench-press', '2025-07-18T10:00:00Z')]);
      render(<ExerciseSelector {...defaultProps} />);

      expect(screen.getByTestId('recently-used-section')).toBeInTheDocument();

      await user.type(screen.getByTestId('exercise-search-input'), 'Đẩy');
      expect(screen.queryByTestId('recently-used-section')).not.toBeInTheDocument();
    });
  });

  // ================================================================
  // Additional: Exercise details display
  // ================================================================

  describe('Exercise details display', () => {
    it('shows exercise details (name, category, equipment)', () => {
      render(<ExerciseSelector {...defaultProps} />);

      expect(screen.getByText('Đẩy tạ đòn nằm ngang')).toBeInTheDocument();
      const compoundBadges = screen.getAllByText('Đa khớp');
      expect(compoundBadges.length).toBeGreaterThan(0);
      expect(screen.getAllByText('Tạ đòn').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ngực').length).toBeGreaterThan(0);
      expect(screen.getByText('Phụ trợ')).toBeInTheDocument();
      const isolationBadges = screen.getAllByText('Cô lập');
      expect(isolationBadges.length).toBeGreaterThan(0);
    });
  });

  // ================================================================
  // Backdrop close of custom modal
  // ================================================================

  describe('Custom modal backdrop close', () => {
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

  // ================================================================
  // muscleGroupFilter prop
  // ================================================================

  describe('muscleGroupFilter prop', () => {
    it('pre-selects muscle group when muscleGroupFilter provided', () => {
      render(<ExerciseSelector {...defaultProps} muscleGroupFilter="back" />);

      // Only back exercises visible
      expect(screen.getByText('Chèo tạ đòn')).toBeInTheDocument();
      expect(screen.getByText('Kéo xô máy')).toBeInTheDocument();
      expect(screen.queryByText('Đẩy tạ đòn nằm ngang')).not.toBeInTheDocument();
    });
  });
});
