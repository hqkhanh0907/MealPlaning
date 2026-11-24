import { TestBed } from '@angular/core/testing';

import type { DishListItem } from '../../models/management.model';
import { GeminiClient } from './gemini-client';
import { GEMINI_API_KEY } from './gemini-key';
import { GROQ_API_KEY } from './groq-client';
import { MealPlanAi } from './meal-plan-ai';

describe('MealPlanAi', () => {
  let service: MealPlanAi;
  let gemini: jasmine.SpyObj<GeminiClient>;
  const emptyDay = {
    logged: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    loggedMeals: [],
  };

  const dish: DishListItem = {
    id: 'dish-1',
    name: 'Cơm gà',
    description: null,
    type: 'ingredient_based',
    source: 'custom',
    servings: 1,
    image_url: null,
    meal_tag: 'lunch',
    is_favorite: 0,
    created_at: '2026-05-10T00:00:00Z',
    updated_at: null,
    total_calories: 520,
    total_protein: 35,
    total_carbs: 62,
    total_fat: 14,
    total_fiber: 5,
  };

  beforeEach(() => {
    gemini = jasmine.createSpyObj<GeminiClient>('GeminiClient', ['generateContent']);
    TestBed.configureTestingModule({
      providers: [
        { provide: GROQ_API_KEY, useValue: '' },
        { provide: GEMINI_API_KEY, useValue: 'test-only' },
        MealPlanAi,
        { provide: GeminiClient, useValue: gemini },
      ],
    });
    service = TestBed.inject(MealPlanAi);
  });

  it('calls Gemini with meal_plan_day feature and dish whitelist prompt', async () => {
    gemini.generateContent.and.resolveTo({
      items: [{ dish_id: 'dish-1', meal_type: 'lunch', servings: 1, reason: 'Đủ protein' }],
    });

    await service.planDay({
      ...emptyDay,
      date: '2026-05-10',
      targets: { calories: 2000, protein: 100, carbs: 250, fat: 60, fiber: 25 },
      dishes: [dish],
    });

    expect(gemini.generateContent).toHaveBeenCalledTimes(1);
    const [prompt, options] = gemini.generateContent.calls.mostRecent().args as [
      string,
      { feature: string },
    ];
    expect(prompt).toContain('id=dish-1');
    expect(prompt).toContain('Calories: 2000 kcal');
    expect(options.feature).toBe('meal_plan_day');
  });

  it('filters unknown dish IDs and rounds servings to 0.5 increments', async () => {
    gemini.generateContent.and.resolveTo({
      items: [
        { dish_id: 'dish-1', meal_type: 'lunch', servings: 1.26, reason: 'Cân bằng macro' },
        { dish_id: 'dish-missing', meal_type: 'dinner', servings: 1, reason: 'Không hợp lệ' },
      ],
    });

    const result = await service.planDay({
      ...emptyDay,
      date: '2026-05-10',
      targets: { calories: 2000, protein: 100, carbs: 250, fat: 60, fiber: 25 },
      dishes: [dish],
    });

    expect(result).toEqual([
      { dishId: 'dish-1', mealType: 'lunch', servings: 1.5, reason: 'Cân bằng macro' },
    ]);
  });

  it('plans only the budget that remains after recorded meals', async () => {
    gemini.generateContent.and.resolveTo({
      items: [{ dish_id: dish.id, meal_type: 'dinner', servings: 1, reason: 'Bữa còn lại' }],
    });
    const input = {
      date: '2026-05-10',
      targets: { calories: 2000, protein: 100, carbs: 0, fat: 0, fiber: 25 },
      logged: { calories: 500, protein: 25, carbs: 70, fat: 15, fiber: null },
      loggedMeals: ['breakfast' as const],
      dishes: [dish],
    };
    await service.planDay(input);
    const [prompt] = gemini.generateContent.calls.mostRecent().args;
    expect(prompt).toContain('1500 kcal');
    expect(prompt).toContain('75 g');
    expect(prompt).toContain('Fiber: thiếu số liệu đã ăn');
    expect(prompt).toContain('Carbs: chưa đặt');
    gemini.generateContent.calls.reset();
    const noEnergy = { ...input, targets: { ...input.targets, calories: 500 } };
    expect(await service.planDay(noEnergy)).toEqual([]);
    expect(gemini.generateContent).not.toHaveBeenCalled();
  });

  it('rejects when Gemini returns no usable dish IDs', async () => {
    gemini.generateContent.and.resolveTo({
      items: [{ dish_id: 'dish-missing', meal_type: 'lunch', servings: 1, reason: 'Sai id' }],
    });

    await expectAsync(
      service.planDay({
        ...emptyDay,
        date: '2026-05-10',
        targets: { calories: 2000, protein: 100, carbs: 250, fat: 60, fiber: 25 },
        dishes: [dish],
      }),
    ).toBeRejectedWithError(/no usable dish IDs/);
  });

  it('keeps the current plan if rounded portions exceed the remaining energy', async () => {
    gemini.generateContent.and.resolveTo({
      items: [{ dish_id: dish.id, meal_type: 'lunch', servings: 1.26, reason: 'Món thử' }],
    });
    await expectAsync(
      service.planDay({
        ...emptyDay,
        date: '2026-05-10',
        targets: { calories: 1200, protein: 0, carbs: 0, fat: 0, fiber: 0 },
        logged: { ...emptyDay.logged, calories: 500 },
        dishes: [dish],
      }),
    ).toBeRejectedWithError(/vượt mục tiêu năng lượng/);
  });

  it('distinguishes unset targets, missing snapshots and reached targets', async () => {
    const targets = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const input = { ...emptyDay, date: '2026-05-10', targets, dishes: [dish] };
    gemini.generateContent.and.resolveTo({
      items: [{ dish_id: dish.id, meal_type: 'lunch', servings: 1, reason: 'Món thử' }],
    });
    expect((await service.planDay(input)).length).toBe(1);
    gemini.generateContent.calls.reset();
    expect(
      await service.planDay({
        ...input,
        targets: { ...targets, protein: 25 },
        logged: { ...emptyDay.logged, protein: 30 },
      }),
    ).toEqual([]);
    await expectAsync(
      service.planDay({
        ...input,
        targets: { ...targets, calories: 2000 },
        logged: { ...emptyDay.logged, calories: null },
      }),
    ).toBeRejectedWithError(/Thiếu số liệu năng lượng/);
    expect(gemini.generateContent).not.toHaveBeenCalled();
  });
});
