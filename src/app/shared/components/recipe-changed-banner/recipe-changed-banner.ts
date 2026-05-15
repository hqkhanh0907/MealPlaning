import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline, warningOutline } from 'ionicons/icons';

@Component({
  selector: 'app-recipe-changed-banner',
  standalone: true,
  imports: [IonIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recipe-changed-banner.html',
  styleUrl: './recipe-changed-banner.scss',
})
export class RecipeChangedBanner {
  constructor() {
    addIcons({ warningOutline, informationCircleOutline });
  }

  readonly snapshotCalories = input.required<number>();
  readonly currentCalories = input.required<number>();
  /** Pre-computed by caller; banner trusts the input and does not re-compute. */
  readonly diffPct = input.required<number>();

  readonly faqLinkClicked = output<void>();

  readonly delta = computed<number>(() => this.currentCalories() - this.snapshotCalories());

  readonly deltaSign = computed<'+' | '−' | ''>(() => {
    const d = this.delta();
    if (d > 0) return '+';
    if (d < 0) return '−';
    return '';
  });

  readonly absDelta = computed<number>(() => Math.abs(this.delta()));
  readonly absDiffPct = computed<number>(() => Math.abs(this.diffPct()));

  readonly ariaLabel = computed<string>(
    () =>
      `Công thức đã thay đổi. Snapshot ${this.snapshotCalories()} calo, hiện tại ${this.currentCalories()} calo, chênh lệch ${this.deltaSign()}${this.absDelta()} calo, ${this.absDiffPct().toFixed(1)} phần trăm.`,
  );

  onFaqClick(event: Event): void {
    event.preventDefault();
    this.faqLinkClicked.emit();
  }
}
