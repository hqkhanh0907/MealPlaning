import { TestBed } from '@angular/core/testing';
import type { CreateDishIngredientInput } from '../repositories/dish-ingredient.repository';
import type { CreateDishInput, DishWithIngredients } from '../repositories/dish.repository';
import { DishRepository } from '../repositories/dish.repository';
import { DishStore } from './dish.store';

describe('DishStore', () => {
  let store: DishStore;
  let repo: jasmine.SpyObj<DishRepository>;

  const dish: DishWithIngredients = {
    id: 'dish-1',
    name: 'Cơm trứng',
    description: 'Cơm trắng và trứng gà',
    type: 'ingredient_based',
    source: 'custom',
    servings: 1,
    image_url: null,
    meal_tag: null,
    created_at: '2026-04-26T00:00:00Z',
    updated_at: null,
    total_calories: 320,
    total_protein: 18,
    total_carbs: 40,
    total_fat: 9,
    total_fiber: 1,
    ingredients: [],
  };

  beforeEach(() => {
    repo = jasmine.createSpyObj<DishRepository>('DishRepository', [
      'list',
      'insert',
      'update',
      'delete',
      'getById',
      'countReferences',
      'searchByName',
    ]);
    repo.list.and.resolveTo([dish]);
    repo.searchByName.and.resolveTo([dish]);
    repo.insert.and.resolveTo(dish);
    repo.update.and.resolveTo(dish);
    repo.delete.and.resolveTo();
    repo.countReferences.and.resolveTo(0);

    TestBed.configureTestingModule({
      providers: [DishStore, { provide: DishRepository, useValue: repo }],
    });

    store = TestBed.inject(DishStore);
  });

  it('loads dishes and clears loading state', async () => {
    const promise = store.load();
    expect(store.loading()).toBeTrue();
    await promise;

    expect(repo.list).toHaveBeenCalled();
    expect(store.dishes()).toEqual([
      jasmine.objectContaining({
        id: 'dish-1',
        total_calories: 320,
      }),
    ]);
    expect(store.loading()).toBeFalse();
  });

  it('adds ingredient-based dish and prepends it into state', async () => {
    const input: CreateDishInput = {
      name: 'Cơm trứng',
      description: 'Cơm trắng và trứng gà',
      type: 'ingredient_based',
      source: 'custom',
      servings: 1,
      image_url: null,
    };
    const items: CreateDishIngredientInput[] = [
      { ingredient_id: 'ingredient-1', gram_weight: 100 },
    ];

    await store.addFromIngredients(input, items);

    expect(repo.insert).toHaveBeenCalledWith(input, items);
    expect(store.dishes()[0]).toEqual(
      jasmine.objectContaining({
        id: 'dish-1',
        total_calories: 320,
      }),
    );
  });

  it('removes dish from state after delete', async () => {
    await store.load();
    await store.remove('dish-1');

    expect(repo.delete).toHaveBeenCalledWith('dish-1');
    expect(store.dishes()).toEqual([]);
  });
});
