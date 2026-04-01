import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, Flame, Target } from 'lucide-react';

export interface EnergyBalanceMiniProps {
  eaten: number;
  burned: number;
  target: number;
  onTapDetail?: () => void;
}

function getNetColorClass(net: number, target: number): string {
  const diff = net - target;
  if (Math.abs(diff) <= 100) return 'text-emerald-600 dark:text-emerald-400';
  if (diff > 100) return 'text-amber-600 dark:text-amber-400';
  return 'text-slate-600 dark:text-slate-300';
}

export const EnergyBalanceMini = React.memo(
  function EnergyBalanceMini({ eaten, burned, target, onTapDetail }: EnergyBalanceMiniProps) {
    const { t } = useTranslation();

    const net = Math.round(eaten - burned);
    const netColorClass = getNetColorClass(net, target);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (onTapDetail && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onTapDetail();
        }
      },
      [onTapDetail],
    );

    const baseClass = 'w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 px-3 py-2';
    const interactiveClass = 'cursor-pointer active:bg-slate-50 dark:active:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2';

    const content = (
      <div className="flex items-center justify-around">
        {/* Eaten */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1">
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
            <span
              data-testid="mini-eaten"
              className="font-semibold text-sm text-slate-800 dark:text-slate-100"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {Math.round(eaten)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {t('nutrition.caloriesIn')}
          </span>
        </div>

        <span className="text-slate-400 text-sm">−</span>

        {/* Burned */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" aria-hidden="true" />
            <span
              data-testid="mini-burned"
              className="font-semibold text-sm text-slate-800 dark:text-slate-100"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {Math.round(burned)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {t('nutrition.caloriesOut')}
          </span>
        </div>

        <span className="text-slate-400 text-sm">=</span>

        {/* Net */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span
              data-testid="mini-net"
              className={`font-bold text-sm ${netColorClass}`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {net}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {t('nutrition.netCalories')}
          </span>
        </div>
      </div>
    );

    if (onTapDetail) {
      return (
        <button
          type="button"
          data-testid="energy-balance-mini"
          className={`${baseClass} ${interactiveClass}`}
          style={{ minHeight: 80 }}
          onClick={onTapDetail}
          aria-label={t('nutrition.energyBalance')}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {content}
        </button>
      );
    }

    return (
      <div
        data-testid="energy-balance-mini"
        className={baseClass}
        style={{ minHeight: 80 }}
      >
        {content}
      </div>
    );
  },
);

EnergyBalanceMini.displayName = 'EnergyBalanceMini';
