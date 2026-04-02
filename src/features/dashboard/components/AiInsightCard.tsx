import {
  AlertTriangle,
  Beef,
  CheckCircle,
  ChevronRight,
  Flame,
  Lightbulb,
  Scale,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import type { InsightColor, InsightType } from '../hooks/useInsightEngine';
import { useInsightEngine } from '../hooks/useInsightEngine';

const ICON_MAP: Record<InsightType, React.ComponentType<{ className?: string }>> = {
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
    border: 'border-primary dark:border-primary',
    icon: 'text-primary',
    title: 'text-emerald-800',
    message: 'text-emerald-700',
    action: 'text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/20',
    dismiss: 'text-primary dark:text-primary hover:text-emerald-700',
  },
  gray: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-400 dark:border-slate-600',
    icon: 'text-muted-foreground',
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

export const AiInsightCard = React.memo(function AiInsightCard() {
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
    return <div data-testid="ai-insight-card-empty" className="min-h-[56px]" aria-hidden="true" />;
  }

  const IconComponent = ICON_MAP[currentInsight.type];
  const colors = COLOR_MAP[currentInsight.color];
  const iconPrefix = ICON_PREFIX_MAP[currentInsight.type];

  return (
    <section
      data-testid="ai-insight-card"
      aria-label={`${iconPrefix} ${currentInsight.title}`}
      className={`relative min-h-[56px] rounded-lg border-l-4 ${colors.border} ${colors.bg} flex items-start gap-3 p-3`}
    >
      <div className="mt-0.5 flex-shrink-0" data-testid="insight-icon">
        <IconComponent className={`h-5 w-5 ${colors.icon}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p data-testid="insight-title" className={`text-sm leading-tight font-bold ${colors.title}`}>
          {currentInsight.title}
        </p>
        <p data-testid="insight-message" className={`mt-0.5 text-xs leading-snug ${colors.message}`}>
          {currentInsight.message}
        </p>

        {currentInsight.actionLabel && (
          <Button
            variant="ghost"
            size="sm"
            data-testid="insight-action-btn"
            onClick={onAction}
            className={`mt-1.5 min-h-11 gap-1 px-2 py-1 ${colors.action}`}
          >
            {currentInsight.actionLabel}
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>

      {currentInsight.dismissable && (
        <Button
          variant="ghost"
          size="icon-xs"
          data-testid="insight-dismiss-btn"
          onClick={onDismiss}
          aria-label={t('insightCard.dismiss')}
          className={`min-h-11 min-w-11 shrink-0 ${colors.dismiss}`}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </section>
  );
});
