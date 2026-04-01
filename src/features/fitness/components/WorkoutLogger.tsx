import React, { useState, useEffect, useCallback, useMemo, useRef, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, X, Plus, Pencil, Trash2 } from 'lucide-react';
import { SetEditor } from './SetEditor';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { RestTimer } from './RestTimer';
import { ExerciseSelector } from './ExerciseSelector';
import { WorkoutSummaryCard } from './WorkoutSummaryCard';
import { useNotification } from '../../../contexts/NotificationContext';
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
  SelectedExercise,
} from '../types';
import { safeParseJsonArray } from '../types';
import { DEFAULT_REST_SECONDS, RPE_OPTIONS, WEIGHT_INCREMENT } from '../constants';
import { useProgressiveOverload } from '../hooks/useProgressiveOverload';
import { generateUUID } from '@/utils/helpers';
import type { OverloadSuggestion } from '../hooks/useProgressiveOverload';
import {
  workoutLoggerSchema,
  setInputDefaults,
  type WorkoutLoggerFormData,
  type SetInputData,
} from '../../../schemas/workoutLoggerSchema';

interface WorkoutLoggerProps {
  planDay?: {
    id?: string;
    dayOfWeek: number;
    workoutType: string;
    exercises?: string;
    muscleGroups?: string;
  };
  onComplete: () => void;
  onBack: () => void;
}

interface TimerDisplayProps {
  startSeconds: number;
  elapsedRef: RefObject<number>;
  isRunning: boolean;
}

