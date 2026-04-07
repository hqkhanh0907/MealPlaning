import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  variant?: 'compact' | 'standard' | 'hero';
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  variant = 'standard',
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) => {
  if (variant === 'compact') {
    return (
      <div className={`animate-fade-in px-4 py-6 text-center ${className}`}>
        <p className="text-muted-foreground text-sm font-medium">{title}</p>
        {description && <p className="text-muted-foreground mt-1 text-xs">{description}</p>}
        {actionLabel && onAction && (
          <button type="button" onClick={onAction} className="text-primary mt-2 text-sm font-semibold hover:underline">
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div
        className={`animate-slide-up bg-card border-border rounded-2xl border border-dashed px-8 py-16 text-center sm:px-12 ${className}`}
      >
        {Icon && (
          <div className="bg-primary-subtle mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Icon className="text-primary h-8 w-8" aria-hidden="true" />
          </div>
        )}
        <h3 className="text-foreground mb-2 text-xl font-semibold">{title}</h3>
        {description && <p className="text-muted-foreground mb-4 text-sm">{description}</p>}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary-emphasis inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" aria-hidden="true" /> {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`animate-fade-in px-6 py-12 text-center ${className}`}>
      {Icon && (
        <div className="bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <Icon className="text-muted-foreground h-6 w-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-foreground mb-1 text-lg font-semibold">{title}</h3>
      {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="bg-primary text-primary-foreground hover:bg-primary-emphasis mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> {actionLabel}
        </button>
      )}
    </div>
  );
};
