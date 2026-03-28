import { render, screen, fireEvent, within, act } from '@testing-library/react';
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

async function clickNext() {
  await act(async () => {
    fireEvent.click(screen.getByTestId('next-button'));
  });
}

async function advanceSteps(count: number) {
  for (let i = 0; i < count; i++) {
    await clickNext();
  }
}

async function navigateToLastStep() {
  let nextBtn = screen.queryByTestId('next-button');
  while (nextBtn) {
    await act(async () => {
      fireEvent.click(nextBtn!);
    });
    nextBtn = screen.queryByTestId('next-button');
  }
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
/*  Step indices (for reference)                                        */
/*  Beginner:     core(0) sessionDuration(1) equipment(2) injuries(3)  */
/*                cardio(4) known1rm(5)                                 */
/*  Intermediate: core(0) sessionDuration(1) equipment(2) injuries(3)  */
/*                cardio(4) periodization(5) cycleWeeks(6) priority(7)  */
/*                known1rm(8)                                           */
/*  Advanced:     core(0) sessionDuration(1) equipment(2) injuries(3)  */
/*                cardio(4) periodization(5) cycleWeeks(6) priority(7)  */
/*                known1rm(8) sleepHours(9)                             */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */
describe('FitnessOnboarding', () => {
  beforeEach(() => {
    resetStore();
  });

  /* ---- Wizard navigation ---- */

  it('hides back button on step 1', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    expect(screen.queryByTestId('onboarding-back')).not.toBeInTheDocument();
  });

  it('shows back button on step 2+', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    await clickNext();
    expect(screen.getByTestId('onboarding-back')).toBeInTheDocument();
  });

  it('shows step counter with correct format', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    // Beginner has 6 steps
    expect(screen.getByTestId('step-counter')).toHaveTextContent('1/6');

    await clickNext();
    expect(screen.getByTestId('step-counter')).toHaveTextContent('2/6');
  });

  it('step counter updates when experience changes total steps', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    // Default beginner: 6 steps
    expect(screen.getByTestId('step-counter')).toHaveTextContent('1/6');

    // Switch to intermediate: 9 steps
    fireEvent.click(screen.getByRole('radio', { name: 'Trung cấp' }));
    expect(screen.getByTestId('step-counter')).toHaveTextContent('1/9');

    // Switch to advanced: 10 steps
    fireEvent.click(screen.getByRole('radio', { name: 'Nâng cao' }));
    expect(screen.getByTestId('step-counter')).toHaveTextContent('1/10');
  });

  it('back button navigates to previous step', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    await clickNext(); // step 1: sessionDuration
    expect(screen.getByTestId('step-counter')).toHaveTextContent('2/6');

    fireEvent.click(screen.getByTestId('onboarding-back'));
    expect(screen.getByTestId('step-counter')).toHaveTextContent('1/6');
    expect(screen.queryByTestId('onboarding-back')).not.toBeInTheDocument();
  });

  it('preserves entered data when going back', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    // Step 0: select strength goal and 5 days
    fireEvent.click(screen.getByRole('radio', { name: 'Sức mạnh' }));
    fireEvent.click(screen.getByRole('radio', { name: '5' }));

    // Advance to step 1 (sessionDuration), select 90
    await clickNext();
    fireEvent.click(screen.getByRole('radio', { name: '90' }));

    // Go back to step 0
    fireEvent.click(screen.getByTestId('onboarding-back'));

    // Verify core data preserved
    expect(screen.getByRole('radio', { name: 'Sức mạnh' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '5' })).toHaveAttribute('aria-checked', 'true');

    // Go forward again — session duration should still be 90
    await clickNext();
    expect(screen.getByRole('radio', { name: '90' })).toHaveAttribute('aria-checked', 'true');
  });

  it('progress bar width increases as steps advance', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    const progressBar = screen.getByTestId('step-progress-bar');

    // Step 0 of 6: width ~16.67%
    const initialWidth = progressBar.style.width;
    await clickNext();

    // Step 1 of 6: width ~33.33%
    const secondWidth = progressBar.style.width;
    expect(parseFloat(secondWidth)).toBeGreaterThan(parseFloat(initialWidth));
  });

  /* ---- Core step rendering ---- */

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

  it('shows Next button on non-final steps', () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    expect(screen.getByTestId('next-button')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bắt đầu/ })).not.toBeInTheDocument();
  });

  it('shows Submit button on final step', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    await navigateToLastStep();

    expect(screen.queryByTestId('next-button')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bắt đầu/ })).toBeInTheDocument();
  });

  /* ---- Beginner step fields ---- */

  it('beginner shows session duration on step 2', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    await advanceSteps(1); // → sessionDuration
    expect(screen.getByTestId('field-session-duration')).toBeInTheDocument();
  });

  it('beginner shows equipment on step 3', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    await advanceSteps(2); // → equipment
    expect(screen.getByTestId('field-equipment')).toBeInTheDocument();
  });

  it('beginner shows injuries on step 4', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    await advanceSteps(3); // → injuries
    expect(screen.getByTestId('field-injuries')).toBeInTheDocument();
  });

  it('beginner shows cardio on step 5', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    await advanceSteps(4); // → cardioSessions
    expect(screen.getByTestId('field-cardio-sessions')).toBeInTheDocument();
  });

  it('beginner shows known 1RM on last step', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    await advanceSteps(5); // → known1rm (last step for beginner)
    expect(screen.getByTestId('field-known-1rm')).toBeInTheDocument();
    expect(screen.getByTestId('orm-toggle')).toBeInTheDocument();
    expect(screen.queryByTestId('orm-inputs')).not.toBeInTheDocument();
  });

  it('beginner does not have periodization, cycle weeks, or priority muscles steps', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    // Navigate through all beginner steps and collect visible testids
    const seenTestIds: string[] = [];
    for (let i = 0; i < 6; i++) {
      if (screen.queryByTestId('field-periodization')) seenTestIds.push('periodization');
      if (screen.queryByTestId('field-cycle-weeks')) seenTestIds.push('cycle-weeks');
      if (screen.queryByTestId('field-priority-muscles')) seenTestIds.push('priority-muscles');
      if (screen.queryByTestId('next-button')) await clickNext();
    }

    expect(seenTestIds).toEqual([]);
  });

  /* ---- Intermediate step fields ---- */

  it('intermediate shows periodization, cycle weeks, and priority muscles', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Trung cấp' }));

    await advanceSteps(5); // → periodization
    expect(screen.getByTestId('field-periodization')).toBeInTheDocument();

    await clickNext(); // → cycleWeeks
    expect(screen.getByTestId('field-cycle-weeks')).toBeInTheDocument();

    await clickNext(); // → priorityMuscles
    expect(screen.getByTestId('field-priority-muscles')).toBeInTheDocument();

    await clickNext(); // → known1rm (last for intermediate)
    expect(screen.getByTestId('field-known-1rm')).toBeInTheDocument();
    expect(screen.getByTestId('orm-toggle')).toBeInTheDocument();
    expect(screen.queryByTestId('orm-inputs')).not.toBeInTheDocument();
  });

  /* ---- Advanced step fields ---- */

  it('advanced shows all fields with 1RM auto-enabled and sleep hours', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Nâng cao' }));

    await advanceSteps(8); // → known1rm
    expect(screen.getByTestId('field-known-1rm')).toBeInTheDocument();
    expect(screen.getByTestId('orm-inputs')).toBeInTheDocument();

    await clickNext(); // → sleepHours (last for advanced)
    expect(screen.getByTestId('field-avg-sleep')).toBeInTheDocument();
  });

  /* ---- Multi-select and field interactions ---- */

  it('equipment multi-select toggles on/off', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    await advanceSteps(2); // → equipment

    const barbellBtn = screen.getByRole('checkbox', { name: /Thanh tạ/ });
    expect(barbellBtn).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(barbellBtn);
    expect(barbellBtn).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(barbellBtn);
    expect(barbellBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('injury multi-select toggles on/off', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    await advanceSteps(3); // → injuries

    const shouldersBtn = screen.getByRole('checkbox', { name: /Vai/ });
    expect(shouldersBtn).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(shouldersBtn);
    expect(shouldersBtn).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(shouldersBtn);
    expect(shouldersBtn).toHaveAttribute('aria-checked', 'false');
  });

  it('priority muscles limited to 3', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Trung cấp' }));
    await advanceSteps(7); // → priorityMuscles

    const chestBtn = screen.getByRole('checkbox', { name: /^Ngực$/ });
    const backBtn = screen.getByRole('checkbox', { name: /^Lưng$/ });
    const legsBtn = screen.getByRole('checkbox', { name: /^Chân$/ });
    const armsBtn = screen.getByRole('checkbox', { name: /^Tay$/ });

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

  it('cardio, periodization, and cycle weeks pills are interactive', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Trung cấp' }));

    await advanceSteps(4); // → cardioSessions
    const cardioSection = screen.getByTestId('field-cardio-sessions');
    const cardio3 = within(cardioSection).getByRole('radio', { name: '3' });
    fireEvent.click(cardio3);

    await clickNext(); // → periodization
    const linearBtn = screen.getByRole('radio', { name: 'Tuyến tính' });
    fireEvent.click(linearBtn);
    expect(linearBtn).toHaveAttribute('aria-checked', 'true');

    await clickNext(); // → cycleWeeks
    const cycleSection = screen.getByTestId('field-cycle-weeks');
    const cycle12 = within(cycleSection).getByRole('radio', { name: '12' });
    fireEvent.click(cycle12);
    expect(cycle12).toHaveAttribute('aria-checked', 'true');

    // Navigate to last step and submit
    await navigateToLastStep();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Bắt đầu/ }));
    });

    const profile = useFitnessStore.getState().trainingProfile;
    expect(profile?.cardioSessionsWeek).toBe(3);
    expect(profile?.periodizationModel).toBe('linear');
    expect(profile?.planCycleWeeks).toBe(12);
  });

  /* ---- Submit behavior ---- */

  it('clicking "Bắt đầu →" calls onComplete and store actions', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    await navigateToLastStep();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Bắt đầu/ }));
    });

    expect(onComplete).toHaveBeenCalledTimes(1);

    const state = useFitnessStore.getState();
    expect(state.isOnboarded).toBe(true);
    expect(state.trainingProfile).not.toBeNull();
    expect(state.trainingProfile?.id).toBe('test-uuid-1234');
    expect(state.trainingProfile?.trainingGoal).toBe('hypertrophy');
    expect(state.trainingProfile?.trainingExperience).toBe('beginner');
    expect(state.trainingProfile?.daysPerWeek).toBe(3);
  });

  it('submit merges user overrides with smart defaults', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    // Step 0: core
    fireEvent.click(screen.getByRole('radio', { name: 'Sức mạnh' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Nâng cao' }));
    fireEvent.click(screen.getByRole('radio', { name: '5' }));

    await clickNext(); // → sessionDuration
    fireEvent.click(screen.getByRole('radio', { name: '90' }));

    await clickNext(); // → equipment
    fireEvent.click(screen.getByRole('checkbox', { name: /Thanh tạ/ }));

    await clickNext(); // → injuries
    fireEvent.click(screen.getByRole('checkbox', { name: /Đầu gối/ }));

    await advanceSteps(4); // → cardio → periodization → cycleWeeks → priorityMuscles
    await clickNext(); // → known1rm

    const squatInput = screen.getByLabelText('squat');
    fireEvent.change(squatInput, { target: { value: '140' } });

    const benchInput = screen.getByLabelText('bench');
    fireEvent.change(benchInput, { target: { value: '' } });

    const deadliftInput = screen.getByLabelText('deadlift');
    fireEvent.change(deadliftInput, { target: { value: '0' } });

    await clickNext(); // → sleepHours
    const sleepInput = screen.getByLabelText('Giờ ngủ trung bình');
    fireEvent.change(sleepInput, { target: { value: '7.5' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Bắt đầu/ }));
    });

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

  it('submit with priority muscles override uses selected muscles', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Trung cấp' }));

    await advanceSteps(7); // → priorityMuscles

    fireEvent.click(screen.getByRole('checkbox', { name: /^Ngực$/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /^Chân$/ }));

    await navigateToLastStep();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Bắt đầu/ }));
    });

    const profile = useFitnessStore.getState().trainingProfile;
    expect(profile?.priorityMuscles).toEqual(['chest', 'legs']);
  });

  /* ---- 1RM tests ---- */

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

  it('renders 1RM input fields for each valid ORM lift', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Nâng cao' }));
    await advanceSteps(8); // → known1rm

    const ormFieldset = screen.getByTestId('field-known-1rm');
    const ormInputs = within(ormFieldset).getAllByRole('spinbutton');
    expect(ormInputs).toHaveLength(4);

    expect(screen.getByLabelText('squat')).toBeInTheDocument();
    expect(screen.getByLabelText('bench')).toBeInTheDocument();
    expect(screen.getByLabelText('deadlift')).toBeInTheDocument();
    expect(screen.getByLabelText('ohp')).toBeInTheDocument();
  });

  it('shows 1RM toggle for intermediate users', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Trung cấp' }));
    await advanceSteps(8); // → known1rm

    expect(screen.getByTestId('orm-toggle')).toBeInTheDocument();
  });

  it('1RM fields hidden until toggle enabled', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    await advanceSteps(5); // → known1rm (beginner: step 5)

    expect(screen.queryByTestId('orm-inputs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('orm-squat')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('orm-toggle'));

    expect(screen.getByTestId('orm-inputs')).toBeInTheDocument();
    expect(screen.getByTestId('orm-squat')).toBeInTheDocument();
    expect(screen.getByTestId('orm-bench')).toBeInTheDocument();
    expect(screen.getByTestId('orm-deadlift')).toBeInTheDocument();
    expect(screen.getByTestId('orm-ohp')).toBeInTheDocument();
  });

  it('auto-enables 1RM for advanced users', async () => {
    const onComplete = vitest.fn();
    render(<FitnessOnboarding onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Nâng cao' }));
    await advanceSteps(8); // → known1rm

    expect(screen.getByTestId('orm-toggle')).toBeChecked();
    expect(screen.getByTestId('orm-squat')).toBeInTheDocument();
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
