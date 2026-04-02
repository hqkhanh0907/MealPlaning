import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useState } from 'react';

import type { FitnessNutritionInsight } from '../hooks/useFitnessNutritionBridge';

const COLOR_MAP: Record<FitnessNutritionInsight['severity'], string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
  success: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
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
      className={`mx-4 flex items-start gap-3 rounded-xl border p-3 ${COLOR_MAP[insight.severity]}`}
      data-testid="smart-insight-banner"
      role="alert"
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{insight.title}</p>
        <p className="text-xs opacity-80">{insight.message}</p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="opacity-50 hover:opacity-100"
        data-testid="dismiss-insight"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
