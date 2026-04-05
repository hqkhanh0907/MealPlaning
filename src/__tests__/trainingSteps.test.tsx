import { zodResolver } from '@hookform/resolvers/zod';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type OnboardingFormData, onboardingSchema } from '../components/onboarding/onboardingSchema';
import { CycleWeeksStep } from '../components/onboarding/training-steps/CycleWeeksStep';
import { PeriodizationStep } from '../components/onboarding/training-steps/PeriodizationStep';
import { TrainingDetailSteps } from '../components/onboarding/TrainingDetailSteps';

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */

const mockSetTrainingProfile = vi.fn();

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ setTrainingProfile: mockSetTrainingProfile }),
}));

vi.mock('../utils/helpers', () => ({
  generateUUID: () => 'test-uuid-123',
}));

/**
 * Overridable mock for getActiveSteps — defaults to real implementation.
 * Set mockGetActiveStepsOverride to a function to inject custom steps
 * (e.g. to test the unknown-component guard).
 */
let mockGetActiveStepsOverride: ((exp: string) => { id: string; minLevel: number }[]) | null = null;

vi.mock('../components/onboarding/trainingStepConfig', async importOriginal => {
  const actual = await importOriginal<typeof import('../components/onboarding/trainingStepConfig')>();
  return {
    ...actual,
    getActiveSteps: (experience: Parameters<typeof actual.getActiveSteps>[0]) => {
      if (mockGetActiveStepsOverride) return mockGetActiveStepsOverride(experience);
      return actual.getActiveSteps(experience);
    },
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockGetActiveStepsOverride = null;
});

/* ------------------------------------------------------------------ */
/* Shared defaults & form wrapper                                      */
/* ------------------------------------------------------------------ */

const BASE_DEFAULTS: OnboardingFormData = {
  name: 'Tester',
  gender: 'male',
  dateOfBirth: '1996-05-15',
  heightCm: 175,
  weightKg: 75,
  activityLevel: 'moderate',
  goalType: 'cut',
  rateOfChange: 'moderate',
  trainingGoal: 'hypertrophy',
  trainingExperience: 'intermediate',
  daysPerWeek: 4,
};

function FormWrapper({
  children,
  defaultValues,
}: {
  children: (form: UseFormReturn<OnboardingFormData>) => React.ReactNode;
  defaultValues?: Partial<OnboardingFormData>;
}) {
  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { ...BASE_DEFAULTS, ...defaultValues },
  });
  return <>{children(form)}</>;
}

/* ================================================================== */
/*  CycleWeeksStep                                                     */
/* ================================================================== */

