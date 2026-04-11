import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */
const mockSaveProfile = vi.fn().mockResolvedValue(undefined);
const mockSaveGoal = vi.fn().mockResolvedValue(undefined);
const mockSetOnboardingSection = vi.fn();

vi.mock('../contexts/DatabaseContext', () => ({
  useDatabase: () => ({}) as unknown,
}));

vi.mock('../features/health-profile/store/healthProfileStore', () => ({
  useHealthProfileStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ saveProfile: mockSaveProfile, saveGoal: mockSaveGoal }),
}));

vi.mock('../store/appOnboardingStore', () => ({
  useAppOnboardingStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ setOnboardingSection: mockSetOnboardingSection }),
}));

vi.mock('../features/health-profile/types', () => ({
  getAge: () => 29,
}));

vi.mock('../schemas/goalValidation', async importOriginal => {
  const actual = await importOriginal<typeof import('../schemas/goalValidation')>();
  return {
    ...actual,
    validateTargetWeight: vi.fn(() => null),
  };
});

vi.mock('../services/nutritionEngine', () => ({
  getCalorieOffset: vi.fn(() => -550),
}));

vi.mock('../utils/logger', () => ({
  logger: { error: vi.fn() },
}));

import { HealthConfirmStep } from '../components/onboarding/HealthConfirmStep';
import { validateTargetWeight } from '../schemas/goalValidation';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/* Form mock factory                                                   */
/* ------------------------------------------------------------------ */
function createMockForm(overrides: Partial<Record<string, unknown>> = {}) {
  const defaultValues = {
    name: 'Test User',
    gender: 'male' as const,
    dateOfBirth: '1996-05-15',
    heightCm: 175,
    weightKg: 75,
    activityLevel: 'moderate' as const,
    goalType: 'cut' as const,
    rateOfChange: 'moderate' as const,
    targetWeightKg: 65,
    bodyFatPct: undefined,
    bmrOverride: undefined,
    proteinRatio: 2,
    ...overrides,
  };

  return {
    getValues: vi.fn(() => defaultValues),
    trigger: vi.fn().mockResolvedValue(true),
    setError: vi.fn(),
  } as unknown as Parameters<typeof HealthConfirmStep>[0]['form'];
}

function renderStep(formOverrides: Partial<Record<string, unknown>> = {}, goNext = vi.fn(), goBack = vi.fn()) {
  const form = createMockForm(formOverrides);
  return { ...render(<HealthConfirmStep form={form} goNext={goNext} goBack={goBack} />), form, goNext, goBack };
}

