import { CalendarPlus, ChevronRight, Dumbbell, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '../../../components/shared/EmptyState';
import { createSurfaceStateContract } from '../../../components/shared/surfaceState';

export type PlanEmptyContext = 'no-plan' | 'expired-plan' | 'manual-no-exercises';

export interface PlanEmptyStateProps {
  readonly context: PlanEmptyContext;
  readonly onAction: () => void;
  readonly isGenerating?: boolean;
}

export function PlanEmptyState({ context, onAction, isGenerating = false }: PlanEmptyStateProps) {
  const { t } = useTranslation();

  if (context === 'expired-plan') {
    return (
      <div data-testid="training-plan-view" className="flex flex-col items-center justify-center py-12 text-center">
        <div data-testid="plan-expired-cta" className="flex flex-col items-center gap-4">
          <RefreshCw className="text-warning h-12 w-12" aria-hidden="true" />
          <h3 className="text-foreground text-lg font-semibold">{t('fitness.plan.planExpired')}</h3>
          <p className="text-muted-foreground max-w-xs text-sm">{t('fitness.plan.planExpiredMessage')}</p>
          <button
            data-testid="create-new-cycle-btn"
            type="button"
            onClick={onAction}
            className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-[colors,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-95 motion-reduce:transform-none"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('fitness.plan.createNewCycle')}
          </button>
        </div>
      </div>
    );
  }

  if (context === 'manual-no-exercises') {
    const manualContract = createSurfaceStateContract({
      surface: 'fitness.plan',
      state: 'setup',
      copy: {
        title: t('fitness.plan.manualReadyTitle'),
        missing: t('fitness.plan.manualReadyMissing'),
        reason: t('fitness.plan.manualReadyReason'),
        nextStep: t('fitness.plan.manualReadyNextStep'),
      },
      primaryAction: { label: t('fitness.plan.createFirstWorkout') },
    });

    return (
      <div data-testid="training-plan-view" className="py-12">
        <div data-testid="manual-plan-cta" className="space-y-4 text-center">
          <EmptyState variant="hero" icon={CalendarPlus} contract={manualContract} />
          <p className="text-muted-foreground text-sm">{t('fitness.plan.manualReadyValue')}</p>
          <button
            data-testid="create-manual-plan-btn"
            type="button"
            onClick={onAction}
            className="bg-primary text-primary-foreground hover:bg-primary mx-auto flex min-h-[44px] items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-[colors,transform] active:scale-95"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            {t('fitness.plan.createFirstWorkout')}
          </button>
        </div>
      </div>
    );
  }

  // 'no-plan' context
  const autoContract = createSurfaceStateContract({
    surface: 'fitness.plan',
    state: 'setup',
    copy: {
      title: t('fitness.plan.autoReadyTitle'),
      missing: t('fitness.plan.autoReadyMissing'),
      reason: t('fitness.plan.autoReadyReason'),
      nextStep: t('fitness.plan.autoReadyNextStep'),
    },
    primaryAction: { label: t('fitness.plan.createPlan') },
  });

  return (
    <div data-testid="training-plan-view" className="py-12">
      <div data-testid="no-plan-cta" className="space-y-4 text-center">
        <EmptyState variant="hero" icon={Dumbbell} contract={autoContract} />
        <p className="text-muted-foreground text-sm">{t('fitness.plan.autoReadyValue')}</p>
        <button
          data-testid="create-plan-btn"
          type="button"
          onClick={onAction}
          disabled={isGenerating}
          className="bg-primary text-primary-foreground hover:bg-primary mx-auto flex min-h-[44px] items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-[colors,transform] active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('fitness.plan.generating')}
            </>
          ) : (
            <>
              {t('fitness.plan.createPlan')}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
        {isGenerating && (
          <div className="text-primary inline-flex items-center gap-2 text-sm font-medium">
            <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t('fitness.plan.generating')}
          </div>
        )}
      </div>
    </div>
  );
}
