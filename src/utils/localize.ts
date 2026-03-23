/**
 * Localization helpers for Vietnamese string fields.
 * Use `getLocalizedField` everywhere a Dish.name, Ingredient.name,
 * or Ingredient.unit is rendered or compared as a plain string.
 */

import type { LocalizedString } from '../types';

/**
 * Reads the Vietnamese variant from a LocalizedString.
 * Also accepts a plain `string` for backward-compat during migration.
 */
export const getLocalizedField = (
  field: string | LocalizedString,
  _lang?: string,
): string => {
  if (typeof field === 'string') return field;
  return field.vi || '';
};

/**
 * Wraps a plain string as a LocalizedString by setting the vi locale.
 * No-ops if already a LocalizedString.
 */
export const toLocalized = (value: string | LocalizedString): LocalizedString => {
  if (typeof value !== 'string') return value;
  return { vi: value };
};
