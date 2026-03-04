/**
 * Localization helpers for bilingual (vi/en) string fields.
 * Use `getLocalizedField` everywhere a Dish.name, Ingredient.name,
 * or Ingredient.unit is rendered or compared as a plain string.
 */

import type { SupportedLang, LocalizedString } from '../types';

/**
 * Reads the correct locale variant from a LocalizedString.
 * Also accepts a plain `string` for backward-compat during migration.
 */
export const getLocalizedField = (
  field: string | LocalizedString,
  lang: SupportedLang,
): string => {
  if (typeof field === 'string') return field;
  return field[lang] || field.vi || field.en || '';
};

/**
 * Wraps a plain string as a LocalizedString by duplicating the value
 * in both locales. No-ops if already a LocalizedString.
 */
export const toLocalized = (value: string | LocalizedString): LocalizedString => {
  if (typeof value !== 'string') return value;
  return { vi: value, en: value };
};
