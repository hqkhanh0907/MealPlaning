import { describe, it, expect, beforeEach } from 'vitest';
import { useIngredientStore } from '../store/ingredientStore';
import type { Ingredient } from '../types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
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

/* ================================================================== */
/*  Store method tests                                                  */
/* ================================================================== */
describe('ingredientStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('addIngredient', () => {
    it('adds an ingredient to the store', () => {
      useIngredientStore.getState().addIngredient(SAMPLE_INGREDIENT);

      const { ingredients } = useIngredientStore.getState();
      expect(ingredients).toHaveLength(1);
      expect(ingredients[0]).toEqual(SAMPLE_INGREDIENT);
    });

    it('appends to existing ingredients', () => {
      useIngredientStore.setState({ ingredients: [SAMPLE_INGREDIENT] });

      useIngredientStore.getState().addIngredient(SAMPLE_INGREDIENT_NO_EN);

      const { ingredients } = useIngredientStore.getState();
      expect(ingredients).toHaveLength(2);
      expect(ingredients[1]).toEqual(SAMPLE_INGREDIENT_NO_EN);
    });
  });

  describe('updateIngredient', () => {
    it('updates an existing ingredient by id', () => {
      useIngredientStore.setState({ ingredients: [SAMPLE_INGREDIENT] });

      const updated: Ingredient = {
        ...SAMPLE_INGREDIENT,
        name: { vi: 'Ức gà nướng', en: 'Grilled chicken breast' },
        caloriesPer100: 180,
      };

      useIngredientStore.getState().updateIngredient(updated);

      const { ingredients } = useIngredientStore.getState();
      expect(ingredients).toHaveLength(1);
      expect(ingredients[0].name.vi).toBe('Ức gà nướng');
      expect(ingredients[0].caloriesPer100).toBe(180);
    });

    it('does not modify other ingredients', () => {
      useIngredientStore.setState({
        ingredients: [SAMPLE_INGREDIENT, SAMPLE_INGREDIENT_NO_EN],
      });

      const updated: Ingredient = { ...SAMPLE_INGREDIENT, caloriesPer100: 200 };
      useIngredientStore.getState().updateIngredient(updated);

      const { ingredients } = useIngredientStore.getState();
      expect(ingredients).toHaveLength(2);
      expect(ingredients[0].caloriesPer100).toBe(200);
      expect(ingredients[1]).toEqual(SAMPLE_INGREDIENT_NO_EN);
    });
  });

  describe('setIngredients', () => {
    it('replaces all ingredients', () => {
      useIngredientStore.getState().setIngredients([SAMPLE_INGREDIENT, SAMPLE_INGREDIENT_NO_EN]);

      expect(useIngredientStore.getState().ingredients).toHaveLength(2);
    });

    it('accepts an updater function', () => {
      useIngredientStore.setState({ ingredients: [SAMPLE_INGREDIENT] });

      useIngredientStore.getState().setIngredients((prev) => [
        ...prev,
        SAMPLE_INGREDIENT_NO_EN,
      ]);

      expect(useIngredientStore.getState().ingredients).toHaveLength(2);
    });

    it('can clear all ingredients', () => {
      useIngredientStore.setState({
        ingredients: [SAMPLE_INGREDIENT, SAMPLE_INGREDIENT_NO_EN],
      });

      useIngredientStore.getState().setIngredients([]);

      expect(useIngredientStore.getState().ingredients).toEqual([]);
    });
  });

  describe('LocalizedString handling', () => {
    it('preserves both vi and en fields on name', () => {
      useIngredientStore.getState().addIngredient(SAMPLE_INGREDIENT);

      const ing = useIngredientStore.getState().ingredients[0];
      expect(ing.name).toEqual({ vi: 'Ức gà', en: 'Chicken breast' });
    });

    it('handles ingredient without en name', () => {
      useIngredientStore.getState().addIngredient(SAMPLE_INGREDIENT_NO_EN);

      const ing = useIngredientStore.getState().ingredients[0];
      expect(ing.name).toEqual({ vi: 'Khoai lang' });
      expect('en' in ing.name).toBe(false);
    });

    it('preserves both vi and en fields on unit', () => {
      useIngredientStore.getState().addIngredient(SAMPLE_INGREDIENT);

      const ing = useIngredientStore.getState().ingredients[0];
      expect(ing.unit).toEqual({ vi: 'g', en: 'g' });
    });

    it('handles ingredient without en unit', () => {
      useIngredientStore.getState().addIngredient(SAMPLE_INGREDIENT_NO_EN);

      const ing = useIngredientStore.getState().ingredients[0];
      expect(ing.unit).toEqual({ vi: 'g' });
      expect('en' in ing.unit).toBe(false);
    });
  });

  describe('nutrition data integrity', () => {
    it('preserves all nutrition fields', () => {
      useIngredientStore.getState().addIngredient(SAMPLE_INGREDIENT);

      const ing = useIngredientStore.getState().ingredients[0];
      expect(ing.caloriesPer100).toBe(165);
      expect(ing.proteinPer100).toBe(31);
      expect(ing.carbsPer100).toBe(0);
      expect(ing.fatPer100).toBe(4);
      expect(ing.fiberPer100).toBe(0);
    });

    it('update preserves all nutrition fields', () => {
      useIngredientStore.setState({ ingredients: [SAMPLE_INGREDIENT] });

      const updated: Ingredient = {
        ...SAMPLE_INGREDIENT,
        caloriesPer100: 200,
        proteinPer100: 35,
      };
      useIngredientStore.getState().updateIngredient(updated);

      const ing = useIngredientStore.getState().ingredients[0];
      expect(ing.caloriesPer100).toBe(200);
      expect(ing.proteinPer100).toBe(35);
      expect(ing.carbsPer100).toBe(0);
      expect(ing.fatPer100).toBe(4);
    });
  });
});
