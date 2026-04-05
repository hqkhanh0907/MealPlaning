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
      className="from-primary/90 to-primary relative mb-4 rounded-2xl bg-gradient-to-br p-4 text-white"
    >
      <button
        data-testid="dismiss-celebration"
        type="button"
        onClick={dismissPlanCelebration}
        className="hover:bg-card/20 absolute top-3 right-3 rounded-full p-1 text-white/70 transition-colors hover:text-white"
        aria-label={t('common.close')}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="flex items-center gap-3">
        <div className="bg-card/20 flex h-12 w-12 items-center justify-center rounded-full">
          <PartyPopper className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{t('fitness.celebration.title')}</h3>
          <p className="text-sm text-white/90">{t('fitness.celebration.subtitle')}</p>
        </div>
      </div>

      {activePlan && (
        <p className="mt-3 text-sm text-white/80">
          {t('fitness.celebration.planSummary', {
            split: activePlan.splitType,
            weeks: activePlan.durationWeeks,
          })}
        </p>
      )}
    </div>
  );
};
