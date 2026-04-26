export interface ManagementSchemaSnapshot {
  userVersion: number;
  ingredientColumns: readonly string[];
  dishColumns: readonly string[];
  dishIngredientColumns: readonly string[];
}

function hasTable(columns: readonly string[]): boolean {
  return columns.length > 0;
}

function hasColumns(columns: readonly string[], required: readonly string[]): boolean {
  return required.every((column) => columns.includes(column));
}

export function shouldResetLegacyManagementSchema(snapshot: ManagementSchemaSnapshot): boolean {
  if (snapshot.userVersion !== 0) {
    return false;
  }

  const ingredientLooksLegacy =
    hasTable(snapshot.ingredientColumns) &&
    !hasColumns(snapshot.ingredientColumns, ['category', 'default_entry_unit', 'nutrition_basis_unit']);

  const dishLooksLegacy =
    hasTable(snapshot.dishColumns) && !hasColumns(snapshot.dishColumns, ['type', 'servings']);

  const dishIngredientLooksLegacy =
    hasTable(snapshot.dishIngredientColumns) &&
    !hasColumns(snapshot.dishIngredientColumns, ['amount_unit', 'normalized_amount']);

  return ingredientLooksLegacy || dishLooksLegacy || dishIngredientLooksLegacy;
}
