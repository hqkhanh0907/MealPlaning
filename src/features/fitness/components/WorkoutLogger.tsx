import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, X, Plus } from 'lucide-react';
import { RestTimer } from './RestTimer';
import { ExerciseSelector } from './ExerciseSelector';
import { useFitnessStore } from '../../../store/fitnessStore';
import { EXERCISES } from '../data/exerciseDatabase';
import { formatElapsed } from '../utils/timeFormat';
import { safeJsonParse } from '../utils/safeJsonParse';
import type { ExerciseSeed } from '../data/exerciseDatabase';
import type {
  Exercise,
  Workout,
  WorkoutSet,
  MuscleGroup,
  EquipmentType,
} from '../types';
import { DEFAULT_REST_SECONDS, RPE_OPTIONS, WEIGHT_INCREMENT } from '../constants';

interface WorkoutLoggerProps {
  planDay?: {
    dayOfWeek: number;
    workoutType: string;
    exercises?: string;
    muscleGroups?: string;
  };
  onComplete: (workout: Workout) => void;
  onBack: () => void;
}

interface SetInput {
  weight: number;
  reps?: number;
  rpe?: number;
}

const EMPTY_INPUT: SetInput = { weight: 0 };



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

function resolveExercises(exercisesJson?: string): Exercise[] {
  if (!exercisesJson) return [];
  const ids = safeJsonParse<string[]>(exercisesJson, []);
  return EXERCISES.filter((e) => ids.includes(e.id)).map(seedToExercise);
}

