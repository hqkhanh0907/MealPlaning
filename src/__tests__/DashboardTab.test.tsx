import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* ============ i18n mock ============ */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi' },
  }),
}));

/* ============ store mocks ============ */
vi.mock('../store/dayPlanStore', () => ({
  useDayPlanStore: vi.fn((sel: (s: Record<string, unknown>) => unknown) => sel({ dayPlans: [] })),
}));

vi.mock('../store/dishStore', () => ({
  useDishStore: vi.fn((sel: (s: Record<string, unknown>) => unknown) => sel({ dishes: [] })),
}));

vi.mock('../store/ingredientStore', () => ({
  useIngredientStore: vi.fn((sel: (s: Record<string, unknown>) => unknown) => sel({ ingredients: [] })),
}));

/* ============ hook mocks ============ */
const mockApply = vi.fn();
const mockDismiss = vi.fn();
let mockAdjustment: unknown = null;
let mockTodayCaloriesOut = 0;

vi.mock('../hooks/useTodayCaloriesOut', () => ({
  useTodayCaloriesOut: () => mockTodayCaloriesOut,
}));

vi.mock('../features/dashboard/hooks/useFeedbackLoop', () => ({
  useFeedbackLoop: () => ({
    movingAverage: null,
    adjustment: mockAdjustment,
    adherence: { calorie: 0, protein: 0 },
    applyAdjustment: mockApply,
    dismissAdjustment: mockDismiss,
  }),
}));

vi.mock('../features/health-profile/hooks/useNutritionTargets', () => ({
  useNutritionTargets: () => ({
    targetCalories: 2000,
    targetProtein: 150,
    targetFat: 60,
    targetCarbs: 250,
    bmr: 1700,
    tdee: 2200,
  }),
}));

vi.mock('../utils/nutrition', () => ({
  calculateDishesNutrition: () => ({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  }),
}));

/* ============ child component mocks ============ */
vi.mock('../features/dashboard/components/DailyScoreHero', () => ({
  DailyScoreHero: () => <div data-testid="daily-score-hero">DailyScoreHero</div>,
}));

let capturedEnergyBalanceMiniOnTapDetail: (() => void) | undefined;
vi.mock('../components/nutrition/EnergyBalanceMini', () => ({
  EnergyBalanceMini: (props: { eaten: number; burned: number; target: number; onTapDetail?: () => void }) => {
    capturedEnergyBalanceMiniOnTapDetail = props.onTapDetail;
    return (
      <div
        data-testid="energy-balance-mini"
        data-eaten={props.eaten}
        data-burned={props.burned}
        data-target={props.target}
        onClick={props.onTapDetail}
      >
        EnergyBalanceMini
      </div>
    );
  },
}));

vi.mock('../features/dashboard/components/ProteinProgress', () => ({
  ProteinProgress: (props: { current: number; target: number }) => (
    <div data-testid="protein-progress" data-current={props.current} data-target={props.target}>
      ProteinProgress
    </div>
  ),
}));

vi.mock('../features/dashboard/components/TodaysPlanCard', () => ({
  TodaysPlanCard: () => <div data-testid="todays-plan-card">TodaysPlanCard</div>,
}));

let capturedWeightMiniOnTap: (() => void) | undefined;
vi.mock('../features/dashboard/components/WeightMini', () => ({
  WeightMini: ({ onTap }: { onTap?: () => void }) => {
    capturedWeightMiniOnTap = onTap;
    return (
      <div data-testid="weight-mini" onClick={onTap}>
        WeightMini
      </div>
    );
  },
}));

vi.mock('../features/dashboard/components/StreakMini', () => ({
  StreakMini: () => <div data-testid="streak-mini">StreakMini</div>,
}));

vi.mock('../features/dashboard/components/AiInsightCard', () => ({
  AiInsightCard: () => <div data-testid="ai-insight-card">AiInsightCard</div>,
}));

vi.mock('../features/dashboard/components/QuickActionsBar', () => ({
  QuickActionsBar: () => <div data-testid="quick-actions-bar">QuickActionsBar</div>,
}));

let capturedEnergyDetailSheetOnClose: (() => void) | undefined;
vi.mock('../components/nutrition/EnergyDetailSheet', () => ({
  EnergyDetailSheet: ({ onClose }: { onClose: () => void }) => {
    capturedEnergyDetailSheetOnClose = onClose;
    return (
      <div data-testid="energy-detail-sheet">
        <button data-testid="close-energy-detail" onClick={onClose}>
          Close
        </button>
      </div>
    );
  },
}));

