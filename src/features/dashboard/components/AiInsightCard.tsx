import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Gauge,
  Lightbulb,
  Scale,
  Sparkles,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import type { InsightColor, InsightType } from '../hooks/useInsightEngine';
import { useInsightEngine } from '../hooks/useInsightEngine';

const ICON_MAP: Record<InsightType, React.ComponentType<{ className?: string }>> = {
  adjust: Gauge,
  alert: AlertTriangle,
  action: Zap,
  remind: Scale,
  motivate: Sparkles,
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
    bg: 'bg-warning/20',
    border: 'border-warning',
    icon: 'text-warning',
    title: 'text-warning',
    message: 'text-warning/80',
    action: 'text-warning hover:bg-warning/10',
    dismiss: 'text-warning/70 hover:text-warning',
  },
  amber: {
    bg: 'bg-warning/10',
    border: 'border-warning',
    icon: 'text-warning',
    title: 'text-warning',
    message: 'text-warning/80',
    action: 'text-warning hover:bg-warning/10',
    dismiss: 'text-warning/70 hover:text-warning',
  },
  blue: {
    bg: 'bg-info/10',
    border: 'border-info',
    icon: 'text-info',
    title: 'text-info',
    message: 'text-info/80',
    action: 'text-info hover:bg-info/10',
    dismiss: 'text-info/70 hover:text-info',
  },
  green: {
    bg: 'bg-primary-subtle',
    border: 'border-primary dark:border-primary',
    icon: 'text-primary',
    title: 'text-primary',
    message: 'text-primary-emphasis',
    action: 'text-primary-emphasis hover:bg-primary/10',
    dismiss: 'text-primary dark:text-primary hover:text-primary-emphasis',
  },
  gray: {
    bg: 'bg-ai-subtle',
    border: 'border-ai/20',
    icon: 'text-ai',
    title: 'text-foreground',
    message: 'text-foreground-secondary',
    action: 'text-ai hover:bg-ai/10',
    dismiss: 'text-muted-foreground hover:text-foreground-secondary',
  },
};

const INSIGHT_TYPE_KEYS: Record<InsightType, string> = {
  adjust: 'insightCard.type.adjust',
  alert: 'insightCard.type.alert',
  action: 'insightCard.type.action',
  remind: 'insightCard.type.remind',
  motivate: 'insightCard.type.motivate',
  celebrate: 'insightCard.type.celebrate',
  praise: 'insightCard.type.praise',
  progress: 'insightCard.type.progress',
  tip: 'insightCard.type.tip',
};

const ICON_COLOR_OVERRIDE: Partial<Record<InsightType, string>> = {
  action: 'text-ai',
  motivate: 'text-ai',
};

export const AiInsightCard = React.memo(function AiInsightCard({
  suppressAction = false,
}: Readonly<{ suppressAction?: boolean }>) {
  const { t } = useTranslation();
  const { currentInsight, dismissInsight, handleAction } = useInsightEngine();

  const onDismiss = useCallback(() => {
    /* v8 ignore start -- defensive: dismiss button only renders when dismissable=true */
    if (currentInsight?.dismissable) {
      dismissInsight(currentInsight.id);
    }
    /* v8 ignore stop */
  }, [currentInsight, dismissInsight]);

  const onAction = useCallback(() => {
    /* v8 ignore start -- defensive: action button only renders when currentInsight exists */
    if (currentInsight) {
      handleAction(currentInsight);
    }
    /* v8 ignore stop */
  }, [currentInsight, handleAction]);

  if (!currentInsight) {
    return <div data-testid="ai-insight-card-empty" className="min-h-[56px]" aria-hidden="true" />;
  }

  const IconComponent = ICON_MAP[currentInsight.type];
  const colors = COLOR_MAP[currentInsight.color];
  const typeLabel = t(INSIGHT_TYPE_KEYS[currentInsight.type]);
  const iconColor = ICON_COLOR_OVERRIDE[currentInsight.type] ?? colors.icon;

  return (
    <section
      data-testid="ai-insight-card"
      aria-label={`${typeLabel}: ${currentInsight.title}`}
      className={`relative min-h-[56px] rounded-lg border-l-4 ${colors.border} ${colors.bg} flex items-start gap-3 p-4`}
    >
      <div className="mt-0.5 flex-shrink-0" data-testid="insight-icon">
        <IconComponent className={`h-5 w-5 ${iconColor}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p data-testid="insight-title" className={`text-sm leading-tight font-semibold ${colors.title}`}>
          {currentInsight.title}
        </p>
        <p data-testid="insight-message" className={`mt-0.5 text-xs leading-snug ${colors.message}`}>
          {currentInsight.message}
        </p>

        {currentInsight.actionLabel && !suppressAction && (
          <Button
            variant="ghost"
            size="sm"
            data-testid="insight-action-btn"
            onClick={onAction}
            className={`interactive mt-1.5 min-h-11 gap-1 px-2 py-1 ${colors.action}`}
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
          className={`interactive min-h-11 min-w-11 shrink-0 ${colors.dismiss}`}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </section>
  );
});
