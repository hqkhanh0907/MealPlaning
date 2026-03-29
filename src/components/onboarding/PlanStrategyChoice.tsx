import { useTranslation } from 'react-i18next';
import { Sparkles, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseFormReturn } from 'react-hook-form';
import type { OnboardingFormData } from './onboardingSchema';

interface PlanStrategyChoiceProps {
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
  setPlanStrategy: (strategy: 'auto' | 'manual' | null) => void;
  goToSection: (section: 1 | 2 | 3 | 4 | 5 | 6 | 7) => void;
}

export function PlanStrategyChoice({ form, goNext, goBack, setPlanStrategy, goToSection }: PlanStrategyChoiceProps) {
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
        <p className="mb-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('onboarding.strategy.subtitle')}
        </p>

        <div className="w-full max-w-sm space-y-4">
          <button
            type="button"
            onClick={handleAuto}
            className={cn(
              'flex w-full min-h-[72px] items-center gap-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 text-left transition-colors',
              'focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:outline-none',
              'dark:bg-emerald-900/20',
            )}
            data-testid="strategy-auto"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {t('onboarding.strategy.auto')}
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                {t('onboarding.strategy.autoDesc')}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleManual}
            className={cn(
              'flex w-full min-h-[72px] items-center gap-4 rounded-2xl border-2 border-slate-200 px-5 py-4 text-left transition-colors',
              'focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:outline-none',
              'hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
            )}
            data-testid="strategy-manual"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <PenLine className="h-6 w-6 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('onboarding.strategy.manual')}
              </p>
              <p className="text-xs text-slate-500/70 dark:text-slate-400/70">
                {t('onboarding.strategy.manualDesc')}
              </p>
            </div>
          </button>
        </div>
      </div>

      <div className="flex justify-start px-6 pb-8">
        <button
          type="button"
          onClick={goBack}
          className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-500 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:text-slate-400"
        >
          {t('onboarding.nav.back')}
        </button>
      </div>
    </div>
  );
}
