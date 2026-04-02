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
  const remaining = Math.round(targetCalories - netCalories);
  const safeTgt = targetCalories > 0 ? targetCalories : 1;
  const inPct = Math.min(100, Math.round((caloriesIn / safeTgt) * 100));
  const outPct = Math.min(inPct, Math.round((caloriesOut / safeTgt) * 100));
  const safeProTgt = proteinTarget > 0 ? proteinTarget : 1;
  const proPct = Math.min(100, Math.round((proteinCurrent / safeProTgt) * 100));

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  return (
    <div
      data-testid="energy-balance-card"
      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('nutrition.netCalories')}</span>
        </div>

        <div className="flex items-center gap-3">
          <span
            data-testid="net-calories"
            className={`text-lg font-bold ${
              remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {netCalories} {t('nutrition.kcal')}
          </span>

          {isCollapsible && (
            <button
              type="button"
              onClick={toggleCollapse}
              data-testid="collapse-toggle"
              aria-label={collapsed ? 'Expand' : 'Collapse'}
              className="rounded-lg p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {collapsed ? (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Collapsed summary line */}
      {collapsed && (
        <p data-testid="collapsed-summary" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {Math.round(caloriesIn)} {t('nutrition.caloriesIn')} − {Math.round(caloriesOut)} {t('nutrition.caloriesOut')}{' '}
          = {netCalories} {t('nutrition.kcal')}
        </p>
      )}

      {/* Expanded content */}
      {!collapsed && (
        <div className="mt-4 space-y-4">
          {/* Calorie in / out labels */}
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-emerald-500" />
              {t('nutrition.caloriesIn')}: <strong data-testid="calories-in">{Math.round(caloriesIn)}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3.5 w-3.5 text-blue-500" />
              {t('nutrition.caloriesOut')}: <strong data-testid="calories-out">{Math.round(caloriesOut)}</strong>
            </span>
          </div>

          {/* Combined progress bar */}
          <div className="space-y-1">
            <div
              data-testid="calorie-progress-bar"
              className="relative h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
            >
              {/* Food (green) */}
              <div
                data-testid="bar-food"
                className="absolute inset-y-0 left-0 rounded-full bg-emerald-400 transition-all"
                style={{ width: `${inPct}%` }}
              />
              {/* Exercise (blue) overlay from left */}
              <div
                data-testid="bar-exercise"
                className="absolute inset-y-0 left-0 rounded-l-full bg-blue-400 transition-all"
                style={{ width: `${outPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>
                {t('nutrition.target')}: {targetCalories} {t('nutrition.kcal')}
              </span>
              <span
                data-testid="remaining-display"
                className={
                  remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }
              >
                {t('nutrition.remaining')}: {remaining} {t('nutrition.kcal')}
              </span>
            </div>
          </div>

          {/* Protein progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Beef className="h-3.5 w-3.5 text-purple-500" />
                {t('nutrition.protein')}
              </span>
              <span data-testid="protein-display">
                {Math.round(proteinCurrent)}/{proteinTarget}
                {t('nutrition.grams')}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                data-testid="protein-bar"
                className="h-full rounded-full bg-purple-400 transition-all"
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
