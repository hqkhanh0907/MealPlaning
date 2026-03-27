import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import type { Adjustment } from '../hooks/useFeedbackLoop';
import { AUTO_ADJUST_CONFIG } from '../hooks/useFeedbackLoop';

export interface AutoAdjustBannerProps {
  adjustment: Adjustment;
  onApply: () => void;
  onDismiss: () => void;
}

export const AutoAdjustBanner: React.FC<AutoAdjustBannerProps> = React.memo(
  function AutoAdjustBanner({ adjustment, onApply, onDismiss }) {
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

    const direction = isDecrease
      ? t('adjustBanner.directionDecrease')
      : t('adjustBanner.directionIncrease');

    const currAvg = adjustment.movingAvgWeight.toFixed(1);
    const prevAvgDisplay = (
      adjustment.movingAvgWeight + (currentDelta > 0 ? -0.2 : 0.2)
    ).toFixed(1);

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
        className="rounded-lg bg-amber-950 p-4"
        style={{ backgroundColor: '#92400e' }}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle
              className="w-5 h-5 text-white"
              data-testid="banner-icon"
              aria-hidden="true"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              data-testid="banner-title"
              className="text-sm font-bold text-white leading-tight"
            >
              {t('adjustBanner.title')}
            </p>
            <p
              data-testid="banner-body"
              className="text-xs text-white/90 mt-1 leading-snug"
            >
              {bodyText}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                data-testid="banner-apply-btn"
                type="button"
                onClick={handleApply}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-white text-amber-950 hover:bg-white/90 transition-colors"
              >
                {t('adjustBanner.apply')}
              </button>
              <button
                data-testid="banner-dismiss-btn"
                type="button"
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs font-semibold rounded text-white/80 hover:text-white border border-white/30 hover:border-white/50 transition-colors"
              >
                {t('adjustBanner.dismiss')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
