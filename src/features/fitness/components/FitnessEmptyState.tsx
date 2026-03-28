import React from 'react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';

interface FitnessEmptyStateProps {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  ctaKey?: string;
  onCtaClick?: () => void;
}

export const FitnessEmptyState: React.FC<FitnessEmptyStateProps> = ({
  icon: Icon,
  titleKey,
  descriptionKey,
  ctaKey,
  onCtaClick,
}) => {
  const { t } = useTranslation();

  return (
    <div
      data-testid="fitness-empty-state"
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Icon className="h-8 w-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
        {t(titleKey)}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
        {t(descriptionKey)}
      </p>
      {ctaKey && onCtaClick && (
        <button
          data-testid="empty-state-cta"
          type="button"
          onClick={onCtaClick}
          className="mt-4 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 active:scale-95"
        >
          {t(ctaKey)}
        </button>
      )}
    </div>
  );
};
