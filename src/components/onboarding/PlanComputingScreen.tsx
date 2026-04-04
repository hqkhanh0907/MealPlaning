import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useTrainingPlan } from '@/features/fitness/hooks/useTrainingPlan';
import { useHealthProfileStore } from '@/features/health-profile/store/healthProfileStore';
import { useFitnessStore } from '@/store/fitnessStore';
import { useReducedMotion } from '@/utils/motion';

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
  useEffect(() => {
    goNextRef.current = goNext;
  }, [goNext]);

  const goBackRef = useRef(goBack);
  useEffect(() => {
    goBackRef.current = goBack;
  }, [goBack]);

  /* (a2-gen-plan) store & hook wiring */
  const trainingProfile = useFitnessStore(s => s.trainingProfile);
  const addTrainingPlan = useFitnessStore(s => s.addTrainingPlan);
  const addPlanDays = useFitnessStore(s => s.addPlanDays);

  const healthAge = useHealthProfileStore(s => s.profile?.age ?? 30);
  const healthWeight = useHealthProfileStore(s => s.profile?.weightKg ?? 70);

  const { generatePlan } = useTrainingPlan();
  const generatePlanRef = useRef(generatePlan);
  useEffect(() => {
    generatePlanRef.current = generatePlan;
  }, [generatePlan]);

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
  useEffect(() => {
    attemptGenerationRef.current = attemptGeneration;
  }, [attemptGeneration]);

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
    setRetryCount(c => c + 1);
  }, []);

  if (error) {
    return (
      <div className="bg-card flex flex-1 flex-col items-center justify-center px-8" data-testid="plan-computing">
        <div className="border-destructive/20 bg-destructive/10 w-full max-w-xs rounded-2xl border p-6 text-center">
          <p className="text-destructive mb-4 text-sm font-medium">{t('onboarding.computing.error')}</p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleRetry}
              className="bg-primary text-primary-foreground hover:bg-primary/80 focus-visible:ring-ring dark:bg-primary dark:hover:bg-primary min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {t('onboarding.computing.retry')}
            </button>
            <button
              type="button"
              onClick={() => goBackRef.current()}
              className="focus-visible:ring-ring border-border text-foreground hover:bg-accent min-h-[44px] rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {t('onboarding.computing.returnToStrategy')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card flex flex-1 flex-col items-center justify-center px-8" data-testid="plan-computing">
      {/* Spinner */}
      <motion.div
        className="mb-8 flex h-20 w-20 items-center justify-center"
        animate={reducedMotion ? undefined : { rotate: 360 }}
        transition={reducedMotion ? undefined : { duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <div className="border-t-primary border-primary/20 h-16 w-16 rounded-full border-4" />
      </motion.div>

      <h2 className="text-foreground mb-2 text-lg font-bold">
        {t('onboarding.computing.title', { name: form.getValues().name })}
      </h2>
      <p className="text-muted-foreground mb-8 text-center text-sm">{t('onboarding.computing.subtitle')}</p>

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
            <div className={`h-2 w-2 rounded-full ${i <= activeStep ? 'bg-primary' : 'bg-muted'}`} />
            <span className={`text-sm ${i <= activeStep ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              {t(`onboarding.computing.step_${step.key}`)}
            </span>
            {i === activeStep && !reducedMotion && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-primary text-xs"
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
