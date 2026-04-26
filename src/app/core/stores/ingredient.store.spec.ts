import { TestBed } from '@angular/core/testing';
import type { IngredientListItem } from '../repositories/ingredient.repository';
import { IngredientRepository } from '../repositories/ingredient.repository';
import { IngredientStore } from './ingredient.store';

describe('IngredientStore', () => {
  let store: IngredientStore;
  let repo: jasmine.SpyObj<IngredientRepository>;

  const ingredient: IngredientListItem = {
    id: 'ingredient-1',
    name: 'Trứng gà',
    category: 'protein',
    nutrition_basis_unit: 'g',
    nutrition_basis_quantity: 100,
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    fiber: 0,
    density_g_per_ml: null,
    source: 'manual',
    created_at: '2026-04-26T00:00:00Z',
    updated_at: null,
    units: [],
  };

  beforeEach(() => {
    repo = jasmine.createSpyObj<IngredientRepository>('IngredientRepository', [
      'list',
      'searchByName',
      'insert',
      'update',
      'delete',
      'getById',
    ]);
    repo.list.and.resolveTo([ingredient]);
    repo.searchByName.and.resolveTo([ingredient]);
    repo.insert.and.resolveTo(ingredient);
    repo.update.and.resolveTo();
    repo.delete.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [IngredientStore, { provide: IngredientRepository, useValue: repo }],
    });

    store = TestBed.inject(IngredientStore);
  });

  it('loads ingredients and clears loading state', async () => {
    expect(store.loading()).toBeFalse();

    const promise = store.load();
    expect(store.loading()).toBeTrue();
    await promise;

    expect(repo.list).toHaveBeenCalled();
    expect(store.ingredients()).toEqual([ingredient]);
    expect(store.loading()).toBeFalse();
  });

  it('searches ingredients by name and stores the query', async () => {
    await store.search('trứng');

    expect(repo.searchByName).toHaveBeenCalledWith('trứng');
    expect(store.searchQuery()).toBe('trứng');
    expect(store.ingredients()).toEqual([ingredient]);
  });

  it('adds a new ingredient and prepends it into state', async () => {
    await store.add({
      name: 'Trứng gà',
      category: 'protein',
      nutrition_basis_unit: 'g',
      nutrition_basis_quantity: 100,
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      fiber: 0,
      density_g_per_ml: null,
      source: 'manual',
      units: [],
    });

    expect(repo.insert).toHaveBeenCalled();
    expect(store.ingredients()[0]).toEqual(ingredient);
  });

  it('updates an ingredient then refreshes current list from repository', async () => {
    await store.edit('ingredient-1', { name: 'Trứng gà ta' });

    expect(repo.update).toHaveBeenCalledWith('ingredient-1', { name: 'Trứng gà ta' });
    expect(repo.list).toHaveBeenCalled();
  });

  it('removes an ingredient from state after delete', async () => {
    await store.load();
    await store.remove('ingredient-1');

    expect(repo.delete).toHaveBeenCalledWith('ingredient-1');
    expect(store.ingredients()).toEqual([]);
  });
});
