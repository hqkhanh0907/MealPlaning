import { getMealTagOptions, getMealTypeLabels, getTagShortLabels } from '../data/constants';
import { initialDishes, initialIngredients } from '../data/initialData';

// Mock TFunction — returns the key as-is for structural assertions
const mockT = ((key: string) => key) as import('i18next').TFunction;

describe('constants', () => {
  it('getMealTagOptions returns 3 entries with correct structure', () => {
    const options = getMealTagOptions(mockT);
    expect(options).toHaveLength(3);
    options.forEach(opt => {
      expect(opt).toHaveProperty('type');
      expect(opt).toHaveProperty('label');
      expect(opt).toHaveProperty('icon');
      expect(typeof opt.label).toBe('string');
      expect(opt.icon).toBeDefined();
      expect(opt.icon).toHaveProperty('$$typeof');
    });
    expect(options.map(o => o.type)).toEqual(['breakfast', 'lunch', 'dinner']);
  });

  it('getMealTypeLabels maps all MealType values', () => {
    const labels = getMealTypeLabels(mockT);
    expect(Object.keys(labels)).toEqual(['breakfast', 'lunch', 'dinner']);
    Object.values(labels).forEach(v => expect(typeof v).toBe('string'));
  });

  it('getTagShortLabels maps all MealType values', () => {
    const labels = getTagShortLabels(mockT);
    expect(Object.keys(labels)).toEqual(['breakfast', 'lunch', 'dinner']);
    Object.values(labels).forEach(v => expect(typeof v).toBe('string'));
  });
});

describe('initialData', () => {
  it('initialIngredients is a non-empty array with valid structure', () => {
    expect(initialIngredients.length).toBeGreaterThan(0);
    initialIngredients.forEach(ing => {
      expect(ing.id).toBeTruthy();
      expect(ing.name).toBeTruthy();
      expect(typeof ing.caloriesPer100).toBe('number');
      expect(typeof ing.proteinPer100).toBe('number');
      expect(typeof ing.carbsPer100).toBe('number');
      expect(typeof ing.fatPer100).toBe('number');
      expect(typeof ing.fiberPer100).toBe('number');
      expect(ing.unit).toBeTruthy();
    });
  });

  it('initialIngredients has unique IDs', () => {
    const ids = initialIngredients.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('initialDishes is a non-empty array with valid structure', () => {
    expect(initialDishes.length).toBeGreaterThan(0);
    initialDishes.forEach(dish => {
      expect(dish.id).toBeTruthy();
      expect(dish.name).toBeTruthy();
      expect(Array.isArray(dish.tags)).toBe(true);
      expect(dish.tags.length).toBeGreaterThan(0);
      expect(Array.isArray(dish.ingredients)).toBe(true);
      expect(dish.ingredients.length).toBeGreaterThan(0);
    });
  });

  it('initialDishes ingredients reference valid initial ingredient IDs', () => {
    const ingredientIds = new Set(initialIngredients.map(i => i.id));
    initialDishes.forEach(dish => {
      dish.ingredients.forEach(di => {
        expect(ingredientIds.has(di.ingredientId)).toBe(true);
      });
    });
  });

  it('initialDishes has unique IDs', () => {
    const ids = initialDishes.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
