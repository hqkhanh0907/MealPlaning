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
   * Sum tổng calo per slot — chỉ tính `is_completed=1` để khớp Hybrid display semantic
   * (planned dish chưa "tiêu thụ" nên không cộng vào "đã ăn"). F-03 §2.3.
   */
  readonly totalLoggedCalories = computed<number>(() =>
    this.slot()
      .planned_dishes.filter((d) => d.is_completed === 1)
      .reduce((acc, d) => acc + d.effective_calories, 0),
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
