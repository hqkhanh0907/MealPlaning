import React from 'react';
import { useTranslation } from 'react-i18next';

import { MACRO_COLORS } from '@/constant/colors';
import { useDarkMode } from '@/hooks/useDarkMode';

export interface MacroDonutChartProps {
  proteinG: number;
  fatG: number;
  carbsG: number;
  size?: number;
}

const PROTEIN_CAL_PER_G = 4;
const FAT_CAL_PER_G = 9;
const CARBS_CAL_PER_G = 4;

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const clampedEnd = Math.min(endAngle, startAngle + 359.999);
  const startRad = ((clampedEnd - 90) * Math.PI) / 180;
  const endRad = ((startAngle - 90) * Math.PI) / 180;
  const largeArc = clampedEnd - startAngle > 180 ? 1 : 0;

  const x1 = cx + r * Math.cos(endRad);
  const y1 = cy + r * Math.sin(endRad);
  const x2 = cx + r * Math.cos(startRad);
  const y2 = cy + r * Math.sin(startRad);

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export const MacroDonutChart = React.memo(function MacroDonutChart({
  proteinG,
  fatG,
  carbsG,
  size = 120,
}: MacroDonutChartProps) {
  const { t } = useTranslation();
  const { isDark } = useDarkMode();

  const proteinCal = proteinG * PROTEIN_CAL_PER_G;
  const fatCal = fatG * FAT_CAL_PER_G;
  const carbsCal = carbsG * CARBS_CAL_PER_G;
  const totalCal = Math.round(proteinCal + fatCal + carbsCal);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 12;
  const strokeWidth = 10;

  const segments: { cal: number; color: string; testId: string }[] = [
    { cal: proteinCal, color: isDark ? MACRO_COLORS.protein.dark : MACRO_COLORS.protein.light, testId: 'arc-protein' },
    { cal: fatCal, color: isDark ? MACRO_COLORS.fat.dark : MACRO_COLORS.fat.light, testId: 'arc-fat' },
    { cal: carbsCal, color: isDark ? MACRO_COLORS.carbs.dark : MACRO_COLORS.carbs.light, testId: 'arc-carbs' },
  ];

  let currentAngle = 0;
  const arcs =
    totalCal > 0
      ? segments
          .filter(s => s.cal > 0)
          .map(seg => {
            const sweep = (seg.cal / totalCal) * 360;
            const d = describeArc(cx, cy, r, currentAngle, currentAngle + sweep);
            const arc = { ...seg, d, startAngle: currentAngle };
            currentAngle += sweep;
            return arc;
          })
      : [];

  return (
    <div data-testid="macro-donut-chart" className="inline-flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={
          totalCal > 0
            ? `${t('nutrition.protein')}: ${proteinG}${t('nutrition.grams')}, ${t('nutrition.fat')}: ${fatG}${t('nutrition.grams')}, ${t('nutrition.carbs')}: ${carbsG}${t('nutrition.grams')}`
            : t('emptyState.donutNoData')
        }
      >
        {/* Background circle */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth={strokeWidth}
        />

        {/* Arcs */}
        {arcs.map(arc => (
          <path
            key={arc.testId}
            data-testid={arc.testId}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        ))}

        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-lg font-semibold"
          style={{ fontSize: size * 0.15 }}
          data-testid="donut-total-cal"
        >
          {totalCal}
        </text>
        <text
          x={cx}
          y={cy + size * 0.1}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-muted-foreground"
          style={{ fontSize: size * 0.09 }}
        >
          {t('nutrition.kcal')}
        </text>
      </svg>
      {totalCal === 0 && (
        <p data-testid="donut-no-data-hint" className="text-muted-foreground text-xs">
          {t('emptyState.donutNoData')}
        </p>
      )}
    </div>
  );
});

MacroDonutChart.displayName = 'MacroDonutChart';
