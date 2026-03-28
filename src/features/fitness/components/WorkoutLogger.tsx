import React, { useState, useEffect, useCallback, useMemo, useRef, type MutableRefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RestTimer } from './RestTimer';
import { ExerciseSelector } from './ExerciseSelector';
import { WorkoutSummaryCard } from './WorkoutSummaryCard';
import { useFitnessStore } from '../../../store/fitnessStore';
import { EXERCISES } from '../data/exerciseDatabase';
import { formatElapsed } from '../utils/timeFormat';
import { detectPRs } from '../utils/gamification';
import type { ExerciseSeed } from '../data/exerciseDatabase';
import type {
  Exercise,
  Workout,
  WorkoutSet,
  MuscleGroup,
  EquipmentType,
} from '../types';
import { DEFAULT_REST_SECONDS, RPE_OPTIONS, WEIGHT_INCREMENT } from '../constants';
import { useProgressiveOverload } from '../hooks/useProgressiveOverload';
import type { OverloadSuggestion } from '../hooks/useProgressiveOverload';
import {
  workoutLoggerSchema,
  setInputDefaults,
  type WorkoutLoggerFormData,
  type SetInputData,
} from '../../../schemas/workoutLoggerSchema';

interface WorkoutLoggerProps {
  planDay?: {
    dayOfWeek: number;
    workoutType: string;
    exercises?: string[];
    muscleGroups?: string;
  };
  onComplete: (workout: Workout) => void;
  onBack: () => void;
}

interface TimerDisplayProps {
  startSeconds: number;
  elapsedRef: MutableRefObject<number>;
}

const TimerDisplay = React.memo(function TimerDisplay({
  startSeconds,
  elapsedRef,
}: TimerDisplayProps): React.JSX.Element {
  const [seconds, setSeconds] = useState(startSeconds);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        elapsedRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [elapsedRef]);

  return (
    <span
      className="font-mono text-lg font-semibold tabular-nums"
      data-testid="elapsed-timer"
    >
      {formatElapsed(seconds)}
    </span>
  );
});



function seedToExercise(seed: ExerciseSeed): Exercise {
  return {
    id: seed.id,
    nameVi: seed.nameVi,
    nameEn: seed.nameEn,
    muscleGroup: seed.muscleGroup as MuscleGroup,
    secondaryMuscles: seed.secondaryMuscles as MuscleGroup[],
    category: seed.category,
    equipment: seed.equipment as EquipmentType[],
    contraindicated: seed.contraindicated as Exercise['contraindicated'],
    exerciseType: seed.exerciseType,
    defaultRepsMin: seed.defaultRepsMin,
    defaultRepsMax: seed.defaultRepsMax,
    isCustom: seed.isCustom,
    updatedAt: new Date().toISOString(),
  };
}

function resolveExercises(exerciseIds?: string[]): Exercise[] {
  if (!exerciseIds || exerciseIds.length === 0) return [];
  return exerciseIds
    .map((id) => EXERCISES.find((e) => e.id === id))
    .filter((e): e is ExerciseSeed => e !== undefined)
    .map(seedToExercise);
}

function ProgressiveOverloadChip({
  suggestion,
  onApply,
}: {
  suggestion: OverloadSuggestion | null;
  onApply: (s: OverloadSuggestion) => void;
}): React.JSX.Element | null {
  if (!suggestion) return null;
  const isPlateaued = suggestion.isPlateaued ?? false;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onApply(suggestion)}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs',
        isPlateaued
          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300'
          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300'
      )}
      data-testid="overload-chip"
    >
      {isPlateaued ? '⚠️' : '📈'} {suggestion.weight}kg × {suggestion.reps}
      {isPlateaued &&
        suggestion.plateauWeeks != null &&
        ` (plateau ${suggestion.plateauWeeks}w)`}
    </Button>
  );
}

