import { PenLine, Sparkles } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

import type { OnboardingFormData } from './onboardingSchema';

interface PlanStrategyChoiceProps {
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
  setPlanStrategy: (strategy: 'auto' | 'manual' | null) => void;
  goToSection: (section: 1 | 2 | 3 | 4 | 5 | 6 | 7) => void;
}

export function PlanStrategyChoice({
  form,
  goNext,
  goBack,
  setPlanStrategy,
  goToSection,
}: Readonly<PlanStrategyChoiceProps>) {
  const { t } = useTranslation();
  const values = form.getValues();

  const handleAuto = () => {
    setPlanStrategy('auto');
    goNext(); // → Section 6 (computing)
  };

  const handleManual = () => {
    setPlanStrategy('manual');
    goToSection(7); // skip computing, go to preview
  };

  return (
    <div className="flex flex-1 flex-col" data-testid="plan-strategy-choice">
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <h2 className="mb-2 text-center text-xl font-bold text-slate-800 dark:text-slate-100">
          {t('onboarding.strategy.title', { name: values.name })}
        </h2>
        <p className="text-muted-foreground mb-8 text-center text-sm">{t('onboarding.strategy.subtitle')}</p>

        <div className="w-full max-w-sm space-y-4">
          <button
            type="button"
            onClick={handleAuto}
            className={cn(
              'border-primary bg-primary-subtle flex min-h-[72px] w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              'dark:bg-emerald-900/20',
            )}
            data-testid="strategy-auto"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <Sparkles className="text-primary h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-primary-emphasis text-sm font-bold">{t('onboarding.strategy.auto')}</p>
              <p className="text-primary/70/70 text-xs">{t('onboarding.strategy.autoDesc')}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleManual}
            className={cn(
              'border-border flex min-h-[72px] w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-colors',
              'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              'hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
            )}
            data-testid="strategy-manual"
          >
            <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
              <PenLine className="text-muted-foreground h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('onboarding.strategy.manual')}</p>
              <p className="text-muted-foreground/70 text-xs">{t('onboarding.strategy.manualDesc')}</p>
            </div>
          </button>
        </div>
      </div>

      <div className="flex justify-start px-6 pb-8">
        <button
          type="button"
          onClick={goBack}
          className="text-muted-foreground focus-visible:ring-ring min-h-[44px] px-4 py-2 text-sm font-medium focus-visible:rounded-lg focus-visible:ring-2 focus-visible:outline-none"
        >
          {t('onboarding.nav.back')}
        </button>
      </div>
    </div>
  );
}
