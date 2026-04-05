import { Flame, Minus, Target, UtensilsCrossed } from 'lucide-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export interface EnergyBalanceMiniProps {
  eaten: number;
  burned: number;
  target: number;
  onTapDetail?: () => void;
}

function getNetColorClass(net: number, target: number): string {
  const diff = net - target;
  if (Math.abs(diff) <= 100) return 'text-primary';
  if (diff > 100) return 'text-color-energy';
  return 'text-foreground-secondary';
}

export const EnergyBalanceMini = React.memo(function EnergyBalanceMini({
  eaten,
  burned,
  target,
  onTapDetail,
}: EnergyBalanceMiniProps) {
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

  const baseClass = 'w-full bg-card rounded-xl border border-border-subtle px-3 py-2';
  const interactiveClass =
    'cursor-pointer active:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  const content = (
    <div className="flex items-center justify-around">
      {/* Eaten */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          <UtensilsCrossed className="text-color-energy h-3.5 w-3.5" aria-hidden="true" />
          <span data-testid="mini-eaten" className="text-foreground text-sm font-semibold tabular-nums">
            {Math.round(eaten)}
          </span>
        </div>
        <span className="text-muted-foreground text-xs">{t('nutrition.caloriesIn')}</span>
      </div>

      <Minus className="text-muted-foreground h-4 w-4" aria-hidden="true" />

      {/* Burned */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          <Flame className="text-color-energy h-3.5 w-3.5" aria-hidden="true" />
          <span data-testid="mini-burned" className="text-foreground text-sm font-semibold tabular-nums">
            {Math.round(burned)}
          </span>
        </div>
        <span className="text-muted-foreground text-xs">{t('nutrition.caloriesOut')}</span>
      </div>

      <span className="text-muted-foreground text-sm">=</span>

      {/* Net */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          <Target className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
          <span data-testid="mini-net" className={`text-sm font-semibold tabular-nums ${netColorClass}`}>
            {net}
          </span>
        </div>
        <span className="text-muted-foreground text-xs">{t('nutrition.netCalories')}</span>
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
    <div data-testid="energy-balance-mini" className={baseClass} style={{ minHeight: 80 }}>
      {content}
    </div>
  );
});

EnergyBalanceMini.displayName = 'EnergyBalanceMini';
