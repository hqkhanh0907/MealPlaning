import type { IngredientModel, IngredientUnitModel, UnitModel } from '../models/management.model';
import { InvalidDishIngredientUnitError, resolveUnit } from './unit-resolver';

describe('resolveUnit', () => {
  const chicken: IngredientModel = {
    id: 'ingredient-chicken',
    name: 'Ức gà',
    category: 'Thịt',
    nutrition_basis_unit: 'g',
    nutrition_basis_quantity: 100,
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    density_g_per_ml: null,
    source: 'db',
    created_at: '2026-04-26T00:00:00Z',
    updated_at: null,
  };

  const oliveOil: IngredientModel = {
    ...chicken,
    id: 'ingredient-olive-oil',
    name: 'Dầu olive',
    category: 'Dầu & Mỡ',
    nutrition_basis_unit: 'ml',
    density_g_per_ml: 0.91,
  };

  const unitG: UnitModel = {
    id: 'g',
    display_name_vi: 'gam',
    display_name_en: 'gram',
    short_name_vi: 'g',
    unit_type: 'mass',
    is_global: 1,
    base_factor_g: 1,
    base_factor_ml: null,
    is_approximate: 0,
    display_order: 1,
  };

  const unitKg: UnitModel = {
    ...unitG,
    id: 'kg',
    display_name_vi: 'kilogam',
    display_name_en: 'kilogram',
    short_name_vi: 'kg',
    base_factor_g: 1000,
  };

  const unitMl: UnitModel = {
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
  };

  const unitTbsp: UnitModel = {
    ...unitMl,
    id: 'tbsp',
    display_name_vi: 'muỗng canh',
    display_name_en: 'tablespoon',
    short_name_vi: 'muỗng canh',
    base_factor_ml: 15,
  };

  const unitPiece: UnitModel = {
    id: 'piece',
    display_name_vi: 'cái',
    display_name_en: 'piece',
    short_name_vi: 'cái',
    unit_type: 'count',
    is_global: 0,
    base_factor_g: null,
    base_factor_ml: null,
    is_approximate: 0,
    display_order: 3,
  };

  const unitPinch: UnitModel = {
    id: 'pinch',
    display_name_vi: 'nhúm',
    display_name_en: 'pinch',
    short_name_vi: 'nhúm',
    unit_type: 'cooking',
    is_global: 0,
    base_factor_g: null,
    base_factor_ml: null,
    is_approximate: 1,
    display_order: 4,
  };

  it('resolves same-dimension global mass unit', () => {
    const result = resolveUnit({ ingredient: chicken, unit: unitKg, amountValue: 0.2 });
    expect(result.normalizedAmount).toBe(200);
    expect(result.normalizedUnit).toBe('g');
    expect(result.conversionSource).toBe('global');
  });

  it('resolves ingredient-specific unit via factor_to_basis', () => {
    const ingredientUnit: IngredientUnitModel = {
      ingredient_id: chicken.id,
      unit_id: 'piece',
      factor_to_basis: 50,
      is_default: 1,
      display_label: 'quả',
    };

    const result = resolveUnit({
      ingredient: chicken,
      unit: unitPiece,
      amountValue: 2,
      ingredientUnit,
    });

    expect(result.normalizedAmount).toBe(100);
    expect(result.normalizedUnit).toBe('g');
    expect(result.displayUnit).toBe('quả');
    expect(result.conversionSource).toBe('ingredient_unit');
  });

  it('resolves cross-dimension unit via density fallback', () => {
    const result = resolveUnit({ ingredient: oliveOil, unit: unitG, amountValue: 9.1 });
    expect(result.normalizedAmount).toBeCloseTo(10, 6);
    expect(result.normalizedUnit).toBe('ml');
    expect(result.conversionSource).toBe('density');
  });

  it('keeps approximate flag for approximate units', () => {
    const ingredientUnit: IngredientUnitModel = {
      ingredient_id: chicken.id,
      unit_id: 'pinch',
      factor_to_basis: 0.3,
      is_default: 0,
      display_label: 'nhúm',
    };

    const result = resolveUnit({
      ingredient: chicken,
      unit: unitPinch,
      amountValue: 2,
      ingredientUnit,
    });

    expect(result.normalizedAmount).toBeCloseTo(0.6, 6);
    expect(result.isApproximate).toBeTrue();
  });

  it('rejects incompatible conversion when no factor or density exists', () => {
    expect(() => resolveUnit({ ingredient: chicken, unit: unitMl, amountValue: 50 })).toThrowError(
      InvalidDishIngredientUnitError,
    );
  });

  it('resolves global volume unit for ml basis', () => {
    const result = resolveUnit({ ingredient: oliveOil, unit: unitTbsp, amountValue: 2 });
    expect(result.normalizedAmount).toBe(30);
    expect(result.normalizedUnit).toBe('ml');
    expect(result.conversionSource).toBe('global');
  });
});
