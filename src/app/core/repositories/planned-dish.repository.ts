import { weekDates } from '../utils/local-date';
import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { scaleNutrition, type NutritionTotals } from '../models/nutrition';
import type { DishListItem } from './dish.repository';
import type { DeletedDishSnapshot, MealType, PlannedDish } from '../models/meal-plan.types';
import { Database } from '../services/database/database';
import { DayPlanRepository } from './day-plan.repository';
import { DISH_PER_SERVING } from './dish-per-serving.sql';

interface MealSlotIdRow {
  id: string;
}

interface MaxSortRow {
  max_sort: number | null;
}

export interface DateMealPlanItem {
  readonly mealType: MealType;
  readonly dishId: string;
  readonly servings: number;
}

@Injectable({ providedIn: 'root' })
export class PlannedDishRepository {
  private readonly db = inject(Database);
  private readonly dayPlanRepository = inject(DayPlanRepository);

  addToSlot(slotId: string, dishId: string, servings: number): Promise<PlannedDish> {
    return this.insertAtEndOfSlot({
      meal_slot_id: slotId,
      dish_id: dishId,
      servings,
      is_completed: 0,
      completed_at: null,
      calories: null,
      protein: null,
      carbs: null,
      fat: null,
      fiber: null,
    });
  }

  restoreDeletedDish(snapshot: DeletedDishSnapshot): Promise<PlannedDish> {
    return this.db.withTransaction(async () => {
      await this.db.execute(
        `UPDATE planned_dish SET sort_order = sort_order + 1
         WHERE meal_slot_id = ? AND sort_order >= ?
           AND EXISTS (SELECT id FROM planned_dish WHERE meal_slot_id = ? AND sort_order = ?)`,
        [snapshot.meal_slot_id, snapshot.sort_order, snapshot.meal_slot_id, snapshot.sort_order],
      );
      await this.db.execute(
        `INSERT INTO planned_dish
           (id, meal_slot_id, dish_id, servings, sort_order, is_completed, completed_at,
            calories, protein, carbs, fat, fiber, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          snapshot.id,
          snapshot.meal_slot_id,
          snapshot.dish_id,
          snapshot.servings,
          snapshot.sort_order,
          snapshot.is_completed,
          snapshot.completed_at,
          snapshot.calories,
          snapshot.protein,
          snapshot.carbs,
          snapshot.fat,
          snapshot.fiber,
          snapshot.created_at,
        ],
      );
      return snapshot;
    });
  }

  private async insertAtEndOfSlot(
    snapshot: Omit<PlannedDish, 'id' | 'sort_order' | 'created_at'>,
  ): Promise<PlannedDish> {
    const id = uuidv4();
    return this.db.withTransaction(async () => {
      const sortOrder = await this.nextSortOrder(snapshot.meal_slot_id);
      await this.db.execute(
        `INSERT INTO planned_dish
           (id, meal_slot_id, dish_id, servings, sort_order,
             is_completed, completed_at, calories, protein, carbs, fat, fiber)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          snapshot.meal_slot_id,
          snapshot.dish_id,
          snapshot.servings,
          sortOrder,
          snapshot.is_completed,
          snapshot.completed_at,
          snapshot.calories,
          snapshot.protein,
          snapshot.carbs,
          snapshot.fat,
          snapshot.fiber,
        ],
      );
      const created = await this.db.getOne<PlannedDish>('SELECT * FROM planned_dish WHERE id = ?', [
        id,
      ]);
      if (!created) {
        throw new Error(`planned_dish '${id}' missing after insert`);
      }
      return created;
    });
  }

  /**
   * Snapshot per-serving nutrition × servings, set `completed_at =
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
      if (planned.is_completed === 1) return;
      const nutrition = await this.snapshotForServings(planned.dish_id, planned.servings);
      await this.db.execute(
        `UPDATE planned_dish
           SET is_completed = 1,
               completed_at = datetime('now'),
                calories     = ?,
                protein      = ?,
                carbs        = ?,
                fat          = ?,
                fiber        = ?
          WHERE id = ? AND is_completed = 0`,
        [
          nutrition.calories,
          nutrition.protein,
          nutrition.carbs,
          nutrition.fat,
          nutrition.fiber,
          plannedDishId,
        ],
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
                fat          = NULL,
                fiber        = NULL
          WHERE id = ?`,
        [plannedDishId],
      );
    });
  }

  /**
   * Servings edit branches on `is_completed`:
   *   - planned (0): plain UPDATE, derived totals follow at SELECT time.
   *   - logged  (1): re-query current per-serving nutrition × newServings and
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

      const nutrition = await this.snapshotForServings(planned.dish_id, newServings);
      await this.db.execute(
        `UPDATE planned_dish
           SET servings = ?,
                calories = ?,
                protein  = ?,
                carbs    = ?,
                fat      = ?,
                fiber    = ?
          WHERE id = ?`,
        [
          newServings,
          nutrition.calories,
          nutrition.protein,
          nutrition.carbs,
          nutrition.fat,
          nutrition.fiber,
          plannedDishId,
        ],
      );
    });
  }

  /**
   * Convenience API for UI/AI callers: creates the day_plan/meal_slot precondition
   * and appends a fresh planned row to the requested meal.
   */
  async addToDateMealType(
    date: string,
    mealType: MealType,
    dishId: string,
    servings: number,
  ): Promise<PlannedDish> {
    const targetSlot = await this.getSlotForDateMealType(date, mealType);
    return this.addToSlot(targetSlot.id, dishId, servings);
  }

  /**
   * Replace only not-yet-completed dishes for a date. Logged rows are preserved
   * as immutable history; AI/week-copy plans should never erase food already
   * marked as eaten.
   */
  async replaceDatePlan(date: string, items: readonly DateMealPlanItem[]): Promise<number> {
    if (items.length === 0) {
      return 0;
    }

    let inserted = 0;
    await this.db.withTransaction(async () => {
      const targetDayPlan = await this.dayPlanRepository.getOrCreateForDate(date);
      const targetSlotRows = await this.db.query<{ id: string; meal_type: MealType }>(
        'SELECT id, meal_type FROM meal_slot WHERE day_plan_id = ?',
        [targetDayPlan.id],
      );
      const targetSlotIdByMealType = new Map<MealType, string>(
        targetSlotRows.map((slot) => [slot.meal_type, slot.id]),
      );

      await this.clearTargetPlannedRows(targetSlotRows.map((slot) => slot.id));

      for (const item of items) {
        const slotId = targetSlotIdByMealType.get(item.mealType);
        if (!slotId) {
          throw new Error(`meal_slot for date '${date}' / meal_type '${item.mealType}' missing`);
        }
        await this.addToSlot(slotId, item.dishId, item.servings);
        inserted += 1;
      }
    });

    return inserted;
  }

  /**
   * Hard delete. Undo is a UI concern (Story 3.7 toast keeps the row in
   * memory). Repo does NOT soft-delete so logged-history queries stay
   * naturally consistent.
   */
  async delete(plannedDishId: string): Promise<DeletedDishSnapshot | null> {
    return this.db.withTransaction(async () => {
      const snapshot = await this.db.getOne<DeletedDishSnapshot>(
        'SELECT * FROM planned_dish WHERE id = ?',
        [plannedDishId],
      );
      if (!snapshot) return null;
      const subsequent = await this.db.query<Pick<PlannedDish, 'id' | 'sort_order'>>(
        `SELECT id, sort_order FROM planned_dish WHERE meal_slot_id = ? AND sort_order >= ?
         ORDER BY sort_order, created_at, rowid`,
        [snapshot.meal_slot_id, snapshot.sort_order],
      );
      let nextOrder = snapshot.sort_order;
      for (const row of subsequent) {
        const order = Math.max(row.sort_order, nextOrder);
        if (row.id === plannedDishId) {
          snapshot.sort_order = order;
        } else if (order !== row.sort_order) {
          await this.db.execute('UPDATE planned_dish SET sort_order = ? WHERE id = ?', [
            order,
            row.id,
          ]);
        }
        nextOrder = order + 1;
      }
      await this.db.execute('DELETE FROM planned_dish WHERE id = ?', [plannedDishId]);
      return snapshot;
    });
  }

  /**
   * Move to a different slot. Sort_order recomputes to MAX+1 of the new
   * slot to land at the bottom (drag/drop reorder lives in Story 3.5+).
   */
  async moveToSlot(plannedDishId: string, newSlotId: string): Promise<void> {
    await this.db.withTransaction(async () => {
      const sortOrder = await this.nextSortOrder(newSlotId);
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
    const targetSlot = await this.getSlotForDateMealType(targetDate, targetMealType);
    return this.addToSlot(targetSlot.id, source.dish_id, source.servings);
  }

  /**
   * Recently logged dishes — DISTINCT dish, ordered by most-recent
   * completed_at. Powers the Epic 4 "Gần đây" tab.
   */
  async listRecentLogged(limit = 30): Promise<DishListItem[]> {
    return this.db.query<DishListItem>(
      `SELECT dwt.*
       FROM ${DISH_PER_SERVING} dwt
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
    const prevDays = weekDates(prevWeekStart);
    const currentDays = weekDates(currentWeekStart);

    if (prevDays.length !== 7 || currentDays.length !== 7) {
      throw new Error('Invalid week start date');
    }
    let copiedCount = 0;
    const affectedDates = new Set<string>();

    await this.db.withTransaction(async () => {
      for (let i = 0; i < 7; i += 1) {
        const count = await this.copyDay(prevDays[i], currentDays[i], 'replace-plans');
        if (count > 0) {
          copiedCount += count;
          affectedDates.add(currentDays[i]);
        }
      }
    });

    return { copiedCount, daysAffected: affectedDates.size };
  }

  copyDayIntoEmpty(prevDate: string, targetDate: string): Promise<number> {
    return this.db.withTransaction(() => this.copyDay(prevDate, targetDate, 'empty-day'));
  }

  private async copyDay(
    prevDate: string,
    targetDate: string,
    mode: 'replace-plans' | 'empty-day',
  ): Promise<number> {
    const prevDayPlan = await this.db.getOne<{ id: string }>(
      'SELECT id FROM day_plan WHERE date = ?',
      [prevDate],
    );
    if (!prevDayPlan) {
      return 0;
    }

    const prevSlots = await this.db.query<{ id: string; meal_type: MealType }>(
      'SELECT id, meal_type FROM meal_slot WHERE day_plan_id = ?',
      [prevDayPlan.id],
    );
    if (prevSlots.length === 0) {
      return 0;
    }

    const prevDishes = await this.listSlotDishes(prevSlots.map((s) => s.id));
    if (prevDishes.length === 0) {
      return 0;
    }

    const targetDayPlan = await this.dayPlanRepository.getOrCreateForDate(targetDate);
    const targetSlotRows = await this.db.query<{ id: string; meal_type: MealType }>(
      'SELECT id, meal_type FROM meal_slot WHERE day_plan_id = ?',
      [targetDayPlan.id],
    );
    if (mode === 'empty-day') {
      const occupied = await this.db.getOne(
        `SELECT pd.id FROM planned_dish pd JOIN meal_slot ms ON ms.id = pd.meal_slot_id
         WHERE ms.day_plan_id = ? LIMIT 1`,
        [targetDayPlan.id],
      );
      if (occupied) return 0;
    } else {
      await this.clearTargetPlannedRows(targetSlotRows.map((s) => s.id));
    }

    const prevSlotMealType = new Map<string, MealType>(prevSlots.map((s) => [s.id, s.meal_type]));
    const targetSlotIdByMealType = new Map<MealType, string>(
      targetSlotRows.map((s) => [s.meal_type, s.id]),
    );
    return this.insertCopiedDishes(prevDishes, prevSlotMealType, targetSlotIdByMealType);
  }

  private async listSlotDishes(slotIds: readonly string[]): Promise<
    {
      meal_slot_id: string;
      dish_id: string;
      servings: number;
    }[]
  > {
    const placeholders = slotIds.map(() => '?').join(', ');
    return this.db.query(
      `SELECT meal_slot_id, dish_id, servings
       FROM planned_dish
       WHERE meal_slot_id IN (${placeholders})
       ORDER BY sort_order ASC, created_at ASC`,
      [...slotIds],
    );
  }

  private async clearTargetPlannedRows(targetSlotIds: readonly string[]): Promise<void> {
    if (targetSlotIds.length === 0) {
      return;
    }

    const targetPlaceholders = targetSlotIds.map(() => '?').join(', ');
    await this.db.execute(
      `DELETE FROM planned_dish
       WHERE is_completed = 0
         AND meal_slot_id IN (${targetPlaceholders})`,
      [...targetSlotIds],
    );
  }

  private async insertCopiedDishes(
    prevDishes: readonly {
      meal_slot_id: string;
      dish_id: string;
      servings: number;
    }[],
    prevSlotMealType: ReadonlyMap<string, MealType>,
    targetSlotIdByMealType: ReadonlyMap<MealType, string>,
  ): Promise<number> {
    let copiedCount = 0;
    const sortByTargetSlot = new Map<string, number>();

    for (const d of prevDishes) {
      const targetSlotId = this.resolveTargetSlotId(
        d.meal_slot_id,
        prevSlotMealType,
        targetSlotIdByMealType,
      );
      if (!targetSlotId) {
        continue;
      }

      const sortOrder =
        sortByTargetSlot.get(targetSlotId) ?? (await this.nextSortOrder(targetSlotId));
      sortByTargetSlot.set(targetSlotId, sortOrder + 1);
      await this.insertCopiedDish(targetSlotId, d.dish_id, d.servings, sortOrder);
      copiedCount += 1;
    }

    return copiedCount;
  }

  private async nextSortOrder(slotId: string): Promise<number> {
    const last = await this.db.getOne<MaxSortRow>(
      'SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM planned_dish WHERE meal_slot_id = ?',
      [slotId],
    );
    return (last?.max_sort ?? -1) + 1;
  }

  private resolveTargetSlotId(
    previousSlotId: string,
    prevSlotMealType: ReadonlyMap<string, MealType>,
    targetSlotIdByMealType: ReadonlyMap<MealType, string>,
  ): string | null {
    const mealType = prevSlotMealType.get(previousSlotId);
    return mealType ? (targetSlotIdByMealType.get(mealType) ?? null) : null;
  }

  private async insertCopiedDish(
    targetSlotId: string,
    dishId: string,
    servings: number,
    sortOrder: number,
  ): Promise<void> {
    await this.db.execute(
      `INSERT INTO planned_dish
          (id, meal_slot_id, dish_id, servings, sort_order,
           is_completed, completed_at, calories, protein, carbs, fat, fiber)
       VALUES (?, ?, ?, ?, ?, 0, NULL, NULL, NULL, NULL, NULL, NULL)`,
      [uuidv4(), targetSlotId, dishId, servings, sortOrder],
    );
  }

  private async snapshotForServings(dishId: string, servings: number): Promise<NutritionTotals> {
    const recipe = await this.db.getOne<DishListItem>(
      `SELECT * FROM ${DISH_PER_SERVING} WHERE id = ?`,
      [dishId],
    );
    if (!recipe) throw new Error(`dish_with_totals row missing for dish '${dishId}'`);
    return scaleNutrition(
      {
        calories: recipe.total_calories,
        protein: recipe.total_protein,
        carbs: recipe.total_carbs,
        fat: recipe.total_fat,
        fiber: recipe.total_fiber,
      },
      servings,
    );
  }

  private async getSlotForDateMealType(date: string, mealType: MealType): Promise<MealSlotIdRow> {
    const targetDayPlan = await this.dayPlanRepository.getOrCreateForDate(date);
    const targetSlot = await this.db.getOne<MealSlotIdRow>(
      'SELECT id FROM meal_slot WHERE day_plan_id = ? AND meal_type = ?',
      [targetDayPlan.id, mealType],
    );
    if (!targetSlot) {
      throw new Error(
        `meal_slot for day_plan '${targetDayPlan.id}' / meal_type '${mealType}' missing`,
      );
    }
    return targetSlot;
  }
}
