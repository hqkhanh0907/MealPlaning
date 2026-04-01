import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useReducedMotion } from '@/utils/motion';
import { useFitnessStore } from '@/store/fitnessStore';
import { useHealthProfileStore } from '@/features/health-profile/store/healthProfileStore';
import { useTrainingPlan } from '@/features/fitness/hooks/useTrainingPlan';
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

export function PlanComputingScreen({ form, goNext, goBack }: Readonly<PlanComputingScreenProps>) {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();
  const planGeneratedRef = useRef(false);

  /* (a4-gonext-ref) stable callback refs — prevents timer restart on parent re-render */
  const goNextRef = useRef(goNext);
  useEffect(() => { goNextRef.current = goNext; }, [goNext]);

  const goBackRef = useRef(goBack);
  useEffect(() => { goBackRef.current = goBack; }, [goBack]);

  /* (a2-gen-plan) store & hook wiring */
  const trainingProfile = useFitnessStore((s) => s.trainingProfile);
  const addTrainingPlan = useFitnessStore((s) => s.addTrainingPlan);
  const addPlanDays = useFitnessStore((s) => s.addPlanDays);

  const healthAge = useHealthProfileStore((s) => s.profile.age);
  const healthWeight = useHealthProfileStore((s) => s.profile.weightKg);

  const { generatePlan } = useTrainingPlan();
  const generatePlanRef = useRef(generatePlan);
  useEffect(() => { generatePlanRef.current = generatePlan; }, [generatePlan]);

  const attemptGeneration = useCallback((): boolean => {
    if (planGeneratedRef.current) return true;
    if (!trainingProfile) {
      setError(true);
      return false;
    }
    const result = generatePlanRef.current({
      trainingProfile,
      healthProfile: { age: healthAge ?? 30, weightKg: healthWeight ?? 70 },
    });
    if (result) {
      addTrainingPlan(result.plan);
      addPlanDays(result.days);
      planGeneratedRef.current = true;
      return true;
    }
    setError(true);
    return false;
  }, [trainingProfile, healthAge, healthWeight, addTrainingPlan, addPlanDays]);

  const attemptGenerationRef = useRef(attemptGeneration);
  useEffect(() => { attemptGenerationRef.current = attemptGeneration; }, [attemptGeneration]);

  useEffect(() => {
    const advanceStep = (index: number) => {
      if (index >= STEPS.length) {
        timerRef.current = setTimeout(() => goNextRef.current(), 1500);
        return;
      }
      setActiveStep(index);

      if (index === 2) {
        const success = attemptGenerationRef.current();
        if (!success) return;
      }

      timerRef.current = setTimeout(() => advanceStep(index + 1), 2500);
    };
    advanceStep(0);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [retryCount]);

  const handleRetry = useCallback(() => {
    setError(false);
    planGeneratedRef.current = false;
    setActiveStep(0);
    setRetryCount((c) => c + 1);
  }, []);

  if (error) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center bg-white px-8 dark:bg-slate-950"
        data-testid="plan-computing"
      >
        <div className="w-full max-w-xs rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
          <p className="mb-4 text-sm font-medium text-red-700 dark:text-red-300">
            {t('onboarding.computing.error')}
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="min-h-[44px] rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {t('onboarding.computing.retry')}
            </button>
            <button
              type="button"
              onClick={() => goBackRef.current()}
              className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t('onboarding.computing.returnToStrategy')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center bg-white px-8 dark:bg-slate-950"
      data-testid="plan-computing"
    >
      {/* Spinner */}
      <motion.div
        className="mb-8 flex h-20 w-20 items-center justify-center"
        animate={reducedMotion ? undefined : { rotate: 360 }}
        transition={reducedMotion ? undefined : { duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <div className="h-16 w-16 rounded-full border-4 border-emerald-200 border-t-emerald-500 dark:border-emerald-800 dark:border-t-emerald-400" />
      </motion.div>

      <h2 className="mb-2 text-lg font-bold text-slate-800 dark:text-slate-100">
        {t('onboarding.computing.title', { name: form.getValues().name })}
      </h2>
      <p className="mb-8 text-center text-sm text-slate-500 dark:text-slate-400">
        {t('onboarding.computing.subtitle')}
      </p>

      {/* (b7-aria-live) accessible steps region */}
      <output className="block w-full max-w-xs space-y-3" aria-live="polite">
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
            <div
              className={`h-2 w-2 rounded-full ${
                i <= activeStep
                  ? 'bg-emerald-500'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
            <span
              className={`text-sm ${
                i <= activeStep
                  ? 'font-medium text-slate-700 dark:text-slate-300'
                  : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {t(`onboarding.computing.step_${step.key}`)}
            </span>
            {i === activeStep && !reducedMotion && (
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
      </output>
    </div>
  );
}
