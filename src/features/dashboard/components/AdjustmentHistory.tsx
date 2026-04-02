import { Check, ChevronDown, ChevronUp, TrendingDown, TrendingUp, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface AdjustmentRecord {
  id: string;
  date: string;
  reason: string;
  oldTargetCal: number;
  newTargetCal: number;
  triggerType: 'auto' | 'manual';
  applied: boolean;
}

export interface AdjustmentHistoryProps {
  adjustments: AdjustmentRecord[];
  defaultCollapsed?: boolean;
}

export const AdjustmentHistory = React.memo(function AdjustmentHistory({
  adjustments,
  defaultCollapsed = true,
}: AdjustmentHistoryProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const sorted = [...adjustments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div
      data-testid="adjustment-history"
      aria-label={t('adjustmentHistory.ariaLabel')}
      className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
    >
      <button
        data-testid="adjustment-history-toggle"
        type="button"
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
      >
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('adjustmentHistory.title')}</span>
        {collapsed ? (
          <ChevronDown className="text-muted-foreground h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronUp className="text-muted-foreground h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {!collapsed && (
        <div data-testid="adjustment-history-list" className="divide-y divide-slate-200 dark:divide-slate-700">
          {sorted.length === 0 ? (
            <p data-testid="adjustment-history-empty" className="text-muted-foreground px-4 py-3 text-xs">
              {t('adjustmentHistory.noData')}
            </p>
          ) : (
            sorted.map(adj => (
              <div key={adj.id} data-testid={`adjustment-row-${adj.id}`} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-shrink-0">
                  {adj.applied ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    </div>
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                      <X className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {formatDate(adj.date)}
                    </span>
                    <span
                      data-testid={`trigger-badge-${adj.id}`}
                      className="text-muted-foreground rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-700"
                    >
                      {adj.triggerType === 'auto' ? t('adjustmentHistory.auto') : t('adjustmentHistory.manual')}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">{adj.reason}</p>
                </div>

                <div className="flex flex-shrink-0 items-center gap-1 font-mono text-xs text-slate-600 dark:text-slate-400">
                  <span>{adj.oldTargetCal}</span>
                  {adj.newTargetCal > adj.oldTargetCal ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="text-destructive h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{adj.newTargetCal}</span>
                </div>

                <div className="flex-shrink-0">
                  <span
                    data-testid={`status-label-${adj.id}`}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      adj.applied
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'text-muted-foreground bg-slate-100 dark:bg-slate-700'
                    }`}
                  >
                    {adj.applied ? t('adjustmentHistory.applied') : t('adjustmentHistory.declined')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});
