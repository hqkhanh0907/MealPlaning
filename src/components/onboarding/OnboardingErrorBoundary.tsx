import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  children: React.ReactNode;
  onReset: () => void;
}

interface State {
  hasError: boolean;
}

function FallbackUI({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 dark:bg-slate-900">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/30">
          <AlertTriangle aria-hidden="true" className="h-8 w-8 text-amber-500 dark:text-amber-400" />
        </div>
        <h2 className="mb-6 text-lg font-bold text-slate-800 dark:text-slate-100">
          {t('onboarding.error.title')}
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="min-h-[44px] w-full rounded-xl bg-emerald-500 py-3 text-base font-bold text-white transition-colors duration-200 hover:bg-emerald-600 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t('onboarding.error.restart')}
        </button>
      </div>
    </div>
  );
}

export class OnboardingErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[OnboardingErrorBoundary]', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return <FallbackUI onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}
