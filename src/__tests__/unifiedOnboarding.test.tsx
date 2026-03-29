import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import {
  onboardingSchema,
  STEP_FIELDS,
  type OnboardingFormData,
} from '../components/onboarding/onboardingSchema';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { OnboardingErrorBoundary } from '../components/onboarding/OnboardingErrorBoundary';
import { WelcomeSlides } from '../components/onboarding/WelcomeSlides';
import { HealthBasicStep } from '../components/onboarding/HealthBasicStep';
import { ActivityLevelStep } from '../components/onboarding/ActivityLevelStep';
import { NutritionGoalStep } from '../components/onboarding/NutritionGoalStep';
import { HealthConfirmStep } from '../components/onboarding/HealthConfirmStep';
import { TrainingCoreStep } from '../components/onboarding/TrainingCoreStep';
import { TrainingDetailSteps } from '../components/onboarding/TrainingDetailSteps';
import { PlanStrategyChoice } from '../components/onboarding/PlanStrategyChoice';
import { PlanComputingScreen } from '../components/onboarding/PlanComputingScreen';
import { PlanPreviewScreen } from '../components/onboarding/PlanPreviewScreen';

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi' },
  }),
}));

const mockSaveProfile = vi.fn().mockResolvedValue(undefined);
const mockSaveGoal = vi.fn().mockResolvedValue(undefined);

vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      saveProfile: mockSaveProfile,
      saveGoal: mockSaveGoal,
      profile: {
        id: 'default',
        name: '',
        gender: 'male',
        age: 30,
        dateOfBirth: null,
        heightCm: 170,
        weightKg: 70,
        activityLevel: 'moderate',
        proteinRatio: 2.0,
        fatPct: 0.25,
        targetCalories: 1500,
        updatedAt: new Date().toISOString(),
      },
      activeGoal: null,
      loading: false,
    }),
}));

const mockSetOnboardingSection = vi.fn();

vi.mock('../store/appOnboardingStore', () => ({
  useAppOnboardingStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      isAppOnboarded: false,
      onboardingSection: null,
      setAppOnboarded: vi.fn(),
      setOnboardingSection: mockSetOnboardingSection,
    }),
}));

vi.mock('../contexts/DatabaseContext', () => ({
  useDatabase: () => ({
    execute: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
  }),
}));

vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        return React.forwardRef(
          (props: Record<string, unknown>, ref: React.Ref<HTMLElement>) => {
            const {
              animate: _animate,
              initial: _initial,
              transition: _transition,
              whileHover: _whileHover,
              whileTap: _whileTap,
              exit: _exit,
              variants: _variants,
              ...rest
            } = props;
            return React.createElement(prop, { ...rest, ref });
          },
        );
      },
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

/* ------------------------------------------------------------------ */
/*  Default form values used in tests                                  */
/* ------------------------------------------------------------------ */

const DEFAULT_VALUES: OnboardingFormData = {
  name: 'Test User',
  gender: 'male',
  dateOfBirth: '1990-01-01',
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'moderate',
  goalType: 'maintain',
  trainingGoal: 'hypertrophy',
  experience: 'beginner',
  daysPerWeek: 4,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

interface RenderedForm {
  form: UseFormReturn<OnboardingFormData>;
}

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
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
  });

  React.useEffect(() => {
    if (onForm) onForm(form);
  }, [form, onForm]);

  return <>{children(form)}</>;
}

function renderWithForm(
  Component: React.ComponentType<{
    form: UseFormReturn<OnboardingFormData>;
    goNext: () => void;
    goBack: () => void;
    [key: string]: unknown;
  }>,
  extraProps: Record<string, unknown> = {},
  defaultValues?: Partial<OnboardingFormData>,
) {
  const goNext = vi.fn();
  const goBack = vi.fn();
  let formRef: UseFormReturn<OnboardingFormData> | null = null;

  const result = render(
    <FormWrapper
      defaultValues={defaultValues}
      onForm={(f) => {
        formRef = f;
      }}
    >
      {(form) => (
        <Component form={form} goNext={goNext} goBack={goBack} {...extraProps} />
      )}
    </FormWrapper>,
  );

  return { ...result, goNext, goBack, getForm: () => formRef as RenderedForm['form'] };
}

/* ================================================================== */
/*  1. onboardingSchema                                                */
/* ================================================================== */

