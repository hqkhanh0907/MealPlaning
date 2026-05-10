import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import type { DishListItem } from './dish.repository';
import type { MealType, PlannedDish } from '../models/meal-plan.types';
import { Database } from '../services/database/database';
import { DayPlanRepository } from './day-plan.repository';

interface DishWithTotalsRow {
  id: string;
  name: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

interface MealSlotIdRow {
  id: string;
}

interface MaxSortRow {
  max_sort: number | null;
}

@Injectable({ providedIn: 'root' })
export class PlannedDishRepository {
  private readonly db = inject(Database);
  private readonly dayPlanRepository = inject(DayPlanRepository);

  /**
   * Insert a planned (not-yet-completed) dish at the end of the slot.
   * ALWAYS `is_completed=0`, 4 nutrition cols + completed_at NULL — Hybrid
   * policy demands snapshot only happens via `markCompleted` so the snapshot
   * code-path is the single owner of the truth (Disaster D).
   */
  async addToSlot(slotId: string, dishId: string, servings: number): Promise<PlannedDish> {
    const id = uuidv4();
    await this.db.withTransaction(async () => {
      const next = await this.db.getOne<MaxSortRow>(
        'SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM planned_dish WHERE meal_slot_id = ?',
        [slotId],
      );
      const sortOrder = (next?.max_sort ?? -1) + 1;
      await this.db.execute(
        `INSERT INTO planned_dish
           (id, meal_slot_id, dish_id, servings, sort_order,
            is_completed, completed_at, calories, protein, carbs, fat)
         VALUES (?, ?, ?, ?, ?, 0, NULL, NULL, NULL, NULL, NULL)`,
        [id, slotId, dishId, servings, sortOrder],
      );
    });
    const created = await this.db.getOne<PlannedDish>('SELECT * FROM planned_dish WHERE id = ?', [
      id,
    ]);
    if (!created) {
      throw new Error(`planned_dish '${id}' missing after insert`);
    }
    return created;
  }

  /**
   * Snapshot from `dish_with_totals` × servings, set `completed_at =
   * datetime('now')` (SQL clock — Disaster A: never `Date.now()` from JS).
   * Whole op runs inside a single transaction so the CHECK constraint sees
   * the row in a complete state — partial UPDATE would already violate the
   * Hybrid bidirectional CHECK and throw.
   */
  async markCompleted(plannedDishId: string): Promise<void> {
    await this.db.withTransaction(async () => {
      const planned = await this.db.getOne<PlannedDish>('SELECT * FROM planned_dish WHERE id = ?', [
        plannedDishId,
      ]);
      if (!planned) {
        throw new Error(`planned_dish '${plannedDishId}' not found`);
      }
      const totals = await this.db.getOne<DishWithTotalsRow>(
        'SELECT id, name, total_calories, total_protein, total_carbs, total_fat FROM dish_with_totals WHERE id = ?',
        [planned.dish_id],
      );
      if (!totals) {
        throw new Error(`dish_with_totals row missing for dish '${planned.dish_id}'`);
      }
      const calories = totals.total_calories * planned.servings;
      const protein = totals.total_protein * planned.servings;
      const carbs = totals.total_carbs * planned.servings;
      const fat = totals.total_fat * planned.servings;
      await this.db.execute(
        `UPDATE planned_dish
           SET is_completed = 1,
               completed_at = datetime('now'),
               calories     = ?,
               protein      = ?,
               carbs        = ?,
               fat          = ?
         WHERE id = ?`,
        [calories, protein, carbs, fat, plannedDishId],
      );
    });
  }

  /**
   * Reset Hybrid columns back to NULL when the user untoggles "đã ăn"
   * (SNAP-05). Single transaction — partial update violates CHECK.
   */
  async unmarkCompleted(plannedDishId: string): Promise<void> {
    await this.db.withTransaction(async () => {
      await this.db.execute(
        `UPDATE planned_dish
           SET is_completed = 0,
               completed_at = NULL,
               calories     = NULL,
               protein      = NULL,
               carbs        = NULL,
               fat          = NULL
         WHERE id = ?`,
        [plannedDishId],
      );
    });
  }

