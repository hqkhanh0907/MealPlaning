import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useIngredientStore,
  rowToIngredient,
  ingredientToParams,
} from '../store/ingredientStore';
import type { DatabaseService } from '../services/databaseService';
import type { Ingredient } from '../types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
function createMockDb(overrides: Partial<DatabaseService> = {}): DatabaseService {
  return {
    initialize: vi.fn(),
    execute: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
    transaction: vi.fn(),
    exportToJSON: vi.fn(),
    importFromJSON: vi.fn(),
    ...overrides,
  };
}

function resetStore() {
  useIngredientStore.setState({ ingredients: [] });
}

const SAMPLE_INGREDIENT: Ingredient = {
  id: 'ing-test-01',
  name: { vi: 'Ức gà', en: 'Chicken breast' },
  caloriesPer100: 165,
  proteinPer100: 31,
  carbsPer100: 0,
  fatPer100: 4,
  fiberPer100: 0,
  unit: { vi: 'g', en: 'g' },
};

const SAMPLE_INGREDIENT_NO_EN: Ingredient = {
  id: 'ing-test-02',
  name: { vi: 'Khoai lang' },
  caloriesPer100: 86,
  proteinPer100: 2,
  carbsPer100: 20,
  fatPer100: 0,
  fiberPer100: 3,
  unit: { vi: 'g' },
};

const SAMPLE_DB_ROW = {
  id: 'ing-test-01',
  nameVi: 'Ức gà',
  nameEn: 'Chicken breast',
  caloriesPer100: 165,
  proteinPer100: 31,
  carbsPer100: 0,
  fatPer100: 4,
  fiberPer100: 0,
  unitVi: 'g',
  unitEn: 'g',
};

const SAMPLE_DB_ROW_NO_EN = {
  id: 'ing-test-02',
  nameVi: 'Khoai lang',
  nameEn: null,
  caloriesPer100: 86,
  proteinPer100: 2,
  carbsPer100: 20,
  fatPer100: 0,
  fiberPer100: 3,
  unitVi: 'g',
  unitEn: null,
};

/* ================================================================== */
/*  Data transformation tests                                          */
/* ================================================================== */
describe('rowToIngredient', () => {
  it('transforms a DB row with en fields to Ingredient', () => {
    const result = rowToIngredient(SAMPLE_DB_ROW);
    expect(result).toEqual(SAMPLE_INGREDIENT);
  });

  it('transforms a DB row without en fields (null) to Ingredient', () => {
    const result = rowToIngredient(SAMPLE_DB_ROW_NO_EN);
    expect(result).toEqual(SAMPLE_INGREDIENT_NO_EN);
  });

  it('omits en key when nameEn is null', () => {
    const result = rowToIngredient(SAMPLE_DB_ROW_NO_EN);
    expect('en' in result.name).toBe(false);
    expect('en' in result.unit).toBe(false);
  });
});

describe('ingredientToParams', () => {
  it('converts Ingredient with en to flat param array', () => {
    const params = ingredientToParams(SAMPLE_INGREDIENT);
    expect(params).toEqual([
      'ing-test-01',
      'Ức gà',
      'Chicken breast',
      165,
      31,
      0,
      4,
      0,
      'g',
      'g',
    ]);
  });

  it('converts Ingredient without en to flat param array with nulls', () => {
    const params = ingredientToParams(SAMPLE_INGREDIENT_NO_EN);
    expect(params).toEqual([
      'ing-test-02',
      'Khoai lang',
      null,
      86,
      2,
      20,
      0,
      3,
      'g',
      null,
    ]);
  });
});

