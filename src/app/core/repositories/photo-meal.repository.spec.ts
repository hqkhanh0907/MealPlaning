import { TestBed } from '@angular/core/testing';
import { portionNutrition, type PhotoMealPortion } from '../models/photo-meal';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../services/database/__test__/create-test-database';
import { Database } from '../services/database/database';
import { WebDatabase } from '../services/database/web-database';
import { DayPlanRepository } from './day-plan.repository';
import { PhotoMealRepository } from './photo-meal.repository';

describe('PhotoMealRepository', () => {
  const date = '2026-11-24';
  const portions: PhotoMealPortion[] = [
    {
      item: {
        name: 'Cơm',
        estimatedGrams: 80,
        calories: 104,
        protein: 2,
        carbs: 23,
        fat: 1,
        fiber: 2,
        confidence: 'high',
        warning: null,
      },
      grams: 120.5,
    },
  ];
  let db: Database;
  let repo: PhotoMealRepository;

  beforeEach(async () => {
    db = await createTestDatabase();
    TestBed.configureTestingModule({ providers: [{ provide: Database, useValue: db }] });
    repo = TestBed.inject(PhotoMealRepository);
  });
  afterEach(teardownTestDatabase);

  it('restores confirmed weights and one completed snapshot after duplicate submissions', async () => {
    await Promise.all([
      repo.save(date, 'snack', portions, 'capture-1'),
      repo.save(date, 'snack', [...portions], 'capture-1'),
    ]);
    const reopened = new WebDatabase();
    await reopened.initialize();
    const weight = await reopened.getOne(
      `SELECT gram_weight, i.source FROM dish_ingredient di
      JOIN ingredient i ON i.id = di.ingredient_id WHERE dish_id = ?`,
      ['capture-1'],
    );
    expect(weight).toEqual({ gram_weight: 120.5, source: 'ai' });
    await reopened.execute('UPDATE ingredient SET calories = 0');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: Database, useValue: reopened }] });
    const day = await TestBed.inject(DayPlanRepository).findByDate(date);
    const entries = day?.meal_slots.find((slot) => slot.meal_type === 'snack')?.planned_dishes;
    expect(entries?.length).toBe(1);
    const entry = entries![0];
    expect(entry.is_completed).toBe(1);
    expect(entry.dish_name).toContain('120.5 g');
    const expected = portionNutrition(portions[0]);
    expect(entry.effective_calories).toBeCloseTo(expected.calories, 8);
    expect(entry.effective_protein).toBeCloseTo(expected.protein, 8);
    expect(entry.effective_carbs).toBeCloseTo(expected.carbs, 8);
    expect(entry.effective_fat).toBeCloseTo(expected.fat, 8);
    expect(entry.effective_fiber).toBeCloseTo(expected.fiber, 8);
  });

  it('rolls back every write on failure and allows a retry', async () => {
    await db.execute(`CREATE TRIGGER fail_photo BEFORE UPDATE ON planned_dish
      BEGIN SELECT RAISE(ABORT, 'snapshot failed'); END`);
    await expectAsync(repo.save(date, 'lunch', portions)).toBeRejected();
    for (const table of ['day_plan', 'ingredient', 'dish', 'dish_ingredient', 'planned_dish']) {
      expect(await db.getOne(`SELECT COUNT(*) AS n FROM ${table}`)).toEqual({ n: 0 });
    }
    await db.execute('DROP TRIGGER fail_photo');
    await repo.save(date, 'lunch', portions);
    expect(await db.getOne('SELECT COUNT(*) AS n FROM planned_dish')).toEqual({ n: 1 });
  });
});
