import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface WeekVolume {
  weekLabel: string;
  volume: number;
  isCurrent: boolean;
}

interface VolumeTrendChartProps {
  weeks: WeekVolume[];
}

function calculateBarHeight(volume: number, maxVolume: number): number {
  if (maxVolume === 0) return 0;
  return Math.round((volume / maxVolume) * 100);
}

const VolumeTrendChart = React.memo(function VolumeTrendChart(props: Readonly<VolumeTrendChartProps>) {
  const { weeks } = props;
  const { t } = useTranslation();
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);

  if (weeks.length === 0) {
    return (
      <div data-testid="volume-trend-empty" className="flex h-40 items-center justify-center">
        <p className="text-muted-foreground text-sm">{t('fitness.volumeTrend.noData')}</p>
      </div>
    );
  }

  const maxVolume = Math.max(...weeks.map(w => w.volume));

  return (
    <div
      data-testid="volume-trend-chart"
      aria-label={t('fitness.volumeTrend.chartLabel')}
      className="relative flex h-40 items-end gap-1"
    >
      {weeks.map((week, index) => {
        const heightPercent = calculateBarHeight(week.volume, maxVolume);
        const barStyle = { height: `${heightPercent}%` };
        const barColorClass = week.isCurrent ? 'bg-primary' : 'bg-primary/30';

        return (
          <div key={week.weekLabel} className="flex flex-1 flex-col items-center">
            <div className="relative flex w-full flex-1 items-end justify-center">
              {activeTooltipIndex === index && (
                <div
                  data-testid="volume-tooltip"
                  className="bg-popover text-popover-foreground absolute bottom-full mb-1 rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap shadow"
                >
                  {t('fitness.volumeTrend.tooltipLabel', {
                    volume: week.volume.toLocaleString('vi-VN'),
                  })}
                </div>
              )}
              <div
                data-testid={`volume-bar-${index}`}
                aria-hidden="true"
                className={`w-full rounded-t-md transition-all duration-300 ${barColorClass}`}
                style={barStyle}
                onMouseEnter={() => setActiveTooltipIndex(index)}
                onMouseLeave={() => setActiveTooltipIndex(null)}
                onClick={() => setActiveTooltipIndex(prev => (prev === index ? null : index))}
              />
            </div>
            <span className="text-muted-foreground mt-1 text-[10px] tabular-nums">{week.weekLabel}</span>
          </div>
        );
      })}
    </div>
  );
});

VolumeTrendChart.displayName = 'VolumeTrendChart';

export default VolumeTrendChart;
