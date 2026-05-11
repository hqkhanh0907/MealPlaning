import { TestBed } from '@angular/core/testing';

import type { DishListItem } from '../../repositories/dish.repository';
import { GeminiClient } from './gemini-client';
import { MealPlanAi } from './meal-plan-ai';

describe('MealPlanAi', () => {
  let service: MealPlanAi;
  let gemini: jasmine.SpyObj<GeminiClient>;

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
      providers: [MealPlanAi, { provide: GeminiClient, useValue: gemini }],
    });
    service = TestBed.inject(MealPlanAi);
  });

  it('calls Gemini with meal_plan_day feature and dish whitelist prompt', async () => {
    gemini.generateContent.and.resolveTo({
      items: [{ dish_id: 'dish-1', meal_type: 'lunch', servings: 1, reason: 'Đủ protein' }],
    });

    await service.planDay({
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
      date: '2026-05-10',
      targets: { calories: 2000, protein: 100, carbs: 250, fat: 60, fiber: 25 },
      dishes: [dish],
    });

    expect(result).toEqual([
      { dishId: 'dish-1', mealType: 'lunch', servings: 1.5, reason: 'Cân bằng macro' },
    ]);
  });

  it('rejects when Gemini returns no usable dish IDs', async () => {
    gemini.generateContent.and.resolveTo({
      items: [{ dish_id: 'dish-missing', meal_type: 'lunch', servings: 1, reason: 'Sai id' }],
    });

    await expectAsync(
      service.planDay({
        date: '2026-05-10',
        targets: { calories: 2000, protein: 100, carbs: 250, fat: 60, fiber: 25 },
        dishes: [dish],
      }),
    ).toBeRejectedWithError(/no usable dish IDs/);
  });
});
