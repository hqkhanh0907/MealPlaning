import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { MealSlotWithDishes, MealType } from '../../../../core/models/meal-plan.types';
import { StatusPill } from '../../../../shared/components/status-pill/status-pill';

const LONG_PRESS_MS = 500;

const MEAL_LABEL_VI: Record<MealType, { emoji: string; label: string }> = {
  breakfast: { emoji: '🍳', label: 'Bữa sáng' },
  lunch: { emoji: '🍱', label: 'Bữa trưa' },
  dinner: { emoji: '🍲', label: 'Bữa chiều' },
  snack: { emoji: '🍪', label: 'Bữa phụ' },
};

@Component({
  selector: 'app-meal-slot-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusPill],
  templateUrl: './meal-slot-card.html',
  styleUrl: './meal-slot-card.scss',
})
export class MealSlotCard {
  readonly slot = input.required<MealSlotWithDishes>();
  readonly mealType = input.required<MealType>();

  readonly markEaten = output<string>();
  readonly unmarkEaten = output<string>();
  readonly openLog = output<MealType>();
  /** Emits planned_dish.id when user long-presses a row (Story 3.7 AC-3). */
  readonly dishLongPress = output<string>();

  readonly emoji = computed<string>(() => MEAL_LABEL_VI[this.mealType()].emoji);
  readonly label = computed<string>(() => MEAL_LABEL_VI[this.mealType()].label);

  /**
   * Planning view must show expected kcal for planned rows and immutable
   * snapshot kcal for logged rows. Both are exposed as `effective_calories`.
   */
  readonly totalCalories = computed<number>(() =>
    this.roundKcal(
      this.slot().planned_dishes.reduce((acc, dish) => acc + dish.effective_calories, 0),
    ),
  );

  /** Long-press timer state per row; cleared on pointer-up/leave/move. */
  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private pressTriggered = false;

  onAddTap(): void {
    this.openLog.emit(this.mealType());
  }

  onActionTap(plannedDishId: string, isCompleted: 0 | 1): void {
    // Suppress click that follows a fired long-press.
    if (this.pressTriggered) {
      this.pressTriggered = false;
      return;
    }
    if (isCompleted === 1) {
      this.unmarkEaten.emit(plannedDishId);
    } else {
      this.markEaten.emit(plannedDishId);
    }
  }

  roundKcal(value: number): number {
    return Math.round(Number.isFinite(value) ? value : 0);
  }

  onPressStart(plannedDishId: string): void {
    this.cancelPress();
    this.pressTriggered = false;
    this.pressTimer = setTimeout(() => {
      this.pressTriggered = true;
      this.dishLongPress.emit(plannedDishId);
    }, LONG_PRESS_MS);
  }

  onPressCancel(): void {
    this.cancelPress();
  }

  private cancelPress(): void {
    if (this.pressTimer !== null) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }
}
