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

/* ============ child component mocks ============ */
vi.mock('../features/dashboard/components/CombinedHero', () => ({
  CombinedHero: ({ orchestration }: { orchestration?: { heroMode?: string } }) => (
    <div data-testid="combined-hero">
      <div data-testid="combined-hero-mode">{orchestration?.heroMode ?? 'none'}</div>
      <div data-testid="nutrition-hero">NutritionSection</div>
      <div data-testid="weekly-snapshot">WeeklyStatsRow</div>
    </div>
  ),
}));

vi.mock('../features/dashboard/components/TodaysPlanCard', () => ({
  TodaysPlanCard: ({
    suppressPrimaryCtas,
    allowMealSlotActions,
  }: {
    suppressPrimaryCtas?: boolean;
    allowMealSlotActions?: boolean;
  }) => (
    <div
      data-testid="todays-plan-card"
      data-suppress-primary={String(Boolean(suppressPrimaryCtas))}
      data-allow-meal-actions={String(allowMealSlotActions ?? true)}
    >
      TodaysPlanCard
    </div>
  ),
}));

vi.mock('../features/dashboard/components/AiInsightCard', () => ({
  AiInsightCard: ({ suppressAction }: { suppressAction?: boolean }) => (
    <div data-testid="ai-insight-card" data-suppress-action={String(Boolean(suppressAction))}>
      AiInsightCard
    </div>
  ),
}));

vi.mock('../features/dashboard/components/TodaysPlanCardSkeleton', () => ({
  TodaysPlanCardSkeleton: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="todays-plan-card-skeleton" data-loading={String(isLoading)}>
      PlanSkeleton
    </div>
  ),
}));

vi.mock('../features/dashboard/components/AiInsightCardSkeleton', () => ({
  AiInsightCardSkeleton: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="ai-insight-card-skeleton" data-loading={String(isLoading)}>
      InsightSkeleton
    </div>
  ),
}));

let capturedQuickActionsOnLogWeight: (() => void) | undefined;
let orchestrationState = {
  heroMode: 'passive',
  heroContract: { copy: { title: 'review' } },
  showInsights: true,
  suppressInsightAction: false,
  showQuickActions: true,
  suppressPlanPrimaryActions: false,
  allowMealSlotActions: true,
};

