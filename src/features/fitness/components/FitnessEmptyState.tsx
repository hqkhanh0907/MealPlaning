import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FitnessEmptyStateProps {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  ctaKey?: string;
  onCtaClick?: () => void;
}

export const FitnessEmptyState = ({
  icon: Icon,
  titleKey,
  descriptionKey,
  ctaKey,
  onCtaClick,
}: FitnessEmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <div data-testid="fitness-empty-state" className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-foreground text-lg font-semibold">{t(titleKey)}</h3>
      <p className="text-muted-foreground mt-1 max-w-xs text-sm">{t(descriptionKey)}</p>
      {ctaKey && onCtaClick && (
        <button
          data-testid="empty-state-cta"
          type="button"
          onClick={onCtaClick}
          className="bg-primary text-primary-foreground hover:bg-primary mt-4 rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors active:scale-95"
        >
          {t(ctaKey)}
        </button>
      )}
    </div>
  );
};