/* ================================================================== */
/*  SQLite-backed store methods                                        */
/* ================================================================== */
describe('ingredientStore — SQLite methods', () => {
  beforeEach(() => {
    resetStore();
  });

  it('loadIngredients loads from SQLite and transforms rows', async () => {
    const db = createMockDb({
      query: vi.fn().mockResolvedValue([SAMPLE_DB_ROW, SAMPLE_DB_ROW_NO_EN]),
    });

    await useIngredientStore.getState().loadIngredients(db);

    expect(db.query).toHaveBeenCalledWith('SELECT * FROM ingredients');

    const { ingredients } = useIngredientStore.getState();
    expect(ingredients).toHaveLength(2);
    expect(ingredients[0]).toEqual(SAMPLE_INGREDIENT);
    expect(ingredients[1]).toEqual(SAMPLE_INGREDIENT_NO_EN);
  });

  it('loadIngredients sets empty array when table is empty', async () => {
    const db = createMockDb({ query: vi.fn().mockResolvedValue([]) });

    await useIngredientStore.getState().loadIngredients(db);

    expect(useIngredientStore.getState().ingredients).toEqual([]);
  });

  it('addIngredientToDb inserts into SQLite and updates state', async () => {
    const db = createMockDb();

    await useIngredientStore.getState().addIngredientToDb(db, SAMPLE_INGREDIENT);

    expect(db.execute).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(db.execute).mock.calls[0];
    expect(callArgs[0]).toContain('INSERT INTO ingredients');
    expect(callArgs[1]).toEqual(ingredientToParams(SAMPLE_INGREDIENT));

    const { ingredients } = useIngredientStore.getState();
    expect(ingredients).toHaveLength(1);
    expect(ingredients[0]).toEqual(SAMPLE_INGREDIENT);
  });

  it('addIngredientToDb appends to existing ingredients', async () => {
    useIngredientStore.setState({ ingredients: [SAMPLE_INGREDIENT] });
    const db = createMockDb();

    await useIngredientStore.getState().addIngredientToDb(db, SAMPLE_INGREDIENT_NO_EN);

    const { ingredients } = useIngredientStore.getState();
    expect(ingredients).toHaveLength(2);
    expect(ingredients[1]).toEqual(SAMPLE_INGREDIENT_NO_EN);
  });

  it('updateIngredientInDb updates SQLite row and state', async () => {
    useIngredientStore.setState({ ingredients: [SAMPLE_INGREDIENT] });
    const db = createMockDb();

    const updated: Ingredient = {
      ...SAMPLE_INGREDIENT,
      name: { vi: 'Ức gà nướng', en: 'Grilled chicken breast' },
      caloriesPer100: 180,
    };

    await useIngredientStore.getState().updateIngredientInDb(db, updated);

    expect(db.execute).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(db.execute).mock.calls[0];
    expect(callArgs[0]).toContain('UPDATE ingredients SET');
    expect(callArgs[1]).toEqual([
      'Ức gà nướng',
      'Grilled chicken breast',
      180,
      31,
      0,
      4,
      0,
      'g',
      'g',
      'ing-test-01',
    ]);

    const { ingredients } = useIngredientStore.getState();
    expect(ingredients).toHaveLength(1);
    expect(ingredients[0].name.vi).toBe('Ức gà nướng');
    expect(ingredients[0].caloriesPer100).toBe(180);
  });

  it('deleteIngredientFromDb removes from SQLite and state', async () => {
    useIngredientStore.setState({ ingredients: [SAMPLE_INGREDIENT, SAMPLE_INGREDIENT_NO_EN] });
    const db = createMockDb();

    await useIngredientStore.getState().deleteIngredientFromDb(db, 'ing-test-01');

    expect(db.execute).toHaveBeenCalledWith('DELETE FROM ingredients WHERE id = ?', ['ing-test-01']);

    const { ingredients } = useIngredientStore.getState();
    expect(ingredients).toHaveLength(1);
    expect(ingredients[0].id).toBe('ing-test-02');
  });

  it('deleteIngredientFromDb on non-existent id leaves state unchanged', async () => {
    useIngredientStore.setState({ ingredients: [SAMPLE_INGREDIENT] });
    const db = createMockDb();

    await useIngredientStore.getState().deleteIngredientFromDb(db, 'non-existent');

    expect(useIngredientStore.getState().ingredients).toHaveLength(1);
  });
});

/* ================================================================== */
/*  Backward-compatible sync methods                                   */
/* ================================================================== */
describe('ingredientStore — sync methods (localStorage fallback)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('addIngredient adds to state synchronously', () => {
    useIngredientStore.getState().addIngredient(SAMPLE_INGREDIENT);

    expect(useIngredientStore.getState().ingredients).toEqual([SAMPLE_INGREDIENT]);
  });

  it('updateIngredient updates existing ingredient', () => {
    useIngredientStore.setState({ ingredients: [SAMPLE_INGREDIENT] });

    const updated: Ingredient = { ...SAMPLE_INGREDIENT, caloriesPer100: 200 };
    useIngredientStore.getState().updateIngredient(updated);

    expect(useIngredientStore.getState().ingredients[0].caloriesPer100).toBe(200);
  });

  it('setIngredients replaces all ingredients', () => {
    useIngredientStore.getState().setIngredients([SAMPLE_INGREDIENT, SAMPLE_INGREDIENT_NO_EN]);

    expect(useIngredientStore.getState().ingredients).toHaveLength(2);
  });

  it('setIngredients with updater function', () => {
    useIngredientStore.setState({ ingredients: [SAMPLE_INGREDIENT] });

    useIngredientStore.getState().setIngredients((prev) => [
      ...prev,
      SAMPLE_INGREDIENT_NO_EN,
    ]);

    expect(useIngredientStore.getState().ingredients).toHaveLength(2);
  });
});
