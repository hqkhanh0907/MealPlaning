import React from 'react';
import { useTranslation } from 'react-i18next';
import { PartyPopper, X } from 'lucide-react';
import { useFitnessStore } from '../../../store/fitnessStore';

export const PlanGeneratedCard: React.FC = () => {
  const { t } = useTranslation();
  const showPlanCelebration = useFitnessStore((s) => s.showPlanCelebration);
  const dismissPlanCelebration = useFitnessStore((s) => s.dismissPlanCelebration);
  const trainingPlans = useFitnessStore((s) => s.trainingPlans);

  if (!showPlanCelebration) return null;

  const activePlan = trainingPlans.find((p) => p.status === 'active');

  return (
    <div
      data-testid="plan-generated-card"
      className="relative mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white"
    >
      <button
        data-testid="dismiss-celebration"
        type="button"
        onClick={dismissPlanCelebration}
        className="absolute right-3 top-3 rounded-full p-1 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
        aria-label={t('common.close')}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
          <PartyPopper className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-bold">{t('fitness.celebration.title')}</h3>
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
