import type { ActivityLevel } from '../../models/user-profile.types';

/**
 * Canonical Vietnamese labels for the four activity levels.
 *
 * - `short`: parallel structure `Vận động {level}` (or `Ít vận động` for the
 *   bottom level). Used in summary rows / option titles.
 * - `long`: descriptive form including frequency. Used in onboarding step 3
 *   labels where the user is choosing for the first time and needs context.
 *
 * Reference: docs/3-design/design-system.md §8 + Story 2.4 AC-4.
 */
export interface ActivityLabel {
  readonly short: string;
  readonly long: string;
}

const ACTIVITY_LABELS: Readonly<Record<ActivityLevel, ActivityLabel>> = {
  sedentary: { short: 'Ít vận động', long: 'Ít vận động (ngồi nhiều)' },
  light: { short: 'Vận động nhẹ', long: 'Nhẹ (1-3 ngày/tuần)' },
  moderate: { short: 'Vận động vừa', long: 'Trung bình (3-5 ngày/tuần)' },
  heavy: { short: 'Vận động nặng', long: 'Nặng (6-7 ngày/tuần)' },
};

/**
 * Resolve the canonical label pair for an activity level.
 */
export function activityLabel(value: ActivityLevel): ActivityLabel {
  return ACTIVITY_LABELS[value];
}

/**
 * Convenience helpers for callsites that only need one variant.
 */
export function activityLabelShort(value: ActivityLevel): string {
  return ACTIVITY_LABELS[value].short;
}

export function activityLabelLong(value: ActivityLevel): string {
  return ACTIVITY_LABELS[value].long;
}
