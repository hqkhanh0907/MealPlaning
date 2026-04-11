import type { LucideIcon } from 'lucide-react';
import { BarChart3, Dumbbell, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../../../components/shared/EmptyState';

export type PlanEmptyContext = 'no-plan' | 'no-history' | 'no-progress' | 'empty-plan-day' | 'search-no-results';

export interface PlanEmptyStateProps {
  readonly context: PlanEmptyContext;
  readonly onAction: () => void;
}

interface ContextConfig {
  readonly variant: 'hero' | 'standard' | 'compact';
  readonly icon?: LucideIcon;
  readonly titleKey: string;
  readonly descriptionKey?: string;
  readonly ctaKey: string;
}

const CONTEXT_CONFIG: Record<PlanEmptyContext, ContextConfig> = {
  'no-plan': {
    variant: 'hero',
    icon: Target,
    titleKey: 'fitness.emptyState.noPlanTitle',
    descriptionKey: 'fitness.emptyState.noPlanDescription',
    ctaKey: 'fitness.emptyState.noPlanCta',
  },
  'no-history': {
    variant: 'standard',
    icon: Dumbbell,
    titleKey: 'fitness.emptyState.noHistoryTitle',
    descriptionKey: 'fitness.emptyState.noHistoryDescription',
    ctaKey: 'fitness.emptyState.noHistoryCta',
  },
  'no-progress': {
    variant: 'standard',
    icon: BarChart3,
    titleKey: 'fitness.emptyState.noProgressTitle',
    descriptionKey: 'fitness.emptyState.noProgressDescription',
    ctaKey: 'fitness.emptyState.noProgressCta',
  },
  'empty-plan-day': {
    variant: 'compact',
    titleKey: 'fitness.emptyState.emptyDayTitle',
    ctaKey: 'fitness.emptyState.emptyDayCta',
  },
  'search-no-results': {
    variant: 'compact',
    titleKey: 'fitness.emptyState.searchNoResultsTitle',
    ctaKey: 'fitness.emptyState.searchNoResultsCta',
  },
};

export function PlanEmptyState({ context, onAction }: Readonly<PlanEmptyStateProps>) {
  const { t } = useTranslation();
  const config = CONTEXT_CONFIG[context];

  return (
    <EmptyState
      variant={config.variant}
      icon={config.icon}
      title={t(config.titleKey)}
      description={config.descriptionKey ? t(config.descriptionKey) : undefined}
      actionLabel={t(config.ctaKey)}
      onAction={onAction}
    />
  );
}
