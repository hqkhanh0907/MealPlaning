import { GENDER_LABELS, type Gender } from './user-profile.types';

export interface BodyMeasurementsDraft {
  heightCm: number | null;
  weightKg: number | null;
  birthDate: string;
  gender: Gender | null;
}

export const BODY_MEASUREMENT_LIMITS = {
  heightCm: { min: 100, max: 250, label: 'Chiều cao', unit: ' cm' },
  weightKg: { min: 30, max: 300, label: 'Cân nặng', unit: ' kg' },
  age: { min: 10, max: 120, label: 'Tuổi', unit: '' },
} as const;

export function bodyMeasurementError(
  field: keyof typeof BODY_MEASUREMENT_LIMITS,
  value: unknown,
): string | null {
  const { min, max, label, unit } = BODY_MEASUREMENT_LIMITS[field];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    return `${label} cần từ ${min} đến ${max}${unit}.`;
  }
  return field === 'age' && !Number.isInteger(value) ? 'Nhập tuổi theo số năm tròn.' : null;
}

export function isProfileGender(value: unknown): value is Gender {
  return typeof value === 'string' && Object.hasOwn(GENDER_LABELS, value);
}
