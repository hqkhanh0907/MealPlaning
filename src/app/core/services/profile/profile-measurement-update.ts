import { bodyMeasurementError, isProfileGender } from '../../models/body-measurements';
import type { UserProfile } from '../../models/user-profile.model';
import { ageOnDate } from './profile-birth-date';
import { automaticTargetUpdate, recalcTargets } from './recalc-targets';
import { validManualTarget } from './manual-targets';

type ProfileData = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;

const targetModeFields = {
  calories: 'calorie_target_mode',
  protein: 'protein_target_mode',
  carbs: null,
  fat: null,
} as const;

function checkMeasurement(field: 'heightCm' | 'weightKg' | 'age', value: unknown): void {
  const error = bodyMeasurementError(field, value);
  if (error) throw new Error(error);
}

export function validateProfileChanges(
  patch: Partial<ProfileData>,
  current: ProfileData | null,
  today: Date,
): void {
  const birthDate = patch.birth_date === undefined ? current?.birth_date : patch.birth_date;
  if (patch.birth_date != null && patch.birth_date !== current?.birth_date) {
    const age = ageOnDate(patch.birth_date, today);
    if (age === null) throw new Error('Ngày sinh không hợp lệ.');
    checkMeasurement('age', age);
  }
  if (!birthDate && patch.age !== undefined && patch.age !== current?.age) {
    checkMeasurement('age', patch.age);
  }
  if (patch.weight_kg !== undefined && patch.weight_kg !== current?.weight_kg) {
    checkMeasurement('weightKg', patch.weight_kg);
  }
  if (patch.height_cm !== undefined && patch.height_cm !== current?.height_cm) {
    checkMeasurement('heightCm', patch.height_cm);
  }
  if (
    patch.gender !== undefined &&
    patch.gender !== current?.gender &&
    !isProfileGender(patch.gender)
  ) {
    throw new Error('Giới tính không hợp lệ.');
  }

  for (const key of ['calories', 'protein', 'carbs', 'fat'] as const) {
    const field = `target_${key}` as const;
    const mode = targetModeFields[key];
    if (mode && (patch[mode] ?? current?.[mode]) === 'auto') continue;
    const switchesToManual = mode && patch[mode] === 'manual' && current?.[mode] !== 'manual';
    if (!switchesToManual && (patch[field] === undefined || patch[field] === current?.[field]))
      continue;
    const target = patch[field] === undefined ? current?.[field] : patch[field];
    if (target === undefined || (mode && target === 0)) continue;
    if (!validManualTarget(key, target)) throw new Error('Mục tiêu dinh dưỡng không hợp lệ.');
  }
}

export function updateMeasurementTargets(
  current: ProfileData,
  patch: Partial<ProfileData>,
  today: Date,
): Partial<ProfileData> {
  const next = { ...current, ...patch };
  const age = next.birth_date ? (ageOnDate(next.birth_date, today) ?? next.age) : next.age;
  const recalculate =
    age !== current.age ||
    patch.age !== undefined ||
    patch.birth_date !== undefined ||
    patch.height_cm !== undefined ||
    patch.weight_kg !== undefined ||
    patch.gender !== undefined ||
    patch.goal !== undefined ||
    patch.activity_factor !== undefined ||
    patch.calorie_target_mode === 'auto' ||
    patch.protein_target_mode === 'auto' ||
    (patch.target_calories !== undefined && next.calorie_target_mode === 'auto') ||
    (patch.target_protein !== undefined && next.protein_target_mode === 'auto');
  if (!recalculate) return patch;

  const calculated = automaticTargetUpdate(
    {
      ...current,
      calorie_target_mode: next.calorie_target_mode,
      protein_target_mode: next.protein_target_mode,
    },
    recalcTargets({ ...next, age }),
  );
  return { ...patch, ...calculated, age };
}
