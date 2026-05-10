/**
 * Meal-plan domain types — Calendar / Nutrition feature.
 *
 * Mirrors schema v2 (`schema.ts` HYBRID_POLICY_DDL):
 *   day_plan + meal_slot + planned_dish (Hybrid policy: snapshot when
 *   completed, derive when planned).
 *
 * Owned by the Calendar repository layer (Story 3.2). Do NOT add UI-facing
 * derived fields here — that belongs in component view models.
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DayPlan {
  id: string;
  date: string; // ISO yyyy-mm-dd
  target_calories: number;
  target_protein: number;
  created_at: string;
  updated_at: string | null;
}

export interface MealSlot {
  id: string;
  day_plan_id: string;
  meal_type: MealType;
  position: number;
  created_at: string;
}

/**
 * Hybrid policy:
 *   is_completed=0 → 4 nutrition cols + completed_at all NULL.
 *   is_completed=1 → 4 nutrition cols + completed_at all NOT NULL (snapshot).
 * Bidirectional CHECK enforced at DB level (schema v2).
 */
export interface PlannedDish {
  id: string;
  meal_slot_id: string;
  dish_id: string;
  servings: number;
  sort_order: number;
  is_completed: 0 | 1;
  completed_at: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  created_at: string;
}

/**
 * Repository SELECT shape — `effective_*` cols computed via CASE in SQL
 * so consumers (store / component / pipe) MUST NOT re-compute (DEC-02).
 *   is_completed=1 → effective_X = snapshot column X.
 *   is_completed=0 → effective_X = dish_with_totals.total_X * servings.
 */
export interface PlannedDishWithEffective extends PlannedDish {
  dish_name: string;
  effective_calories: number;
  effective_protein: number;
  effective_carbs: number;
  effective_fat: number;
}

export interface MealSlotWithDishes extends MealSlot {
  planned_dishes: PlannedDishWithEffective[];
}

export interface DayPlanWithSlots extends DayPlan {
  meal_slots: MealSlotWithDishes[];
}

/**
 * Week-view UI shape (Story 3.6) — derived per-day from `DayPlanWithSlots`.
 * Lives here so repository/store/component agree on a single contract.
 */
export interface WeekDayTotal {
  date: string; // ISO yyyy-mm-dd
  label: string; // "T2", "T3", … "CN"
  dotCount: number; // total planned dishes (logged + planned)
  loggedCal: number; // sum effective_calories where is_completed=1
  plannedCal: number; // sum effective_calories where is_completed=0
  targetCal: number; // copy of day_plan.target_calories (or default if no plan)
  isToday: boolean;
  isPast: boolean;
  hasPlan: boolean; // ≥1 dish (planned or logged) exists for this day
}

export type WeekDayStatus =
  | 'no-plan'
  | 'future-planned'
  | 'today-recording'
  | 'past-on-target' // 80–110%
  | 'past-under' // 50–79%
  | 'past-over' // 110–150%
  | 'past-extreme'; // <50% or >150%
