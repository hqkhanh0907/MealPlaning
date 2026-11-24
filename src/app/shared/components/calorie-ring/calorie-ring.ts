import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { percentOfNutritionTarget } from '../../../core/models/nutrition';
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

  readonly pct = computed(() => percentOfNutritionTarget(this.value(), this.target()) ?? 0);

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