vi.mock('../features/dashboard/components/QuickActionsBar', () => ({
  QuickActionsBar: ({ onLogWeight }: { onLogWeight?: () => void }) => {
    capturedQuickActionsOnLogWeight = onLogWeight;
    return (
      <div data-testid="quick-actions-bar" onClick={onLogWeight}>
        QuickActionsBar
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

/* ============ ErrorBoundary mock ============ */
vi.mock('../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children, fallbackTitle }: { children: React.ReactNode; fallbackTitle?: string }) => {
    try {
      return <div data-error-boundary={fallbackTitle}>{children}</div>;
    } catch {
      return <div data-testid="error-fallback">{fallbackTitle}</div>;
    }
  },
}));

vi.mock('../features/dashboard/hooks/useDashboardOrchestration', () => ({
  useDashboardOrchestration: () => orchestrationState,
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
  capturedQuickActionsOnLogWeight = undefined;
  capturedWeightQuickLogOnClose = undefined;
  orchestrationState = {
    heroMode: 'passive',
    heroContract: { copy: { title: 'review' } },
    showInsights: true,
    suppressInsightAction: false,
    showQuickActions: true,
    suppressPlanPrimaryActions: false,
    allowMealSlotActions: true,
  };
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
  describe('3-tier layout rendering', () => {
    it('renders the dashboard container', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
    });

    it('renders Tier 1: CombinedHero with NutritionSection and WeeklyStatsRow', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-tier-1')).toBeInTheDocument();
      expect(screen.getByTestId('combined-hero')).toBeInTheDocument();
      expect(screen.getByTestId('combined-hero-mode')).toHaveTextContent('passive');
      expect(screen.getByTestId('nutrition-hero')).toBeInTheDocument();
      expect(screen.getByTestId('weekly-snapshot')).toBeInTheDocument();
    });

    it('renders Tier 2: TodaysPlanCard and AiInsightCard', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-tier-2')).toBeInTheDocument();
      expect(screen.getByTestId('todays-plan-card')).toBeInTheDocument();
      expect(screen.getByTestId('todays-plan-card')).toHaveAttribute('data-suppress-primary', 'false');
      expect(screen.getByTestId('ai-insight-card')).toBeInTheDocument();
      expect(screen.getByTestId('ai-insight-card')).toHaveAttribute('data-suppress-action', 'false');
    });

    it('renders Tier 3: QuickActionsBar after lazy load', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-tier-3')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions-bar')).toBeInTheDocument();
    });

    it('shows placeholder before Tier 3 loads', () => {
      let result!: ReturnType<typeof render>;
      act(() => {
        result = render(<DashboardTab />);
      });
      expect(result.container.querySelector('[data-testid="dashboard-tier-3-placeholder"]')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-tier-3')).not.toBeInTheDocument();

      flushRaf();

      expect(screen.getByTestId('dashboard-tier-3')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-tier-3-placeholder')).not.toBeInTheDocument();
    });
  });

  describe('stagger animation', () => {
    it('applies dashboard-stagger class to Tier 2 when motion is allowed', () => {
      renderDashboard();
      const tier2 = screen.getByTestId('dashboard-tier-2');
      expect(tier2.className).toContain('dashboard-stagger');
    });

    it('applies 30ms animation-delay to Tier 2', () => {
      renderDashboard();
      const tier2 = screen.getByTestId('dashboard-tier-2');
      expect(tier2.style.animationDelay).toBe('30ms');
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
      expect(tier2.className).not.toContain('dashboard-stagger');
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

    it('responds to matchMedia change event', () => {
      const mockMM = createMatchMediaMock(false);
      Object.defineProperty(globalThis, 'matchMedia', {
        writable: true,
        value: mockMM,
      });

      renderDashboard();
      const tier2 = screen.getByTestId('dashboard-tier-2');
      expect(tier2.className).toContain('dashboard-stagger');

      const listeners = mockMM.mock.results[0]?.value._listeners;
      act(() => {
        for (const listener of listeners) {
          listener({ matches: true } as MediaQueryListEvent);
        }
      });
      flushRaf();

      expect(tier2.className).not.toContain('dashboard-stagger');
    });
  });

  describe('WeightQuickLog bottom sheet', () => {
    it('does not show WeightQuickLog by default', () => {
      renderDashboard();
      expect(screen.queryByTestId('weight-quick-log')).not.toBeInTheDocument();
    });

    it('opens WeightQuickLog when QuickActionsBar triggers onLogWeight', () => {
      renderDashboard();
      act(() => {
        fireEvent.click(screen.getByTestId('quick-actions-bar'));
      });
      expect(screen.getByTestId('weight-quick-log')).toBeInTheDocument();
    });

    it('closes WeightQuickLog when close callback is invoked', () => {
      renderDashboard();
      act(() => {
        fireEvent.click(screen.getByTestId('quick-actions-bar'));
      });
      expect(screen.getByTestId('weight-quick-log')).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByTestId('close-weight-log'));
      });
      expect(screen.queryByTestId('weight-quick-log')).not.toBeInTheDocument();
    });

    it('passes onLogWeight callback to QuickActionsBar', () => {
      renderDashboard();
      expect(capturedQuickActionsOnLogWeight).toBeTypeOf('function');
    });

    it('passes onClose callback to WeightQuickLog', () => {
      renderDashboard();
      act(() => {
        fireEvent.click(screen.getByTestId('quick-actions-bar'));
      });
      expect(capturedWeightQuickLogOnClose).toBeTypeOf('function');
    });
  });

  describe('CLS prevention', () => {
    it('Tier 3 placeholder has min-h-[56px] before lazy load', () => {
      let result!: ReturnType<typeof render>;
      act(() => {
        result = render(<DashboardTab />);
      });
      const placeholder = result.container.querySelector('[data-testid="dashboard-tier-3-placeholder"]');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder?.className).toContain('min-h-[56px]');
    });
  });

  describe('error isolation', () => {
    it('wraps each tier in an ErrorBoundary', () => {
      renderDashboard();
      const boundaries = screen.getByTestId('dashboard-tab').querySelectorAll('[data-error-boundary]');
      expect(boundaries.length).toBeGreaterThanOrEqual(3);
    });

    it('each ErrorBoundary has a distinct fallbackTitle', () => {
      renderDashboard();
      const boundaries = screen.getByTestId('dashboard-tab').querySelectorAll('[data-error-boundary]');
      const titles = Array.from(boundaries).map(el => el.getAttribute('data-error-boundary'));
      const uniqueTitles = new Set(titles.filter(Boolean));
      expect(uniqueTitles.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('React.memo', () => {
    it('exports a memoized component', async () => {
      const mod = await import('../features/dashboard/components/DashboardTab');
      expect(mod.DashboardTab.$$typeof).toBe(Symbol.for('react.memo'));
    });
  });

  describe('useReducedMotion SSR guard', () => {
    it('handles prefers-reduced-motion matching', () => {
      Object.defineProperty(globalThis, 'matchMedia', {
        writable: true,
        value: createMatchMediaMock(true),
      });
      renderDashboard();
      expect(screen.getByTestId('dashboard-tab')).toBeInTheDocument();
      Object.defineProperty(globalThis, 'matchMedia', {
        writable: true,
        value: createMatchMediaMock(false),
      });
    });
  });

  describe('orchestration behavior', () => {
    it('suppresses lower-priority actions when orchestration blocks the dashboard', () => {
      orchestrationState = {
        heroMode: 'blocking',
        heroContract: { copy: { title: 'setup' } },
        showInsights: false,
        suppressInsightAction: true,
        showQuickActions: false,
        suppressPlanPrimaryActions: true,
        allowMealSlotActions: false,
      };

      renderDashboard();

      expect(screen.getByTestId('combined-hero-mode')).toHaveTextContent('blocking');
      expect(screen.getByTestId('todays-plan-card')).toHaveAttribute('data-suppress-primary', 'true');
      expect(screen.getByTestId('todays-plan-card')).toHaveAttribute('data-allow-meal-actions', 'false');
      expect(screen.queryByTestId('ai-insight-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('quick-actions-bar')).not.toBeInTheDocument();
      expect(screen.getByTestId('dashboard-tier-3')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-tier-3-empty')).toBeInTheDocument();
    });
  });

  describe('skeleton → content transition (AC3)', () => {
    it('shows skeletons before RAF and content after', () => {
      let result!: ReturnType<typeof render>;
      act(() => {
        result = render(<DashboardTab />);
      });

      // Before RAF: skeletons visible
      expect(result.container.querySelector('[data-testid="todays-plan-card-skeleton"]')).toBeInTheDocument();
      expect(screen.queryByTestId('todays-plan-card')).not.toBeInTheDocument();

      // After RAF: content replaces skeletons
      flushRaf();
      expect(screen.queryByTestId('todays-plan-card-skeleton')).not.toBeInTheDocument();
      expect(screen.getByTestId('todays-plan-card')).toBeInTheDocument();
    });

    it('shows AiInsightCardSkeleton when insights enabled', () => {
      orchestrationState = { ...orchestrationState, showInsights: true };
      let result!: ReturnType<typeof render>;
      act(() => {
        result = render(<DashboardTab />);
      });

      expect(result.container.querySelector('[data-testid="ai-insight-card-skeleton"]')).toBeInTheDocument();

      flushRaf();
      expect(screen.queryByTestId('ai-insight-card-skeleton')).not.toBeInTheDocument();
      expect(screen.getByTestId('ai-insight-card')).toBeInTheDocument();
    });

    it('hides AiInsightCardSkeleton when insights disabled', () => {
      orchestrationState = { ...orchestrationState, showInsights: false };
      let result!: ReturnType<typeof render>;
      act(() => {
        result = render(<DashboardTab />);
      });

      expect(result.container.querySelector('[data-testid="ai-insight-card-skeleton"]')).not.toBeInTheDocument();
    });
  });

  describe('tier animation classes', () => {
    it('Tier 1 uses animate-slide-up', () => {
      renderDashboard();
      const tier1 = screen.getByTestId('dashboard-tier-1');
      expect(tier1.className).toContain('animate-slide-up');
    });

    it('Tier 2 uses dashboard-stagger', () => {
      renderDashboard();
      const tier2 = screen.getByTestId('dashboard-tier-2');
      expect(tier2.className).toContain('dashboard-stagger');
    });

    it('Tier 3 uses dashboard-stagger with 60ms delay', () => {
      renderDashboard();
      const tier3 = screen.getByTestId('dashboard-tier-3');
      expect(tier3.className).toContain('dashboard-stagger');
      expect(tier3.style.animationDelay).toBe('60ms');
    });
  });

  describe('reduced motion removes all animation classes', () => {
    it('no animation classes on any tier when reduced motion enabled', () => {
      Object.defineProperty(globalThis, 'matchMedia', {
        writable: true,
        value: createMatchMediaMock(true),
      });

      renderDashboard();
      const tier1 = screen.getByTestId('dashboard-tier-1');
      const tier2 = screen.getByTestId('dashboard-tier-2');
      const tier3 = screen.getByTestId('dashboard-tier-3');

      expect(tier1.className).not.toContain('animate-slide-up');
      expect(tier2.className).not.toContain('dashboard-stagger');
      expect(tier3.className).not.toContain('dashboard-stagger');
      expect(tier3.style.animationDelay).toBe('');
    });
  });

  describe('accessibility (AC6, AC11)', () => {
    it('dashboard container has aria-label', () => {
      renderDashboard();
      expect(screen.getByTestId('dashboard-tab')).toHaveAttribute('aria-label', 'dashboard.a11y.container');
    });

    it('focus order follows DOM: hero → plan → insight → quickActions', () => {
      renderDashboard();
      const tab = screen.getByTestId('dashboard-tab');
      const tiers = tab.querySelectorAll('[data-testid^="dashboard-tier-"]');
      expect(tiers.length).toBe(3);
      expect(tiers[0].getAttribute('data-testid')).toBe('dashboard-tier-1');
      expect(tiers[1].getAttribute('data-testid')).toBe('dashboard-tier-2');
      expect(tiers[2].getAttribute('data-testid')).toBe('dashboard-tier-3');
    });
  });
});
