/**
 * Phase 1 §5.2 — Canonical unit conversion table.
 *
 * Maps every supported `unit_id` to a base SI unit (`g` or `ml`) plus a
 * conversion factor. This is the single source of truth used by:
 *   - build-composites.ts (AC9 — composite yield + component conversion)
 *   - build-ingredients.ts (ingredient_unit derivation in §5.2.4 expansion)
 *   - validate-seed.ts (sanity checks)
 *
 * V1 unit set is intentionally small. Add more as recipe authoring needs them;
 * never hardcode a new factor anywhere except this file.
 */
export type BaseUnit = 'g' | 'ml';

export interface UnitDefinition {
  id: string;
  /** What this unit converts to. */
  base: BaseUnit;
  /** How many of `base` make up 1 of this unit. */
  factor: number;
  label_vi: string;
}

export const UNITS: ReadonlyArray<UnitDefinition> = [
  // Mass
  { id: 'g', base: 'g', factor: 1, label_vi: 'gram' },
  { id: 'kg', base: 'g', factor: 1000, label_vi: 'kg' },
  // Volume (US/metric blend matching Vietnamese kitchen convention)
  { id: 'ml', base: 'ml', factor: 1, label_vi: 'ml' },
  { id: 'l', base: 'ml', factor: 1000, label_vi: 'lít' },
  { id: 'tsp', base: 'ml', factor: 5, label_vi: 'thìa cà phê' },
  { id: 'tbsp', base: 'ml', factor: 15, label_vi: 'thìa canh' },
  { id: 'cup', base: 'ml', factor: 240, label_vi: 'cốc' },
];

const UNIT_INDEX = new Map(UNITS.map((u) => [u.id, u]));

export function getUnit(id: string): UnitDefinition {
  const u = UNIT_INDEX.get(id);
  if (!u) throw new Error(`Unknown unit_id '${id}'. Add it to scripts/seed/units.ts.`);
  return u;
}

/**
 * Convert `quantity` of `from_unit_id` to grams (mass) using density when the
 * unit is volume-based and the ingredient defines `density_g_per_ml`.
 *
 * Throws if the conversion is impossible (volume unit + null density on a non-water
 * ingredient, or unit incompatible with the requested target).
 */
export function toGrams(
  quantity: number,
  from_unit_id: string,
  density_g_per_ml: number | null,
): number {
  const u = getUnit(from_unit_id);
  const inBase = quantity * u.factor;
  if (u.base === 'g') return inBase;
  // base === 'ml'  →  need density to convert to grams
  if (density_g_per_ml === null) {
    throw new Error(
      `Cannot convert ${quantity} ${from_unit_id} to grams: density_g_per_ml is null`,
    );
  }
  return inBase * density_g_per_ml;
}

/**
 * Convert `quantity` of `from_unit_id` to ml (volume) using density when needed.
 */
export function toMl(
  quantity: number,
  from_unit_id: string,
  density_g_per_ml: number | null,
): number {
  const u = getUnit(from_unit_id);
  const inBase = quantity * u.factor;
  if (u.base === 'ml') return inBase;
  if (density_g_per_ml === null || density_g_per_ml === 0) {
    throw new Error(
      `Cannot convert ${quantity} ${from_unit_id} to ml: density_g_per_ml is null/zero`,
    );
  }
  return inBase / density_g_per_ml;
}

/**
 * Convert quantity of `from_unit_id` to the canonical base unit `target_base`
 * for the ingredient (whatever its nutrition_basis_unit is).
 */
export function toBase(
  quantity: number,
  from_unit_id: string,
  target_base: BaseUnit,
  density_g_per_ml: number | null,
): number {
  return target_base === 'g'
    ? toGrams(quantity, from_unit_id, density_g_per_ml)
    : toMl(quantity, from_unit_id, density_g_per_ml);
}
