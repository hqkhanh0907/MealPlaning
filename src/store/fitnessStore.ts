import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DatabaseService } from '../services/databaseService';
import { EXERCISES } from '../features/fitness/data/exerciseDatabase';
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
} from '../features/fitness/types';

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
  } | null;
  sqliteReady: boolean;
  showPlanCelebration: boolean;

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
  initializeFromSQLite: (db: DatabaseService) => Promise<void>;
  dismissPlanCelebration: () => void;
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
      sqliteReady: false,
      showPlanCelebration: false,

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
    }),
    {
      name: 'fitness-storage',
      version: 1,
    },
  ),
);
