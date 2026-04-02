import { beforeEach, describe, expect, it } from 'vitest';

import { useDishStore } from '../store/dishStore';
import type { Dish } from '../types';

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

describe('dishStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('setDishes', () => {
    it('sets dishes from an array', () => {
      useDishStore.getState().setDishes([SAMPLE_DISH]);

      expect(useDishStore.getState().dishes).toHaveLength(1);
      expect(useDishStore.getState().dishes[0]).toEqual(SAMPLE_DISH);
    });

    it('replaces all dishes with empty array', () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH] });

      useDishStore.getState().setDishes([]);

      expect(useDishStore.getState().dishes).toEqual([]);
    });

    it('accepts an updater function', () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH] });

      useDishStore.getState().setDishes(prev => [...prev, DISH_VI_ONLY]);

      expect(useDishStore.getState().dishes).toHaveLength(2);
    });
  });

  describe('addDish', () => {
    it('adds a dish to the store', () => {
      useDishStore.getState().addDish(SAMPLE_DISH);

      expect(useDishStore.getState().dishes).toHaveLength(1);
      expect(useDishStore.getState().dishes[0]).toEqual(SAMPLE_DISH);
    });

    it('appends to existing dishes', () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH] });

      useDishStore.getState().addDish(DISH_VI_ONLY);

      expect(useDishStore.getState().dishes).toHaveLength(2);
      expect(useDishStore.getState().dishes[1]).toEqual(DISH_VI_ONLY);
    });

    it('handles dish without optional fields', () => {
      useDishStore.getState().addDish(DISH_VI_ONLY);

      const dish = useDishStore.getState().dishes[0];
      expect(dish.rating).toBeUndefined();
      expect(dish.notes).toBeUndefined();
      expect(dish.name).toEqual({ vi: 'Phở bò' });
    });
  });

  describe('updateDish', () => {
    it('updates an existing dish by id', () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH] });

      const updated: Dish = {
        ...SAMPLE_DISH,
        name: { vi: 'Cơm gà xối mỡ', en: 'Fried chicken rice' },
        ingredients: [{ ingredientId: 'ing-3', amount: 250 }],
        tags: ['lunch'],
        rating: 5,
      };

      useDishStore.getState().updateDish(updated);

      const { dishes } = useDishStore.getState();
      expect(dishes).toHaveLength(1);
      expect(dishes[0].name.vi).toBe('Cơm gà xối mỡ');
      expect(dishes[0].ingredients).toHaveLength(1);
      expect(dishes[0].rating).toBe(5);
    });

    it('does not modify other dishes', () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH, DISH_VI_ONLY] });

      const updated = { ...SAMPLE_DISH, rating: 5 };
      useDishStore.getState().updateDish(updated);

      const { dishes } = useDishStore.getState();
      expect(dishes).toHaveLength(2);
      expect(dishes[0].rating).toBe(5);
      expect(dishes[1]).toEqual(DISH_VI_ONLY);
    });
  });

  describe('deleteDish', () => {
    it('removes a dish by id', () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH] });

      useDishStore.getState().deleteDish('dish-1');

      expect(useDishStore.getState().dishes).toHaveLength(0);
    });

    it('only removes the targeted dish', () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH, DISH_VI_ONLY] });

      useDishStore.getState().deleteDish('dish-1');

      const { dishes } = useDishStore.getState();
      expect(dishes).toHaveLength(1);
      expect(dishes[0].id).toBe('dish-2');
    });

    it('is a no-op when id does not exist', () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH] });

      useDishStore.getState().deleteDish('non-existent');

      expect(useDishStore.getState().dishes).toHaveLength(1);
    });
  });

  describe('isIngredientUsed', () => {
    it('returns true when ingredient is used in a dish', () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH] });

      expect(useDishStore.getState().isIngredientUsed('ing-1')).toBe(true);
    });

    it('returns false when ingredient is not used', () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH] });

      expect(useDishStore.getState().isIngredientUsed('ing-99')).toBe(false);
    });

    it('returns false when no dishes exist', () => {
      expect(useDishStore.getState().isIngredientUsed('ing-1')).toBe(false);
    });
  });

  describe('LocalizedString handling', () => {
    it('preserves both vi and en fields', () => {
      useDishStore.getState().addDish(SAMPLE_DISH);

      const dish = useDishStore.getState().dishes[0];
      expect(dish.name).toEqual({ vi: 'Cơm gà', en: 'Chicken rice' });
    });

    it('handles name with only vi field', () => {
      useDishStore.getState().addDish(DISH_VI_ONLY);

      const dish = useDishStore.getState().dishes[0];
      expect(dish.name).toEqual({ vi: 'Phở bò' });
      expect('en' in dish.name).toBe(false);
    });
  });

  describe('Tags handling', () => {
    it('preserves tags array', () => {
      useDishStore.getState().addDish(SAMPLE_DISH);

      const dish = useDishStore.getState().dishes[0];
      expect(dish.tags).toEqual(['lunch', 'dinner']);
    });

    it('handles empty tags array', () => {
      const dish: Dish = { ...SAMPLE_DISH, id: 'd3', tags: [] };
      useDishStore.getState().addDish(dish);

      expect(useDishStore.getState().dishes[0].tags).toEqual([]);
    });
  });

  describe('loadAll', () => {
    it('loads dishes with ingredients from database', async () => {
      const mockDb = {
        query: vi
          .fn()
          .mockResolvedValueOnce([
            {
              id: 'db-dish-1',
              name_vi: 'Phở',
              name_en: 'Pho',
              tags: '["soup"]',
              rating: 5,
              notes: 'Delicious',
            },
          ])
          .mockResolvedValueOnce([
            { ingredient_id: 'ing-1', amount: 200 },
            { ingredient_id: 'ing-2', amount: 100 },
          ]),
      };

      await useDishStore.getState().loadAll(mockDb as never);

      const { dishes } = useDishStore.getState();
      expect(dishes).toHaveLength(1);
      expect(dishes[0].id).toBe('db-dish-1');
      expect(dishes[0].name).toEqual({ vi: 'Phở', en: 'Pho' });
      expect(dishes[0].tags).toEqual(['soup']);
      expect(dishes[0].rating).toBe(5);
      expect(dishes[0].notes).toBe('Delicious');
      expect(dishes[0].ingredients).toEqual([
        { ingredientId: 'ing-1', amount: 200 },
        { ingredientId: 'ing-2', amount: 100 },
      ]);
    });

    it('loads dish without optional fields (name_en, rating, notes)', async () => {
      const mockDb = {
        query: vi
          .fn()
          .mockResolvedValueOnce([
            {
              id: 'db-dish-2',
              name_vi: 'Bún bò',
              name_en: null,
              tags: '["noodle"]',
              rating: null,
              notes: null,
            },
          ])
          .mockResolvedValueOnce([]),
      };

      await useDishStore.getState().loadAll(mockDb as never);

      const { dishes } = useDishStore.getState();
      expect(dishes).toHaveLength(1);
      expect(dishes[0].name).toEqual({ vi: 'Bún bò' });
      expect(dishes[0].rating).toBeUndefined();
      expect(dishes[0].notes).toBeUndefined();
      expect(dishes[0].ingredients).toEqual([]);
    });

    it('does nothing when database returns empty rows', async () => {
      useDishStore.setState({ dishes: [SAMPLE_DISH] });

      const mockDb = {
        query: vi.fn().mockResolvedValue([]),
      };

      await useDishStore.getState().loadAll(mockDb as never);

      expect(useDishStore.getState().dishes).toHaveLength(1);
    });

    it('loads multiple dishes from database', async () => {
      const mockDb = {
        query: vi
          .fn()
          .mockResolvedValueOnce([
            { id: 'd1', name_vi: 'A', name_en: null, tags: '[]', rating: null, notes: null },
            { id: 'd2', name_vi: 'B', name_en: 'B-en', tags: '["tag"]', rating: 3, notes: 'note' },
          ])
          .mockResolvedValueOnce([{ ingredient_id: 'i1', amount: 50 }])
          .mockResolvedValueOnce([]),
      };

      await useDishStore.getState().loadAll(mockDb as never);

      const { dishes } = useDishStore.getState();
      expect(dishes).toHaveLength(2);
      expect(dishes[0].ingredients).toEqual([{ ingredientId: 'i1', amount: 50 }]);
      expect(dishes[1].ingredients).toEqual([]);
    });
  });
});
