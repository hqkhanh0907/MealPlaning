import { AlertTriangle } from 'lucide-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { Adjustment } from '../hooks/useFeedbackLoop';
import { AUTO_ADJUST_CONFIG } from '../hooks/useFeedbackLoop';

export interface AutoAdjustBannerProps {
  adjustment: Adjustment;
  onApply: () => void;
  onDismiss: () => void;
}

export const AutoAdjustBanner = React.memo(function AutoAdjustBanner({
  adjustment,
  onApply,
  onDismiss,
}: AutoAdjustBannerProps) {
  const { t } = useTranslation();

  const handleApply = useCallback(() => {
    onApply();
  }, [onApply]);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const isDecrease = adjustment.newTargetCal < adjustment.oldTargetCal;
  const amount = AUTO_ADJUST_CONFIG.calorieAdjustment;
  const currentDelta = adjustment.newTargetCal - adjustment.oldTargetCal;

  let bodyKey: string;
  if (adjustment.reason.includes('increasing')) {
    bodyKey = 'adjustBanner.bodyGaining';
  } else if (adjustment.reason.includes('decreasing')) {
    bodyKey = 'adjustBanner.bodyLosing';
  } else {
    bodyKey = 'adjustBanner.bodyStalled';
  }

  const direction = isDecrease ? t('adjustBanner.directionDecrease') : t('adjustBanner.directionIncrease');

  const currAvg = adjustment.movingAvgWeight.toFixed(1);
  const prevAvgDisplay = (adjustment.movingAvgWeight + (currentDelta > 0 ? -0.2 : 0.2)).toFixed(1);

  const bodyText = t(bodyKey, {
    prevAvg: prevAvgDisplay,
    currAvg,
    direction,
    amount: String(amount),
  });

  return (
    <div
      data-testid="auto-adjust-banner"
      role="alert"
      aria-label={t('adjustBanner.ariaLabel')}
      className="bg-warning rounded-lg p-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-white" data-testid="banner-icon" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p data-testid="banner-title" className="text-sm leading-tight font-semibold text-white">
            {t('adjustBanner.title')}
          </p>
          <p data-testid="banner-body" className="mt-1 text-xs leading-snug text-white/90">
            {bodyText}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              data-testid="banner-apply-btn"
              type="button"
              onClick={handleApply}
              className="bg-card hover:bg-card/90 rounded px-3 py-1.5 text-xs font-semibold text-amber-950 transition-colors"
            >
              {t('adjustBanner.apply')}
            </button>
            <button
              data-testid="banner-dismiss-btn"
              type="button"
              onClick={handleDismiss}
              className="rounded border border-white/30 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:border-white/50 hover:text-white"
            >
              {t('adjustBanner.dismiss')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
