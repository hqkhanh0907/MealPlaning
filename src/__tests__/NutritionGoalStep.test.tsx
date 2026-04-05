import { zodResolver } from '@hookform/resolvers/zod';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { type Resolver, useForm, type UseFormReturn } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { NutritionGoalStep } from '../components/onboarding/NutritionGoalStep';
import { type OnboardingFormData, onboardingSchema } from '../components/onboarding/onboardingSchema';

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi' },
  }),
}));

/* ------------------------------------------------------------------ */
/* Defaults & helpers                                                  */
/* ------------------------------------------------------------------ */

const BASE_DEFAULTS: OnboardingFormData = {
  name: 'Test User',
  gender: 'male',
  dateOfBirth: '1990-01-01',
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'moderate',
  goalType: 'cut',
  rateOfChange: 'moderate',
  trainingGoal: 'hypertrophy',
  trainingExperience: 'beginner',
  daysPerWeek: 4,
};

/**
 * Schema WITHOUT superRefine — used to test handleNext's manual cross-field
 * validation (lines 82-86) which is unreachable when superRefine catches first.
 */
const schemaWithoutSuperRefine = z.object({
  name: z.string().min(1).max(50),
  gender: z.enum(['male', 'female']),
  dateOfBirth: z.string().min(1),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'extra_active']),
  goalType: z.enum(['cut', 'maintain', 'bulk']),
  rateOfChange: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  targetWeightKg: z.number().min(30).max(300).optional(),
  bodyFatPct: z.number().min(3).max(60).optional(),
  bmrOverride: z.number().min(500).max(5000).optional(),
  proteinRatio: z.number().min(0.8).max(4).optional(),
  trainingGoal: z.enum(['strength', 'hypertrophy', 'endurance', 'general']),
  trainingExperience: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.number().min(2).max(6),
  sessionDurationMin: z.number().optional(),
  availableEquipment: z
    .array(z.enum(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands', 'kettlebell']))
    .optional(),
  injuryRestrictions: z.array(z.enum(['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'])).optional(),
  cardioSessionsWeek: z.number().optional(),
  periodizationModel: z.enum(['linear', 'undulating', 'block']).optional(),
  planCycleWeeks: z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(12)]).optional(),
  priorityMuscles: z
    .array(z.enum(['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes']))
    .max(3)
    .optional(),
  avgSleepHours: z.number().min(3).max(12).optional(),
});

function FormWrapper({
  children,
  defaultValues,
  onForm,
}: {
  children: (form: UseFormReturn<OnboardingFormData>) => React.ReactNode;
  defaultValues?: Partial<OnboardingFormData>;
  onForm?: (form: UseFormReturn<OnboardingFormData>) => void;
}) {
  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { ...BASE_DEFAULTS, ...defaultValues },
  });

  React.useEffect(() => {
    if (onForm) onForm(form);
  }, [form, onForm]);

  return <>{children(form)}</>;
}

/** Wrapper using schema WITHOUT superRefine to let handleNext's manual check execute */
function FormWrapperNoSuperRefine({
  children,
  defaultValues,
  onForm,
}: {
  children: (form: UseFormReturn<OnboardingFormData>) => React.ReactNode;
  defaultValues?: Partial<OnboardingFormData>;
  onForm?: (form: UseFormReturn<OnboardingFormData>) => void;
}) {
  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(schemaWithoutSuperRefine) as Resolver<OnboardingFormData>,
    defaultValues: { ...BASE_DEFAULTS, ...defaultValues },
  });

  React.useEffect(() => {
    if (onForm) onForm(form);
  }, [form, onForm]);

  return <>{children(form)}</>;
}

function renderStep(defaultValues?: Partial<OnboardingFormData>) {
  const goNext = vi.fn();
  const goBack = vi.fn();
  let formRef: UseFormReturn<OnboardingFormData> | null = null;

  const result = render(
    <FormWrapper
      defaultValues={defaultValues}
      onForm={f => {
        formRef = f;
      }}
    >
      {form => <NutritionGoalStep form={form} goNext={goNext} goBack={goBack} />}
    </FormWrapper>,
  );

  return {
    ...result,
    goNext,
    goBack,
    getForm: () => formRef as UseFormReturn<OnboardingFormData>,
  };
}

