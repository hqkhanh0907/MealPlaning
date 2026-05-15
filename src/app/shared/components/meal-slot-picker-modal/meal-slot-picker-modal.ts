import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { MealType } from '../../../core/models/meal-plan.types';

interface SlotChoice {
  type: MealType;
  label: string;
}

const CHOICES: readonly SlotChoice[] = [
  { type: 'breakfast', label: 'Sáng' },
  { type: 'lunch', label: 'Trưa' },
  { type: 'dinner', label: 'Tối' },
  { type: 'snack', label: 'Phụ' },
];

@Component({
  selector: 'app-meal-slot-picker-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meal-slot-picker-modal.html',
  styleUrl: './meal-slot-picker-modal.scss',
})
export class MealSlotPickerModal {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('Chọn bữa');
  readonly current = input<MealType | null>(null);

  readonly slotSelected = output<MealType>();
  readonly dismissed = output<void>();

  readonly choices = CHOICES;

  pick(type: MealType): void {
    this.slotSelected.emit(type);
  }

  dismiss(): void {
    this.dismissed.emit();
  }
}
