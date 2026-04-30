/**
 * Schema compatibility check — gram-only revision (schema v6+).
 *
 * Nếu app gặp DB cũ ở v0 (không có user_version stamp) nhưng table đã tồn tại với
 * cấu trúc legacy (thiếu cột canonical hoặc còn cột bị drop ở v6), trả về true để
 * ép initializer drop & recreate. Migration runner có path riêng cho v≥1 → 6.
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