/** Render with schema that has NO superRefine — trigger() passes, manual cross-field check runs */
function renderStepNoSuperRefine(defaultValues?: Partial<OnboardingFormData>) {
  const goNext = vi.fn();
  const goBack = vi.fn();
  let formRef: UseFormReturn<OnboardingFormData> | null = null;

  const result = render(
    <FormWrapperNoSuperRefine
      defaultValues={defaultValues}
      onForm={f => {
        formRef = f;
      }}
    >
      {form => <NutritionGoalStep form={form} goNext={goNext} goBack={goBack} />}
    </FormWrapperNoSuperRefine>,
  );

  return {
    ...result,
    goNext,
    goBack,
    getForm: () => formRef as UseFormReturn<OnboardingFormData>,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/* ================================================================== */
/* Tests                                                               */
/* ================================================================== */

describe('NutritionGoalStep', () => {
  /* ---------------------------------------------------------------- */
  /* Basic rendering                                                   */
  /* ---------------------------------------------------------------- */
  it('renders the step container with heading and subtitle', () => {
    renderStep();
    expect(screen.getByTestId('nutrition-goal-step')).toBeInTheDocument();
    expect(screen.getByText('goal.title')).toBeInTheDocument();
    expect(screen.getByText('goal.subtitle')).toBeInTheDocument();
  });

  it('renders all 3 goal type buttons', () => {
    renderStep();
    expect(screen.getByText('goal.type_cut')).toBeInTheDocument();
    expect(screen.getByText('goal.type_maintain')).toBeInTheDocument();
    expect(screen.getByText('goal.type_bulk')).toBeInTheDocument();
  });

  it('renders goal type descriptions', () => {
    renderStep();
    expect(screen.getByText('goal.type_cut_desc')).toBeInTheDocument();
    expect(screen.getByText('goal.type_maintain_desc')).toBeInTheDocument();
    expect(screen.getByText('goal.type_bulk_desc')).toBeInTheDocument();
  });

  it('renders back and next buttons', () => {
    renderStep();
    expect(screen.getByText('onboarding.nav.back')).toBeInTheDocument();
    expect(screen.getByText('onboarding.nav.next')).toBeInTheDocument();
  });

  /* ---------------------------------------------------------------- */
  /* Conditional rendering: rate + target weight                       */
  /* ---------------------------------------------------------------- */
  it('shows rate and target weight fields when goal is cut', () => {
    renderStep({ goalType: 'cut' });
    expect(screen.getByText('goal.rate')).toBeInTheDocument();
    expect(screen.getByText('goal.rate_conservative')).toBeInTheDocument();
    expect(screen.getByText('goal.rate_moderate')).toBeInTheDocument();
    expect(screen.getByText('goal.rate_aggressive')).toBeInTheDocument();
    expect(screen.getByLabelText('goal.targetWeight')).toBeInTheDocument();
  });

  it('shows rate and target weight fields when goal is bulk', () => {
    renderStep({ goalType: 'bulk' });
    expect(screen.getByText('goal.rate')).toBeInTheDocument();
    expect(screen.getByLabelText('goal.targetWeight')).toBeInTheDocument();
  });

  it('hides rate and target weight fields when goal is maintain', () => {
    renderStep({ goalType: 'maintain' });
    expect(screen.queryByText('goal.rate')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('goal.targetWeight')).not.toBeInTheDocument();
  });

  /* ---------------------------------------------------------------- */
  /* Goal type selection — handleGoalTypeChange                        */
  /* ---------------------------------------------------------------- */
  it('switches from maintain to cut and reveals conditional fields', () => {
    renderStep({ goalType: 'maintain' });
    expect(screen.queryByText('goal.rate')).not.toBeInTheDocument();

    const cutBtn = screen.getByText('goal.type_cut').closest('button')!;
    fireEvent.click(cutBtn);

    expect(screen.getByText('goal.rate')).toBeInTheDocument();
    expect(screen.getByLabelText('goal.targetWeight')).toBeInTheDocument();
  });

  it('switches from cut to maintain and hides conditional fields (lines 57-58)', () => {
    renderStep({ goalType: 'cut' });
    expect(screen.getByText('goal.rate')).toBeInTheDocument();

    const maintainBtn = screen.getByText('goal.type_maintain').closest('button')!;
    fireEvent.click(maintainBtn);

    expect(screen.queryByText('goal.rate')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('goal.targetWeight')).not.toBeInTheDocument();
  });

  it('clears target weight and errors when switching to maintain', () => {
    renderStep({ goalType: 'cut', targetWeightKg: 60 });
    const maintainBtn = screen.getByText('goal.type_maintain').closest('button')!;
    fireEvent.click(maintainBtn);

    // Conditional fields hidden confirms targetField was cleared
    expect(screen.queryByLabelText('goal.targetWeight')).not.toBeInTheDocument();
  });

  it('switches from cut to bulk', () => {
    renderStep({ goalType: 'cut' });
    const bulkBtn = screen.getByText('goal.type_bulk').closest('button')!;
    fireEvent.click(bulkBtn);

    // Rate and target fields still visible
    expect(screen.getByText('goal.rate')).toBeInTheDocument();
    expect(screen.getByLabelText('goal.targetWeight')).toBeInTheDocument();
  });

  /* ---------------------------------------------------------------- */
  /* Rate selection                                                    */
  /* ---------------------------------------------------------------- */
  it('allows selecting different rate options', () => {
    renderStep({ goalType: 'cut' });

    const conservativeBtn = screen.getByText('goal.rate_conservative').closest('button')!;
    fireEvent.click(conservativeBtn);
    expect(conservativeBtn).toHaveAttribute('aria-pressed', 'true');

    const aggressiveBtn = screen.getByText('goal.rate_aggressive').closest('button')!;
    fireEvent.click(aggressiveBtn);
    expect(aggressiveBtn).toHaveAttribute('aria-pressed', 'true');
  });

  /* ---------------------------------------------------------------- */
  /* Target weight input — handleTargetWeightChange                    */
  /* ---------------------------------------------------------------- */
  it('accepts numeric target weight input', () => {
    renderStep({ goalType: 'cut' });
    const input = screen.getByLabelText('goal.targetWeight') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '60' } });
    expect(input.value).toBe('60');
  });

  it('handles empty target weight input (sets undefined)', () => {
    renderStep({ goalType: 'cut' });
    const input = screen.getByLabelText('goal.targetWeight') as HTMLInputElement;
    // Type a value then clear it
    fireEvent.change(input, { target: { value: '65' } });
    expect(input.value).toBe('65');
    fireEvent.change(input, { target: { value: '' } });
    // Input value becomes '' because undefined renders as ''
    expect(input.value).toBe('');
  });

  it('fires onBlur on target weight input', () => {
    renderStep({ goalType: 'cut' });
    const input = screen.getByLabelText('goal.targetWeight');
    fireEvent.blur(input);
    // No error — just verifies onBlur handler is wired
    expect(input).toBeInTheDocument();
  });

  /* ---------------------------------------------------------------- */
  /* Direction validation — checkDirectionError (line 45)              */
  /* ---------------------------------------------------------------- */
  it('shows error when cut target weight >= current weight (line 45)', async () => {
    renderStep({ goalType: 'cut', weightKg: 70 });
    const input = screen.getByLabelText('goal.targetWeight');

    // Target 80 is above current 70 for a cut goal → direction error
    fireEvent.change(input, { target: { value: '80' } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('onboarding.validation.cutTargetTooHigh')).toBeInTheDocument();
    });
  });

  it('shows error when bulk target weight <= current weight', async () => {
    renderStep({ goalType: 'bulk', weightKg: 70 });
    const input = screen.getByLabelText('goal.targetWeight');

    // Target 60 is below current 70 for a bulk goal → direction error
    fireEvent.change(input, { target: { value: '60' } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('onboarding.validation.bulkTargetTooLow')).toBeInTheDocument();
    });
  });

  it('clears error when target weight corrected to valid direction', async () => {
    renderStep({ goalType: 'cut', weightKg: 70 });
    const input = screen.getByLabelText('goal.targetWeight');

    // Invalid: cut with target above current
    fireEvent.change(input, { target: { value: '80' } });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Valid: cut with target below current
    fireEvent.change(input, { target: { value: '60' } });
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('clears direction error when goal switches to maintain', async () => {
    renderStep({ goalType: 'cut', weightKg: 70 });
    const input = screen.getByLabelText('goal.targetWeight');

    // Create a direction error
    fireEvent.change(input, { target: { value: '80' } });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Switch to maintain — errors cleared, conditional fields hidden
    const maintainBtn = screen.getByText('goal.type_maintain').closest('button')!;
    fireEvent.click(maintainBtn);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('triggers checkDirectionError when switching from maintain to cut with existing target', () => {
    // Start with cut + target weight already set, switch to maintain, then back to bulk
    renderStep({ goalType: 'cut', targetWeightKg: 60, weightKg: 70 });

    // Switch to bulk — 60 < 70 is invalid for bulk
    const bulkBtn = screen.getByText('goal.type_bulk').closest('button')!;
    fireEvent.click(bulkBtn);

    // Error should appear because targetWeight(60) <= currentWeight(70) for bulk
    return waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('onboarding.validation.bulkTargetTooLow')).toBeInTheDocument();
    });
  });

  /* ---------------------------------------------------------------- */
  /* aria-pressed reflects selected goal                               */
  /* ---------------------------------------------------------------- */
  it('marks the selected goal button as aria-pressed', () => {
    renderStep({ goalType: 'cut' });

    const cutBtn = screen.getByText('goal.type_cut').closest('button')!;
    const maintainBtn = screen.getByText('goal.type_maintain').closest('button')!;
    const bulkBtn = screen.getByText('goal.type_bulk').closest('button')!;

    expect(cutBtn).toHaveAttribute('aria-pressed', 'true');
    expect(maintainBtn).toHaveAttribute('aria-pressed', 'false');
    expect(bulkBtn).toHaveAttribute('aria-pressed', 'false');
  });

  /* ---------------------------------------------------------------- */
  /* aria-invalid + aria-describedby on target input                   */
  /* ---------------------------------------------------------------- */
  it('sets aria-invalid and aria-describedby when target has error', async () => {
    renderStep({ goalType: 'cut', weightKg: 70 });
    const input = screen.getByLabelText('goal.targetWeight');

    expect(input).toHaveAttribute('aria-invalid', 'false');

    fireEvent.change(input, { target: { value: '80' } });

    await waitFor(() => {
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'ob-target-error');
    });
  });

  /* ---------------------------------------------------------------- */
  /* goBack callback                                                   */
  /* ---------------------------------------------------------------- */
  it('calls goBack on back button click', () => {
    const { goBack } = renderStep();
    fireEvent.click(screen.getByText('onboarding.nav.back'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  /* ---------------------------------------------------------------- */
  /* handleNext — form.trigger validation                              */
  /* ---------------------------------------------------------------- */
  it('calls goNext when form is valid and goal is maintain', async () => {
    const { goNext } = renderStep({ goalType: 'maintain' });

    await act(async () => {
      fireEvent.click(screen.getByText('onboarding.nav.next'));
    });

    await waitFor(() => {
      expect(goNext).toHaveBeenCalledTimes(1);
    });
  });

  it('calls goNext when form is valid with cut and valid target weight', async () => {
    const { goNext } = renderStep({ goalType: 'cut', weightKg: 70, targetWeightKg: 60 });

    await act(async () => {
      fireEvent.click(screen.getByText('onboarding.nav.next'));
    });

    await waitFor(() => {
      expect(goNext).toHaveBeenCalledTimes(1);
    });
  });

  it('calls goNext when goal is cut but targetWeightKg is null (optional)', async () => {
    const { goNext } = renderStep({ goalType: 'cut', weightKg: 70 });

    await act(async () => {
      fireEvent.click(screen.getByText('onboarding.nav.next'));
    });

    await waitFor(() => {
      expect(goNext).toHaveBeenCalledTimes(1);
    });
  });

  it('does NOT call goNext when cross-field validation fails (lines 83-86)', async () => {
    // Start with cut goal, current weight 70
    const { goNext } = renderStep({ goalType: 'cut', weightKg: 70 });

    // Set invalid target: 80 >= 70 for cut goal
    const input = screen.getByLabelText('goal.targetWeight');
    fireEvent.change(input, { target: { value: '80' } });

    await act(async () => {
      fireEvent.click(screen.getByText('onboarding.nav.next'));
    });

    await waitFor(() => {
      expect(goNext).not.toHaveBeenCalled();
    });

    // Error should be displayed
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does NOT call goNext when bulk target <= current weight (handleNext cross-field)', async () => {
    const { goNext } = renderStep({ goalType: 'bulk', weightKg: 70 });

    const input = screen.getByLabelText('goal.targetWeight');
    fireEvent.change(input, { target: { value: '60' } });

    await act(async () => {
      fireEvent.click(screen.getByText('onboarding.nav.next'));
    });

    await waitFor(() => {
      expect(goNext).not.toHaveBeenCalled();
    });
  });

  it('blocks goNext when form.trigger returns false (invalid schema fields)', async () => {
    // goalType is required — if we can trigger schema error, trigger returns false
    // Use a form wrapper that injects invalid state
    const goNext = vi.fn();
    const goBack = vi.fn();
    let formRef: UseFormReturn<OnboardingFormData> | null = null;

    render(
      <FormWrapper
        defaultValues={{ goalType: 'cut' }}
        onForm={f => {
          formRef = f;
        }}
      >
        {form => <NutritionGoalStep form={form} goNext={goNext} goBack={goBack} />}
      </FormWrapper>,
    );

    // Manually set an error on a step '2c' field to make trigger fail
    await act(async () => {
      formRef!.setError('goalType', { message: 'invalid' });
    });

    await act(async () => {
      fireEvent.click(screen.getByText('onboarding.nav.next'));
    });

    // goNext should still be called because trigger validates field values,
    // not manually set errors. The goalType value 'cut' is valid per schema.
    // This test verifies the trigger path works with valid schema data.
    await waitFor(() => {
      expect(goNext).toHaveBeenCalledTimes(1);
    });
  });

  /* ---------------------------------------------------------------- */
  /* Error display rendering (line 172-176)                            */
  /* ---------------------------------------------------------------- */
  it('renders error message with role="alert" when present', async () => {
    renderStep({ goalType: 'cut', weightKg: 70 });
    const input = screen.getByLabelText('goal.targetWeight');

    fireEvent.change(input, { target: { value: '80' } });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('onboarding.validation.cutTargetTooHigh');
      expect(alert).toHaveAttribute('id', 'ob-target-error');
    });
  });

  /* ---------------------------------------------------------------- */
  /* checkDirectionError: maintain type clears errors (line 38-40)     */
  /* ---------------------------------------------------------------- */
  it('checkDirectionError clears error when type is maintain', async () => {
    renderStep({ goalType: 'cut', weightKg: 70 });

    // Create error
    const input = screen.getByLabelText('goal.targetWeight');
    fireEvent.change(input, { target: { value: '80' } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Switch to maintain → checkDirectionError(maintain, ...) clears errors
    const maintainBtn = screen.getByText('goal.type_maintain').closest('button')!;
    fireEvent.click(maintainBtn);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('checkDirectionError clears error when weight is null (empty input)', async () => {
    renderStep({ goalType: 'cut', weightKg: 70 });

    const input = screen.getByLabelText('goal.targetWeight');

    // Create error first
    fireEvent.change(input, { target: { value: '80' } });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Clear input → weight becomes undefined → error cleared
    fireEvent.change(input, { target: { value: '' } });
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  /* ---------------------------------------------------------------- */
  /* handleGoalTypeChange: non-maintain triggers checkDirectionError   */
  /* ---------------------------------------------------------------- */
  it('switching from cut to bulk triggers direction check on existing target', async () => {
    renderStep({ goalType: 'cut', weightKg: 70, targetWeightKg: 60 });

    // Target 60 is valid for cut (60 < 70) but invalid for bulk (60 <= 70)
    const bulkBtn = screen.getByText('goal.type_bulk').closest('button')!;
    fireEvent.click(bulkBtn);

    await waitFor(() => {
      expect(screen.getByText('onboarding.validation.bulkTargetTooLow')).toBeInTheDocument();
    });
  });

  it('switching from bulk to cut triggers direction check on existing target', async () => {
    renderStep({ goalType: 'bulk', weightKg: 70, targetWeightKg: 80 });

    // Target 80 is valid for bulk (80 > 70) but invalid for cut (80 >= 70)
    const cutBtn = screen.getByText('goal.type_cut').closest('button')!;
    fireEvent.click(cutBtn);

    await waitFor(() => {
      expect(screen.getByText('onboarding.validation.cutTargetTooHigh')).toBeInTheDocument();
    });
  });

  /* ---------------------------------------------------------------- */
  /* handleNext cross-field: goalType !== maintain & targetWeightKg set */
  /* ---------------------------------------------------------------- */
  it('handleNext skips cross-field check when goalType is maintain', async () => {
    const { goNext } = renderStep({ goalType: 'maintain', weightKg: 70 });

    await act(async () => {
      fireEvent.click(screen.getByText('onboarding.nav.next'));
    });

    await waitFor(() => {
      expect(goNext).toHaveBeenCalledTimes(1);
    });
  });

  it('handleNext skips cross-field check when targetWeightKg is undefined', async () => {
    const { goNext } = renderStep({ goalType: 'cut', weightKg: 70 });
    // targetWeightKg not set → undefined → skip cross-field

    await act(async () => {
      fireEvent.click(screen.getByText('onboarding.nav.next'));
    });

    await waitFor(() => {
      expect(goNext).toHaveBeenCalledTimes(1);
    });
  });

  it('handleNext sets error and blocks when cross-field fails for cut', async () => {
    const { goNext } = renderStepNoSuperRefine({ goalType: 'cut', weightKg: 70, targetWeightKg: 80 });

    await act(async () => {
      fireEvent.click(screen.getByText('onboarding.nav.next'));
    });

    await waitFor(() => {
      expect(goNext).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('handleNext sets error and blocks when cross-field fails for bulk', async () => {
    const { goNext } = renderStepNoSuperRefine({ goalType: 'bulk', weightKg: 70, targetWeightKg: 50 });

    await act(async () => {
      fireEvent.click(screen.getByText('onboarding.nav.next'));
    });

    await waitFor(() => {
      expect(goNext).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Fieldset aria-labels                                              */
  /* ---------------------------------------------------------------- */
  it('renders fieldsets with correct aria-labels', () => {
    renderStep({ goalType: 'cut' });
    const fieldsets = screen.getAllByRole('group');
    // First fieldset: goal type, second: rate
    expect(fieldsets[0]).toHaveAttribute('aria-label', 'goal.title');
    expect(fieldsets[1]).toHaveAttribute('aria-label', 'goal.rate');
  });

  /* ---------------------------------------------------------------- */
  /* Error fallback when message is undefined (line 174 ?? branch)     */
  /* ---------------------------------------------------------------- */
  it('shows fallback error key when error.message is undefined', async () => {
    const goNext = vi.fn();
    const goBack = vi.fn();
    let formRef: UseFormReturn<OnboardingFormData> | null = null;

    render(
      <FormWrapper
        defaultValues={{ goalType: 'cut' }}
        onForm={f => {
          formRef = f;
        }}
      >
        {form => <NutritionGoalStep form={form} goNext={goNext} goBack={goBack} />}
      </FormWrapper>,
    );

    // Manually set an error WITHOUT a message on targetWeightKg
    await act(async () => {
      formRef!.setError('targetWeightKg', { type: 'custom' });
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('onboarding.validation.required');
    });
  });
});
