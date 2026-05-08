/**
 * Schema compatibility check — single canonical schema (v1, gram-only).
 *
 * Pre-release migration history was collapsed on 2026-05-08 (Story 2.6),
 * so SCHEMA_VERSION is now `1`. This guard still protects users who never
 * stamped `PRAGMA user_version` (any DB at v0) but already have legacy
 * tables on disk: when columns reflect pre-collapse shapes (basis_unit,
 * density, amount_value, unit_id, …), drop & recreate via the canonical
 * DDL. Migration runner handles the `userVersion < SCHEMA_VERSION` path.
 */
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

function hasAnyColumn(columns: readonly string[], forbidden: readonly string[]): boolean {
  return forbidden.some((column) => columns.includes(column));
}

export function shouldResetLegacyManagementSchema(snapshot: ManagementSchemaSnapshot): boolean {
  if (snapshot.userVersion !== 0) {
    return false;
  }

  // Ingredient phải đủ cột canonical (gram-only) VÀ không còn cột legacy đã drop.
  const ingredientLooksLegacy =
    hasTable(snapshot.ingredientColumns) &&
    (!hasColumns(snapshot.ingredientColumns, ['category', 'calories', 'protein']) ||
      hasAnyColumn(snapshot.ingredientColumns, [
        'nutrition_basis_unit',
        'nutrition_basis_quantity',
        'density_g_per_ml',
        'default_entry_unit',
      ]));

  const dishLooksLegacy =
    hasTable(snapshot.dishColumns) && !hasColumns(snapshot.dishColumns, ['type', 'servings']);

  // dish_ingredient phải có gram_weight và không còn amount_value/unit_id.
  const dishIngredientLooksLegacy =
    hasTable(snapshot.dishIngredientColumns) &&
    (!hasColumns(snapshot.dishIngredientColumns, ['gram_weight']) ||
      hasAnyColumn(snapshot.dishIngredientColumns, [
        'amount_value',
        'amount_unit',
        'unit_id',
        'normalized_amount',
      ]));

  return ingredientLooksLegacy || dishLooksLegacy || dishIngredientLooksLegacy;
}
