import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-nutrition-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nutrition-badge">
      <span class="nutrition-primary">{{ approximate ? '≈ ' : '' }}{{ formatNumber(calories) }} kcal</span>
      <span class="nutrition-secondary">{{ formatNumber(protein) }}g protein</span>
    </div>
  `,
  styles: `
    .nutrition-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      flex-wrap: wrap;
      padding: 6px 10px;
      border-radius: var(--radius-full);
      background: var(--bg-muted);
      color: var(--text-tertiary);
      font-size: 12px;
      font-weight: 500;
      line-height: 1.4;
      font-variant-numeric: tabular-nums;
    }

    .nutrition-primary {
      color: var(--text-primary);
      font-weight: 700;
    }

    .nutrition-secondary {
      color: var(--text-tertiary);
    }
  `,
})
export class NutritionBadgeComponent {
  @Input({ required: true }) calories = 0;
  @Input({ required: true }) protein = 0;
  @Input() approximate = false;

  formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }
}
