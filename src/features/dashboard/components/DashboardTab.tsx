import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { AiInsightCard } from './AiInsightCard';
import { CombinedHero } from './CombinedHero';
import { QuickActionsBar } from './QuickActionsBar';
import { TodaysPlanCard } from './TodaysPlanCard';
import { WeightQuickLog } from './WeightQuickLog';

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    /* v8 ignore start -- SSR guard: globalThis.window is always defined in jsdom/browser */
    if (globalThis.window === undefined) return false;
    /* v8 ignore stop */
    return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = globalThis.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}

const STAGGER_DELAY_TIER2 = 30;

function DashboardTabInner(): React.ReactElement {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [weightQuickLogOpen, setWeightQuickLogOpen] = useState(false);
  const [lowerTiersVisible, setLowerTiersVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setLowerTiersVisible(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const handleOpenWeightLog = useCallback(() => setWeightQuickLogOpen(true), []);
  const handleCloseWeightLog = useCallback(() => setWeightQuickLogOpen(false), []);

  const staggerStyle = useCallback(
    (delayMs: number): React.CSSProperties => {
      if (reducedMotion) return {};
      return { animationDelay: `${delayMs}ms` };
    },
    [reducedMotion],
  );

  const tierClassName = reducedMotion ? '' : 'dashboard-stagger';

  return (
    <div className="flex flex-col gap-3 overflow-y-auto pb-6" data-testid="dashboard-tab">
      {/* Tier 1: CombinedHero — immediate */}
      <ErrorBoundary fallbackTitle={t('dashboard.error.hero')}>
        <div data-testid="dashboard-tier-1">
          <CombinedHero />
        </div>
      </ErrorBoundary>

      {/* Tier 2: TodaysPlanCard + AiInsightCard — 30ms stagger */}
      <ErrorBoundary fallbackTitle={t('dashboard.error.plan')}>
        <div
          className={`flex flex-col gap-3 ${tierClassName}`}
          data-testid="dashboard-tier-2"
          style={staggerStyle(STAGGER_DELAY_TIER2)}
        >
          <TodaysPlanCard />
          <AiInsightCard />
        </div>
      </ErrorBoundary>

      {/* Tier 3: QuickActionsBar — lazy, RAF-gated */}
      {lowerTiersVisible ? (
        <ErrorBoundary fallbackTitle={t('dashboard.error.quickActions')}>
          <div className="flex flex-col gap-3" data-testid="dashboard-tier-3">
            <QuickActionsBar onLogWeight={handleOpenWeightLog} />
          </div>
        </ErrorBoundary>
      ) : (
        <div className="min-h-[56px]" data-testid="dashboard-tier-3-placeholder" aria-hidden="true" />
      )}

      {/* WeightQuickLog bottom sheet */}
      {weightQuickLogOpen && <WeightQuickLog onClose={handleCloseWeightLog} />}
    </div>
  );
}

export const DashboardTab = React.memo(DashboardTabInner);
