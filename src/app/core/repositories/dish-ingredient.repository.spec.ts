import { TestBed } from '@angular/core/testing';
import { Database } from '../services/database/database';
import {
  DishIngredientRepository,
  type CreateDishIngredientInput,
} from './dish-ingredient.repository';

describe('DishIngredientRepository (gram-only v6)', () => {
  let repo: DishIngredientRepository;
  let db: jasmine.SpyObj<Database>;

  beforeEach(() => {
    db = jasmine.createSpyObj<Database>('DatabaseService', [
      'initialize',
      'execute',
      'query',
      'getOne',
    ]);

    TestBed.configureTestingModule({
      providers: [DishIngredientRepository, { provide: Database, useValue: db }],
    });

    repo = TestBed.inject(DishIngredientRepository);
  });

  it('inserts each item with gram_weight + sequential sort_order', async () => {
    const items: CreateDishIngredientInput[] = [
      { ingredient_id: 'ingredient-1', gram_weight: 100 },
      { ingredient_id: 'ingredient-2', gram_weight: 250 },
    ];

    await repo.bulkInsert('dish-1', items);

    expect(db.execute.calls.count()).toBe(2);
    const first = db.execute.calls.argsFor(0);
    expect(first[0]).toContain('INSERT INTO dish_ingredient');
    expect(first[0]).toContain('gram_weight');
    expect(first[0]).not.toContain('amount_value');
    expect(first[0]).not.toContain('normalized_amount');
    expect(first[0]).not.toContain('unit_id');
    expect(first[1]).toEqual([jasmine.any(String), 'dish-1', 'ingredient-1', 100, 0]);

    const second = db.execute.calls.argsFor(1);
    expect(second[1]?.[3]).toBe(250);
    expect(second[1]?.[4]).toBe(1);
  });

  it('honors explicit sort_order when provided', async () => {
    await repo.bulkInsert('dish-1', [
      { ingredient_id: 'ingredient-1', gram_weight: 50, sort_order: 5 },
    ]);
    expect(db.execute.calls.argsFor(0)[1]?.[4]).toBe(5);
  });

  it('rejects non-positive gram_weight', async () => {
    await expectAsync(
      repo.bulkInsert('dish-1', [{ ingredient_id: 'i-1', gram_weight: 0 }]),
    ).toBeRejectedWithError(/Invalid gram_weight/);

    await expectAsync(
      repo.bulkInsert('dish-1', [{ ingredient_id: 'i-1', gram_weight: -10 }]),
    ).toBeRejectedWithError(/Invalid gram_weight/);

    expect(db.execute).not.toHaveBeenCalled();
  });

  it('lists by dish ordered by sort_order then rowid', async () => {
    db.query.and.resolveTo([]);
    await repo.listByDish('dish-1');
    const sql = db.query.calls.argsFor(0)[0] as string;
    expect(sql).toContain('FROM dish_ingredient WHERE dish_id = ?');
    expect(sql).toContain('ORDER BY sort_order ASC, rowid ASC');
  });

  it('deletes by dish', async () => {
    await repo.deleteByDish('dish-1');
    expect(db.execute).toHaveBeenCalledWith('DELETE FROM dish_ingredient WHERE dish_id = ?', [
      'dish-1',
    ]);
  });
});
