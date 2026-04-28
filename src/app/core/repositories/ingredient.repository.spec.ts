import { TestBed } from '@angular/core/testing';
import { Database } from '../services/database/database';
import { IngredientRepository, type CreateIngredientInput } from './ingredient.repository';

describe('IngredientRepository', () => {
  let repo: IngredientRepository;
  let db: jasmine.SpyObj<Database>;
  let queryResponses: unknown[][];

  const ingredientRow = {
    id: 'ingredient-1',
    name: 'Trứng gà',
    category: 'Trứng & Sữa',
    nutrition_basis_unit: 'g',
    nutrition_basis_quantity: 100,
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    fiber: 0,
    density_g_per_ml: null,
    source: 'db',
    created_at: '2026-04-26T00:00:00Z',
    updated_at: null,
  };

  const unitRows = [
    {
      ingredient_id: 'ingredient-1',
      unit_id: 'piece',
      factor_to_basis: 50,
      is_default: 1,
      display_label: 'quả',
      is_approximate: 0,
    },
  ];

  const createInput: CreateIngredientInput = {
    name: 'Trứng gà',
    category: 'Trứng & Sữa',
    nutrition_basis_unit: 'g',
    nutrition_basis_quantity: 100,
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    fiber: 0,
    density_g_per_ml: null,
    source: 'db',
    units: [
      {
        unit_id: 'piece',
        factor_to_basis: 50,
        is_default: 1,
        display_label: 'quả',
      },
    ],
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

  it('lists ingredients with hydrated units', async () => {
    queryResponses.push([ingredientRow], unitRows);

    const items = await repo.list();

    expect(items.length).toBe(1);
    expect(items[0].units.length).toBe(1);
    expect(items[0].units[0].display_label).toBe('quả');
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  it('searches by name using LIKE query', async () => {
    queryResponses.push([ingredientRow], unitRows);

    const items = await repo.searchByName('trứng');

    expect(items.length).toBe(1);
    expect(db.query.calls.argsFor(0)[1]).toEqual(['%trứng%']);
  });

  it('inserts ingredient and its units', async () => {
    db.getOne.and.callFake(async () => ingredientRow as never);
    queryResponses.push(unitRows);

    const saved = await repo.insert(createInput);

    expect(saved.name).toBe('Trứng gà');
    expect(db.execute.calls.count()).toBe(3);
    const insertArgs = db.execute.calls.argsFor(0);
    expect(insertArgs[0]).toContain('INSERT INTO ingredient');
    expect(insertArgs[0]).not.toContain('default_entry_unit');
    expect(insertArgs[1]).toEqual([
      jasmine.any(String),
      'Trứng gà',
      'Trứng & Sữa',
      'g',
      100,
      155,
      13,
      1.1,
      11,
      0,
      null,
      'db',
    ]);
    expect(db.execute.calls.argsFor(2)[0]).toContain('INSERT INTO ingredient_unit');
  });

  it('flips source db to manual on update', async () => {
    db.getOne.and.callFake(async (sql: string) => {
      if (sql.includes('SELECT * FROM ingredient WHERE id = ?')) {
        return ingredientRow as never;
      }
      return ingredientRow as never;
    });
    queryResponses.push(unitRows);

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
});
