import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { bandColor, type BandClass, type KeyMetric } from '../../../core/utils/band-color';
import { CalorieRing } from '../calorie-ring/calorie-ring';

export type MacroRowMode = 'compact' | 'expanded';

export interface MacroValue {
  value: number;
  target: number;
}

interface MacroDescriptor {
  key: 'protein' | 'carbs' | 'fat' | 'fiber';
  label: string; // VI label
  data: MacroValue;
}

const LABEL_VI: Record<MacroDescriptor['key'], string> = {
  protein: 'Đạm',
  carbs: 'Tinh bột',
  fat: 'Chất béo',
  fiber: 'Fiber',
};

@Component({
  selector: 'app-macro-row',
  standalone: true,
  imports: [CalorieRing],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './macro-row.html',
  styleUrl: './macro-row.scss',
})
export class MacroRow {
  readonly mode = input<MacroRowMode>('compact');
  readonly protein = input.required<MacroValue>();
  readonly carbs = input.required<MacroValue>();
  readonly fat = input.required<MacroValue>();
  readonly fiber = input<MacroValue | null>(null);
  readonly highlightedMetric = input<KeyMetric | null>(null);

  /** Order Protein → Carbs → Fat fixed (Sally O-F04-3 / F-04 §3.2). Fiber appended only when provided. */
  readonly macros = computed<MacroDescriptor[]>(() => {
    const list: MacroDescriptor[] = [
      { key: 'protein', label: LABEL_VI.protein, data: this.protein() },
      { key: 'carbs', label: LABEL_VI.carbs, data: this.carbs() },
      { key: 'fat', label: LABEL_VI.fat, data: this.fat() },
    ];
    const f = this.fiber();
    if (f !== null) {
      list.push({ key: 'fiber', label: LABEL_VI.fiber, data: f });
    }
    return list;
  });

  pct(m: MacroValue): number {
    if (!Number.isFinite(m.target) || m.target <= 0) return 0;
    const raw = (m.value / m.target) * 100;
    return Math.min(Math.max(raw, 0), 200);
  }

  /** Visual fill % capped at 100 (over-target shows full bar + high color band). */
  visualPct(m: MacroValue): number {
    return Math.min(this.pct(m), 100);
  }

  /** bandColor only handles `KeyMetric`; fiber is band-classified as `calories` neutral fallback. */
  band(macro: MacroDescriptor): BandClass {
    const variant: KeyMetric = macro.key === 'fiber' ? 'calories' : macro.key;
    return bandColor(this.pct(macro.data), variant);
  }

  isHighlighted(macro: MacroDescriptor): boolean {
    const h = this.highlightedMetric();
    return h !== null && h === macro.key;
  }

  ariaLabel(macro: MacroDescriptor): string {
    return `${macro.label} ${macro.data.value} trên ${macro.data.target}, ${Math.round(this.pct(macro.data))} phần trăm`;
  }
}
