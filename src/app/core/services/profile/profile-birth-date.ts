import { parseLocalDate } from '../../utils/local-date';

export function ageOnDate(birthDate: string, onDate = new Date()): number | null {
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
