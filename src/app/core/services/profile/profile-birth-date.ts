import { bodyMeasurementError } from '../../models/body-measurements';
import { parseLocalDate } from '../../utils/local-date';

export function ageOnDate(birthDate: string | null, onDate = new Date()): number | null {
  if (!birthDate) return null;
  const birth = parseLocalDate(birthDate);
  if (!Number.isFinite(birth.getTime()) || !Number.isFinite(onDate.getTime()) || birth > onDate) {
    return null;
  }

  const year = onDate.getFullYear();
  const month = birth.getMonth();
  // A February 29 birthday falls on February 28 in a common year.
  const anniversaryDay = Math.min(birth.getDate(), new Date(year, month + 1, 0).getDate());
  const beforeBirthday =
    onDate.getMonth() < month || (onDate.getMonth() === month && onDate.getDate() < anniversaryDay);
  return year - birth.getFullYear() - Number(beforeBirthday);
}

export function birthDateError(value: string, onDate = new Date()): string | null {
  if (!value) return 'Vui lòng nhập ngày sinh.';
  const age = ageOnDate(value, onDate);
  if (age === null) return 'Ngày sinh cần hợp lệ và không ở tương lai.';
  return bodyMeasurementError('age', age);
}
