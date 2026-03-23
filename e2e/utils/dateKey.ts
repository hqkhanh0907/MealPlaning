/**
 * Generate a local-timezone date key (YYYY-MM-DD) matching the app's format.
 * The app uses `new Date().getFullYear()/getMonth()/getDate()` (local time),
 * NOT `toISOString()` (which is always UTC).
 */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