export function WorkoutLogger({
  planDay,
  onComplete,
  onBack,
}: WorkoutLoggerProps): React.JSX.Element {
  const { t } = useTranslation();
  const saveWorkoutAtomic = useFitnessStore((s) => s.saveWorkoutAtomic);
  const setWorkoutDraft = useFitnessStore((s) => s.setWorkoutDraft);
  const clearWorkoutDraft = useFitnessStore((s) => s.clearWorkoutDraft);
  const loadWorkoutDraft = useFitnessStore((s) => s.loadWorkoutDraft);

  const { suggestNextSet: getOverloadSuggestion } = useProgressiveOverload();

  const { getValues, setValue, watch } = useForm<WorkoutLoggerFormData>({
    resolver: zodResolver(workoutLoggerSchema),
    mode: 'onBlur',
    defaultValues: { setInputs: {} },
  });

  const [currentExercises, setCurrentExercises] = useState<Exercise[]>(() => {
    const draft = useFitnessStore.getState().workoutDraft;
    return draft ? draft.exercises : resolveExercises(planDay?.exercises);
  });
  const [loggedSets, setLoggedSets] = useState<WorkoutSet[]>(() => {
    const draft = useFitnessStore.getState().workoutDraft;
    return draft ? draft.sets : [];
  });
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const initialElapsed = useMemo(() => {
    const draft = useFitnessStore.getState().workoutDraft;
    return draft ? draft.elapsedSeconds : 0;
  }, []);
  const elapsedRef = useRef(initialElapsed);

  useEffect(() => {
    loadWorkoutDraft();
  }, [loadWorkoutDraft]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentExercises.length > 0 || loggedSets.length > 0) {
        setWorkoutDraft({
          exercises: currentExercises,
          sets: loggedSets,
          elapsedSeconds: elapsedRef.current,
        });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [currentExercises, loggedSets, setWorkoutDraft]);

  const getInput = useCallback(
    (exerciseId: string): SetInputData => {
      const inputs = getValues('setInputs');
      return inputs[exerciseId] ?? setInputDefaults;
    },
    [getValues],
  );

  const ensureInput = useCallback(
    (exerciseId: string): void => {
      const current = getValues(`setInputs.${exerciseId}` as `setInputs.${string}`);
      if (!current) {
        setValue(`setInputs.${exerciseId}` as `setInputs.${string}`, { ...setInputDefaults });
      }
    },
    [getValues, setValue],
  );

  const handleApplySuggestion = useCallback(
    (exerciseId: string, s: OverloadSuggestion) => {
      const key = `setInputs.${exerciseId}` as `setInputs.${string}`;
      const current = getValues(key) ?? { ...setInputDefaults };
      setValue(key, { ...current, weight: s.weight, reps: s.reps });
    },
    [getValues, setValue],
  );

  const handleLogSet = useCallback(
    (exerciseId: string) => {
      const input = getInput(exerciseId);
      setLoggedSets((prev) => {
        const existingCount = prev.filter(
          (s) => s.exerciseId === exerciseId,
        ).length;
        const newSet: WorkoutSet = {
          id: `set-${Date.now()}-${existingCount + 1}`,
          workoutId: '',
          exerciseId,
          setNumber: existingCount + 1,
          reps: input.reps,
          weightKg: input.weight,
          rpe: input.rpe,
          updatedAt: new Date().toISOString(),
        };
        return [...prev, newSet];
      });
      setShowRestTimer(true);
    },
    [getInput],
  );

  const handleWeightChange = useCallback(
    (exerciseId: string, delta: number) => {
      const key = `setInputs.${exerciseId}` as `setInputs.${string}`;
      const current = getValues(key) ?? { ...setInputDefaults };
      setValue(key, { ...current, weight: Math.max(0, current.weight + delta) });
    },
    [getValues, setValue],
  );

  const handleRpeSelect = useCallback(
    (exerciseId: string, rpe: number) => {
      const key = `setInputs.${exerciseId}` as `setInputs.${string}`;
      const current = getValues(key) ?? { ...setInputDefaults };
      setValue(key, { ...current, rpe: current.rpe === rpe ? undefined : rpe });
    },
    [getValues, setValue],
  );

  const handleRestComplete = useCallback(() => {
    setShowRestTimer(false);
  }, []);

  const handleRestSkip = useCallback(() => {
    setShowRestTimer(false);
  }, []);

  const handleSelectExercise = useCallback((exercise: Exercise) => {
    setCurrentExercises((prev) => [...prev, exercise]);
    setShowExerciseSelector(false);
  }, []);

  const handleCloseSelector = useCallback(() => {
    setShowExerciseSelector(false);
  }, []);

  const handleFinish = useCallback(() => {
    setShowSummary(true);
  }, []);

  const handleBack = useCallback(() => {
    clearWorkoutDraft();
    onBack();
  }, [clearWorkoutDraft, onBack]);

  const totalVolume = useMemo(
    () =>
      loggedSets.reduce(
        (sum, set) => sum + set.weightKg * (set.reps ?? 0),
        0,
      ),
    [loggedSets],
  );

  const handleSave = useCallback(async () => {
    const durationMin = Math.floor(elapsedRef.current / 60);
    const now = new Date().toISOString();
    const workoutId = `workout-${Date.now()}`;
    const workout: Workout = {
      id: workoutId,
      date: now.split('T')[0],
      name: planDay?.workoutType ?? t('fitness.logger.title'),
      durationMin,
      createdAt: now,
      updatedAt: now,
    };
    const sets = loggedSets.map((s) => ({ ...s, workoutId: workout.id }));
    try {
      await saveWorkoutAtomic(workout, sets);
    } catch (error) {
      console.error('[WorkoutLogger] Save failed, draft preserved:', error);
      return;
    }
    clearWorkoutDraft();
    onComplete(workout);
  }, [
    planDay,
    loggedSets,
    saveWorkoutAtomic,
    clearWorkoutDraft,
    onComplete,
    t,
  ]);

  const detectedPRs = useMemo(() => {
    if (!showSummary) return [];
    const previousSets = useFitnessStore.getState().workoutSets ?? [];
    const exerciseMap = new Map<string, string>(
      currentExercises.map((ex) => [ex.id, ex.nameVi]),
    );
    return detectPRs(loggedSets, previousSets, exerciseMap).map((pr) => ({
      exerciseName: pr.exerciseName,
      weight: pr.newWeight,
    }));
  }, [showSummary, loggedSets, currentExercises]);

  if (showSummary) {
    return (
      <WorkoutSummaryCard
        durationSeconds={elapsedRef.current}
        totalVolume={totalVolume}
        setsCompleted={loggedSets.length}
        personalRecords={detectedPRs}
        onSave={handleSave}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-900"
      data-testid="workout-logger"
    >
      <header
        className="sticky top-0 z-10 flex items-center justify-between bg-emerald-600 px-4 py-3 text-white"
        data-testid="workout-header"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-1 text-white hover:bg-white/20 hover:text-white"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{t('fitness.logger.back')}</span>
        </Button>
        <TimerDisplay startSeconds={initialElapsed} elapsedRef={elapsedRef} />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFinish}
          className="gap-1 text-white hover:bg-white/20 hover:text-white"
          data-testid="finish-button"
        >
          <span>{t('fitness.logger.finish')}</span>
          <X className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {currentExercises.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center"
            data-testid="empty-state"
          >
            <p className="text-slate-500 dark:text-slate-400">
              {t('fitness.logger.noExercises')}
            </p>
          </div>
        ) : (
          currentExercises.map((exercise, exerciseIndex) => {
            const exerciseSets = loggedSets.filter(
              (s) => s.exerciseId === exercise.id,
            );
            ensureInput(exercise.id);
            const formInput = watch(`setInputs.${exercise.id}` as `setInputs.${string}`);
            const input: SetInputData = formInput ?? setInputDefaults;
            const suggestion = getOverloadSuggestion(
              exercise.id,
              exercise.defaultRepsMin ?? 8,
              exercise.defaultRepsMax ?? 12,
            );
            const overloadSuggestion =
              suggestion.weight > 0 ? suggestion : null;
            const nextExercise = currentExercises[exerciseIndex + 1];
            return (
              <React.Fragment key={exercise.id}>
              <section
                className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800"
                data-testid={`exercise-section-${exercise.id}`}
              >
                <h3 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-100">
                  {exercise.nameVi}
                </h3>

                {exerciseSets.map((set) => (
                  <div
                    key={set.id}
                    className="flex items-center gap-3 py-2 text-sm text-slate-600 dark:text-slate-300"
                    data-testid={`logged-set-${set.id}`}
                  >
                    <span className="font-medium">
                      {t('fitness.logger.set')} {set.setNumber}
                    </span>
                    <span>
                      {set.weightKg}kg × {set.reps ?? 0}
                    </span>
                    {set.rpe !== undefined && (
                      <span className="text-xs text-emerald-600">
                        RPE {set.rpe}
                      </span>
                    )}
                  </div>
                ))}

                <ProgressiveOverloadChip
                  suggestion={overloadSuggestion}
                  onApply={(s) => handleApplySuggestion(exercise.id, s)}
                />

                <div
                  className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-700"
                  data-testid={`set-editor-${exercise.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-xs text-slate-500">
                      {t('fitness.logger.weight')}
                    </span>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() =>
                        handleWeightChange(exercise.id, -WEIGHT_INCREMENT)
                      }
                      className="h-10 w-10 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      data-testid={`weight-minus-${exercise.id}`}
                    >
                      −
                    </Button>
                    <input
                      type="number"
                      value={input.weight}
                      onChange={(e) => {
                        const key = `setInputs.${exercise.id}` as `setInputs.${string}`;
                        const cur = getValues(key) ?? { ...setInputDefaults };
                        setValue(key, { ...cur, weight: Number(e.target.value) });
                      }}
                      className="w-20 rounded-lg border border-slate-200 bg-white py-2 text-center text-sm font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      data-testid={`weight-input-${exercise.id}`}
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() =>
                        handleWeightChange(exercise.id, WEIGHT_INCREMENT)
                      }
                      className="h-10 w-10 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      data-testid={`weight-plus-${exercise.id}`}
                    >
                      +
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-16 text-xs text-slate-500">
                      {t('fitness.logger.reps')}
                    </span>
                    <input
                      type="number"
                      value={input.reps ?? 0}
                      onChange={(e) => {
                        const key = `setInputs.${exercise.id}` as `setInputs.${string}`;
                        const cur = getValues(key) ?? { ...setInputDefaults };
                        setValue(key, { ...cur, reps: Math.max(0, Number(e.target.value)) });
                      }}
                      className="w-20 rounded-lg border border-slate-200 bg-white py-2 text-center text-sm font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      data-testid={`reps-input-${exercise.id}`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-16 text-xs text-slate-500">
                      {t('fitness.logger.rpe')}
                    </span>
                    <div
                      className="flex gap-1"
                      data-testid={`rpe-selector-${exercise.id}`}
                    >
                      {RPE_OPTIONS.map((rpe) => (
                        <Button
                          key={rpe}
                          variant={input.rpe === rpe ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => handleRpeSelect(exercise.id, rpe)}
                          className={cn(
                            'h-9 w-9 rounded-full text-xs',
                            input.rpe === rpe
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'bg-slate-100 text-slate-600 border-transparent dark:bg-slate-700 dark:text-slate-300'
                          )}
                          data-testid={`rpe-${rpe}-${exercise.id}`}
                        >
                          {rpe}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="default"
                    onClick={() => handleLogSet(exercise.id)}
                    className="w-full bg-emerald-500 py-2.5 text-white hover:bg-emerald-600"
                    data-testid={`log-set-${exercise.id}`}
                  >
                    {t('fitness.logger.logSet')}
                  </Button>
                </div>
              </section>

              {nextExercise && (
                <div
                  data-testid={`transition-card-${exercise.id}`}
                  className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-2.5 dark:bg-slate-700/50"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                    {exerciseIndex + 2}
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {t('fitness.logger.nextUp')}: <span className="font-medium text-slate-700 dark:text-slate-200">{nextExercise.nameVi}</span>
                  </span>
                </div>
              )}
              </React.Fragment>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <Button
          variant="outline"
          onClick={() => setShowExerciseSelector(true)}
          className="w-full gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-slate-500 hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-600 dark:text-slate-400"
          data-testid="add-exercise-button"
        >
          <Plus className="h-5 w-5" />
          {t('fitness.logger.addExercise')}
        </Button>
      </div>

      {showRestTimer && (
        <RestTimer
          durationSeconds={DEFAULT_REST_SECONDS}
          onComplete={handleRestComplete}
          onSkip={handleRestSkip}
        />
      )}

      <ExerciseSelector
        isOpen={showExerciseSelector}
        onClose={handleCloseSelector}
        onSelect={handleSelectExercise}
      />
    </div>
  );
}
