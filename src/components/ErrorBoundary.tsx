import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '../utils/logger';
import i18n from '../i18n';

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
      logger.error({ component: 'ErrorBoundary', action: 'componentStack' }, { componentStack: errorInfo.componentStack });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-500 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
            {this.props.fallbackTitle || i18n.t('errorBoundary.defaultTitle')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            {i18n.t('errorBoundary.description')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm shadow-emerald-200 min-h-11"
            >
              <RefreshCw className="w-4 h-4" />
              {i18n.t('errorBoundary.retry')}
            </button>
            <button
              onClick={() => globalThis.location.reload()}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-[0.98] transition-all min-h-11"
            >
              {i18n.t('errorBoundary.reload')}
            </button>
          </div>
          {this.state.error && (
            <details className="mt-6 text-left w-full max-w-md">
              <summary className="text-xs text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-500">{i18n.t('errorBoundary.errorDetails')}</summary>
              <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-700 p-3 rounded-xl overflow-x-auto text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
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
