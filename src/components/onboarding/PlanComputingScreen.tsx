import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useEffect, useState, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { OnboardingFormData } from './onboardingSchema';

interface PlanComputingScreenProps {
  form: UseFormReturn<OnboardingFormData>;
  goNext: () => void;
  goBack: () => void;
}

const STEPS = [
  { key: 'analyzing', delay: 0 },
  { key: 'optimizing', delay: 2.5 },
  { key: 'generating', delay: 5 },
  { key: 'finalizing', delay: 7.5 },
] as const;

export function PlanComputingScreen({ goNext }: PlanComputingScreenProps) {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const advanceStep = (index: number) => {
      if (index >= STEPS.length) {
        timerRef.current = setTimeout(goNext, 1500);
        return;
      }
      setActiveStep(index);
      timerRef.current = setTimeout(() => advanceStep(index + 1), 2500);
    };
    advanceStep(0);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [goNext]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-8 dark:bg-slate-950" data-testid="plan-computing">
      {/* Spinner */}
      <motion.div
        className="mb-8 flex h-20 w-20 items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <div className="h-16 w-16 rounded-full border-4 border-emerald-200 border-t-emerald-500 dark:border-emerald-800 dark:border-t-emerald-400" />
      </motion.div>

      <h2 className="mb-2 text-lg font-bold text-slate-800 dark:text-slate-100">
        {t('onboarding.computing.title')}
      </h2>
      <p className="mb-8 text-center text-sm text-slate-500 dark:text-slate-400">
        {t('onboarding.computing.subtitle')}
      </p>

      {/* Steps */}
      <div className="w-full max-w-xs space-y-3">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: i <= activeStep ? 1 : 0.3,
              x: 0,
            }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className={`h-2 w-2 rounded-full ${i <= activeStep ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
            <span className={`text-sm ${i <= activeStep ? 'font-medium text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>
              {t(`onboarding.computing.step_${step.key}`)}
            </span>
            {i === activeStep && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-xs text-emerald-500"
              >
                •••
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
