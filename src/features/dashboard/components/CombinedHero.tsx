import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { EmptyState } from '@/components/shared/EmptyState';
import type { ScoreColor } from '@/features/dashboard/types';

import { useDailyScore } from '../hooks/useDailyScore';
import type { DashboardOrchestration } from '../hooks/useDashboardOrchestration';
import { NutritionSection } from './NutritionSection';
import { WeeklyStatsRow } from './WeeklyStatsRow';

const SCORE_COLOR_TO_LABEL: Record<ScoreColor, string> = {
  emerald: 'excellent',
  amber: 'good',
  slate: 'needsWork',
};

function WeeklyStatsRowFallback() {
  return (
    <div className="text-muted-foreground grid grid-cols-3 gap-2 text-center" data-testid="weekly-stats-fallback">
      <div className="bg-card border-border-subtle rounded-xl border p-2.5">—</div>
      <div className="bg-card border-border-subtle rounded-xl border p-2.5">—</div>
      <div className="bg-card border-border-subtle rounded-xl border p-2.5">—</div>
    </div>
  );
}

interface CombinedHeroProps {
  isLoading?: boolean;
  orchestration?: DashboardOrchestration;
}

function NextActionStrip({ orchestration }: Readonly<{ orchestration: DashboardOrchestration }>) {
  const { t } = useTranslation();
  const action = orchestration.heroContract.primaryAction;

  return (
    <div
      className="bg-card border-border-subtle space-y-2 rounded-2xl border p-4 shadow-sm"
      data-testid="dashboard-next-action"
    >
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs font-medium">{t('dashboard.orchestration.label')}</p>
        <p className="text-foreground text-base font-semibold">{orchestration.heroContract.copy.title}</p>
        {orchestration.heroContract.copy.reason && (
          <p className="text-foreground-secondary text-sm">{orchestration.heroContract.copy.reason}</p>
        )}
        {orchestration.heroContract.copy.nextStep && (
          <p className="text-muted-foreground text-xs">{orchestration.heroContract.copy.nextStep}</p>
        )}
      </div>
      {action?.onAction && (
        <button
          type="button"
          onClick={action.onAction}
          className="interactive bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 items-center rounded-xl px-4 py-2 text-sm font-semibold"
          data-testid="dashboard-primary-action"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export const CombinedHero = memo(({ isLoading, orchestration }: Readonly<CombinedHeroProps>) => {
  const { t } = useTranslation();
  const { isFirstTimeUser, greeting, heroContext, totalScore, color } = useDailyScore();
  const scoreLabel = t(`dashboard.hero.scoreLabel.${SCORE_COLOR_TO_LABEL[color]}`);

  if (orchestration?.heroMode === 'blocking') {
    return (
      <section
        className="space-y-3"
        aria-label={t('dashboard.orchestration.a11yLabel')}
        aria-busy={isLoading || undefined}
      >
        <EmptyState variant="hero" contract={orchestration.heroContract} />
      </section>
    );
  }

  return (
    <section
      className="space-y-3"
      aria-label={t('dashboard.hero.a11yLabel', { score: totalScore, label: scoreLabel })}
      aria-busy={isLoading || undefined}
    >
      <div className="bg-primary-subtle rounded-2xl p-4 shadow-sm">
        <NutritionSection
          isLoading={isLoading}
          isFirstTimeUser={isFirstTimeUser}
          greeting={greeting}
          heroContext={heroContext}
          totalScore={totalScore}
          scoreColor={color}
        />
      </div>
      {orchestration?.heroMode === 'guided' && <NextActionStrip orchestration={orchestration} />}
      {!isFirstTimeUser && orchestration?.heroMode !== 'guided' && (
        <ErrorBoundary fallback={<WeeklyStatsRowFallback />}>
          <WeeklyStatsRow />
        </ErrorBoundary>
      )}
    </section>
  );
});
CombinedHero.displayName = 'CombinedHero';
