import type { UserProfile } from '../models/user-profile.model';

export type KeyMetric = 'calories' | 'protein' | 'carbs' | 'fat';

/**
 * One bucket per (level, goal) combination. Drives Smart Key Metric routing
 * for F-04 surfaces (S1 Dashboard, S2 DaySummary, S3 Week color band).
 *
 * Mapping per F-04 §2.5:
 *   beginner level     → 'beginner' (any goal)
 *   intermediate + lose_weight  → 'lose'
 *   intermediate + gain_muscle  → 'gain'
 *   intermediate + maintain     → 'maintain'
 *   intermediate + performance  → fallback 'gain' (defer dual-equal Phase 4)
 *   advanced level     → 'advanced' (any goal)
 */
export type KeyMetricVariant = 'beginner' | 'lose' | 'gain' | 'maintain' | 'advanced';

type Level = UserProfile['fitness_level'];
type Goal = UserProfile['goal'];

/**
 * Pure router — never throws, defaults to `'beginner'` on null/missing input
 * so callers can render the safest variant without guards.
 */
export function routeKeyMetric(
  level: Level | null | undefined,
  goal: Goal | null | undefined,
): KeyMetricVariant {
  if (level === 'beginner') return 'beginner';
  if (level === 'advanced') return 'advanced';
  // intermediate (or unknown level) — branch on goal
  if (goal === 'lose_weight') return 'lose';
  if (goal === 'gain_muscle') return 'gain';
  if (goal === 'maintain') return 'maintain';
  if (goal === 'performance') return 'gain'; // Phase 4 will introduce dual-equal variant
  return 'beginner'; // null/unknown → safest default
}

/**
 * Visible metric set per variant (used by MacroRow / DashboardCard to decide
 * which mini bars/rings to render). Order is meaningful — first metric is the
 * key (large ring), remaining are secondary.
 */
export function visibleMetrics(variant: KeyMetricVariant): readonly KeyMetric[] {
  switch (variant) {
    case 'beginner':
      return ['calories'];
    case 'lose':
      return ['calories', 'protein'];
    case 'gain':
      return ['protein', 'calories'];
    case 'maintain':
      return ['calories', 'protein'];
    case 'advanced':
      return ['calories', 'protein', 'carbs', 'fat'];
  }
}

/**
 * Convenience: extract `[primary, secondary]` from a profile in one call.
 * Beginner returns `['calories', 'calories']` (secondary unused — caller
 * checks `visibleMetrics().length`).
 */
export function pickKeyMetric(profile: UserProfile | null | undefined): [KeyMetric, KeyMetric] {
  const variant = routeKeyMetric(profile?.fitness_level, profile?.goal);
  const metrics = visibleMetrics(variant);
  return [metrics[0], metrics[1] ?? metrics[0]];
}
