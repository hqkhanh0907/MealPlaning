import { TestBed } from '@angular/core/testing';

import {
  IngredientRepository,
  type IngredientListItem,
} from '../../repositories/ingredient.repository';
import { DishAutofillApplier, type FuzzyConfirmDecision } from './dish-autofill-applier';
import type {
  DishAutofillExistingRow,
  DishAutofillFuzzyConfirmRow,
  DishAutofillNewRow,
  DishAutofillResult,
  DishAutofillRow,
} from './nutrition-ai';

function existingRow(
  matchedIngredientId: string,
  gramWeight = 100,
  name = 'Cà chua',
): DishAutofillExistingRow {
  return { kind: 'existing', name, gramWeight, matchedIngredientId, confidence: 'high' };
}

function newRow(name: string, gramWeight = 50): DishAutofillNewRow {
  return {
    kind: 'new',
    name,
    gramWeight,
    category: 'Khác',
    caloriesPer100g: 100,
    proteinPer100g: 5,
    carbsPer100g: 20,
    fatPer100g: 1,
    fiberPer100g: 2,
    confidence: 'medium',
  };
}

function fuzzyRow(
  suggested: { id: string; name: string },
  distance = 1,
): DishAutofillFuzzyConfirmRow {
  return {
    kind: 'fuzzyConfirm',
    name: 'Cà chu',
    gramWeight: 80,
    suggestedMatchId: suggested.id,
    suggestedMatchName: suggested.name,
    distance,
    pendingNew: {
      name: 'Cà chu',
      gramWeight: 80,
      category: 'Khác',
      caloriesPer100g: 18,
      proteinPer100g: 0.9,
      carbsPer100g: 3.9,
      fatPer100g: 0.2,
      fiberPer100g: 1.2,
      confidence: 'low',
    },
  };
}

function buildResult(rows: DishAutofillRow[]): DishAutofillResult {
  return {
    dishName: 'Test Dish',
    rows,
    raw: { ingredients: [] } as never,
  };
}

describe('DishAutofillApplier (F-02 Layer 4)', () => {
  let applier: DishAutofillApplier;
  let repo: jasmine.SpyObj<IngredientRepository>;

  beforeEach(() => {
    repo = jasmine.createSpyObj<IngredientRepository>('IngredientRepository', [
      'findByExactName',
      'insert',
    ]);
    TestBed.configureTestingModule({
      providers: [DishAutofillApplier, { provide: IngredientRepository, useValue: repo }],
    });
    applier = TestBed.inject(DishAutofillApplier);
  });

  it('maps existing rows to dish_ingredient links without DB writes', async () => {
    const result = buildResult([existingRow('ing-1', 120), existingRow('ing-2', 60)]);

    const out = await applier.apply(result, { fuzzyDecisions: new Map() });

    expect(repo.insert).not.toHaveBeenCalled();
    expect(out.createdIngredientIds).toEqual([]);
    expect(out.dishIngredients).toEqual([
      { ingredient_id: 'ing-1', gram_weight: 120, sort_order: 0 },
      { ingredient_id: 'ing-2', gram_weight: 60, sort_order: 1 },
    ]);
  });

  it('inserts new ingredient with source=ai and links it', async () => {
    repo.findByExactName.and.resolveTo(null);
    repo.insert.and.resolveTo({ id: 'ing-new', name: 'Hành lá' } as IngredientListItem);

    const result = buildResult([newRow('Hành lá', 30)]);
    const out = await applier.apply(result, { fuzzyDecisions: new Map() });

    expect(repo.insert).toHaveBeenCalledTimes(1);
    expect(repo.insert.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({
        name: 'Hành lá',
        source: 'ai',
        calories: 100,
      }),
    );
    expect(out.createdIngredientIds).toEqual(['ing-new']);
    expect(out.dishIngredients).toEqual([
      { ingredient_id: 'ing-new', gram_weight: 30, sort_order: 0 },
    ]);
  });

  it('reuses existing ingredient (case-insensitive match) instead of inserting duplicate', async () => {
    repo.findByExactName.and.resolveTo({ id: 'ing-exist', name: 'Hành Lá' } as IngredientListItem);

    const out = await applier.apply(buildResult([newRow('Hành lá', 25)]), {
      fuzzyDecisions: new Map(),
    });

    expect(repo.insert).not.toHaveBeenCalled();
    expect(out.createdIngredientIds).toEqual([]);
    expect(out.dishIngredients[0].ingredient_id).toBe('ing-exist');
  });

  it('fuzzyConfirm: accept-suggestion uses suggestedMatchId without insert', async () => {
    const result = buildResult([fuzzyRow({ id: 'ing-suggest', name: 'Cà chua' })]);
    const decisions = new Map<number, FuzzyConfirmDecision>([[0, 'accept-suggestion']]);

    const out = await applier.apply(result, { fuzzyDecisions: decisions });

    expect(repo.insert).not.toHaveBeenCalled();
    expect(out.dishIngredients[0].ingredient_id).toBe('ing-suggest');
  });

  it('fuzzyConfirm: reject-create-new inserts pendingNew payload', async () => {
    repo.findByExactName.and.resolveTo(null);
    repo.insert.and.resolveTo({ id: 'ing-fresh', name: 'Cà chu' } as IngredientListItem);

    const result = buildResult([fuzzyRow({ id: 'ing-suggest', name: 'Cà chua' })]);
    const decisions = new Map<number, FuzzyConfirmDecision>([[0, 'reject-create-new']]);

    const out = await applier.apply(result, { fuzzyDecisions: decisions });

    expect(repo.insert).toHaveBeenCalledTimes(1);
    expect(out.createdIngredientIds).toEqual(['ing-fresh']);
    expect(out.dishIngredients[0].ingredient_id).toBe('ing-fresh');
  });

  it('throws when fuzzyConfirm row has no decision', async () => {
    const result = buildResult([fuzzyRow({ id: 'ing-suggest', name: 'Cà chua' })]);

    await expectAsync(applier.apply(result, { fuzzyDecisions: new Map() })).toBeRejectedWithError(
      /Missing fuzzyDecision for row 0/,
    );
  });

  it('dedups two new rows with same normalized name (only inserts once)', async () => {
    // Round 1: not found → insert. Round 2: findByExactName returns the just-created row.
    let inserted: IngredientListItem | null = null;
    repo.findByExactName.and.callFake(async () => inserted);
    repo.insert.and.callFake(async (payload) => {
      inserted = { id: 'ing-once', name: payload.name } as IngredientListItem;
      return inserted;
    });

    const result = buildResult([newRow('Tỏi', 5), newRow('Tỏi', 3)]);
    const out = await applier.apply(result, { fuzzyDecisions: new Map() });

    expect(repo.insert).toHaveBeenCalledTimes(1);
    expect(out.createdIngredientIds).toEqual(['ing-once']);
    expect(out.dishIngredients).toEqual([
      { ingredient_id: 'ing-once', gram_weight: 5, sort_order: 0 },
      { ingredient_id: 'ing-once', gram_weight: 3, sort_order: 1 },
    ]);
  });
});
