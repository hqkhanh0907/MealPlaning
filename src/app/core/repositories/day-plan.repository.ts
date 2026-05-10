import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import type {
  DayPlan,
  DayPlanWithSlots,
  MealSlot,
  MealSlotWithDishes,
  MealType,
  PlannedDishWithEffective,
} from '../models/meal-plan.types';
import { Database } from '../services/database/database';

/**
 * Default macro target row when bootstrapping a new day_plan. The user_profile
 * targets aren't injected here — Story 3.3 (CalendarStore) hydrates them at
 * load time. We persist 0 placeholders so day_plan.NOT NULL columns satisfy
 * the schema; UI overlays the live profile target.
 */
const DEFAULT_TARGET_CALORIES = 0;
const DEFAULT_TARGET_PROTEIN = 0;

const MEAL_TYPES: readonly MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * SELECT projection that fans planned_dish through dish_with_totals to compute
 * `effective_*` cols in SQL. Consumer of this repo MUST NOT re-aggregate.
 */
const PLANNED_DISH_SELECT_FRAGMENT = `
  pd.id              AS id,
  pd.meal_slot_id    AS meal_slot_id,
  pd.dish_id         AS dish_id,
  pd.servings        AS servings,
  pd.sort_order      AS sort_order,
  pd.is_completed    AS is_completed,
  pd.completed_at    AS completed_at,
  pd.calories        AS calories,
  pd.protein         AS protein,
  pd.carbs           AS carbs,
  pd.fat             AS fat,
  pd.created_at      AS created_at,
  dwt.name           AS dish_name,
  CASE WHEN pd.is_completed = 1 THEN pd.calories ELSE dwt.total_calories * pd.servings END AS effective_calories,
  CASE WHEN pd.is_completed = 1 THEN pd.protein  ELSE dwt.total_protein  * pd.servings END AS effective_protein,
  CASE WHEN pd.is_completed = 1 THEN pd.carbs    ELSE dwt.total_carbs    * pd.servings END AS effective_carbs,
  CASE WHEN pd.is_completed = 1 THEN pd.fat      ELSE dwt.total_fat      * pd.servings END AS effective_fat
`.trim();

interface PlannedDishWithEffectiveAndSlot extends PlannedDishWithEffective {
  meal_slot_id: string;
}

@Injectable({ providedIn: 'root' })
export class DayPlanRepository {
  private readonly db = inject(Database);

  /**
   * Idempotent: returns the existing day_plan for `date` if any, otherwise
   * creates one + the canonical 4 meal_slot rows in a single transaction.
   */
  async getOrCreateForDate(date: string): Promise<DayPlan> {
    const existing = await this.db.getOne<DayPlan>('SELECT * FROM day_plan WHERE date = ?', [date]);
    if (existing) {
      return existing;
    }

    const dayPlanId = uuidv4();
    await this.db.withTransaction(async () => {
      await this.db.execute(
        `INSERT INTO day_plan (id, date, target_calories, target_protein)
         VALUES (?, ?, ?, ?)`,
        [dayPlanId, date, DEFAULT_TARGET_CALORIES, DEFAULT_TARGET_PROTEIN],
      );
      for (let i = 0; i < MEAL_TYPES.length; i += 1) {
        await this.db.execute(
          `INSERT INTO meal_slot (id, day_plan_id, meal_type, position)
           VALUES (?, ?, ?, ?)`,
          [uuidv4(), dayPlanId, MEAL_TYPES[i], i],
        );
      }
    });

    const created = await this.db.getOne<DayPlan>('SELECT * FROM day_plan WHERE id = ?', [
      dayPlanId,
    ]);
    if (!created) {
      throw new Error(`day_plan '${dayPlanId}' missing after insert`);
    }
    return created;
  }

  /**
   * Returns nested day-plan structure for a single date, or null when the
   * day has not been created yet (UI shows empty state — Story 3.7).
   */
  async findByDate(date: string): Promise<DayPlanWithSlots | null> {
    const dayPlan = await this.db.getOne<DayPlan>('SELECT * FROM day_plan WHERE date = ?', [date]);
    if (!dayPlan) {
      return null;
    }
    return this.assembleDayPlan(dayPlan);
  }

  /**
   * Range query for Week View (Story 3.6). Returns one DayPlanWithSlots per
   * existing day_plan in [start, end] inclusive — missing days are NOT
   * synthesized (caller decides how to render gaps).
   */
  async findByDateRange(start: string, end: string): Promise<DayPlanWithSlots[]> {
    const dayPlans = await this.db.query<DayPlan>(
      'SELECT * FROM day_plan WHERE date BETWEEN ? AND ? ORDER BY date ASC',
      [start, end],
    );
    const assembled: DayPlanWithSlots[] = [];
    for (const dp of dayPlans) {
      assembled.push(await this.assembleDayPlan(dp));
    }
    return assembled;
  }

  // -- internals --------------------------------------------------------------

  private async assembleDayPlan(dayPlan: DayPlan): Promise<DayPlanWithSlots> {
    const slots = await this.db.query<MealSlot>(
      'SELECT * FROM meal_slot WHERE day_plan_id = ? ORDER BY position ASC',
      [dayPlan.id],
    );
    const slotIds = slots.map((s) => s.id);
    const dishesBySlot = await this.fetchPlannedDishesGrouped(slotIds);

    const slotsWithDishes: MealSlotWithDishes[] = slots.map((slot) => ({
      ...slot,
      planned_dishes: dishesBySlot.get(slot.id) ?? [],
    }));

    return {
      ...dayPlan,
      meal_slots: slotsWithDishes,
    };
  }

  private async fetchPlannedDishesGrouped(
    slotIds: readonly string[],
  ): Promise<Map<string, PlannedDishWithEffective[]>> {
    const grouped = new Map<string, PlannedDishWithEffective[]>();
    if (slotIds.length === 0) {
      return grouped;
    }
    const placeholders = slotIds.map(() => '?').join(', ');
    const rows = await this.db.query<PlannedDishWithEffectiveAndSlot>(
      `SELECT ${PLANNED_DISH_SELECT_FRAGMENT}
       FROM planned_dish pd
       INNER JOIN dish_with_totals dwt ON dwt.id = pd.dish_id
       WHERE pd.meal_slot_id IN (${placeholders})
       ORDER BY pd.sort_order ASC, pd.created_at ASC`,
      [...slotIds],
    );
    for (const row of rows) {
      const list = grouped.get(row.meal_slot_id) ?? [];
      list.push(row);
      grouped.set(row.meal_slot_id, list);
    }
    return grouped;
  }
}

export { PLANNED_DISH_SELECT_FRAGMENT };