let capturedWeightQuickLogOnClose: (() => void) | undefined;
vi.mock('../features/dashboard/components/WeightQuickLog', () => ({
  WeightQuickLog: ({ onClose }: { onClose: () => void }) => {
    capturedWeightQuickLogOnClose = onClose;
    return (
      <div data-testid="weight-quick-log">
        <button data-testid="close-weight-log" onClick={onClose}>
          Close
        </button>
      </div>
    );
  },
}));

vi.mock('../features/dashboard/components/AutoAdjustBanner', () => ({
  AutoAdjustBanner: (props: { onApply: () => void; onDismiss: () => void }) => (
    <div data-testid="auto-adjust-banner">
      <button data-testid="apply-btn" onClick={props.onApply}>
        Apply
      </button>
      <button data-testid="dismiss-btn" onClick={props.onDismiss}>
        Dismiss
      </button>
    </div>
  ),
}));

/* ============ ErrorBoundary: use real implementation ============ */
vi.mock('../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children, fallbackTitle }: { children: React.ReactNode; fallbackTitle?: string }) => {
    try {
      return <div data-error-boundary={fallbackTitle}>{children}</div>;
    } catch {
      return <div data-testid="error-fallback">{fallbackTitle}</div>;
    }
  },
}));

/* ============ import component under test ============ */
import { DashboardTab } from '../features/dashboard/components/DashboardTab';

/* ============ matchMedia mock ============ */
function createMatchMediaMock(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
      listeners.push(handler);
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    _listeners: listeners,
  }));
}

/* ============ raf helper ============ */
function flushRaf() {
  act(() => {
    vi.advanceTimersByTime(20);
  });
}

/* ============ setup / teardown ============ */
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mockAdjustment = null;
  mockTodayCaloriesOut = 0;
  capturedWeightMiniOnTap = undefined;
  capturedWeightQuickLogOnClose = undefined;
  capturedEnergyBalanceMiniOnTapDetail = undefined;
  capturedEnergyDetailSheetOnClose = undefined;
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: createMatchMediaMock(false),
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/* ============ render helper ============ */
function renderDashboard() {
  let result!: ReturnType<typeof render>;
  act(() => {
    result = render(<DashboardTab />);
  });
  flushRaf();
  return result;
}

/* ================================================================ */
/* TEST SUITE */
/* ================================================================ */

