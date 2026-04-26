import { TestBed } from '@angular/core/testing';
import { DatabaseService } from '../services/database/database.service';
import type {
  IngredientModel,
  IngredientUnitModel,
  UnitModel,
} from '../models/management.model';
import { InvalidDishIngredientUnitError } from '../services/unit-resolver';
import { DishIngredientRepository, type CreateDishIngredientInput } from './dish-ingredient.repository';

describe('DishIngredientRepository', () => {
  let repo: DishIngredientRepository;
  let db: jasmine.SpyObj<DatabaseService>;
  let queryResponses: unknown[][];

  const ingredient = {
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
  } satisfies IngredientModel;

  const unitPiece = {
    id: 'piece',
    display_name_vi: 'cái',
    display_name_en: 'piece',
    short_name_vi: 'cái',
    unit_type: 'count',
    is_global: 0,
    base_factor_g: null,
    base_factor_ml: null,
    is_approximate: 0,
    display_order: 1,
  } satisfies UnitModel;

  const ingredientUnit = {
    ingredient_id: ingredient.id,
    unit_id: unitPiece.id,
    factor_to_basis: 50,
    is_default: 1,
    display_label: 'quả',
  } satisfies IngredientUnitModel;

  const unitMl = {
    id: 'ml',
    display_name_vi: 'mililit',
    display_name_en: 'milliliter',
    short_name_vi: 'ml',
    unit_type: 'volume',
    is_global: 1,
    base_factor_g: null,
    base_factor_ml: 1,
    is_approximate: 0,
    display_order: 2,
  } satisfies UnitModel;

  beforeEach(() => {
    queryResponses = [];
    db = jasmine.createSpyObj<DatabaseService>('DatabaseService', ['initialize', 'execute', 'query', 'getOne']);
    db.getOne.and.callFake(async () => (queryResponses.shift()?.[0] ?? null) as never);

    TestBed.configureTestingModule({
      providers: [DishIngredientRepository, { provide: DatabaseService, useValue: db }],
    });

    repo = TestBed.inject(DishIngredientRepository);
  });

  it('normalizes bulk insert using ingredient unit factor', async () => {
    queryResponses.push([ingredient], [unitPiece], [ingredientUnit]);

    const items: CreateDishIngredientInput[] = [
      {
        ingredient_id: ingredient.id,
        amount_value: 2,
        unit_id: unitPiece.id,
      },
    ];

    await repo.bulkInsert('dish-1', items);

    expect(db.execute.calls.count()).toBe(1);
    const executeArgs = db.execute.calls.argsFor(0);
    expect(executeArgs[0]).toContain('INSERT INTO dish_ingredient');
    expect(executeArgs[1]?.[5]).toBe(100);
  });

  it('rejects unsupported conversion', async () => {
    queryResponses.push([ingredient], [unitMl], [null]);

    await expectAsync(
      repo.bulkInsert('dish-1', [
        {
          ingredient_id: ingredient.id,
          amount_value: 20,
          unit_id: unitMl.id,
        },
      ]),
    ).toBeRejectedWithError(InvalidDishIngredientUnitError);
  });
});
