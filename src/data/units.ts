/** Shared catalogue of common ingredient units with bilingual labels. */

export interface UnitEntry {
  vi: string;
  en: string;
  /** Display label in dropdown (defaults to vi if omitted). */
  label?: string;
}

export const COMMON_UNITS: UnitEntry[] = [
  { vi: 'g',             en: 'g',      label: 'g (gram)' },
  { vi: 'kg',            en: 'kg',     label: 'kg' },
  { vi: 'ml',            en: 'ml',     label: 'ml' },
  { vi: 'l',             en: 'l',      label: 'l (lít)' },
  { vi: 'cái',           en: 'piece',  label: 'cái' },
  { vi: 'quả',           en: 'fruit',  label: 'quả' },
  { vi: 'lát',           en: 'slice',  label: 'lát' },
  { vi: 'muỗng canh',    en: 'tbsp',   label: 'muỗng canh' },
  { vi: 'muỗng cà phê',  en: 'tsp',    label: 'muỗng cà phê' },
  { vi: 'bát',           en: 'bowl',   label: 'bát' },
  { vi: 'gói',           en: 'pack',   label: 'gói' },
  { vi: 'hộp',           en: 'box',    label: 'hộp' },
];
