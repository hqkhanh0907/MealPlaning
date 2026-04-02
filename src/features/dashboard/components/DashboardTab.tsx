import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { EnergyBalanceMini } from '../../../components/nutrition/EnergyBalanceMini';
import { useTodayNutrition } from '../../../hooks/useTodayNutrition';
import { useNutritionTargets } from '../../health-profile/hooks/useNutritionTargets';
import { useFeedbackLoop } from '../hooks/useFeedbackLoop';
import { AiInsightCard } from './AiInsightCard';
import { AutoAdjustBanner } from './AutoAdjustBanner';
import { DailyScoreHero } from './DailyScoreHero';
import { ProteinProgress } from './ProteinProgress';
import { QuickActionsBar } from './QuickActionsBar';
import { StreakMini } from './StreakMini';
import { TodaysPlanCard } from './TodaysPlanCard';
import { WeightMini } from './WeightMini';
import { WeightQuickLog } from './WeightQuickLog';

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (globalThis.window === undefined) return false;
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

const STAGGER_DELAYS = { tier2: 30, tier3: 60 } as const;

function DashboardTabInner(): React.ReactElement {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [weightQuickLogOpen, setWeightQuickLogOpen] = useState(false);
  const [lowerTiersVisible, setLowerTiersVisible] = useState(false);

  const { adjustment, applyAdjustment, dismissAdjustment } = useFeedbackLoop();
  const { targetCalories, targetProtein } = useNutritionTargets();
  const { eaten, protein } = useTodayNutrition();

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setLowerTiersVisible(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const handleOpenWeightLog = useCallback(() => {
    setWeightQuickLogOpen(true);
  }, []);

  const handleCloseWeightLog = useCallback(() => {
    setWeightQuickLogOpen(false);
  }, []);

  const staggerStyle = useCallback(
    (delayMs: number): React.CSSProperties => {
      if (reducedMotion) return {};
      return { animationDelay: `${delayMs}ms` };
    },
    [reducedMotion],
  );

  const tierClassName = reducedMotion ? '' : 'dashboard-stagger';

  return (
    <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-6" data-testid="dashboard-tab">
      {/* Tier 1: DailyScoreHero — immediate render */}
      <ErrorBoundary fallbackTitle={t('dashboard.error.hero')}>
        <div data-testid="dashboard-tier-1">
          <DailyScoreHero />
        </div>
      </ErrorBoundary>

      {/* Tier 2: EnergyBalanceMini + ProteinProgress — 30ms stagger */}
      <ErrorBoundary fallbackTitle={t('dashboard.error.energy')}>
        <div
          className={`flex flex-col gap-3 ${tierClassName}`}
          data-testid="dashboard-tier-2"
          style={staggerStyle(STAGGER_DELAYS.tier2)}
        >
          <EnergyBalanceMini eaten={eaten} burned={0} target={targetCalories} />
          <ProteinProgress current={protein} target={targetProtein} />
        </div>
      </ErrorBoundary>

      {/* Tier 3: TodaysPlanCard + WeightMini/StreakMini row — 60ms stagger */}
      <ErrorBoundary fallbackTitle={t('dashboard.error.plan')}>
        <div
          className={`flex flex-col gap-3 ${tierClassName}`}
          data-testid="dashboard-tier-3"
          style={staggerStyle(STAGGER_DELAYS.tier3)}
        >
          <TodaysPlanCard />
          <div className="grid grid-cols-2 gap-3">
            <WeightMini onTap={handleOpenWeightLog} />
            <StreakMini />
          </div>
        </div>
      </ErrorBoundary>

      {/* Tier 4: AutoAdjustBanner + AiInsightCard — lazy loaded */}
      <ErrorBoundary fallbackTitle={t('dashboard.error.insight')}>
        {lowerTiersVisible ? (
          <div className="flex min-h-[56px] flex-col gap-3" data-testid="dashboard-tier-4">
            {adjustment && (
              <AutoAdjustBanner adjustment={adjustment} onApply={applyAdjustment} onDismiss={dismissAdjustment} />
            )}
            <AiInsightCard />
          </div>
        ) : (
          <div className="min-h-[56px]" data-testid="dashboard-tier-4-placeholder" aria-hidden="true" />
        )}
      </ErrorBoundary>

      {/* Tier 5: QuickActionsBar — lazy loaded */}
      {lowerTiersVisible && (
        <ErrorBoundary fallbackTitle={t('dashboard.error.quickActions')}>
          <div data-testid="dashboard-tier-5">
            <QuickActionsBar onLogWeight={handleOpenWeightLog} />
          </div>
        </ErrorBoundary>
      )}

      {/* WeightQuickLog bottom sheet */}
      {weightQuickLogOpen && <WeightQuickLog onClose={handleCloseWeightLog} />}
    </div>
  );
}

export const DashboardTab = React.memo(DashboardTabInner);