  /**
   * Servings edit branches on `is_completed`:
   *   - planned (0): plain UPDATE, derived totals follow at SELECT time.
   *   - logged  (1): re-query CURRENT `dish_with_totals` × newServings and
   *     refresh the snapshot (SNAP-04). Never ratio-scale the old snapshot
   *     (the recipe may have changed since logging — Disaster B).
   */
  async editServings(plannedDishId: string, newServings: number): Promise<void> {
    await this.db.withTransaction(async () => {
      const planned = await this.db.getOne<PlannedDish>('SELECT * FROM planned_dish WHERE id = ?', [
        plannedDishId,
      ]);
      if (!planned) {
        throw new Error(`planned_dish '${plannedDishId}' not found`);
      }

      if (planned.is_completed === 0) {
        await this.db.execute(`UPDATE planned_dish SET servings = ? WHERE id = ?`, [
          newServings,
          plannedDishId,
        ]);
        return;
      }

      const totals = await this.db.getOne<DishWithTotalsRow>(
        'SELECT id, name, total_calories, total_protein, total_carbs, total_fat FROM dish_with_totals WHERE id = ?',
        [planned.dish_id],
      );
      if (!totals) {
        throw new Error(`dish_with_totals row missing for dish '${planned.dish_id}'`);
      }
      await this.db.execute(
        `UPDATE planned_dish
           SET servings = ?,
               calories = ?,
               protein  = ?,
               carbs    = ?,
               fat      = ?
         WHERE id = ?`,
        [
          newServings,
          totals.total_calories * newServings,
          totals.total_protein * newServings,
          totals.total_carbs * newServings,
          totals.total_fat * newServings,
          plannedDishId,
        ],
      );
    });
  }

  /**
   * Hard delete. Undo is a UI concern (Story 3.7 toast keeps the row in
   * memory). Repo does NOT soft-delete so logged-history queries stay
   * naturally consistent.
   */
  async delete(plannedDishId: string): Promise<void> {
    await this.db.execute('DELETE FROM planned_dish WHERE id = ?', [plannedDishId]);
  }

  /**
   * Move to a different slot. Sort_order recomputes to MAX+1 of the new
   * slot to land at the bottom (drag/drop reorder lives in Story 3.5+).
   */
  async moveToSlot(plannedDishId: string, newSlotId: string): Promise<void> {
    await this.db.withTransaction(async () => {
      const next = await this.db.getOne<MaxSortRow>(
        'SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM planned_dish WHERE meal_slot_id = ?',
        [newSlotId],
      );
      const sortOrder = (next?.max_sort ?? -1) + 1;
      await this.db.execute(
        `UPDATE planned_dish SET meal_slot_id = ?, sort_order = ? WHERE id = ?`,
        [newSlotId, sortOrder, plannedDishId],
      );
    });
  }

  /**
   * Copy a planned_dish to a target date + meal type as a fresh planned
   * row (Hybrid: copy = `is_completed=0` always, snapshot is per-event).
   */
  async copyToDate(
    plannedDishId: string,
    targetDate: string,
    targetMealType: MealType,
  ): Promise<PlannedDish> {
    const source = await this.db.getOne<PlannedDish>('SELECT * FROM planned_dish WHERE id = ?', [
      plannedDishId,
    ]);
    if (!source) {
      throw new Error(`planned_dish '${plannedDishId}' not found`);
    }
    const targetDayPlan = await this.dayPlanRepository.getOrCreateForDate(targetDate);
    const targetSlot = await this.db.getOne<MealSlotIdRow>(
      'SELECT id FROM meal_slot WHERE day_plan_id = ? AND meal_type = ?',
      [targetDayPlan.id, targetMealType],
    );
    if (!targetSlot) {
      throw new Error(
        `meal_slot for day_plan '${targetDayPlan.id}' / meal_type '${targetMealType}' missing`,
      );
    }
    return this.addToSlot(targetSlot.id, source.dish_id, source.servings);
  }

  /**
   * Recently logged dishes — DISTINCT dish, ordered by most-recent
   * completed_at. Powers the Epic 4 "Gần đây" tab.
   */
  async listRecentLogged(limit = 30): Promise<DishListItem[]> {
    return this.db.query<DishListItem>(
      `SELECT dwt.*
       FROM dish_with_totals dwt
       INNER JOIN (
         SELECT dish_id, MAX(completed_at) AS last_completed
         FROM planned_dish
         WHERE is_completed = 1
         GROUP BY dish_id
       ) recent ON recent.dish_id = dwt.id
       ORDER BY recent.last_completed DESC
       LIMIT ?`,
      [limit],
    );
  }

