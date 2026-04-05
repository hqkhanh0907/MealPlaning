import { Beef, Dumbbell, Flame, Scale, UtensilsCrossed } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useDailyScore } from '../hooks/useDailyScore';
import type { ScoreColor } from '../types';

const GRADIENT_MAP: Record<ScoreColor, string> = {
  emerald: 'from-primary/90 to-primary',
  amber: 'from-amber-500 to-amber-600',
  slate: 'from-slate-500 to-slate-600',
};

const TEXT_COLOR_MAP: Record<ScoreColor, { primary: string; secondary: string; muted: string }> = {
  emerald: { primary: 'text-white', secondary: 'text-white/90', muted: 'text-white/60' },
  amber: { primary: 'text-amber-950', secondary: 'text-amber-950/90', muted: 'text-amber-950/60' },
  slate: { primary: 'text-white', secondary: 'text-white/90', muted: 'text-white/60' },
};

const FACTOR_CONFIG = [
  { key: 'calories' as const, icon: UtensilsCrossed },
  { key: 'protein' as const, icon: Beef },
  { key: 'workout' as const, icon: Dumbbell },
  { key: 'weightLog' as const, icon: Scale },
  { key: 'streak' as const, icon: Flame },
];

const CHECKLIST_KEYS = [
  'dashboard.hero.firstTime.step1',
  'dashboard.hero.firstTime.step2',
  'dashboard.hero.firstTime.step3',
] as const;

function getScoreLabelKey(score: number): string {
  if (score >= 80) return 'dashboard.hero.scoreLabel.excellent';
  if (score >= 50) return 'dashboard.hero.scoreLabel.good';
  return 'dashboard.hero.scoreLabel.needsWork';
}

function DailyScoreHeroInner(): React.ReactElement {
  const { t } = useTranslation();
  const { totalScore, factors, color, greeting, isFirstTimeUser } = useDailyScore();

  const gradient = isFirstTimeUser ? GRADIENT_MAP.slate : GRADIENT_MAP[color];
  const textColors = isFirstTimeUser ? TEXT_COLOR_MAP.slate : TEXT_COLOR_MAP[color];

  const activeBadges = useMemo(
    () =>
      FACTOR_CONFIG.filter(cfg => factors[cfg.key] !== null).map(cfg => ({
        key: cfg.key,
        Icon: cfg.icon,
        score: factors[cfg.key]!,
      })),
    [factors],
  );

  const isPartialData = activeBadges.length > 0 && activeBadges.length < FACTOR_CONFIG.length;

  const scoreLabel = t(getScoreLabelKey(totalScore));

  if (isFirstTimeUser) {
    return (
      <section
        className={`w-full rounded-2xl bg-gradient-to-r ${gradient} p-6`}
        aria-label={t('dashboard.hero.firstTime.a11y')}
        data-testid="daily-score-hero"
      >
        <p className={`mb-1 text-sm ${textColors.secondary}`}>{greeting}</p>
        <h2 className={`mb-4 text-xl font-semibold ${textColors.primary}`}>{t('dashboard.hero.firstTime.title')}</h2>
        <ul className="space-y-2">
          {CHECKLIST_KEYS.map((key, idx) => (
            <li key={key} className={`flex items-center gap-2 text-sm ${textColors.secondary}`}>
              <span className="bg-card/20 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                {idx + 1}
              </span>
              {t(key)}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section
      className={`w-full rounded-2xl bg-gradient-to-r ${gradient} p-6`}
      aria-label={t('dashboard.hero.a11yLabel', {
        score: totalScore,
        label: scoreLabel,
      })}
      data-testid="daily-score-hero"
    >
      <p className={`mb-1 text-sm ${textColors.secondary}`}>{greeting}</p>
      <div className="mb-1 flex items-baseline gap-2">
        <span className={`text-2xl font-bold tabular-nums ${textColors.primary}`} data-testid="score-number">
          {totalScore}
        </span>
        <span className={`text-sm font-medium ${textColors.muted}`}>{scoreLabel}</span>
      </div>
      {isPartialData && (
        <p className={`mb-3 text-xs ${textColors.muted}`} data-testid="partial-data-label">
          ({t('dashboard.hero.partialData')})
        </p>
      )}
      {activeBadges.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" data-testid="score-badges">
          {activeBadges.map(badge => (
            <div
              key={badge.key}
              className="bg-card/20 flex items-center gap-1 rounded-full px-2.5 py-1"
              data-testid={`badge-${badge.key}`}
            >
              <badge.Icon className={`h-4 w-4 ${textColors.primary}`} aria-hidden="true" />
              <span className={`text-xs font-medium tabular-nums ${textColors.primary}`}>{badge.score}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export const DailyScoreHero = React.memo(DailyScoreHeroInner);
