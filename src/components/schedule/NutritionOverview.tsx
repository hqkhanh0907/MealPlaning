import { Beef, Flame } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { MACRO_COLORS } from '@/constant/colors';

import { EmptyState } from '../shared/EmptyState';

export interface NutritionOverviewProps {
  eaten: number;
  target: number;
  protein: number;
  targetProtein: number;
  fat: number;
  carbs: number;
  caloriesOut?: number | null;
  isSetup: boolean;
  onSetup: () => void;
}

const PROTEIN_CAL_PER_GRAM = 4;
const FAT_CAL_PER_GRAM = 9;
const CARBS_CAL_PER_GRAM = 4;

const DONUT_RADIUS = 35;
const DONUT_STROKE = 14;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DONUT_CENTER = 50;

function computeMacroArcs(protein: number, fat: number, carbs: number) {
  const proteinCal = protein * PROTEIN_CAL_PER_GRAM;
  const fatCal = fat * FAT_CAL_PER_GRAM;
  const carbsCal = carbs * CARBS_CAL_PER_GRAM;
  const totalCal = proteinCal + fatCal + carbsCal;

  if (totalCal === 0) return [];

  const segments = [
    {
      key: 'protein',
      label: 'P',
      grams: protein,
      pct: Math.round((proteinCal / totalCal) * 100),
      color: MACRO_COLORS.protein,
    },
    { key: 'fat', label: 'F', grams: fat, pct: Math.round((fatCal / totalCal) * 100), color: MACRO_COLORS.fat },
    { key: 'carbs', label: 'C', grams: carbs, pct: Math.round((carbsCal / totalCal) * 100), color: MACRO_COLORS.carbs },
  ];

  let offset = 0;
  return segments.map(seg => {
    const dash = (seg.pct / 100) * DONUT_CIRCUMFERENCE;
    const gap = DONUT_CIRCUMFERENCE - dash;
    const currentOffset = offset;
    offset += dash;
    return { ...seg, dash, gap, offset: currentOffset };
  });
}

