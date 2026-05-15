import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  ellipseOutline,
  radioButtonOnOutline,
  removeCircleOutline,
} from 'ionicons/icons';
import type { WeekDayTotal } from '../../../../core/models/meal-plan.types';
import { weekDayStatus, weekDayStatusIcon } from '../../../../core/utils/week-day-status';

@Component({
  selector: 'app-day-row',
  standalone: true,
  imports: [DecimalPipe, IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './day-row.html',
  styleUrl: './day-row.scss',
})
export class DayRow {
  constructor() {
    addIcons({
      ellipseOutline,
      radioButtonOnOutline,
      checkmarkCircleOutline,
      removeCircleOutline,
      alertCircleOutline,
      closeCircleOutline,
    });
  }
  readonly day = input.required<WeekDayTotal>();
  readonly tap = output<string>();

  readonly status = computed(() => weekDayStatus(this.day()));
  readonly statusIcon = computed(() => weekDayStatusIcon(this.status()));
  readonly dayOfMonth = computed(() => {
    const iso = this.day().date;
    const parts = iso.split('-');
    return parts.length === 3 ? String(parseInt(parts[2], 10)) : '';
  });
  readonly displayCal = computed(() => {
    const d = this.day();
    return d.isPast ? d.loggedCal : d.plannedCal;
  });
  readonly capCal = computed(() => this.day().targetCal);
  readonly hasDots = computed(() => this.day().dotCount > 0);
  readonly dots = computed(() => Array.from({ length: Math.min(this.day().dotCount, 6) }));

  onTap(): void {
    this.tap.emit(this.day().date);
  }
}
