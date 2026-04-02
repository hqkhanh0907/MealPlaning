import { Check, Dumbbell, Pencil } from 'lucide-react';

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
  return (
    <div
      className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20"
      data-testid="quick-confirm-card"
    >
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Dumbbell className="h-4 w-4" />
        <span>{exerciseName}</span>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {suggestion.weight}kg × {suggestion.reps}
          </p>
          <p className="text-xs text-slate-400">{SOURCE_LABELS[suggestion.source] ?? suggestion.source}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCustomize}
            className="rounded-lg border p-2 text-slate-400"
            data-testid="customize-button"
          >
            <Pencil className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => onConfirm(suggestion)}
            className="rounded-lg bg-blue-600 p-2 text-white"
            data-testid="quick-confirm-button"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
