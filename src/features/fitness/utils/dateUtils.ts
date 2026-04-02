/**
 * Shared date utilities for the fitness module.
 * Leaf module — imports only from standard library.
 */

export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date {
  const raw = dateStr.split('T')[0];
  const [y, m, d] = raw.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Returns ISO weekday: Mon=1 … Sun=7 */
export function getDayOfWeek(dateStr: string): number {
  const day = parseDate(dateStr).getDay();
  return day === 0 ? 7 : day;
}

export function addDays(dateStr: string, n: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

export function getMondayOfWeek(dateStr: string): string {
  const d = parseDate(dateStr);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return formatDate(d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000);
}

export function isToday(dateStr: string): boolean {
  return dateStr === formatDate(new Date());
}

export function getWeekBounds(offset = 0, referenceDate?: Date): { start: string; end: string } {
  const now = referenceDate ?? new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: formatDate(monday), end: formatDate(sunday) };
}
