import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDishStore } from '../store/dishStore';
import type { Dish } from '../types';
import type { DatabaseService } from '../services/databaseService';

function createMockDb(overrides: Partial<DatabaseService> = {}): DatabaseService {
  return {
    initialize: vi.fn(),
    execute: vi.fn(),
    query: vi.fn().mockResolvedValue([]),
    queryOne: vi.fn().mockResolvedValue(null),
    transaction: vi.fn().mockImplementation(async (fn: () => Promise<void>) => fn()),
    exportToJSON: vi.fn(),
    importFromJSON: vi.fn(),
    ...overrides,
  };
}

const SAMPLE_DISH: Dish = {
  id: 'dish-1',
  name: { vi: 'Cơm gà', en: 'Chicken rice' },
  ingredients: [
    { ingredientId: 'ing-1', amount: 200 },
    { ingredientId: 'ing-2', amount: 150 },
  ],
  tags: ['lunch', 'dinner'],
  rating: 4,
  notes: 'Món ngon',
};

const DISH_VI_ONLY: Dish = {
  id: 'dish-2',
  name: { vi: 'Phở bò' },
  ingredients: [{ ingredientId: 'ing-3', amount: 300 }],
  tags: ['breakfast'],
};

function resetStore() {
  useDishStore.setState({ dishes: [] });
}

