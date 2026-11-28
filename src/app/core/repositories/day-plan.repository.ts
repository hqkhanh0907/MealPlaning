import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { AccountSession } from '../account/account-session';
import { NATIVE_CALENDAR_READ } from '../account/calendar-read';
import { v4 as uuidv4 } from 'uuid';
import {
  MEAL_TYPES,
  type DayPlan,
  type DayPlanWithSlots,
  type MealSlot,
  type MealSlotWithDishes,
  type PlannedDishWithEffective,
} from '../models/meal-plan.types';
import { Database } from '../services/database/database';
import { NUTRIENTS } from '../models/nutrition';
import { DISH_PER_SERVING, effectivePlannedNutrient } from './dish-per-serving.sql';

/**
 * Default macro target row when bootstrapping a new day_plan. The user_profile
 * targets aren't injected here — Story 3.3 (CalendarStore) hydrates them at
 * load time. We persist 0 placeholders so day_plan.NOT NULL columns satisfy
 * the schema; UI overlays the live profile target.
 */
const DEFAULT_TARGET_CALORIES = 0;
const DEFAULT_TARGET_PROTEIN = 0;

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
  pd.fiber           AS fiber,
  pd.created_at      AS created_at,
  dwt.name           AS dish_name,
  ${NUTRIENTS.map(
    (nutrient) => `${effectivePlannedNutrient(nutrient)} AS effective_${nutrient}`,
  ).join(', ')}
`.trim();

interface PlannedDishWithEffectiveAndSlot extends PlannedDishWithEffective {
  meal_slot_id: string;
}

@Injectable({ providedIn: 'root' })
export class DayPlanRepository {
  private readonly db = inject(Database);
  private readonly readNative = inject(NATIVE_CALENDAR_READ);
  private readonly session = Capacitor.getPlatform() === 'android' ? inject(AccountSession) : null;
  private readonly pendingByDate = new Map<string, Promise<DayPlan>>();

  getOrCreateForDate(date: string): Promise<DayPlan> {
    const pending = this.pendingByDate.get(date);
    if (pending) return pending;
    const result = this.createIfMissing(date).finally(() => this.pendingByDate.delete(date));
    this.pendingByDate.set(date, result);
    return result;
  }

  private async createIfMissing(date: string): Promise<DayPlan> {
    const existing = await this.db.getOne<DayPlan>('SELECT * FROM day_plan WHERE date = ?', [date]);
    if (existing) return existing;

    return this.db.withTransaction(async () => {
      await this.db.execute(
        `INSERT INTO day_plan (id, date, target_calories, target_protein)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(date) DO NOTHING`,
        [uuidv4(), date, DEFAULT_TARGET_CALORIES, DEFAULT_TARGET_PROTEIN],
      );
      const dayPlan = await this.db.getOne<DayPlan>('SELECT * FROM day_plan WHERE date = ?', [
        date,
      ]);
      if (!dayPlan) throw new Error(`day_plan for '${date}' missing after insert`);

      for (let i = 0; i < MEAL_TYPES.length; i += 1) {
        await this.db.execute(
          `INSERT INTO meal_slot (id, day_plan_id, meal_type, position)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(day_plan_id, meal_type) DO NOTHING`,
          [uuidv4(), dayPlan.id, MEAL_TYPES[i], i],
        );
      }
      return dayPlan;
    });
  }

  /**
   * Returns nested day-plan structure for a single date, or null when the
   * day has not been created yet (UI shows empty state — Story 3.7).
   */
  async findByDate(date: string): Promise<DayPlanWithSlots | null> {
    return this.forCurrentAccount((owner) => this.findDay(date, owner));
  }

  private async findDay(date: string, owner: string | null): Promise<DayPlanWithSlots | null> {
    if (owner !== null && !this.db.hasActiveTransaction) {
      const creating = this.pendingByDate.get(date);
      if (creating) await creating;
      let days = await this.readNative(date, date, owner);
      const pending = this.pendingByDate.get(date);
      if (days !== null && pending && pending !== creating) {
        await pending;
        days = await this.readNative(date, date, owner);
      }
      if (days !== null && !this.db.hasActiveTransaction) return days[0] ?? null;
    }
    const existing = await this.db.getOne<DayPlan>('SELECT * FROM day_plan WHERE date = ?', [date]);
    const pending = this.pendingByDate.get(date);
    const dayPlan = pending ? await pending : existing;
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
    return this.forCurrentAccount(async (owner) => {
      if (owner !== null && !this.db.hasActiveTransaction) {
        const native = await this.readNative(start, end, owner);
        if (native !== null && !this.db.hasActiveTransaction) return native;
      }
      return this.findRangeInDatabase(start, end);
    });
  }

  private async findRangeInDatabase(start: string, end: string): Promise<DayPlanWithSlots[]> {
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

  private async forCurrentAccount<T>(read: (owner: string | null) => Promise<T>): Promise<T> {
    if (!this.session) return read(null);
    const account = this.session.current();
    if (!account) throw new Error('A current calendar account is required.');
    const result = await read(account.id);
    if (this.session.current() !== account) throw new Error('Calendar account changed.');
    return result;
  }

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
       INNER JOIN ${DISH_PER_SERVING} dwt ON dwt.id = pd.dish_id
       WHERE pd.meal_slot_id IN (${placeholders})
       ORDER BY pd.sort_order ASC, pd.created_at ASC, pd.rowid ASC`,
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
