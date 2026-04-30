import { TestBed } from '@angular/core/testing';
import { Database } from '../services/database/database';
import { IngredientRepository, type CreateIngredientInput } from './ingredient.repository';

describe('IngredientRepository (gram-only v6)', () => {
  let repo: IngredientRepository;
  let db: jasmine.SpyObj<Database>;
  let queryResponses: unknown[][];

  const ingredientRow = {
    id: 'ingredient-1',
    name: 'Trứng gà',
    category: 'Trứng & Sữa',
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    fiber: 0,
    source: 'db',
    created_at: '2026-04-26T00:00:00Z',
    updated_at: null,
  };

  const createInput: CreateIngredientInput = {
    name: 'Trứng gà',
    category: 'Trứng & Sữa',
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    fiber: 0,
    source: 'db',
  };

  beforeEach(() => {
    queryResponses = [];
    db = jasmine.createSpyObj<Database>('DatabaseService', [
      'initialize',
      'execute',
      'query',
      'getOne',
    ]);
    db.query.and.callFake(async () => (queryResponses.shift() ?? []) as never[]);
    db.getOne.and.callFake(async () => null);

    TestBed.configureTestingModule({
      providers: [IngredientRepository, { provide: Database, useValue: db }],
    });

    repo = TestBed.inject(IngredientRepository);
  });

  it('lists ingredients without unit hydration JOIN', async () => {
    queryResponses.push([ingredientRow]);

    const items = await repo.list();

    expect(items.length).toBe(1);
    expect(items[0].name).toBe('Trứng gà');
    expect(db.query).toHaveBeenCalledTimes(1);
    const sql = db.query.calls.argsFor(0)[0] as string;
    expect(sql).not.toContain('ingredient_unit');
    expect(sql).not.toContain('JOIN unit');
  });

  it('searches by name using LIKE query', async () => {
    queryResponses.push([ingredientRow]);

    const items = await repo.searchByName('trứng');

    expect(items.length).toBe(1);
    expect(db.query.calls.argsFor(0)[1]).toEqual(['%trứng%']);
  });

  it('inserts ingredient with gram-only columns', async () => {
    db.getOne.and.callFake(async () => ingredientRow as never);

    const saved = await repo.insert(createInput);

    expect(saved.name).toBe('Trứng gà');
    expect(db.execute.calls.count()).toBe(1);
    const insertArgs = db.execute.calls.argsFor(0);
    expect(insertArgs[0]).toContain('INSERT INTO ingredient');
    expect(insertArgs[0]).not.toContain('nutrition_basis_unit');
    expect(insertArgs[0]).not.toContain('density_g_per_ml');
    expect(insertArgs[0]).not.toContain('ingredient_unit');
    expect(insertArgs[1]).toEqual([
      jasmine.any(String),
      'Trứng gà',
      'Trứng & Sữa',
      155,
      13,
      1.1,
      11,
      0,
      'db',
    ]);
  });

  it('flips source db to manual on update', async () => {
    db.getOne.and.callFake(async () => ingredientRow as never);

    await repo.update('ingredient-1', { name: 'Trứng gà ta' });

    const updateArgs = db.execute.calls.argsFor(0);
    expect(updateArgs[0]).toContain('source = ?');
    expect(updateArgs[1]).toContain('manual');
  });

  it('deletes ingredient by id', async () => {
    await repo.delete('ingredient-1');
    expect(db.execute).toHaveBeenCalledWith('DELETE FROM ingredient WHERE id = ?', [
      'ingredient-1',
    ]);
  });

  describe('findRecentlyUsed', () => {
    it('returns ingredients ordered by MRU and limited', async () => {
      queryResponses.push([ingredientRow]);

      const result = await repo.findRecentlyUsed(5);

      const sqlArg = db.query.calls.argsFor(0)[0] as string;
      expect(sqlArg).toContain('FROM ingredient i');
      expect(sqlArg).toContain('INNER JOIN');
      expect(sqlArg).toContain('dish_ingredient');
      expect(sqlArg).toContain('MAX(COALESCE(d.updated_at, d.created_at))');
      expect(sqlArg).toContain('ORDER BY recent.last_used DESC');
      expect(sqlArg).toContain('LIMIT ?');
      expect(db.query.calls.argsFor(0)[1]).toEqual([5]);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('ingredient-1');
    });

    it('returns empty array when no ingredient is used in any dish', async () => {
      queryResponses.push([]);

      const result = await repo.findRecentlyUsed(5);

      expect(result).toEqual([]);
    });
  });
});
