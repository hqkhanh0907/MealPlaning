import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useNutritionTargets } from '@/features/health-profile/hooks/useNutritionTargets';
import { useHealthProfileStore } from '@/features/health-profile/store/healthProfileStore';
import { useDayPlanStore } from '@/store/dayPlanStore';
import { useDishStore } from '@/store/dishStore';
import { useIngredientStore } from '@/store/ingredientStore';
import { calculateDishesNutrition } from '@/utils/nutrition';

import type { HeroContext } from '../hooks/useDailyScore';
import type { ScoreColor } from '../types';

/* ------------------------------------------------------------------ */
/*  Local hook: today's full macro nutrition                           */
/* ------------------------------------------------------------------ */

interface TodayMacros {
  eaten: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  hasPlan: boolean;
  hasDishes: boolean;
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function useTodayFullNutrition(): TodayMacros {
  const dayPlans = useDayPlanStore(s => s.dayPlans);
  const dishes = useDishStore(s => s.dishes);
  const ingredients = useIngredientStore(s => s.ingredients);

  return useMemo(() => {
    const today = formatLocalDate(new Date());
    const todayPlan = dayPlans.find(p => p.date === today);

    if (!todayPlan) {
      return { eaten: null, protein: null, fat: null, carbs: null, hasPlan: false, hasDishes: false };
    }

    const allDishIds = [...todayPlan.breakfastDishIds, ...todayPlan.lunchDishIds, ...todayPlan.dinnerDishIds];

    if (allDishIds.length === 0) {
      return { eaten: 0, protein: 0, fat: 0, carbs: 0, hasPlan: true, hasDishes: false };
    }

    const result = calculateDishesNutrition(allDishIds, dishes, ingredients, todayPlan.servings);
    return {
      eaten: Math.max(0, result.calories),
      protein: Math.max(0, result.protein),
      fat: Math.max(0, result.fat),
      carbs: Math.max(0, result.carbs),
      hasPlan: true,
      hasDishes: true,
    };
  }, [dayPlans, dishes, ingredients]);
}

/* ------------------------------------------------------------------ */
/*  NaN-safe helpers                                                   */
/* ------------------------------------------------------------------ */

function safeRound(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.round(value);
}

function safePositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SCORE_BADGE_CLASSES: Record<ScoreColor, { border: string; bg: string; dot: string; text: string }> = {
  emerald: { border: 'border-success/30', bg: 'bg-success/10', dot: 'bg-success', text: 'text-success' },
  amber: { border: 'border-energy/30', bg: 'bg-energy/10', dot: 'bg-energy', text: 'text-energy' },
  slate: {
    border: 'border-muted-foreground/30',
    bg: 'bg-muted',
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
  },
};

const HERO_CONTEXT_I18N: Record<Exclude<HeroContext, 'first-time'>, string> = {
  'rest-day-with-meals': 'dashboard.hero.contextual.restDayWithMeals',
  'training-day-needs-workout': 'dashboard.hero.contextual.trainingDayNeedsWorkout',
  'workout-done-needs-fuel': 'dashboard.hero.contextual.workoutDoneNeedsFuel',
  'balanced-day': 'dashboard.hero.contextual.balancedDay',
  'empty-day': 'dashboard.hero.contextual.emptyDay',
  'rest-day-empty': 'dashboard.hero.contextual.restDayEmpty',
};

const RING_SIZE = 96;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

interface ProgressRingProps {
  pct: number;
  eatenText: string;
}

function ProgressRing({ pct, eatenText }: Readonly<ProgressRingProps>) {
  /* v8 ignore start -- defensive: pct is always finite from caller */
  const safePct = Number.isFinite(pct) ? pct : 0;
  /* v8 ignore stop */
  const clamped = Math.min(100, Math.max(0, safePct));
  const offset = RING_CIRCUMFERENCE - (clamped / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE} className="absolute -rotate-90" aria-hidden="true">
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          className="text-muted-foreground/20"
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-success transition-all duration-500"
        />
      </svg>
      <div className="flex flex-col items-center justify-center">
        <span className="text-foreground text-2xl font-bold tabular-nums">{eatenText}</span>
        <span className="text-muted-foreground -mt-0.5 text-[10px]">kcal</span>
      </div>
    </div>
  );
}

interface MacroBarProps {
  label: string;
  current: number | null;
  target: number;
  colorClass: string;
  testId: string;
}

