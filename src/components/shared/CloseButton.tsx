import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CloseButtonProps {
  onClick: () => void;
  'data-testid'?: string;
  /** Resolved aria-label string. Caller passes t('...') result. Default: t('common.closeDialog') computed internally. */
  ariaLabel?: string;
  /** Visual variant. 'default' = card/modal surface. 'overlay' = dark/video surface (white icon, backdrop-blur). */
  variant?: 'default' | 'overlay';
}

const VARIANT_STYLES = {
  default: 'text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring',
  overlay: 'text-white bg-card/20 hover:bg-card/30 backdrop-blur focus-visible:ring-ring',
} as const;

/**
 * Standardized close button for modals, sheets, and overlays.
 * Provides consistent 44px touch target, focus ring, and aria-label.
 */
export const CloseButton = ({
  onClick,
  'data-testid': testId,
  ariaLabel,
  variant = 'default',
}: Readonly<CloseButtonProps>) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-label={ariaLabel ?? t('common.closeDialog')}
      className={`flex min-h-11 min-w-11 items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:outline-none ${VARIANT_STYLES[variant]}`}
    >
      <X className="h-5 w-5" />
    </button>
  );
};
