import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarClearOutline,
  copyOutline,
  sparklesOutline,
  addCircleOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-empty-day-state',
  standalone: true,
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-day-state.html',
  styleUrl: './empty-day-state.scss',
})
export class EmptyDayState {
  readonly online = input(true);
  readonly aiIssue = input<string | null>(null);
  readonly aiPlanning = input(false);
  readonly copying = input(false);

  constructor() {
    addIcons({ calendarClearOutline, copyOutline, sparklesOutline, addCircleOutline });
  }

  readonly planClicked = output<void>();
  readonly copyDeferred = output<void>();
  readonly aiDeferred = output<void>();
}
