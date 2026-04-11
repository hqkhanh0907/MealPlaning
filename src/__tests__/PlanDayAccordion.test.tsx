import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from 'i18next';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { PlanDayAccordion } from '@/features/fitness/components/PlanDayAccordion';
import type {
  BodyRegion,
  EquipmentType,
  Exercise,
  ExerciseCategory,
  ExerciseType,
  MuscleGroup,
  SelectedExercise,
  TrainingPlanDay,
} from '@/features/fitness/types';

// ---------------------------------------------------------------------------
// i18n: add missing key used by the component (to be integrated into vi.json)
// ---------------------------------------------------------------------------
beforeAll(() => {
  i18n.addResourceBundle('vi', 'translation', { fitness: { plan: { completed: 'Hoàn thành' } } }, true, true);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeExercise(id: string, nameVi: string, overrides: Partial<Exercise> = {}): Exercise {
  return {
    id,
    nameVi,
    muscleGroup: 'chest' as MuscleGroup,
    secondaryMuscles: ['shoulders'] as MuscleGroup[],
    category: 'compound' as ExerciseCategory,
    equipment: ['barbell'] as EquipmentType[],
    contraindicated: [] as BodyRegion[],
    exerciseType: 'strength' as ExerciseType,
    defaultRepsMin: 8,
    defaultRepsMax: 12,
    isCustom: false,
    updatedAt: '',
    ...overrides,
  };
}

function makeSelectedExercise(
  id: string,
  nameVi: string,
  sets: number,
  repsMin: number,
  repsMax: number,
): SelectedExercise {
  return { exercise: makeExercise(id, nameVi), sets, repsMin, repsMax, restSeconds: 90 };
}

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------
const MOCK_EXERCISES: SelectedExercise[] = [
  makeSelectedExercise('bench-press', 'Đẩy ngực ngang', 4, 8, 12),
  makeSelectedExercise('incline-db', 'Đẩy ngực dốc tạ tay', 3, 10, 15),
];

const MOCK_PLAN_DAY: TrainingPlanDay = {
  id: 'day-tue-1',
  planId: 'plan-1',
  dayOfWeek: 2,
  sessionOrder: 1,
  workoutType: 'Chest',
  muscleGroups: JSON.stringify(['chest', 'shoulders']),
  exercises: JSON.stringify(MOCK_EXERCISES),
  originalExercises: JSON.stringify(MOCK_EXERCISES),
  isUserAssigned: false,
  originalDayOfWeek: 2,
};

const MOCK_EMPTY_PLAN_DAY: TrainingPlanDay = {
  ...MOCK_PLAN_DAY,
  id: 'day-wed-1',
  dayOfWeek: 3,
  exercises: '[]',
  originalExercises: '[]',
};

const MOCK_MANY_EXERCISES: SelectedExercise[] = [
  makeSelectedExercise('ex-1', 'Bài tập 1', 3, 8, 12),
  makeSelectedExercise('ex-2', 'Bài tập 2', 3, 8, 12),
  makeSelectedExercise('ex-3', 'Bài tập 3', 3, 8, 12),
  makeSelectedExercise('ex-4', 'Bài tập 4', 3, 8, 12),
  makeSelectedExercise('ex-5', 'Bài tập 5', 3, 8, 12),
];

const MOCK_MANY_EX_PLAN_DAY: TrainingPlanDay = {
  ...MOCK_PLAN_DAY,
  id: 'day-thu-1',
  dayOfWeek: 4,
  exercises: JSON.stringify(MOCK_MANY_EXERCISES),
};

const MOCK_CARDIO_PLAN_DAY: TrainingPlanDay = {
  ...MOCK_PLAN_DAY,
  id: 'day-fri-1',
  dayOfWeek: 5,
  workoutType: 'Cardio',
  muscleGroups: '',
  exercises: '[]',
};

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------
interface OverrideProps {
  planDay?: TrainingPlanDay;
  dayOfWeek?: number;
  isExpanded?: boolean;
  isCompleted?: boolean;
  onToggle?: () => void;
  onStartWorkout?: () => void;
  onEditExercises?: () => void;
}

function renderAccordion(overrides: OverrideProps = {}) {
  const defaultProps = {
    planDay: MOCK_PLAN_DAY,
    dayOfWeek: 2,
    isExpanded: false,
    isCompleted: false,
    onToggle: vi.fn(),
    onStartWorkout: vi.fn(),
    onEditExercises: vi.fn(),
    ...overrides,
  };
  const result = render(<PlanDayAccordion {...defaultProps} />);
  return { ...result, props: defaultProps };
}

// ===========================================================================
// Tests
// ===========================================================================
describe('PlanDayAccordion', () => {
  // -----------------------------------------------------------------------
  // TS-01: Collapsed State
  // -----------------------------------------------------------------------
  describe('Collapsed State', () => {
    it('TC_PDA_01: shows day label', () => {
      renderAccordion({ dayOfWeek: 1 });
      expect(screen.getByText('T2')).toBeInTheDocument();
    });

    it('TC_PDA_02: shows translated workout type', () => {
      renderAccordion();
      // 'Chest' → translated via fitness.workoutType.Chest → "Ngực"
      expect(screen.getByText('Ngực')).toBeInTheDocument();
    });

    it('TC_PDA_03: shows exercise count', () => {
      renderAccordion();
      expect(screen.getByText(/2 bài tập/)).toBeInTheDocument();
    });

    it('TC_PDA_04: shows muscle groups', () => {
      renderAccordion();
      expect(screen.getByText('Ngực, Vai')).toBeInTheDocument();
    });

    it('TC_PDA_05: hides exercise list', () => {
      renderAccordion();
      expect(screen.queryByText('Đẩy ngực ngang')).not.toBeInTheDocument();
      expect(screen.queryByText('Đẩy ngực dốc tạ tay')).not.toBeInTheDocument();
    });

    it('TC_PDA_06: hides action buttons', () => {
      renderAccordion();
      expect(screen.queryByText('Bắt đầu tập')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Chỉnh sửa bài tập')).not.toBeInTheDocument();
    });

    it('TC_PDA_07: shows chevron NOT rotated', () => {
      renderAccordion({ dayOfWeek: 2 });
      const chevron = screen.getByTestId('chevron-2');
      expect(chevron).not.toHaveClass('rotate-180');
    });

    it('TC_PDA_08: has aria-expanded=false', () => {
      renderAccordion();
      expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // TS-02: Expanded State
  // -----------------------------------------------------------------------
  describe('Expanded State', () => {
    it('TC_PDA_09: shows exercise list', () => {
      renderAccordion({ isExpanded: true });
      expect(screen.getByText('Đẩy ngực ngang')).toBeInTheDocument();
      expect(screen.getByText('Đẩy ngực dốc tạ tay')).toBeInTheDocument();
    });

    it('TC_PDA_10: shows sets × reps for each exercise', () => {
      renderAccordion({ isExpanded: true });
      expect(screen.getByText(/4 hiệp × 8-12 lần/)).toBeInTheDocument();
      expect(screen.getByText(/3 hiệp × 10-15 lần/)).toBeInTheDocument();
    });

    it('TC_PDA_11: shows "Bắt đầu tập" button', () => {
      renderAccordion({ isExpanded: true });
      expect(screen.getByText('Bắt đầu tập')).toBeInTheDocument();
    });

    it('TC_PDA_12: shows edit exercises button', () => {
      renderAccordion({ isExpanded: true });
      expect(screen.getByLabelText('Chỉnh sửa bài tập')).toBeInTheDocument();
    });

    it('TC_PDA_13: chevron rotated 180°', () => {
      renderAccordion({ isExpanded: true, dayOfWeek: 2 });
      const chevron = screen.getByTestId('chevron-2');
      expect(chevron).toHaveClass('rotate-180');
    });

    it('TC_PDA_14: has aria-expanded=true', () => {
      renderAccordion({ isExpanded: true });
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
    });

    it('TC_PDA_15: aria-controls matches content id', () => {
      renderAccordion({ isExpanded: true, dayOfWeek: 2 });
      const header = screen.getByRole('button', { expanded: true });
      expect(header).toHaveAttribute('aria-controls', 'plan-day-content-2');
      const content = document.getElementById('plan-day-content-2');
      expect(content).toBeInTheDocument();
    });

    it('TC_PDA_16: shows workout stats (exercise count + duration)', () => {
      renderAccordion({ isExpanded: true });
      // Stats in expanded content area
      const container = document.getElementById('plan-day-content-2')!;
      expect(container.textContent).toMatch(/2 bài tập/);
      expect(container.textContent).toMatch(/~\d+ phút/);
    });
  });

  // -----------------------------------------------------------------------
  // TS-03: Toggle Interaction
  // -----------------------------------------------------------------------
  describe('Toggle Interaction', () => {
    it('TC_PDA_17: click collapsed header calls onToggle', async () => {
      const user = userEvent.setup();
      const { props } = renderAccordion();
      await user.click(screen.getByRole('button', { expanded: false }));
      expect(props.onToggle).toHaveBeenCalledTimes(1);
    });

    it('TC_PDA_18: click expanded header calls onToggle', async () => {
      const user = userEvent.setup();
      const { props } = renderAccordion({ isExpanded: true });
      await user.click(screen.getByRole('button', { expanded: true }));
      expect(props.onToggle).toHaveBeenCalledTimes(1);
    });

    it('TC_PDA_19: click "Bắt đầu tập" calls onStartWorkout', async () => {
      const user = userEvent.setup();
      const { props } = renderAccordion({ isExpanded: true });
      await user.click(screen.getByText('Bắt đầu tập'));
      expect(props.onStartWorkout).toHaveBeenCalledTimes(1);
    });

    it('TC_PDA_20: click edit button calls onEditExercises', async () => {
      const user = userEvent.setup();
      const { props } = renderAccordion({ isExpanded: true });
      await user.click(screen.getByLabelText('Chỉnh sửa bài tập'));
      expect(props.onEditExercises).toHaveBeenCalledTimes(1);
    });

    it('TC_PDA_21: click "Bắt đầu tập" does NOT call onToggle', async () => {
      const user = userEvent.setup();
      const { props } = renderAccordion({ isExpanded: true });
      await user.click(screen.getByText('Bắt đầu tập'));
      expect(props.onToggle).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // TS-04: Completed State
  // -----------------------------------------------------------------------
  describe('Completed State', () => {
    it('TC_PDA_22: completed shows check badge', () => {
      renderAccordion({ isCompleted: true });
      expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
    });

    it('TC_PDA_23: completed badge has success styling', () => {
      renderAccordion({ isCompleted: true });
      const badge = screen.getByText('Hoàn thành').closest('span');
      expect(badge).toBeDefined();
      expect(badge!.className).toContain('bg-success/10');
      expect(badge!.className).toContain('text-success');
    });

    it('TC_PDA_24: completed badge visible in expanded state', () => {
      renderAccordion({ isCompleted: true, isExpanded: true });
      expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
      // Also exercises are visible
      expect(screen.getByText('Đẩy ngực ngang')).toBeInTheDocument();
    });

    it('TC_PDA_25: not completed hides check badge', () => {
      renderAccordion({ isCompleted: false });
      expect(screen.queryByText('Hoàn thành')).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // TS-05: Empty Exercises
  // -----------------------------------------------------------------------
  describe('Empty Exercises', () => {
    it('TC_PDA_26: shows "Chưa có bài tập" message', () => {
      renderAccordion({ planDay: MOCK_EMPTY_PLAN_DAY, isExpanded: true });
      expect(screen.getByText(/Chưa có bài tập/)).toBeInTheDocument();
    });

    it('TC_PDA_27: shows "Thêm bài tập" CTA', () => {
      renderAccordion({ planDay: MOCK_EMPTY_PLAN_DAY, isExpanded: true });
      expect(screen.getByText('Thêm bài tập')).toBeInTheDocument();
    });

    it('TC_PDA_28: CTA triggers onEditExercises', async () => {
      const user = userEvent.setup();
      const { props } = renderAccordion({ planDay: MOCK_EMPTY_PLAN_DAY, isExpanded: true });
      await user.click(screen.getByText('Thêm bài tập'));
      expect(props.onEditExercises).toHaveBeenCalledTimes(1);
    });

    it('TC_PDA_29: hides "Bắt đầu tập" when no exercises', () => {
      renderAccordion({ planDay: MOCK_EMPTY_PLAN_DAY, isExpanded: true });
      expect(screen.queryByText('Bắt đầu tập')).not.toBeInTheDocument();
    });

    it('TC_PDA_30: collapsed with 0 exercises does not show exercise count', () => {
      renderAccordion({ planDay: MOCK_EMPTY_PLAN_DAY, isExpanded: false });
      expect(screen.queryByText(/\d+ bài tập/)).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // TS-07: Accessibility & Touch Targets
  // -----------------------------------------------------------------------
  describe('Accessibility & Touch Targets', () => {
    it('TC_PDA_33: header has active:scale-[0.98]', () => {
      renderAccordion();
      const header = screen.getByRole('button', { expanded: false });
      expect(header.className).toContain('active:scale-[0.98]');
    });

    it('TC_PDA_34: header has focus-visible:ring-2', () => {
      renderAccordion();
      const header = screen.getByRole('button', { expanded: false });
      expect(header.className).toContain('focus-visible:ring-2');
    });

    it('TC_PDA_35: header has min-height ≥44px', () => {
      renderAccordion();
      const header = screen.getByRole('button', { expanded: false });
      expect(header.className).toContain('min-h-[44px]');
    });

    it('TC_PDA_36: chevron has transition-transform', () => {
      renderAccordion({ dayOfWeek: 2 });
      const chevron = screen.getByTestId('chevron-2');
      expect(chevron.getAttribute('class')).toContain('transition-transform');
    });

    it('TC_PDA_37: start workout button has adequate touch target', () => {
      renderAccordion({ isExpanded: true });
      const btn = screen.getByText('Bắt đầu tập').closest('button')!;
      expect(btn.className).toContain('min-h-11');
    });

    it('TC_PDA_38: edit button has adequate touch target', () => {
      renderAccordion({ isExpanded: true });
      const btn = screen.getByLabelText('Chỉnh sửa bài tập');
      expect(btn.className).toContain('min-h-11');
    });

    it('TC_PDA_39: component has correct data-testid', () => {
      renderAccordion({ dayOfWeek: 2 });
      expect(screen.getByTestId('plan-day-2')).toBeInTheDocument();
    });

    it('TC_PDA_40: motion-reduce removes scale transform', () => {
      renderAccordion();
      const header = screen.getByRole('button', { expanded: false });
      expect(header.className).toContain('motion-reduce:transform-none');
    });
  });

  // -----------------------------------------------------------------------
  // TS-08: Exercise Collapse (>3 exercises)
  // -----------------------------------------------------------------------
  describe('Exercise Collapse (>3)', () => {
    it('TC_PDA_41: >3 exercises shows only first 3 initially', () => {
      renderAccordion({ planDay: MOCK_MANY_EX_PLAN_DAY, isExpanded: true, dayOfWeek: 4 });
      expect(screen.getByText('Bài tập 1')).toBeInTheDocument();
      expect(screen.getByText('Bài tập 2')).toBeInTheDocument();
      expect(screen.getByText('Bài tập 3')).toBeInTheDocument();
      expect(screen.queryByText('Bài tập 4')).not.toBeInTheDocument();
      expect(screen.queryByText('Bài tập 5')).not.toBeInTheDocument();
    });

    it('TC_PDA_42: shows "+N bài tập nữa" button', () => {
      renderAccordion({ planDay: MOCK_MANY_EX_PLAN_DAY, isExpanded: true, dayOfWeek: 4 });
      expect(screen.getByText('+2 bài tập nữa')).toBeInTheDocument();
    });

    it('TC_PDA_43: click "more" shows all exercises', async () => {
      const user = userEvent.setup();
      renderAccordion({ planDay: MOCK_MANY_EX_PLAN_DAY, isExpanded: true, dayOfWeek: 4 });
      await user.click(screen.getByText('+2 bài tập nữa'));
      expect(screen.getByText('Bài tập 4')).toBeInTheDocument();
      expect(screen.getByText('Bài tập 5')).toBeInTheDocument();
    });

    it('TC_PDA_44: after expand shows "Thu gọn"', async () => {
      const user = userEvent.setup();
      renderAccordion({ planDay: MOCK_MANY_EX_PLAN_DAY, isExpanded: true, dayOfWeek: 4 });
      await user.click(screen.getByText('+2 bài tập nữa'));
      expect(screen.getByText('Thu gọn')).toBeInTheDocument();
    });

    it('TC_PDA_45: ≤3 exercises does NOT show more button', () => {
      renderAccordion({ isExpanded: true });
      expect(screen.queryByText(/bài tập nữa/)).not.toBeInTheDocument();
      expect(screen.queryByText('Thu gọn')).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // TS-09: Edge Cases
  // -----------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('TC_PDA_46: null/undefined exercises handled gracefully', () => {
      const dayWithNull: TrainingPlanDay = {
        ...MOCK_PLAN_DAY,
        exercises: undefined,
      };
      expect(() => renderAccordion({ planDay: dayWithNull })).not.toThrow();
    });

    it('TC_PDA_46b: out-of-range dayOfWeek falls back to empty label', () => {
      renderAccordion({ dayOfWeek: 0 });
      // DAY_LABELS[-1] = undefined → fallback to ''
      const header = screen.getByRole('button');
      expect(header).toBeInTheDocument();
    });

    it('TC_PDA_47: invalid JSON exercises handled gracefully', () => {
      const dayWithInvalid: TrainingPlanDay = {
        ...MOCK_PLAN_DAY,
        exercises: 'not-valid-json',
      };
      expect(() => renderAccordion({ planDay: dayWithInvalid })).not.toThrow();
    });

    it('TC_PDA_48: all 7 day positions render correctly', () => {
      const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      dayLabels.forEach((label, i) => {
        const dayOfWeek = i + 1;
        const { unmount } = render(
          <PlanDayAccordion
            planDay={MOCK_PLAN_DAY}
            dayOfWeek={dayOfWeek}
            isExpanded={false}
            isCompleted={false}
            onToggle={vi.fn()}
            onStartWorkout={vi.fn()}
            onEditExercises={vi.fn()}
          />,
        );
        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.getByTestId(`plan-day-${dayOfWeek}`)).toBeInTheDocument();
        unmount();
      });
    });

    it('TC_PDA_49: long workout type name has truncate class', () => {
      const longTypePlanDay: TrainingPlanDay = {
        ...MOCK_PLAN_DAY,
        workoutType: 'Upper Body Strength 2',
      };
      renderAccordion({ planDay: longTypePlanDay });
      // translateWorkoutType fallback: "Upper Body Strength 2"
      const nameSpan = screen.getByText('Upper Body Strength 2');
      expect(nameSpan.className).toContain('truncate');
    });

    it('TC_PDA_50: cardio day shows cardio label in expanded content', () => {
      renderAccordion({ planDay: MOCK_CARDIO_PLAN_DAY, isExpanded: true, dayOfWeek: 5 });
      const allCardio = screen.getAllByText('Cardio');
      // Header shows "Cardio" as workout name + expanded content shows cardio label
      expect(allCardio.length).toBeGreaterThanOrEqual(2);
    });
  });
});