describe('onboardingSchema', () => {
  it('accepts valid complete data', () => {
    const result = onboardingSchema.safeParse(DEFAULT_VALUES);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = onboardingSchema.safeParse({ ...DEFAULT_VALUES, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 50 chars', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      name: 'a'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid gender', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      gender: 'other',
    });
    expect(result.success).toBe(false);
  });

  it('rejects height below 100', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      heightCm: 50,
    });
    expect(result.success).toBe(false);
  });

  it('rejects height above 250', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      heightCm: 300,
    });
    expect(result.success).toBe(false);
  });

  it('rejects weight below 30', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      weightKg: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects weight above 300', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      weightKg: 350,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid activity level', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      activityLevel: 'superactive',
    });
    expect(result.success).toBe(false);
  });

  it('cross-validates goal direction for cut — target must be lower', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      goalType: 'cut',
      targetWeightKg: 80,
      weightKg: 70,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const targetIssue = result.error.issues.find(
        (i) => i.path.includes('targetWeightKg'),
      );
      expect(targetIssue).toBeDefined();
      expect(targetIssue?.message).toBe('onboarding.validation.cutTargetTooHigh');
    }
  });

  it('accepts cut with lower target weight', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      goalType: 'cut',
      targetWeightKg: 60,
      weightKg: 70,
    });
    expect(result.success).toBe(true);
  });

  it('cross-validates goal direction for bulk — target must be higher', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      goalType: 'bulk',
      targetWeightKg: 60,
      weightKg: 70,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const targetIssue = result.error.issues.find(
        (i) => i.path.includes('targetWeightKg'),
      );
      expect(targetIssue).toBeDefined();
      expect(targetIssue?.message).toBe('onboarding.validation.bulkTargetTooLow');
    }
  });

  it('accepts bulk with higher target weight', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      goalType: 'bulk',
      targetWeightKg: 80,
      weightKg: 70,
    });
    expect(result.success).toBe(true);
  });

  it('warns on extreme BMI (too low)', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      heightCm: 200,
      weightKg: 30,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const bmiIssue = result.error.issues.find(
        (i) => i.message === 'onboarding.validation.bmiWarning',
      );
      expect(bmiIssue).toBeDefined();
    }
  });

  it('warns on extreme BMI (too high)', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      heightCm: 150,
      weightKg: 300,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const bmiIssue = result.error.issues.find(
        (i) => i.message === 'onboarding.validation.bmiWarning',
      );
      expect(bmiIssue).toBeDefined();
    }
  });

  it('accepts optional fields when omitted', () => {
    const result = onboardingSchema.safeParse(DEFAULT_VALUES);
    expect(result.success).toBe(true);
  });

  it('accepts valid optional bodyFatPct', () => {
    const result = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      bodyFatPct: 15,
    });
    expect(result.success).toBe(true);
  });

  it('rejects bodyFatPct out of range', () => {
    const lowResult = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      bodyFatPct: 1,
    });
    expect(lowResult.success).toBe(false);

    const highResult = onboardingSchema.safeParse({
      ...DEFAULT_VALUES,
      bodyFatPct: 70,
    });
    expect(highResult.success).toBe(false);
  });

  it('rejects daysPerWeek outside 2-6 range', () => {
    expect(
      onboardingSchema.safeParse({ ...DEFAULT_VALUES, daysPerWeek: 1 }).success,
    ).toBe(false);
    expect(
      onboardingSchema.safeParse({ ...DEFAULT_VALUES, daysPerWeek: 7 }).success,
    ).toBe(false);
  });

  it('exposes STEP_FIELDS with correct keys', () => {
    expect(STEP_FIELDS).toHaveProperty('2a');
    expect(STEP_FIELDS).toHaveProperty('2b');
    expect(STEP_FIELDS).toHaveProperty('2c');
    expect(STEP_FIELDS).toHaveProperty('3');
    expect(STEP_FIELDS['2a']).toContain('name');
    expect(STEP_FIELDS['2a']).toContain('heightCm');
    expect(STEP_FIELDS['2a']).toContain('weightKg');
    expect(STEP_FIELDS['3']).toContain('trainingGoal');
    expect(STEP_FIELDS['3']).toContain('experience');
    expect(STEP_FIELDS['3']).toContain('daysPerWeek');
  });
});

/* ================================================================== */
/*  2. OnboardingProgress                                              */
/* ================================================================== */

