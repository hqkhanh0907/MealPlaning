import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  ariaLabel?: string;
}

@Component({
  selector: 'app-segmented-control',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="segmented-control" role="tablist" [attr.aria-label]="ariaLabel">
      @for (option of options; track option.value) {
        <button
          type="button"
          class="segmented-control__option"
          [class.segmented-control__option--active]="option.value === value"
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
  styles: [
    `
      .segmented-control {
        display: grid;
        grid-template-columns: repeat(var(--segment-count, 2), minmax(0, 1fr));
        gap: 0;
        padding: 4px;
        border-radius: 12px;
        background: var(--bg-muted);
      }

      .segmented-control__option {
        min-height: 36px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--text-tertiary);
        font-size: 14px;
        font-weight: 500;
        line-height: 1.2;
        transition:
          background-color 160ms ease,
          color 160ms ease,
          box-shadow 160ms ease;
      }

      .segmented-control__option--active {
        background: var(--bg-card);
        color: var(--text-primary);
        font-weight: 600;
        box-shadow: var(--shadow-sm);
      }

      .segmented-control__option:focus-visible {
        outline: 2px solid rgba(var(--ion-color-primary-rgb), 0.35);
        outline-offset: 2px;
      }
    `,
  ],
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