  /**
   * Copy planned + logged dishes from previous week into current week
   * (Story 3.6 / F-03 §3.4). Per-day, per-meal-type semantics:
   *   - DELETE planned_dish in target slot WHERE is_completed=0 (clear plans)
   *   - INSERT a fresh planned (is_completed=0) row for every prev-week dish
   *     (regardless of source state — re-planning ≠ re-logging).
   * Returns counts so UI can toast "Đã sao chép {n} món từ tuần trước".
   *
   * `currentWeekStart` and `prevWeekStart` are ISO yyyy-mm-dd of the Monday
   * of each week (caller computes via CalendarStore.weekDays).
   */
  async copyPreviousWeek(
    currentWeekStart: string,
    prevWeekStart: string,
  ): Promise<{ copiedCount: number; daysAffected: number }> {
    const prevDays = enumerate7Days(prevWeekStart);
    const currentDays = enumerate7Days(currentWeekStart);

    let copiedCount = 0;
    const affectedDates = new Set<string>();

    await this.db.withTransaction(async () => {
      for (let i = 0; i < 7; i += 1) {
        const prevDate = prevDays[i];
        const targetDate = currentDays[i];

        const prevDayPlan = await this.db.getOne<{ id: string }>(
          'SELECT id FROM day_plan WHERE date = ?',
          [prevDate],
        );
        if (!prevDayPlan) continue;

        const prevSlots = await this.db.query<{ id: string; meal_type: MealType }>(
          'SELECT id, meal_type FROM meal_slot WHERE day_plan_id = ?',
          [prevDayPlan.id],
        );
        if (prevSlots.length === 0) continue;

        const prevSlotIds = prevSlots.map((s) => s.id);
        const placeholders = prevSlotIds.map(() => '?').join(', ');
        const prevDishes = await this.db.query<{
          meal_slot_id: string;
          dish_id: string;
          servings: number;
        }>(
          `SELECT meal_slot_id, dish_id, servings
           FROM planned_dish
           WHERE meal_slot_id IN (${placeholders})
           ORDER BY sort_order ASC, created_at ASC`,
          [...prevSlotIds],
        );
        if (prevDishes.length === 0) continue;

        const targetDayPlan = await this.dayPlanRepository.getOrCreateForDate(targetDate);
        const targetSlotRows = await this.db.query<{ id: string; meal_type: MealType }>(
          'SELECT id, meal_type FROM meal_slot WHERE day_plan_id = ?',
          [targetDayPlan.id],
        );
        const targetSlotIdByMealType = new Map<MealType, string>(
          targetSlotRows.map((s) => [s.meal_type, s.id]),
        );

        // Clear planned (is_completed=0) rows in every target slot — keep logged.
        const targetSlotIds = targetSlotRows.map((s) => s.id);
        if (targetSlotIds.length > 0) {
          const targetPlaceholders = targetSlotIds.map(() => '?').join(', ');
          await this.db.execute(
            `DELETE FROM planned_dish
             WHERE is_completed = 0
               AND meal_slot_id IN (${targetPlaceholders})`,
            [...targetSlotIds],
          );
        }

        // Map prev_slot_id → meal_type to know where to insert in target.
        const prevSlotMealType = new Map<string, MealType>(
          prevSlots.map((s) => [s.id, s.meal_type]),
        );

        // Group by meal_type to assign sort_order from 0 in each target slot.
        const sortByTargetSlot = new Map<string, number>();
        for (const d of prevDishes) {
          const mealType = prevSlotMealType.get(d.meal_slot_id);
          if (!mealType) continue;
          const targetSlotId = targetSlotIdByMealType.get(mealType);
          if (!targetSlotId) continue;
          const sortOrder = sortByTargetSlot.get(targetSlotId) ?? 0;
          sortByTargetSlot.set(targetSlotId, sortOrder + 1);

          await this.db.execute(
            `INSERT INTO planned_dish
               (id, meal_slot_id, dish_id, servings, sort_order,
                is_completed, completed_at, calories, protein, carbs, fat)
             VALUES (?, ?, ?, ?, ?, 0, NULL, NULL, NULL, NULL, NULL)`,
            [uuidv4(), targetSlotId, d.dish_id, d.servings, sortOrder],
          );
          copiedCount += 1;
          affectedDates.add(targetDate);
        }
      }
    });

    return { copiedCount, daysAffected: affectedDates.size };
  }
}

function enumerate7Days(weekStart: string): string[] {
  const [y, m, d] = weekStart.split('-').map((p) => Number.parseInt(p, 10));
  const out: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + i);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    out.push(`${yy}-${mm}-${dd}`);
  }
  return out;
}
