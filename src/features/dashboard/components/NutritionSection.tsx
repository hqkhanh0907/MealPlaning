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

const SCORE_BADGE_BG: Record<ScoreColor, string> = {
  emerald: 'bg-macro-protein',
  amber: 'bg-macro-fat',
  slate: 'bg-macro-carbs',
};

const HERO_CONTEXT_I18N: Record<Exclude<HeroContext, 'first-time'>, string> = {
  'rest-day-with-meals': 'dashboard.hero.contextual.restDayWithMeals',
  'training-day-needs-workout': 'dashboard.hero.contextual.trainingDayNeedsWorkout',
  'workout-done-needs-fuel': 'dashboard.hero.contextual.workoutDoneNeedsFuel',
  'balanced-day': 'dashboard.hero.contextual.balancedDay',
  'empty-day': 'dashboard.hero.contextual.emptyDay',
  'rest-day-empty': 'dashboard.hero.contextual.restDayEmpty',
};

const RING_SIZE = 48;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ProgressRing({ pct }: Readonly<{ pct: number }>) {
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
          className="text-white/10"
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
      <span className="text-[10px] font-bold text-white/80 tabular-nums">{clamped}%</span>
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
        <span className="text-[10px] font-medium text-white/60">{label}</span>
        <span className="text-xs font-semibold text-white/90 tabular-nums">
          {displayCurrent === null
            ? `—/${Math.round(displayTarget)}g`
            : `${displayCurrent}/${Math.round(displayTarget)}g`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
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
      <div className="flex items-start justify-between">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="h-9 w-9 rounded-full bg-white/10" />
      </div>
      <div className="rounded-xl bg-white/5 p-3">
        <div className="h-6 w-40 rounded bg-white/10" />
        <div className="mt-2 h-1.5 w-full rounded-full bg-white/10" />
      </div>
      <div className="flex gap-3">
        <div className="h-8 flex-1 rounded bg-white/10" />
        <div className="h-8 flex-1 rounded bg-white/10" />
        <div className="h-8 flex-1 rounded bg-white/10" />
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

  const displayGreeting = profileName ? t('dashboard.nutritionHero.greetingName', { name: profileName }) : greeting;

  if (isLoading) return <NutritionHeroSkeleton />;

  if (isFirstTimeUser) {
    return (
      <div data-testid="nutrition-hero" aria-label={t('dashboard.nutritionHero.a11y')}>
        <p className="mb-1 text-sm text-white/80" data-testid="nutrition-hero-greeting">
          {greeting}
        </p>
        <h2 className="mb-2 text-xl font-semibold text-white">{t('dashboard.nutritionHero.setupTitle')}</h2>
        <p className="text-sm text-white/60">{t('dashboard.nutritionHero.setupDescription')}</p>
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
      {/* Row 1: Greeting + Score badge */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1 pr-3">
          <p className="truncate text-sm font-medium text-white/90" data-testid="nutrition-hero-greeting">
            {displayGreeting}
          </p>
          {heroContext !== 'first-time' && HERO_CONTEXT_I18N[heroContext as Exclude<HeroContext, 'first-time'>] && (
            <p className="mt-0.5 line-clamp-2 text-xs text-white/50">
              {t(HERO_CONTEXT_I18N[heroContext as Exclude<HeroContext, 'first-time'>])}
            </p>
          )}
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${SCORE_BADGE_BG[color]}`}
          data-testid="nutrition-hero-score"
          aria-label={t('dashboard.nutritionHero.scoreA11y', { score: totalScore })}
        >
          <span className="text-xs font-bold text-white tabular-nums">{totalScore}</span>
        </div>
      </div>

      {/* Row 2: Calorie summary */}
      {hasNutritionData ? (
        <div className="rounded-xl bg-white/5 p-3" data-testid="nutrition-hero-calories">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-white tabular-nums">
                {eatenText}{' '}
                <span className="text-sm font-normal text-white/50 tabular-nums">
                  / {Math.round(displayTarget)} kcal
                </span>
              </p>
              <p
                className={`mt-0.5 text-xs font-medium ${isOverTarget ? 'text-rose' : 'text-success'}`}
                data-testid="nutrition-hero-remaining"
              >
                {remainingText}
              </p>
            </div>
            <ProgressRing pct={caloriePct} />
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${isOverTarget ? 'bg-rose' : 'bg-success'}`}
              style={{ width: `${caloriePct}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-white/5 p-4 text-center" data-testid="nutrition-hero-calories">
          <p className="text-sm text-white/70">{t('dashboard.nutritionHero.addFirstMeal')}</p>
          <p className="mt-1 text-xs text-white/40">
            {t('dashboard.nutritionHero.targetInfo', { target: Math.round(displayTarget) })}
          </p>
        </div>
      )}

      {/* Row 3: Macro bars */}
      <div className="flex gap-3">
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
  );
}

export const NutritionSection = React.memo(NutritionSectionInner);
NutritionSection.displayName = 'NutritionSection';
