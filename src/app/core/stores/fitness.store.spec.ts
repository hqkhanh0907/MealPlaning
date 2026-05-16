import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FitnessStore } from './fitness.store';
import type {
  ActiveTrainingPlan,
  Exercise,
  FitnessProgressSummary,
  TrainingPlanDayWithExercises,
  TrainingPlanSummary,
  WorkoutExerciseDetail,
  WorkoutSessionDetail,
} from '../models/fitness.types';
import type { UserProfile } from '../models/user-profile.model';
import { ExerciseRepository } from '../repositories/exercise.repository';
import { TrainingPlanRepository } from '../repositories/training-plan.repository';
import { WorkoutRepository } from '../repositories/workout.repository';
import type { AiTrainingPlanDraft } from '../models/fitness.types';
import { FitnessAi } from '../services/ai/fitness-ai';
import { NetworkStore } from './network.store';
import { ProfileStore } from './profile.store';

describe('FitnessStore', () => {
  let store: FitnessStore;
  let exerciseRepo: jasmine.SpyObj<ExerciseRepository>;
  let planRepo: jasmine.SpyObj<TrainingPlanRepository>;
  let workoutRepo: jasmine.SpyObj<WorkoutRepository>;
  let fitnessAi: jasmine.SpyObj<FitnessAi>;
  let online = signal(true);

  beforeEach(() => {
    exerciseRepo = jasmine.createSpyObj<ExerciseRepository>('ExerciseRepository', ['list']);
    exerciseRepo.list.and.resolveTo([exercise()]);

    planRepo = jasmine.createSpyObj<TrainingPlanRepository>('TrainingPlanRepository', [
      'ensurePresetPlans',
      'listPlans',
      'getActivePlan',
      'getTodayTrainingDay',
      'activatePlan',
      'createAiPlan',
    ]);
    planRepo.ensurePresetPlans.and.resolveTo([planSummary()]);
    planRepo.listPlans.and.resolveTo([planSummary()]);
    planRepo.getActivePlan.and.resolveTo(activePlan());
    planRepo.getTodayTrainingDay.and.resolveTo(trainingDay());
    planRepo.activatePlan.and.resolveTo();
    planRepo.createAiPlan.and.resolveTo(planSummary({ type: 'ai_custom', source: 'ai' }));

    workoutRepo = jasmine.createSpyObj<WorkoutRepository>('WorkoutRepository', [
      'getActiveSession',
      'progressSummary',
      'startGuidedSession',
      'startFreeSession',
      'addExerciseToSession',
      'getSession',
      'addSet',
      'completeSession',
    ]);
    workoutRepo.getActiveSession.and.resolveTo(null);
    workoutRepo.progressSummary.and.resolveTo(progressSummary());
    workoutRepo.startGuidedSession.and.resolveTo(workoutSession());
    workoutRepo.startFreeSession.and.resolveTo(workoutSession({ mode: 'free' }));
    workoutRepo.addExerciseToSession.and.resolveTo(workoutExercise({ id: 'we-2' }));
    workoutRepo.getSession.and.resolveTo(workoutSession());
    workoutRepo.addSet.and.resolveTo({
      id: 'set-1',
      workout_exercise_id: 'we-1',
      set_number: 1,
      weight_kg: 40,
      reps: 8,
      rest_seconds: 90,
      effort: 'just_right',
      notes: null,
      created_at: '2026-05-11T07:00:00',
    });
    workoutRepo.completeSession.and.resolveTo();
    fitnessAi = jasmine.createSpyObj<FitnessAi>('FitnessAi', ['generateTrainingPlan']);
    fitnessAi.generateTrainingPlan.and.resolveTo(aiPlanDraft());
    online = signal(true);

    TestBed.configureTestingModule({
      providers: [
        FitnessStore,
        { provide: ExerciseRepository, useValue: exerciseRepo },
        { provide: TrainingPlanRepository, useValue: planRepo },
        { provide: WorkoutRepository, useValue: workoutRepo },
        { provide: FitnessAi, useValue: fitnessAi },
        { provide: NetworkStore, useValue: { online } },
        { provide: ProfileStore, useValue: { profile: signal<UserProfile | null>(null) } },
      ],
    });
    store = TestBed.inject(FitnessStore);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('initializes presets, exercises, active plan and progress', async () => {
    await store.initialize();

    expect(planRepo.ensurePresetPlans).toHaveBeenCalled();
    expect(exerciseRepo.list).toHaveBeenCalledOnceWith({ limit: 200 });
    expect(store.plans().length).toBe(1);
    expect(store.activePlan()?.id).toBe('plan-1');
    expect(store.todayDay()?.id).toBe('day-1');
    expect(store.currentWeekVolumeLabel()).toBe('5.000 kg');
    expect(store.loading()).toBeFalse();
  });

  it('blocks guided start on rest days with an explicit message', async () => {
    store.todayDay.set({ ...trainingDay(), is_rest_day: 1 });

    await store.startTodayGuided();

    expect(workoutRepo.startGuidedSession).not.toHaveBeenCalled();
    expect(store.errorMessage()).toBe('Hôm nay là ngày nghỉ hoặc chưa có giáo án đang hoạt động.');
  });

  it('logs a parsed set for the selected exercise and starts rest timer', async () => {
    store.activeSession.set(workoutSession());
    store.selectedWorkoutExerciseId.set('we-1');
    store.updateWeight('40');
    store.updateReps('8');
    store.updateRestSeconds('90');
    store.updateEffort('just_right');

    await store.logSet();

    expect(workoutRepo.addSet).toHaveBeenCalledOnceWith('we-1', {
      weightKg: 40,
      reps: 8,
      restSeconds: 90,
      effort: 'just_right',
      notes: null,
    });
    expect(store.restSeconds()).toBe(90);
    expect(store.successMessage()).toBe('Đã ghi set tập.');
  });

  it('rejects invalid set input before touching the repository', async () => {
    store.activeSession.set(workoutSession());
    store.selectedWorkoutExerciseId.set('we-1');
    store.updateReps('8.5');

    await store.logSet();

    expect(workoutRepo.addSet).not.toHaveBeenCalled();
    expect(store.errorMessage()).toBe('Reps phải là số nguyên 1-100.');
  });

  it('creates and activates an AI custom plan from current state', async () => {
    await store.initialize();

    await store.generateAiCustomPlan();

    expect(fitnessAi.generateTrainingPlan).toHaveBeenCalledWith({
      profile: null,
      exercises: [exercise()],
      progress: progressSummary(),
    });
    expect(planRepo.createAiPlan).toHaveBeenCalledOnceWith(aiPlanDraft());
    expect(store.aiPlanRationale()).toBe('Giữ full-body volume vừa phải.');
    expect(store.successMessage()).toBe('Đã tạo và kích hoạt giáo án AI custom.');
  });

  it('blocks AI custom plan generation while offline', async () => {
    online.set(false);

    await store.generateAiCustomPlan();

    expect(fitnessAi.generateTrainingPlan).not.toHaveBeenCalled();
    expect(store.errorMessage()).toBe('Cần kết nối mạng để tạo giáo án AI.');
  });
});

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    name_vi: 'Đẩy ngực tạ đòn',
    muscle_group: 'chest',
    category: 'compound',
    equipment: 'barbell',
    instructions: null,
    source: 'db',
    created_at: '2026-05-11T00:00:00',
    ...overrides,
  };
}