const TimerDisplay = React.memo(function TimerDisplay({
  startSeconds,
  elapsedRef,
  isRunning,
}: TimerDisplayProps): React.JSX.Element {
  const [seconds, setSeconds] = useState(startSeconds);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        elapsedRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [elapsedRef, isRunning]);

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

function parseExercisesFromPlan(exercisesJson?: string): Exercise[] {
  const selected = safeParseJsonArray<SelectedExercise>(exercisesJson);
  if (selected.length === 0) return [];
  return selected
    .map(se => {
      const seed = EXERCISES.find(e => e.id === se.exercise.id);
      return seed ? seedToExercise(seed) : null;
    })
    .filter((e): e is Exercise => e !== null);
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
  const notify = useNotification();
  const saveWorkoutAtomic = useFitnessStore((s) => s.saveWorkoutAtomic);
  const setWorkoutDraft = useFitnessStore((s) => s.setWorkoutDraft);
  const clearWorkoutDraft = useFitnessStore((s) => s.clearWorkoutDraft);
  const loadWorkoutDraft = useFitnessStore((s) => s.loadWorkoutDraft);

  const { suggestNextSet: getOverloadSuggestion } = useProgressiveOverload();

  const { getValues, setValue, watch } = useForm<WorkoutLoggerFormData>({
    resolver: zodResolver(workoutLoggerSchema) as unknown as Resolver<WorkoutLoggerFormData>,
    mode: 'onBlur',
    defaultValues: { setInputs: {} },
  });

  const [currentExercises, setCurrentExercises] = useState<Exercise[]>(() => {
    const draft = useFitnessStore.getState().workoutDraft;
    const draftMatchesPlan = draft && (!planDay?.id || draft.planDayId === planDay.id);
    return draftMatchesPlan ? draft.exercises : parseExercisesFromPlan(planDay?.exercises);
  });
  const [loggedSets, setLoggedSets] = useState<WorkoutSet[]>(() => {
    const draft = useFitnessStore.getState().workoutDraft;
    const draftMatchesPlan = draft && (!planDay?.id || draft.planDayId === planDay.id);
    return draftMatchesPlan ? draft.sets : [];
  });
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [editingSet, setEditingSet] = useState<WorkoutSet | null>(null);
  const [freestyleName, setFreestyleName] = useState('');
  const isFreestyle = !planDay;
  const initialElapsed = useMemo(() => {
    const draft = useFitnessStore.getState().workoutDraft;
    return draft ? draft.elapsedSeconds : 0;
  }, []);
  const elapsedRef = useRef(initialElapsed);
  const [timerRunning, setTimerRunning] = useState(() => {
    const draft = useFitnessStore.getState().workoutDraft;
    const draftMatchesPlan = draft && (!planDay?.id || draft.planDayId === planDay.id);
    const hasExercises = draftMatchesPlan
      ? draft.exercises.length > 0
      : parseExercisesFromPlan(planDay?.exercises).length > 0;
    return hasExercises || initialElapsed > 0;
  });

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
          planDayId: planDay?.id,
        });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [currentExercises, loggedSets, setWorkoutDraft, planDay?.id]);

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
          id: generateUUID(),
          workoutId: '',
          exerciseId,
          setNumber: existingCount + 1,
          reps: Number.isNaN(input.reps) ? 1 : Math.max(1, input.reps),
          weightKg: Number.isNaN(input.weight) ? 0 : input.weight,
          rpe: input.rpe,
          updatedAt: new Date().toISOString(),
        };
        return [...prev, newSet];
      });
      setShowRestTimer(true);
    },
    [getInput],
  );

  const handleDeleteSet = useCallback((setId: string) => {
    setLoggedSets((prev) => {
      const target = prev.find((s) => s.id === setId);
      if (!target) return prev;
      const filtered = prev.filter((s) => s.id !== setId);
      let counter = 0;
      return filtered.map((s) => {
        if (s.exerciseId === target.exerciseId) {
          counter++;
          return { ...s, setNumber: counter };
        }
        return s;
      });
    });
  }, []);

  const handleEditSetSave = useCallback(
    (data: { weight: number; reps: number; rpe?: number }) => {
      if (!editingSet) return;
      setLoggedSets((prev) =>
        prev.map((s) =>
          s.id === editingSet.id
            ? { ...s, weightKg: data.weight, reps: data.reps, rpe: data.rpe, updatedAt: new Date().toISOString() }
            : s,
        ),
      );
      setEditingSet(null);
    },
    [editingSet],
  );

  const handleEditSetCancel = useCallback(() => {
    setEditingSet(null);
  }, []);

  const recentWeightsForEdit = useMemo(() => {
    if (!editingSet) return [];
    const weights = loggedSets
      .filter((s) => s.exerciseId === editingSet.exerciseId && s.id !== editingSet.id)
      .map((s) => s.weightKg);
    return [...new Set(weights)].slice(0, 5);
  }, [editingSet, loggedSets]);

  const handleWeightChange = useCallback(
    (exerciseId: string, delta: number) => {
      const key = `setInputs.${exerciseId}` as `setInputs.${string}`;
      const current = getValues(key) ?? { ...setInputDefaults };
      setValue(key, { ...current, weight: Math.max(0, (Number.isNaN(current.weight) ? 0 : current.weight) + delta) });
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
    if (!timerRunning) setTimerRunning(true);
  }, [timerRunning]);

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
    const workoutId = generateUUID();
    const workoutName = planDay
      ? (planDay.workoutType || t('fitness.logger.title'))
      : (freestyleName.trim() || t('fitness.plan.freestyleDefault'));
    const workout: Workout = {
      id: workoutId,
      date: now.split('T')[0],
      name: workoutName,
      planDayId: planDay?.id,
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
    notify.success(t('fitness.logger.saveSuccess'));
    onComplete();
  }, [
    planDay,
    loggedSets,
    saveWorkoutAtomic,
    clearWorkoutDraft,
    onComplete,
    notify,
    t,
    freestyleName,
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
      <>
        {isFreestyle && (
          <div className="px-4 py-3" data-testid="freestyle-name-section">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('fitness.plan.freestyleName')}
            </label>
            <input
              type="text"
              value={freestyleName}
              onChange={(e) => setFreestyleName(e.target.value)}
              placeholder={t('fitness.plan.freestyleDefault')}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              data-testid="freestyle-name-input"
            />
          </div>
        )}
        <WorkoutSummaryCard
          durationSeconds={elapsedRef.current}
          totalVolume={totalVolume}
          setsCompleted={loggedSets.length}
          personalRecords={detectedPRs}
          onSave={handleSave}
        />
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-900"
      data-testid="workout-logger"
    >
      <header
        className="sticky top-0 z-10 flex items-center justify-between bg-emerald-600 px-4 py-3 pt-safe text-white"
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
        <TimerDisplay startSeconds={initialElapsed} elapsedRef={elapsedRef} isRunning={timerRunning} />
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
                    <span className="ml-auto flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingSet(set)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:hover:bg-slate-700 dark:hover:text-slate-200"
                        aria-label={t('fitness.logger.editSet')}
                        data-testid={`edit-set-${set.id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSet(set.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                        aria-label={t('fitness.logger.deleteSet')}
                        data-testid={`delete-set-${set.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </span>
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
                      aria-label={t('fitness.logger.decreaseWeight')}
                    >
                      −
                    </Button>
                    <Input
                      type="number"
                      autoComplete="off"
                      value={Number.isNaN(input.weight) ? '' : input.weight}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const key = `setInputs.${exercise.id}` as `setInputs.${string}`;
                        const cur = getValues(key) ?? { ...setInputDefaults };
                        setValue(key, {
                          ...cur,
                          weight: raw === '' ? NaN : Math.max(0, Number(raw)),
                        });
                      }}
                      className="w-20 text-center font-semibold text-slate-800"
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
                      aria-label={t('fitness.logger.increaseWeight')}
                    >
                      +
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-16 text-xs text-slate-500">
                      {t('fitness.logger.reps')}
                    </span>
                    <Input
                      type="number"
                      autoComplete="off"
                      value={Number.isNaN(input.reps) ? '' : (input.reps ?? '')}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const key = `setInputs.${exercise.id}` as `setInputs.${string}`;
                        const cur = getValues(key) ?? { ...setInputDefaults };
                        setValue(key, { ...cur, reps: raw === '' ? NaN : Math.max(0, Number(raw)) });
                      }}
                      className="w-20 text-center font-semibold text-slate-800"
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

      <div className="sticky bottom-0 border-t border-slate-100 bg-white/95 p-4 pb-safe backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95" data-testid="add-exercise-container">
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

      {editingSet && (
        <SetEditor
          initialWeight={editingSet.weightKg}
          initialReps={editingSet.reps ?? 1}
          initialRpe={editingSet.rpe}
          recentWeights={recentWeightsForEdit}
          onSave={handleEditSetSave}
          onCancel={handleEditSetCancel}
          isVisible
        />
      )}
    </div>
  );
}
