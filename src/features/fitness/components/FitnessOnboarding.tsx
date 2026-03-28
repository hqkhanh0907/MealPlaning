import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFitnessStore } from '../../../store/fitnessStore';
import { getSmartDefaults } from '../utils/getSmartDefaults';
import { EXERCISES } from '../data/exerciseDatabase';
import {
  fitnessOnboardingSchema,
  fitnessOnboardingDefaults,
} from '../../../schemas/fitnessOnboardingSchema';
import type { FitnessOnboardingFormData } from '../../../schemas/fitnessOnboardingSchema';
import { RadioPills } from '../../../components/form/RadioPills';
import { ChipSelect } from '../../../components/form/ChipSelect';
import { EQUIPMENT_DISPLAY } from '../constants';
import type {
  TrainingGoal,
  TrainingExperience,
  TrainingProfile,
  PeriodizationModel,
  EquipmentType,
  BodyRegion,
  MuscleGroup,
} from '../types';

const GOALS: TrainingGoal[] = ['strength', 'hypertrophy', 'endurance', 'general'];
const EXPERIENCES: TrainingExperience[] = ['beginner', 'intermediate', 'advanced'];
const DAYS_OPTIONS = [2, 3, 4, 5, 6];
const SESSION_DURATIONS = [30, 45, 60, 90];
const EQUIPMENT_OPTIONS: EquipmentType[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'bands'];
const INJURY_OPTIONS: BodyRegion[] = ['shoulders', 'lower_back', 'knees', 'wrists', 'neck', 'hips'];
const CARDIO_OPTIONS = [0, 1, 2, 3, 4, 5];
const PERIODIZATION_OPTIONS: PeriodizationModel[] = ['linear', 'undulating', 'block'];
const CYCLE_WEEKS_OPTIONS = [4, 6, 8, 12];
const MUSCLE_OPTIONS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'glutes'];
const ORM_LIFT_EXERCISE_MAP: Record<string, string> = {
  squat: 'barbell-back-squat',
  bench: 'barbell-bench-press',
  deadlift: 'conventional-deadlift',
  ohp: 'overhead-press',
};

const ORM_LIFT_IDS = ['squat', 'bench', 'deadlift', 'ohp'] as const;
type OrmLiftId = (typeof ORM_LIFT_IDS)[number];
const ORM_LIFTS: OrmLiftId[] = ORM_LIFT_IDS.filter((id) =>
  EXERCISES.some((e) => e.id === ORM_LIFT_EXERCISE_MAP[id]),
);
const MAX_PRIORITY_MUSCLES = 3;

/* ------------------------------------------------------------------ */
/*  Wizard step definitions                                            */
/* ------------------------------------------------------------------ */
type StepId =
  | 'core'
  | 'sessionDuration'
  | 'equipment'
  | 'injuries'
  | 'cardioSessions'
  | 'periodization'
  | 'cycleWeeks'
  | 'priorityMuscles'
  | 'known1rm'
  | 'sleepHours';

interface StepDef {
  id: StepId;
  minExperience?: 'intermediate' | 'advanced';
}

const EXPERIENCE_RANK: Record<TrainingExperience, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

const ALL_STEPS: StepDef[] = [
  { id: 'core' },
  { id: 'sessionDuration' },
  { id: 'equipment' },
  { id: 'injuries' },
  { id: 'cardioSessions' },
  { id: 'periodization', minExperience: 'intermediate' },
  { id: 'cycleWeeks', minExperience: 'intermediate' },
  { id: 'priorityMuscles', minExperience: 'intermediate' },
  { id: 'known1rm' },
  { id: 'sleepHours', minExperience: 'advanced' },
];

const STEP_FIELDS: Record<StepId, (keyof FitnessOnboardingFormData)[]> = {
  core: ['trainingGoal', 'experience', 'daysPerWeek'],
  sessionDuration: ['sessionDuration'],
  equipment: ['equipment'],
  injuries: ['injuries'],
  cardioSessions: ['cardioSessions'],
  periodization: ['periodization'],
  cycleWeeks: ['cycleWeeks'],
  priorityMuscles: ['priorityMuscles'],
  known1rm: ['known1rm'],
  sleepHours: ['avgSleepHours'],
};

