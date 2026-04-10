import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface CardLayoutProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
}

export function CardLayout({
  header,
  children,
  footer,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
}: Readonly<CardLayoutProps>) {
  return (
    <section
      data-slot="card-layout"
      className={cn(
        'bg-card text-card-foreground flex flex-col overflow-hidden rounded-2xl border shadow-sm',
        className,
      )}
    >
      {header ? (
        <div data-slot="card-layout-header" className={cn('shrink-0 border-b px-4 py-3 sm:px-5', headerClassName)}>
          {header}
        </div>
      ) : null}

      <div data-slot="card-layout-content" className={cn('min-w-0 flex-1 px-4 py-4 sm:px-5', contentClassName)}>
        {children}
      </div>

      {footer ? (
        <div data-slot="card-layout-footer" className={cn('shrink-0 border-t px-4 py-3 sm:px-5', footerClassName)}>
          {footer}
        </div>
      ) : null}
    </section>
  );
}
