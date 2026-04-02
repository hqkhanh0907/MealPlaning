import { Trophy } from 'lucide-react';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { COLORS } from '@/constant/colors';

import type { PRDetection } from '../utils/gamification';

interface PRToastProps {
  pr: PRDetection;
  onDismiss: () => void;
}

export const PRToast = React.memo(function PRToast({ pr, onDismiss }: PRToastProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <button
      type="button"
      data-testid="pr-toast"
      className="fixed inset-x-4 top-4 z-50 w-auto cursor-pointer appearance-none rounded-xl border-none p-4 text-left shadow-lg"
      style={{ background: `linear-gradient(to right, ${COLORS.amber500}, ${COLORS.amber600})` }}
      onClick={onDismiss}
      aria-label={t('fitness.gamification.newPR')}
    >
      <p className="flex items-center gap-2 text-lg font-bold text-amber-900">
        <Trophy className="h-5 w-5" aria-hidden="true" />
        {t('fitness.gamification.newPR')}
      </p>
      <p data-testid="pr-details" className="text-sm text-amber-800">
        {pr.exerciseName}: {pr.newWeight}kg \u00d7 {pr.reps} reps (+
        {pr.improvement}kg)
      </p>
    </button>
  );
});
