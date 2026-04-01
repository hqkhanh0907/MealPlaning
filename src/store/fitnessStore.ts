import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DatabaseService } from '../services/databaseService';
import { EXERCISES } from '../features/fitness/data/exerciseDatabase';
import { BUILTIN_TEMPLATES } from '../features/fitness/data/builtinTemplates';
import { computeMatchScore } from '../features/fitness/utils/templateMatcher';
import { remapExercisesToNewSplit } from '../features/fitness/utils/splitRemapper';
import type {
  TrainingProfile,
  TrainingPlan,
  TrainingPlanDay,
  Workout,
  WorkoutSet,
  WeightEntry,
  Exercise,
  CardioIntensity,
  SelectedExercise,
  PlanTemplate,
  SplitType,
  SplitChangePreview,
  MuscleGroup,
} from '../features/fitness/types';
import { safeParseJsonArray } from '../features/fitness/types';

let _db: DatabaseService | null = null;

export interface FitnessState {
  trainingProfile: TrainingProfile | null;
  trainingPlans: TrainingPlan[];
  trainingPlanDays: TrainingPlanDay[];
  workouts: Workout[];
  workoutSets: WorkoutSet[];
  weightEntries: WeightEntry[];
  isOnboarded: boolean;
  workoutMode: 'strength' | 'cardio';
  workoutDraft: {
    exercises: Exercise[];
    sets: WorkoutSet[];
    elapsedSeconds: number;
    planDayId?: string;
  } | null;
  planStrategy: 'auto' | 'manual' | null;
  sqliteReady: boolean;
  showPlanCelebration: boolean;

  setPlanStrategy: (strategy: 'auto' | 'manual' | null) => void;
  clearTrainingPlans: () => void;
  setTrainingProfile: (profile: TrainingProfile) => void;
  addTrainingPlan: (plan: TrainingPlan) => void;
  updateTrainingPlan: (id: string, updates: Partial<TrainingPlan>) => void;
  setActivePlan: (planId: string) => void;
  addPlanDays: (days: TrainingPlanDay[]) => void;
  getPlanDays: (planId: string) => TrainingPlanDay[];
  updatePlanDayExercises: (dayId: string, exercises: SelectedExercise[]) => void;
  restorePlanDayOriginal: (dayId: string) => void;
  addPlanDaySession: (planId: string, dayOfWeek: number, session: Omit<TrainingPlanDay, 'id'>) => void;
  removePlanDaySession: (dayId: string) => void;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (id: string, updates: Partial<Workout>) => void;
  deleteWorkout: (id: string) => Promise<void>;
  addWorkoutSet: (workoutSet: WorkoutSet) => void;
  saveWorkoutAtomic: (workout: Workout, sets: WorkoutSet[]) => Promise<void>;
  updateWorkoutSet: (id: string, updates: Partial<WorkoutSet>) => void;
  removeWorkoutSet: (id: string) => void;
  getWorkoutSets: (workoutId: string) => WorkoutSet[];
  addWeightEntry: (entry: WeightEntry) => void;
  updateWeightEntry: (id: string, updates: Partial<WeightEntry>) => void;
  removeWeightEntry: (id: string) => void;
  setOnboarded: (value: boolean) => void;
  setWorkoutMode: (mode: 'strength' | 'cardio') => void;
  setWorkoutDraft: (draft: FitnessState['workoutDraft']) => void;
  clearWorkoutDraft: () => void;
  loadWorkoutDraft: () => Promise<void>;
  getActivePlan: () => TrainingPlan | undefined;
  getLatestWeight: () => WeightEntry | undefined;
  getWorkoutsByDateRange: (startDate: string, endDate: string) => Workout[];
  updateTrainingDays: (planId: string, trainingDays: number[]) => void;
  reassignWorkoutToDay: (dayId: string, newDayOfWeek: number) => void;
  autoAssignWorkouts: (planId: string) => void;
  restoreOriginalSchedule: (planId: string) => void;
  initializeFromSQLite: (db: DatabaseService) => Promise<void>;
  dismissPlanCelebration: () => void;
  changeSplitType: (planId: string, newSplit: SplitType, mode: 'regenerate' | 'remap') => void;
  previewSplitChange: (planId: string, newSplit: SplitType) => SplitChangePreview;
  getTemplates: () => PlanTemplate[];
  getRecommendedTemplates: (profile: TrainingProfile) => PlanTemplate[];
  applyTemplate: (planId: string, templateId: string) => void;
  saveCurrentAsTemplate: (planId: string, name: string) => void;
}

