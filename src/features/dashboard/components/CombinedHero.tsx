import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { ScoreColor } from '@/features/dashboard/types';

import { useDailyScore } from '../hooks/useDailyScore';
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
}

export const CombinedHero = memo(({ isLoading }: Readonly<CombinedHeroProps>) => {
  const { t } = useTranslation();
  const { isFirstTimeUser, greeting, heroContext, totalScore, color } = useDailyScore();
  const scoreLabel = t(`dashboard.hero.scoreLabel.${SCORE_COLOR_TO_LABEL[color]}`);

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
      {!isFirstTimeUser && (
        <ErrorBoundary fallback={<WeeklyStatsRowFallback />}>
          <WeeklyStatsRow />
        </ErrorBoundary>
      )}
    </section>
  );
});
CombinedHero.displayName = 'CombinedHero';
