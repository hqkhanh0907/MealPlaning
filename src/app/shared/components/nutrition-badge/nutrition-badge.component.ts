import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-nutrition-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nutrition-badge.component.html',
  styleUrl: './nutrition-badge.component.scss',
})
export class NutritionBadgeComponent {
  @Input({ required: true }) calories = 0;
  @Input({ required: true }) protein = 0;
  @Input() approximate = false;

  formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }
}