export const useFitnessStore = create<FitnessState>()(
  persist(
    (set, get) => ({
      trainingProfile: null,
      trainingPlans: [],
      trainingPlanDays: [],
      workouts: [],
      workoutSets: [],
      weightEntries: [],
      isOnboarded: false,
      workoutMode: 'strength',
      workoutDraft: null,
      planStrategy: null,
      sqliteReady: false,
      showPlanCelebration: false,

      setPlanStrategy: (strategy) => set({ planStrategy: strategy }),

      clearTrainingPlans: () => set({ trainingPlans: [], trainingPlanDays: [] }),

      setTrainingProfile: (profile) => set({ trainingProfile: profile }),

      addTrainingPlan: (plan) =>
        set((state) => ({ trainingPlans: [...state.trainingPlans, plan] })),

      updateTrainingPlan: (id, updates) =>
        set((state) => ({
          trainingPlans: state.trainingPlans.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),

      setActivePlan: (planId) =>
        set((state) => ({
          trainingPlans: state.trainingPlans.map((p) =>
            p.id === planId
              ? { ...p, status: 'active' as const }
              : p.status === 'active'
                ? { ...p, status: 'paused' as const }
                : p,
          ),
        })),

      addPlanDays: (days) => {
        set((state) => ({
          trainingPlanDays: [...state.trainingPlanDays, ...days],
        }));
        if (_db) {
          for (const day of days) {
            _db.execute(
              `INSERT INTO training_plan_days (id, plan_id, day_of_week, session_order, workout_type, muscle_groups, exercises, original_exercises, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [day.id, day.planId, day.dayOfWeek, day.sessionOrder ?? 1, day.workoutType,
               day.muscleGroups ?? null, day.exercises ?? null, day.originalExercises ?? null, day.notes ?? null],
            ).catch((error: unknown) => {
              console.error('[fitnessStore] SQLite addPlanDays write failed:', error);
            });
          }
        }
      },

      getPlanDays: (planId) =>
        get().trainingPlanDays.filter((d) => d.planId === planId),

      updatePlanDayExercises: (dayId, exercises) => {
        set((state) => ({
          trainingPlanDays: state.trainingPlanDays.map((d) =>
            d.id === dayId ? { ...d, exercises: JSON.stringify(exercises) } : d,
          ),
        }));
        if (_db) {
          _db.execute('UPDATE training_plan_days SET exercises = ? WHERE id = ?', [
            JSON.stringify(exercises),
            dayId,
          ]).catch((error: unknown) => {
            console.error('[fitnessStore] SQLite updatePlanDayExercises failed:', error);
          });
        }
      },

      restorePlanDayOriginal: (dayId) => {
        set((state) => ({
          trainingPlanDays: state.trainingPlanDays.map((d) =>
            d.id === dayId ? { ...d, exercises: d.originalExercises ?? d.exercises } : d,
          ),
        }));
        if (_db) {
          _db.execute(
            'UPDATE training_plan_days SET exercises = original_exercises WHERE id = ?',
            [dayId],
          ).catch((error: unknown) => {
            console.error('[fitnessStore] SQLite restorePlanDayOriginal failed:', error);
          });
        }
      },

      addPlanDaySession: (planId, dayOfWeek, session) => {
        const existing = get().trainingPlanDays.filter(
          (d) => d.planId === planId && d.dayOfWeek === dayOfWeek,
        );
        if (existing.length >= 3) return;

        const newDay: TrainingPlanDay = {
          ...session,
          id: `${planId}_day_${String(dayOfWeek)}_s${String(existing.length + 1)}_${String(Date.now())}`,
        };
        set((state) => ({
          trainingPlanDays: [...state.trainingPlanDays, newDay],
        }));
        if (_db) {
          _db.execute(
            `INSERT INTO training_plan_days (id, plan_id, day_of_week, session_order, workout_type, muscle_groups, exercises, original_exercises, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newDay.id, newDay.planId, newDay.dayOfWeek, newDay.sessionOrder, newDay.workoutType,
             newDay.muscleGroups ?? null, newDay.exercises ?? null, newDay.originalExercises ?? null, newDay.notes ?? null],
          ).catch((error: unknown) => {
            console.error('[fitnessStore] SQLite addPlanDaySession failed:', error);
          });
        }
      },

      removePlanDaySession: (dayId) => {
        const dayToRemove = get().trainingPlanDays.find((d) => d.id === dayId);
        if (!dayToRemove) return;

        set((state) => {
          const remaining = state.trainingPlanDays.filter((d) => d.id !== dayId);
          let order = 1;
          const reordered = remaining.map((d) => {
            if (d.planId === dayToRemove.planId && d.dayOfWeek === dayToRemove.dayOfWeek) {
              return { ...d, sessionOrder: order++ };
            }
            return d;
          });
          return { trainingPlanDays: reordered };
        });

        if (_db) {
          _db.execute('DELETE FROM training_plan_days WHERE id = ?', [dayId]).catch((error: unknown) => {
            console.error('[fitnessStore] SQLite removePlanDaySession delete failed:', error);
          });
          const remaining = get().trainingPlanDays
            .filter((d) => d.planId === dayToRemove.planId && d.dayOfWeek === dayToRemove.dayOfWeek)
            .sort((a, b) => a.sessionOrder - b.sessionOrder);
          for (const d of remaining) {
            _db.execute('UPDATE training_plan_days SET session_order = ? WHERE id = ?', [d.sessionOrder, d.id]).catch((error: unknown) => {
              console.error('[fitnessStore] SQLite removePlanDaySession reorder failed:', error);
            });
          }
        }
      },

      addWorkout: (workout) => {
        set((state) => ({ workouts: [...state.workouts, workout] }));
        if (_db) {
          _db
            .execute(
              `INSERT INTO workouts (id, date, name, plan_day_id, duration_min, notes, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                workout.id,
                workout.date,
                workout.name,
                workout.planDayId ?? null,
                workout.durationMin ?? null,
                workout.notes ?? null,
                workout.createdAt,
                workout.updatedAt,
              ],
            )
            .catch((error: unknown) => {
              console.error('[fitnessStore] SQLite write failed for workout:', error);
            });
        }
      },

      updateWorkout: (id, updates) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id === id ? { ...w, ...updates } : w,
          ),
        })),

      deleteWorkout: async (id) => {
        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== id),
          workoutSets: state.workoutSets.filter((s) => s.workoutId !== id),
        }));
        if (_db) {
          try {
            await _db.execute('DELETE FROM workout_sets WHERE workout_id = ?', [id]);
            await _db.execute('DELETE FROM workouts WHERE id = ?', [id]);
          } catch (error: unknown) {
            console.error('[fitnessStore] SQLite delete failed for workout:', error);
          }
        }
      },

      addWorkoutSet: (workoutSet) => {
        set((state) => ({
          workoutSets: [...state.workoutSets, workoutSet],
        }));
        if (_db) {
          _db
            .execute(
              `INSERT INTO workout_sets
                 (id, workout_id, exercise_id, set_number, reps, weight_kg, rpe, rest_seconds,
                  duration_min, distance_km, avg_heart_rate, intensity, estimated_calories, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                workoutSet.id,
                workoutSet.workoutId,
                workoutSet.exerciseId,
                workoutSet.setNumber,
                workoutSet.reps ?? null,
                workoutSet.weightKg,
                workoutSet.rpe ?? null,
                workoutSet.restSeconds ?? null,
                workoutSet.durationMin ?? null,
                workoutSet.distanceKm ?? null,
                workoutSet.avgHeartRate ?? null,
                workoutSet.intensity ?? null,
                workoutSet.estimatedCalories ?? null,
                workoutSet.updatedAt,
              ],
            )
            .catch((error: unknown) => {
              console.error('[fitnessStore] SQLite write failed for workoutSet:', error);
            });
        }
      },

      saveWorkoutAtomic: async (workout, sets) => {
        if (_db) {
          await _db.transaction(async () => {
            await _db!.execute(
              `INSERT INTO workouts (id, date, name, plan_day_id, duration_min, notes, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                workout.id,
                workout.date,
                workout.name,
                workout.planDayId ?? null,
                workout.durationMin ?? null,
                workout.notes ?? null,
                workout.createdAt,
                workout.updatedAt,
              ],
            );
            for (const s of sets) {
              const seed = EXERCISES.find((e) => e.id === s.exerciseId);
              if (seed) {
                await _db!.execute(
                  `INSERT OR IGNORE INTO exercises
                     (id, name_vi, name_en, muscle_group, secondary_muscles, category,
                      equipment, contraindicated, exercise_type,
                      default_reps_min, default_reps_max, is_custom, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
                  [
                    seed.id,
                    seed.nameVi,
                    seed.nameEn,
                    seed.muscleGroup,
                    JSON.stringify(seed.secondaryMuscles),
                    seed.category,
                    JSON.stringify(seed.equipment),
                    JSON.stringify(seed.contraindicated),
                    seed.exerciseType,
                    seed.defaultRepsMin,
                    seed.defaultRepsMax,
                    new Date().toISOString(),
                  ],
                );
              }
              await _db!.execute(
                `INSERT INTO workout_sets
                   (id, workout_id, exercise_id, set_number, reps, weight_kg, rpe, rest_seconds,
                    duration_min, distance_km, avg_heart_rate, intensity, estimated_calories, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  s.id,
                  s.workoutId,
                  s.exerciseId,
                  s.setNumber,
                  s.reps ?? null,
                  s.weightKg,
                  s.rpe ?? null,
                  s.restSeconds ?? null,
                  s.durationMin ?? null,
                  s.distanceKm ?? null,
                  s.avgHeartRate ?? null,
                  s.intensity ?? null,
                  s.estimatedCalories ?? null,
                  s.updatedAt,
                ],
              );
            }
          });
        }
        set((state) => ({
          workouts: [...state.workouts, workout],
          workoutSets: [...state.workoutSets, ...sets],
        }));
      },

      updateWorkoutSet: (id, updates) =>
        set((state) => ({
          workoutSets: state.workoutSets.map((s) =>
            s.id === id ? { ...s, ...updates } : s,
          ),
        })),

      removeWorkoutSet: (id) =>
        set((state) => ({
          workoutSets: state.workoutSets.filter((s) => s.id !== id),
        })),

      getWorkoutSets: (workoutId) =>
        get().workoutSets.filter((s) => s.workoutId === workoutId),

      addWeightEntry: (entry) =>
        set((state) => ({
          weightEntries: [...state.weightEntries, entry],
        })),

      updateWeightEntry: (id, updates) =>
        set((state) => ({
          weightEntries: state.weightEntries.map((e) =>
            e.id === id ? { ...e, ...updates } : e,
          ),
        })),

      removeWeightEntry: (id) =>
        set((state) => ({
          weightEntries: state.weightEntries.filter((e) => e.id !== id),
        })),

      setOnboarded: (value) => set({ isOnboarded: value }),

      dismissPlanCelebration: () => set({ showPlanCelebration: false }),

      setWorkoutMode: (mode) => set({ workoutMode: mode }),

      setWorkoutDraft: (draft) => {
        set({ workoutDraft: draft });
        if (_db && draft) {
          _db
            .execute(
              `INSERT OR REPLACE INTO workout_drafts (id, exercises_json, sets_json, start_time, updated_at)
               VALUES ('current', ?, ?, ?, ?)`,
              [
                JSON.stringify(draft.exercises),
                JSON.stringify(draft.sets),
                new Date().toISOString(),
                new Date().toISOString(),
              ],
            )
            .catch((error: unknown) => {
              console.error('[fitnessStore] SQLite write failed for workout draft:', error);
            });
        }
      },

      clearWorkoutDraft: () => {
        set({ workoutDraft: null });
        if (_db) {
          _db
            .execute(`DELETE FROM workout_drafts WHERE id = 'current'`)
            .catch((error: unknown) => {
              console.error('[fitnessStore] SQLite delete failed for workout draft:', error);
            });
        }
      },

      loadWorkoutDraft: async () => {
        if (!_db) return;
        try {
          const rows = await _db.query<Record<string, unknown>>(
            `SELECT * FROM workout_drafts WHERE id = 'current'`,
          );
          if (rows.length > 0) {
            const row = rows[0];
            set({
              workoutDraft: {
                exercises: JSON.parse(row.exercisesJson as string) as Exercise[],
                sets: JSON.parse(row.setsJson as string) as WorkoutSet[],
                elapsedSeconds: 0,
              },
            });
          }
        } catch (error) {
          console.warn('[fitnessStore] Failed to load workout draft from SQLite:', error);
        }
      },

      getActivePlan: () =>
        get().trainingPlans.find((p) => p.status === 'active'),

      getLatestWeight: () => {
        const entries = get().weightEntries;
        if (entries.length === 0) return undefined;
        return [...entries].sort((a, b) =>
          b.date.localeCompare(a.date),
        )[0];
      },

      getWorkoutsByDateRange: (startDate, endDate) =>
        get().workouts.filter(
          (w) => w.date >= startDate && w.date <= endDate,
        ),

      updateTrainingDays: (planId, trainingDays) => {
        if (trainingDays.length < 2 || trainingDays.length > 6) {
          console.error('[fitnessStore] updateTrainingDays: training days must be between 2 and 6');
          return;
        }

        const allDays = [1, 2, 3, 4, 5, 6, 7];
        const restDays = allDays.filter((d) => !trainingDays.includes(d));

        const plan = get().trainingPlans.find((p) => p.id === planId);
        if (!plan) {
          console.error('[fitnessStore] updateTrainingDays: plan not found');
          return;
        }

        const removedDays = plan.trainingDays.filter((d) => !trainingDays.includes(d));
        const planDays = get().trainingPlanDays.filter((d) => d.planId === planId);
        const orphanedSessions = planDays.filter((d) => removedDays.includes(d.dayOfWeek));

        const reassignedSessions = orphanedSessions.map((session) => {
          const sorted = [...trainingDays].sort(
            (a, b) => Math.abs(a - session.dayOfWeek) - Math.abs(b - session.dayOfWeek),
          );
          return { ...session, dayOfWeek: sorted[0], isUserAssigned: false };
        });

        set((state) => ({
          trainingPlans: state.trainingPlans.map((p) =>
            p.id === planId
              ? { ...p, trainingDays: [...trainingDays], restDays: [...restDays], updatedAt: new Date().toISOString() }
              : p,
          ),
          trainingPlanDays: state.trainingPlanDays.map((d) => {
            if (d.planId !== planId) return d;
            const reassigned = reassignedSessions.find((r) => r.id === d.id);
            if (reassigned) return reassigned;
            return d;
          }),
        }));

        if (_db) {
          _db.execute(
            'UPDATE training_plans SET training_days = ?, rest_days = ?, updated_at = ? WHERE id = ?',
            [JSON.stringify(trainingDays), JSON.stringify(restDays), new Date().toISOString(), planId],
          ).catch((error: unknown) => {
            console.error('[fitnessStore] SQLite updateTrainingDays plan update failed:', error);
          });
          for (const session of reassignedSessions) {
            _db.execute(
              'UPDATE training_plan_days SET day_of_week = ?, is_user_assigned = 0 WHERE id = ?',
              [session.dayOfWeek, session.id],
            ).catch((error: unknown) => {
              console.error('[fitnessStore] SQLite updateTrainingDays reassign failed:', error);
            });
          }
        }
      },

      reassignWorkoutToDay: (dayId, newDayOfWeek) => {
        const day = get().trainingPlanDays.find((d) => d.id === dayId);
        if (!day) {
          console.error('[fitnessStore] reassignWorkoutToDay: day not found');
          return;
        }

        const plan = get().trainingPlans.find((p) => p.id === day.planId);
        if (!plan) {
          console.error('[fitnessStore] reassignWorkoutToDay: plan not found');
          return;
        }

        if (!plan.trainingDays.includes(newDayOfWeek)) {
          console.error('[fitnessStore] reassignWorkoutToDay: target day is not a training day');
          return;
        }

        const sessionsOnTarget = get().trainingPlanDays.filter(
          (d) => d.planId === day.planId && d.dayOfWeek === newDayOfWeek,
        );
        if (sessionsOnTarget.length >= 3) {
          console.error('[fitnessStore] reassignWorkoutToDay: target day already has 3 sessions');
          return;
        }

        set((state) => ({
          trainingPlanDays: state.trainingPlanDays.map((d) =>
            d.id === dayId ? { ...d, dayOfWeek: newDayOfWeek, isUserAssigned: true } : d,
          ),
        }));

        if (_db) {
          _db.execute(
            'UPDATE training_plan_days SET day_of_week = ?, is_user_assigned = 1 WHERE id = ?',
            [newDayOfWeek, dayId],
          ).catch((error: unknown) => {
            console.error('[fitnessStore] SQLite reassignWorkoutToDay failed:', error);
          });
        }
      },

      autoAssignWorkouts: (planId) => {
        const plan = get().trainingPlans.find((p) => p.id === planId);
        if (!plan) {
          console.error('[fitnessStore] autoAssignWorkouts: plan not found');
          return;
        }

        const planDays = get().trainingPlanDays.filter((d) => d.planId === planId);
        if (planDays.length === 0) return;

        const sortedTrainingDays = [...plan.trainingDays].sort((a, b) => a - b);
        if (sortedTrainingDays.length === 0) return;

        const sortedPlanDays = [...planDays].sort((a, b) => {
          const primaryA = (a.muscleGroups ?? '').split(',')[0].trim().toLowerCase();
          const primaryB = (b.muscleGroups ?? '').split(',')[0].trim().toLowerCase();
          if (primaryA < primaryB) return -1;
          if (primaryA > primaryB) return 1;
          return 0;
        });

        const assigned: Array<{ id: string; dayOfWeek: number }> = [];
        const daySlots = new Map<number, string[]>();
        for (const td of sortedTrainingDays) {
          daySlots.set(td, []);
        }

        for (const pd of sortedPlanDays) {
          const primaryMuscle = (pd.muscleGroups ?? '').split(',')[0].trim().toLowerCase();

          let bestDay = sortedTrainingDays[0];
          let bestScore = -Infinity;

          for (const td of sortedTrainingDays) {
            const slotsUsed = daySlots.get(td)?.length ?? 0;
            let score = -slotsUsed * 100;

            const assignedToAdjacentDays = assigned.filter((a) => {
              const diff = Math.abs(a.dayOfWeek - td);
              return diff === 1 || diff === 6;
            });

            const hasSameMuscleAdjacent = assignedToAdjacentDays.some((a) => {
              const existingDay = sortedPlanDays.find((d) => d.id === a.id);
              const existingMuscle = (existingDay?.muscleGroups ?? '').split(',')[0].trim().toLowerCase();
              return existingMuscle === primaryMuscle && primaryMuscle !== '';
            });

            if (hasSameMuscleAdjacent) {
              score -= 20;
            }

            if (score > bestScore) {
              bestScore = score;
              bestDay = td;
            }
          }

          assigned.push({ id: pd.id, dayOfWeek: bestDay });
          daySlots.get(bestDay)?.push(pd.id);
        }

        const assignmentMap = new Map(assigned.map((a) => [a.id, a.dayOfWeek]));

        set((state) => ({
          trainingPlanDays: state.trainingPlanDays.map((d) => {
            if (d.planId !== planId) return d;
            const newDay = assignmentMap.get(d.id);
            if (newDay === undefined) return d;
            return { ...d, dayOfWeek: newDay, isUserAssigned: false };
          }),
        }));

        if (_db) {
          for (const a of assigned) {
            _db.execute(
              'UPDATE training_plan_days SET day_of_week = ?, is_user_assigned = 0 WHERE id = ?',
              [a.dayOfWeek, a.id],
            ).catch((error: unknown) => {
              console.error('[fitnessStore] SQLite autoAssignWorkouts failed:', error);
            });
          }
        }
      },

      restoreOriginalSchedule: (planId) => {
        const plan = get().trainingPlans.find((p) => p.id === planId);
        if (!plan) {
          console.error('[fitnessStore] restoreOriginalSchedule: plan not found');
          return;
        }

        const planDays = get().trainingPlanDays.filter((d) => d.planId === planId);
        if (planDays.length === 0) return;

        const restoredDays = planDays.map((d) => ({
          ...d,
          dayOfWeek: d.originalDayOfWeek,
          isUserAssigned: false,
        }));

        const allDays = [1, 2, 3, 4, 5, 6, 7];
        const usedDays = [...new Set(restoredDays.map((d) => d.dayOfWeek))];
        const newTrainingDays = allDays.filter((d) => usedDays.includes(d));
        const newRestDays = allDays.filter((d) => !usedDays.includes(d));

        set((state) => ({
          trainingPlans: state.trainingPlans.map((p) =>
            p.id === planId
              ? { ...p, trainingDays: newTrainingDays, restDays: newRestDays, updatedAt: new Date().toISOString() }
              : p,
          ),
          trainingPlanDays: state.trainingPlanDays.map((d) => {
            if (d.planId !== planId) return d;
            const restored = restoredDays.find((r) => r.id === d.id);
            return restored ?? d;
          }),
        }));

        if (_db) {
          _db.execute(
            'UPDATE training_plans SET training_days = ?, rest_days = ?, updated_at = ? WHERE id = ?',
            [JSON.stringify(newTrainingDays), JSON.stringify(newRestDays), new Date().toISOString(), planId],
          ).catch((error: unknown) => {
            console.error('[fitnessStore] SQLite restoreOriginalSchedule plan update failed:', error);
          });
          for (const d of restoredDays) {
            _db.execute(
              'UPDATE training_plan_days SET day_of_week = ?, is_user_assigned = 0 WHERE id = ?',
              [d.dayOfWeek, d.id],
            ).catch((error: unknown) => {
              console.error('[fitnessStore] SQLite restoreOriginalSchedule day update failed:', error);
            });
          }
        }
      },

      initializeFromSQLite: async (db) => {
        _db = db;
        try {
          const workouts = await db.query<Record<string, unknown>>(
            'SELECT * FROM workouts ORDER BY date DESC',
          );
          if (workouts.length > 0) {
            set({
              workouts: workouts.map((w) => ({
                id: w.id as string,
                date: w.date as string,
                name: w.name as string,
                planDayId: w.planDayId as string | undefined,
                durationMin: w.durationMin as number | undefined,
                notes: w.notes as string | undefined,
                createdAt: w.createdAt as string,
                updatedAt: w.updatedAt as string,
              })),
            });
          }

          const sets = await db.query<Record<string, unknown>>(
            'SELECT * FROM workout_sets',
          );
          if (sets.length > 0) {
            set({
              workoutSets: sets.map((s) => ({
                id: s.id as string,
                workoutId: s.workoutId as string,
                exerciseId: s.exerciseId as string,
                setNumber: s.setNumber as number,
                reps: s.reps as number | undefined,
                weightKg: (s.weightKg as number | undefined) ?? 0,
                rpe: s.rpe as number | undefined,
                restSeconds: s.restSeconds as number | undefined,
                durationMin: s.durationMin as number | undefined,
                distanceKm: s.distanceKm as number | undefined,
                avgHeartRate: s.avgHeartRate as number | undefined,
                intensity: s.intensity as CardioIntensity | undefined,
                estimatedCalories: s.estimatedCalories as number | undefined,
                updatedAt: s.updatedAt as string,
              })),
            });
          }

          const weightEntries = await db.query<Record<string, unknown>>(
            'SELECT * FROM weight_log ORDER BY date DESC',
          );
          if (weightEntries.length > 0) {
            set({
              weightEntries: weightEntries.map((w) => ({
                id: w.id as string,
                date: w.date as string,
                weightKg: w.weightKg as number,
                notes: w.notes as string | undefined,
                createdAt: w.createdAt as string,
                updatedAt: w.updatedAt as string,
              })),
            });
          }

          set({ sqliteReady: true });
        } catch (error) {
          console.warn(
            '[fitnessStore] SQLite load failed:',
            error,
          );
        }
      },

      changeSplitType: (planId, newSplit, mode) => {
        const plan = get().trainingPlans.find((p) => p.id === planId);
        if (!plan) return;

        const currentDays = get().trainingPlanDays.filter((d) => d.planId === planId);
        const now = new Date().toISOString();

        if (mode === 'regenerate') {
          const daysPerWeek = plan.trainingDays.length;
          const preview = remapExercisesToNewSplit([], newSplit, daysPerWeek);
          const newDays: TrainingPlanDay[] = preview.suggested.map((s, i) => ({
            id: `${planId}_split_${String(i)}_${String(Date.now())}`,
            planId,
            dayOfWeek: plan.trainingDays[i] ?? i,
            sessionOrder: 1,
            workoutType: s.day,
            muscleGroups: s.muscleGroups.join(','),
            exercises: '[]',
            originalExercises: '[]',
            isUserAssigned: false,
            originalDayOfWeek: plan.trainingDays[i] ?? i,
            notes: s.day,
          }));

          set((state) => ({
            trainingPlans: state.trainingPlans.map((p) =>
              p.id === planId ? { ...p, splitType: newSplit, updatedAt: now } : p,
            ),
            trainingPlanDays: [
              ...state.trainingPlanDays.filter((d) => d.planId !== planId),
              ...newDays,
            ],
          }));

          if (_db) {
            _db.execute('UPDATE training_plans SET split_type = ?, updated_at = ? WHERE id = ?',
              [newSplit, now, planId],
            ).catch((error: unknown) => {
              console.error('[fitnessStore] SQLite changeSplitType plan update failed:', error);
            });
            _db.execute('DELETE FROM training_plan_days WHERE plan_id = ?', [planId]).catch((error: unknown) => {
              console.error('[fitnessStore] SQLite changeSplitType delete old days failed:', error);
            });
            for (const day of newDays) {
              _db.execute(
                `INSERT INTO training_plan_days (id, plan_id, day_of_week, session_order, workout_type, muscle_groups, exercises, original_exercises, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [day.id, day.planId, day.dayOfWeek, day.sessionOrder, day.workoutType,
                 day.muscleGroups ?? null, day.exercises ?? null, day.originalExercises ?? null, day.notes ?? null],
              ).catch((error: unknown) => {
                console.error('[fitnessStore] SQLite changeSplitType insert day failed:', error);
              });
            }
          }
        } else {
          const preview = remapExercisesToNewSplit(currentDays, newSplit, plan.trainingDays.length);

          const updatedDays: TrainingPlanDay[] = preview.mapped.map((m) => ({
            ...m.from,
            workoutType: m.toDay,
            muscleGroups: m.toMuscleGroups.join(','),
            notes: m.toDay,
          }));

          const newSuggestedDays: TrainingPlanDay[] = preview.suggested.map((s, i) => ({
            id: `${planId}_remap_${String(i)}_${String(Date.now())}`,
            planId,
            dayOfWeek: plan.trainingDays[updatedDays.length + i] ?? (updatedDays.length + i),
            sessionOrder: 1,
            workoutType: s.day,
            muscleGroups: s.muscleGroups.join(','),
            exercises: '[]',
            originalExercises: '[]',
            isUserAssigned: false,
            originalDayOfWeek: plan.trainingDays[updatedDays.length + i] ?? (updatedDays.length + i),
            notes: s.day,
          }));

          const allNewDays = [...updatedDays, ...newSuggestedDays];

          set((state) => ({
            trainingPlans: state.trainingPlans.map((p) =>
              p.id === planId ? { ...p, splitType: newSplit, updatedAt: now } : p,
            ),
            trainingPlanDays: [
              ...state.trainingPlanDays.filter((d) => d.planId !== planId),
              ...allNewDays,
            ],
          }));

          if (_db) {
            _db.execute('UPDATE training_plans SET split_type = ?, updated_at = ? WHERE id = ?',
              [newSplit, now, planId],
            ).catch((error: unknown) => {
              console.error('[fitnessStore] SQLite changeSplitType remap plan update failed:', error);
            });
            _db.execute('DELETE FROM training_plan_days WHERE plan_id = ?', [planId]).catch((error: unknown) => {
              console.error('[fitnessStore] SQLite changeSplitType remap delete old days failed:', error);
            });
            for (const day of allNewDays) {
              _db.execute(
                `INSERT INTO training_plan_days (id, plan_id, day_of_week, session_order, workout_type, muscle_groups, exercises, original_exercises, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [day.id, day.planId, day.dayOfWeek, day.sessionOrder, day.workoutType,
                 day.muscleGroups ?? null, day.exercises ?? null, day.originalExercises ?? null, day.notes ?? null],
              ).catch((error: unknown) => {
                console.error('[fitnessStore] SQLite changeSplitType remap insert day failed:', error);
              });
            }
          }
        }
      },

      previewSplitChange: (planId, newSplit) => {
        const plan = get().trainingPlans.find((p) => p.id === planId);
        if (!plan) return { mapped: [], suggested: [], unmapped: [] };

        const currentDays = get().trainingPlanDays.filter((d) => d.planId === planId);
        return remapExercisesToNewSplit(currentDays, newSplit, plan.trainingDays.length);
      },

      getTemplates: () => {
        const builtins = [...BUILTIN_TEMPLATES];
        if (!_db) return builtins;

        try {
          const rows: Record<string, unknown>[] = [];
          _db.query<Record<string, unknown>>(
            'SELECT * FROM plan_templates WHERE is_builtin = 0',
          ).then((result) => {
            rows.push(...result);
          }).catch((error: unknown) => {
            console.error('[fitnessStore] SQLite getTemplates query failed:', error);
          });

          const userTemplates: PlanTemplate[] = rows.map((row) => ({
            id: row.id as string,
            name: row.name as string,
            splitType: row.splitType as SplitType,
            daysPerWeek: row.daysPerWeek as number,
            experienceLevel: (row.experienceLevel as PlanTemplate['experienceLevel']) ?? 'all',
            trainingGoal: (row.trainingGoal as PlanTemplate['trainingGoal']) ?? 'general',
            equipmentRequired: safeParseJsonArray<PlanTemplate['equipmentRequired'][number]>(
              row.equipmentRequired as string,
            ),
            description: (row.description as string) ?? '',
            dayConfigs: safeParseJsonArray<PlanTemplate['dayConfigs'][number]>(
              row.dayConfigs as string,
            ),
            popularityScore: (row.popularityScore as number) ?? 0,
            isBuiltin: false,
            createdAt: row.createdAt as string | undefined,
            updatedAt: row.updatedAt as string | undefined,
          }));

          return [...builtins, ...userTemplates];
        } catch (error: unknown) {
          console.error('[fitnessStore] getTemplates failed:', error);
          return builtins;
        }
      },

      getRecommendedTemplates: (profile) => {
        const templates = get().getTemplates();
        const scored = templates.map((t) => ({
          template: t,
          score: computeMatchScore(t, profile),
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 3).map((s) => s.template);
      },

      applyTemplate: (planId, templateId) => {
        const allTemplates = get().getTemplates();
        const template = allTemplates.find((t) => t.id === templateId);
        if (!template) return;

        const plan = get().trainingPlans.find((p) => p.id === planId);
        if (!plan) return;

        const now = new Date().toISOString();
        const trainingDays = plan.trainingDays.length >= template.daysPerWeek
          ? plan.trainingDays.slice(0, template.daysPerWeek)
          : Array.from({ length: template.daysPerWeek }, (_, i) => plan.trainingDays[i] ?? i);

        const newDays: TrainingPlanDay[] = template.dayConfigs.map((config, i) => ({
          id: `${planId}_tpl_${String(i)}_${String(Date.now())}`,
          planId,
          dayOfWeek: trainingDays[i] ?? i,
          sessionOrder: 1,
          workoutType: config.workoutType,
          muscleGroups: JSON.stringify(config.muscleGroups),
          exercises: JSON.stringify(config.exercises),
          originalExercises: JSON.stringify(config.exercises),
          isUserAssigned: false,
          originalDayOfWeek: trainingDays[i] ?? i,
          notes: config.dayLabel,
        }));

        set((state) => ({
          trainingPlans: state.trainingPlans.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  splitType: template.splitType,
                  templateId: template.id,
                  trainingDays,
                  updatedAt: now,
                }
              : p,
          ),
          trainingPlanDays: [
            ...state.trainingPlanDays.filter((d) => d.planId !== planId),
            ...newDays,
          ],
        }));

        if (_db) {
          _db.execute(
            'UPDATE training_plans SET split_type = ?, template_id = ?, training_days = ?, updated_at = ? WHERE id = ?',
            [template.splitType, template.id, JSON.stringify(trainingDays), now, planId],
          ).catch((error: unknown) => {
            console.error('[fitnessStore] SQLite applyTemplate plan update failed:', error);
          });
          _db.execute('DELETE FROM training_plan_days WHERE plan_id = ?', [planId]).catch((error: unknown) => {
            console.error('[fitnessStore] SQLite applyTemplate delete old days failed:', error);
          });
          for (const day of newDays) {
            _db.execute(
              `INSERT INTO training_plan_days (id, plan_id, day_of_week, session_order, workout_type, muscle_groups, exercises, original_exercises, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [day.id, day.planId, day.dayOfWeek, day.sessionOrder, day.workoutType,
               day.muscleGroups ?? null, day.exercises ?? null, day.originalExercises ?? null, day.notes ?? null],
            ).catch((error: unknown) => {
              console.error('[fitnessStore] SQLite applyTemplate insert day failed:', error);
            });
          }
        }
      },

      saveCurrentAsTemplate: (planId, name) => {
        const plan = get().trainingPlans.find((p) => p.id === planId);
        if (!plan) return;

        const currentDays = get().trainingPlanDays.filter((d) => d.planId === planId);
        const now = new Date().toISOString();
        const templateId = `user_tpl_${String(Date.now())}`;

        const dayConfigs = currentDays.map((day) => ({
          dayLabel: day.notes ?? `Day ${String(day.dayOfWeek)}`,
          workoutType: day.workoutType,
          muscleGroups: safeParseJsonArray<MuscleGroup>(day.muscleGroups),
          exercises: safeParseJsonArray<PlanTemplate['dayConfigs'][number]['exercises'][number]>(day.exercises),
        }));

        const profile = get().trainingProfile;

        const template: PlanTemplate = {
          id: templateId,
          name,
          splitType: plan.splitType,
          daysPerWeek: currentDays.length,
          experienceLevel: profile?.trainingExperience ?? 'all',
          trainingGoal: profile?.trainingGoal ?? 'general',
          equipmentRequired: profile?.availableEquipment ?? [],
          description: `Custom template from plan "${plan.name}"`,
          dayConfigs,
          popularityScore: 0,
          isBuiltin: false,
          createdAt: now,
          updatedAt: now,
        };

        if (_db) {
          _db.execute(
            `INSERT INTO plan_templates (id, name, split_type, days_per_week, experience_level, training_goal, equipment_required, description, day_configs, popularity_score, is_builtin, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
            [
              template.id, template.name, template.splitType, template.daysPerWeek,
              template.experienceLevel, template.trainingGoal,
              JSON.stringify(template.equipmentRequired), template.description,
              JSON.stringify(template.dayConfigs), template.popularityScore,
              now, now,
            ],
          ).catch((error: unknown) => {
            console.error('[fitnessStore] SQLite saveCurrentAsTemplate failed:', error);
          });
        }

        return template;
      },
    }),
    {
      name: 'fitness-storage',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          return { ...state, planStrategy: null };
        }
        return state;
      },
    },
  ),
);