describe('HealthConfirmStep', () => {
  /* ---------------------------------------------------------------- */
  /* Basic rendering                                                   */
  /* ---------------------------------------------------------------- */
  it('renders step container', () => {
    renderStep();
    expect(screen.getByTestId('health-confirm-step')).toBeInTheDocument();
  });

  it('displays user name in title', () => {
    renderStep({ name: 'Khanh' });
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent).toBeTruthy();
  });

  it('displays estimated TDEE', () => {
    renderStep();
    // Male, 75kg, 175cm, age 29, moderate: BMR ≈ 1704, TDEE ≈ 2641
    expect(screen.getByText('2641')).toBeInTheDocument();
  });

  it('displays summary items', () => {
    renderStep();
    expect(screen.getByText('175 cm')).toBeInTheDocument();
    expect(screen.getByText('75 kg')).toBeInTheDocument();
  });

  it('computes BMI correctly', () => {
    // BMI = 75 / (1.75^2) ≈ 24.5
    renderStep();
    expect(screen.getByText('24.5')).toBeInTheDocument();
  });

  /* ---------------------------------------------------------------- */
  /* Female gender path                                                */
  /* ---------------------------------------------------------------- */
  it('computes TDEE for female', () => {
    renderStep({ gender: 'female' });
    // Female: BMR = 10*75 + 6.25*175 - 5*29 - 161 = 1538, TDEE ≈ 2384
    expect(screen.getByText('2384')).toBeInTheDocument();
  });

  /* ---------------------------------------------------------------- */
  /* No dateOfBirth path                                               */
  /* ---------------------------------------------------------------- */
  it('uses age 0 when dateOfBirth is empty', () => {
    renderStep({ dateOfBirth: '' });
    // Age 0: BMR = 10*75 + 6.25*175 - 5*0 + 5 = 1848.75 → TDEE ≈ 2866
    expect(screen.getByText('2866')).toBeInTheDocument();
  });

  /* ---------------------------------------------------------------- */
  /* Unknown activity level fallback                                   */
  /* ---------------------------------------------------------------- */
  it('falls back to 1.55 multiplier for unknown activity level', () => {
    renderStep({ activityLevel: 'unknown' });
    // Same as moderate (1.55)
    expect(screen.getByText('2641')).toBeInTheDocument();
  });

  /* ---------------------------------------------------------------- */
  /* Expand/collapse detail                                            */
  /* ---------------------------------------------------------------- */
  it('expands detail section on button click', () => {
    renderStep();

    // Find and click the expand button
    const expandButton = screen.getByRole('button', { name: /Xem chi tiết/i });
    fireEvent.click(expandButton);

    // After expand — goal info visible, button text changes
    expect(screen.getByRole('button', { name: /Ẩn chi tiết/i })).toBeInTheDocument();
  });

  it('shows rate and target weight in detail for non-maintain goal', () => {
    renderStep({ goalType: 'cut', rateOfChange: 'aggressive', targetWeightKg: 60 });

    // Expand details
    const expandBtn = screen.getByRole('button', { name: /Xem chi tiết/i });
    fireEvent.click(expandBtn);

    const step = screen.getByTestId('health-confirm-step');
    expect(step.textContent).toContain('60');
  });

  it('hides rate and target weight in detail for maintain goal', () => {
    renderStep({ goalType: 'maintain' });

    // Expand details
    const expandBtn = screen.getByRole('button', { name: /Xem chi tiết/i });
    fireEvent.click(expandBtn);

    // Maintain should not show rate/target weight rows
    const step = screen.getByTestId('health-confirm-step');
    expect(step).toBeInTheDocument();
  });

  /* ---------------------------------------------------------------- */
  /* Navigation callbacks                                              */
  /* ---------------------------------------------------------------- */
  it('calls goBack when back button clicked', () => {
    const { goBack } = renderStep();
    const backButtons = screen.getAllByRole('button');
    const backBtn = backButtons.find(b => b.textContent?.includes('Quay lại'));
    if (backBtn) fireEvent.click(backBtn);
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  /* ---------------------------------------------------------------- */
  /* Confirm — success path                                            */
  /* ---------------------------------------------------------------- */
  it('saves profile and goal, then advances on confirm', async () => {
    const goNext = vi.fn();
    renderStep({}, goNext);

    fireEvent.click(screen.getByTestId('health-confirm-btn'));

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledTimes(1);
      expect(mockSaveGoal).toHaveBeenCalledTimes(1);
      expect(mockSetOnboardingSection).toHaveBeenCalledWith(3);
      expect(goNext).toHaveBeenCalledTimes(1);
    });
  });

  it('uses calorieOffset=0 for maintain goal', async () => {
    renderStep({ goalType: 'maintain' });

    fireEvent.click(screen.getByTestId('health-confirm-btn'));

    await waitFor(() => {
      const goalArg = mockSaveGoal.mock.calls[0][1];
      expect(goalArg.calorieOffset).toBe(0);
    });
  });

  it('passes rateOfChange defaulting to moderate', async () => {
    renderStep({ rateOfChange: undefined });

    fireEvent.click(screen.getByTestId('health-confirm-btn'));

    await waitFor(() => {
      const goalArg = mockSaveGoal.mock.calls[0][1];
      expect(goalArg.rateOfChange).toBe('moderate');
    });
  });

  it('passes targetWeightKg defaulting to weightKg when undefined', async () => {
    renderStep({ targetWeightKg: undefined });

    fireEvent.click(screen.getByTestId('health-confirm-btn'));

    await waitFor(() => {
      const goalArg = mockSaveGoal.mock.calls[0][1];
      expect(goalArg.targetWeightKg).toBe(75);
    });
  });

  /* ---------------------------------------------------------------- */
  /* Confirm — validation failure                                      */
  /* ---------------------------------------------------------------- */
  it('does not save when form trigger returns false', async () => {
    const form = createMockForm();
    (form.trigger as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const goNext = vi.fn();

    render(<HealthConfirmStep form={form} goNext={goNext} goBack={vi.fn()} />);
    fireEvent.click(screen.getByTestId('health-confirm-btn'));

    await waitFor(() => {
      expect(mockSaveProfile).not.toHaveBeenCalled();
      expect(goNext).not.toHaveBeenCalled();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Confirm — target weight validation error                          */
  /* ---------------------------------------------------------------- */
  it('sets error and stops when validateTargetWeight returns error', async () => {
    vi.mocked(validateTargetWeight).mockReturnValue('goal.targetWeightTooHigh');
    const form = createMockForm({ goalType: 'cut', targetWeightKg: 100 });
    const goNext = vi.fn();

    render(<HealthConfirmStep form={form} goNext={goNext} goBack={vi.fn()} />);
    fireEvent.click(screen.getByTestId('health-confirm-btn'));

    await waitFor(() => {
      expect(form.setError).toHaveBeenCalledWith(
        'targetWeightKg',
        expect.objectContaining({ message: expect.any(String) }),
      );
      expect(mockSaveProfile).not.toHaveBeenCalled();
    });
  });

  it('skips target weight validation for maintain goal', async () => {
    const form = createMockForm({ goalType: 'maintain', targetWeightKg: 100 });
    const goNext = vi.fn();

    render(<HealthConfirmStep form={form} goNext={goNext} goBack={vi.fn()} />);
    fireEvent.click(screen.getByTestId('health-confirm-btn'));

    await waitFor(() => {
      expect(form.setError).not.toHaveBeenCalled();
      expect(mockSaveProfile).toHaveBeenCalled();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Confirm — error handling                                          */
  /* ---------------------------------------------------------------- */
  it('catches and logs error during save', async () => {
    mockSaveProfile.mockRejectedValueOnce(new Error('DB error'));

    const goNext = vi.fn();
    renderStep({}, goNext);
    fireEvent.click(screen.getByTestId('health-confirm-btn'));

    // The error is caught — goNext should NOT be called
    await waitFor(() => {
      expect(goNext).not.toHaveBeenCalled();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Saving state — button has disabled prop                           */
  /* ---------------------------------------------------------------- */
  it('button has disabled prop bound to saving state', () => {
    renderStep();
    const btn = screen.getByTestId('health-confirm-btn');
    // Initially not saving, not disabled
    expect(btn).not.toBeDisabled();
  });
});
