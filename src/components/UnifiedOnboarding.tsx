import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useDatabase } from '@/contexts/DatabaseContext';
import { useHealthProfileStore } from '@/features/health-profile/store/healthProfileStore';
import { useAppOnboardingStore } from '@/store/appOnboardingStore';
import { useFitnessStore } from '@/store/fitnessStore';

import { pushBackEntry, removeBackEntries } from '../services/backNavigationService';
import { OnboardingErrorBoundary } from './onboarding/OnboardingErrorBoundary';
import { OnboardingProgress } from './onboarding/OnboardingProgress';
import { type OnboardingFormData, onboardingSchema } from './onboarding/onboardingSchema';
import { getTrainingDetailStepCount } from './onboarding/trainingStepConfig';

const WelcomeSlides = React.lazy(() => import('./onboarding/WelcomeSlides').then(m => ({ default: m.WelcomeSlides })));
const HealthBasicStep = React.lazy(() =>
  import('./onboarding/HealthBasicStep').then(m => ({ default: m.HealthBasicStep })),
);
const ActivityLevelStep = React.lazy(() =>
  import('./onboarding/ActivityLevelStep').then(m => ({ default: m.ActivityLevelStep })),
);
const NutritionGoalStep = React.lazy(() =>
  import('./onboarding/NutritionGoalStep').then(m => ({ default: m.NutritionGoalStep })),
);
const HealthConfirmStep = React.lazy(() =>
  import('./onboarding/HealthConfirmStep').then(m => ({ default: m.HealthConfirmStep })),
);
const TrainingCoreStep = React.lazy(() =>
  import('./onboarding/TrainingCoreStep').then(m => ({ default: m.TrainingCoreStep })),
);
const TrainingDetailSteps = React.lazy(() =>
  import('./onboarding/TrainingDetailSteps').then(m => ({ default: m.TrainingDetailSteps })),
);
const PlanStrategyChoice = React.lazy(() =>
  import('./onboarding/PlanStrategyChoice').then(m => ({ default: m.PlanStrategyChoice })),
);
const PlanComputingScreen = React.lazy(() =>
  import('./onboarding/PlanComputingScreen').then(m => ({ default: m.PlanComputingScreen })),
);
const PlanPreviewScreen = React.lazy(() =>
  import('./onboarding/PlanPreviewScreen').then(m => ({ default: m.PlanPreviewScreen })),
);

type Section = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface StepLocation {
  section: Section;
  step: number;
}

const SECTION_STEPS: Record<Section, number> = {
  1: 3, // 3 welcome slides
  2: 4, // 4 health steps
  3: 1, // 1 training core
  4: 4, // default; overridden at runtime by getTrainingDetailStepCount()
  5: 1, // strategy choice
  6: 1, // computing
  7: 1, // preview
};

function computeDepth(loc: StepLocation): number {
  let depth = loc.step;
  for (let s = 1; s < loc.section; s++) {
    depth += SECTION_STEPS[s as Section];
  }
  return depth;
}

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

function StepFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="text-primary h-8 w-8 animate-spin" aria-hidden="true" />
    </div>
  );
}