function planSummary(overrides: Partial<TrainingPlanSummary> = {}): TrainingPlanSummary {
  return {
    id: 'plan-1',
    name: 'Full Body 3 buổi',
    type: 'full_body',
    frequency: 3,
    is_active: 1,
    description: null,
    source: 'preset',
    created_at: '2026-05-11T00:00:00',
    updated_at: null,
    training_days: 3,
    planned_exercises: 12,
    ...overrides,
  };
}

function trainingDay(
  overrides: Partial<TrainingPlanDayWithExercises> = {},
): TrainingPlanDayWithExercises {
  return {
    id: 'day-1',
    training_plan_id: 'plan-1',
    day_of_week: 1,
    name: 'Full Body A',
    is_rest_day: 0,
    sort_order: 0,
    exercises: [],
    ...overrides,
  };
}

function activePlan(overrides: Partial<ActiveTrainingPlan> = {}): ActiveTrainingPlan {
  return {
    ...planSummary(),
    days: [trainingDay()],
    ...overrides,
  };
}

function workoutExercise(overrides: Partial<WorkoutExerciseDetail> = {}): WorkoutExerciseDetail {
  return {
    id: 'we-1',
    workout_session_id: 'session-1',
    exercise_id: 'ex-1',
    exercise_name: 'Barbell Bench Press',
    exercise_name_vi: 'Đẩy ngực tạ đòn',
    muscle_group: 'chest',
    category: 'compound',
    sort_order: 0,
    total_volume: 0,
    sets: [],
    ...overrides,
  };
}

function workoutSession(overrides: Partial<WorkoutSessionDetail> = {}): WorkoutSessionDetail {
  return {
    id: 'session-1',
    date: '2026-05-11',
    training_plan_day_id: 'day-1',
    training_day_name: 'Full Body A',
    mode: 'guided',
    total_volume: 0,
    duration_minutes: null,
    started_at: '2026-05-11T07:00:00',
    completed_at: null,
    created_at: '2026-05-11T07:00:00',
    exercises: [workoutExercise()],
    ...overrides,
  };
}

function progressSummary(overrides: Partial<FitnessProgressSummary> = {}): FitnessProgressSummary {
  return {
    currentWeekVolume: 5000,
    previousWeekVolume: 4000,
    workoutStreakWeeks: 2,
    weeklyAvgWeightKg: 64.5,
    weightSource: 'weight_log',
    volumeByMuscle: [],
    strength: [],
    ...overrides,
  };
}

function aiPlanDraft(): AiTrainingPlanDraft {
  return {
    name: 'AI Full Body',
    description: 'AI tạo giáo án 3 buổi.',
    frequency: 3,
    rationale: 'Giữ full-body volume vừa phải.',
    days: [
      {
        dayOfWeek: 1,
        name: 'Full Body A',
        isRestDay: false,
        exercises: [
          {
            exerciseId: 'ex-1',
            sets: 3,
            repsMin: 8,
            repsMax: 10,
            restSeconds: 120,
            notes: 'Tăng 2,5 kg khi đủ reps.',
          },
        ],
      },
      { dayOfWeek: 2, name: 'Rest Day', isRestDay: true, exercises: [] },
      {
        dayOfWeek: 3,
        name: 'Full Body B',
        isRestDay: false,
        exercises: [
          {
            exerciseId: 'ex-1',
            sets: 3,
            repsMin: 10,
            repsMax: 12,
            restSeconds: 90,
            notes: null,
          },
        ],
      },
      { dayOfWeek: 4, name: 'Rest Day', isRestDay: true, exercises: [] },
      {
        dayOfWeek: 5,
        name: 'Full Body C',
        isRestDay: false,
        exercises: [
          {
            exerciseId: 'ex-1',
            sets: 2,
            repsMin: 12,
            repsMax: 15,
            restSeconds: 90,
            notes: null,
          },
        ],
      },
      { dayOfWeek: 6, name: 'Rest Day', isRestDay: true, exercises: [] },
      { dayOfWeek: 0, name: 'Rest Day', isRestDay: true, exercises: [] },
    ],
  };
}
