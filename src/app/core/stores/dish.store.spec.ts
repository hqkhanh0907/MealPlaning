import { TestBed } from '@angular/core/testing';
import type { CreateDishIngredientInput } from '../repositories/dish-ingredient.repository';
import type { CreateDishInput, DishWithIngredients } from '../repositories/dish.repository';
import { DishRepository } from '../repositories/dish.repository';
import { IngredientRepository } from '../repositories/ingredient.repository';
import { DishAutofillApplier } from '../services/ai/dish-autofill-applier';
import type { DishAutofillResult } from '../services/ai/nutrition-ai';
import { Database } from '../services/database/database';
import { DishStore } from './dish.store';
import { IngredientStore } from './ingredient.store';

describe('DishStore', () => {
  let store: DishStore;
  let repo: jasmine.SpyObj<DishRepository>;
  let db: jasmine.SpyObj<Pick<Database, 'withTransaction'>>;
  let applier: jasmine.SpyObj<DishAutofillApplier>;
  let ingredientRepo: jasmine.SpyObj<Pick<IngredientRepository, 'findByIds'>>;
  let ingredientStore: jasmine.SpyObj<Pick<IngredientStore, 'addManyToCache'>>;

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

    db = jasmine.createSpyObj<Pick<Database, 'withTransaction'>>('Database', ['withTransaction']);
    // Default: pass-through (executes callback as if inside tx).
    db.withTransaction.and.callFake(<T>(cb: () => Promise<T>) => cb());

    applier = jasmine.createSpyObj<DishAutofillApplier>('DishAutofillApplier', ['apply']);
    applier.apply.and.resolveTo({ dishIngredients: [], createdIngredientIds: [] });

    ingredientRepo = jasmine.createSpyObj<Pick<IngredientRepository, 'findByIds'>>(
      'IngredientRepository',
      ['findByIds'],
    );
    ingredientRepo.findByIds.and.resolveTo([]);

    ingredientStore = jasmine.createSpyObj<Pick<IngredientStore, 'addManyToCache'>>(
      'IngredientStore',
      ['addManyToCache'],
    );

    TestBed.configureTestingModule({
      providers: [
        DishStore,
        { provide: DishRepository, useValue: repo },
        { provide: Database, useValue: db },
        { provide: DishAutofillApplier, useValue: applier },
        { provide: IngredientRepository, useValue: ingredientRepo },
        { provide: IngredientStore, useValue: ingredientStore },
      ],
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

  describe('applyAutofillAtomic (F-02 Layer 7)', () => {
    const autofillResult = { rows: [] } as unknown as DishAutofillResult;

    it('wraps applier.apply in a withTransaction call', async () => {
      applier.apply.and.resolveTo({
        dishIngredients: [{ ingredient_id: 'ing-1', gram_weight: 50, sort_order: 0 }],
        createdIngredientIds: [],
      });

      const result = await store.applyAutofillAtomic(autofillResult, {
        fuzzyDecisions: new Map(),
      });

      expect(db.withTransaction).toHaveBeenCalledTimes(1);
      expect(applier.apply).toHaveBeenCalledWith(autofillResult, {
        fuzzyDecisions: new Map(),
      });
      expect(result.dishIngredients.length).toBe(1);
      expect(result.createdIngredientIds.length).toBe(0);
      expect(ingredientStore.addManyToCache).not.toHaveBeenCalled();
      expect(ingredientRepo.findByIds).not.toHaveBeenCalled();
    });

    it('bulk-merges newly-created ingredients into store cache after commit', async () => {
      applier.apply.and.resolveTo({
        dishIngredients: [
          { ingredient_id: 'ing-new-1', gram_weight: 80, sort_order: 0 },
          { ingredient_id: 'ing-new-2', gram_weight: 30, sort_order: 1 },
        ],
        createdIngredientIds: ['ing-new-1', 'ing-new-2'],
      });
      const fakeRows = [
        {
          id: 'ing-new-1',
          name: 'A',
          category: 'Khác',
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          source: 'ai' as const,
          created_at: 't',
          updated_at: null,
          deleted_at: null,
        },
        {
          id: 'ing-new-2',
          name: 'B',
          category: 'Khác',
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          source: 'ai' as const,
          created_at: 't',
          updated_at: null,
          deleted_at: null,
        },
      ];
      ingredientRepo.findByIds.and.resolveTo(fakeRows);

      await store.applyAutofillAtomic(autofillResult, { fuzzyDecisions: new Map() });

      expect(ingredientRepo.findByIds).toHaveBeenCalledWith(['ing-new-1', 'ing-new-2']);
      expect(ingredientStore.addManyToCache).toHaveBeenCalledWith(fakeRows);
    });

    it('rolls back: cache untouched when applier throws inside withTransaction', async () => {
      applier.apply.and.rejectWith(new Error('AI insert failed'));
      // withTransaction default callFake propagates the rejection.

      await expectAsync(
        store.applyAutofillAtomic(autofillResult, { fuzzyDecisions: new Map() }),
      ).toBeRejectedWithError('AI insert failed');

      expect(ingredientStore.addManyToCache).not.toHaveBeenCalled();
      expect(ingredientRepo.findByIds).not.toHaveBeenCalled();
    });
  });
});
