import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { bandColor, type BandClass, type KeyMetric } from '../../../core/utils/band-color';
import type { TrendPoint } from '../../../core/services/nutrition/nutrition-query';

const CHART_VIEWBOX_W = 700; // arbitrary high-res width (SVG scales)
const BAR_GAP_RATIO = 0.25; // 25% gap between bars
const METRIC_LABEL_VI: Record<KeyMetric, string> = {
  calories: 'Calo',
  protein: 'Đạm',
  carbs: 'Tinh bột',
  fat: 'Chất béo',
};

interface BarRender {
  index: number;
  date: string;
  value: number;
  x: number;
  width: number;
  visualHeight: number;
  band: BandClass;
  axisLabel: string;
}

@Component({
  selector: 'app-trend-bar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './trend-bar-chart.html',
  styleUrl: './trend-bar-chart.scss',
})
export class TrendBarChart {
  readonly bars = input.required<TrendPoint[]>();
  readonly targetLine = input<number | null>(null);
  readonly metric = input.required<KeyMetric>();
  readonly height = input<number>(180);
  readonly compareWith = input<TrendPoint[] | null>(null);

  readonly viewBoxWidth = CHART_VIEWBOX_W;
  readonly viewBox = computed<string>(() => `0 0 ${CHART_VIEWBOX_W} ${this.height()}`);

  /** Max scale for Y-axis: max of bar values + targetLine (if any) + compareWith (if any), with 10% headroom. */
  readonly maxScale = computed<number>(() => {
    const main = this.bars().map((b) => b.value);
    const cmp = this.compareWith()?.map((b) => b.value) ?? [];
    const target = this.targetLine();
    const all = [...main, ...cmp];
    if (target !== null) all.push(target);
    const peak = all.length === 0 ? 0 : Math.max(...all);
    if (peak <= 0) return 1; // avoid divide-by-zero
    return peak * 1.1;
  });

  readonly mainBars = computed<BarRender[]>(() => this.layout(this.bars()));
  readonly compareBars = computed<BarRender[]>(() => {
    const cmp = this.compareWith();
    return cmp === null ? [] : this.layout(cmp);
  });

  readonly targetY = computed<number | null>(() => {
    const t = this.targetLine();
    if (t === null) return null;
    return this.height() - (t / this.maxScale()) * this.height();
  });

  readonly ariaLabel = computed<string>(() => {
    const n = this.bars().length;
    return `Biểu đồ xu hướng ${METRIC_LABEL_VI[this.metric()]} ${n} điểm dữ liệu`;
  });

  private layout(points: TrendPoint[]): BarRender[] {
    const n = points.length;
    if (n === 0) return [];
    const slot = CHART_VIEWBOX_W / n;
    const barW = slot * (1 - BAR_GAP_RATIO);
    const inset = (slot - barW) / 2;
    const max = this.maxScale();
    const h = this.height();
    return points.map<BarRender>((p, i) => {
      const ratio = max === 0 ? 0 : p.value / max;
      const visualHeight = p.value > 0 ? Math.max(0, ratio * h) : 0;
      const target = this.targetLine();
      const pct = target !== null && target > 0 ? (p.value / target) * 100 : 0;
      return {
        index: i,
        date: p.date,
        value: p.value,
        x: i * slot + inset,
        width: barW,
        visualHeight,
        band: bandColor(pct, this.metric()),
        axisLabel: this.axisLabel(p.date, n, i),
      };
    });
  }

  /** Week (n=7) → T2..CN; Month → 1,5,10,15,20,25,30 sparse labels; otherwise empty for "─" rendering. */
  private axisLabel(date: string, n: number, index: number): string {
    if (n === 7) {
      // Force fixed VI weekday labels regardless of actual date — caller responsibility for ordering.
      const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      return labels[index] ?? '';
    }
    if (n >= 28 && n <= 31) {
      const day = parseInt(date.slice(8, 10), 10);
      if ([1, 5, 10, 15, 20, 25, 30].includes(day)) return String(day);
      return '';
    }
    return date.slice(8, 10); // fallback dd
  }

  emptyLabel(bar: BarRender): string {
    return bar.value <= 0 ? '─' : '';
  }
}
