import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi as vitest } from 'vitest';
import {
  FitnessOnboarding,
} from '../features/fitness/components/FitnessOnboarding';
import { getSmartDefaults } from '../features/fitness/utils/getSmartDefaults';
import { useFitnessStore } from '../store/fitnessStore';
import { EXERCISES } from '../features/fitness/data/exerciseDatabase';
import type {
  TrainingGoal,
  TrainingExperience,
} from '../features/fitness/types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
function resetStore() {
  useFitnessStore.setState({
    trainingProfile: null,
    trainingPlans: [],
    trainingPlanDays: [],
    workouts: [],
    workoutSets: [],
    weightEntries: [],
    isOnboarded: false,
  });
}

// Mock crypto.randomUUID for deterministic IDs
const originalRandomUUID = crypto.randomUUID;
beforeEach(() => {
  crypto.randomUUID = () => 'test-uuid-1234' as ReturnType<typeof crypto.randomUUID>;
});
afterEach(() => {
  crypto.randomUUID = originalRandomUUID;
});

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */
describe('FitnessOnboarding', () => {
  beforeEach(() => {
    resetStore();
  });

  it('renders 3 core fields (goal, experience, days)', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    expect(screen.getByText('Thiết lập tập luyện')).toBeInTheDocument();
    expect(screen.getByText('Chọn 3 thông tin cơ bản để bắt đầu')).toBeInTheDocument();

    expect(screen.getByText('Mục tiêu tập luyện')).toBeInTheDocument();
    expect(screen.getByText('Sức mạnh')).toBeInTheDocument();
    expect(screen.getByText('Phát triển cơ')).toBeInTheDocument();
    expect(screen.getByText('Sức bền')).toBeInTheDocument();
    expect(screen.getByText('Tổng hợp')).toBeInTheDocument();

    expect(screen.getByText('Trình độ')).toBeInTheDocument();
    expect(screen.getByText('Mới bắt đầu')).toBeInTheDocument();
    expect(screen.getByText('Trung cấp')).toBeInTheDocument();
    expect(screen.getByText('Nâng cao')).toBeInTheDocument();

    expect(screen.getByText('Số ngày tập/tuần')).toBeInTheDocument();
    [2, 3, 4, 5, 6].forEach((d) => {
      expect(screen.getByRole('radio', { name: String(d) })).toBeInTheDocument();
    });
  });

  it('customize section hidden by default', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    expect(screen.queryByTestId('customize-section')).not.toBeInTheDocument();
  });

  it('clicking "Tùy chỉnh thêm" shows extra fields', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    const toggleBtn = screen.getByText(/Tùy chỉnh thêm/);
    fireEvent.click(toggleBtn);

    expect(screen.getByTestId('customize-section')).toBeInTheDocument();
    expect(screen.getByText('Thời lượng buổi tập (phút)')).toBeInTheDocument();
  });

  it('beginner shows only 4 extra fields', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Mới bắt đầu' }));
    fireEvent.click(screen.getByText(/Tùy chỉnh thêm/));

    expect(screen.getByTestId('field-session-duration')).toBeInTheDocument();
    expect(screen.getByTestId('field-equipment')).toBeInTheDocument();
    expect(screen.getByTestId('field-injuries')).toBeInTheDocument();
    expect(screen.getByTestId('field-cardio-sessions')).toBeInTheDocument();

    expect(screen.queryByTestId('field-periodization')).not.toBeInTheDocument();
    expect(screen.queryByTestId('field-cycle-weeks')).not.toBeInTheDocument();
    expect(screen.queryByTestId('field-priority-muscles')).not.toBeInTheDocument();
    expect(screen.queryByTestId('field-known-1rm')).not.toBeInTheDocument();
    expect(screen.queryByTestId('field-avg-sleep')).not.toBeInTheDocument();
  });

  it('intermediate shows 7 extra fields (4 base + 3 intermediate)', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Trung cấp' }));
    fireEvent.click(screen.getByText(/Tùy chỉnh thêm/));

    expect(screen.getByTestId('field-session-duration')).toBeInTheDocument();
    expect(screen.getByTestId('field-equipment')).toBeInTheDocument();
    expect(screen.getByTestId('field-injuries')).toBeInTheDocument();
    expect(screen.getByTestId('field-cardio-sessions')).toBeInTheDocument();
    expect(screen.getByTestId('field-periodization')).toBeInTheDocument();
    expect(screen.getByTestId('field-cycle-weeks')).toBeInTheDocument();
    expect(screen.getByTestId('field-priority-muscles')).toBeInTheDocument();

    expect(screen.queryByTestId('field-known-1rm')).not.toBeInTheDocument();
    expect(screen.queryByTestId('field-avg-sleep')).not.toBeInTheDocument();
  });

  it('advanced shows all 9 extra fields', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Nâng cao' }));
    fireEvent.click(screen.getByText(/Tùy chỉnh thêm/));

    expect(screen.getByTestId('field-session-duration')).toBeInTheDocument();
    expect(screen.getByTestId('field-equipment')).toBeInTheDocument();
    expect(screen.getByTestId('field-injuries')).toBeInTheDocument();
    expect(screen.getByTestId('field-cardio-sessions')).toBeInTheDocument();
    expect(screen.getByTestId('field-periodization')).toBeInTheDocument();
    expect(screen.getByTestId('field-cycle-weeks')).toBeInTheDocument();
    expect(screen.getByTestId('field-priority-muscles')).toBeInTheDocument();
    expect(screen.getByTestId('field-known-1rm')).toBeInTheDocument();
    expect(screen.getByTestId('field-avg-sleep')).toBeInTheDocument();
  });

  it('equipment multi-select toggles on/off', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByText(/Tùy chỉnh thêm/));

    const barbellBtn = screen.getByRole('checkbox', { name: /barbell/ });
    expect(barbellBtn).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(barbellBtn);
    expect(barbellBtn).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(barbellBtn);
    expect(barbellBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('priority muscles limited to 3', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Trung cấp' }));
    fireEvent.click(screen.getByText(/Tùy chỉnh thêm/));

    const chestBtn = screen.getByRole('checkbox', { name: /^chest$/ });
    const backBtn = screen.getByRole('checkbox', { name: /^back$/ });
    const legsBtn = screen.getByRole('checkbox', { name: /^legs$/ });
    const armsBtn = screen.getByRole('checkbox', { name: /^arms$/ });

    fireEvent.click(chestBtn);
    fireEvent.click(backBtn);
    fireEvent.click(legsBtn);
    expect(chestBtn).toHaveAttribute('aria-checked', 'true');
    expect(backBtn).toHaveAttribute('aria-checked', 'true');
    expect(legsBtn).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(armsBtn);
    expect(armsBtn).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(chestBtn);
    expect(chestBtn).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(armsBtn);
    expect(armsBtn).toHaveAttribute('aria-checked', 'true');
  });

  it('clicking "Bắt đầu →" calls onComplete and store actions', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu/ }));

    expect(onComplete).toHaveBeenCalledTimes(1);

    const state = useFitnessStore.getState();
    expect(state.isOnboarded).toBe(true);
    expect(state.trainingProfile).not.toBeNull();
    expect(state.trainingProfile?.id).toBe('test-uuid-1234');
    expect(state.trainingProfile?.trainingGoal).toBe('hypertrophy');
    expect(state.trainingProfile?.trainingExperience).toBe('beginner');
    expect(state.trainingProfile?.daysPerWeek).toBe(3);
  });

  it('submit merges user overrides with smart defaults', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Sức mạnh' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Nâng cao' }));
    fireEvent.click(screen.getByRole('radio', { name: '5' }));
    fireEvent.click(screen.getByText(/Tùy chỉnh thêm/));

    fireEvent.click(screen.getByRole('radio', { name: '90' }));

    const barbellBtn = screen.getByRole('checkbox', { name: /barbell/ });
    fireEvent.click(barbellBtn);

    const kneeBtn = screen.getByRole('checkbox', { name: /knees/ });
    fireEvent.click(kneeBtn);

    const squatInput = screen.getByLabelText('squat');
    fireEvent.change(squatInput, { target: { value: '140' } });

    const benchInput = screen.getByLabelText('bench');
    fireEvent.change(benchInput, { target: { value: '' } });

    const deadliftInput = screen.getByLabelText('deadlift');
    fireEvent.change(deadliftInput, { target: { value: '0' } });

    const sleepInput = screen.getByLabelText('Giờ ngủ trung bình');
    fireEvent.change(sleepInput, { target: { value: '7.5' } });

    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu/ }));

    const profile = useFitnessStore.getState().trainingProfile;
    expect(profile).not.toBeNull();
    expect(profile?.trainingGoal).toBe('strength');
    expect(profile?.daysPerWeek).toBe(5);
    expect(profile?.sessionDurationMin).toBe(90);
    expect(profile?.availableEquipment).toEqual(['barbell']);
    expect(profile?.injuryRestrictions).toEqual(['knees']);
    expect(profile?.known1rm).toEqual({ squat: 140 });
    expect(profile?.avgSleepHours).toBe(7.5);
  });

  it('customize section can be toggled closed', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    const toggleBtn = screen.getByText(/Tùy chỉnh thêm/);
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('customize-section')).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.queryByTestId('customize-section')).not.toBeInTheDocument();
  });

  it('injury multi-select toggles on/off', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByText(/Tùy chỉnh thêm/));

    const shouldersBtn = screen.getByRole('checkbox', { name: /shoulders/ });
    expect(shouldersBtn).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(shouldersBtn);
    expect(shouldersBtn).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(shouldersBtn);
    expect(shouldersBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('cardio, periodization, and cycle weeks pills are interactive', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Trung cấp' }));
    fireEvent.click(screen.getByText(/Tùy chỉnh thêm/));

    const cardioSection = screen.getByTestId('field-cardio-sessions');
    const cardio3 = within(cardioSection).getByRole('radio', { name: '3' });
    fireEvent.click(cardio3);

    const linearBtn = screen.getByRole('radio', { name: 'linear' });
    fireEvent.click(linearBtn);
    expect(linearBtn).toHaveAttribute('aria-checked', 'true');

    const cycleSection = screen.getByTestId('field-cycle-weeks');
    const cycle12 = within(cycleSection).getByRole('radio', { name: '12' });
    fireEvent.click(cycle12);
    expect(cycle12).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu/ }));

    const profile = useFitnessStore.getState().trainingProfile;
    expect(profile?.cardioSessionsWeek).toBe(3);
    expect(profile?.periodizationModel).toBe('linear');
    expect(profile?.planCycleWeeks).toBe(12);
  });

  it('submit with priority muscles override uses selected muscles', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Trung cấp' }));
    fireEvent.click(screen.getByText(/Tùy chỉnh thêm/));

    fireEvent.click(screen.getByRole('checkbox', { name: /^chest$/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /^legs$/ }));

    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu/ }));

    const profile = useFitnessStore.getState().trainingProfile;
    expect(profile?.priorityMuscles).toEqual(['chest', 'legs']);
  });

  it('ORM_LIFTS only contains valid exercise IDs', () => {
    const ORM_LIFT_EXERCISE_MAP: Record<string, string> = {
      squat: 'barbell-back-squat',
      bench: 'barbell-bench-press',
      deadlift: 'conventional-deadlift',
      ohp: 'overhead-press',
    };
    const ORM_LIFT_IDS = ['squat', 'bench', 'deadlift', 'ohp'];
    const exerciseIds = EXERCISES.map((e) => e.id);
    for (const liftId of ORM_LIFT_IDS) {
      expect(exerciseIds).toContain(ORM_LIFT_EXERCISE_MAP[liftId]);
    }
  });

  it('renders 1RM input fields for each valid ORM lift', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Nâng cao' }));
    fireEvent.click(screen.getByText(/Tùy chỉnh thêm/));

    const ormFieldset = screen.getByTestId('field-known-1rm');
    const ormInputs = within(ormFieldset).getAllByRole('spinbutton');
    expect(ormInputs).toHaveLength(4);

    expect(screen.getByLabelText('squat')).toBeInTheDocument();
    expect(screen.getByLabelText('bench')).toBeInTheDocument();
    expect(screen.getByLabelText('deadlift')).toBeInTheDocument();
    expect(screen.getByLabelText('ohp')).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  getSmartDefaults pure function tests                                */
/* ------------------------------------------------------------------ */
describe('getSmartDefaults', () => {
  it('beginner + hypertrophy + 3d returns correct defaults', () => {
    const result = getSmartDefaults('hypertrophy', 'beginner', 3);

    expect(result.trainingExperience).toBe('beginner');
    expect(result.trainingGoal).toBe('hypertrophy');
    expect(result.daysPerWeek).toBe(3);
    expect(result.sessionDurationMin).toBe(45);
    expect(result.availableEquipment).toEqual(['bodyweight', 'dumbbell']);
    expect(result.periodizationModel).toBe('linear');
    expect(result.planCycleWeeks).toBe(8);
    expect(result.cardioSessionsWeek).toBe(2);
    expect(result.cardioTypePref).toBe('liss');
    expect(result.cardioDurationMin).toBe(20);
    expect(result.priorityMuscles).toEqual(['chest', 'back', 'shoulders']);
  });

  it('intermediate + strength + 4d returns correct defaults', () => {
    const result = getSmartDefaults('strength', 'intermediate', 4);

    expect(result.trainingExperience).toBe('intermediate');
    expect(result.trainingGoal).toBe('strength');
    expect(result.daysPerWeek).toBe(4);
    expect(result.sessionDurationMin).toBe(60);
    expect(result.availableEquipment).toEqual(['barbell', 'dumbbell', 'machine']);
    expect(result.periodizationModel).toBe('undulating');
    expect(result.planCycleWeeks).toBe(8);
    expect(result.cardioSessionsWeek).toBe(1);
    expect(result.cardioTypePref).toBe('liss');
  });

  it('advanced + strength + 5d returns correct defaults', () => {
    const result = getSmartDefaults('strength', 'advanced', 5);

    expect(result.trainingExperience).toBe('advanced');
    expect(result.trainingGoal).toBe('strength');
    expect(result.daysPerWeek).toBe(5);
    expect(result.sessionDurationMin).toBe(90);
    expect(result.availableEquipment).toEqual([
      'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands',
    ]);
    expect(result.periodizationModel).toBe('block');
    expect(result.planCycleWeeks).toBe(12);
  });

  it('endurance goal sets high cardio with hiit', () => {
    const result = getSmartDefaults('endurance', 'intermediate', 5);

    expect(result.cardioSessionsWeek).toBe(4);
    expect(result.cardioTypePref).toBe('hiit');
    expect(result.cardioDurationMin).toBe(30);
    expect(result.priorityMuscles).toEqual(['legs', 'core']);
  });

  it('general goal returns mixed cardio defaults', () => {
    const result = getSmartDefaults('general', 'beginner', 3);

    expect(result.cardioSessionsWeek).toBe(2);
    expect(result.cardioTypePref).toBe('mixed');
    expect(result.cardioDurationMin).toBe(25);
    expect(result.priorityMuscles).toEqual([]);
  });

  it('returns valid TrainingProfile shape for all goal/experience combos', () => {
    const goals: TrainingGoal[] = ['strength', 'hypertrophy', 'endurance', 'general'];
    const experiences: TrainingExperience[] = ['beginner', 'intermediate', 'advanced'];
    const daysList = [2, 3, 4, 5, 6];

    for (const goal of goals) {
      for (const exp of experiences) {
        for (const days of daysList) {
          const result = getSmartDefaults(goal, exp, days);

          expect(result.trainingExperience).toBe(exp);
          expect(result.trainingGoal).toBe(goal);
          expect(result.daysPerWeek).toBe(days);
          expect(result.sessionDurationMin).toBeGreaterThan(0);
          expect(result.availableEquipment.length).toBeGreaterThan(0);
          expect(Array.isArray(result.injuryRestrictions)).toBe(true);
          expect(['linear', 'undulating', 'block']).toContain(result.periodizationModel);
          expect(result.planCycleWeeks).toBeGreaterThan(0);
          expect(result.cardioSessionsWeek).toBeGreaterThanOrEqual(0);
          expect(['liss', 'hiit', 'mixed']).toContain(result.cardioTypePref);
          expect(result.cardioDurationMin).toBeGreaterThan(0);
        }
      }
    }
  });
});
