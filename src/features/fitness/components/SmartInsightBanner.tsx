import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { FitnessNutritionInsight } from '../hooks/useFitnessNutritionBridge';

const COLOR_MAP: Record<FitnessNutritionInsight['severity'], string> = {
  info: 'bg-status-info/10 border-status-info/20 text-status-info',
  warning: 'bg-status-warning/10 border-status-warning/20 text-status-warning',
  success: 'bg-primary-subtle border-primary/20 text-primary-emphasis',
};

const ICON_MAP: Record<FitnessNutritionInsight['severity'], typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
};

export function SmartInsightBanner({
  insight,
}: Readonly<{
  insight: FitnessNutritionInsight;
}>) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const Icon = ICON_MAP[insight.severity];

  return (
    <div
      className={`mb-3 flex items-start gap-3 rounded-xl border p-3 ${COLOR_MAP[insight.severity]}`}
      data-testid="smart-insight-banner"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{insight.title}</p>
        <p className="text-xs opacity-80">{insight.message}</p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="-m-1 flex h-8 w-8 items-center justify-center rounded-md opacity-50 hover:opacity-100"
        data-testid="dismiss-insight"
        aria-label={t('common.dismiss')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
