import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, ChevronLeft, Clock, Plus } from 'lucide-react';
import React, { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { generateUUID } from '@/utils/helpers';
import { logger } from '@/utils/logger';

import { useNotification } from '../../../contexts/NotificationContext';
import {
  type SetInputData,
  setInputDefaults,
  type WorkoutLoggerFormData,
  workoutLoggerSchema,
} from '../../../schemas/workoutLoggerSchema';
import { useFitnessStore } from '../../../store/fitnessStore';
import { DEFAULT_REST_SECONDS, MIN_REPS } from '../constants';
import type { ExerciseSeed } from '../data/exerciseDatabase';
import { EXERCISES } from '../data/exerciseDatabase';
import type { OverloadSuggestion } from '../hooks/useProgressiveOverload';
import { useProgressiveOverload } from '../hooks/useProgressiveOverload';
import type {
  EquipmentType,
  Exercise,
  ExerciseSessionMeta,
  MuscleGroup,
  SelectedExercise,
  Workout,
  WorkoutSet,
} from '../types';
import { safeParseJsonArray } from '../types';
import { detectPRs } from '../utils/gamification';
import { formatElapsed } from '../utils/timeFormat';
import { ExerciseSelector } from './ExerciseSelector';
import ExerciseWorkoutCard from './ExerciseWorkoutCard';
import { NextExercisePreview } from './NextExercisePreview';
import { RestTimer } from './RestTimer';
import { SetEditor } from './SetEditor';
import { SwapExerciseSheet } from './SwapExerciseSheet';
import { WorkoutSummaryCard } from './WorkoutSummaryCard';

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
      setSeconds(prev => {
        const next = prev + 1;
        elapsedRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [elapsedRef, isRunning]);

  return (
    <span className="font-mono text-lg font-semibold tabular-nums" data-testid="elapsed-timer">
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

function parseExercisesFromPlan(exercisesJson?: string): ExerciseSessionMeta[] {
  const selected = safeParseJsonArray<SelectedExercise>(exercisesJson);
  if (selected.length === 0) return [];
  return selected
    .map(se => {
      const exerciseData = se.exercise;
      if (!exerciseData?.id) return null;
      // Prefer seed for i18n; fallback to plan's embedded data for custom exercises
      const seed = EXERCISES.find(e => e.id === exerciseData.id);
      const exercise = seed ? seedToExercise(seed) : (exerciseData as unknown as Exercise);
      if (!exercise) return null;
      return {
        exercise,
        plannedSets: se.sets ?? 3,
        repsMin: se.repsMin ?? exercise.defaultRepsMin ?? 8,
        repsMax: se.repsMax ?? exercise.defaultRepsMax ?? 12,
        restSeconds: se.restSeconds ?? DEFAULT_REST_SECONDS,
      } satisfies ExerciseSessionMeta;
    })
    .filter((e): e is ExerciseSessionMeta => e !== null);
}

export function WorkoutLogger({ planDay, onComplete, onBack }: Readonly<WorkoutLoggerProps>): React.JSX.Element {
  const { t } = useTranslation();
  const notify = useNotification();
  const saveWorkoutAtomic = useFitnessStore(s => s.saveWorkoutAtomic);
  const setWorkoutDraft = useFitnessStore(s => s.setWorkoutDraft);
  const clearWorkoutDraft = useFitnessStore(s => s.clearWorkoutDraft);
  const loadWorkoutDraft = useFitnessStore(s => s.loadWorkoutDraft);

  const { suggestNextSet: getOverloadSuggestion } = useProgressiveOverload();

  const { getValues, setValue, watch } = useForm<WorkoutLoggerFormData>({
    resolver: zodResolver(workoutLoggerSchema) as unknown as Resolver<WorkoutLoggerFormData>,
    mode: 'onTouched',
    defaultValues: { setInputs: {} },
  });

  const [currentExercises, setCurrentExercises] = useState<ExerciseSessionMeta[]>(() => {
    const draft = useFitnessStore.getState().workoutDraft;
    const draftMatchesPlan = draft && (!planDay?.id || draft.planDayId === planDay.id);
    if (draftMatchesPlan && draft.exerciseMetas) {
      return draft.exerciseMetas;
    }
    if (draftMatchesPlan && draft.exercises) {
      return draft.exercises.map(ex => ({
        exercise: ex,
        plannedSets: 3,
        repsMin: ex.defaultRepsMin ?? 8,
        repsMax: ex.defaultRepsMax ?? 12,
        restSeconds: DEFAULT_REST_SECONDS,
      }));
    }
    return parseExercisesFromPlan(planDay?.exercises);
  });
  const [loggedSets, setLoggedSets] = useState<WorkoutSet[]>(() => {
    const draft = useFitnessStore.getState().workoutDraft;
    const draftMatchesPlan = draft && (!planDay?.id || draft.planDayId === planDay.id);
    return draftMatchesPlan ? draft.sets : [];
  });
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showSwapSheet, setShowSwapSheet] = useState(false);

  useEffect(() => {
    loadWorkoutDraft();
  }, [loadWorkoutDraft]);

  useEffect(() => {
    if (currentExercises.length > 0 && currentExerciseIndex >= currentExercises.length) {
      setCurrentExerciseIndex(currentExercises.length - 1);
    }
  }, [currentExercises.length, currentExerciseIndex]);

  const currentMeta = currentExercises[currentExerciseIndex] as ExerciseSessionMeta | undefined;
  const nextMeta = currentExercises[currentExerciseIndex + 1] as ExerciseSessionMeta | undefined;
  const isFirstExercise = currentExerciseIndex === 0;

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentExercises.length > 0 || loggedSets.length > 0) {
        setWorkoutDraft({
          exercises: currentExercises.map(m => m.exercise),
          exerciseMetas: currentExercises,
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
      /* v8 ignore start: RHF always provides value after ensureInput */
      return inputs[exerciseId] ?? setInputDefaults;
      /* v8 ignore stop */
    },
    [getValues],
  );

  const ensureInput = useCallback(
    (exerciseId: string): void => {
      const current = getValues(`setInputs.${exerciseId}` as const);
      if (!current) {
        setValue(`setInputs.${exerciseId}` as const, { ...setInputDefaults });
      }
    },
    [getValues, setValue],
  );

  // Ensure form inputs exist for all initially loaded exercises (from plan/draft)
  useEffect(() => {
    currentExercises.forEach(meta => ensureInput(meta.exercise.id));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplySuggestion = useCallback(
    (exerciseId: string, s: OverloadSuggestion) => {
      const key: `setInputs.${string}` = `setInputs.${exerciseId}`;
      /* v8 ignore start */
      const current = getValues(key) ?? { ...setInputDefaults };
      /* v8 ignore stop */
      setValue(key, { ...current, weight: s.weight, reps: s.reps });
    },
    [getValues, setValue],
  );

  const handleLogSet = useCallback(
    (exerciseId: string) => {
      const input = getInput(exerciseId);
      setLoggedSets(prev => {
        const existingCount = prev.filter(s => s.exerciseId === exerciseId).length;
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

  const handleCopyLastSet = useCallback(
    (exerciseId: string) => {
      const exerciseSets = loggedSets.filter(s => s.exerciseId === exerciseId);
      const lastSet = exerciseSets.at(-1);
      if (!lastSet) return;
      const key: `setInputs.${string}` = `setInputs.${exerciseId}`;
      /* v8 ignore start -- defensive: getValues may return undefined before form registers field */
      const current = getValues(key) ?? { ...setInputDefaults };
      /* v8 ignore stop */
      setValue(key, {
        ...current,
        weight: lastSet.weightKg,
        reps: lastSet.reps ?? current.reps,
        rpe: lastSet.rpe,
      });
    },
    [loggedSets, getValues, setValue],
  );

  const handleDeleteSet = useCallback((setId: string) => {
    setLoggedSets(prev => {
      const target = prev.find(s => s.id === setId);
      /* v8 ignore start */
      if (!target) return prev;
      /* v8 ignore stop */
      const filtered = prev.filter(s => s.id !== setId);
      let counter = 0;
      return filtered.map(s => {
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
      /* v8 ignore start */
      if (!editingSet) return;
      /* v8 ignore stop */
      setLoggedSets(prev =>
        prev.map(s =>
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
      .filter(s => s.exerciseId === editingSet.exerciseId && s.id !== editingSet.id)
      .map(s => s.weightKg);
    return [...new Set(weights)].slice(0, 5);
  }, [editingSet, loggedSets]);

  const handleWeightChange = useCallback(
    (exerciseId: string, delta: number) => {
      const key: `setInputs.${string}` = `setInputs.${exerciseId}`;
      /* v8 ignore start */
      const current = getValues(key) ?? { ...setInputDefaults };
      /* v8 ignore stop */
      setValue(key, { ...current, weight: Math.max(0, (Number.isNaN(current.weight) ? 0 : current.weight) + delta) });
    },
    [getValues, setValue],
  );

  const handleRepsChange = useCallback(
    (exerciseId: string, delta: number) => {
      const key: `setInputs.${string}` = `setInputs.${exerciseId}`;
      /* v8 ignore start */
      const current = getValues(key) ?? { ...setInputDefaults };
      /* v8 ignore stop */
      setValue(key, {
        ...current,
        reps: Math.max(MIN_REPS, (Number.isNaN(current.reps) ? MIN_REPS : current.reps) + delta),
      });
    },
    [getValues, setValue],
  );

  const handleRpeSelect = useCallback(
    (exerciseId: string, rpe: number | undefined) => {
      const key: `setInputs.${string}` = `setInputs.${exerciseId}`;
      /* v8 ignore start */
      const current = getValues(key) ?? { ...setInputDefaults };
      /* v8 ignore stop */
      const nextRpe = rpe === undefined || current.rpe === rpe ? undefined : rpe;
      setValue(key, { ...current, rpe: nextRpe });
    },
    [getValues, setValue],
  );

  const handleRestComplete = useCallback(() => {
    setShowRestTimer(false);
  }, []);

  const handleRestSkip = useCallback(() => {
    setShowRestTimer(false);
  }, []);

  const handleSelectExercise = useCallback(
    (exercise: Exercise) => {
      const newMeta: ExerciseSessionMeta = {
        exercise,
        plannedSets: 3,
        repsMin: exercise.defaultRepsMin ?? 8,
        repsMax: exercise.defaultRepsMax ?? 12,
        restSeconds: DEFAULT_REST_SECONDS,
      };
      ensureInput(exercise.id);
      setCurrentExercises(prev => {
        const next = [...prev, newMeta];
        setCurrentExerciseIndex(next.length - 1);
        return next;
      });
      setShowExerciseSelector(false);
      if (!timerRunning) setTimerRunning(true);
    },
    [timerRunning, ensureInput],
  );

  const handleCloseSelector = useCallback(() => {
    setShowExerciseSelector(false);
  }, []);

  const handleNavigateNext = useCallback(() => {
    const nextIdx = Math.min(currentExerciseIndex + 1, currentExercises.length - 1);
    const nextEx = currentExercises[nextIdx];
    if (nextEx) ensureInput(nextEx.exercise.id);
    setCurrentExerciseIndex(nextIdx);
  }, [currentExercises, currentExerciseIndex, ensureInput]);

  const handleNavigatePrev = useCallback(() => {
    const prevIdx = Math.max(currentExerciseIndex - 1, 0);
    const prevEx = currentExercises[prevIdx];
    if (prevEx) ensureInput(prevEx.exercise.id);
    setCurrentExerciseIndex(prevIdx);
  }, [currentExercises, currentExerciseIndex, ensureInput]);

  const handleSwapExercise = useCallback(
    (newExercise: Exercise) => {
      if (!currentMeta) return;
      const oldId = currentMeta.exercise.id;
      const newMeta: ExerciseSessionMeta = {
        exercise: newExercise,
        plannedSets: currentMeta.plannedSets,
        repsMin: newExercise.defaultRepsMin ?? currentMeta.repsMin,
        repsMax: newExercise.defaultRepsMax ?? currentMeta.repsMax,
        restSeconds: currentMeta.restSeconds,
      };
      setCurrentExercises(prev => prev.map((m, i) => (i === currentExerciseIndex ? newMeta : m)));
      setLoggedSets(prev => prev.filter(s => s.exerciseId !== oldId));
      setValue(`setInputs.${oldId}` as const, { ...setInputDefaults });
      ensureInput(newExercise.id);
      setShowSwapSheet(false);
    },
    [currentMeta, currentExerciseIndex, setValue, ensureInput],
  );

  const handleFinish = useCallback(() => {
    setShowSummary(true);
  }, []);

  const handleBack = useCallback(() => {
    clearWorkoutDraft();
    onBack();
  }, [clearWorkoutDraft, onBack]);

  const totalVolume = useMemo(
    /* v8 ignore start */
    () => loggedSets.reduce((sum, set) => sum + set.weightKg * (set.reps ?? 0), 0),
    /* v8 ignore stop */
    [loggedSets],
  );

  const handleSave = useCallback(async () => {
    /* v8 ignore start */
    if (isSaving) return;
    /* v8 ignore stop */
    setIsSaving(true);
    const durationMin = Math.floor(elapsedRef.current / 60);
    const now = new Date().toISOString();
    const workoutId = generateUUID();
    const workoutName = planDay
      ? planDay.workoutType || t('fitness.logger.title')
      : freestyleName.trim() || t('fitness.plan.freestyleDefault');
    const workout: Workout = {
      id: workoutId,
      date: now.split('T')[0],
      name: workoutName,
      planDayId: planDay?.id,
      durationMin,
      createdAt: now,
      updatedAt: now,
    };
    const sets = loggedSets.map(s => ({ ...s, workoutId: workout.id }));
    try {
      await saveWorkoutAtomic(workout, sets);
    } catch (error) {
      logger.error({ component: 'WorkoutLogger', action: 'save' }, error);
      notify.error(t('fitness.logger.saveFailed'));
      setIsSaving(false);
      return;
    }
    clearWorkoutDraft();
    notify.success(t('fitness.logger.saveSuccess'));
    onComplete();
  }, [isSaving, planDay, loggedSets, saveWorkoutAtomic, clearWorkoutDraft, onComplete, notify, t, freestyleName]);

  const detectedPRs = useMemo(() => {
    if (!showSummary) return [];
    const previousSets = useFitnessStore.getState().workoutSets ?? [];
    const exerciseMap = new Map<string, string>(currentExercises.map(m => [m.exercise.id, m.exercise.nameVi]));
    return detectPRs(loggedSets, previousSets, exerciseMap).map(pr => ({
      exerciseName: pr.exerciseName,
      weight: pr.newWeight,
    }));
  }, [showSummary, loggedSets, currentExercises]);

  if (showSummary) {
    return (
      <>
        {isFreestyle && (
          <div className="px-4 py-3" data-testid="freestyle-name-section">
            <label className="text-foreground text-sm leading-relaxed font-medium">
              {t('fitness.plan.freestyleName')}
            </label>
            <input
              type="text"
              value={freestyleName}
              onChange={e => setFreestyleName(e.target.value)}
              placeholder={t('fitness.plan.freestyleDefault')}
              className="border-border mt-1 w-full rounded-lg border px-3 py-2 text-sm"
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
          isSaving={isSaving}
        />
      </>
    );
  }

  return (
    <div className="bg-muted fixed inset-0 z-50 flex flex-col" data-testid="workout-logger">
      <header
        className="pt-safe bg-primary text-primary-foreground sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        data-testid="workout-header"
      >
        <button
          type="button"
          onClick={handleBack}
          className="hover:bg-primary-foreground/20 text-primary-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="inline-flex items-center gap-1.5" data-testid="elapsed-timer-pill">
          <Clock className="h-4 w-4" aria-hidden="true" />
          <TimerDisplay startSeconds={initialElapsed} elapsedRef={elapsedRef} isRunning={timerRunning} />
        </div>
        <button
          type="button"
          onClick={handleFinish}
          className="hover:bg-primary-foreground/20 text-primary-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors"
          data-testid="finish-button"
        >
          <Check className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {currentExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state">
            <p className="text-muted-foreground">{t('fitness.logger.noExercises')}</p>
          </div>
        ) : (
          currentMeta && (
            <>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={isFirstExercise}
                  onClick={handleNavigatePrev}
                  className="text-primary disabled:text-muted-foreground inline-flex items-center gap-1 text-sm disabled:opacity-50"
                  data-testid="prev-exercise-btn"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  {t('fitness.logger.prevExercise')}
                </button>
              </div>

              <ExerciseWorkoutCard
                meta={currentMeta}
                exerciseIndex={currentExerciseIndex}
                totalExercises={currentExercises.length}
                loggedSets={loggedSets.filter(s => s.exerciseId === currentMeta.exercise.id)}
                currentInput={watch(`setInputs.${currentMeta.exercise.id}` as const) ?? setInputDefaults}
                overloadSuggestion={(() => {
                  const s = getOverloadSuggestion(
                    currentMeta.exercise.id,
                    currentMeta.exercise.defaultRepsMin ?? 8,
                    currentMeta.exercise.defaultRepsMax ?? 12,
                  );
                  return s.weight > 0 ? s : null;
                })()}
                onWeightChange={delta => handleWeightChange(currentMeta.exercise.id, delta)}
                onRepsChange={delta => handleRepsChange(currentMeta.exercise.id, delta)}
                onRpeSelect={rpe => handleRpeSelect(currentMeta.exercise.id, rpe)}
                onWeightInput={raw => {
                  const key: `setInputs.${string}` = `setInputs.${currentMeta.exercise.id}`;
                  /* v8 ignore start */
                  const cur = getValues(key) ?? { ...setInputDefaults };
                  /* v8 ignore stop */
                  setValue(key, {
                    ...cur,
                    weight: raw === '' ? Number.NaN : Math.max(0, Number(raw)),
                  });
                }}
                onRepsInput={raw => {
                  const key: `setInputs.${string}` = `setInputs.${currentMeta.exercise.id}`;
                  /* v8 ignore start */
                  const cur = getValues(key) ?? { ...setInputDefaults };
                  /* v8 ignore stop */
                  setValue(key, { ...cur, reps: raw === '' ? Number.NaN : Math.max(1, Number(raw)) });
                }}
                onDeleteSet={handleDeleteSet}
                onEditSet={setEditingSet}
                onCopyLastSet={() => handleCopyLastSet(currentMeta.exercise.id)}
                onApplyOverload={s => handleApplySuggestion(currentMeta.exercise.id, s)}
                onSwapExercise={() => setShowSwapSheet(true)}
                onLogSet={() => handleLogSet(currentMeta.exercise.id)}
              />

              {nextMeta && <NextExercisePreview meta={nextMeta} onNavigate={handleNavigateNext} />}
            </>
          )
        )}
      </div>

      <div
        className="pb-safe border-border-subtle bg-card/95 sticky bottom-0 flex gap-2 border-t p-4 backdrop-blur-sm"
        data-testid="bottom-bar"
      >
        <button
          type="button"
          onClick={() => setShowExerciseSelector(true)}
          className="text-muted-foreground hover:border-primary hover:text-primary border-border inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm"
          data-testid="add-exercise-bottom-btn"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          {t('fitness.logger.addExercise')}
        </button>
      </div>

      {showRestTimer && currentMeta && (
        <RestTimer
          durationSeconds={currentMeta.restSeconds ?? DEFAULT_REST_SECONDS}
          onComplete={handleRestComplete}
          onSkip={handleRestSkip}
        />
      )}

      <ExerciseSelector isOpen={showExerciseSelector} onClose={handleCloseSelector} onSelect={handleSelectExercise} />

      {showSwapSheet && currentMeta && (
        <SwapExerciseSheet
          isOpen={showSwapSheet}
          currentExercise={currentMeta.exercise}
          excludeIds={currentExercises.map(m => m.exercise.id)}
          onSelect={handleSwapExercise}
          onClose={() => setShowSwapSheet(false)}
        />
      )}

      {editingSet && (
        <SetEditor
          initialWeight={editingSet.weightKg}
          initialReps={editingSet.reps /* v8 ignore start */ ?? 1 /* v8 ignore stop */}
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