export function UnifiedOnboarding() {
  const db = useDatabase();
  const setAppOnboarded = useAppOnboardingStore(s => s.setAppOnboarded);
  const setOnboardingSection = useAppOnboardingStore(s => s.setOnboardingSection);
  const resumeSection = useAppOnboardingStore(s => s.onboardingSection);
  const setOnboarded = useFitnessStore(s => s.setOnboarded);
  const setPlanStrategy = useFitnessStore(s => s.setPlanStrategy);
  const saveProfile = useHealthProfileStore(s => s.saveProfile);
  const saveGoal = useHealthProfileStore(s => s.saveGoal);

  const initialSection = (resumeSection || 1) as Section;
  const [location, setLocation] = useState<StepLocation>({
    section: initialSection,
    step: 0,
  });
  const [direction, setDirection] = useState<1 | -1>(1);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      gender: 'male',
      dateOfBirth: '',
      heightCm: undefined,
      weightKg: undefined,
      activityLevel: 'moderate',
      goalType: 'maintain',
      rateOfChange: 'moderate',
      targetWeightKg: undefined,
      trainingGoal: 'hypertrophy',
      trainingExperience: 'beginner',
      daysPerWeek: 4,
      injuryRestrictions: [],
      priorityMuscles: [],
    },
  });

  const isAutoPath = useFitnessStore(s => s.planStrategy === 'auto');
  const totalSections = isAutoPath ? 7 : 6;

  const watchedExperience = useWatch({ control: form.control, name: 'trainingExperience' });

  const sectionSteps = useMemo(() => {
    return {
      ...SECTION_STEPS,
      4: getTrainingDetailStepCount(watchedExperience),
    };
  }, [watchedExperience]);

  const goNext = useCallback(() => {
    setDirection(1);
    const maxStep = sectionSteps[location.section] - 1;
    if (location.step < maxStep) {
      setLocation(prev => ({ ...prev, step: prev.step + 1 }));
    } else {
      const nextSection = (location.section + 1) as Section;
      setLocation({ section: nextSection, step: 0 });
    }
  }, [location, sectionSteps]);

  const goBack = useCallback(() => {
    setDirection(-1);
    if (location.step > 0) {
      setLocation(prev => ({ ...prev, step: prev.step - 1 }));
    } else if (location.section > 1) {
      const prevSection = (location.section - 1) as Section;
      const prevMaxStep = sectionSteps[prevSection] - 1;
      setLocation({ section: prevSection, step: prevMaxStep });
    }
  }, [location, sectionSteps]);

  const goToSection = useCallback((section: Section) => {
    setDirection(1);
    setLocation({ section, step: 0 });
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboarded(true);
    setAppOnboarded(true);
    setOnboardingSection(null);
  }, [setOnboarded, setAppOnboarded, setOnboardingSection]);

  const handleReset = useCallback(() => {
    setOnboardingSection(null);
    setLocation({ section: 1, step: 0 });
    setDirection(1);
  }, [setOnboardingSection]);

  const prevDepthRef = useRef(computeDepth({ section: initialSection, step: 0 }));
  const pushedCountRef = useRef(0);
  const goBackRef = useRef(goBack);

  useEffect(() => {
    goBackRef.current = goBack;
  }, [goBack]);

  useEffect(() => {
    const currDepth = computeDepth(location);
    const prevDepth = prevDepthRef.current;
    prevDepthRef.current = currDepth;

    if (currDepth > prevDepth) {
      const delta = currDepth - prevDepth;
      for (let i = 0; i < delta; i++) {
        pushBackEntry(() => {
          pushedCountRef.current--;
          goBackRef.current();
        });
        pushedCountRef.current++;
      }
    } else if (currDepth < prevDepth && pushedCountRef.current > 0) {
      const delta = Math.min(prevDepth - currDepth, pushedCountRef.current);
      if (delta > 0) {
        pushedCountRef.current -= delta;
        removeBackEntries(delta);
      }
    }
  }, [location]);

  useEffect(() => {
    return () => {
      if (pushedCountRef.current > 0) {
        removeBackEntries(pushedCountRef.current);
        pushedCountRef.current = 0;
      }
    };
  }, []);

  const stepProps = useMemo(
    () => ({
      form,
      db,
      goNext,
      goBack,
      goToSection,
      saveProfile,
      saveGoal,
      setOnboardingSection,
      setPlanStrategy,
      completeOnboarding,
      location,
    }),
    [
      form,
      db,
      goNext,
      goBack,
      goToSection,
      saveProfile,
      saveGoal,
      setOnboardingSection,
      setPlanStrategy,
      completeOnboarding,
      location,
    ],
  );

  const renderStep = () => {
    switch (location.section) {
      case 1:
        return <WelcomeSlides step={location.step} {...stepProps} />;
      case 2:
        switch (location.step) {
          case 0:
            return <HealthBasicStep {...stepProps} />;
          case 1:
            return <ActivityLevelStep {...stepProps} />;
          case 2:
            return <NutritionGoalStep {...stepProps} />;
          case 3:
            return <HealthConfirmStep {...stepProps} />;
          /* v8 ignore next -- defensive: step is always 0-3, managed by internal useState */
          default:
            return null;
        }
      case 3:
        return <TrainingCoreStep {...stepProps} />;
      case 4:
        return <TrainingDetailSteps step={location.step} {...stepProps} />;
      case 5:
        return <PlanStrategyChoice {...stepProps} />;
      case 6:
        return <PlanComputingScreen {...stepProps} />;
      case 7:
        return <PlanPreviewScreen {...stepProps} />;
      default:
        return null;
    }
  };

  const stepKey = `${location.section}-${location.step}`;

  return (
    <OnboardingErrorBoundary onReset={handleReset}>
      <div className="bg-card flex h-dvh flex-col">
        {location.section !== 6 && (
          <div className="pt-safe shrink-0 px-4">
            <div className="pt-2">
              <OnboardingProgress
                currentSection={!isAutoPath && location.section === 7 ? 6 : location.section}
                totalSections={totalSections}
                stepInSection={Math.min(location.step, sectionSteps[location.section] - 1)}
                totalStepsInSection={sectionSteps[location.section]}
              />
            </div>
          </div>
        )}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={stepKey}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col"
            >
              <React.Suspense fallback={<StepFallback />}>{renderStep()}</React.Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </OnboardingErrorBoundary>
  );
}
