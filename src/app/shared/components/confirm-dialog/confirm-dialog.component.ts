import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen) {
      <div class="dialog-backdrop" role="presentation">
        <section
          class="dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-message"
        >
          <h2 id="dialog-title" class="dialog-title">{{ title }}</h2>
          <p id="dialog-message" class="dialog-message">{{ message }}</p>
          <div class="dialog-actions">
            <button class="dialog-btn-cancel" type="button" (click)="cancelled.emit()">{{ cancelLabel }}</button>
            <button
              [class.dialog-btn-primary]="confirmVariant === 'primary'"
              [class.dialog-btn-danger]="confirmVariant === 'danger'"
              type="button"
              [attr.aria-label]="confirmAriaLabel ?? null"
              [disabled]="confirmDisabled"
              (click)="confirmed.emit()"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </section>
      </div>
    }
  `,
  styles: `
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(18, 18, 24, 0.52);
      z-index: var(--z-dialog);
    }

    .dialog {
      width: min(100%, 300px);
      padding: 24px;
      border-radius: var(--radius-lg);
      background: var(--bg-elevated);
      box-shadow: var(--shadow-xl);
      border: 1px solid rgba(95, 101, 117, 0.16);
    }

    .dialog-title {
      margin: 0 0 8px;
      color: var(--text-primary);
      font-size: 18px;
      font-weight: 500;
      line-height: 1.3;
    }

    .dialog-message {
      margin: 0;
      color: var(--text-tertiary);
      font-size: 14px;
      line-height: 1.6;
    }

    .dialog-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 20px;
    }

    .dialog-btn-cancel,
    .dialog-btn-danger,
    .dialog-btn-primary {
      min-height: 44px;
      padding: 10px 20px;
      border-radius: var(--radius-xs);
      font-size: 14px;
      font-weight: 500;
    }

    .dialog-btn-cancel {
      border: 1px solid rgba(95, 101, 117, 0.24);
      background: transparent;
      color: var(--text-secondary);
    }

    .dialog-btn-danger,
    .dialog-btn-primary {
      border: none;
      color: #ffffff;
    }

    .dialog-btn-danger {
      background: var(--ion-color-danger, #d32f2f);
    }

    .dialog-btn-primary {
      background: var(--ion-color-primary, #2196f3);
    }

    .dialog-btn-danger:disabled,
    .dialog-btn-primary:disabled {
      opacity: 0.5;
    }
  `,
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input({ required: true }) title = '';
  @Input({ required: true }) message = '';
  @Input() cancelLabel = 'Giữ lại';
  @Input() confirmLabel = 'Xóa';
  @Input() confirmAriaLabel: string | null = null;
  @Input() confirmVariant: 'danger' | 'primary' = 'danger';
  @Input() confirmDisabled = false;
  @Output() cancelled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
}
