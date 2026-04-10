import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const modalLayoutVariants = cva(
  'bg-card text-card-foreground relative flex min-h-0 flex-col overflow-hidden shadow-xl',
  {
    variants: {
      presentation: {
        dialog: 'w-full rounded-2xl',
        sheet: 'w-full rounded-t-2xl sm:rounded-2xl',
        fullscreen: 'h-full w-full rounded-none shadow-none',
      },
      size: {
        sm: 'sm:max-w-md',
        md: 'sm:max-w-xl',
        lg: 'sm:max-w-2xl',
        full: 'max-w-none',
      },
    },
    compoundVariants: [
      {
        presentation: ['dialog', 'sheet'],
        className: 'max-h-[90dvh]',
      },
      {
        presentation: 'fullscreen',
        className: 'max-h-none',
      },
    ],
    defaultVariants: {
      presentation: 'sheet',
      size: 'md',
    },
  },
);

interface ModalLayoutProps extends VariantProps<typeof modalLayoutVariants> {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

export function ModalLayout({
  header,
  children,
  footer,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  presentation,
  size,
}: Readonly<ModalLayoutProps>) {
  const isFullscreen = presentation === 'fullscreen';

  return (
    <section data-slot="modal-layout" className={cn(modalLayoutVariants({ presentation, size }), className)}>
      {header ? (
        <div
          data-slot="modal-layout-header"
          className={cn(
            'border-border bg-card shrink-0 border-b px-4 py-3 sm:px-6',
            isFullscreen && 'pt-safe',
            headerClassName,
          )}
        >
          {header}
        </div>
      ) : null}

      <div
        data-slot="modal-layout-body"
        className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6', bodyClassName)}
      >
        {children}
      </div>

      {footer ? (
        <div
          data-slot="modal-layout-footer"
          className={cn(
            'border-border bg-card/95 shrink-0 border-t px-4 py-3 backdrop-blur-sm sm:px-6',
            isFullscreen && 'pb-safe',
            footerClassName,
          )}
        >
          {footer}
        </div>
      ) : null}
    </section>
  );
}
