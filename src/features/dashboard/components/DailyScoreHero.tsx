import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UtensilsCrossed,
  Beef,
  Dumbbell,
  Scale,
  Flame,
} from 'lucide-react';
import { useDailyScore } from '../hooks/useDailyScore';
import type { ScoreColor } from '../types';

const GRADIENT_MAP: Record<ScoreColor, string> = {
  emerald: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  slate: 'from-slate-500 to-slate-600',
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
  const { totalScore, factors, color, greeting, isFirstTimeUser } =
    useDailyScore();

  const gradient = isFirstTimeUser
    ? GRADIENT_MAP.slate
    : GRADIENT_MAP[color];

  const activeBadges = useMemo(
    () =>
      FACTOR_CONFIG.filter(
        (cfg) => factors[cfg.key] !== null,
      ).map((cfg) => ({
        key: cfg.key,
        Icon: cfg.icon,
        score: factors[cfg.key]!,
      })),
    [factors],
  );

  const isPartialData =
    activeBadges.length > 0 &&
    activeBadges.length < FACTOR_CONFIG.length;

  const scoreLabel = t(getScoreLabelKey(totalScore));

  if (isFirstTimeUser) {
    return (
      <div
        className={`w-full rounded-2xl bg-gradient-to-r ${gradient} p-6`}
        role="region"
        aria-label={t('dashboard.hero.firstTime.a11y')}
        data-testid="daily-score-hero"
      >
        <p className="mb-1 text-sm text-white/90">{greeting}</p>
        <h2 className="mb-4 text-xl font-bold text-white">
          {t('dashboard.hero.firstTime.title')}
        </h2>
        <ul className="space-y-2">
          {CHECKLIST_KEYS.map((key, idx) => (
            <li
              key={key}
              className="flex items-center gap-2 text-sm text-white/90"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-medium">
                {idx + 1}
              </span>
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-2xl bg-gradient-to-r ${gradient} p-6`}
      role="region"
      aria-label={t('dashboard.hero.a11yLabel', {
        score: totalScore,
        label: scoreLabel,
      })}
      data-testid="daily-score-hero"
    >
      <p className="mb-1 text-sm text-white/90">{greeting}</p>
      <div className="mb-1 flex items-baseline gap-2">
        <span
          className="text-2xl font-bold text-white"
          style={{ fontVariantNumeric: 'tabular-nums' }}
          data-testid="score-number"
        >
          {totalScore}
        </span>
        <span className="text-sm font-medium text-white/80">
          {scoreLabel}
        </span>
      </div>
      {isPartialData && (
        <p
          className="mb-3 text-xs text-white/60"
          data-testid="partial-data-label"
        >
          ({t('dashboard.hero.partialData')})
        </p>
      )}
      {activeBadges.length > 0 && (
        <div
          className="mt-3 flex flex-wrap gap-2"
          data-testid="score-badges"
        >
          {activeBadges.map((badge) => (
            <div
              key={badge.key}
              className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1"
              data-testid={`badge-${badge.key}`}
            >
              <badge.Icon
                size={16}
                className="text-white"
                aria-hidden="true"
              />
              <span
                className="text-xs font-medium text-white"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {badge.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const DailyScoreHero = React.memo(DailyScoreHeroInner);
