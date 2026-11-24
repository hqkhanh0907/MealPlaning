/**
 * Pure relative date label for the calendar header chip.
 *
 * Returns Vietnamese label per F-03 §2.2:
 *   today      → "Hôm nay"
 *   today - 1  → "Hôm qua"
 *   today + 1  → "Ngày mai"
 *   else       → "{Thứ N}, dd/mm/yy"   (vi-VN)
 *
 * Both args are ISO `yyyy-mm-dd`. Invalid input degrades to the raw
 * `target` string so callers can detect a bug instead of silently
 * showing today.
 */

import { parseLocalDate } from './local-date';

const VI_WEEKDAY: Record<number, string> = {
  0: 'Chủ Nhật',
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
};

function dayDelta(a: Date, b: Date): number {
  const aMid = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((aMid - bMid) / 86_400_000);
}

export function relativeDateLabel(target: string, today: string): string {
  const t = parseLocalDate(target);
  const td = parseLocalDate(today);
  if (Number.isNaN(t.getTime()) || Number.isNaN(td.getTime())) return target;

  const delta = dayDelta(t, td);
  if (delta === 0) return 'Hôm nay';
  if (delta === -1) return 'Hôm qua';
  if (delta === 1) return 'Ngày mai';

  const weekday = VI_WEEKDAY[t.getDay()];
  const dd = String(t.getDate()).padStart(2, '0');
  const mm = String(t.getMonth() + 1).padStart(2, '0');
  const yy = String(t.getFullYear()).slice(-2);
  return `${weekday}, ${dd}/${mm}/${yy}`;
}
