import { type ReactNode, type SyntheticEvent, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CompactFormProps {
  readonly variant: 'onboarding' | 'settings';
  readonly ctaLabel: string;
  readonly onSubmit: () => void;
  readonly isValid: boolean;
  readonly isSubmitting?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
}

const VARIANT_CLASSES = {
  onboarding: 'px-6 py-8',
  settings: 'px-4 py-4',
} as const;

function scrollToFirstError(form: HTMLFormElement): void {
  const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstInvalid.focus();
  }
}

export function CompactForm({
  variant,
  ctaLabel,
  onSubmit,
  isValid,
  isSubmitting = false,
  children,
  className,
}: CompactFormProps) {
  const handleSubmit = useCallback(
    (e: SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!isValid || isSubmitting) {
        scrollToFirstError(e.currentTarget);
        return;
      }
      onSubmit();
    },
    [isValid, isSubmitting, onSubmit],
  );

  return (
    <form
      data-testid="compact-form"
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-[--spacing-card-gap]', VARIANT_CLASSES[variant], className)}
      noValidate
    >
      {children}

      <Button
        type="submit"
        size="lg"
        disabled={!isValid || isSubmitting}
        className="mt-auto h-12 w-full rounded-xl font-semibold active:scale-[0.97] motion-safe:transition-transform motion-safe:duration-100"
        data-testid="compact-form-cta"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {ctaLabel}
          </span>
        ) : (
          ctaLabel
        )}
      </Button>
    </form>
  );
}
