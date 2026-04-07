import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowLeft, Copy, Pencil, Plus, Trash2, TrendingUp, X } from 'lucide-react';
import React, { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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
import { DEFAULT_REST_SECONDS, MIN_REPS, REPS_INCREMENT, RPE_OPTIONS, WEIGHT_INCREMENT } from '../constants';
import type { ExerciseSeed } from '../data/exerciseDatabase';
import { EXERCISES } from '../data/exerciseDatabase';
import type { OverloadSuggestion } from '../hooks/useProgressiveOverload';
import { useProgressiveOverload } from '../hooks/useProgressiveOverload';
import type { EquipmentType, Exercise, MuscleGroup, SelectedExercise, Workout, WorkoutSet } from '../types';
import { safeParseJsonArray } from '../types';
import { detectPRs } from '../utils/gamification';
import { formatElapsed } from '../utils/timeFormat';
import { ExerciseSelector } from './ExerciseSelector';
import { RestTimer } from './RestTimer';
import { SetEditor } from './SetEditor';
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

function parseExercisesFromPlan(exercisesJson?: string): Exercise[] {
  const selected = safeParseJsonArray<SelectedExercise>(exercisesJson);
  if (selected.length === 0) return [];
  return selected
    .map(se => {
      const exerciseId = se.exercise?.id;
      if (!exerciseId) return null;
      const seed = EXERCISES.find(e => e.id === exerciseId);
      return seed ? seedToExercise(seed) : null;
    })
    .filter((e): e is Exercise => e !== null);
}

function ProgressiveOverloadChip({
  suggestion,
  onApply,
}: Readonly<{
  suggestion: OverloadSuggestion | null;
  onApply: (s: OverloadSuggestion) => void;
}>): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!suggestion) return null;
  const isPlateaued = suggestion.isPlateaued ?? false;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onApply(suggestion)}
      className={cn(
        'rounded-full px-3 py-1.5 text-xs',
        isPlateaued ? 'bg-warning/10 text-warning hover:bg-warning/15' : 'bg-info/10 text-info hover:bg-info/15',
      )}
      data-testid="overload-chip"
    >
      {isPlateaued ? (
        <AlertTriangle className="mr-1 inline h-3 w-3" aria-hidden="true" />
      ) : (
        <TrendingUp className="mr-1 inline h-3 w-3" aria-hidden="true" />
      )}{' '}
      {t('fitness.setFormat', { weight: suggestion.weight, reps: suggestion.reps })}
      {isPlateaued && suggestion.plateauWeeks != null && ` (plateau ${suggestion.plateauWeeks}w)`}
    </Button>
  );
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
      /* v8 ignore start */
      if (!editingSet) return;
      /* v8 ignore stop */
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
    (exerciseId: string, rpe: number) => {
      const key: `setInputs.${string}` = `setInputs.${exerciseId}`;
      /* v8 ignore start */
      const current = getValues(key) ?? { ...setInputDefaults };
      /* v8 ignore stop */
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

  const handleSelectExercise = useCallback(
    (exercise: Exercise) => {
      setCurrentExercises(prev => [...prev, exercise]);
      setShowExerciseSelector(false);
      if (!timerRunning) setTimerRunning(true);
    },
    [timerRunning],
  );

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
    const exerciseMap = new Map<string, string>(currentExercises.map(ex => [ex.id, ex.nameVi]));
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
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="hover:bg-primary-foreground/20 text-primary-foreground hover:text-primary-foreground gap-1 transition-colors"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span>{t('fitness.logger.back')}</span>
        </Button>
        <TimerDisplay startSeconds={initialElapsed} elapsedRef={elapsedRef} isRunning={timerRunning} />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFinish}
          className="hover:bg-primary-foreground/20 text-primary-foreground hover:text-primary-foreground gap-1 transition-colors"
          data-testid="finish-button"
        >
          <span>{t('fitness.logger.finish')}</span>
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {currentExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state">
            <p className="text-muted-foreground">{t('fitness.logger.noExercises')}</p>
          </div>
        ) : (
          currentExercises.map((exercise, exerciseIndex) => {
            const exerciseSets = loggedSets.filter(s => s.exerciseId === exercise.id);
            ensureInput(exercise.id);
            const formInput = watch(`setInputs.${exercise.id}` as const);
            const input: SetInputData = formInput ?? setInputDefaults;
            const suggestion = getOverloadSuggestion(
              exercise.id,
              exercise.defaultRepsMin ?? 8,
              exercise.defaultRepsMax ?? 12,
            );
            const overloadSuggestion = suggestion.weight > 0 ? suggestion : null;
            const nextExercise = currentExercises[exerciseIndex + 1];
            return (
              <React.Fragment key={exercise.id}>
                <section className="bg-card rounded-xl p-4 shadow-sm" data-testid={`exercise-section-${exercise.id}`}>
                  <h3 className="text-foreground mb-3 truncate text-base font-semibold">{exercise.nameVi}</h3>

                  {exerciseSets.map(set => (
                    <div
                      key={set.id}
                      className="text-foreground-secondary flex items-center gap-3 py-2 text-sm"
                      data-testid={`logged-set-${set.id}`}
                    >
                      <span className="font-medium">
                        {t('fitness.logger.set')} {set.setNumber}
                      </span>
                      <span>
                        {/* v8 ignore start */}
                        {t('fitness.setFormat', { weight: set.weightKg, reps: set.reps ?? 0 })}
                        {/* v8 ignore stop */}
                      </span>
                      {set.rpe !== undefined && <span className="text-primary text-xs">RPE {set.rpe}</span>}
                      <span className="ml-auto flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingSet(set)}
                          className="focus-visible:ring-ring hover:text-foreground-secondary text-muted-foreground hover:bg-accent inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
                          aria-label={t('fitness.logger.editSet')}
                          data-testid={`edit-set-${set.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSet(set.id)}
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/50 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
                    onApply={s => handleApplySuggestion(exercise.id, s)}
                  />

                  <div
                    className="border-border-subtle mt-3 space-y-3 border-t pt-3"
                    data-testid={`set-editor-${exercise.id}`}
                  >
                    {exerciseSets.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLastSet(exercise.id)}
                        className="text-muted-foreground w-full gap-1.5"
                        data-testid={`copy-last-set-${exercise.id}`}
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('fitness.logger.copyLastSet')}
                      </Button>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16 text-xs">{t('fitness.logger.weight')}</span>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleWeightChange(exercise.id, -WEIGHT_INCREMENT)}
                        className="bg-muted text-foreground h-10 w-10"
                        data-testid={`weight-minus-${exercise.id}`}
                        aria-label={t('fitness.logger.decreaseWeight')}
                      >
                        −
                      </Button>
                      <Input
                        type="number"
                        autoComplete="off"
                        value={Number.isNaN(input.weight) ? '' : input.weight}
                        onChange={e => {
                          const raw = e.target.value;
                          const key: `setInputs.${string}` = `setInputs.${exercise.id}`;
                          /* v8 ignore start */
                          const cur = getValues(key) ?? { ...setInputDefaults };
                          /* v8 ignore stop */
                          setValue(key, {
                            ...cur,
                            weight: raw === '' ? Number.NaN : Math.max(0, Number(raw)),
                          });
                        }}
                        className="text-foreground w-20 text-center font-semibold"
                        data-testid={`weight-input-${exercise.id}`}
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleWeightChange(exercise.id, WEIGHT_INCREMENT)}
                        className="bg-muted text-foreground h-10 w-10"
                        data-testid={`weight-plus-${exercise.id}`}
                        aria-label={t('fitness.logger.increaseWeight')}
                      >
                        +
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16 text-xs">{t('fitness.logger.reps')}</span>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleRepsChange(exercise.id, -REPS_INCREMENT)}
                        className="bg-muted text-foreground h-10 w-10"
                        data-testid={`reps-minus-${exercise.id}`}
                        aria-label={t('fitness.logger.decreaseReps')}
                      >
                        −
                      </Button>
                      <Input
                        type="number"
                        autoComplete="off"
                        value={
                          Number.isNaN(input.reps) ? '' : (input.reps /* v8 ignore start */ ?? '') /* v8 ignore stop */
                        }
                        onChange={e => {
                          const raw = e.target.value;
                          const key: `setInputs.${string}` = `setInputs.${exercise.id}`;
                          /* v8 ignore start */
                          const cur = getValues(key) ?? { ...setInputDefaults };
                          /* v8 ignore stop */
                          setValue(key, { ...cur, reps: raw === '' ? Number.NaN : Math.max(0, Number(raw)) });
                        }}
                        className="text-foreground w-20 text-center font-semibold"
                        data-testid={`reps-input-${exercise.id}`}
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleRepsChange(exercise.id, REPS_INCREMENT)}
                        className="bg-muted text-foreground h-10 w-10"
                        data-testid={`reps-plus-${exercise.id}`}
                        aria-label={t('fitness.logger.increaseReps')}
                      >
                        +
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16 text-xs">{t('fitness.logger.rpe')}</span>
                      <div className="flex gap-1" data-testid={`rpe-selector-${exercise.id}`}>
                        {RPE_OPTIONS.map(rpe => (
                          <Button
                            key={rpe}
                            variant={input.rpe === rpe ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => handleRpeSelect(exercise.id, rpe)}
                            className={cn(
                              'h-9 w-9 rounded-full text-xs',
                              input.rpe === rpe
                                ? 'bg-primary text-primary-foreground hover:bg-primary'
                                : 'text-foreground-secondary bg-muted border-transparent',
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
                      className="bg-primary text-primary-foreground hover:bg-primary w-full py-2.5"
                      data-testid={`log-set-${exercise.id}`}
                    >
                      {t('fitness.logger.logSet')}
                    </Button>
                  </div>
                </section>

                {nextExercise && (
                  <div
                    data-testid={`transition-card-${exercise.id}`}
                    className="bg-muted flex items-center gap-3 rounded-lg px-4 py-2.5"
                  >
                    <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
                      {exerciseIndex + 2}
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {t('fitness.logger.nextUp')}:{' '}
                      <span className="text-foreground font-medium">{nextExercise.nameVi}</span>
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      <div
        className="pb-safe border-border-subtle bg-card/95 sticky bottom-0 border-t p-4 backdrop-blur-sm"
        data-testid="add-exercise-container"
      >
        <Button
          variant="outline"
          onClick={() => setShowExerciseSelector(true)}
          className="text-muted-foreground hover:border-primary hover:text-primary border-border w-full gap-2 rounded-xl border-2 border-dashed py-3"
          data-testid="add-exercise-button"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          {t('fitness.logger.addExercise')}
        </Button>
      </div>

      {showRestTimer && (
        <RestTimer durationSeconds={DEFAULT_REST_SECONDS} onComplete={handleRestComplete} onSkip={handleRestSkip} />
      )}

      <ExerciseSelector isOpen={showExerciseSelector} onClose={handleCloseSelector} onSelect={handleSelectExercise} />

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
