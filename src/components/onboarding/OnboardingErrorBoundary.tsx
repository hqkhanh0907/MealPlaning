import { AlertTriangle } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { logger } from '@/utils/logger';

interface Props {
  children: React.ReactNode;
  onReset: () => void;
}

interface State {
  hasError: boolean;
}

function FallbackUI({ onReset }: Readonly<{ onReset: () => void }>) {
  const { t } = useTranslation();

  return (
    <div className="bg-card flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="bg-warning/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertTriangle aria-hidden="true" className="text-warning h-8 w-8" />
        </div>
        <h2 className="text-foreground mb-6 text-lg font-bold">{t('onboarding.error.title')}</h2>
        <button
          type="button"
          onClick={onReset}
          className="bg-primary text-primary-foreground hover:bg-primary focus-visible:ring-ring min-h-[44px] w-full rounded-xl py-3 text-base font-bold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
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

  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo) {
    logger.error({ component: 'OnboardingErrorBoundary', action: 'componentDidCatch' }, error);
  }

  private readonly handleReset = () => {
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
