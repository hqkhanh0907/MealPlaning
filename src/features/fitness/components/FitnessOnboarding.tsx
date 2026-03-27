import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useFitnessStore } from '../../../store/fitnessStore';
import { getSmartDefaults } from '../utils/getSmartDefaults';
import { EXERCISES } from '../data/exerciseDatabase';
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

interface FitnessOnboardingProps {
  onComplete: () => void;
}

function FitnessOnboardingComponent({ onComplete }: FitnessOnboardingProps) {
  const { t } = useTranslation();
  const setTrainingProfile = useFitnessStore((s) => s.setTrainingProfile);
  const setOnboarded = useFitnessStore((s) => s.setOnboarded);

  const [goal, setGoal] = useState<TrainingGoal>('hypertrophy');
  const [experience, setExperience] = useState<TrainingExperience>('beginner');
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [showCustomize, setShowCustomize] = useState(false);

  const [sessionDuration, setSessionDuration] = useState<number | null>(null);
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [injuries, setInjuries] = useState<BodyRegion[]>([]);
  const [cardioSessions, setCardioSessions] = useState<number | null>(null);
  const [periodization, setPeriodization] = useState<PeriodizationModel | null>(null);
  const [cycleWeeks, setCycleWeeks] = useState<number | null>(null);
  const [priorityMuscles, setPriorityMuscles] = useState<MuscleGroup[]>([]);
  const [known1rm, setKnown1rm] = useState<Record<string, string>>({});
  const [avgSleepHours, setAvgSleepHours] = useState('');
  const [showOrm, setShowOrm] = useState(false);

  const handleExperienceChange = useCallback((exp: TrainingExperience) => {
    setExperience(exp);
    if (exp === 'advanced') setShowOrm(true);
  }, []);

  const toggleEquipment = useCallback((item: EquipmentType) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    );
  }, []);

  const toggleInjury = useCallback((item: BodyRegion) => {
    setInjuries((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    );
  }, []);

  const toggleMuscle = useCallback((item: MuscleGroup) => {
    setPriorityMuscles((prev) => {
      if (prev.includes(item)) return prev.filter((m) => m !== item);
      if (prev.length >= MAX_PRIORITY_MUSCLES) return prev;
      return [...prev, item];
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const defaults = getSmartDefaults(goal, experience, daysPerWeek);

    const parsed1rm: Record<string, number> = {};
    for (const [lift, val] of Object.entries(known1rm)) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) parsed1rm[lift] = num;
    }

    const profile: TrainingProfile = {
      id: crypto.randomUUID(),
      ...defaults,
      ...(sessionDuration != null ? { sessionDurationMin: sessionDuration } : {}),
      ...(equipment.length > 0 ? { availableEquipment: equipment } : {}),
      injuryRestrictions: injuries,
      ...(cardioSessions != null ? { cardioSessionsWeek: cardioSessions } : {}),
      ...(periodization != null ? { periodizationModel: periodization } : {}),
      ...(cycleWeeks != null ? { planCycleWeeks: cycleWeeks } : {}),
      ...(priorityMuscles.length > 0 ? { priorityMuscles } : {}),
      ...(Object.keys(parsed1rm).length > 0 ? { known1rm: parsed1rm } : {}),
      ...(avgSleepHours !== '' ? { avgSleepHours: parseFloat(avgSleepHours) } : {}),
      updatedAt: new Date().toISOString(),
    };

    setTrainingProfile(profile);
    setOnboarded(true);
    onComplete();
  }, [
    goal, experience, daysPerWeek, sessionDuration, equipment,
    injuries, cardioSessions, periodization, cycleWeeks,
    priorityMuscles, known1rm, avgSleepHours,
    setTrainingProfile, setOnboarded, onComplete,
  ]);

  const pillClass = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-emerald-500 text-white shadow-sm'
        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
    }`;

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
      active
        ? 'bg-emerald-500 text-white shadow-sm'
        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
    }`;

  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2';

  const showIntermediate = experience === 'intermediate' || experience === 'advanced';
  const showAdvanced = experience === 'advanced';

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

      {/* Training Goal */}
      <fieldset>
        <legend className={labelClass}>
          {t('fitness.onboarding.goal')}
        </legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fitness.onboarding.goal')}>
          {GOALS.map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={goal === g}
              onClick={() => setGoal(g)}
              className={pillClass(goal === g)}
            >
              {t(`fitness.onboarding.${g}`)}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Experience */}
      <fieldset>
        <legend className={labelClass}>
          {t('fitness.onboarding.experience')}
        </legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fitness.onboarding.experience')}>
          {EXPERIENCES.map((e) => (
            <button
              key={e}
              type="button"
              role="radio"
              aria-checked={experience === e}
              onClick={() => handleExperienceChange(e)}
              className={pillClass(experience === e)}
            >
              {t(`fitness.onboarding.${e}`)}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Days per week */}
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
              onClick={() => setDaysPerWeek(d)}
              className={pillClass(daysPerWeek === d)}
            >
              {d}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Customize toggle */}
      <button
        type="button"
        onClick={() => setShowCustomize((prev) => !prev)}
        className="w-full text-center text-sm text-emerald-600 dark:text-emerald-400 font-medium py-2 hover:underline"
        aria-expanded={showCustomize}
      >
        {t('fitness.onboarding.customize')} {showCustomize ? <ChevronUp className="w-4 h-4 inline-block" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 inline-block" aria-hidden="true" />}
      </button>

      {/* Expandable section */}
      {showCustomize && (
        <div className="space-y-5" data-testid="customize-section">
          {/* Session Duration */}
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
                  onClick={() => setSessionDuration(d)}
                  className={pillClass(sessionDuration === d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Equipment */}
          <fieldset data-testid="field-equipment">
            <legend className={labelClass}>
              {t('fitness.onboarding.equipment')}
            </legend>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  role="checkbox"
                  aria-checked={equipment.includes(eq)}
                  onClick={() => toggleEquipment(eq)}
                  className={chipClass(equipment.includes(eq))}
                >
                  {equipment.includes(eq) && <Check className="w-3 h-3" aria-hidden="true" />}
                  {eq}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Injuries */}
          <fieldset data-testid="field-injuries">
            <legend className={labelClass}>
              {t('fitness.onboarding.injuries')}
            </legend>
            <div className="flex flex-wrap gap-2">
              {INJURY_OPTIONS.map((inj) => (
                <button
                  key={inj}
                  type="button"
                  role="checkbox"
                  aria-checked={injuries.includes(inj)}
                  onClick={() => toggleInjury(inj)}
                  className={chipClass(injuries.includes(inj))}
                >
                  {injuries.includes(inj) && <Check className="w-3 h-3" aria-hidden="true" />}
                  {inj}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Cardio sessions */}
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
                  onClick={() => setCardioSessions(c)}
                  className={pillClass(cardioSessions === c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Intermediate+ fields */}
          {showIntermediate && (
            <>
              {/* Periodization */}
              <fieldset data-testid="field-periodization">
                <legend className={labelClass}>
                  {t('fitness.onboarding.periodization')}
                </legend>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fitness.onboarding.periodization')}>
                  {PERIODIZATION_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={periodization === p}
                      onClick={() => setPeriodization(p)}
                      className={pillClass(periodization === p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Cycle weeks */}
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
                      onClick={() => setCycleWeeks(w)}
                      className={pillClass(cycleWeeks === w)}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Priority muscles */}
              <fieldset data-testid="field-priority-muscles">
                <legend className={labelClass}>
                  {t('fitness.onboarding.priorityMuscles')}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="checkbox"
                      aria-checked={priorityMuscles.includes(m)}
                      onClick={() => toggleMuscle(m)}
                      className={chipClass(priorityMuscles.includes(m))}
                    >
                      {priorityMuscles.includes(m) && <Check className="w-3 h-3" aria-hidden="true" />}
                      {m}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {/* Known 1RM — toggle accessible to all levels */}
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
                    <input
                      id={`orm-${lift}`}
                      type="number"
                      min={0}
                      step={2.5}
                      placeholder="kg"
                      value={known1rm[lift] ?? ''}
                      onChange={(e) =>
                        setKnown1rm((prev) => ({ ...prev, [lift]: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      data-testid={`orm-${lift}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          {/* Advanced fields */}
          {showAdvanced && (
            <>
              {/* Avg sleep hours */}
              <div data-testid="field-avg-sleep">
                <label
                  htmlFor="avg-sleep"
                  className={labelClass}
                >
                  {t('fitness.onboarding.sleepHours')}
                </label>
                <input
                  id="avg-sleep"
                  type="number"
                  min={3}
                  max={12}
                  step={0.5}
                  placeholder="7.5"
                  value={avgSleepHours}
                  onChange={(e) => setAvgSleepHours(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold text-base shadow-md hover:bg-emerald-600 transition-all active:scale-[0.98]"
      >
        {t('fitness.onboarding.start')}
      </button>
    </div>
  );
}

export const FitnessOnboarding = React.memo(FitnessOnboardingComponent);
