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
    <div className="text-primary-foreground/50 grid grid-cols-3 gap-4 text-center" data-testid="weekly-stats-fallback">
      <div>—</div>
      <div>—</div>
      <div>—</div>
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
      className="from-primary to-primary/90 text-primary-foreground rounded-2xl bg-gradient-to-br p-4 shadow-sm"
      aria-label={t('dashboard.hero.a11yLabel', { score: totalScore, label: scoreLabel })}
      aria-busy={isLoading || undefined}
    >
      <NutritionSection
        isLoading={isLoading}
        isFirstTimeUser={isFirstTimeUser}
        greeting={greeting}
        heroContext={heroContext}
        totalScore={totalScore}
        scoreColor={color}
      />
      {!isFirstTimeUser && <div className="border-primary-foreground/10 my-3 border-t" />}
      {!isFirstTimeUser && (
        <ErrorBoundary fallback={<WeeklyStatsRowFallback />}>
          <WeeklyStatsRow />
        </ErrorBoundary>
      )}
    </section>
  );
});
CombinedHero.displayName = 'CombinedHero';