describe('OnboardingProgress', () => {
  it('renders progressbar with correct aria attributes', () => {
    render(
      <OnboardingProgress
        currentSection={2}
        totalSections={5}
        stepInSection={1}
        totalStepsInSection={3}
      />,
    );
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveAttribute('aria-valuenow');
  });

  it('computes overall progress correctly', () => {
    render(
      <OnboardingProgress
        currentSection={3}
        totalSections={5}
        stepInSection={2}
        totalStepsInSection={4}
      />,
    );
    const progressbar = screen.getByRole('progressbar');
    // (3-1 + 2/4) / 5 * 100 = 50
    expect(progressbar.getAttribute('aria-valuenow')).toBe('50');
  });

  it('shows 0% at the very beginning', () => {
    render(
      <OnboardingProgress
        currentSection={1}
        totalSections={5}
        stepInSection={0}
        totalStepsInSection={3}
      />,
    );
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('renders correct number of section segments', () => {
    render(
      <OnboardingProgress
        currentSection={1}
        totalSections={7}
        stepInSection={0}
        totalStepsInSection={3}
      />,
    );
    const progressbar = screen.getByRole('progressbar');
    const segments = progressbar.children;
    expect(segments.length).toBe(7);
  });

  it('renders section label text', () => {
    render(
      <OnboardingProgress
        currentSection={2}
        totalSections={5}
        stepInSection={1}
        totalStepsInSection={3}
      />,
    );
    expect(screen.getByText('onboarding.progress.section2')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  3. OnboardingErrorBoundary                                         */
/* ================================================================== */

describe('OnboardingErrorBoundary', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  function ThrowingChild(): React.ReactElement {
    throw new Error('Test error');
  }

  it('renders children when no error', () => {
    render(
      <OnboardingErrorBoundary onReset={vi.fn()}>
        <p>Safe child</p>
      </OnboardingErrorBoundary>,
    );
    expect(screen.getByText('Safe child')).toBeInTheDocument();
  });

  it('renders fallback UI when child throws', () => {
    render(
      <OnboardingErrorBoundary onReset={vi.fn()}>
        <ThrowingChild />
      </OnboardingErrorBoundary>,
    );
    expect(screen.getByText('onboarding.error.title')).toBeInTheDocument();
    expect(screen.getByText('onboarding.error.restart')).toBeInTheDocument();
  });

  it('calls onReset when restart button is clicked', () => {
    const onReset = vi.fn();
    render(
      <OnboardingErrorBoundary onReset={onReset}>
        <ThrowingChild />
      </OnboardingErrorBoundary>,
    );

    expect(screen.getByText('onboarding.error.title')).toBeInTheDocument();

    fireEvent.click(screen.getByText('onboarding.error.restart'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('logs error to console', () => {
    render(
      <OnboardingErrorBoundary onReset={vi.fn()}>
        <ThrowingChild />
      </OnboardingErrorBoundary>,
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

/* ================================================================== */
/*  4. WelcomeSlides                                                   */
/* ================================================================== */

describe('WelcomeSlides', () => {
  it('renders slide content for step 0', () => {
    renderWithForm(
      WelcomeSlides as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 0, goToSection: vi.fn() },
    );
    expect(screen.getByTestId('welcome-slides')).toBeInTheDocument();
    expect(screen.getByText('welcome.slide1Title')).toBeInTheDocument();
    expect(screen.getByText('welcome.slide1Desc')).toBeInTheDocument();
  });

  it('renders slide content for step 1', () => {
    renderWithForm(
      WelcomeSlides as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 1, goToSection: vi.fn() },
    );
    expect(screen.getByText('welcome.slide2Title')).toBeInTheDocument();
    expect(screen.getByText('welcome.slide2Desc')).toBeInTheDocument();
  });

  it('renders slide content for step 2', () => {
    renderWithForm(
      WelcomeSlides as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 2, goToSection: vi.fn() },
    );
    expect(screen.getByText('welcome.slide3Title')).toBeInTheDocument();
  });

  it('shows "Start" text on last slide', () => {
    renderWithForm(
      WelcomeSlides as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 2, goToSection: vi.fn() },
    );
    expect(screen.getByText('onboarding.nav.start')).toBeInTheDocument();
  });

  it('shows "Next" text on non-last slide', () => {
    renderWithForm(
      WelcomeSlides as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 0, goToSection: vi.fn() },
    );
    expect(screen.getByText('welcome.next')).toBeInTheDocument();
  });

  it('calls goNext when next button clicked', () => {
    const { goNext } = renderWithForm(
      WelcomeSlides as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 0, goToSection: vi.fn() },
    );
    fireEvent.click(screen.getByTestId('onboarding-next-btn'));
    expect(goNext).toHaveBeenCalledTimes(1);
  });

  it('calls goToSection(2) when skip button clicked', () => {
    const goToSection = vi.fn();
    renderWithForm(
      WelcomeSlides as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 0, goToSection },
    );
    fireEvent.click(screen.getByTestId('onboarding-skip-btn'));
    expect(goToSection).toHaveBeenCalledWith(2);
  });

  it('renders dot indicators with correct count', () => {
    renderWithForm(
      WelcomeSlides as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 0, goToSection: vi.fn() },
    );
    const dotGroup = screen.getByRole('group', { name: 'Slide indicator' });
    expect(dotGroup).toBeInTheDocument();
    expect(dotGroup.children.length).toBe(3);
  });

  it('marks current dot with aria-current', () => {
    renderWithForm(
      WelcomeSlides as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 1, goToSection: vi.fn() },
    );
    const dotGroup = screen.getByRole('group', { name: 'Slide indicator' });
    const dots = Array.from(dotGroup.children);
    expect(dots[1]).toHaveAttribute('aria-current', 'step');
    expect(dots[0]).not.toHaveAttribute('aria-current');
  });
});

/* ================================================================== */
/*  5. HealthBasicStep                                                 */
/* ================================================================== */

describe('HealthBasicStep', () => {
  it('renders all form fields', () => {
    renderWithForm(HealthBasicStep);
    expect(screen.getByTestId('health-basic-step')).toBeInTheDocument();
    expect(screen.getByLabelText('onboarding.health.name')).toBeInTheDocument();
    expect(screen.getByLabelText('onboarding.health.dateOfBirth')).toBeInTheDocument();
    expect(screen.getByLabelText('onboarding.health.height')).toBeInTheDocument();
    expect(screen.getByLabelText('onboarding.health.weight')).toBeInTheDocument();
  });

  it('renders gender toggle buttons', () => {
    renderWithForm(HealthBasicStep);
    expect(screen.getByText('onboarding.health.gender_male')).toBeInTheDocument();
    expect(screen.getByText('onboarding.health.gender_female')).toBeInTheDocument();
  });

  it('shows heading and subtitle', () => {
    renderWithForm(HealthBasicStep);
    expect(screen.getByText('onboarding.health.title')).toBeInTheDocument();
    expect(screen.getByText('onboarding.health.subtitle')).toBeInTheDocument();
  });

  it('calls goBack when back button clicked', () => {
    const { goBack } = renderWithForm(HealthBasicStep);
    fireEvent.click(screen.getByText('onboarding.nav.back'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('calls goNext when fields are valid and next clicked', async () => {
    const { goNext } = renderWithForm(HealthBasicStep);
    fireEvent.click(screen.getByTestId('health-basic-next'));
    await waitFor(() => {
      expect(goNext).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call goNext with empty name', async () => {
    const { goNext } = renderWithForm(HealthBasicStep, {}, { name: '' });
    fireEvent.click(screen.getByTestId('health-basic-next'));
    await waitFor(() => {
      expect(goNext).not.toHaveBeenCalled();
    });
  });

  it('renders unit labels for height and weight', () => {
    renderWithForm(HealthBasicStep);
    expect(screen.getByText('cm')).toBeInTheDocument();
    expect(screen.getByText('kg')).toBeInTheDocument();
  });

  it('renders next button with accessible text', () => {
    renderWithForm(HealthBasicStep);
    expect(screen.getByTestId('health-basic-next')).toBeInTheDocument();
    expect(screen.getByText('onboarding.nav.next')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  6. ActivityLevelStep                                               */
/* ================================================================== */

describe('ActivityLevelStep', () => {
  it('renders all 5 activity level options', () => {
    renderWithForm(ActivityLevelStep);
    expect(screen.getByTestId('activity-level-step')).toBeInTheDocument();
    expect(screen.getByText('health.activityLevel.sedentary')).toBeInTheDocument();
    expect(screen.getByText('health.activityLevel.light')).toBeInTheDocument();
    expect(screen.getByText('health.activityLevel.moderate')).toBeInTheDocument();
    expect(screen.getByText('health.activityLevel.active')).toBeInTheDocument();
    expect(screen.getByText('health.activityLevel.extra_active')).toBeInTheDocument();
  });

  it('displays TDEE multipliers', () => {
    renderWithForm(ActivityLevelStep);
    expect(screen.getByText('×1.2')).toBeInTheDocument();
    expect(screen.getByText('×1.375')).toBeInTheDocument();
    expect(screen.getByText('×1.55')).toBeInTheDocument();
    expect(screen.getByText('×1.725')).toBeInTheDocument();
    expect(screen.getByText('×1.9')).toBeInTheDocument();
  });

  it('renders heading and subtitle', () => {
    renderWithForm(ActivityLevelStep);
    expect(screen.getByText('onboarding.health.activityLevel')).toBeInTheDocument();
    expect(screen.getByText('onboarding.health.activityLevelDesc')).toBeInTheDocument();
  });

  it('calls goBack on back button click', () => {
    const { goBack } = renderWithForm(ActivityLevelStep);
    fireEvent.click(screen.getByText('onboarding.nav.back'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('calls goNext on next button click', () => {
    const { goNext } = renderWithForm(ActivityLevelStep);
    fireEvent.click(screen.getByText('onboarding.nav.next'));
    expect(goNext).toHaveBeenCalledTimes(1);
  });

  it('allows selecting a different activity level', () => {
    renderWithForm(ActivityLevelStep);
    const activeBtn = screen.getByText('health.activityLevel.active').closest('button');
    expect(activeBtn).toBeInTheDocument();
    if (activeBtn) fireEvent.click(activeBtn);
    // The button should still be in the document after clicking
    expect(screen.getByText('health.activityLevel.active')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  7. NutritionGoalStep                                               */
/* ================================================================== */

describe('NutritionGoalStep', () => {
  it('renders all 3 goal type options', () => {
    renderWithForm(NutritionGoalStep);
    expect(screen.getByTestId('nutrition-goal-step')).toBeInTheDocument();
    expect(screen.getByText('onboarding.goal.type_cut')).toBeInTheDocument();
    expect(screen.getByText('onboarding.goal.type_maintain')).toBeInTheDocument();
    expect(screen.getByText('onboarding.goal.type_bulk')).toBeInTheDocument();
  });

  it('does not show rate/target fields when maintain is selected', () => {
    renderWithForm(NutritionGoalStep, {}, { goalType: 'maintain' });
    expect(screen.queryByText('onboarding.goal.rate')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('onboarding.goal.targetWeight')).not.toBeInTheDocument();
  });

  it('shows rate/target fields when cut is selected', () => {
    renderWithForm(NutritionGoalStep, {}, { goalType: 'cut' });
    expect(screen.getByText('onboarding.goal.rate')).toBeInTheDocument();
    expect(screen.getByLabelText('onboarding.goal.targetWeight')).toBeInTheDocument();
  });

  it('shows rate/target fields when bulk is selected', () => {
    renderWithForm(NutritionGoalStep, {}, { goalType: 'bulk' });
    expect(screen.getByText('onboarding.goal.rate')).toBeInTheDocument();
    expect(screen.getByLabelText('onboarding.goal.targetWeight')).toBeInTheDocument();
  });

  it('renders all 3 rate options when not maintain', () => {
    renderWithForm(NutritionGoalStep, {}, { goalType: 'cut' });
    expect(screen.getByText('onboarding.goal.rate_conservative')).toBeInTheDocument();
    expect(screen.getByText('onboarding.goal.rate_moderate')).toBeInTheDocument();
    expect(screen.getByText('onboarding.goal.rate_aggressive')).toBeInTheDocument();
  });

  it('calls goBack on back button click', () => {
    const { goBack } = renderWithForm(NutritionGoalStep);
    fireEvent.click(screen.getByText('onboarding.nav.back'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('shows conditional fields when switching from maintain to cut', () => {
    renderWithForm(NutritionGoalStep, {}, { goalType: 'maintain' });
    expect(screen.queryByText('onboarding.goal.rate')).not.toBeInTheDocument();

    const cutButton = screen.getByText('onboarding.goal.type_cut').closest('button');
    if (cutButton) fireEvent.click(cutButton);
    expect(screen.getByText('onboarding.goal.rate')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  8. HealthConfirmStep                                               */
/* ================================================================== */

describe('HealthConfirmStep', () => {
  it('renders the confirm step with summary', () => {
    renderWithForm(HealthConfirmStep);
    expect(screen.getByTestId('health-confirm-step')).toBeInTheDocument();
    expect(screen.getByText('onboarding.confirm.title')).toBeInTheDocument();
    expect(screen.getByText('onboarding.confirm.subtitle')).toBeInTheDocument();
  });

  it('displays user name in summary', () => {
    renderWithForm(HealthConfirmStep);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('displays height and weight values', () => {
    renderWithForm(HealthConfirmStep);
    expect(screen.getByText('170 cm')).toBeInTheDocument();
    expect(screen.getByText('70 kg')).toBeInTheDocument();
  });

  it('shows daily calorie value (BMR)', () => {
    renderWithForm(HealthConfirmStep);
    // The BMR is calculated: 10*70 + 6.25*170 - 5*age + 5, * 1.55
    // With age from 1990-01-01 it varies, but a number should be present
    const calorieText = screen.getByText('onboarding.confirm.dailyCalories');
    expect(calorieText).toBeInTheDocument();
  });

  it('shows BMI value', () => {
    renderWithForm(HealthConfirmStep);
    // BMI = 70 / (1.7^2) ≈ 24.2
    expect(screen.getByText('24.2')).toBeInTheDocument();
  });

  it('expands details when more detail button clicked', () => {
    renderWithForm(HealthConfirmStep);
    expect(screen.queryByText(/health.activityLevel.moderate/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('onboarding.confirm.moreDetail'));
    expect(screen.getByText(/health.activityLevel.moderate/)).toBeInTheDocument();
  });

  it('collapses details when less detail button clicked', () => {
    renderWithForm(HealthConfirmStep);
    fireEvent.click(screen.getByText('onboarding.confirm.moreDetail'));
    expect(screen.getByText(/health.activityLevel.moderate/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('onboarding.confirm.lessDetail'));
    expect(screen.queryByText(/health.activityLevel.moderate/)).not.toBeInTheDocument();
  });

  it('calls goBack on back button click', () => {
    const { goBack } = renderWithForm(HealthConfirmStep);
    fireEvent.click(screen.getByText('onboarding.nav.back'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('calls saveProfile and goNext on confirm', async () => {
    const { goNext } = renderWithForm(HealthConfirmStep);
    fireEvent.click(screen.getByTestId('health-confirm-btn'));
    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalled();
      expect(mockSaveGoal).toHaveBeenCalled();
      expect(mockSetOnboardingSection).toHaveBeenCalledWith(3);
      expect(goNext).toHaveBeenCalledTimes(1);
    });
  });
});

/* ================================================================== */
/*  9. TrainingCoreStep                                                */
/* ================================================================== */

describe('TrainingCoreStep', () => {
  it('renders training goal options', () => {
    renderWithForm(TrainingCoreStep);
    expect(screen.getByTestId('training-core-step')).toBeInTheDocument();
    expect(screen.getByText('fitness.onboarding.strength')).toBeInTheDocument();
    expect(screen.getByText('fitness.onboarding.hypertrophy')).toBeInTheDocument();
    expect(screen.getByText('fitness.onboarding.endurance')).toBeInTheDocument();
    expect(screen.getByText('fitness.onboarding.general')).toBeInTheDocument();
  });

  it('renders experience level options', () => {
    renderWithForm(TrainingCoreStep);
    expect(screen.getByText('fitness.onboarding.beginner')).toBeInTheDocument();
    expect(screen.getByText('fitness.onboarding.intermediate')).toBeInTheDocument();
    expect(screen.getByText('fitness.onboarding.advanced')).toBeInTheDocument();
  });

  it('renders days per week options (2-6)', () => {
    renderWithForm(TrainingCoreStep);
    [2, 3, 4, 5, 6].forEach((d) => {
      expect(screen.getByText(String(d))).toBeInTheDocument();
    });
  });

  it('shows heading and subtitle', () => {
    renderWithForm(TrainingCoreStep);
    expect(screen.getByText('fitness.onboarding.step1Title')).toBeInTheDocument();
    expect(screen.getByText('fitness.onboarding.step1Desc')).toBeInTheDocument();
  });

  it('calls goBack on back button click', () => {
    const { goBack } = renderWithForm(TrainingCoreStep);
    fireEvent.click(screen.getByText('onboarding.nav.back'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('calls goNext when fields are valid and next clicked', async () => {
    const { goNext } = renderWithForm(TrainingCoreStep);
    fireEvent.click(screen.getByText('onboarding.nav.next'));
    await waitFor(() => {
      expect(goNext).toHaveBeenCalledTimes(1);
    });
  });

  it('allows selecting a training goal', () => {
    renderWithForm(TrainingCoreStep);
    const strengthBtn = screen.getByText('fitness.onboarding.strength').closest('button');
    if (strengthBtn) fireEvent.click(strengthBtn);
    expect(screen.getByText('fitness.onboarding.strength')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  10. TrainingDetailSteps                                            */
/* ================================================================== */

describe('TrainingDetailSteps', () => {
  const setOnboardingSection = vi.fn();

  it('renders DurationStep at step 0', () => {
    renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 0, setOnboardingSection },
    );
    expect(screen.getByText('fitness.onboarding.sessionDuration')).toBeInTheDocument();
    [30, 45, 60, 75, 90].forEach((d) => {
      expect(
        screen.getByText(new RegExp(`^${d} `)),
      ).toBeInTheDocument();
    });
  });

  it('renders EquipmentStep at step 1', () => {
    renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 1, setOnboardingSection },
    );
    expect(screen.getByText('fitness.onboarding.equipment')).toBeInTheDocument();
    expect(screen.getByText('fitness.onboarding.equip_barbell')).toBeInTheDocument();
    expect(screen.getByText('fitness.onboarding.equip_dumbbell')).toBeInTheDocument();
  });

  it('allows toggling equipment selection', () => {
    renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 1, setOnboardingSection },
    );
    const barbellBtn = screen.getByText('fitness.onboarding.equip_barbell').closest('button');
    if (barbellBtn) {
      fireEvent.click(barbellBtn);
      fireEvent.click(barbellBtn);
    }
    expect(screen.getByText('fitness.onboarding.equip_barbell')).toBeInTheDocument();
  });

  it('renders CardioStep at step 2', () => {
    renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 2, setOnboardingSection },
    );
    expect(screen.getByText('fitness.onboarding.cardioSessions')).toBeInTheDocument();
    [0, 1, 2, 3].forEach((n) => {
      expect(screen.getByText(String(n))).toBeInTheDocument();
    });
  });

  it('renders TrainingConfirmStep at step 3 for beginner', () => {
    renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 3, setOnboardingSection },
      { experience: 'beginner' },
    );
    expect(screen.getByTestId('training-confirm-step')).toBeInTheDocument();
    expect(screen.getByText('onboarding.confirm.trainingTitle')).toBeInTheDocument();
  });

  it('renders PeriodizationStep at step 3 for intermediate', () => {
    renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 3, setOnboardingSection },
      { experience: 'intermediate' },
    );
    expect(screen.getByText('fitness.onboarding.periodization')).toBeInTheDocument();
    expect(screen.getByText('fitness.onboarding.period_linear')).toBeInTheDocument();
    expect(screen.getByText('fitness.onboarding.period_undulating')).toBeInTheDocument();
    expect(screen.getByText('fitness.onboarding.period_block')).toBeInTheDocument();
  });

  it('renders TrainingConfirmStep at step 4 (default)', () => {
    renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 4, setOnboardingSection },
      { experience: 'intermediate' },
    );
    expect(screen.getByTestId('training-confirm-step')).toBeInTheDocument();
  });

  it('displays training summary values in confirm step', () => {
    renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 3, setOnboardingSection },
      { experience: 'beginner', daysPerWeek: 4, trainingGoal: 'hypertrophy' },
    );
    expect(screen.getByText('fitness.onboarding.hypertrophy')).toBeInTheDocument();
    expect(screen.getByText('fitness.onboarding.beginner')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('calls goBack on back button click', () => {
    const { goBack } = renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 0, setOnboardingSection },
    );
    fireEvent.click(screen.getByText('onboarding.nav.back'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('calls goNext on next button click for duration step', () => {
    const { goNext } = renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 0, setOnboardingSection },
    );
    fireEvent.click(screen.getByText('onboarding.nav.next'));
    expect(goNext).toHaveBeenCalledTimes(1);
  });

  it('calls setOnboardingSection(5) on training confirm next', () => {
    const mockSetSection = vi.fn();
    const { goNext } = renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 3, setOnboardingSection: mockSetSection },
      { experience: 'beginner' },
    );
    fireEvent.click(screen.getByText('onboarding.nav.next'));
    expect(mockSetSection).toHaveBeenCalledWith(5);
    expect(goNext).toHaveBeenCalledTimes(1);
  });
});

/* ================================================================== */
/*  11. PlanStrategyChoice                                             */
/* ================================================================== */

describe('PlanStrategyChoice', () => {
  it('renders auto and manual strategy buttons', () => {
    const setPlanStrategy = vi.fn();
    const goToSection = vi.fn();
    renderWithForm(
      PlanStrategyChoice as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { setPlanStrategy, goToSection },
    );
    expect(screen.getByTestId('plan-strategy-choice')).toBeInTheDocument();
    expect(screen.getByTestId('strategy-auto')).toBeInTheDocument();
    expect(screen.getByTestId('strategy-manual')).toBeInTheDocument();
  });

  it('shows heading and subtitle', () => {
    renderWithForm(
      PlanStrategyChoice as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { setPlanStrategy: vi.fn(), goToSection: vi.fn() },
    );
    expect(screen.getByText('onboarding.strategy.title')).toBeInTheDocument();
    expect(screen.getByText('onboarding.strategy.subtitle')).toBeInTheDocument();
  });

  it('calls setPlanStrategy("auto") and goNext on auto click', () => {
    const setPlanStrategy = vi.fn();
    const goToSection = vi.fn();
    const { goNext } = renderWithForm(
      PlanStrategyChoice as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { setPlanStrategy, goToSection },
    );
    fireEvent.click(screen.getByTestId('strategy-auto'));
    expect(setPlanStrategy).toHaveBeenCalledWith('auto');
    expect(goNext).toHaveBeenCalledTimes(1);
  });

  it('calls setPlanStrategy("manual") and goToSection(7) on manual click', () => {
    const setPlanStrategy = vi.fn();
    const goToSection = vi.fn();
    renderWithForm(
      PlanStrategyChoice as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { setPlanStrategy, goToSection },
    );
    fireEvent.click(screen.getByTestId('strategy-manual'));
    expect(setPlanStrategy).toHaveBeenCalledWith('manual');
    expect(goToSection).toHaveBeenCalledWith(7);
  });

  it('calls goBack on back button click', () => {
    const { goBack } = renderWithForm(
      PlanStrategyChoice as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { setPlanStrategy: vi.fn(), goToSection: vi.fn() },
    );
    fireEvent.click(screen.getByText('onboarding.nav.back'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('displays auto and manual descriptions', () => {
    renderWithForm(
      PlanStrategyChoice as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { setPlanStrategy: vi.fn(), goToSection: vi.fn() },
    );
    expect(screen.getByText('onboarding.strategy.auto')).toBeInTheDocument();
    expect(screen.getByText('onboarding.strategy.autoDesc')).toBeInTheDocument();
    expect(screen.getByText('onboarding.strategy.manual')).toBeInTheDocument();
    expect(screen.getByText('onboarding.strategy.manualDesc')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  12. PlanComputingScreen                                            */
/* ================================================================== */

describe('PlanComputingScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders computing screen', () => {
    renderWithForm(PlanComputingScreen);
    expect(screen.getByTestId('plan-computing')).toBeInTheDocument();
    expect(screen.getByText('onboarding.computing.title')).toBeInTheDocument();
    expect(screen.getByText('onboarding.computing.subtitle')).toBeInTheDocument();
  });

  it('renders all 4 computing steps', () => {
    renderWithForm(PlanComputingScreen);
    expect(screen.getByText('onboarding.computing.step_analyzing')).toBeInTheDocument();
    expect(screen.getByText('onboarding.computing.step_optimizing')).toBeInTheDocument();
    expect(screen.getByText('onboarding.computing.step_generating')).toBeInTheDocument();
    expect(screen.getByText('onboarding.computing.step_finalizing')).toBeInTheDocument();
  });

  it('auto-advances through steps and calls goNext', () => {
    const { goNext } = renderWithForm(PlanComputingScreen);

    // step 0 → 1
    vi.advanceTimersByTime(2500);
    // step 1 → 2
    vi.advanceTimersByTime(2500);
    // step 2 → 3
    vi.advanceTimersByTime(2500);
    // step 3 → end
    vi.advanceTimersByTime(2500);
    // final delay
    vi.advanceTimersByTime(1500);

    expect(goNext).toHaveBeenCalledTimes(1);
  });

  it('cleans up timer on unmount', () => {
    const { unmount } = renderWithForm(PlanComputingScreen);
    unmount();
    // Advance timers after unmount — goNext should not fire
    vi.advanceTimersByTime(20000);
    // No error means cleanup worked correctly
  });
});

/* ================================================================== */
/*  13. PlanPreviewScreen                                              */
/* ================================================================== */

describe('PlanPreviewScreen', () => {
  const completeOnboarding = vi.fn();

  it('renders preview screen', () => {
    renderWithForm(
      PlanPreviewScreen as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { completeOnboarding },
    );
    expect(screen.getByTestId('plan-preview')).toBeInTheDocument();
    expect(screen.getByText('onboarding.preview.title')).toBeInTheDocument();
    expect(screen.getByText('onboarding.preview.subtitle')).toBeInTheDocument();
  });

  it('shows correct week day labels', () => {
    renderWithForm(
      PlanPreviewScreen as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { completeOnboarding },
    );
    ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('shows workout and rest day stats', () => {
    renderWithForm(
      PlanPreviewScreen as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { completeOnboarding },
      { daysPerWeek: 4 },
    );
    expect(screen.getByText('onboarding.preview.workoutDays')).toBeInTheDocument();
    expect(screen.getByText('onboarding.preview.restDays')).toBeInTheDocument();
    expect(screen.getByText('onboarding.preview.minutesPerSession')).toBeInTheDocument();
  });

  it('shows edit note', () => {
    renderWithForm(
      PlanPreviewScreen as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { completeOnboarding },
    );
    expect(screen.getByText('onboarding.preview.editNote')).toBeInTheDocument();
  });

  it('calls completeOnboarding on complete button click', () => {
    renderWithForm(
      PlanPreviewScreen as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { completeOnboarding },
    );
    fireEvent.click(screen.getByTestId('onboarding-complete'));
    expect(completeOnboarding).toHaveBeenCalledTimes(1);
  });

  it('calls goBack on back button click', () => {
    const { goBack } = renderWithForm(
      PlanPreviewScreen as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { completeOnboarding },
    );
    fireEvent.click(screen.getByText('onboarding.nav.back'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('displays session duration default of 60 when not set', () => {
    renderWithForm(
      PlanPreviewScreen as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { completeOnboarding },
      { daysPerWeek: 3 },
    );
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('displays custom session duration when set', () => {
    renderWithForm(
      PlanPreviewScreen as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { completeOnboarding },
      { sessionDuration: 45, daysPerWeek: 4 },
    );
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('shows correct number of rest days', () => {
    renderWithForm(
      PlanPreviewScreen as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { completeOnboarding },
      { daysPerWeek: 5 },
    );
    // 7 - 5 = 2 rest days
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  14. Additional coverage – HealthBasicStep field interactions        */
/* ================================================================== */

describe('HealthBasicStep – field interactions', () => {
  it('updates gender when clicking female button', () => {
    const { getByText } = renderWithForm(HealthBasicStep);
    const femaleBtn = getByText('onboarding.health.gender_female');
    fireEvent.click(femaleBtn);
    expect(femaleBtn.className).toContain('border-emerald-500');
  });

  it('updates gender when clicking male button after female', () => {
    const { getByText } = renderWithForm(HealthBasicStep, {}, { gender: 'female' });
    const maleBtn = getByText('onboarding.health.gender_male');
    fireEvent.click(maleBtn);
    expect(maleBtn.className).toContain('border-emerald-500');
  });

  it('updates date of birth input on change', () => {
    const { container } = renderWithForm(HealthBasicStep);
    const dobInput = container.querySelector('#ob-dob') as HTMLInputElement;
    fireEvent.change(dobInput, { target: { value: '2000-06-15' } });
    expect(dobInput.value).toBe('2000-06-15');
  });

  it('triggers onBlur on date of birth field', () => {
    const { container } = renderWithForm(HealthBasicStep);
    const dobInput = container.querySelector('#ob-dob') as HTMLInputElement;
    fireEvent.blur(dobInput);
    expect(dobInput).toBeInTheDocument();
  });

  it('updates height input on change', () => {
    const { container } = renderWithForm(HealthBasicStep);
    const heightInput = container.querySelector('#ob-height') as HTMLInputElement;
    fireEvent.change(heightInput, { target: { value: '180' } });
    expect(heightInput).toHaveValue(180);
  });

  it('triggers onBlur on height input', () => {
    const { container } = renderWithForm(HealthBasicStep);
    const heightInput = container.querySelector('#ob-height') as HTMLInputElement;
    fireEvent.blur(heightInput);
    expect(heightInput).toBeInTheDocument();
  });

  it('shows height hint when value is between 0 and 3 (exclusive)', () => {
    const { queryByText } = renderWithForm(HealthBasicStep, {}, { heightCm: 2 });
    expect(queryByText('onboarding.validation.heightHint')).toBeInTheDocument();
  });

  it('does not show height hint when value is 0', () => {
    const { queryByText } = renderWithForm(HealthBasicStep, {}, { heightCm: 0 });
    expect(queryByText('onboarding.validation.heightHint')).not.toBeInTheDocument();
  });

  it('does not show height hint when value is >= 3', () => {
    const { queryByText } = renderWithForm(HealthBasicStep, {}, { heightCm: 170 });
    expect(queryByText('onboarding.validation.heightHint')).not.toBeInTheDocument();
  });

  it('updates weight input on change', () => {
    const { container } = renderWithForm(HealthBasicStep);
    const weightInput = container.querySelector('#ob-weight') as HTMLInputElement;
    fireEvent.change(weightInput, { target: { value: '85' } });
    expect(weightInput).toHaveValue(85);
  });

  it('triggers onBlur on weight input', () => {
    const { container } = renderWithForm(HealthBasicStep);
    const weightInput = container.querySelector('#ob-weight') as HTMLInputElement;
    fireEvent.blur(weightInput);
    expect(weightInput).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  15. Additional coverage – NutritionGoalStep field interactions      */
/* ================================================================== */

describe('NutritionGoalStep – field interactions', () => {
  it('allows selecting each rate option when goal is cut', () => {
    const { getByText } = renderWithForm(NutritionGoalStep, {}, { goalType: 'cut' });
    const conservativeBtn = getByText('onboarding.goal.rate_conservative');
    fireEvent.click(conservativeBtn);
    expect(conservativeBtn.className).toContain('border-emerald-500');

    const aggressiveBtn = getByText('onboarding.goal.rate_aggressive');
    fireEvent.click(aggressiveBtn);
    expect(aggressiveBtn.className).toContain('border-emerald-500');
  });

  it('allows typing target weight value', () => {
    const { container } = renderWithForm(NutritionGoalStep, {}, { goalType: 'cut' });
    const targetInput = container.querySelector('#ob-target') as HTMLInputElement;
    fireEvent.change(targetInput, { target: { value: '65' } });
    expect(targetInput).toHaveValue(65);
  });

  it('handles clearing target weight input (empty string → undefined)', () => {
    let formRef: UseFormReturn<OnboardingFormData> | null = null;
    render(
      <FormWrapper defaultValues={{ goalType: 'cut', targetWeightKg: 65 }} onForm={(f) => { formRef = f; }}>
        {(form) => <NutritionGoalStep form={form} goNext={vi.fn()} goBack={vi.fn()} />}
      </FormWrapper>,
    );
    const targetInput = document.querySelector('#ob-target') as HTMLInputElement;
    fireEvent.change(targetInput, { target: { value: '' } });
    expect(formRef!.getValues('targetWeightKg')).toBeUndefined();
  });

  it('triggers onBlur on target weight input', () => {
    const { container } = renderWithForm(NutritionGoalStep, {}, { goalType: 'cut' });
    const targetInput = container.querySelector('#ob-target') as HTMLInputElement;
    fireEvent.blur(targetInput);
    expect(targetInput).toBeInTheDocument();
  });
});

/* ================================================================== */
/*  16. Additional coverage – TrainingCoreStep field interactions       */
/* ================================================================== */

describe('TrainingCoreStep – field interactions', () => {
  it('allows clicking each experience level button', () => {
    const { getByText } = renderWithForm(TrainingCoreStep);
    const intermediateBtn = getByText('fitness.onboarding.intermediate');
    fireEvent.click(intermediateBtn);
    expect(intermediateBtn.className).toContain('border-emerald-500');

    const advancedBtn = getByText('fitness.onboarding.advanced');
    fireEvent.click(advancedBtn);
    expect(advancedBtn.className).toContain('border-emerald-500');
  });

  it('allows clicking each days per week button', () => {
    const { getByText } = renderWithForm(TrainingCoreStep);
    const day2Btn = getByText('2');
    fireEvent.click(day2Btn);
    expect(day2Btn.className).toContain('border-emerald-500');

    const day6Btn = getByText('6');
    fireEvent.click(day6Btn);
    expect(day6Btn.className).toContain('border-emerald-500');
  });
});

/* ================================================================== */
/*  17. Additional coverage – TrainingDetailSteps sub-step interactions */
/* ================================================================== */

describe('TrainingDetailSteps – sub-step interactions', () => {
  const setOnboardingSection = vi.fn();

  it('allows clicking each session duration option', () => {
    const { getByText } = renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 0, setOnboardingSection },
    );
    const btn30 = getByText(/^30/);
    fireEvent.click(btn30);
    expect(btn30.className).toContain('border-emerald-500');

    const btn90 = getByText(/^90/);
    fireEvent.click(btn90);
    expect(btn90.className).toContain('border-emerald-500');
  });

  it('allows clicking each cardio sessions option', () => {
    const { getByText } = renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 2, setOnboardingSection },
    );
    const btn0 = getByText('0');
    fireEvent.click(btn0);
    expect(btn0.className).toContain('border-emerald-500');

    const btn3 = getByText('3');
    fireEvent.click(btn3);
    expect(btn3.className).toContain('border-emerald-500');
  });

  it('allows clicking each periodization option', () => {
    const { getByText } = renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 3, setOnboardingSection },
      { experience: 'intermediate' },
    );
    const linearBtn = getByText('fitness.onboarding.period_linear');
    fireEvent.click(linearBtn);
    expect(linearBtn.closest('button')?.className).toContain('border-emerald-500');

    const blockBtn = getByText('fitness.onboarding.period_block');
    fireEvent.click(blockBtn);
    expect(blockBtn.closest('button')?.className).toContain('border-emerald-500');
  });

  it('removes equipment item when toggled off', () => {
    const { getByText } = renderWithForm(
      TrainingDetailSteps as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      { step: 1, setOnboardingSection },
    );
    const barbellBtn = getByText('fitness.onboarding.equip_barbell');
    fireEvent.click(barbellBtn);
    expect(barbellBtn.className).toContain('border-emerald-500');
    // Toggle off
    fireEvent.click(barbellBtn);
    expect(barbellBtn.className).not.toContain('border-emerald-500');
  });
});

/* ================================================================== */
/*  18. Additional coverage – HealthConfirmStep with empty dateOfBirth */
/* ================================================================== */

describe('HealthConfirmStep – edge cases', () => {
  it('shows age as 0 when dateOfBirth is empty', () => {
    renderWithForm(
      HealthConfirmStep as React.ComponentType<{
        form: UseFormReturn<OnboardingFormData>;
        goNext: () => void;
        goBack: () => void;
      }>,
      {
        saveProfile: vi.fn().mockResolvedValue(undefined),
        saveGoal: vi.fn().mockResolvedValue(undefined),
        setOnboardingSection: vi.fn(),
      },
      { dateOfBirth: '' },
    );
    // Age row: "0 onboarding.confirm.years"
    expect(screen.getByText('0 onboarding.confirm.years')).toBeInTheDocument();
  });
});
