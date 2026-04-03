import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useState } from 'react';

import type { FitnessNutritionInsight } from '../hooks/useFitnessNutritionBridge';

const COLOR_MAP: Record<FitnessNutritionInsight['severity'], string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
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
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
