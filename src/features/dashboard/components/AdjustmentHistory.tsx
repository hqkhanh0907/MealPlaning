import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

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

export const AdjustmentHistory: React.FC<AdjustmentHistoryProps> = React.memo(
  function AdjustmentHistory({
    adjustments,
    defaultCollapsed = true,
  }) {
    const { t } = useTranslation();
    const [collapsed, setCollapsed] = useState(defaultCollapsed);

    const toggleCollapsed = useCallback(() => {
      setCollapsed((prev) => !prev);
    }, []);

    const sorted = [...adjustments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

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
        className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <button
          data-testid="adjustment-history-toggle"
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t('adjustmentHistory.title')}
          </span>
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
          )}
        </button>

        {!collapsed && (
          <div data-testid="adjustment-history-list" className="divide-y divide-slate-200 dark:divide-slate-700">
            {sorted.length === 0 ? (
              <p
                data-testid="adjustment-history-empty"
                className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400"
              >
                {t('adjustmentHistory.noData')}
              </p>
            ) : (
              sorted.map((adj) => (
                <div
                  key={adj.id}
                  data-testid={`adjustment-row-${adj.id}`}
                  className="px-4 py-3 flex items-center gap-3"
                >
                  <div className="flex-shrink-0">
                    {adj.applied ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <X className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {formatDate(adj.date)}
                      </span>
                      <span
                        data-testid={`trigger-badge-${adj.id}`}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      >
                        {adj.triggerType === 'auto'
                          ? t('adjustmentHistory.auto')
                          : t('adjustmentHistory.manual')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {adj.reason}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono text-slate-600 dark:text-slate-400 flex-shrink-0">
                    <span>{adj.oldTargetCal}</span>
                    {adj.newTargetCal > adj.oldTargetCal ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                    )}
                    <span>{adj.newTargetCal}</span>
                  </div>

                  <div className="flex-shrink-0">
                    <span
                      data-testid={`status-label-${adj.id}`}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        adj.applied
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {adj.applied
                        ? t('adjustmentHistory.applied')
                        : t('adjustmentHistory.declined')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  },
);