describe('dishStore — SQLite methods', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('loadDishesFromDb', () => {
    it('loads dishes with ingredients from SQLite', async () => {
      const db = createMockDb({
        query: vi.fn()
          .mockResolvedValueOnce([
            { id: 'dish-1', nameVi: 'Cơm gà', nameEn: 'Chicken rice', tags: '["lunch","dinner"]', rating: 4, notes: 'Món ngon' },
          ])
          .mockResolvedValueOnce([
            { dishId: 'dish-1', ingredientId: 'ing-1', amount: 200 },
            { dishId: 'dish-1', ingredientId: 'ing-2', amount: 150 },
          ]),
      });

      await useDishStore.getState().loadDishesFromDb(db);

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, name_vi, name_en, tags, rating, notes FROM dishes',
      );
      expect(db.query).toHaveBeenCalledWith(
        'SELECT dish_id, ingredient_id, amount FROM dish_ingredients',
      );

      const { dishes } = useDishStore.getState();
      expect(dishes).toHaveLength(1);
      expect(dishes[0]).toEqual(SAMPLE_DISH);
    });

    it('handles empty database', async () => {
      const db = createMockDb({
        query: vi.fn().mockResolvedValue([]),
      });

      await useDishStore.getState().loadDishesFromDb(db);

      expect(useDishStore.getState().dishes).toEqual([]);
    });

    it('handles dishes with no ingredients', async () => {
      const db = createMockDb({
        query: vi.fn()
          .mockResolvedValueOnce([
            { id: 'dish-2', nameVi: 'Phở bò', nameEn: null, tags: '["breakfast"]', rating: null, notes: null },
          ])
          .mockResolvedValueOnce([]),
      });

      await useDishStore.getState().loadDishesFromDb(db);

      const { dishes } = useDishStore.getState();
      expect(dishes).toHaveLength(1);
      expect(dishes[0]).toEqual({
        id: 'dish-2',
        name: { vi: 'Phở bò' },
        ingredients: [],
        tags: ['breakfast'],
      });
    });
  });

  describe('addDishToDb', () => {
    it('inserts into dishes and dish_ingredients tables', async () => {
      const db = createMockDb();

      await useDishStore.getState().addDishToDb(db, SAMPLE_DISH);

      expect(db.transaction).toHaveBeenCalledTimes(1);
      expect(db.execute).toHaveBeenCalledTimes(3);

      const calls = (db.execute as ReturnType<typeof vi.fn>).mock.calls;
      const [dishSql, dishParams] = calls[0] as [string, unknown[]];
      expect(dishSql).toContain('INSERT INTO dishes');
      expect(dishParams).toEqual([
        'dish-1', 'Cơm gà', 'Chicken rice', '["lunch","dinner"]', 4, 'Món ngon',
      ]);

      const [ing1Sql, ing1Params] = calls[1] as [string, unknown[]];
      expect(ing1Sql).toContain('INSERT INTO dish_ingredients');
      expect(ing1Params).toEqual(['dish-1', 'ing-1', 200]);

      const [, ing2Params] = calls[2] as [string, unknown[]];
      expect(ing2Params).toEqual(['dish-1', 'ing-2', 150]);

      expect(useDishStore.getState().dishes).toHaveLength(1);
      expect(useDishStore.getState().dishes[0]).toEqual(SAMPLE_DISH);
    });

    it('handles dish without optional fields', async () => {
      const db = createMockDb();

      await useDishStore.getState().addDishToDb(db, DISH_VI_ONLY);

      const calls = (db.execute as ReturnType<typeof vi.fn>).mock.calls;
      const [, dishParams] = calls[0] as [string, unknown[]];
      expect(dishParams).toEqual([
        'dish-2', 'Phở bò', null, '["breakfast"]', null, null,
      ]);
    });
  });

  describe('updateDishInDb', () => {
    it('updates dish and replaces ingredients', async () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH] });

      const updated: Dish = {
        ...SAMPLE_DISH,
        name: { vi: 'Cơm gà xối mỡ', en: 'Fried chicken rice' },
        ingredients: [{ ingredientId: 'ing-3', amount: 250 }],
        tags: ['lunch'],
        rating: 5,
      };

      const db = createMockDb();
      await useDishStore.getState().updateDishInDb(db, updated);

      expect(db.transaction).toHaveBeenCalledTimes(1);

      const calls = (db.execute as ReturnType<typeof vi.fn>).mock.calls;
      const [updateSql, updateParams] = calls[0] as [string, unknown[]];
      expect(updateSql).toContain('UPDATE dishes SET');
      expect(updateParams).toEqual([
        'Cơm gà xối mỡ', 'Fried chicken rice', '["lunch"]', 5, 'Món ngon', 'dish-1',
      ]);

      const [deleteSql, deleteParams] = calls[1] as [string, unknown[]];
      expect(deleteSql).toContain('DELETE FROM dish_ingredients');
      expect(deleteParams).toEqual(['dish-1']);

      const [insertSql, insertParams] = calls[2] as [string, unknown[]];
      expect(insertSql).toContain('INSERT INTO dish_ingredients');
      expect(insertParams).toEqual(['dish-1', 'ing-3', 250]);

      const { dishes } = useDishStore.getState();
      expect(dishes).toHaveLength(1);
      expect(dishes[0].name.vi).toBe('Cơm gà xối mỡ');
      expect(dishes[0].ingredients).toHaveLength(1);
    });
  });

  describe('deleteDishFromDb', () => {
    it('deletes dish (CASCADE handles ingredients)', async () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH] });

      const db = createMockDb();
      await useDishStore.getState().deleteDishFromDb(db, 'dish-1');

      expect(db.execute).toHaveBeenCalledWith(
        'DELETE FROM dishes WHERE id = ?',
        ['dish-1'],
      );
      expect(useDishStore.getState().dishes).toHaveLength(0);
    });
  });

  describe('LocalizedString transforms', () => {
    it('preserves both vi and en fields', async () => {
      const db = createMockDb({
        query: vi.fn()
          .mockResolvedValueOnce([
            { id: 'd1', nameVi: 'Bún chả', nameEn: 'Bun cha', tags: '["lunch"]', rating: null, notes: null },
          ])
          .mockResolvedValueOnce([]),
      });

      await useDishStore.getState().loadDishesFromDb(db);

      const dish = useDishStore.getState().dishes[0];
      expect(dish.name).toEqual({ vi: 'Bún chả', en: 'Bun cha' });
    });

    it('omits en when null', async () => {
      const db = createMockDb({
        query: vi.fn()
          .mockResolvedValueOnce([
            { id: 'd2', nameVi: 'Phở', nameEn: null, tags: '["breakfast"]', rating: null, notes: null },
          ])
          .mockResolvedValueOnce([]),
      });

      await useDishStore.getState().loadDishesFromDb(db);

      const dish = useDishStore.getState().dishes[0];
      expect(dish.name).toEqual({ vi: 'Phở' });
      expect('en' in dish.name).toBe(false);
    });

    it('writes vi/en correctly to SQL params', async () => {
      const db = createMockDb();
      const dish: Dish = {
        id: 'd3',
        name: { vi: 'Bánh mì', en: 'Bread' },
        ingredients: [],
        tags: ['breakfast'],
      };

      await useDishStore.getState().addDishToDb(db, dish);

      const [, params] = (db.execute as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown[]];
      expect(params[1]).toBe('Bánh mì');
      expect(params[2]).toBe('Bread');
    });
  });

  describe('Tags JSON roundtrip', () => {
    it('serializes tags array to JSON string', async () => {
      const db = createMockDb();
      await useDishStore.getState().addDishToDb(db, SAMPLE_DISH);

      const [, params] = (db.execute as ReturnType<typeof vi.fn>).mock.calls[0] as [string, unknown[]];
      expect(params[3]).toBe('["lunch","dinner"]');
    });

    it('deserializes tags JSON string to MealType array', async () => {
      const db = createMockDb({
        query: vi.fn()
          .mockResolvedValueOnce([
            { id: 'd1', nameVi: 'Test', nameEn: null, tags: '["breakfast","lunch","dinner"]', rating: null, notes: null },
          ])
          .mockResolvedValueOnce([]),
      });

      await useDishStore.getState().loadDishesFromDb(db);

      const dish = useDishStore.getState().dishes[0];
      expect(dish.tags).toEqual(['breakfast', 'lunch', 'dinner']);
    });

    it('handles empty tags array', async () => {
      const db = createMockDb({
        query: vi.fn()
          .mockResolvedValueOnce([
            { id: 'd1', nameVi: 'Test', nameEn: null, tags: '[]', rating: null, notes: null },
          ])
          .mockResolvedValueOnce([]),
      });

      await useDishStore.getState().loadDishesFromDb(db);

      const dish = useDishStore.getState().dishes[0];
      expect(dish.tags).toEqual([]);
    });
  });

  describe('backward compatibility', () => {
    it('in-memory addDish still works without db', () => {
      useDishStore.getState().addDish(SAMPLE_DISH);
      expect(useDishStore.getState().dishes).toHaveLength(1);
    });

    it('in-memory updateDish still works without db', () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH] });
      const updated = { ...SAMPLE_DISH, rating: 5 };
      useDishStore.getState().updateDish(updated);
      expect(useDishStore.getState().dishes[0].rating).toBe(5);
    });

    it('in-memory deleteDish still works without db', () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH] });
      useDishStore.getState().deleteDish('dish-1');
      expect(useDishStore.getState().dishes).toHaveLength(0);
    });
  });
});
