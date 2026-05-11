import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { NutritionStore } from '../../../../core/stores/nutrition.store';
import type { NutritionTotals } from '../../../../core/services/nutrition/nutrition-query';
import type { KeyMetric } from '../../../../core/utils/key-metric-router';
import { CalorieRing } from '../../../../shared/components/calorie-ring/calorie-ring';
import { MacroRow, type MacroValue } from '../../../../shared/components/macro-row/macro-row';

type SummaryMetric = KeyMetric | 'fiber';

const LABELS: Record<SummaryMetric, string> = {
  calories: 'Calo',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
  fiber: 'Fiber',
};

function rounded(value: number): number {
  return Math.round(Number.isFinite(value) ? value : 0);
}

function metricValue(totals: NutritionTotals, metric: SummaryMetric): number {
  return totals[metric];
}

@Component({
  selector: 'app-day-summary-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalorieRing, MacroRow],
  templateUrl: './day-summary-card.html',
  styleUrl: './day-summary-card.scss',
})
export class DaySummaryCard {
  private readonly nutrition = inject(NutritionStore);

  readonly date = input.required<string>();

  readonly expanded = signal(false);
  readonly loading = this.nutrition.loading;
  readonly totals = this.nutrition.today;
  readonly targets = this.nutrition.targets;
  readonly primaryMetric = this.nutrition.keyMetric;

  readonly calories = computed<MacroValue>(() => this.macroValue('calories'));
  readonly protein = computed<MacroValue>(() => this.macroValue('protein'));
  readonly carbs = computed<MacroValue>(() => this.macroValue('carbs'));
  readonly fat = computed<MacroValue>(() => this.macroValue('fat'));
  readonly fiber = computed<MacroValue>(() => this.macroValue('fiber'));

  readonly primaryLabel = computed<string>(() => LABELS[this.primaryMetric()]);
  readonly primaryUnit = computed<string>(() =>
    this.primaryMetric() === 'calories' ? 'kcal' : 'g',
  );
  readonly primaryValue = computed<number>(() =>
    rounded(metricValue(this.totals(), this.primaryMetric())),
  );
  readonly primaryTarget = computed<number>(() =>
    rounded(metricValue(this.targets(), this.primaryMetric())),
  );
  readonly primaryPct = computed<number>(() =>
    this.percent(this.primaryValue(), this.primaryTarget()),
  );
  readonly ariaSummary = computed<string>(
    () =>
      `${this.primaryLabel()} ${this.primaryValue()} trên ${this.primaryTarget()} ${this.primaryUnit()}, ${this.primaryPct()} phần trăm mục tiêu`,
  );

  toggleDetails(): void {
    this.expanded.update((value) => !value);
  }

  percent(value: number, target: number): number {
    if (!Number.isFinite(target) || target <= 0) {
      return 0;
    }
    return Math.round(Math.min(Math.max((value / target) * 100, 0), 200));
  }

  private macroValue(metric: SummaryMetric): MacroValue {
    return {
      value: rounded(metricValue(this.totals(), metric)),
      target: rounded(metricValue(this.targets(), metric)),
    };
  }
}
