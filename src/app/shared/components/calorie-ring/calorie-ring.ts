import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { bandColor, type BandClass, type KeyMetric } from '../../../core/utils/band-color';

const VARIANT_LABEL_VI: Record<KeyMetric, string> = {
  calories: 'Calo',
  protein: 'Đạm',
  carbs: 'Tinh bột',
  fat: 'Chất béo',
};

@Component({
  selector: 'app-calorie-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calorie-ring.html',
  styleUrl: './calorie-ring.scss',
})
export class CalorieRing {
  readonly value = input.required<number>();
  readonly target = input.required<number>();
  readonly size = input<32 | 48 | 64>(48);
  readonly strokeWidth = input<number>(8);
  readonly showCenterLabel = input<boolean>(true);
  readonly variant = input<KeyMetric>('calories');

  /** Percentage clamped [0, 200] per F-03 §2.D2 ring contract. */
  readonly pct = computed<number>(() => {
    const t = this.target();
    if (!Number.isFinite(t) || t <= 0) return 0;
    const raw = (this.value() / t) * 100;
    return Math.min(Math.max(raw, 0), 200);
  });

  readonly colorClass = computed<BandClass>(() => bandColor(this.pct(), this.variant()));

  // SVG circle geometry — fixed viewBox=100, derive radius from strokeWidth.
  readonly radius = computed<number>(() => 50 - this.strokeWidth() / 2);
  readonly circumference = computed<number>(() => 2 * Math.PI * this.radius());
  /** Stroke-dashoffset that matches `pct` (clamp 0–100 visual fill). */
  readonly dashOffset = computed<number>(() => {
    const visual = Math.min(this.pct(), 100);
    return this.circumference() * (1 - visual / 100);
  });

  readonly ariaLabel = computed<string>(() => {
    const label = VARIANT_LABEL_VI[this.variant()];
    return `${label} ${this.value()} trên ${this.target()}, ${Math.round(this.pct())} phần trăm`;
  });
}
