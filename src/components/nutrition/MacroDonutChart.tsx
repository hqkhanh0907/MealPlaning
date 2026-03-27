import React from 'react';
import { useTranslation } from 'react-i18next';

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

export const MacroDonutChart: React.FC<MacroDonutChartProps> = React.memo(
  ({ proteinG, fatG, carbsG, size = 120 }) => {
    const { t } = useTranslation();

    const proteinCal = proteinG * PROTEIN_CAL_PER_G;
    const fatCal = fatG * FAT_CAL_PER_G;
    const carbsCal = carbsG * CARBS_CAL_PER_G;
    const totalCal = Math.round(proteinCal + fatCal + carbsCal);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 12;
    const strokeWidth = 10;

    const segments: { cal: number; color: string; testId: string }[] = [
      { cal: proteinCal, color: '#10b981', testId: 'arc-protein' },
      { cal: fatCal, color: '#f59e0b', testId: 'arc-fat' },
      { cal: carbsCal, color: '#3b82f6', testId: 'arc-carbs' },
    ];

    let currentAngle = 0;
    const arcs = totalCal > 0
      ? segments
          .filter((s) => s.cal > 0)
          .map((seg) => {
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
          role="img"
          aria-label={`${t('nutrition.protein')}: ${proteinG}${t('nutrition.grams')}, ${t('nutrition.fat')}: ${fatG}${t('nutrition.grams')}, ${t('nutrition.carbs')}: ${carbsG}${t('nutrition.grams')}`}
        >
          {/* Background circle */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-700"
            strokeWidth={strokeWidth}
          />

          {/* Arcs */}
          {arcs.map((arc) => (
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
            className="fill-slate-800 dark:fill-slate-100 text-lg font-bold"
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
            className="fill-slate-500 dark:fill-slate-400"
            style={{ fontSize: size * 0.09 }}
          >
            {t('nutrition.kcal')}
          </text>
        </svg>
      </div>
    );
  },
);

MacroDonutChart.displayName = 'MacroDonutChart';
