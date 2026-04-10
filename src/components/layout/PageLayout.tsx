import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageLayoutProps {
  topBar?: ReactNode;
  children: ReactNode;
  stickyAction?: ReactNode;
  className?: string;
  topBarClassName?: string;
  contentClassName?: string;
  stickyActionClassName?: string;
}

export function PageLayout({
  topBar,
  children,
  stickyAction,
  className,
  topBarClassName,
  contentClassName,
  stickyActionClassName,
}: Readonly<PageLayoutProps>) {
  return (
    <div
      data-slot="page-layout"
      className={cn('bg-muted dark:bg-background flex min-h-full flex-1 flex-col', className)}
    >
      {topBar ? (
        <div data-slot="page-layout-top-bar" className={cn('pt-safe shrink-0', topBarClassName)}>
          {topBar}
        </div>
      ) : null}

      <div
        data-slot="page-layout-content"
        className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', contentClassName)}
      >
        {children}
      </div>

      {stickyAction ? (
        <div
          data-slot="page-layout-sticky-action"
          className={cn('bg-card/95 pb-safe shrink-0 border-t backdrop-blur-sm', stickyActionClassName)}
        >
          {stickyAction}
        </div>
      ) : null}
    </div>
  );
}
