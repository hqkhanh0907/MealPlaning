import { TestBed } from '@angular/core/testing';
import { DatabaseService } from '../services/database/database.service';
import { DishIngredientRepository } from './dish-ingredient.repository';
import { DishRepository, type CreateDishInput } from './dish.repository';

describe('DishRepository', () => {
  let repo: DishRepository;
  let db: jasmine.SpyObj<DatabaseService>;
  let dishIngredientRepository: jasmine.SpyObj<DishIngredientRepository>;

  const createInput: CreateDishInput = {
    name: 'Cơm trứng',
    description: 'Cơm trắng và trứng gà',
    type: 'ingredient_based',
    source: 'custom',
    servings: 1,
    image_url: null,
  };

  const ingredientItems = [
    {
      ingredient_id: 'ingredient-1',
      amount_value: 2,
      unit_id: 'piece',
    },
  ];

  beforeEach(() => {
    db = jasmine.createSpyObj<DatabaseService>('DatabaseService', [
      'initialize',
      'execute',
      'query',
      'getOne',
      'withTransaction',
    ]);
    db.withTransaction.and.callFake(async <T>(callback: () => Promise<T>) => callback());
    db.getOne.and.callFake(async (sql: string) => {
      if (sql.includes('SELECT COUNT(*) AS ref_count FROM planned_dish')) {
        return { ref_count: 0 } as never;
      }
      return {
        id: 'dish-1',
        name: 'Cơm trứng',
        description: 'Cơm trắng và trứng gà',
        type: 'ingredient_based',
        source: 'custom',
        servings: 1,
        image_url: null,
        created_at: '2026-04-26T00:00:00Z',
        updated_at: null,
      } as never;
    });
    db.query.and.resolveTo([]);

    dishIngredientRepository = jasmine.createSpyObj<DishIngredientRepository>('DishIngredientRepository', [
      'listByDish',
      'bulkInsert',
      'deleteByDish',
    ]);
    dishIngredientRepository.listByDish.and.resolveTo([]);
    dishIngredientRepository.bulkInsert.and.resolveTo();
    dishIngredientRepository.deleteByDish.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        DishRepository,
        { provide: DatabaseService, useValue: db },
        { provide: DishIngredientRepository, useValue: dishIngredientRepository },
      ],
    });

    repo = TestBed.inject(DishRepository);
  });

  it('inserts dish and dish ingredients in one transaction', async () => {
    const saved = await repo.insert(createInput, ingredientItems);

    expect(saved.name).toBe('Cơm trứng');
    expect(db.withTransaction).toHaveBeenCalled();
    expect(db.execute).toHaveBeenCalled();
    expect(dishIngredientRepository.bulkInsert).toHaveBeenCalled();
    const [dishId, insertedItems] = dishIngredientRepository.bulkInsert.calls.argsFor(0) as [
      string,
      typeof ingredientItems,
    ];
    expect(typeof dishId).toBe('string');
    expect(dishId.length).toBeGreaterThan(0);
    expect(insertedItems).toEqual(ingredientItems);
  });

  it('counts references from planned_dish', async () => {
    const count = await repo.countReferences('dish-1');
    expect(count).toBe(0);
    expect(db.getOne).toHaveBeenCalledWith(
      'SELECT COUNT(*) AS ref_count FROM planned_dish WHERE dish_id = ?',
      ['dish-1'],
    );
  });
});