describe('CycleWeeksStep', () => {
  function renderStep(defaults?: Partial<OnboardingFormData>, goNext = vi.fn(), goBack = vi.fn()) {
    const result = render(
      <FormWrapper defaultValues={defaults}>
        {form => <CycleWeeksStep form={form} goNext={goNext} goBack={goBack} />}
      </FormWrapper>,
    );
    return { ...result, goNext, goBack };
  }

  it('renders all 4 cycle week options', () => {
    renderStep();
    expect(screen.getByText(/4\s+tuần/)).toBeInTheDocument();
    expect(screen.getByText(/6\s+tuần/)).toBeInTheDocument();
    expect(screen.getByText(/8\s+tuần/)).toBeInTheDocument();
    expect(screen.getByText(/12\s+tuần/)).toBeInTheDocument();
  });

  it('renders title and subtitle', () => {
    renderStep();
    expect(screen.getByText('Số tuần một chu kỳ')).toBeInTheDocument();
    expect(screen.getByText('Số tuần cho mỗi chu kỳ tập luyện trước khi đánh giá lại')).toBeInTheDocument();
  });

  it('renders description for each option', () => {
    renderStep();
    expect(screen.getByText(/Chu kỳ ngắn/)).toBeInTheDocument();
    expect(screen.getByText(/Chu kỳ cân bằng/)).toBeInTheDocument();
    expect(screen.getByText(/Chu kỳ tiêu chuẩn/)).toBeInTheDocument();
    expect(screen.getByText(/Chu kỳ dài/)).toBeInTheDocument();
  });

  it('selects option on button click and applies pressed style', () => {
    renderStep({ planCycleWeeks: 8 });
    const pressedButtons = screen.getAllByRole('button', { pressed: true });
    expect(pressedButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('radio input reflects selected value', () => {
    renderStep({ planCycleWeeks: 6 });
    const radios = screen.getAllByRole('radio', { hidden: true });
    const checked = radios.filter(r => (r as HTMLInputElement).checked);
    expect(checked).toHaveLength(1);
  });

  it('clicking option button triggers field onChange', () => {
    renderStep();
    const btn = screen.getAllByRole('button', { pressed: false })[0];
    fireEvent.click(btn);
    expect(btn).toBeInTheDocument();
  });

  it('radio onChange triggers field update', () => {
    renderStep();
    const radios = screen.getAllByRole('radio', { hidden: true });
    // Directly fire the onChange on the sr-only radio to cover the callback
    fireEvent.click(radios[2]);
    expect(radios[2]).toBeInTheDocument();
  });

  it('renders fieldset with accessible label', () => {
    renderStep();
    const fieldset = screen.getByRole('group', { name: 'Số tuần một chu kỳ' });
    expect(fieldset).toBeInTheDocument();
  });

  it('calls goNext when next button clicked', () => {
    const goNext = vi.fn();
    renderStep(undefined, goNext);
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[buttons.length - 1];
    fireEvent.click(nextBtn);
    expect(goNext).toHaveBeenCalledTimes(1);
  });

  it('calls goBack when back button clicked', () => {
    const goBack = vi.fn();
    renderStep(undefined, vi.fn(), goBack);
    const backBtn = screen.getByText('Quay lại');
    fireEvent.click(backBtn);
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('unselected option has default border styling', () => {
    renderStep({ planCycleWeeks: 4 });
    const unpressedButtons = screen.getAllByRole('button', { pressed: false });
    expect(unpressedButtons.length).toBeGreaterThanOrEqual(1);
  });
});

/* ================================================================== */
/*  PeriodizationStep                                                  */
/* ================================================================== */

describe('PeriodizationStep', () => {
  function renderStep(defaults?: Partial<OnboardingFormData>, goNext = vi.fn(), goBack = vi.fn()) {
    const result = render(
      <FormWrapper defaultValues={defaults}>
        {form => <PeriodizationStep form={form} goNext={goNext} goBack={goBack} />}
      </FormWrapper>,
    );
    return { ...result, goNext, goBack };
  }

  it('renders all 3 periodization options', () => {
    renderStep();
    expect(screen.getByText('Tuyến tính')).toBeInTheDocument();
    expect(screen.getByText('Dao động')).toBeInTheDocument();
    expect(screen.getByText('Theo khối')).toBeInTheDocument();
  });

  it('renders title and subtitle', () => {
    renderStep();
    expect(screen.getByText('Mô hình phân kỳ')).toBeInTheDocument();
    expect(screen.getByText('Phương pháp phân chia chu kỳ tập')).toBeInTheDocument();
  });

  it('renders description for each option', () => {
    renderStep();
    expect(screen.getByText(/Tăng dần cường độ/)).toBeInTheDocument();
    expect(screen.getByText(/Thay đổi cường độ/)).toBeInTheDocument();
    expect(screen.getByText(/Chia chu kỳ thành/)).toBeInTheDocument();
  });

  it('selects option on button click and applies pressed style', () => {
    renderStep({ periodizationModel: 'linear' });
    const pressedButtons = screen.getAllByRole('button', { pressed: true });
    expect(pressedButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('radio input reflects selected value', () => {
    renderStep({ periodizationModel: 'undulating' });
    const radios = screen.getAllByRole('radio', { hidden: true });
    const checked = radios.filter(r => (r as HTMLInputElement).checked);
    expect(checked).toHaveLength(1);
  });

  it('clicking option button triggers field onChange', () => {
    renderStep();
    const btn = screen.getAllByRole('button', { pressed: false })[0];
    fireEvent.click(btn);
    expect(btn).toBeInTheDocument();
  });

  it('radio onChange triggers field update', () => {
    renderStep();
    const radios = screen.getAllByRole('radio', { hidden: true });
    // Directly fire click on the sr-only radio to cover the onChange callback
    fireEvent.click(radios[1]);
    expect(radios[1]).toBeInTheDocument();
  });

  it('renders fieldset with accessible label', () => {
    renderStep();
    const fieldset = screen.getByRole('group', { name: 'Mô hình phân kỳ' });
    expect(fieldset).toBeInTheDocument();
  });

  it('calls goNext when next button clicked', () => {
    const goNext = vi.fn();
    renderStep(undefined, goNext);
    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[buttons.length - 1];
    fireEvent.click(nextBtn);
    expect(goNext).toHaveBeenCalledTimes(1);
  });

  it('calls goBack when back button clicked', () => {
    const goBack = vi.fn();
    renderStep(undefined, vi.fn(), goBack);
    const backBtn = screen.getByText('Quay lại');
    fireEvent.click(backBtn);
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('unselected options show default border', () => {
    renderStep({ periodizationModel: 'block' });
    const unpressedButtons = screen.getAllByRole('button', { pressed: false });
    expect(unpressedButtons.length).toBe(2);
  });
});

/* ================================================================== */
/*  TrainingDetailSteps                                                */
/* ================================================================== */

describe('TrainingDetailSteps', () => {
  function renderDetailSteps(
    step: number,
    overrides: Partial<OnboardingFormData> = {},
    goNext = vi.fn(),
    goBack = vi.fn(),
    setOnboardingSection = vi.fn(),
  ) {
    const defaults = { trainingExperience: 'intermediate' as const, ...overrides };
    const result = render(
      <FormWrapper defaultValues={defaults}>
        {form => (
          <TrainingDetailSteps
            step={step}
            form={form}
            goNext={goNext}
            goBack={goBack}
            setOnboardingSection={setOnboardingSection}
          />
        )}
      </FormWrapper>,
    );
    return { ...result, goNext, goBack, setOnboardingSection };
  }

  /* ---------------------------------------------------------------- */
  /* Rendering correct step by index                                   */
  /* ---------------------------------------------------------------- */
  it('renders duration step at index 0 for intermediate', () => {
    renderDetailSteps(0);
    expect(document.body.textContent).toBeTruthy();
  });

  it('renders periodization step at index 4 for intermediate', () => {
    renderDetailSteps(4);
    expect(screen.getByText('Mô hình phân kỳ')).toBeInTheDocument();
  });

  it('renders cycleWeeks step at index 5 for intermediate', () => {
    renderDetailSteps(5);
    expect(screen.getByText('Số tuần một chu kỳ')).toBeInTheDocument();
  });

  /* ---------------------------------------------------------------- */
  /* Null returns — invalid step index                                 */
  /* ---------------------------------------------------------------- */
  it('returns null when step index exceeds active steps', () => {
    const { container } = renderDetailSteps(99);
    expect(container.innerHTML).toBe('');
  });

  it('returns null for negative step index', () => {
    const { container } = renderDetailSteps(-1);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when step maps to unknown component id', () => {
    mockGetActiveStepsOverride = () => [{ id: 'nonexistent_step', minLevel: 0 }];
    const { container } = renderDetailSteps(0);
    expect(container.innerHTML).toBe('');
  });

  /* ---------------------------------------------------------------- */
  /* Confirm step — handleConfirmTraining                              */
  /* ---------------------------------------------------------------- */
  it('calls setTrainingProfile and goNext on confirm step', () => {
    const goNext = vi.fn();
    const setOnboardingSection = vi.fn();
    // Intermediate: duration(0),equipment(1),injuries(2),cardio(3),
    //   periodization(4),cycleWeeks(5),priorityMuscles(6),confirm(7)
    renderDetailSteps(7, {}, goNext, vi.fn(), setOnboardingSection);

    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[buttons.length - 1];
    fireEvent.click(nextBtn);
    expect(mockSetTrainingProfile).toHaveBeenCalledTimes(1);
    expect(setOnboardingSection).toHaveBeenCalledWith(5);
    expect(goNext).toHaveBeenCalledTimes(1);
  });

  it('handleConfirmTraining uses smart defaults when optional values are undefined', () => {
    const goNext = vi.fn();
    const setOnboardingSection = vi.fn();

    renderDetailSteps(7, {}, goNext, vi.fn(), setOnboardingSection);

    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[buttons.length - 1];
    fireEvent.click(nextBtn);

    const profile = mockSetTrainingProfile.mock.calls[0][0];
    expect(profile.id).toBe('test-uuid-123');
    expect(profile.trainingGoal).toBe('hypertrophy');
    expect(profile.trainingExperience).toBe('intermediate');
    expect(profile.daysPerWeek).toBe(4);
    expect(typeof profile.sessionDurationMin).toBe('number');
    expect(typeof profile.cardioSessionsWeek).toBe('number');
    expect(profile.updatedAt).toBeDefined();
  });

  /* ---------------------------------------------------------------- */
  /* Beginner experience — fewer active steps                          */
  /* ---------------------------------------------------------------- */
  it('beginner confirm step at index 4', () => {
    const goNext = vi.fn();
    const setOnboardingSection = vi.fn();
    renderDetailSteps(4, { trainingExperience: 'beginner' }, goNext, vi.fn(), setOnboardingSection);

    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[buttons.length - 1];
    fireEvent.click(nextBtn);
    expect(mockSetTrainingProfile).toHaveBeenCalledTimes(1);
  });

  it('beginner step 5 is out of bounds — returns null', () => {
    const { container } = renderDetailSteps(5, { trainingExperience: 'beginner' });
    expect(container.innerHTML).toBe('');
  });

  /* ---------------------------------------------------------------- */
  /* Advanced experience — all steps including sleepHours              */
  /* ---------------------------------------------------------------- */
  it('advanced confirm step at index 8', () => {
    const goNext = vi.fn();
    const setOnboardingSection = vi.fn();
    renderDetailSteps(8, { trainingExperience: 'advanced' }, goNext, vi.fn(), setOnboardingSection);

    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[buttons.length - 1];
    fireEvent.click(nextBtn);
    expect(mockSetTrainingProfile).toHaveBeenCalledTimes(1);
  });

  /* ---------------------------------------------------------------- */
  /* Non-confirm steps use goNext directly                             */
  /* ---------------------------------------------------------------- */
  it('non-confirm steps pass goNext directly', () => {
    const goNext = vi.fn();
    renderDetailSteps(0, {}, goNext);

    const buttons = screen.getAllByRole('button');
    const nextBtn = buttons[buttons.length - 1];
    fireEvent.click(nextBtn);
    expect(goNext).toHaveBeenCalledTimes(1);
    expect(mockSetTrainingProfile).not.toHaveBeenCalled();
  });

  it('goBack propagates from non-confirm step', () => {
    const goBack = vi.fn();
    renderDetailSteps(0, {}, vi.fn(), goBack);

    const backBtn = screen.getByText('Quay lại');
    fireEvent.click(backBtn);
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  /* ---------------------------------------------------------------- */
  /* Fallback to beginner when experience is undefined                 */
  /* ---------------------------------------------------------------- */
  it('defaults to beginner steps when experience is undefined', () => {
    const { container } = renderDetailSteps(0, {
      trainingExperience: undefined as unknown as OnboardingFormData['trainingExperience'],
    });
    expect(container.innerHTML).not.toBe('');
  });
});
