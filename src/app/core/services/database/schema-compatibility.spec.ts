import {
  shouldResetLegacyManagementSchema,
  type ManagementSchemaSnapshot,
} from './schema-compatibility';

describe('shouldResetLegacyManagementSchema (canonical v1, gram-only)', () => {
  const buildSnapshot = (
    overrides: Partial<ManagementSchemaSnapshot> = {},
  ): ManagementSchemaSnapshot => ({
    userVersion: 0,
    ingredientColumns: ['id', 'name', 'category', 'calories', 'protein', 'carbs', 'fat', 'fiber'],
    dishColumns: ['id', 'name', 'type', 'servings'],
    dishIngredientColumns: ['id', 'dish_id', 'ingredient_id', 'gram_weight', 'sort_order'],
    ...overrides,
  });

  it('does not reset when schema already matches gram-only baseline', () => {
    expect(shouldResetLegacyManagementSchema(buildSnapshot())).toBeFalse();
  });

  it('does not reset when user_version already advanced', () => {
    expect(shouldResetLegacyManagementSchema(buildSnapshot({ userVersion: 1 }))).toBeFalse();
  });

  it('requests reset for legacy ingredient table missing category', () => {
    expect(
      shouldResetLegacyManagementSchema(
        buildSnapshot({ ingredientColumns: ['id', 'name', 'calories'] }),
      ),
    ).toBeTrue();
  });

  it('requests reset for legacy ingredient table still carrying nutrition_basis_unit', () => {
    expect(
      shouldResetLegacyManagementSchema(
        buildSnapshot({
          ingredientColumns: [
            'id',
            'name',
            'category',
            'calories',
            'protein',
            'carbs',
            'fat',
            'fiber',
            'nutrition_basis_unit',
          ],
        }),
      ),
    ).toBeTrue();
  });

  it('requests reset for legacy ingredient table still carrying density_g_per_ml', () => {
    expect(
      shouldResetLegacyManagementSchema(
        buildSnapshot({
          ingredientColumns: [
            'id',
            'name',
            'category',
            'calories',
            'protein',
            'carbs',
            'fat',
            'fiber',
            'density_g_per_ml',
          ],
        }),
      ),
    ).toBeTrue();
  });

  it('requests reset for legacy dish table missing type', () => {
    expect(
      shouldResetLegacyManagementSchema(buildSnapshot({ dishColumns: ['id', 'name'] })),
    ).toBeTrue();
  });

  it('requests reset for legacy dish_ingredient table missing gram_weight', () => {
    expect(
      shouldResetLegacyManagementSchema(
        buildSnapshot({
          dishIngredientColumns: [
            'id',
            'dish_id',
            'ingredient_id',
            'amount_value',
            'unit_id',
            'normalized_amount',
          ],
        }),
      ),
    ).toBeTrue();
  });

  it('requests reset for legacy dish_ingredient table still carrying amount_value', () => {
    expect(
      shouldResetLegacyManagementSchema(
        buildSnapshot({
          dishIngredientColumns: ['id', 'dish_id', 'ingredient_id', 'gram_weight', 'amount_value'],
        }),
      ),
    ).toBeTrue();
  });
});
