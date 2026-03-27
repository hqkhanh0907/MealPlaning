import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DatabaseService } from '../services/databaseService';
import type {
  TrainingProfile,
  TrainingPlan,
  TrainingPlanDay,
  Workout,
  WorkoutSet,
  WeightEntry,
  Exercise,
  CardioIntensity,
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

  setTrainingProfile: (profile: TrainingProfile) => void;
  addTrainingPlan: (plan: TrainingPlan) => void;
  updateTrainingPlan: (id: string, updates: Partial<TrainingPlan>) => void;
  setActivePlan: (planId: string) => void;
  addPlanDays: (days: TrainingPlanDay[]) => void;
  getPlanDays: (planId: string) => TrainingPlanDay[];
  addWorkout: (workout: Workout) => void;
  updateWorkout: (id: string, updates: Partial<Workout>) => void;
  addWorkoutSet: (workoutSet: WorkoutSet) => void;
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
  getActivePlan: () => TrainingPlan | undefined;
  getLatestWeight: () => WeightEntry | undefined;
  getWorkoutsByDateRange: (startDate: string, endDate: string) => Workout[];
  initializeFromSQLite: (db: DatabaseService) => Promise<void>;
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

      addPlanDays: (days) =>
        set((state) => ({
          trainingPlanDays: [...state.trainingPlanDays, ...days],
        })),

      getPlanDays: (planId) =>
        get().trainingPlanDays.filter((d) => d.planId === planId),

      addWorkout: (workout) => {
        set((state) => ({ workouts: [...state.workouts, workout] }));
        if (_db) {
          _db
            .execute(
              `INSERT INTO workouts (id, date, name, duration_min, notes, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                workout.id,
                workout.date,
                workout.name,
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

      setWorkoutMode: (mode) => set({ workoutMode: mode }),

      setWorkoutDraft: (draft) => set({ workoutDraft: draft }),

      clearWorkoutDraft: () => set({ workoutDraft: null }),

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
            '[fitnessStore] SQLite load failed, using localStorage fallback:',
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