function getActiveSteps(experience: TrainingExperience): StepDef[] {
  const rank = EXPERIENCE_RANK[experience];
  return ALL_STEPS.filter((step) => {
    if (!step.minExperience) return true;
    return EXPERIENCE_RANK[step.minExperience] <= rank;
  });
}

interface FitnessOnboardingProps {
  onComplete: () => void;
}

function FitnessOnboardingComponent({ onComplete }: FitnessOnboardingProps) {
  const { t } = useTranslation();
  const setTrainingProfile = useFitnessStore((s) => s.setTrainingProfile);
  const setOnboarded = useFitnessStore((s) => s.setOnboarded);

  const { control, handleSubmit, watch, trigger, setValue } = useForm<FitnessOnboardingFormData>({
    resolver: zodResolver(fitnessOnboardingSchema),
    mode: 'onBlur',
    defaultValues: fitnessOnboardingDefaults,
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [showOrm, setShowOrm] = useState(false);
  const [ormStrings, setOrmStrings] = useState<Record<string, string>>({});

  const experience = watch('experience');
  const daysPerWeek = watch('daysPerWeek');
  const sessionDuration = watch('sessionDuration');
  const cardioSessions = watch('cardioSessions');
  const cycleWeeks = watch('cycleWeeks');

  useEffect(() => {
    if (experience === 'advanced') setShowOrm(true);
  }, [experience]);

  useEffect(() => {
    const parsed: Record<string, number> = {};
    for (const [lift, val] of Object.entries(ormStrings)) {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0) parsed[lift] = num;
    }
    setValue('known1rm', parsed, { shouldValidate: false });
  }, [ormStrings, setValue]);

  const activeSteps = useMemo(() => getActiveSteps(experience), [experience]);
  const totalSteps = activeSteps.length;

  const safeStep = Math.min(currentStep, totalSteps - 1);
  const currentStepId = activeSteps[safeStep]?.id;
  const isLastStep = safeStep >= totalSteps - 1;

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleNext = useCallback(async () => {
    if (!currentStepId) return;
    const fields = STEP_FIELDS[currentStepId];
    const isValid = await trigger(fields);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  }, [currentStepId, trigger, totalSteps]);

  const goalOptions = useMemo(
    () => GOALS.map((g) => ({ value: g, label: t(`fitness.onboarding.${g}`) })),
    [t],
  );

  const experienceOptions = useMemo(
    () => EXPERIENCES.map((e) => ({ value: e, label: t(`fitness.onboarding.${e}`) })),
    [t],
  );

  const equipmentOptions = useMemo(
    () => EQUIPMENT_OPTIONS.map((eq) => ({ value: eq, label: EQUIPMENT_DISPLAY[eq] ?? eq })),
    [],
  );

  const injuryOptions = useMemo(
    () => INJURY_OPTIONS.map((inj) => ({ value: inj, label: t(`fitness.onboarding.injury_${inj}`) })),
    [t],
  );

  const periodizationOptions = useMemo(
    () => PERIODIZATION_OPTIONS.map((p) => ({ value: p, label: t(`fitness.onboarding.period_${p}`) })),
    [t],
  );

  const muscleOptions = useMemo(
    () => MUSCLE_OPTIONS.map((m) => ({ value: m, label: t(`fitness.onboarding.muscle_${m}`) })),
    [t],
  );

  const onFormSubmit = useCallback(
    (data: FitnessOnboardingFormData) => {
      const defaults = getSmartDefaults(data.trainingGoal, data.experience, data.daysPerWeek);

      const parsed1rm: Record<string, number> = {};
      for (const [lift, val] of Object.entries(data.known1rm)) {
        if (val > 0) parsed1rm[lift] = val;
      }

      const profile: TrainingProfile = {
        id: crypto.randomUUID(),
        ...defaults,
        ...(data.sessionDuration != null ? { sessionDurationMin: data.sessionDuration } : {}),
        ...(data.equipment.length > 0 ? { availableEquipment: data.equipment } : {}),
        injuryRestrictions: data.injuries,
        ...(data.cardioSessions != null ? { cardioSessionsWeek: data.cardioSessions } : {}),
        ...(data.periodization != null ? { periodizationModel: data.periodization } : {}),
        ...(data.cycleWeeks != null ? { planCycleWeeks: data.cycleWeeks } : {}),
        ...(data.priorityMuscles.length > 0 ? { priorityMuscles: data.priorityMuscles } : {}),
        ...(Object.keys(parsed1rm).length > 0 ? { known1rm: parsed1rm } : {}),
        ...(data.avgSleepHours !== undefined ? { avgSleepHours: data.avgSleepHours } : {}),
        updatedAt: new Date().toISOString(),
      };

      setTrainingProfile(profile);
      setOnboarded(true);
      onComplete();
    },
    [setTrainingProfile, setOnboarded, onComplete],
  );

  const submitForm = useCallback(() => {
    void handleSubmit(onFormSubmit)();
  }, [handleSubmit, onFormSubmit]);

  const pillClass = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-emerald-500 text-white shadow-sm'
        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
    }`;

  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 max-w-lg mx-auto space-y-6" data-testid="fitness-onboarding">
      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {t('fitness.onboarding.title')}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('fitness.onboarding.subtitle')}
        </p>
      </div>

      {/* Step progress indicator */}
      <div className="flex items-center gap-3 px-4 py-2" data-testid="step-indicator">
        {safeStep > 0 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-blue-600"
            data-testid="onboarding-back"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" /> {t('common.back')}
          </button>
        )}
        <div className="flex-1">
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-all"
              style={{ width: `${((safeStep + 1) / totalSteps) * 100}%` }}
              data-testid="step-progress-bar"
            />
          </div>
        </div>
        <span className="text-xs text-slate-400" data-testid="step-counter">
          {safeStep + 1}/{totalSteps}
        </span>
      </div>

      {/* Step: Core fields (Goal + Experience + Days) */}
      {currentStepId === 'core' && (
        <div className="space-y-6">
          <fieldset>
            <legend className={labelClass}>
              {t('fitness.onboarding.goal')}
            </legend>
            <RadioPills<FitnessOnboardingFormData>
              name="trainingGoal"
              control={control}
              options={goalOptions}
            />
          </fieldset>

          <fieldset>
            <legend className={labelClass}>
              {t('fitness.onboarding.experience')}
            </legend>
            <RadioPills<FitnessOnboardingFormData>
              name="experience"
              control={control}
              options={experienceOptions}
            />
          </fieldset>

          <fieldset>
            <legend className={labelClass}>
              {t('fitness.onboarding.daysPerWeek')}
            </legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fitness.onboarding.daysPerWeek')}>
              {DAYS_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={daysPerWeek === d}
                  onClick={() => setValue('daysPerWeek', d)}
                  className={pillClass(daysPerWeek === d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {/* Step: Session Duration */}
      {currentStepId === 'sessionDuration' && (
        <fieldset data-testid="field-session-duration">
          <legend className={labelClass}>
            {t('fitness.onboarding.sessionDuration')}
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fitness.onboarding.sessionDuration')}>
            {SESSION_DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={sessionDuration === d}
                onClick={() => setValue('sessionDuration', d)}
                className={pillClass(sessionDuration === d)}
              >
                {d}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Step: Equipment */}
      {currentStepId === 'equipment' && (
        <fieldset data-testid="field-equipment">
          <legend className={labelClass}>
            {t('fitness.onboarding.equipment')}
          </legend>
          <ChipSelect<FitnessOnboardingFormData>
            name="equipment"
            control={control}
            options={equipmentOptions}
          />
        </fieldset>
      )}

      {/* Step: Injuries */}
      {currentStepId === 'injuries' && (
        <fieldset data-testid="field-injuries">
          <legend className={labelClass}>
            {t('fitness.onboarding.injuries')}
          </legend>
          <ChipSelect<FitnessOnboardingFormData>
            name="injuries"
            control={control}
            options={injuryOptions}
          />
        </fieldset>
      )}

      {/* Step: Cardio sessions */}
      {currentStepId === 'cardioSessions' && (
        <fieldset data-testid="field-cardio-sessions">
          <legend className={labelClass}>
            {t('fitness.onboarding.cardioSessions')}
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fitness.onboarding.cardioSessions')}>
            {CARDIO_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={cardioSessions === c}
                onClick={() => setValue('cardioSessions', c)}
                className={pillClass(cardioSessions === c)}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Step: Periodization (intermediate+) */}
      {currentStepId === 'periodization' && (
        <fieldset data-testid="field-periodization">
          <legend className={labelClass}>
            {t('fitness.onboarding.periodization')}
          </legend>
          <RadioPills<FitnessOnboardingFormData>
            name="periodization"
            control={control}
            options={periodizationOptions}
          />
        </fieldset>
      )}

      {/* Step: Cycle weeks (intermediate+) */}
      {currentStepId === 'cycleWeeks' && (
        <fieldset data-testid="field-cycle-weeks">
          <legend className={labelClass}>
            {t('fitness.onboarding.cycleWeeks')}
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fitness.onboarding.cycleWeeks')}>
            {CYCLE_WEEKS_OPTIONS.map((w) => (
              <button
                key={w}
                type="button"
                role="radio"
                aria-checked={cycleWeeks === w}
                onClick={() => setValue('cycleWeeks', w)}
                className={pillClass(cycleWeeks === w)}
              >
                {w}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* Step: Priority muscles (intermediate+) */}
      {currentStepId === 'priorityMuscles' && (
        <fieldset data-testid="field-priority-muscles">
          <legend className={labelClass}>
            {t('fitness.onboarding.priorityMuscles')}
          </legend>
          <ChipSelect<FitnessOnboardingFormData>
            name="priorityMuscles"
            control={control}
            options={muscleOptions}
            maxItems={MAX_PRIORITY_MUSCLES}
          />
        </fieldset>
      )}

      {/* Step: Known 1RM */}
      {currentStepId === 'known1rm' && (
        <fieldset data-testid="field-known-1rm">
          <legend className={labelClass}>
            {t('fitness.onboarding.known1rm')}
          </legend>
          <div className="mt-1">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showOrm}
                onChange={(e) => setShowOrm(e.target.checked)}
                className="rounded border-slate-300"
                data-testid="orm-toggle"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {t('fitness.onboarding.knowMyOrm')}
              </span>
            </label>
          </div>
          {showOrm && (
            <div className="mt-3 grid grid-cols-2 gap-2" data-testid="orm-inputs">
              {ORM_LIFTS.map((lift) => (
                <div key={lift}>
                  <label
                    htmlFor={`orm-${lift}`}
                    className="block text-xs text-slate-500 dark:text-slate-400 mb-1 capitalize"
                  >
                    {lift}
                  </label>
                  <Input
                    id={`orm-${lift}`}
                    type="number"
                    min={0}
                    step={2.5}
                    placeholder="kg"
                    value={ormStrings[lift] ?? ''}
                    onChange={(e) =>
                      setOrmStrings((prev) => ({ ...prev, [lift]: e.target.value }))
                    }
                    className="w-full text-slate-800"
                    data-testid={`orm-${lift}`}
                  />
                </div>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {/* Step: Sleep hours (advanced) */}
      {currentStepId === 'sleepHours' && (
        <div data-testid="field-avg-sleep">
          <Controller
            name="avgSleepHours"
            control={control}
            render={({ field }) => (
              <>
                <label
                  htmlFor="avg-sleep"
                  className={labelClass}
                >
                  {t('fitness.onboarding.sleepHours')}
                </label>
                <Input
                  id="avg-sleep"
                  type="number"
                  min={3}
                  max={12}
                  step={0.5}
                  placeholder="7.5"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? undefined : parseFloat(val));
                  }}
                  onBlur={field.onBlur}
                  className="w-full text-slate-800"
                />
              </>
            )}
          />
        </div>
      )}

      {/* Next / Submit button */}
      {isLastStep ? (
        <button
          type="button"
          onClick={submitForm}
          className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold text-base shadow-md hover:bg-emerald-600 transition-all active:scale-[0.98]"
        >
          {t('fitness.onboarding.start')}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => { void handleNext(); }}
          data-testid="next-button"
          className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold text-base shadow-md hover:bg-emerald-600 transition-all active:scale-[0.98]"
        >
          {t('common.next')}
        </button>
      )}
    </div>
  );
}

export const FitnessOnboarding = React.memo(FitnessOnboardingComponent);
