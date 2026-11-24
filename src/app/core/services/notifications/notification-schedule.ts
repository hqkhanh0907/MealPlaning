import type { SlotKey } from './notification-preferences';

interface Slot {
  id: number;
  key: SlotKey;
  title: string;
  body: string;
  hour: number;
  minute: number;
  weekday?: number;
}

export const REMINDER_SLOTS: readonly Slot[] = [
  {
    id: 101,
    key: 'morning',
    title: 'Bữa sáng',
    body: 'Hôm nay ăn gì? Ghi lại nhé.',
    hour: 7,
    minute: 30,
  },
  {
    id: 102,
    key: 'lunch',
    title: 'Bữa trưa',
    body: 'Đừng quên log bữa trưa.',
    hour: 12,
    minute: 0,
  },
  {
    id: 103,
    key: 'evening',
    title: 'Bữa tối',
    body: 'Cập nhật bữa tối nào.',
    hour: 18,
    minute: 30,
  },
  {
    id: 104,
    key: 'weekly',
    title: 'Tổng kết tuần',
    body: 'Xem tiến độ tuần qua.',
    hour: 20,
    minute: 0,
    weekday: 1,
  },
];

const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

export function reminderTimeLabel(slot: Slot): string {
  const hour = String(slot.hour).padStart(2, '0');
  const minute = String(slot.minute).padStart(2, '0');
  const prefix = slot.weekday ? weekdays[slot.weekday - 1] + ', khoảng' : 'Khoảng';
  return `${prefix} ${hour}:${minute}`;
}
