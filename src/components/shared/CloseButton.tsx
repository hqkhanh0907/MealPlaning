import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CloseButtonProps {
  onClick: () => void;
  'data-testid'?: string;
  ariaLabel?: string;
  variant?: 'default' | 'overlay';
}

const VARIANT_STYLES = {
  default: 'border-border/60 bg-card/90 text-muted-foreground hover:bg-accent hover:text-foreground',
  overlay: 'border-white/20 bg-black/30 text-white hover:bg-black/45',
} as const;

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
      className={`focus-visible:ring-ring inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${VARIANT_STYLES[variant]}`}
    >
      <X aria-hidden="true" className="h-5 w-5 shrink-0" />
    </button>
  );
};
