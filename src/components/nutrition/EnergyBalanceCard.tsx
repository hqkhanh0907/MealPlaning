import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Dumbbell, ChevronDown, ChevronUp, Beef } from 'lucide-react';

export interface EnergyBalanceCardProps {
  caloriesIn: number;
  caloriesOut: number;
  targetCalories: number;
  proteinCurrent: number;
  proteinTarget: number;
  isCollapsible?: boolean;
}

export const EnergyBalanceCard = React.memo(
  function EnergyBalanceCard({ caloriesIn, caloriesOut, targetCalories, proteinCurrent, proteinTarget, isCollapsible = false }: EnergyBalanceCardProps) {
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
      setCollapsed((prev) => !prev);
    }, []);

    return (
      <div
        data-testid="energy-balance-card"
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 p-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              {t('nutrition.netCalories')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              data-testid="net-calories"
              className={`text-lg font-bold ${
                remaining >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
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
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {collapsed ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Collapsed summary line */}
        {collapsed && (
          <p data-testid="collapsed-summary" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {Math.round(caloriesIn)} {t('nutrition.caloriesIn')} − {Math.round(caloriesOut)} {t('nutrition.caloriesOut')} = {netCalories} {t('nutrition.kcal')}
          </p>
        )}

        {/* Expanded content */}
        {!collapsed && (
          <div className="mt-4 space-y-4">
            {/* Calorie in / out labels */}
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-emerald-500" />
                {t('nutrition.caloriesIn')}: <strong data-testid="calories-in">{Math.round(caloriesIn)}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5 text-blue-500" />
                {t('nutrition.caloriesOut')}: <strong data-testid="calories-out">{Math.round(caloriesOut)}</strong>
              </span>
            </div>

            {/* Combined progress bar */}
            <div className="space-y-1">
              <div
                data-testid="calorie-progress-bar"
                className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden relative"
              >
                {/* Food (green) */}
                <div
                  data-testid="bar-food"
                  className="absolute inset-y-0 left-0 bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${inPct}%` }}
                />
                {/* Exercise (blue) overlay from left */}
                <div
                  data-testid="bar-exercise"
                  className="absolute inset-y-0 left-0 bg-blue-400 rounded-l-full transition-all"
                  style={{ width: `${outPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>
                  {t('nutrition.target')}: {targetCalories} {t('nutrition.kcal')}
                </span>
                <span data-testid="remaining-display" className={remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                  {t('nutrition.remaining')}: {remaining} {t('nutrition.kcal')}
                </span>
              </div>
            </div>

            {/* Protein progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Beef className="w-3.5 h-3.5 text-purple-500" />
                  {t('nutrition.protein')}
                </span>
                <span data-testid="protein-display">
                  {Math.round(proteinCurrent)}/{proteinTarget}{t('nutrition.grams')}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
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
  },
);

EnergyBalanceCard.displayName = 'EnergyBalanceCard';