export const NutritionOverview = React.memo(function NutritionOverview({
  eaten,
  target,
  protein,
  targetProtein,
  fat,
  carbs,
  caloriesOut,
  isSetup,
  onSetup,
}: Readonly<NutritionOverviewProps>) {
  const { t } = useTranslation();

  if (isSetup) {
    return (
      <section
        aria-label={t('calendar.nutritionOverviewLabel')}
        className="bg-card rounded-2xl border p-6 shadow-sm"
        data-testid="nutrition-overview"
      >
        <EmptyState
          icon={Flame}
          title={t('calendar.nutritionSetupTitle')}
          description={t('calendar.nutritionSetupDesc')}
          actionLabel={t('calendar.nutritionSetupAction')}
          onAction={onSetup}
        />
      </section>
    );
  }

  const safeTarget = target > 0 ? target : 1;
  const calPct = Math.min(100, Math.round((eaten / safeTarget) * 100));
  const remainingCal = target - eaten;

  const safeProteinTarget = targetProtein > 0 ? targetProtein : 1;
  const proPct = Math.min(100, Math.round((protein / safeProteinTarget) * 100));
  const remainingPro = targetProtein - protein;
  const proteinConfigured = targetProtein > 0;

  const showCaloriesOut = caloriesOut != null;
  const netCalories = showCaloriesOut ? eaten - caloriesOut : null;

  const arcs = computeMacroArcs(protein, fat, carbs);

  return (
    <section
      aria-label={t('calendar.nutritionOverviewLabel')}
      className="bg-card rounded-2xl border p-6 shadow-sm"
      data-testid="nutrition-overview"
    >
      {/* Section A: Calorie Budget */}
      <div data-testid="nutrition-calorie-section" className="mb-5">
        <div className="mb-2 flex items-center gap-1.5">
          <Flame className="text-energy h-4 w-4" aria-hidden="true" />
          <span className="text-foreground text-sm font-semibold">{t('calendar.nutritionCalorieLabel')}</span>
        </div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-foreground text-sm font-medium tabular-nums">
            {eaten}/{target} kcal
          </span>
          <span
            data-testid="calorie-remaining"
            className={`text-xs font-medium tabular-nums ${remainingCal >= 0 ? 'text-primary' : 'text-destructive'}`}
          >
            {remainingCal >= 0
              ? t('summary.remaining', { value: remainingCal, unit: 'kcal' })
              : t('summary.over', { value: Math.abs(remainingCal), unit: 'kcal' })}
          </span>
        </div>
        <div className="bg-muted relative h-2 overflow-hidden rounded-full">
          <progress value={eaten} max={target} aria-label={t('calendar.nutritionCalorieLabel')} className="sr-only">
            {calPct}%
          </progress>
          <div
            className="bg-energy h-full rounded-full transition-all"
            style={{ width: `${calPct}%` }}
            data-testid="calorie-bar"
          />
        </div>
        {showCaloriesOut && (
          <div data-testid="energy-out-section" className="text-muted-foreground mt-2 space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span>{t('calendar.nutritionCaloriesOut')}</span>
              <span className="tabular-nums">{caloriesOut} kcal</span>
            </div>
            <div className="flex justify-between">
              <span>{t('calendar.nutritionNet')}</span>
              <span className="tabular-nums">{netCalories} kcal</span>
            </div>
          </div>
        )}
      </div>

      {/* Section B: Protein Progress */}
      <div data-testid="nutrition-protein-section" className="mb-5">
        <div className="mb-2 flex items-center gap-1.5">
          <Beef className="text-macro-protein h-4 w-4" aria-hidden="true" />
          <span className="text-foreground text-sm font-semibold">{t('calendar.nutritionProteinLabel')}</span>
        </div>
        {proteinConfigured ? (
          <>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-foreground text-sm font-medium tabular-nums">
                {protein}/{targetProtein}g
              </span>
              <span
                data-testid="protein-remaining"
                className={`text-xs font-medium tabular-nums ${remainingPro >= 0 ? 'text-primary' : 'text-destructive'}`}
              >
                {remainingPro >= 0
                  ? t('summary.remaining', { value: remainingPro, unit: 'g' })
                  : t('summary.over', { value: Math.abs(remainingPro), unit: 'g' })}
              </span>
            </div>
            <div className="bg-muted relative h-2 overflow-hidden rounded-full">
              <progress
                value={protein}
                max={targetProtein}
                aria-label={t('calendar.nutritionProteinLabel')}
                className="sr-only"
              >
                {proPct}%
              </progress>
              <div
                className="bg-macro-protein h-full rounded-full transition-all"
                style={{ width: `${proPct}%` }}
                data-testid="protein-bar"
              />
            </div>
          </>
        ) : (
          <p data-testid="protein-not-configured" className="text-muted-foreground text-sm">
            {t('calendar.nutritionProteinNotConfigured')}
          </p>
        )}
      </div>

      {/* Section C: Macro Percentages */}
      {arcs.length > 0 && (
        <div data-testid="nutrition-macro-section" className="flex items-center gap-4">
          <svg
            viewBox="0 0 100 100"
            className="h-12 w-12 shrink-0 -rotate-90"
            aria-hidden="true"
            data-testid="macro-donut"
          >
            {arcs.map(arc => (
              <circle
                key={arc.key}
                cx={DONUT_CENTER}
                cy={DONUT_CENTER}
                r={DONUT_RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={DONUT_STROKE}
                strokeDasharray={`${arc.dash} ${arc.gap}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div className="flex flex-1 gap-3 text-xs">
            {arcs.map(arc => (
              <div key={arc.key} data-testid={`macro-legend-${arc.key}`} className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: arc.color }} />
                <span className="text-foreground font-medium">{arc.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {Math.round(arc.grams)}g ({arc.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
});

NutritionOverview.displayName = 'NutritionOverview';
