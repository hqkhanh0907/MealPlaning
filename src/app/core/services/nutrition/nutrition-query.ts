import { inject, Injectable } from '@angular/core';
import { Database } from '../database/database';
import { NUTRIENTS, ZERO_TOTALS, type NutritionTotals } from '../../models/nutrition';
import {
  DISH_PER_SERVING,
  effectivePlannedNutrient,
} from '../../repositories/dish-per-serving.sql';
import type { KeyMetric } from '../../utils/key-metric-router';
import { addCalendarDays, localIsoDate, parseLocalDate, weekDates } from '../../utils/local-date';

export type { NutritionTotals } from '../../models/nutrition';

const DAILY_NUTRITION_SUM = NUTRIENTS.map(
  (nutrient) => `COALESCE(SUM(${effectivePlannedNutrient(nutrient)}), 0) AS ${nutrient}`,
).join(', ');

/** One row of `weekTotals` — Mon..Sun, logged-only. */
export interface DayTotals extends NutritionTotals {
  date: string; // yyyy-MM-dd
}

/** One row of `trend` — `value` is the metric the caller asked for. */
export interface TrendPoint {
  date: string; // yyyy-MM-dd
  value: number;
}

const METRIC_TO_COLUMN: Readonly<Record<KeyMetric, 'calories' | 'protein' | 'carbs' | 'fat'>> = {
  calories: 'calories',
  protein: 'protein',
  carbs: 'carbs',
  fat: 'fat',
};

/**
 * Aggregate nutrition queries owned by Epic-4 (DEC-03). Lives separate from
 * `PlannedDishRepository` which owns row-level CRUD. All SUMs use
 * `effective_*` semantics (snapshot when is_completed=1, current recipe ×
 * servings when is_completed=0) per arch §10.2 / DEC-02.
 */
@Injectable({ providedIn: 'root' })
export class NutritionQuery {
  private readonly db = inject(Database);

  /**
   * Today's totals for Dashboard / DaySummary surfaces. Counts BOTH planned
   * and logged rows so the UI shows the full forecasted day.
   *
   * Index usage (DEC-06): `idx_day_plan_date` for the WHERE day_plan.date.
   */
  async dailyTotals(date: string): Promise<NutritionTotals> {
    const row = await this.db.getOne<NutritionTotals>(
      `SELECT ${DAILY_NUTRITION_SUM}
       FROM day_plan dp
       INNER JOIN meal_slot ms       ON ms.day_plan_id = dp.id
       INNER JOIN planned_dish pd    ON pd.meal_slot_id = ms.id
       INNER JOIN ${DISH_PER_SERVING} dwt ON dwt.id = pd.dish_id
       WHERE dp.date = ?`,
      [date],
    );
    return row ?? { ...ZERO_TOTALS };
  }

  /**
   * One row per date in [weekStart, weekStart+6d]. Returns 7 entries even when
   * a day has no logged rows (zero-fills via LEFT JOIN + COALESCE).
   *
   * LOGGED-ONLY per F-04 §4 (Week View is review-of-history, not forecast).
   *
   * Index usage (DEC-06): `idx_planned_dish_completed` for the
   * `pd.is_completed = 1` filter.
   */
  async weekTotals(weekStart: string): Promise<DayTotals[]> {
    const dates = weekDates(weekStart);
    if (dates.length === 0) return [];

    return this.loggedTotalsForDates(dates);
  }

  /**
   * Logged-only totals for caller-provided dates, preserving the input order and
   * zero-filling dates without a day_plan/logged row. Used by Dashboard streaks
   * so planned-but-uneaten meals never inflate history metrics.
   */
  async loggedTotalsForDates(dates: readonly string[]): Promise<DayTotals[]> {
    if (dates.length === 0) return [];

    const placeholders = dates.map(() => '?').join(', ');
    const rows = await this.db.query<{
      date: string;
      calories: number | null;
      protein: number | null;
      carbs: number | null;
      fat: number | null;
      fiber: number | null;
    }>(
      `SELECT
         dp.date AS date,
         COALESCE(SUM(pd.calories), 0) AS calories,
         COALESCE(SUM(pd.protein),  0) AS protein,
          COALESCE(SUM(pd.carbs),    0) AS carbs,
          COALESCE(SUM(pd.fat),      0) AS fat,
          COALESCE(SUM(pd.fiber),    0) AS fiber
       FROM day_plan dp
        LEFT JOIN meal_slot ms    ON ms.day_plan_id = dp.id
        LEFT JOIN planned_dish pd ON pd.meal_slot_id = ms.id
                                  AND pd.is_completed = 1
                                  AND pd.completed_at IS NOT NULL
       WHERE dp.date IN (${placeholders})
       GROUP BY dp.date`,
      [...dates],
    );

    const byDate = new Map(rows.map((r) => [r.date, r]));
    return dates.map<DayTotals>((d) => {
      const r = byDate.get(d);
      return {
        date: d,
        calories: r?.calories ?? 0,
        protein: r?.protein ?? 0,
        carbs: r?.carbs ?? 0,
        fat: r?.fat ?? 0,
        fiber: r?.fiber ?? 0,
      };
    });
  }

  /**
   * Trend across an arbitrary date range, one metric at a time. Per arch
   * DEC-06.3 uses the date list as a synthetic source so missing days appear
   * as `value=0` instead of being skipped (chart needs a continuous x-axis).
   *
   * LOGGED-ONLY (matches `weekTotals` semantics).
   *
   * Index usage (DEC-06): `idx_planned_dish_completed_at` for the date-range
   * pruning + ORDER BY.
   */
  async trend(start: string, end: string, metric: KeyMetric): Promise<TrendPoint[]> {
    const dates = enumerateDateRange(start, end);
    if (dates.length === 0) return [];

    const column = METRIC_TO_COLUMN[metric];
    const placeholders = dates.map(() => '?').join(', ');

    const rows = await this.db.query<{ date: string; value: number | null }>(
      `SELECT dp.date AS date,
              COALESCE(SUM(pd.${column}), 0) AS value
         FROM day_plan dp
         LEFT JOIN meal_slot ms    ON ms.day_plan_id = dp.id
         LEFT JOIN planned_dish pd ON pd.meal_slot_id = ms.id
                                   AND pd.is_completed = 1
                                   AND pd.completed_at IS NOT NULL
        WHERE dp.date IN (${placeholders})
        GROUP BY dp.date
        ORDER BY dp.date ASC`,
      dates,
    );

    const byDate = new Map(rows.map((r) => [r.date, r.value ?? 0]));
    return dates.map<TrendPoint>((d) => ({ date: d, value: byDate.get(d) ?? 0 }));
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────

function enumerateDateRange(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const start = parseLocalDate(startIso);
  const end = parseLocalDate(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];
  for (let d = start; d <= end; d = addCalendarDays(d, 1)) {
    out.push(localIsoDate(d));
  }
  return out;
}
