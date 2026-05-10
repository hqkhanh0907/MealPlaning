import { ChangeDetectionStrategy, Component, output } from '@angular/core';

/**
 * Empty day state per F-03 §5.
 *
 * Story 3.5 scope: render 3 CTAs but only [Lên kế hoạch] is wired.
 * [Sao chép từ hôm qua] and [🤖 AI] are visible-but-defer-toast — owner
 * is Story 3.7 (copy) and Phase 5 (AI).
 */
@Component({
  selector: 'app-empty-day-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './empty-day-state.html',
  styleUrl: './empty-day-state.scss',
})
export class EmptyDayState {
  readonly planClicked = output<void>();
  readonly copyDeferred = output<void>();
  readonly aiDeferred = output<void>();
}
