/**
 * Form value types for the ingredient edit page (gram-only — schema v6).
 *
 * Tất cả nutrition đều theo per-100g. Không còn nutrition_basis_unit, density,
 * units array, hay is_default. UI chỉ nhập số trực tiếp.
 *
 * @see docs/3-design/data-model.md §4.1 (v1.1)
 */
export interface IngredientEditFormValue {
  /** Tên nguyên liệu (Vietnamese, max 100). */
  name: string;
  /** Nhóm nguyên liệu — phải nằm trong INGREDIENT_CATEGORIES. */
  category: string;
  /** kcal per 100 g. `null` = chưa nhập. */
  calories: number | null;
  /** Protein (g) per 100 g. */
  protein: number | null;
  /** Carbs (g) per 100 g. */
  carbs: number | null;
  /** Fat (g) per 100 g. */
  fat: number | null;
  /** Fiber (g) per 100 g. */
  fiber: number | null;
}
