/** Generate a cryptographically secure UUID v4 using the native Web Crypto API. */
export const generateUUID = (): string => crypto.randomUUID();

/**
 * Parse a YYYY-MM-DD string into a local Date (avoids UTC timezone issues).
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Get the Monday–Sunday week range for a given date string.
 */
export const getWeekRange = (dateStr: string): { start: Date; end: Date } => {
  const targetDate = parseLocalDate(dateStr);
  const day = targetDate.getDay();
  const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(targetDate);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Check if a date string falls within a given range.
 */
export const isDateInRange = (dateStr: string, start: Date, end: Date): boolean => {
  const d = parseLocalDate(dateStr);
  return d >= start && d <= end;
};
