export function localIsoDate(date = new Date()): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(iso: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(NaN);
  const date = new Date(`${iso}T00:00:00`);
  return localIsoDate(date) === iso ? date : new Date(NaN);
}

export function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function shiftIsoDate(iso: string, days: number): string {
  return localIsoDate(addCalendarDays(parseLocalDate(iso), days));
}

export function mondayOfWeek(date: Date): Date {
  const monday = addCalendarDays(date, -((date.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function weekDates(startIso: string): string[] {
  const start = parseLocalDate(startIso);
  if (Number.isNaN(start.getTime())) return [];
  return Array.from({ length: 7 }, (_, day) => localIsoDate(addCalendarDays(start, day)));
}
