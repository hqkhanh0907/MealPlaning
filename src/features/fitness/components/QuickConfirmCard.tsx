import { Check, Dumbbell, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { OverloadSuggestion } from '../hooks/useProgressiveOverload';

interface QuickConfirmCardProps {
  exerciseName: string;
  suggestion: OverloadSuggestion;
  onConfirm: (suggestion: OverloadSuggestion) => void;
  onCustomize: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  progressive_overload: 'Progressive overload',
  rep_progression: 'Rep progression',
  manual: 'Manual entry',
};

export function QuickConfirmCard({
  exerciseName,
  suggestion,
  onConfirm,
  onCustomize,
}: Readonly<QuickConfirmCardProps>) {
  const { t } = useTranslation();
  return (
    <div className="border-info/20 bg-info/10 rounded-xl border p-4" data-testid="quick-confirm-card">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Dumbbell className="h-4 w-4" />
        <span>{exerciseName}</span>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <p className="text-foreground text-2xl font-bold">
            {t('fitness.setFormat', { weight: suggestion.weight, reps: suggestion.reps })}
          </p>
          <p className="text-muted-foreground text-xs">{SOURCE_LABELS[suggestion.source] ?? suggestion.source}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCustomize}
            aria-label={t('common.edit')}
            className="text-muted-foreground focus-visible:ring-ring/50 rounded-lg border p-2 focus-visible:ring-3"
            data-testid="customize-button"
          >
            <Pencil className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onConfirm(suggestion)}
            aria-label={t('common.confirm')}
            className="bg-info focus-visible:ring-ring/50 rounded-lg p-2 text-white focus-visible:ring-3"
            data-testid="quick-confirm-button"
          >
            <Check className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
