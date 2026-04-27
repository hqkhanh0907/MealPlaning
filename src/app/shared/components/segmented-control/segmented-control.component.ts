import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  ariaLabel?: string;
}

/**
 * Reusable N-way segment chooser. Visuals delegated to the canonical
 * .segment-control / .segment-button / .selected classes living in
 * src/theme/segment-control.scss (design system §8.8). DO NOT add local
 * styles — keep this wrapper pure markup so onboarding, modal and
 * management filter all render identically.
 */
@Component({
  selector: 'app-segmented-control',
  standalone: true,
  imports: [],
  template: `
    <div class="segment-control" role="tablist" [attr.aria-label]="ariaLabel">
      @for (option of options; track option.value) {
        <button
          type="button"
          class="segment-button"
          [class.selected]="option.value === value"
          role="tab"
          [attr.aria-selected]="option.value === value"
          [attr.aria-label]="option.ariaLabel ?? option.label"
          (click)="select(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
})
export class SegmentedControlComponent<T extends string> {
  @Input({ required: true }) options: SegmentedControlOption<T>[] = [];
  @Input({ required: true }) value!: T;
  @Input() ariaLabel = 'Bộ chọn phân đoạn';
  @Output() valueChange = new EventEmitter<T>();

  select(value: T): void {
    if (value === this.value) {
      return;
    }

    this.valueChange.emit(value);
  }
}
