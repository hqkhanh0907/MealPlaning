import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

export const MacroChart: React.FC<MacroChartProps> = React.memo(({ dayNutrition }) => {
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
        color: '#10b981',
        darkColor: '#34d399',
      },
      {
        label: t('macro.carbs'),
        grams: totalCarbs,
        calories: carbsCal,
        percent: Math.round((carbsCal / totalCal) * 100),
        color: '#3b82f6',
        darkColor: '#60a5fa',
      },
      {
        label: t('macro.fat'),
        grams: totalFat,
        calories: fatCal,
        percent: Math.round((fatCal / totalCal) * 100),
        color: '#f59e0b',
        darkColor: '#fbbf24',
      },
    ];
  }, [dayNutrition, t]);

  if (segments.length === 0) {
    return (
      <div data-testid="macro-chart-empty" className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm text-center text-slate-400 dark:text-slate-500 text-sm">
        {t('macro.noData')}
      </div>
    );
  }

  let offset = 0;
  const arcs = segments.map((seg) => {
    const dash = (seg.percent / 100) * CIRCUMFERENCE;
    const gap = CIRCUMFERENCE - dash;
    const currentOffset = offset;
    offset += dash;
    return { ...seg, dash, gap, offset: currentOffset };
  });

  return (
    <div data-testid="macro-chart" className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">{t('macro.title')}</h3>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0 -rotate-90" aria-hidden="true">
          {arcs.map((arc) => (
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
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="font-medium text-slate-700 dark:text-slate-300">{seg.label}</span>
              <span className="ml-auto text-slate-500 dark:text-slate-400" data-testid={`macro-percent-${seg.label}`}>{seg.percent}%</span>
              <span className="text-slate-400 dark:text-slate-500 text-xs w-10 text-right">{Math.round(seg.grams)}g</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

MacroChart.displayName = 'MacroChart';
