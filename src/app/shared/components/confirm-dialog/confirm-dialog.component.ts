import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
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