describe('DashboardTab', () => {
  describe('5-tier layout rendering', () => {
    it('renders the dashboard container', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
    });

    it('renders Tier 1: DailyScoreHero', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-tier-1')).toBeInTheDocument();
      expect(screen.getByTestId('daily-score-hero')).toBeInTheDocument();
    });

    it('renders Tier 2: EnergyBalanceMini and ProteinProgress', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-tier-2')).toBeInTheDocument();
      expect(screen.getByTestId('energy-balance-mini')).toBeInTheDocument();
      expect(screen.getByTestId('protein-progress')).toBeInTheDocument();
    });

    it('renders Tier 3: TodaysPlanCard, WeightMini, StreakMini', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-tier-3')).toBeInTheDocument();
      expect(screen.getByTestId('todays-plan-card')).toBeInTheDocument();
      expect(screen.getByTestId('weight-mini')).toBeInTheDocument();
      expect(screen.getByTestId('streak-mini')).toBeInTheDocument();
    });

    it('renders Tier 4: AiInsightCard after lazy load', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-tier-4')).toBeInTheDocument();
      expect(screen.getByTestId('ai-insight-card')).toBeInTheDocument();
    });

    it('renders Tier 5: QuickActionsBar after lazy load', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-tier-5')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('shows placeholder before lazy tiers load', () => {
      let result!: ReturnType<typeof render>;
      act(() => {
        result = render(<DashboardTab />);
      });
      expect(result.container.querySelector('[data-testid="dashboard-tier-4-placeholder"]')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-tier-4')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-tier-5')).not.toBeInTheDocument();

      flushRaf();

      expect(screen.getByTestId('dashboard-tier-4')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-tier-5')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-tier-4-placeholder')).not.toBeInTheDocument();
    });

    it('WeightMini and StreakMini are in a side-by-side grid row', () => {
      renderDashboard();
      const weightMini = screen.getByTestId('weight-mini');
      const streakMini = screen.getByTestId('streak-mini');
      const parent = weightMini.parentElement;
      expect(parent).toBe(streakMini.parentElement);
      expect(parent?.className).toContain('grid-cols-2');
    });
  });

  describe('stagger animation', () => {
    it('applies dashboard-stagger class to Tier 2 when motion is allowed', () => {
      renderDashboard();
      const tier2 = screen.getByTestId('dashboard-tier-2');
      expect(tier2.className).toContain('dashboard-stagger');
    });

    it('applies dashboard-stagger class to Tier 3 when motion is allowed', () => {
      renderDashboard();
      const tier3 = screen.getByTestId('dashboard-tier-3');
      expect(tier3.className).toContain('dashboard-stagger');
    });

    it('applies 30ms animation-delay to Tier 2', () => {
      renderDashboard();
      const tier2 = screen.getByTestId('dashboard-tier-2');
      expect(tier2.style.animationDelay).toBe('30ms');
    });

    it('applies 60ms animation-delay to Tier 3', () => {
      renderDashboard();
      const tier3 = screen.getByTestId('dashboard-tier-3');
      expect(tier3.style.animationDelay).toBe('60ms');
    });

    it('Tier 1 has no stagger class (renders immediately)', () => {
      renderDashboard();
      const tier1 = screen.getByTestId('dashboard-tier-1');
      expect(tier1.className).not.toContain('dashboard-stagger');
    });
  });

  describe('prefers-reduced-motion', () => {
    it('skips stagger classes when reduced motion is enabled', () => {
      Object.defineProperty(globalThis, 'matchMedia', {
        writable: true,
        value: createMatchMediaMock(true),
      });

      renderDashboard();
      const tier2 = screen.getByTestId('dashboard-tier-2');
      const tier3 = screen.getByTestId('dashboard-tier-3');
      expect(tier2.className).not.toContain('dashboard-stagger');
      expect(tier3.className).not.toContain('dashboard-stagger');
    });

    it('omits animation-delay style when reduced motion is enabled', () => {
      Object.defineProperty(globalThis, 'matchMedia', {
        writable: true,
        value: createMatchMediaMock(true),
      });

      renderDashboard();
      const tier2 = screen.getByTestId('dashboard-tier-2');
      expect(tier2.style.animationDelay).toBe('');
    });
  });

  describe('WeightQuickLog bottom sheet', () => {
    it('does not show WeightQuickLog by default', () => {
      renderDashboard();
      expect(screen.queryByTestId('weight-quick-log')).not.toBeInTheDocument();
    });

    it('opens WeightQuickLog when WeightMini is tapped', () => {
      renderDashboard();
      act(() => {
        fireEvent.click(screen.getByTestId('weight-mini'));
      });
      expect(screen.getByTestId('weight-quick-log')).toBeInTheDocument();
    });

    it('closes WeightQuickLog when close callback is invoked', () => {
      renderDashboard();
      act(() => {
        fireEvent.click(screen.getByTestId('weight-mini'));
      });
      expect(screen.getByTestId('weight-quick-log')).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByTestId('close-weight-log'));
      });
      expect(screen.queryByTestId('weight-quick-log')).not.toBeInTheDocument();
    });

    it('passes onTap callback to WeightMini', () => {
      renderDashboard();
      expect(capturedWeightMiniOnTap).toBeTypeOf('function');
    });

    it('passes onClose callback to WeightQuickLog', () => {
      renderDashboard();
      act(() => {
        fireEvent.click(screen.getByTestId('weight-mini'));
      });
      expect(capturedWeightQuickLogOnClose).toBeTypeOf('function');
    });
  });

  describe('EnergyDetailSheet bottom sheet', () => {
    it('does not show EnergyDetailSheet by default', () => {
      renderDashboard();
      expect(screen.queryByTestId('energy-detail-sheet')).not.toBeInTheDocument();
    });

    it('passes onTapDetail callback to EnergyBalanceMini', () => {
      renderDashboard();
      expect(capturedEnergyBalanceMiniOnTapDetail).toBeTypeOf('function');
    });

    it('opens EnergyDetailSheet when EnergyBalanceMini tap detail is triggered', () => {
      renderDashboard();
      act(() => {
        fireEvent.click(screen.getByTestId('energy-balance-mini'));
      });
      expect(screen.getByTestId('energy-detail-sheet')).toBeInTheDocument();
    });

    it('closes EnergyDetailSheet when onClose is called', () => {
      renderDashboard();
      act(() => {
        fireEvent.click(screen.getByTestId('energy-balance-mini'));
      });
      expect(screen.getByTestId('energy-detail-sheet')).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByTestId('close-energy-detail'));
      });
      expect(screen.queryByTestId('energy-detail-sheet')).not.toBeInTheDocument();
    });

    it('passes onClose callback to EnergyDetailSheet', () => {
      renderDashboard();
      act(() => {
        fireEvent.click(screen.getByTestId('energy-balance-mini'));
      });
      expect(capturedEnergyDetailSheetOnClose).toBeTypeOf('function');
    });
  });

  describe('AutoAdjustBanner', () => {
    it('does not show banner when no adjustment exists', () => {
      mockAdjustment = null;
      renderDashboard();
      expect(screen.queryByTestId('auto-adjust-banner')).not.toBeInTheDocument();
    });

    it('shows AutoAdjustBanner when adjustment exists', () => {
      mockAdjustment = {
        reason: 'Weight loss has stalled during cut phase',
        oldTargetCal: 2000,
        newTargetCal: 1850,
        triggerType: 'auto',
        movingAvgWeight: 75.5,
      };
      renderDashboard();
      expect(screen.getByTestId('auto-adjust-banner')).toBeInTheDocument();
    });

    it('calls applyAdjustment when Apply is clicked', () => {
      mockAdjustment = {
        reason: 'Stalled',
        oldTargetCal: 2000,
        newTargetCal: 1850,
        triggerType: 'auto',
        movingAvgWeight: 75.5,
      };
      renderDashboard();
      act(() => {
        fireEvent.click(screen.getByTestId('apply-btn'));
      });
      expect(mockApply).toHaveBeenCalledOnce();
    });

    it('calls dismissAdjustment when Dismiss is clicked', () => {
      mockAdjustment = {
        reason: 'Stalled',
        oldTargetCal: 2000,
        newTargetCal: 1850,
        triggerType: 'auto',
        movingAvgWeight: 75.5,
      };
      renderDashboard();
      act(() => {
        fireEvent.click(screen.getByTestId('dismiss-btn'));
      });
      expect(mockDismiss).toHaveBeenCalledOnce();
    });
  });

  describe('CLS prevention', () => {
    it('Tier 4 placeholder has min-h-[56px] before lazy load', () => {
      let result!: ReturnType<typeof render>;
      act(() => {
        result = render(<DashboardTab />);
      });
      const placeholder = result.container.querySelector('[data-testid="dashboard-tier-4-placeholder"]');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder?.className).toContain('min-h-[56px]');
    });

    it('Tier 4 container has min-h-[56px] after lazy load', () => {
      renderDashboard();
      const tier4 = screen.getByTestId('dashboard-tier-4');
      expect(tier4.className).toContain('min-h-[56px]');
    });
  });

  describe('error isolation', () => {
    it('wraps each tier in an ErrorBoundary', () => {
      renderDashboard();
      const boundaries = screen.getByTestId('dashboard-tab').querySelectorAll('[data-error-boundary]');
      expect(boundaries.length).toBeGreaterThanOrEqual(5);
    });

    it('each ErrorBoundary has a distinct fallbackTitle', () => {
      renderDashboard();
      const boundaries = screen.getByTestId('dashboard-tab').querySelectorAll('[data-error-boundary]');
      const titles = Array.from(boundaries).map(el => el.getAttribute('data-error-boundary'));
      const uniqueTitles = new Set(titles.filter(Boolean));
      expect(uniqueTitles.size).toBeGreaterThanOrEqual(5);
    });
  });

  describe('data flow', () => {
    it('passes nutrition data to EnergyBalanceMini', () => {
      renderDashboard();
      const eb = screen.getByTestId('energy-balance-mini');
      expect(eb.getAttribute('data-target')).toBe('2000');
    });

    it('passes burned calories from useTodayCaloriesOut to EnergyBalanceMini', () => {
      mockTodayCaloriesOut = 350;
      renderDashboard();
      const eb = screen.getByTestId('energy-balance-mini');
      expect(eb.getAttribute('data-burned')).toBe('350');
    });

    it('passes zero burned when no workouts today', () => {
      mockTodayCaloriesOut = 0;
      renderDashboard();
      const eb = screen.getByTestId('energy-balance-mini');
      expect(eb.getAttribute('data-burned')).toBe('0');
    });

    it('passes nutrition data to ProteinProgress', () => {
      renderDashboard();
      const pp = screen.getByTestId('protein-progress');
      expect(pp.getAttribute('data-target')).toBe('150');
    });
  });

  describe('React.memo', () => {
    it('exports a memoized component', async () => {
      const mod = await import('../features/dashboard/components/DashboardTab');
      expect(mod.DashboardTab.$$typeof).toBe(Symbol.for('react.memo'));
    });
  });
});
