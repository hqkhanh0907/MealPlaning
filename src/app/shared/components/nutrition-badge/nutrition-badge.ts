import { formatNutritionNumber } from '../../nutrition-number';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-nutrition-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nutrition-badge.html',
  styleUrl: './nutrition-badge.scss',
})
export class NutritionBadge {
  @Input({ required: true }) calories = 0;
  @Input({ required: true }) protein = 0;
  @Input() approximate = false;

  readonly formatNumber = formatNutritionNumber;
}
