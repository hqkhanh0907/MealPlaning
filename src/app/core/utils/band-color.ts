/**
 * Band color classification for nutrient/calorie progress rings.
 *
 * Per arch §10.1 + F-04 §2 universal band table:
 *
 * | pct band | class    | token                  |
 * |----------|----------|------------------------|
 * | 0–49     | `low`    | `--ion-color-danger`   |
 * | 50–79    | `medium` | `--ion-color-warning`  |
 * | 80–110   | `good`   | `--ion-color-success`  |
 * | 111–120  | `medium` | `--ion-color-warning`  |
 * | >120     | `high`   | `--ion-color-danger`   |
 *
 * `pct` is expected to be the value already clamped by the caller to
 * [0, 200] (CalorieRing handles the clamp). NaN / negative / non-finite
 * input falls back to `low` so the UI degrades safely instead of throwing.
 *
 * The `variant` arg is reserved for future per-macro tweaks (e.g. fat
 * over-target tolerated wider) — currently unused but kept in the
 * signature to match arch contract DEC-09 §10.1.
 */
export type KeyMetric = 'calories' | 'protein' | 'carbs' | 'fat';
export type BandClass = 'low' | 'medium' | 'good' | 'high';

export function bandColor(pct: number, _variant: KeyMetric): BandClass {
  if (typeof pct !== 'number' || !Number.isFinite(pct) || pct < 50) {
    return 'low';
  }
  if (pct < 80) return 'medium';
  if (pct <= 110) return 'good';
  if (pct <= 120) return 'medium';
  return 'high';
}
