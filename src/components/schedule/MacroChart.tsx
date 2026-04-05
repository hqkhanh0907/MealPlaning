import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MACRO_COLORS } from '@/constant/colors';

import { DayNutritionSummary } from '../../types';

export interface MacroChartProps {
  dayNutrition: DayNutritionSummary;
}

interface MacroSegment {
  label: string;
  grams: number;
  calories: number;
  percent: number;
  color: string;
  darkColor: string;
}

const PROTEIN_CAL_PER_GRAM = 4;
const CARBS_CAL_PER_GRAM = 4;
const FAT_CAL_PER_GRAM = 9;

const RADIUS = 40;
const STROKE_WIDTH = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = 50;

export const MacroChart = React.memo(function MacroChart({ dayNutrition }: MacroChartProps) {
  const { t } = useTranslation();

  const segments: MacroSegment[] = useMemo(() => {
    const totalProtein = dayNutrition.breakfast.protein + dayNutrition.lunch.protein + dayNutrition.dinner.protein;
    const totalCarbs = dayNutrition.breakfast.carbs + dayNutrition.lunch.carbs + dayNutrition.dinner.carbs;
    const totalFat = dayNutrition.breakfast.fat + dayNutrition.lunch.fat + dayNutrition.dinner.fat;

    const proteinCal = totalProtein * PROTEIN_CAL_PER_GRAM;
    const carbsCal = totalCarbs * CARBS_CAL_PER_GRAM;
    const fatCal = totalFat * FAT_CAL_PER_GRAM;
    const totalCal = proteinCal + carbsCal + fatCal;

    if (totalCal === 0) return [];

    return [
      {
        label: t('macro.protein'),
        grams: totalProtein,
        calories: proteinCal,
        percent: Math.round((proteinCal / totalCal) * 100),
        color: MACRO_COLORS.protein.light,
        darkColor: MACRO_COLORS.protein.dark,
      },
      {
        label: t('macro.carbs'),
        grams: totalCarbs,
        calories: carbsCal,
        percent: Math.round((carbsCal / totalCal) * 100),
        color: MACRO_COLORS.carbs.light,
        darkColor: MACRO_COLORS.carbs.dark,
      },
      {
        label: t('macro.fat'),
        grams: totalFat,
        calories: fatCal,
        percent: Math.round((fatCal / totalCal) * 100),
        color: MACRO_COLORS.fat.light,
        darkColor: MACRO_COLORS.fat.dark,
      },
    ];
  }, [dayNutrition, t]);

  if (segments.length === 0) {
    return (
      <div
        data-testid="macro-chart-empty"
        className="bg-card border-border-subtle text-muted-foreground rounded-2xl border p-6 text-center text-sm shadow-sm"
      >
        {t('macro.noData')}
      </div>
    );
  }

  let offset = 0;
  const arcs = segments.map(seg => {
    const dash = (seg.percent / 100) * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dash;
    const currentOffset = offset;
    offset += dash;
    return { ...seg, dash, gap, offset: currentOffset };
  });

  return (
    <div data-testid="macro-chart" className="bg-card border-border-subtle rounded-2xl border p-6 shadow-sm">
      <h3 className="text-foreground mb-4 text-sm font-semibold">{t('macro.title')}</h3>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0 -rotate-90" aria-hidden="true">
          {arcs.map(arc => (
            <circle
              key={arc.label}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              className="transition-all duration-300"
              stroke={arc.color}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="flex-1 space-y-2">
          {segments.map(seg => (
            <div key={seg.label} className="flex items-center gap-2 text-sm">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-foreground font-medium">{seg.label}</span>
              <span className="text-muted-foreground ml-auto" data-testid={`macro-percent-${seg.label}`}>
                {seg.percent}%
              </span>
              <span className="text-muted-foreground w-10 text-right text-xs">{Math.round(seg.grams)}g</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

MacroChart.displayName = 'MacroChart';