export function WorkoutLogger({
  planDay,
  onComplete,
  onBack,
}: WorkoutLoggerProps): React.JSX.Element {
  const { t } = useTranslation();
  const addWorkout = useFitnessStore((s) => s.addWorkout);
  const addWorkoutSet = useFitnessStore((s) => s.addWorkoutSet);
  const setWorkoutDraft = useFitnessStore((s) => s.setWorkoutDraft);
  const clearWorkoutDraft = useFitnessStore((s) => s.clearWorkoutDraft);

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
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    const draft = useFitnessStore.getState().workoutDraft;
    return draft ? draft.elapsedSeconds : 0;
  });
  const [setInputs, setSetInputs] = useState<Record<string, SetInput>>({});
  const elapsedRef = useRef(0);

  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

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
    (exerciseId: string): SetInput =>
      setInputs[exerciseId] ?? EMPTY_INPUT,
    [setInputs],
  );

  const updateInput = useCallback(
    (exerciseId: string, updates: Partial<SetInput>) => {
      setSetInputs((prev) => ({
        ...prev,
        [exerciseId]: {
          ...(prev[exerciseId] ?? EMPTY_INPUT),
          ...updates,
        },
      }));
    },
    [],
  );

  const handleLogSet = useCallback(
    (exerciseId: string) => {
      const input = setInputs[exerciseId] ?? EMPTY_INPUT;
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
    [setInputs],
  );

  const handleWeightChange = useCallback(
    (exerciseId: string, delta: number) => {
      setSetInputs((prev) => {
        const current = prev[exerciseId] ?? EMPTY_INPUT;
        return {
          ...prev,
          [exerciseId]: {
            ...current,
            weight: Math.max(0, current.weight + delta),
          },
        };
      });
    },
    [],
  );

  const handleRpeSelect = useCallback(
    (exerciseId: string, rpe: number) => {
      setSetInputs((prev) => {
        const current = prev[exerciseId] ?? EMPTY_INPUT;
        return {
          ...prev,
          [exerciseId]: {
            ...current,
            rpe: current.rpe === rpe ? undefined : rpe,
          },
        };
      });
    },
    [],
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

  const handleSave = useCallback(() => {
    const durationMin = Math.floor(elapsedSeconds / 60);
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
    addWorkout(workout);
    for (const set of loggedSets) {
      addWorkoutSet({ ...set, workoutId });
    }
    clearWorkoutDraft();
    onComplete(workout);
  }, [
    elapsedSeconds,
    loggedSets,
    addWorkout,
    addWorkoutSet,
    clearWorkoutDraft,
    onComplete,
    planDay?.workoutType,
    t,
  ]);

  if (showSummary) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900"
        data-testid="workout-summary"
      >
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <h2 className="mb-8 text-2xl font-bold text-slate-800 dark:text-slate-100">
            {t('fitness.logger.summary')}
          </h2>
          <div className="w-full max-w-sm space-y-4">
            <div
              className="flex justify-between"
              data-testid="summary-duration"
            >
              <span className="text-slate-500">
                {t('fitness.logger.duration')}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            <div
              className="flex justify-between"
              data-testid="summary-volume"
            >
              <span className="text-slate-500">
                {t('fitness.logger.totalVolume')}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {totalVolume} kg
              </span>
            </div>
            <div className="flex justify-between" data-testid="summary-sets">
              <span className="text-slate-500">
                {t('fitness.logger.setsCompleted')}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {loggedSets.length}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="mt-8 w-full max-w-sm rounded-xl bg-emerald-500 py-3 font-semibold text-white transition-colors hover:bg-emerald-600"
            data-testid="save-workout-button"
          >
            {t('fitness.logger.save')}
          </button>
        </div>
      </div>
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
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1 text-sm font-medium"
          data-testid="back-button"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{t('fitness.logger.back')}</span>
        </button>
        <span
          className="font-mono text-lg font-semibold tabular-nums"
          data-testid="elapsed-timer"
        >
          {formatElapsed(elapsedSeconds)}
        </span>
        <button
          type="button"
          onClick={handleFinish}
          className="flex items-center gap-1 text-sm font-medium"
          data-testid="finish-button"
        >
          <span>{t('fitness.logger.finish')}</span>
          <X className="h-5 w-5" />
        </button>
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
          currentExercises.map((exercise) => {
            const exerciseSets = loggedSets.filter(
              (s) => s.exerciseId === exercise.id,
            );
            const input = getInput(exercise.id);
            return (
              <section
                key={exercise.id}
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

                <div
                  className="mt-3 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-700"
                  data-testid={`set-editor-${exercise.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-xs text-slate-500">
                      {t('fitness.logger.weight')}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleWeightChange(exercise.id, -WEIGHT_INCREMENT)
                      }
                      className="h-10 w-10 rounded-lg bg-slate-100 font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      data-testid={`weight-minus-${exercise.id}`}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={input.weight}
                      onChange={(e) =>
                        updateInput(exercise.id, {
                          weight: Number(e.target.value),
                        })
                      }
                      className="w-20 rounded-lg border border-slate-200 bg-white py-2 text-center text-sm font-semibold text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      data-testid={`weight-input-${exercise.id}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleWeightChange(exercise.id, WEIGHT_INCREMENT)
                      }
                      className="h-10 w-10 rounded-lg bg-slate-100 font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      data-testid={`weight-plus-${exercise.id}`}
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-16 text-xs text-slate-500">
                      {t('fitness.logger.reps')}
                    </span>
                    <input
                      type="number"
                      value={input.reps ?? 0}
                      onChange={(e) =>
                        updateInput(exercise.id, {
                          reps: Math.max(0, Number(e.target.value)),
                        })
                      }
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
                        <button
                          key={rpe}
                          type="button"
                          onClick={() => handleRpeSelect(exercise.id, rpe)}
                          className={`h-9 w-9 rounded-full text-xs font-semibold transition-colors ${
                            input.rpe === rpe
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                          data-testid={`rpe-${rpe}-${exercise.id}`}
                        >
                          {rpe}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLogSet(exercise.id)}
                    className="w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                    data-testid={`log-set-${exercise.id}`}
                  >
                    {t('fitness.logger.logSet')}
                  </button>
                </div>
              </section>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setShowExerciseSelector(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-emerald-500 hover:text-emerald-500 dark:border-slate-600 dark:text-slate-400"
          data-testid="add-exercise-button"
        >
          <Plus className="h-5 w-5" />
          {t('fitness.logger.addExercise')}
        </button>
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
