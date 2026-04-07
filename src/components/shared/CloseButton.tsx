import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CloseButtonProps {
  onClick: () => void;
  'data-testid'?: string;
}

/**
 * Standardized close button for modals and bottom sheets.
 * Provides consistent 44px touch target, focus ring, and aria-label.
 */
export const CloseButton = ({ onClick, 'data-testid': testId }: Readonly<CloseButtonProps>) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-label={t('common.closeDialog')}
      className="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring flex min-h-11 min-w-11 items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:outline-none"
    >
      <X className="h-5 w-5" />
    </button>
  );
};
