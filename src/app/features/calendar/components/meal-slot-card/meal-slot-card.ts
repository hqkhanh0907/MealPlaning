import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { MealSlotWithDishes, MealType } from '../../../../core/models/meal-plan.types';
import { StatusPill } from '../../../../shared/components/status-pill/status-pill';

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

  onAddTap(): void {
    this.openLog.emit(this.mealType());
  }

  onActionTap(plannedDishId: string, isCompleted: 0 | 1): void {
    if (isCompleted === 1) {
      this.unmarkEaten.emit(plannedDishId);
    } else {
      this.markEaten.emit(plannedDishId);
    }
  }
}
