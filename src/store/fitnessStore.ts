import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  TrainingProfile,
  TrainingPlan,
  TrainingPlanDay,
  Workout,
  WorkoutSet,
  WeightEntry,
} from '../features/fitness/types';

export interface FitnessState {
  trainingProfile: TrainingProfile | null;
  trainingPlans: TrainingPlan[];
  trainingPlanDays: TrainingPlanDay[];
  workouts: Workout[];
  workoutSets: WorkoutSet[];
  weightEntries: WeightEntry[];
  isOnboarded: boolean;
  workoutMode: 'strength' | 'cardio';

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
  getActivePlan: () => TrainingPlan | undefined;
  getLatestWeight: () => WeightEntry | undefined;
  getWorkoutsByDateRange: (startDate: string, endDate: string) => Workout[];
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

      addWorkout: (workout) =>
        set((state) => ({ workouts: [...state.workouts, workout] })),

      updateWorkout: (id, updates) =>
        set((state) => ({
          workouts: state.workouts.map((w) =>
            w.id === id ? { ...w, ...updates } : w,
          ),
        })),

      addWorkoutSet: (workoutSet) =>
        set((state) => ({
          workoutSets: [...state.workoutSets, workoutSet],
        })),

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
    }),
    {
      name: 'fitness-storage',
      version: 1,
    },
  ),
);
