import { Beef, ChevronDown, ChevronUp, Dumbbell, Flame } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface EnergyBalanceCardProps {
  caloriesIn: number;
  caloriesOut: number;
  targetCalories: number;
  proteinCurrent: number;
  proteinTarget: number;
  isCollapsible?: boolean;
}

export const EnergyBalanceCard = React.memo(function EnergyBalanceCard({
  caloriesIn,
  caloriesOut,
  targetCalories,
  proteinCurrent,
  proteinTarget,
  isCollapsible = false,
}: EnergyBalanceCardProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const netCalories = Math.round(caloriesIn - caloriesOut);
  const displayTarget = Number.isFinite(targetCalories) ? Math.round(targetCalories) : 0;
  const displayProTarget = Number.isFinite(proteinTarget) ? Math.round(proteinTarget) : 0;
  const remaining = displayTarget - netCalories;
  const safeTgt = displayTarget > 0 ? displayTarget : 1;
  const inPct = Math.min(100, Math.round((caloriesIn / safeTgt) * 100));
  const outPct = Math.min(inPct, Math.round((caloriesOut / safeTgt) * 100));
  const safeProTgt = displayProTarget > 0 ? displayProTarget : 1;
  const proPct = Math.min(100, Math.round((proteinCurrent / safeProTgt) * 100));

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  return (
    <div data-testid="energy-balance-card" className="bg-card border-border-subtle rounded-2xl border p-4 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="text-foreground text-sm font-semibold">{t('nutrition.netCalories')}</span>
        </div>

        <div className="flex items-center gap-3">
          <span
            data-testid="net-calories"
            className={`text-lg font-bold ${remaining >= 0 ? 'text-primary' : 'text-destructive'}`}
          >
            {netCalories} {t('nutrition.kcal')}
          </span>

          {isCollapsible && (
            <button
              type="button"
              onClick={toggleCollapse}
              data-testid="collapse-toggle"
              aria-label={collapsed ? 'Expand' : 'Collapse'}
              className="hover:bg-accent rounded-lg p-1.5 transition-colors"
            >
              {collapsed ? (
                <ChevronDown className="text-muted-foreground h-4 w-4" />
              ) : (
                <ChevronUp className="text-muted-foreground h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Collapsed summary line */}
      {collapsed && (
        <p data-testid="collapsed-summary" className="text-muted-foreground mt-1 text-xs">
          {Math.round(caloriesIn)} {t('nutrition.caloriesIn')} − {Math.round(caloriesOut)} {t('nutrition.caloriesOut')}{' '}
          = {netCalories} {t('nutrition.kcal')}
        </p>
      )}

      {/* Expanded content */}
      {!collapsed && (
        <div className="mt-4 space-y-4">
          {/* Calorie in / out labels */}
          <div className="text-foreground-secondary flex justify-between text-xs">
            <span className="flex items-center gap-1">
              <Flame className="text-primary h-3.5 w-3.5" />
              {t('nutrition.caloriesIn')}: <strong data-testid="calories-in">{Math.round(caloriesIn)}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3.5 w-3.5 text-blue-500" />
              {t('nutrition.caloriesOut')}: <strong data-testid="calories-out">{Math.round(caloriesOut)}</strong>
            </span>
          </div>

          {/* Combined progress bar */}
          <div className="space-y-1">
            <div data-testid="calorie-progress-bar" className="bg-muted relative h-3 overflow-hidden rounded-full">
              {/* Food (green) */}
              <div
                data-testid="bar-food"
                className="bg-primary absolute inset-y-0 left-0 rounded-full transition-all"
                style={{ width: `${inPct}%` }}
              />
              {/* Exercise (blue) overlay from left */}
              <div
                data-testid="bar-exercise"
                className="absolute inset-y-0 left-0 rounded-l-full bg-blue-400 transition-all"
                style={{ width: `${outPct}%` }}
              />
            </div>
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>
                {t('nutrition.target')}: {displayTarget} {t('nutrition.kcal')}
              </span>
              <span data-testid="remaining-display" className={remaining >= 0 ? 'text-primary' : 'text-destructive'}>
                {t('nutrition.remaining')}: {remaining} {t('nutrition.kcal')}
              </span>
            </div>
          </div>

          {/* Protein progress */}
          <div className="space-y-1">
            <div className="text-foreground-secondary flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <Beef className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
                {t('nutrition.protein')}
              </span>
              <span data-testid="protein-display">
                {Math.round(proteinCurrent)}/{displayProTarget}
                {t('nutrition.grams')}
              </span>
            </div>
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                data-testid="protein-bar"
                className="h-full rounded-full bg-indigo-400 transition-all"
                style={{ width: `${proPct}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

EnergyBalanceCard.displayName = 'EnergyBalanceCard';
