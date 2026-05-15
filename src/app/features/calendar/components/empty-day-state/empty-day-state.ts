import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarClearOutline,
  copyOutline,
  sparklesOutline,
  addCircleOutline,
} from 'ionicons/icons';

/**
 * Empty day state per F-03 §5.
 *
 * Story 3.5 scope: render 3 CTAs but only [Lên kế hoạch] is wired.
 * [Sao chép từ hôm qua] and [AI] are visible-but-defer-toast — owner
 * is Story 3.7 (copy) and Phase 5 (AI).
 */
@Component({
  selector: 'app-empty-day-state',
  standalone: true,
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-day-state.html',
  styleUrl: './empty-day-state.scss',
})
export class EmptyDayState {
  constructor() {
    addIcons({ calendarClearOutline, copyOutline, sparklesOutline, addCircleOutline });
  }

  readonly planClicked = output<void>();
  readonly copyDeferred = output<void>();
  readonly aiDeferred = output<void>();
}
