import { shouldResetLegacyManagementSchema } from './schema-compatibility';

describe('Native schema compatibility guard', () => {
  it('marks legacy ingredient table shape for reset', () => {
    expect(
      shouldResetLegacyManagementSchema({
        userVersion: 0,
        ingredientColumns: ['id', 'name', 'calories'],
        dishColumns: ['id', 'name', 'type', 'servings'],
        dishIngredientColumns: [
          'id',
          'dish_id',
          'ingredient_id',
          'amount_unit',
          'normalized_amount',
        ],
      }),
    ).toBeTrue();
  });
});
