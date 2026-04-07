import { PartyPopper, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useFitnessStore } from '../../../store/fitnessStore';
import { selectActivePlan } from '../../../store/selectors/fitnessSelectors';

export const PlanGeneratedCard = () => {
  const { t } = useTranslation();
  const showPlanCelebration = useFitnessStore(s => s.showPlanCelebration);
  const dismissPlanCelebration = useFitnessStore(s => s.dismissPlanCelebration);
  const activePlan = useFitnessStore(selectActivePlan);

  if (!showPlanCelebration) return null;

  return (
    <div
      data-testid="plan-generated-card"
      className="from-primary/90 to-primary text-primary-foreground relative mb-4 rounded-2xl bg-gradient-to-br p-4"
    >
      <button
        data-testid="dismiss-celebration"
        type="button"
        onClick={dismissPlanCelebration}
        className="hover:bg-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground absolute top-3 right-3 rounded-full p-1 transition-colors"
        aria-label={t('common.close')}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="flex items-center gap-3">
        <div className="bg-primary-foreground/20 flex h-12 w-12 items-center justify-center rounded-full">
          <PartyPopper className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">{t('fitness.celebration.title')}</h3>
          <p className="text-primary-foreground/90 text-sm">{t('fitness.celebration.subtitle')}</p>
        </div>
      </div>

      {activePlan && (
        <p className="text-primary-foreground/80 mt-3 text-sm">
          {t('fitness.celebration.planSummary', {
            split: activePlan.splitType,
            weeks: activePlan.durationWeeks,
          })}
        </p>
      )}
    </div>
  );
};
