import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Beef,
  Scale,
  Flame,
  Trophy,
  CheckCircle,
  TrendingUp,
  Lightbulb,
  X,
  ChevronRight,
} from 'lucide-react';
import type { InsightType, InsightColor } from '../hooks/useInsightEngine';
import { useInsightEngine } from '../hooks/useInsightEngine';

const ICON_MAP: Record<InsightType, React.FC<{ className?: string }>> = {
  alert: AlertTriangle,
  action: Beef,
  remind: Scale,
  motivate: Flame,
  celebrate: Trophy,
  praise: CheckCircle,
  progress: TrendingUp,
  tip: Lightbulb,
};

interface ColorConfig {
  bg: string;
  border: string;
  icon: string;
  title: string;
  message: string;
  action: string;
  dismiss: string;
}

const COLOR_MAP: Record<InsightColor, ColorConfig> = {
  'dark-amber': {
    bg: 'bg-amber-900/10 dark:bg-amber-900/20',
    border: 'border-amber-800 dark:border-amber-700',
    icon: 'text-amber-800 dark:text-amber-400',
    title: 'text-amber-900 dark:text-amber-300',
    message: 'text-amber-800 dark:text-amber-400',
    action: 'text-amber-900 dark:text-amber-300 hover:bg-amber-900/10',
    dismiss: 'text-amber-700 dark:text-amber-500 hover:text-amber-900 dark:hover:text-amber-300',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/15',
    border: 'border-amber-500 dark:border-amber-600',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-800 dark:text-amber-300',
    message: 'text-amber-700 dark:text-amber-400',
    action: 'text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/20',
    dismiss: 'text-amber-500 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-300',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/15',
    border: 'border-blue-500 dark:border-blue-600',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-300',
    message: 'text-blue-700 dark:text-blue-400',
    action: 'text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20',
    dismiss: 'text-blue-500 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-300',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/15',
    border: 'border-emerald-500 dark:border-emerald-600',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-800 dark:text-emerald-300',
    message: 'text-emerald-700 dark:text-emerald-400',
    action: 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/20',
    dismiss: 'text-emerald-500 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300',
  },
  gray: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-400 dark:border-slate-600',
    icon: 'text-slate-500 dark:text-slate-400',
    title: 'text-slate-700 dark:text-slate-300',
    message: 'text-slate-600 dark:text-slate-400',
    action: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50',
    dismiss: 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
  },
};

const ICON_PREFIX_MAP: Record<InsightType, string> = {
  alert: '⚠️',
  action: '🥩',
  remind: '⚖️',
  motivate: '🔥',
  celebrate: '🏆',
  praise: '✅',
  progress: '📈',
  tip: '💡',
};

export const AiInsightCard: React.FC = React.memo(function AiInsightCard() {
  const { t } = useTranslation();
  const { currentInsight, dismissInsight, handleAction } = useInsightEngine();

  const onDismiss = useCallback(() => {
    if (currentInsight?.dismissable) {
      dismissInsight(currentInsight.id);
    }
  }, [currentInsight, dismissInsight]);

  const onAction = useCallback(() => {
    if (currentInsight) {
      handleAction(currentInsight);
    }
  }, [currentInsight, handleAction]);

  if (!currentInsight) {
    return (
      <div
        data-testid="ai-insight-card-empty"
        className="min-h-[56px]"
        aria-hidden="true"
      />
    );
  }

  const IconComponent = ICON_MAP[currentInsight.type];
  const colors = COLOR_MAP[currentInsight.color];
  const iconPrefix = ICON_PREFIX_MAP[currentInsight.type];

  return (
    <div
      data-testid="ai-insight-card"
      role="region"
      aria-label={`${iconPrefix} ${currentInsight.title}`}
      className={`relative min-h-[56px] rounded-lg border-l-4 ${colors.border} ${colors.bg} p-3 flex items-start gap-3`}
    >
      <div className="flex-shrink-0 mt-0.5" data-testid="insight-icon">
        <IconComponent className={`w-5 h-5 ${colors.icon}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          data-testid="insight-title"
          className={`text-sm font-bold leading-tight ${colors.title}`}
        >
          {currentInsight.title}
        </p>
        <p
          data-testid="insight-message"
          className={`text-xs mt-0.5 leading-snug ${colors.message}`}
        >
          {currentInsight.message}
        </p>

        {currentInsight.actionLabel && (
          <button
            data-testid="insight-action-btn"
            type="button"
            onClick={onAction}
            className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold rounded px-2 py-1 transition-colors ${colors.action}`}
          >
            {currentInsight.actionLabel}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {currentInsight.dismissable && (
        <button
          data-testid="insight-dismiss-btn"
          type="button"
          onClick={onDismiss}
          aria-label={t('insightCard.dismiss')}
          className={`flex-shrink-0 p-1 rounded transition-colors ${colors.dismiss}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});
