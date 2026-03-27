import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
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
    <div
      data-testid="pr-toast"
      className="fixed inset-x-4 top-4 z-50 cursor-pointer rounded-xl p-4 shadow-lg"
      style={{ background: 'linear-gradient(to right, #f59e0b, #d97706)' }}
      onClick={onDismiss}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onDismiss();
        }
      }}
      role="alert"
      tabIndex={0}
    >
      <p className="flex items-center gap-2 text-lg font-bold text-amber-900">
        <Trophy className="h-5 w-5" aria-hidden="true" />
        {t('fitness.gamification.newPR')}
      </p>
      <p data-testid="pr-details" className="text-sm text-amber-800">
        {pr.exerciseName}: {pr.newWeight}kg × {pr.reps} reps (+
        {pr.improvement}kg)
      </p>
    </div>
  );
});
