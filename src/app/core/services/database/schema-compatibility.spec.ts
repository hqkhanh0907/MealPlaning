import {
  shouldResetLegacyManagementSchema,
  type ManagementSchemaSnapshot,
} from './schema-compatibility';

describe('shouldResetLegacyManagementSchema', () => {
  const buildSnapshot = (
    overrides: Partial<ManagementSchemaSnapshot> = {},
  ): ManagementSchemaSnapshot => ({
    userVersion: 0,
    ingredientColumns: ['id', 'name', 'category', 'nutrition_basis_unit', 'default_entry_unit'],
    dishColumns: ['id', 'name', 'type', 'servings'],
    dishIngredientColumns: ['id', 'dish_id', 'ingredient_id', 'amount_unit', 'normalized_amount'],
    ...overrides,
  });

  it('does not reset when schema already matches expected v1 baseline', () => {
    expect(shouldResetLegacyManagementSchema(buildSnapshot())).toBeFalse();
  });

  it('does not reset when user_version already advanced', () => {
    expect(shouldResetLegacyManagementSchema(buildSnapshot({ userVersion: 2 }))).toBeFalse();
  });

  it('requests reset for legacy ingredient table missing category', () => {
    expect(
      shouldResetLegacyManagementSchema(
        buildSnapshot({ ingredientColumns: ['id', 'name', 'calories'] }),
      ),
    ).toBeTrue();
  });

  it('requests reset for legacy dish table missing type', () => {
    expect(
      shouldResetLegacyManagementSchema(buildSnapshot({ dishColumns: ['id', 'name'] })),
    ).toBeTrue();
  });

  it('requests reset for legacy dish_ingredient table missing amount_unit', () => {
    expect(
      shouldResetLegacyManagementSchema(
        buildSnapshot({ dishIngredientColumns: ['id', 'dish_id', 'ingredient_id'] }),
      ),
    ).toBeTrue();
  });
});
