import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { IonDatetime } from '@ionic/angular/standalone';
import { addCalendarDays, localIsoDate } from '../../../core/utils/local-date';

import { MEAL_CALENDAR_WINDOW_DAYS } from '../../../core/models/meal-plan.types';

function clampToBounds(iso: string, minIso: string, maxIso: string): string {
  if (iso < minIso) return minIso;
  if (iso > maxIso) return maxIso;
  return iso;
}

@Component({
  selector: 'app-date-picker-modal',
  standalone: true,
  imports: [IonDatetime],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-picker-modal.html',
  styleUrl: './date-picker-modal.scss',
})
export class DatePickerModal {
  readonly locale = 'vi-VN';
  readonly firstDayOfWeek = 1;

  readonly isOpen = input<boolean>(false);
  readonly initialDate = input<string>(localIsoDate());
  readonly clampDays = input<number>(MEAL_CALENDAR_WINDOW_DAYS);

  readonly dateSelected = output<string>();
  readonly dismissed = output<void>();

  /** Internal selection buffer; commit on "Chọn". */
  private readonly selectionInternal = signal<string>(localIsoDate());

  readonly minIso = computed(() => localIsoDate(addCalendarDays(new Date(), -this.clampDays())));
  readonly maxIso = computed(() => localIsoDate(addCalendarDays(new Date(), this.clampDays())));

  readonly selection = computed<string>(() => this.selectionInternal());

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.selectionInternal.set(
          clampToBounds(this.initialDate() || localIsoDate(), this.minIso(), this.maxIso()),
        );
      }
    });
  }

  /** ion-datetime emits ISO 8601 datetime; we keep date-only portion. */
  onIonChange(event: Event): void {
    const value = (event as CustomEvent<{ value: string | string[] | null }>).detail?.value;
    if (typeof value === 'string' && value.length >= 10) {
      this.selectionInternal.set(value.slice(0, 10));
    }
  }

  jumpToday(): void {
    this.selectionInternal.set(clampToBounds(localIsoDate(), this.minIso(), this.maxIso()));
  }

  confirm(): void {
    this.dateSelected.emit(this.selection());
  }

  cancel(): void {
    this.dismissed.emit();
  }
}