function MacroBar({ label, current, target, colorClass, testId }: Readonly<MacroBarProps>) {
  const displayCurrent = safeRound(current);
  const displayTarget = safePositive(target);
  const safeTarget = displayTarget > 0 ? displayTarget : 1;
  const pct =
    displayCurrent === null
      ? 0
      : Math.min(100, Math.max(0, Math.round((Math.max(0, displayCurrent) / safeTarget) * 100)));

  return (
    <div className="flex-1 space-y-1" data-testid={testId}>
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-[10px] font-medium">{label}</span>
        <span className="text-foreground text-xs font-semibold tabular-nums">
          {displayCurrent === null
            ? `—/${Math.round(displayTarget)}g`
            : `${displayCurrent}/${Math.round(displayTarget)}g`}
        </span>
      </div>
      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
        <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                           */
/* ------------------------------------------------------------------ */

function NutritionHeroSkeleton() {
  return (
    <div className="animate-pulse space-y-3" data-testid="nutrition-hero" aria-busy="true">
      <div className="flex items-center justify-between">
        <div>
          <div className="bg-muted-foreground/10 h-3 w-20 rounded" />
          <div className="bg-muted-foreground/10 mt-1.5 h-6 w-28 rounded" />
        </div>
        <div className="bg-muted-foreground/10 h-7 w-14 rounded-full" />
      </div>
      <div className="bg-card rounded-2xl border p-5 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="bg-muted-foreground/10 h-24 w-24 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted-foreground/10 h-5 w-32 rounded" />
            <div className="bg-muted-foreground/10 h-8 w-28 rounded-lg" />
            <div className="bg-muted-foreground/10 h-3 w-36 rounded" />
          </div>
        </div>
        <div className="border-border/50 mt-4 border-t pt-3">
          <div className="flex gap-3">
            <div className="bg-muted-foreground/10 h-10 flex-1 rounded" />
            <div className="bg-muted-foreground/10 h-10 flex-1 rounded" />
            <div className="bg-muted-foreground/10 h-10 flex-1 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export interface NutritionSectionProps {
  isLoading?: boolean;
  isFirstTimeUser: boolean;
  greeting: string;
  heroContext: string;
  totalScore: number;
  scoreColor: string;
}

interface CalorieSummary {
  displayEaten: number | null;
  displayTarget: number;
  caloriePct: number;
  isOverTarget: boolean;
  hasNutritionData: boolean;
  remaining: number | null;
}

function computeCalorieSummary(eaten: number | null, target: number, hasDishes: boolean): CalorieSummary {
  const displayEaten = safeRound(eaten);
  const displayTarget = safePositive(target);
  const safeTarget = displayTarget > 0 ? displayTarget : 1;
  const remaining = displayEaten === null ? null : Math.round(displayTarget) - displayEaten;
  const caloriePct =
    displayEaten === null ? 0 : Math.min(100, Math.max(0, Math.round((displayEaten / safeTarget) * 100)));
  const isOverTarget = remaining !== null && remaining < 0;
  const hasNutritionData = hasDishes && displayEaten !== null;
  return { displayEaten, displayTarget, caloriePct, isOverTarget, hasNutritionData, remaining };
}

function NutritionSectionInner({
  isLoading = false,
  isFirstTimeUser,
  greeting,
  heroContext,
  totalScore,
  scoreColor,
}: Readonly<NutritionSectionProps>): React.ReactElement {
  const { t } = useTranslation();
  const { targetCalories, targetProtein, targetFat, targetCarbs } = useNutritionTargets();
  const profileName = useHealthProfileStore(s => s.profile?.name ?? '');
  const todayMacros = useTodayFullNutrition();

  const color = scoreColor as ScoreColor;
  const badgeClasses = SCORE_BADGE_CLASSES[color];

  const { displayEaten, displayTarget, caloriePct, isOverTarget, hasNutritionData, remaining } = computeCalorieSummary(
    todayMacros.eaten,
    targetCalories,
    todayMacros.hasDishes,
  );

  /* v8 ignore next -- defensive: displayEaten is non-null when hasNutritionData */
  const eatenText = String(displayEaten ?? '—');
  /* v8 ignore next -- defensive: remaining is non-null when hasNutritionData */
  const overOrRemainingLabel =
    remaining !== null && remaining < 0
      ? t('dashboard.nutritionHero.over', { value: Math.abs(remaining) })
      : t('dashboard.nutritionHero.remaining', { value: remaining ?? 0 });
  const remainingText = remaining === null ? '—' : overOrRemainingLabel;

  if (isLoading) return <NutritionHeroSkeleton />;

  if (isFirstTimeUser) {
    return (
      <div data-testid="nutrition-hero" aria-label={t('dashboard.nutritionHero.a11y')}>
        <p className="text-muted-foreground mb-1 text-sm" data-testid="nutrition-hero-greeting">
          {greeting}
        </p>
        <h2 className="text-foreground mb-2 text-xl font-semibold">{t('dashboard.nutritionHero.setupTitle')}</h2>
        <p className="text-muted-foreground text-sm">{t('dashboard.nutritionHero.setupDescription')}</p>
      </div>
    );
  }

  return (
    <div
      className="space-y-3"
      data-testid="nutrition-hero"
      aria-label={t('dashboard.nutritionHero.a11y')}
      aria-busy={isLoading || undefined}
    >
      {/* Row 1: Greeting (small) + Name (xl bold) + Score pill */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 pr-3">
          <p className="text-primary/70 text-xs font-medium" data-testid="nutrition-hero-greeting">
            {greeting}
          </p>
          {profileName && <p className="text-foreground -mt-0.5 truncate text-xl font-bold">{profileName}</p>}
          {!profileName &&
            heroContext !== 'first-time' &&
            HERO_CONTEXT_I18N[heroContext as Exclude<HeroContext, 'first-time'>] && (
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                {t(HERO_CONTEXT_I18N[heroContext as Exclude<HeroContext, 'first-time'>])}
              </p>
            )}
        </div>
        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 ${badgeClasses.border} ${badgeClasses.bg}`}
          data-testid="nutrition-hero-score"
          aria-label={t('dashboard.nutritionHero.scoreA11y', { score: totalScore })}
        >
          <div className={`h-2 w-2 rounded-full ${badgeClasses.dot}`} />
          <span className={`text-xs font-bold tabular-nums ${badgeClasses.text}`}>{totalScore}</span>
        </div>
      </div>

      {/* Row 2: Calorie Hero Card — ring left + details right + macros inside */}
      {hasNutritionData ? (
        <div
          className="border-border/60 bg-card rounded-2xl border p-5 shadow-sm"
          data-testid="nutrition-hero-calories"
        >
          <div className="flex items-center gap-5">
            {/* Large progress ring — LEFT side, focal point */}
            <ProgressRing pct={caloriePct} eatenText={eatenText} />

            {/* Calorie details — RIGHT side */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-muted-foreground text-sm">{t('dashboard.nutritionHero.targetLabel')}</span>
                <span className="text-foreground text-lg font-bold tabular-nums">{Math.round(displayTarget)}</span>
                <span className="text-muted-foreground text-xs">kcal</span>
              </div>
              <div
                className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${isOverTarget ? 'bg-rose/10' : 'bg-success/10'}`}
                data-testid="nutrition-hero-remaining"
              >
                <svg
                  className={`h-3.5 w-3.5 ${isOverTarget ? 'text-rose' : 'text-success'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isOverTarget ? 'M19 14l-7 7m0 0l-7-7m7 7V3' : 'M5 10l7-7m0 0l7 7m-7-7v18'}
                  />
                </svg>
                <span className={`text-xs font-semibold ${isOverTarget ? 'text-rose' : 'text-success'}`}>
                  {remainingText}
                </span>
              </div>
              <p className="text-muted-foreground mt-1.5 text-[10px]">
                {caloriePct}% {t('dashboard.nutritionHero.goalReached')}
              </p>
            </div>
          </div>

          {/* Macro bars — INSIDE card, below border-t */}
          <div className="border-border/50 mt-4 border-t pt-3">
            <div className="grid grid-cols-3 gap-3">
              <MacroBar
                label={t('dashboard.nutritionHero.macroP')}
                current={todayMacros.protein}
                target={targetProtein}
                colorClass="bg-macro-protein"
                testId="nutrition-hero-protein"
              />
              <MacroBar
                label={t('dashboard.nutritionHero.macroF')}
                current={todayMacros.fat}
                target={targetFat}
                colorClass="bg-macro-fat"
                testId="nutrition-hero-fat"
              />
              <MacroBar
                label={t('dashboard.nutritionHero.macroC')}
                current={todayMacros.carbs}
                target={targetCarbs}
                colorClass="bg-macro-carbs"
                testId="nutrition-hero-carbs"
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          className="border-border/60 bg-card rounded-2xl border p-5 text-center shadow-sm"
          data-testid="nutrition-hero-calories"
        >
          <p className="text-muted-foreground text-sm">{t('dashboard.nutritionHero.addFirstMeal')}</p>
          <p className="text-muted-foreground/70 mt-1 text-xs">
            {t('dashboard.nutritionHero.targetInfo', { target: Math.round(displayTarget) })}
          </p>
        </div>
      )}
    </div>
  );
}

export const NutritionSection = React.memo(NutritionSectionInner);
NutritionSection.displayName = 'NutritionSection';
