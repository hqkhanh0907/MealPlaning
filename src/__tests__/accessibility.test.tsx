import { render, screen, fireEvent } from '@testing-library/react';
import type { Mock } from 'vitest';
import { useFitnessStore } from '../store/fitnessStore';
import { useNavigationStore } from '../store/navigationStore';

// ── Mocks ──────────────────────────────────────────────────────────

vi.mock('../store/fitnessStore', () => ({
  useFitnessStore: vi.fn(),
}));

vi.mock('../store/navigationStore', () => ({
  useNavigationStore: vi.fn(),
}));

vi.mock('../features/dashboard/hooks/useTodaysPlan', () => ({
  useTodaysPlan: vi.fn(() => ({
    state: 'rest-day',
    mealsLogged: 1,
    totalMealsPlanned: 3,
    hasReachedTarget: false,
    nextMealToLog: 'lunch',
    tomorrowWorkoutType: 'Push Day',
    tomorrowExerciseCount: 4,
  })),
}));

vi.mock('../contexts/NotificationContext', () => ({
  useNotification: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismissAll: vi.fn(),
  }),
}));

vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

vi.mock('../components/shared/ModalBackdrop', () => ({
  ModalBackdrop: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-backdrop">{children}</div>
  ),
}));

// ── Store helpers ──────────────────────────────────────────────────

const mockFitnessStore = useFitnessStore as unknown as Mock;
const mockNavStore = useNavigationStore as unknown as Mock;

function setupFitnessStore(overrides: Record<string, unknown> = {}) {
  const state: Record<string, unknown> = {
    workouts: [],
    workoutSets: [],
    weightEntries: [],
    trainingProfile: null,
    trainingPlans: [],
    trainingPlanDays: [],
    isOnboarded: true,
    setOnboarded: vi.fn(),
    addWeightEntry: vi.fn(),
    updateWeightEntry: vi.fn(),
    removeWeightEntry: vi.fn(),
    getActivePlan: () => undefined,
    getLatestWeight: () => undefined,
    ...overrides,
  };
  mockFitnessStore.mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) => selector(state),
  );
}

