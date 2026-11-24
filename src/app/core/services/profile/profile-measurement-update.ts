import { bodyMeasurementError, isProfileGender } from '../../models/body-measurements';
import type { UserProfile } from '../../models/user-profile.model';
import { birthDateError } from './profile-birth-date';
import { automaticTargetUpdate, profileCalculationInput, recalcTargets } from './recalc-targets';
import { validManualTarget } from './manual-targets';

type ProfileData = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;

const targetModeFields = {
  calories: 'calorie_target_mode',
  protein: 'protein_target_mode',
  carbs: null,
  fat: null,
} as const;

function checkMeasurement(field: 'heightCm' | 'weightKg', value: unknown): void {
  const error = bodyMeasurementError(field, value);
  if (error) throw new Error(error);
}

export function validateProfileChanges(
  patch: Partial<ProfileData>,
  current: ProfileData | null,
  today: Date,
): void {
  if (!current || (Object.hasOwn(patch, 'birth_date') && patch.birth_date !== current.birth_date)) {
    const error = birthDateError(patch.birth_date ?? '', today);
    if (error) throw new Error(error);
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
  const calculated = automaticTargetUpdate(
    {
      ...profileCalculationInput(current, today),
      target_calories: current.target_calories,
      target_protein: current.target_protein,
      calorie_target_mode: next.calorie_target_mode,
      protein_target_mode: next.protein_target_mode,
    },
    recalcTargets(profileCalculationInput(next, today)),
  );
  const result = { ...patch };
  for (const field of ['bmr', 'tdee', 'target_calories', 'target_protein'] as const) {
    const value = calculated[field];
    if (value !== undefined && (value !== current[field] || field in patch)) result[field] = value;
  }
  return result;
}
