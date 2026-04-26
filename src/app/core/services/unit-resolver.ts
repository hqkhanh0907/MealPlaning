import type {
  IngredientModel,
  IngredientUnitModel,
  UnitModel,
} from '../models/management.model';
import type { NutritionBasisUnit } from '../models/management.types';

export class InvalidDishIngredientUnitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDishIngredientUnitError';
  }
}

export interface ResolveUnitInput {
  ingredient: IngredientModel;
  unit: UnitModel;
  amountValue: number;
  ingredientUnit?: IngredientUnitModel | null;
}

export interface ResolveUnitResult {
  normalizedAmount: number;
  normalizedUnit: NutritionBasisUnit;
  isApproximate: boolean;
  displayUnit: string;
  conversionSource: 'ingredient_unit' | 'global' | 'density';
}

export function resolveUnit({
  ingredient,
  unit,
  amountValue,
  ingredientUnit,
}: ResolveUnitInput): ResolveUnitResult {
  const basisUnit = ingredient.nutrition_basis_unit;
  const displayUnit = ingredientUnit?.display_label ?? unit.short_name_vi;

  if (amountValue <= 0) {
    throw new InvalidDishIngredientUnitError('Amount value must be greater than 0.');
  }

  if (ingredientUnit) {
    return {
      normalizedAmount: amountValue * ingredientUnit.factor_to_basis,
      normalizedUnit: basisUnit,
      isApproximate: unit.is_approximate === 1,
      displayUnit,
      conversionSource: 'ingredient_unit',
    };
  }

  if (basisUnit === 'g' && unit.unit_type === 'mass' && unit.base_factor_g !== null) {
    return {
      normalizedAmount: amountValue * unit.base_factor_g,
      normalizedUnit: 'g',
      isApproximate: unit.is_approximate === 1,
      displayUnit,
      conversionSource: 'global',
    };
  }

  if (basisUnit === 'ml' && unit.unit_type === 'volume' && unit.base_factor_ml !== null) {
    return {
      normalizedAmount: amountValue * unit.base_factor_ml,
      normalizedUnit: 'ml',
      isApproximate: unit.is_approximate === 1,
      displayUnit,
      conversionSource: 'global',
    };
  }

  if (ingredient.density_g_per_ml !== null) {
    if (basisUnit === 'g' && unit.unit_type === 'volume' && unit.base_factor_ml !== null) {
      return {
        normalizedAmount: amountValue * unit.base_factor_ml * ingredient.density_g_per_ml,
        normalizedUnit: 'g',
        isApproximate: unit.is_approximate === 1,
        displayUnit,
        conversionSource: 'density',
      };
    }

    if (basisUnit === 'ml' && unit.unit_type === 'mass' && unit.base_factor_g !== null) {
      return {
        normalizedAmount: amountValue * unit.base_factor_g / ingredient.density_g_per_ml,
        normalizedUnit: 'ml',
        isApproximate: unit.is_approximate === 1,
        displayUnit,
        conversionSource: 'density',
      };
    }
  }

  throw new InvalidDishIngredientUnitError(
    `Cannot resolve unit '${unit.id}' for ingredient '${ingredient.name}' with basis '${basisUnit}'.`,
  );
}