function setupNavStore() {
  mockNavStore.mockImplementation(
    (selector: (s: Record<string, unknown>) => unknown) =>
      selector({ pushPage: vi.fn() }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setupFitnessStore();
  setupNavStore();
});

// ── Imports (after mocks) ──────────────────────────────────────────

import { WorkoutHistory } from '../features/fitness/components/WorkoutHistory';
import { ProgressDashboard } from '../features/fitness/components/ProgressDashboard';
import { RestTimer } from '../features/fitness/components/RestTimer';
import { PRToast } from '../features/fitness/components/PRToast';
import { MilestonesList } from '../features/fitness/components/MilestonesList';
import { TrainingPlanView } from '../features/fitness/components/TrainingPlanView';
import { TodaysPlanCard } from '../features/dashboard/components/TodaysPlanCard';
import { StreakMini } from '../features/dashboard/components/StreakMini';
import { WeightQuickLog } from '../features/dashboard/components/WeightQuickLog';
import { AutoAdjustBanner } from '../features/dashboard/components/AutoAdjustBanner';
import { AdjustmentHistory } from '../features/dashboard/components/AdjustmentHistory';
import { EnergyBalanceMini } from '../components/nutrition/EnergyBalanceMini';

// ── 1. WorkoutHistory ─────────────────────────────────────────────

describe('WorkoutHistory a11y', () => {
  it('chevron icons inside expand buttons have aria-hidden', () => {
    const workout = {
      id: 'w1',
      date: new Date().toISOString().split('T')[0],
      name: 'Push Day',
      durationMin: 45,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setupFitnessStore({ workouts: [workout], workoutSets: [] });

    render(<WorkoutHistory />);

    const toggle = screen.getByTestId(`workout-toggle-${workout.id}`);
    const svgs = toggle.querySelectorAll('svg');
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('expand buttons have aria-expanded and accessible name', () => {
    const workout = {
      id: 'w1',
      date: new Date().toISOString().split('T')[0],
      name: 'Push Day',
      durationMin: 45,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setupFitnessStore({ workouts: [workout], workoutSets: [] });

    render(<WorkoutHistory />);

    const toggle = screen.getByTestId(`workout-toggle-${workout.id}`);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-label');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});

// ── 2. ProgressDashboard ──────────────────────────────────────────

describe('ProgressDashboard a11y', () => {
  const workouts = [
    {
      id: 'w1',
      date: new Date().toISOString().split('T')[0],
      name: 'Push',
      durationMin: 30,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    setupFitnessStore({
      workouts,
      workoutSets: [
        {
          id: 's1',
          workoutId: 'w1',
          exerciseId: 'bench',
          setNumber: 1,
          weightKg: 60,
          reps: 10,
          restSeconds: 90,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      weightEntries: [
        {
          id: 'we1',
          date: new Date().toISOString().split('T')[0],
          weightKg: 75,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      trainingProfile: { daysPerWeek: 4 },
      trainingPlans: [
        {
          id: 'p1',
          status: 'active',
          startDate: new Date().toISOString().split('T')[0],
          durationWeeks: 8,
        },
      ],
      getActivePlan: () => ({
        id: 'p1',
        status: 'active',
        startDate: new Date().toISOString().split('T')[0],
        durationWeeks: 8,
      }),
    });
  });

  it('metric card buttons have aria-labels', () => {
    render(<ProgressDashboard />);

    const cards = ['weight', '1rm', 'adherence', 'sessions'];
    cards.forEach((card) => {
      const btn = screen.getByTestId(`metric-card-${card}`);
      expect(btn).toHaveAttribute('aria-label');
      expect(btn.getAttribute('aria-label')).not.toBe('');
    });
  });

  it('decorative icons in metric cards have aria-hidden', () => {
    render(<ProgressDashboard />);

    const cards = ['weight', '1rm', 'adherence', 'sessions'];
    cards.forEach((card) => {
      const btn = screen.getByTestId(`metric-card-${card}`);
      const svg = btn.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('cycle progress bar uses native progress element', () => {
    render(<ProgressDashboard />);

    const progress = document.querySelector('progress');
    expect(progress).toBeInTheDocument();
    expect(progress).toHaveAttribute('value');
    expect(progress).toHaveAttribute('max', '100');
    expect(progress).toHaveAttribute('aria-label');
  });

  it('trend icons have aria-hidden', () => {
    render(<ProgressDashboard />);

    const heroCard = screen.getByTestId('hero-metric-card');
    const svgs = heroCard.querySelectorAll('svg');
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('bottom sheet close button has aria-label', () => {
    render(<ProgressDashboard />);

    fireEvent.click(screen.getByTestId('metric-card-weight'));
    const closeBtn = screen.getByTestId('close-bottom-sheet');
    expect(closeBtn).toHaveAttribute('aria-label');
  });
});

// ── 3. RestTimer ──────────────────────────────────────────────────

describe('RestTimer a11y', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('SVG progress ring has role=progressbar with ARIA attrs', () => {
    render(
      <RestTimer
        durationSeconds={90}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    const ring = screen.getByTestId('progress-ring');
    expect(ring).toHaveAttribute('aria-valuenow');
    expect(ring).toHaveAttribute('aria-valuemax', '100');
    expect(ring).toHaveAttribute('aria-label');
  });

  it('dialog has correct ARIA attributes', () => {
    render(
      <RestTimer
        durationSeconds={90}
        onComplete={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    const overlay = screen.getByTestId('rest-timer-overlay');
    expect(overlay).toHaveAttribute('aria-modal', 'true');
    expect(overlay).toHaveAttribute('aria-label');
  });
});

// ── 4. PRToast ────────────────────────────────────────────────────

describe('PRToast a11y', () => {
  const pr = {
    exerciseId: 'ex1',
    exerciseName: 'Bench Press',
    newWeight: 100,
    reps: 5,
    improvement: 5,
    previousWeight: 95,
    previousReps: 5,
  };

  it('renders as a button and is click-dismissible', () => {
    const onDismiss = vi.fn();
    render(<PRToast pr={pr} onDismiss={onDismiss} />);

    const toast = screen.getByTestId('pr-toast');
    expect(toast.tagName).toBe('BUTTON');
    expect(toast).toHaveAttribute('aria-label');

    fireEvent.click(toast);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('trophy icon has aria-hidden', () => {
    render(<PRToast pr={pr} onDismiss={vi.fn()} />);

    const toast = screen.getByTestId('pr-toast');
    const svg = toast.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});

// ── 5. MilestonesList ─────────────────────────────────────────────

describe('MilestonesList a11y', () => {
  it('toggle button has aria-expanded', () => {
    render(<MilestonesList />);

    const toggle = screen.getByTestId('milestones-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('progress bar has role=progressbar with ARIA value attrs when milestones exist', () => {
    setupFitnessStore({
      workouts: [
        {
          id: 'w1',
          date: '2025-01-01',
          name: 'Push',
          durationMin: 30,
          notes: '',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ],
      trainingPlans: [],
      trainingPlanDays: [],
    });

    render(<MilestonesList />);
    fireEvent.click(screen.getByTestId('milestones-toggle'));

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveAttribute('aria-valuenow');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-label');
  });
});

// ── 6. TrainingPlanView ───────────────────────────────────────────

describe('TrainingPlanView a11y', () => {
  it('no-plan decorative icon has aria-hidden', () => {
    setupFitnessStore({ trainingPlans: [], trainingPlanDays: [] });
    render(<TrainingPlanView onGeneratePlan={vi.fn()} />);

    const noPlanCta = screen.getByTestId('no-plan-cta');
    const svg = noPlanCta.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});

// ── 7. TodaysPlanCard ─────────────────────────────────────────────

describe('TodaysPlanCard a11y', () => {
  it('decorative emojis have aria-hidden wrappers', () => {
    render(<TodaysPlanCard />);

    const recoveryTips = screen.getByTestId('recovery-tips');
    const emojiSpans = recoveryTips.querySelectorAll('[aria-hidden="true"]');
    expect(emojiSpans.length).toBeGreaterThanOrEqual(2);
  });

  it('decorative icons have aria-hidden', () => {
    render(<TodaysPlanCard />);

    const card = screen.getByTestId('todays-plan-card');
    const svgs = card.querySelectorAll('svg');
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});

// ── 8. StreakMini ──────────────────────────────────────────────────

describe('StreakMini a11y', () => {
  it('empty state has role=button with aria-label and focus ring', () => {
    render(<StreakMini onTap={vi.fn()} />);

    const el = screen.getByTestId('streak-mini-empty');
    expect(el).toHaveAttribute('tabindex', '0');
    expect(el).toHaveAttribute('aria-label');
    expect(el.className).toContain('focus:ring-2');
  });

  it('main state has role=button with aria-label and focus ring', () => {
    setupFitnessStore({
      workouts: [
        {
          id: 'w1',
          date: new Date().toISOString().split('T')[0],
          name: 'Push',
          durationMin: 30,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      trainingPlans: [],
      trainingPlanDays: [],
    });

    render(<StreakMini onTap={vi.fn()} />);

    const el = screen.getByTestId('streak-mini');
    expect(el).toHaveAttribute('aria-label');
    expect(el.className).toContain('focus:ring-2');
  });

  it('responds to click activation', () => {
    const onTap = vi.fn();
    render(<StreakMini onTap={onTap} />);

    const el = screen.getByTestId('streak-mini-empty');
    fireEvent.click(el);
    expect(onTap).toHaveBeenCalledTimes(1);
  });
});

// ── 9. WeightQuickLog ─────────────────────────────────────────────

describe('WeightQuickLog a11y', () => {
  beforeEach(() => {
    setupFitnessStore({
      weightEntries: [
        {
          id: 'we1',
          date: new Date().toISOString().split('T')[0],
          weightKg: 75,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
  });

  it('dialog has role and aria-label', () => {
    render(<WeightQuickLog onClose={vi.fn()} />);

    const dialog = screen.getByTestId('weight-quick-log');
    expect(dialog).toHaveAttribute('aria-label');
  });

  it('close button meets 44px touch target and has aria-label', () => {
    render(<WeightQuickLog onClose={vi.fn()} />);

    const closeBtn = screen.getByTestId('close-btn');
    expect(closeBtn).toHaveAttribute('aria-label');
    expect(closeBtn.className).toContain('h-11');
    expect(closeBtn.className).toContain('w-11');
  });

  it('increment/decrement buttons have aria-labels', () => {
    render(<WeightQuickLog onClose={vi.fn()} />);

    expect(screen.getByTestId('increment-btn')).toHaveAttribute('aria-label');
    expect(screen.getByTestId('decrement-btn')).toHaveAttribute('aria-label');
  });
});

// ── 10. AutoAdjustBanner ──────────────────────────────────────────

describe('AutoAdjustBanner a11y', () => {
  const adjustment = {
    id: 'a1',
    reason: 'Weight is increasing as expected',
    oldTargetCal: 2000,
    newTargetCal: 2100,
    triggerType: 'auto' as const,
    movingAvgWeight: 75.5,
    date: new Date().toISOString(),
  };

  it('has role=alert with aria-label', () => {
    render(
      <AutoAdjustBanner
        adjustment={adjustment}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    const banner = screen.getByTestId('auto-adjust-banner');
    expect(banner).toHaveAttribute('role', 'alert');
    expect(banner).toHaveAttribute('aria-label');
  });

  it('icon has aria-hidden', () => {
    render(
      <AutoAdjustBanner
        adjustment={adjustment}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    const icon = screen.getByTestId('banner-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});

// ── 11. AdjustmentHistory ─────────────────────────────────────────

describe('AdjustmentHistory a11y', () => {
  const adjustments = [
    {
      id: 'a1',
      date: '2025-01-15T00:00:00Z',
      reason: 'Weight stalled',
      oldTargetCal: 2000,
      newTargetCal: 1900,
      triggerType: 'auto' as const,
      applied: true,
    },
    {
      id: 'a2',
      date: '2025-01-10T00:00:00Z',
      reason: 'Weight increasing',
      oldTargetCal: 2100,
      newTargetCal: 2200,
      triggerType: 'manual' as const,
      applied: false,
    },
  ];

  it('toggle button has aria-expanded that toggles', () => {
    render(
      <AdjustmentHistory adjustments={adjustments} defaultCollapsed />,
    );

    const toggle = screen.getByTestId('adjustment-history-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('chevron icons have aria-hidden', () => {
    render(
      <AdjustmentHistory adjustments={adjustments} defaultCollapsed />,
    );

    const toggle = screen.getByTestId('adjustment-history-toggle');
    const svg = toggle.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('status icons and trend icons have aria-hidden when expanded', () => {
    render(
      <AdjustmentHistory
        adjustments={adjustments}
        defaultCollapsed={false}
      />,
    );

    const rows = screen.getAllByTestId(/^adjustment-row-/);
    rows.forEach((row) => {
      const svgs = row.querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});

// ── 12. EnergyBalanceMini ─────────────────────────────────────────

describe('EnergyBalanceMini a11y', () => {
  it('decorative icons have aria-hidden', () => {
    render(
      <EnergyBalanceMini eaten={1500} burned={300} target={2000} />,
    );

    const container = screen.getByTestId('energy-balance-mini');
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(3);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('when interactive, has role=button with aria-label and focus ring', () => {
    render(
      <EnergyBalanceMini
        eaten={1500}
        burned={300}
        target={2000}
        onTapDetail={vi.fn()}
      />,
    );

    const container = screen.getByTestId('energy-balance-mini');
    expect(container).toHaveAttribute('aria-label');
    expect(container.className).toContain('focus:ring-2');
  });

  it('when non-interactive, has no role or tabIndex', () => {
    render(
      <EnergyBalanceMini eaten={1500} burned={300} target={2000} />,
    );

    const container = screen.getByTestId('energy-balance-mini');
    expect(container.tagName).toBe('DIV');
    expect(container).not.toHaveAttribute('tabIndex');
  });

  it('responds to click activation when interactive', () => {
    const onTap = vi.fn();
    render(
      <EnergyBalanceMini
        eaten={1500}
        burned={300}
        target={2000}
        onTapDetail={onTap}
      />,
    );

    const container = screen.getByTestId('energy-balance-mini');
    fireEvent.click(container);
    expect(onTap).toHaveBeenCalledTimes(1);
  });
});
