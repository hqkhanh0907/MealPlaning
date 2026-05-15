import { TestBed } from '@angular/core/testing';

import type { Exercise, FitnessProgressSummary } from '../../models/fitness.types';
import type { UserProfile } from '../../models/user-profile.model';
import type { DishListItem } from '../../repositories/dish.repository';
import type { NutritionTotals } from '../nutrition/nutrition-query';
import { FitnessAi } from './fitness-ai';
import { FoodImageAi } from './food-image-ai';
import { GeminiClient } from './gemini-client';
import { InsightAi } from './insight-ai';
import { MenuSuggestionAi } from './menu-suggestion-ai';
import type { AiTrainingPlanResponse } from './prompts/training-plan.prompt';

describe('AI feature services', () => {
  let gemini: jasmine.SpyObj<GeminiClient>;

  beforeEach(() => {
    gemini = jasmine.createSpyObj<GeminiClient>('GeminiClient', ['generateContent']);

    TestBed.configureTestingModule({
      providers: [
        FitnessAi,
        FoodImageAi,
        InsightAi,
        MenuSuggestionAi,
        { provide: GeminiClient, useValue: gemini },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('sends inline image data and normalizes food image analysis output', async () => {
    gemini.generateContent.and.resolveTo({
      overall_confidence: 'medium',
      image_quality_warning: '  Ảnh hơi tối  ',
      items: [
        {
          name: '  Cơm gà  ',
          estimated_grams: 348.6,
          calories: 520.4,
          protein: 34.6,
          carbs: 62.2,
          fat: 13.8,
          fiber: 4.2,
          confidence: 'medium',
          warning: '  Ước tính theo khẩu phần nhìn thấy  ',
        },
      ],
    });
    const service = TestBed.inject(FoodImageAi);

    const result = await service.analyzeMealPhoto(
      { data: 'BASE64_IMAGE', mimeType: 'image/jpeg' },
      'bữa trưa',
    );

    const [, options] = gemini.generateContent.calls.mostRecent().args;
    expect(options.feature).toBe('image_analysis');
    expect(options.imageParts).toEqual([{ mimeType: 'image/jpeg', data: 'BASE64_IMAGE' }]);
    expect(result).toEqual({
      overallConfidence: 'medium',
      imageQualityWarning: 'Ảnh hơi tối',
      items: [
        {
          name: 'Cơm gà',
          estimatedGrams: 349,
          calories: 520,
          protein: 35,
          carbs: 62,
          fat: 14,
          fiber: 4,
          confidence: 'medium',
          warning: 'Ước tính theo khẩu phần nhìn thấy',
        },
      ],
    });
  });

  it('filters menu suggestions to known dishes and rounds servings to half steps', async () => {
    gemini.generateContent.and.resolveTo({
      suggestions: [
        { dish_id: 'dish-1', servings: 1.24, reason: '  Hợp Protein còn thiếu  ' },
        { dish_id: 'missing', servings: 2, reason: 'Không có trong DB' },
      ],
    });
    const service = TestBed.inject(MenuSuggestionAi);

    const result = await service.suggest({
      date: '2026-05-10',
      mealType: 'lunch',
      targets: totals({ calories: 2200, protein: 130 }),
      currentTotals: totals({ calories: 900, protein: 50 }),
      dishes: [dish()],
    });

    expect(gemini.generateContent.calls.mostRecent().args[1].feature).toBe('menu_suggestion');
    expect(result).toEqual([
      {
        dishId: 'dish-1',
        dishName: 'Cơm gà',
        servings: 1,
        reason: 'Hợp Protein còn thiếu',
      },
    ]);
  });

  it('maps daily insight response without leaking transport details', async () => {
    gemini.generateContent.and.resolveTo({
      tone: 'success',
      title: '  Đúng nhịp  ',
      body: '  Protein ổn, calo chưa vượt.  ',
      action: '  Giữ bữa tối nhẹ.  ',
    });
    const service = TestBed.inject(InsightAi);

    const result = await service.generateDailyInsight({
      date: '2026-05-10',
      level: 'beginner',
      totals: totals({ calories: 1600, protein: 100 }),
      targets: totals({ calories: 2200, protein: 130 }),
      workoutVolumeKg: 3000,
      workoutStreakWeeks: 2,
    });

    expect(gemini.generateContent.calls.mostRecent().args[1].feature).toBe('daily_insight');
    expect(result).toEqual({
      tone: 'success',
      title: 'Đúng nhịp',
      body: 'Protein ổn, calo chưa vượt.',
      action: 'Giữ bữa tối nhẹ.',
    });
  });

  it('filters unknown AI training exercises and rejects unusable plans', async () => {
    gemini.generateContent.and.resolveTo(trainingPlanResponse());
    const service = TestBed.inject(FitnessAi);

    const result = await service.generateTrainingPlan({
      profile: profile(),
      exercises: exercises(24),
      progress: progressSummary(),
    });

    expect(gemini.generateContent.calls.mostRecent().args[1].feature).toBe('training_plan');
    expect(result.frequency).toBe(3);
    expect(result.days[0].exercises.map((exercise) => exercise.exerciseId)).toEqual(['ex-1']);

    gemini.generateContent.and.resolveTo({
      ...trainingPlanResponse(),
      days: trainingPlanResponse().days.map((day) => ({ ...day, exercises: [] })),
    });
    await expectAsync(
      service.generateTrainingPlan({
        profile: profile(),
        exercises: exercises(24),
        progress: progressSummary(),
      }),
    ).toBeRejectedWithError('FitnessAi: Gemini returned too few valid training days.');
  });
});

function totals(overrides: Partial<NutritionTotals> = {}): NutritionTotals {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    ...overrides,
  };
}

function dish(): DishListItem {
  return {
    id: 'dish-1',
    name: 'Cơm gà',
    description: null,
    type: 'ingredient_based',
    source: 'custom',
    servings: 1,
    image_url: null,
    meal_tag: 'lunch',
    is_favorite: 0,
    created_at: '2026-05-01T00:00:00',
    updated_at: null,
    total_calories: 520,
    total_protein: 35,
    total_carbs: 62,
    total_fat: 14,
    total_fiber: 4,
  };
}

function exercises(count: number): Exercise[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `ex-${index + 1}`,
    name: `Exercise ${index + 1}`,
    name_vi: `Bài ${index + 1}`,
    muscle_group: index % 2 === 0 ? 'chest' : 'back',
    category: 'compound',
    equipment: 'Barbell',
    instructions: null,
    source: 'db',
    created_at: '2026-05-01T00:00:00',
  }));
}

function profile(): UserProfile {
  return {
    id: 'profile-1',
    height_cm: 170,
    weight_kg: 65,
    age: 30,
    gender: 'male',
    goal: 'maintain',
    fitness_level: 'beginner',
    activity_factor: 1.55,
    bmr: 1600,
    tdee: 2400,
    target_calories: 2200,
    target_protein: 130,
    target_carbs: null,
    target_fat: null,
    theme: 'light',
    notif_morning: 1,
    notif_lunch: 1,
    notif_evening: 1,
    notif_weekly: 1,
    onboarding_completed: 1,
    created_at: '2026-05-01T00:00:00',
    updated_at: null,
  };
}

function progressSummary(): FitnessProgressSummary {
  return {
    currentWeekVolume: 3200,
    previousWeekVolume: 2400,
    workoutStreakWeeks: 2,
    weeklyAvgWeightKg: 65,
    weightSource: 'profile',
    volumeByMuscle: [],
    strength: [],
  };
}

function trainingPlanResponse(): AiTrainingPlanResponse {
  return {
    name: 'AI Full Body',
    description: 'AI tạo giáo án 3 buổi.',
    frequency: 3,
    rationale: 'Volume vừa phải.',
    days: [
      {
        day_of_week: 1,
        name: 'Full Body A',
        is_rest_day: false,
        exercises: [
          {
            exercise_id: 'ex-1',
            sets: 3,
            reps_min: 8,
            reps_max: 10,
            rest_seconds: 120,
            notes: 'Tăng tạ khi đủ reps.',
          },
          {
            exercise_id: 'missing',
            sets: 3,
            reps_min: 8,
            reps_max: 10,
            rest_seconds: 120,
            notes: null,
          },
        ],
      },
      { day_of_week: 2, name: 'Rest Day', is_rest_day: true, exercises: [] },
      {
        day_of_week: 3,
        name: 'Full Body B',
        is_rest_day: false,
        exercises: [
          {
            exercise_id: 'ex-2',
            sets: 3,
            reps_min: 10,
            reps_max: 12,
            rest_seconds: 90,
            notes: null,
          },
        ],
      },
      { day_of_week: 4, name: 'Rest Day', is_rest_day: true, exercises: [] },
      {
        day_of_week: 5,
        name: 'Full Body C',
        is_rest_day: false,
        exercises: [
          {
            exercise_id: 'ex-3',
            sets: 2,
            reps_min: 12,
            reps_max: 15,
            rest_seconds: 90,
            notes: null,
          },
        ],
      },
      { day_of_week: 6, name: 'Rest Day', is_rest_day: true, exercises: [] },
      { day_of_week: 0, name: 'Rest Day', is_rest_day: true, exercises: [] },
    ],
  };
}
