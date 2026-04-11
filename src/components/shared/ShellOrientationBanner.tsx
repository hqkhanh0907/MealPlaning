interface ShellOrientationBannerProps {
  eyebrow: string;
  title: string;
  description: string;
  nextStep: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
  testId?: string;
}

export function ShellOrientationBanner({
  eyebrow,
  title,
  description,
  nextStep,
  actionLabel,
  onAction,
  variant = 'default',
  className = '',
  testId,
}: Readonly<ShellOrientationBannerProps>) {
  const isCompact = variant === 'compact';

  return (
    <section
      className={`border-border bg-card/90 animate-fade-in rounded-2xl border ${isCompact ? 'px-4 py-4' : 'px-5 py-5 sm:px-6'} ${className}`}
      data-testid={testId}
      aria-label={title}
    >
      <p className="text-primary mb-2 text-xs font-semibold tracking-[0.16em] uppercase">{eyebrow}</p>
      <div
        className={`flex ${isCompact ? 'flex-col gap-3' : 'flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'}`}
      >
        <div className="min-w-0 space-y-1.5">
          <h2 className={`text-foreground ${isCompact ? 'text-base' : 'text-xl'} font-semibold`}>{title}</h2>
          <p className="text-muted-foreground text-sm leading-6">{description}</p>
          <p className="text-foreground/80 text-sm font-medium">{nextStep}</p>
        </div>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="bg-primary text-primary-foreground hover:bg-primary-emphasis inline-flex shrink-0 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </section>
  );
}
