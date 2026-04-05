import { AlertTriangle, RefreshCw } from 'lucide-react';
import React from 'react';

import i18n from '../i18n';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error({ component: 'ErrorBoundary', action: 'componentDidCatch' }, error);
    // errorInfo contains component stack trace for debugging
    if (errorInfo?.componentStack) {
      logger.error(
        { component: 'ErrorBoundary', action: 'componentStack' },
        { componentStack: errorInfo.componentStack },
      );
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="bg-warning/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertTriangle className="text-warning h-6 w-6" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-semibold">
            {this.props.fallbackTitle || i18n.t('errorBoundary.defaultTitle')}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm text-sm">{i18n.t('errorBoundary.description')}</p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 font-semibold shadow-sm transition-all active:scale-[0.98]"
            >
              <RefreshCw className="h-4 w-4" />
              {i18n.t('errorBoundary.retry')}
            </button>
            <button
              onClick={() => globalThis.location.reload()}
              className="text-foreground-secondary bg-muted hover:bg-accent min-h-11 rounded-xl px-5 py-2.5 font-semibold transition-all active:scale-[0.98]"
            >
              {i18n.t('errorBoundary.reload')}
            </button>
          </div>
          {this.state.error && (
            <details className="mt-6 w-full max-w-md text-left">
              <summary className="hover:text-muted-foreground text-muted-foreground cursor-pointer text-xs">
                {i18n.t('errorBoundary.errorDetails')}
              </summary>
              <pre className="border-border text-foreground-secondary bg-muted mt-2 overflow-x-auto rounded-xl border p-3 text-xs">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
