import type { TrainingProfile } from '@/features/fitness/types';
import type { Goal, HealthProfile } from '@/features/health-profile/types';
import { validateTargetWeight } from '@/schemas/goalValidation';

import type { CanonicalSurfaceState } from '../shared/surfaceState';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export type SetupStatus = 'configured' | 'incomplete' | 'needs-attention';

export interface SetupBadgeContract {
  status: SetupStatus;
  surfaceState: CanonicalSurfaceState;
  badgeLabel: string;
  title: string;
  summary: string;
  nextStep: string;
  optionalNote?: string;
}

export interface HealthProfileInput {
  name?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  activityLevel?: string | null;
  bodyFatPct?: number | null;
}

function hasText(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

function isPastDate(value: string | null | undefined): boolean {
  if (!hasText(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date < new Date();
}

function isValidHeight(value: number | null | undefined): boolean {
  return hasNumber(value) && value >= 100 && value <= 250;
}

function isValidWeight(value: number | null | undefined): boolean {
  return hasNumber(value) && value >= 30 && value <= 300;
}

function isValidBodyFat(value: number | null | undefined): boolean {
  return value == null || (hasNumber(value) && value >= 3 && value <= 60);
}

function isValidActivityLevel(value: string | null | undefined): boolean {
  return ['sedentary', 'light', 'moderate', 'active', 'extra_active'].includes(value ?? '');
}

export function canEstimateEnergy(input: HealthProfileInput | null | undefined): boolean {
  if (!input) return false;
  return (
    hasText(input.gender) &&
    isPastDate(input.dateOfBirth) &&
    isValidHeight(input.heightCm) &&
    isValidWeight(input.weightKg) &&
    isValidActivityLevel(input.activityLevel)
  );
}

function resolveHealthMissingReasonKey(primaryMissing: string, t: Translate): string {
  if (primaryMissing === t('healthProfile.dateOfBirth')) return 'settings.healthMissingDobReason';
  if (primaryMissing === t('healthProfile.height') || primaryMissing === t('healthProfile.weight')) {
    return 'settings.healthMissingMeasurementsReason';
  }
  if (primaryMissing === t('healthProfile.activityLevel')) return 'settings.healthMissingActivityReason';
  return 'settings.healthMissingIdentityReason';
}

function collectMissingFields(input: HealthProfileInput, t: Translate): string[] {
  const missing: string[] = [];
  if (!hasText(input.name)) missing.push(t('healthProfile.name'));
  if (!hasText(input.gender)) missing.push(t('healthProfile.gender'));
  if (!hasText(input.dateOfBirth)) missing.push(t('healthProfile.dateOfBirth'));
  if (!hasNumber(input.heightCm)) missing.push(t('healthProfile.height'));
  if (!hasNumber(input.weightKg)) missing.push(t('healthProfile.weight'));
  if (!hasText(input.activityLevel)) missing.push(t('healthProfile.activityLevel'));
  return missing;
}

function collectInvalidFields(input: HealthProfileInput, t: Translate): string[] {
  const invalid: string[] = [];
  if (hasText(input.dateOfBirth) && !isPastDate(input.dateOfBirth)) invalid.push(t('healthProfile.dateOfBirth'));
  if (hasNumber(input.heightCm) && !isValidHeight(input.heightCm)) invalid.push(t('healthProfile.height'));
  if (hasNumber(input.weightKg) && !isValidWeight(input.weightKg)) invalid.push(t('healthProfile.weight'));
  if (hasText(input.activityLevel) && !isValidActivityLevel(input.activityLevel)) {
    invalid.push(t('healthProfile.activityLevel'));
  }
  if (!isValidBodyFat(input.bodyFatPct)) invalid.push(t('healthProfile.bodyFat'));
  return invalid;
}

export function getHealthProfileSetupContract(
  input: HealthProfileInput | null | undefined,
  goal: Goal | null | undefined,
  t: Translate,
): SetupBadgeContract {
  if (!input) {
    return {
      status: 'incomplete',
      surfaceState: 'setup',
      badgeLabel: t('settings.readiness.incomplete'),
      title: t('settings.healthProfileSection'),
      summary: t('settings.healthMissingAllSummary'),
      nextStep: t('settings.healthMissingAllNextStep'),
    };
  }

  const requiredMissing = collectMissingFields(input, t);
  const invalidFields = collectInvalidFields(input, t);

  if (requiredMissing.length > 0) {
    const primaryMissing = requiredMissing[0];
    const reasonKey = resolveHealthMissingReasonKey(primaryMissing, t);

    return {
      status: 'incomplete',
      surfaceState: 'setup',
      badgeLabel: t('settings.readiness.incomplete'),
      title: t('settings.healthProfileSection'),
      summary: t('settings.healthIncompleteSummary', { field: primaryMissing }),
      nextStep: t(reasonKey),
    };
  }

  const goalConflict =
    goal && hasNumber(input.weightKg) && validateTargetWeight(goal.type, input.weightKg, goal.targetWeightKg) !== null;

  if (invalidFields.length > 0 || goalConflict) {
    return {
      status: 'needs-attention',
      surfaceState: 'warning',
      badgeLabel: t('settings.readiness.needsAttention'),
      title: t('settings.healthProfileSection'),
      summary: goalConflict
        ? t('settings.healthGoalConflictSummary')
        : t('settings.healthNeedsAttentionSummary', { field: invalidFields[0] }),
      nextStep: goalConflict ? t('settings.healthGoalConflictNextStep') : t('settings.healthNeedsAttentionNextStep'),
      optionalNote: input.bodyFatPct == null ? t('settings.healthOptionalBodyFatNote') : undefined,
    };
  }

  return {
    status: 'configured',
    surfaceState: 'success',
    badgeLabel: t('settings.readiness.configured'),
    title: t('settings.healthProfileSection'),
    summary: t('settings.healthConfiguredSummary'),
    nextStep: t('settings.healthConfiguredNextStep'),
    optionalNote: input.bodyFatPct == null ? t('settings.healthOptionalBodyFatNote') : undefined,
  };
}

export function getGoalSetupContract(
  goal: Goal | null | undefined,
  profile: HealthProfile | null | undefined,
  t: Translate,
) {
  if (!goal) {
    return {
      status: 'incomplete' as const,
      surfaceState: 'setup' as const,
      badgeLabel: t('settings.readiness.incomplete'),
      title: t('settings.goalSection'),
      summary: t('settings.goalMissingSummary'),
      nextStep: t('settings.goalMissingNextStep'),
    };
  }

  const hasConflict =
    profile &&
    hasNumber(profile.weightKg) &&
    validateTargetWeight(goal.type, profile.weightKg, goal.targetWeightKg) !== null;

  if (hasConflict) {
    return {
      status: 'needs-attention' as const,
      surfaceState: 'warning' as const,
      badgeLabel: t('settings.readiness.needsAttention'),
      title: t('settings.goalSection'),
      summary: t('settings.goalNeedsAttentionSummary'),
      nextStep: t('settings.goalNeedsAttentionNextStep'),
    };
  }

  return {
    status: 'configured' as const,
    surfaceState: 'success' as const,
    badgeLabel: t('settings.readiness.configured'),
    title: t('settings.goalSection'),
    summary: t('settings.goalConfiguredSummary', { goal: t(`goal.${goal.type}`) }),
    nextStep: t('settings.goalConfiguredNextStep'),
  };
}

export function getTrainingProfileSetupContract(trainingProfile: TrainingProfile | null | undefined, t: Translate) {
  if (!trainingProfile) {
    return {
      status: 'incomplete' as const,
      surfaceState: 'setup' as const,
      badgeLabel: t('settings.readiness.incomplete'),
      title: t('settings.trainingProfileSection'),
      summary: t('settings.trainingMissingSummary'),
      nextStep: t('settings.trainingMissingNextStep'),
    };
  }

  if (!hasNumber(trainingProfile.daysPerWeek) || !hasNumber(trainingProfile.sessionDurationMin)) {
    return {
      status: 'needs-attention' as const,
      surfaceState: 'warning' as const,
      badgeLabel: t('settings.readiness.needsAttention'),
      title: t('settings.trainingProfileSection'),
      summary: t('settings.trainingNeedsAttentionSummary'),
      nextStep: t('settings.trainingProfileEditHint'),
    };
  }

  return {
    status: 'configured' as const,
    surfaceState: 'success' as const,
    badgeLabel: t('settings.readiness.configured'),
    title: t('settings.trainingProfileSection'),
    summary: t('settings.trainingConfiguredSummary', {
      days: trainingProfile.daysPerWeek,
      minutes: trainingProfile.sessionDurationMin,
    }),
    nextStep: t('settings.trainingConfiguredNextStep'),
  };
}
