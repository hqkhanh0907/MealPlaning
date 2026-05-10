import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-day-summary-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './day-summary-card.html',
  styleUrl: './day-summary-card.scss',
})
export class DaySummaryCard {
  /** ISO yyyy-mm-dd. Stub renders nothing computed yet — Epic 4 owns content. */
  readonly date = input.required<string>();
}
